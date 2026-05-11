$ErrorActionPreference = "Stop"
$Root = Get-Location
$RemoveFiles = @(
  "assets\dago-dol-like-runtime.js",
  "README_DA_GO_1.16.0_DOL_LIKE_PLAYABLE.md",
  "README_DA_GO_1.16.1_PRESERVE_SETTINGS_DOL_GRAMMAR.md"
)
foreach ($File in $RemoveFiles) {
  if (Test-Path $File) {
    git rm -f --ignore-unmatch $File 2>$null
    if (Test-Path $File) { Remove-Item -Force $File }
  }
}
Write-Host "Removed 1.16.x files if present."
