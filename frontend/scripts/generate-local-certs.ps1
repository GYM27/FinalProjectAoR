$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir

Push-Location $projectDir
try {
  node (Join-Path $scriptDir "generate-local-certs.mjs")
}
finally {
  Pop-Location
}
