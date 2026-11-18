# Preserve WebView JavascriptInterface bridges and migration models under R8 minification.
-keepattributes JavascriptInterface
-keepattributes *Annotation*

-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class com.xjb.bingli.MainActivity$Bridge { *; }
-keep class com.xjb.bingli.MainActivity$MigrationBridge { *; }
-keep class com.xjb.bingli.MainActivity$AssetMatch { *; }
-keep class com.xjb.bingli.migration.LegacyMigrator { *; }
-keep class com.xjb.bingli.migration.LegacyMigrator$* { *; }
