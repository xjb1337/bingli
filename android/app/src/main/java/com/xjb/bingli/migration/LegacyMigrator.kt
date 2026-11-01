package com.xjb.bingli.migration

import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.time.Clock
import java.time.Instant

/** Pure JVM migration journal. It deliberately knows nothing about Android. */
class LegacyMigrator(
    private val baseDir: File,
    private val clock: Clock = Clock.systemUTC(),
    private val appVersion: String = "unknown",
) {
    enum class State { NONE, STAGED, IMPORTED, CONFIRMED, FAILED }

    data class Manifest(
        val bytes: Long,
        val sha256: String,
        val stagedAt: String,
        val appVersion: String,
        val keyCount: Int,
        val recordCount: Int,
        val recordIds: List<String>,
        val corruptKeys: List<String>,
    ) {
        fun toJson(): JSONObject = JSONObject().apply {
            put("bytes", bytes)
            put("sha256", sha256)
            put("stagedAt", stagedAt)
            put("appVersion", appVersion)
            put("keyCount", keyCount)
            put("recordCount", recordCount)
            put("recordIds", JSONArray(recordIds))
            put("corruptKeys", JSONArray(corruptKeys))
        }

        companion object {
            fun fromJson(json: JSONObject): Manifest = Manifest(
                json.optLong("bytes", -1), json.optString("sha256"),
                json.optString("stagedAt"), json.optString("appVersion"),
                json.optInt("keyCount", 0), json.optInt("recordCount", 0),
                json.optJSONArray("recordIds").toStrings(),
                json.optJSONArray("corruptKeys").toStrings(),
            )
        }
    }

    data class Snapshot(val state: State, val reason: String? = null, val successfulLaunches: Int = 0) {
        fun toJson() = JSONObject().apply {
            put("state", state.name)
            if (reason == null) put("reason", JSONObject.NULL) else put("reason", reason)
            put("successfulLaunches", successfulLaunches)
        }
    }

    data class StageResult(val manifest: Manifest, val state: State)
    data class VerificationResult(val ok: Boolean, val reason: String? = null)

    private val stateFile get() = File(baseDir, "state.json")
    private val previousStateFile get() = File(baseDir, "state.previous.json")
    private val stagingFile get() = File(baseDir, "legacy-staging.json")
    private val manifestFile get() = File(baseDir, "legacy-manifest.json")

    init { baseDir.mkdirs() }

    val state: State get() = readSnapshot().state
    val reason: String? get() = readSnapshot().reason
    val snapshot: Snapshot get() = readSnapshot()

    @Synchronized
    fun stage(rawPayloadJson: String): StageResult {
        val payload = try { JSONObject(rawPayloadJson) } catch (e: Exception) {
            fail("迁移数据不是有效 JSON：${e.message ?: "解析失败"}")
            throw IllegalArgumentException("迁移数据不是有效 JSON", e)
        }
        val keys = payload.optJSONObject("keys") ?: run {
            fail("迁移数据缺少 keys")
            throw IllegalArgumentException("迁移数据缺少 keys")
        }
        val invalid = keys.keys().asSequence().filterNot(::isAllowedKey).toList()
        if (invalid.isNotEmpty()) {
            fail("迁移数据包含未知键：${invalid.joinToString(",")}")
            throw IllegalArgumentException("迁移数据包含未知键")
        }

        val corrupt = mutableListOf<String>()
        val recordIds = linkedSetOf<String>()
        var recordCount = 0
        var keyCount = 0
        for (key in keys.keys()) {
            keyCount++
            val value = keys.opt(key)
            if (value == null || value == JSONObject.NULL) {
                continue
            }
            if (value !is String) {
                fail("迁移键 $key 不是字符串或 null")
                throw IllegalArgumentException("迁移键 $key 不是字符串或 null")
            }
            try {
                val parsed = JSONTokener(value).nextValue()
                if (key == RECORDS_KEY && parsed is JSONArray) {
                    for (i in 0 until parsed.length()) {
                        val item = parsed.optJSONObject(i) ?: continue
                        val id = item.optString("id").trim()
                        if (id.isNotEmpty()) recordIds += id
                    }
                    recordCount = parsed.length()
                }
            } catch (_: Exception) {
                corrupt += key
            }
        }
        val raw = rawPayloadJson.toByteArray(StandardCharsets.UTF_8)
        val manifest = Manifest(raw.size.toLong(), sha256(raw), Instant.now(clock).toString(), appVersion,
            keyCount, recordCount, recordIds.toList(), corrupt)
        try {
            atomicWrite(stagingFile, raw)
            atomicWrite(manifestFile, manifest.toJson().toString().toByteArray(StandardCharsets.UTF_8))
            writeState(Snapshot(State.STAGED, null, 0))
        } catch (e: Exception) {
            fail("写入迁移暂存失败：${e.message ?: e.javaClass.simpleName}")
            throw e
        }
        return StageResult(manifest, State.STAGED)
    }

    @Synchronized
    fun verify(): Boolean = verifyResult().ok

    @Synchronized
    fun verifyResult(): VerificationResult {
        fun bad(reason: String): VerificationResult { fail(reason); return VerificationResult(false, reason) }
        if (!stagingFile.isFile || !manifestFile.isFile) return bad("找不到迁移暂存")
        return try {
            val manifest = Manifest.fromJson(JSONObject(readText(manifestFile)))
            val bytes = stagingFile.readBytes()
            if (manifest.bytes != bytes.size.toLong()) return bad("暂存字节数不一致")
            if (!manifest.sha256.equals(sha256(bytes), true)) return bad("暂存 SHA-256 不一致")
            VerificationResult(true)
        } catch (e: Exception) { bad(e.message ?: "校验失败") }
    }

    fun verifyDetailed(): VerificationResult = verifyResult()

    @Synchronized
    fun markImported() {
        if (state != State.STAGED || !verify()) throw IllegalStateException("迁移暂存未通过校验")
        writeState(Snapshot(State.IMPORTED, null, 0))
    }

    /** Count only successful launches. Two successes transition IMPORTED -> CONFIRMED. */
    @Synchronized
    fun confirmLaunch(success: Boolean = true): State {
        if (state != State.IMPORTED) return state
        if (!success) { fail("启动校验失败"); return State.FAILED }
        val next = readSnapshot().successfulLaunches + 1
        writeState(Snapshot(if (next >= 2) State.CONFIRMED else State.IMPORTED, null, next))
        return state
    }

    fun confirm(success: Boolean = true): State = confirmLaunch(success)

    @Synchronized
    fun rollback(): State {
        if (previousStateFile.isFile) {
            atomicWrite(stateFile, previousStateFile.readBytes())
            previousStateFile.delete()
        } else {
            writeState(Snapshot(State.NONE))
        }
        return state
    }

    fun exportRaw(): String = if (stagingFile.isFile) readText(stagingFile) else ""

    fun exportRawBytes(): ByteArray = if (stagingFile.isFile) stagingFile.readBytes() else ByteArray(0)

    fun manifest(): Manifest? = if (manifestFile.isFile) try { Manifest.fromJson(JSONObject(readText(manifestFile))) } catch (_: Exception) { null } else null

    @Synchronized fun markFailed(reason: String) { fail(reason) }

    private fun fail(reason: String) { writeState(Snapshot(State.FAILED, reason, 0)) }

    private fun readSnapshot(): Snapshot {
        if (!stateFile.isFile) return Snapshot(State.NONE)
        return try {
            val json = JSONObject(readText(stateFile))
            Snapshot(State.valueOf(json.optString("state", "NONE")),
                json.optString("reason").takeIf { it.isNotEmpty() && it != "null" },
                json.optInt("successfulLaunches", 0))
        } catch (_: Exception) { Snapshot(State.FAILED, "状态文件损坏") }
    }

    private fun writeState(next: Snapshot) {
        baseDir.mkdirs()
        if (stateFile.isFile) atomicWrite(previousStateFile, stateFile.readBytes())
        atomicWrite(stateFile, next.toJson().toString().toByteArray(StandardCharsets.UTF_8))
    }

    private fun atomicWrite(target: File, bytes: ByteArray) {
        target.parentFile?.mkdirs()
        val tmp = File(target.parentFile, target.name + ".tmp")
        FileOutputStream(tmp).use { out -> out.write(bytes); out.flush(); out.fd.sync() }
        if (!tmp.renameTo(target)) {
            tmp.delete()
            throw IllegalStateException("无法原子替换 ${target.name}")
        }
    }

    private fun readText(file: File): String = FileInputStream(file).use { it.readBytes().toString(StandardCharsets.UTF_8) }

    private fun sha256(bytes: ByteArray): String = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }

    private fun isAllowedKey(key: String): Boolean = key == RECORDS_KEY || key == CURRENT_KEY || key == SETTINGS_KEY || key.startsWith(DRAFT_PREFIX)

    companion object {
        const val RECORDS_KEY = "dabingli.records.v1"
        const val CURRENT_KEY = "dabingli.current.v1"
        const val SETTINGS_KEY = "dabingli.settings.v1"
        const val DRAFT_PREFIX = "dabingli.draft.v1."
    }
}

private fun JSONArray?.toStrings(): List<String> {
    if (this == null) return emptyList()
    return (0 until length()).mapNotNull { optString(it, null) }
}
