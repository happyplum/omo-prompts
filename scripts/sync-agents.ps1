param(
    [switch]$Check
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$RuntimeRoot = Split-Path -Parent $RepoRoot

$Source = Join-Path $RepoRoot "runtime\AGENTS.md"
$Target = Join-Path $RuntimeRoot "AGENTS.md"

if (-not (Test-Path -LiteralPath $Source)) {
    throw "Source not found: $Source"
}

if ($Check) {
    if (-not (Test-Path -LiteralPath $Target)) {
        throw "Target not found: $Target"
    }

    $SourceHash = (Get-FileHash -LiteralPath $Source -Algorithm SHA256).Hash
    $TargetHash = (Get-FileHash -LiteralPath $Target -Algorithm SHA256).Hash

    if ($SourceHash -ne $TargetHash) {
        throw "AGENTS.md is out of sync. Source=$SourceHash Target=$TargetHash"
    }

    "AGENTS.md is in sync: $SourceHash"
    exit 0
}

Copy-Item -LiteralPath $Source -Destination $Target -Force

$Hash = (Get-FileHash -LiteralPath $Target -Algorithm SHA256).Hash
"Synced AGENTS.md to $Target"
"SHA256: $Hash"
