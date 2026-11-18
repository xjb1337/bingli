package com.xjb.bingli;

import static org.junit.Assert.*;

import com.xjb.bingli.migration.LegacyMigrator;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import org.json.JSONObject;
import org.junit.Test;

public class LegacyMigratorTest {
    private LegacyMigrator newMigrator() throws Exception {
        File dir = Files.createTempDirectory("legacy-migrator-java").toFile();
        return new LegacyMigrator(dir, Clock.fixed(Instant.parse("2026-11-18T00:00:00Z"), ZoneOffset.UTC), "3.2.1-test");
    }

    @Test
    public void partialCorruptionQuarantinesCorruptKeysAndStagesValidData() throws Exception {
        LegacyMigrator migrator = newMigrator();
        JSONObject keys = new JSONObject()
            .put(LegacyMigrator.RECORDS_KEY, "[{\"id\":\"rec-1\",\"basic\":{\"name\":\"张三\"}}]")
            .put(LegacyMigrator.DRAFT_PREFIX + "rec-1", "{\"id\":\"rec-1\"}")
            .put(LegacyMigrator.DRAFT_PREFIX + "broken", "{bad-json")
            .put(LegacyMigrator.CURRENT_KEY, "unquoted-garbage")
            .put(LegacyMigrator.SETTINGS_KEY, "{\"rosMode\":\"detail\"}");
        String raw = new JSONObject().put("keys", keys).toString();

        LegacyMigrator.StageResult staged = migrator.stage(raw);

        assertEquals(LegacyMigrator.State.STAGED, staged.getState());
        assertEquals(LegacyMigrator.State.STAGED, migrator.getState());
        assertEquals(Collections.singletonList("rec-1"), staged.getManifest().getRecordIds());
        assertEquals(1, staged.getManifest().getRecordCount());
        assertEquals(
            new HashSet<>(Arrays.asList(LegacyMigrator.DRAFT_PREFIX + "broken", LegacyMigrator.CURRENT_KEY)),
            new HashSet<>(staged.getManifest().getCorruptKeys())
        );
        assertEquals(raw, migrator.exportRaw());
        assertArrayEquals(raw.getBytes(StandardCharsets.UTF_8), migrator.exportRawBytes());
        assertTrue(migrator.verify());
    }

    @Test
    public void allNonNullKeysCorruptTransitionsToFailedWhilePreservingRaw() throws Exception {
        LegacyMigrator migrator = newMigrator();
        JSONObject keys = new JSONObject()
            .put(LegacyMigrator.RECORDS_KEY, "{broken")
            .put(LegacyMigrator.SETTINGS_KEY, "{} trailing");
        String raw = new JSONObject().put("keys", keys).toString();

        LegacyMigrator.StageResult staged = migrator.stage(raw);

        assertEquals(LegacyMigrator.State.FAILED, staged.getState());
        assertEquals(LegacyMigrator.State.FAILED, migrator.getState());
        assertEquals(
            new HashSet<>(Arrays.asList(LegacyMigrator.RECORDS_KEY, LegacyMigrator.SETTINGS_KEY)),
            new HashSet<>(staged.getManifest().getCorruptKeys())
        );
        assertEquals(raw, migrator.exportRaw());
        assertTrue(migrator.verify());
    }

    @Test
    public void resolveSafeAssetAllowsFrozenEntriesAndMultiChunkAssetsButBlocksTraversal() {
        assertEquals("index.html", MainActivity.resolveSafeAsset("https", "appassets.androidplatform.net", "/assets/index.html").assetPath);
        assertEquals("legacy-migrate.html", MainActivity.resolveSafeAsset("https", "appassets.androidplatform.net", "/assets/legacy-migrate.html").assetPath);
        assertEquals("migrate-recovery.html", MainActivity.resolveSafeAsset("https", "appassets.androidplatform.net", "/assets/migrate-recovery.html").assetPath);

        MainActivity.AssetMatch js = MainActivity.resolveSafeAsset("https", "appassets.androidplatform.net", "/assets/assets/index-Abc123.js");
        assertNotNull(js);
        assertEquals("assets/index-Abc123.js", js.assetPath);
        assertEquals("application/javascript", js.mimeType);
        assertEquals("UTF-8", js.encoding);

        MainActivity.AssetMatch css = MainActivity.resolveSafeAsset("https", "appassets.androidplatform.net", "/assets/assets/style-123.css");
        assertEquals("text/css", css.mimeType);
        assertEquals("image/svg+xml", MainActivity.resolveSafeAsset("https", "appassets.androidplatform.net", "/assets/assets/logo.svg").mimeType);
        assertNull(MainActivity.resolveSafeAsset("https", "appassets.androidplatform.net", "/assets/assets/icon.png").encoding);
        assertEquals("font/woff2", MainActivity.resolveSafeAsset("https", "appassets.androidplatform.net", "/assets/assets/font.woff2").mimeType);
        assertEquals("application/json", MainActivity.resolveSafeAsset("https", "appassets.androidplatform.net", "/assets/assets/manifest.json").mimeType);
        assertEquals("application/manifest+json", MainActivity.resolveSafeAsset("https", "appassets.androidplatform.net", "/assets/assets/app.webmanifest").mimeType);

        assertNull(MainActivity.resolveSafeAsset("https", "evil.example", "/assets/index.html"));
        assertNull(MainActivity.resolveSafeAsset("http", "appassets.androidplatform.net", "/assets/index.html"));
        assertNull(MainActivity.resolveSafeAsset("https", "appassets.androidplatform.net", "/assets/assets/../index.html"));
        assertNull(MainActivity.resolveSafeAsset("https", "appassets.androidplatform.net", "/assets/assets/%2e%2e/index.html"));
        assertNull(MainActivity.resolveSafeAsset("https", "appassets.androidplatform.net", "/assets/assets/sub\\file.js"));
        assertNull(MainActivity.resolveSafeAsset("https", "appassets.androidplatform.net", "/assets/sw.js"));
        assertNull(MainActivity.resolveSafeAsset("https", "appassets.androidplatform.net", "/assets/assets/bad.html"));
    }

    @Test
    public void escapeJsSeparatorsEscapesLineAndParagraphSeparators() {
        String raw = "\"id-1\",{\"text\":\"a\u2028b\u2029c\"}";
        String escaped = MainActivity.escapeJsSeparators(raw);
        assertFalse(escaped.contains("\u2028"));
        assertFalse(escaped.contains("\u2029"));
        assertEquals("\"id-1\",{\"text\":\"a\\u2028b\\u2029c\"}", escaped);
    }
}
