param(
    [string]$Server = ".\\SQLEXPRESS",
    [string]$Database = "TRPG_Corpus_DB",
    [string]$ProjectCode = "DAGO",
    [string]$TeamCode = "DAGO-T01",
    [string]$SessionCode = "DC10-XIAOCHENG-001",
    [string]$OutputPath = "assets/data/dago-changshan-v1-bundle.json",
    [string]$Sqlcmd = "sqlcmd"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$OutFile = Join-Path $Root $OutputPath
$TempSql = Join-Path $env:TEMP "dago_export_runtime_bundle.sql"
$TempJson = Join-Path $env:TEMP "dago_runtime_bundle.json"

$Query = @"
SET NOCOUNT ON;
USE [$Database];
EXEC dbo.usp_Export_DaGo_Runtime_Bundle
    @project_code = N'$ProjectCode',
    @team_code = N'$TeamCode',
    @session_code = N'$SessionCode';
"@

Set-Content -Path $TempSql -Value $Query -Encoding UTF8
& $Sqlcmd -S $Server -E -C -f 65001 -W -w 65535 -h -1 -i $TempSql -o $TempJson
if ($LASTEXITCODE -ne 0) {
    throw "sqlcmd export failed"
}

$Raw = Get-Content -Path $TempJson -Raw -Encoding UTF8
$Start = $Raw.IndexOf('{')
$End = $Raw.LastIndexOf('}')
if ($Start -lt 0 -or $End -le $Start) {
    throw "No JSON object found in sqlcmd output"
}
$Json = $Raw.Substring($Start, $End - $Start + 1)
$Parsed = $Json | ConvertFrom-Json
$Pretty = $Parsed | ConvertTo-Json -Depth 100
Set-Content -Path $OutFile -Value $Pretty -Encoding UTF8
Write-Host "Runtime bundle written to $OutputPath"
