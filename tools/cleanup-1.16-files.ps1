$ErrorActionPreference = "Stop"
$Files = @(
  "assets\dago-dol-like-runtime.js",
  "README_DA_GO_1.16.0_DOL_LIKE_PLAYABLE.md",
  "README_DA_GO_1.16.1_PRESERVE_SETTINGS_DOL_GRAMMAR.md"
)
foreach ($File in $Files) {
  if (Test-Path $File) {
    Remove-Item -Force $File
    Write-Host "removed $File"
  }
}
