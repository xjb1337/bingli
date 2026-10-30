package com.xjb.bingli;

final class UpdatePolicy {
    static void verifyDownload(long expectedSize, long actualSize, String expectedHash, String actualHash) {
        if (expectedSize <= 0 || expectedSize > 100L * 1024 * 1024 || actualSize != expectedSize
                || !expectedHash.matches("[a-fA-F0-9]{64}") || !expectedHash.equalsIgnoreCase(actualHash)) {
            throw new IllegalArgumentException("更新包大小或 SHA-256 校验失败");
        }
    }
    static void verifyArchive(String expectedPackage, String actualPackage, long current, long expected,
            long actual, String installedCert, String archiveCert, String expectedName, String actualName) {
        if (!expectedPackage.equals(actualPackage) || expected <= current || actual != expected
                || !installedCert.equalsIgnoreCase(archiveCert) || !expectedName.equals(actualName)) {
            throw new IllegalArgumentException("APK 包名、版本或签名校验失败");
        }
    }
}
