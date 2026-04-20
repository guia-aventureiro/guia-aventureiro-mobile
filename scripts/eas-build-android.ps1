param(
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$tempBuildRoot = Join-Path $env:TEMP 'ga-mobile-build'

Write-Host "Project root: $projectRoot"
Write-Host "Temp build root: $tempBuildRoot"

if (-not (Get-Command eas -ErrorAction SilentlyContinue)) {
  throw 'EAS CLI nao encontrado. Instale com: npm install -g eas-cli'
}

if (Test-Path $tempBuildRoot) {
  Remove-Item -Recurse -Force $tempBuildRoot
}

New-Item -ItemType Directory -Path $tempBuildRoot | Out-Null

# Copy project to a temp location outside OneDrive to avoid file locks on EAS upload.
$excludeDirs = @(
  'node_modules',
  '.git',
  '.expo',
  'android',
  'ios',
  'dist',
  'web-build'
)

$robocopyArgs = @(
  $projectRoot,
  $tempBuildRoot,
  '/E',
  '/R:2',
  '/W:1',
  '/NFL',
  '/NDL',
  '/NJH',
  '/NJS',
  '/NP',
  '/XD'
) + ($excludeDirs | ForEach-Object { Join-Path $projectRoot $_ })

& robocopy @robocopyArgs | Out-Null
$robocopyExitCode = $LASTEXITCODE
if ($robocopyExitCode -gt 7) {
  throw "Falha ao copiar projeto para pasta temporaria. Robocopy exit code: $robocopyExitCode"
}

$requiredPath = Join-Path $tempBuildRoot 'src\contexts\AuthContext.tsx'
if (-not (Test-Path $requiredPath)) {
  throw "Arquivo obrigatorio ausente na copia temporaria: $requiredPath"
}

if ($DryRun) {
  Write-Host 'Dry run concluido com sucesso. Nenhum build foi iniciado.'
  exit 0
}

Push-Location $tempBuildRoot
try {
  $env:EAS_NO_VCS = '1'
  & eas build --platform android --profile production --non-interactive
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
} finally {
  Pop-Location
}
