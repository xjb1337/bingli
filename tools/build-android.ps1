param([string]$VersionName = '3.0.0', [int]$VersionCode = 300000)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$signing = Join-Path $root 'android/.signing'
if (!(Test-Path (Join-Path $signing 'release.keystore'))) { throw '缺少本项目签名密钥；不要为已发布应用重新生成密钥。' }
$names = @('ANDROID_KEYSTORE_FILE','ANDROID_KEYSTORE_PASSWORD','ANDROID_KEY_PASSWORD','ANDROID_KEY_ALIAS')
$previous = @{}
foreach ($name in $names) { $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
try {
    $env:ANDROID_KEYSTORE_FILE = Join-Path $signing 'release.keystore'
    $env:ANDROID_KEYSTORE_PASSWORD = [IO.File]::ReadAllText((Join-Path $signing 'password.txt'))
    $env:ANDROID_KEY_PASSWORD = $env:ANDROID_KEYSTORE_PASSWORD
    $env:ANDROID_KEY_ALIAS = 'bingli'
    & (Join-Path $root 'android/gradlew.bat') -p (Join-Path $root 'android') assembleRelease testDebugUnitTest lintRelease "-PversionName=$VersionName" "-PversionCode=$VersionCode" --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'Android build failed' }
    $target = Join-Path $root "dist/bingli-$VersionName.apk"
    Copy-Item (Join-Path $root 'android/app/build/outputs/apk/release/app-release.apk') $target
    Get-FileHash $target -Algorithm SHA256
} finally {
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
}
