package com.xjb.bingli.migration

import org.junit.Assert.*
import org.json.JSONObject
import org.junit.Test
import java.io.File
import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class LegacyMigratorTest {
    private fun migrator(): LegacyMigrator {
        val dir = Files.createTempDirectory("legacy-migrator").toFile()
        return LegacyMigrator(dir, Clock.fixed(Instant.parse("2026-11-01T00:00:00Z"), ZoneOffset.UTC), "3.0.0-test")
    }

    @Test fun stagesFixturesAndHashIsStable() {
        val m = migrator()
        var first = ""
        for (version in 1..3) {
            val fixture = JSONObject(requireNotNull(javaClass.getResource("/legacy/v${version}-backup.json")).readText()).getJSONArray("records").toString()
            val raw = JSONObject().put("keys", JSONObject().put("dabingli.records.v1", fixture).put("dabingli.current.v1", JSONObject.NULL).put("dabingli.settings.v1", JSONObject.NULL).put("dabingli.draft.v1.x", "{}" )).toString()
            val hash = m.stage(raw).manifest.sha256
            if (version == 1) first = hash
            assertEquals(hash, m.stage(raw).manifest.sha256)
            assertTrue(m.verify())
        }
        assertTrue(first.isNotEmpty())
        assertEquals(LegacyMigrator.State.STAGED, m.state)
    }

    @Test fun corruptJsonIsReportedAndRawIsUntouched() {
        val m = migrator()
        val raw = "{\"keys\":{\"dabingli.records.v1\":\"{bad\"}}"
        val staged = m.stage(raw)
        assertEquals(listOf("dabingli.records.v1"), staged.manifest.corruptKeys)
        assertEquals(raw, m.exportRaw())
        assertArrayEquals(raw.toByteArray(StandardCharsets.UTF_8), m.exportRawBytes())
    }

    @Test fun rollbackRestoresPreviousStateAndExportIsByteExact() {
        val m = migrator()
        m.stage("{\"keys\":{}}")
        m.markImported()
        assertEquals(LegacyMigrator.State.IMPORTED, m.state)
        m.rollback()
        assertEquals(LegacyMigrator.State.STAGED, m.state)
    }

    @Test fun twoSuccessfulLaunchesConfirm() {
        val m = migrator()
        m.stage("{\"keys\":{}}")
        m.markImported()
        assertEquals(LegacyMigrator.State.IMPORTED, m.confirmLaunch())
        assertEquals(LegacyMigrator.State.CONFIRMED, m.confirmLaunch())
    }

    @Test fun tmpFileDoesNotReplaceOldState() {
        val m = migrator()
        m.stage("{\"keys\":{}}")
        val state = File((m.javaClass.getDeclaredField("baseDir").apply { isAccessible = true }.get(m) as File), "state.json")
        val before = state.readBytes().toString(StandardCharsets.UTF_8)
        File(state.parentFile, "state.json.tmp").writeText("broken")
        assertEquals(before, state.readBytes().toString(StandardCharsets.UTF_8))
    }
}
