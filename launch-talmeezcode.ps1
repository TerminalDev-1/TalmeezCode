$ErrorActionPreference = "Stop"

# Ensure Electron runs as a normal GUI app even if launched from an environment that set ELECTRON_RUN_AS_NODE
Remove-Item Env:\ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

# Stop any previous TalmeezCode Electron instance from this repo so the latest main process build loads cleanly
Get-Process -Name "electron" -ErrorAction SilentlyContinue | Where-Object {
  $_.Path -and $_.Path.StartsWith($PSScriptRoot, [System.StringComparison]::OrdinalIgnoreCase)
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Ensure Bun is on PATH
$tempBunDir = "C:\Users\gamer\AppData\Local\Temp\opencode-bun-1.4.2\bun-windows-x64-baseline"
$localBunDir = Join-Path $PSScriptRoot ".bun\bin"
if (Test-Path (Join-Path $localBunDir "bun.exe")) {
  $env:PATH = "$localBunDir;$env:PATH"
} elseif (Test-Path (Join-Path $tempBunDir "bun.exe")) {
  $env:PATH = "$tempBunDir;$env:PATH"
}

Set-Location $PSScriptRoot
& bun run dev:desktop
