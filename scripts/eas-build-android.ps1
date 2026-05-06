param(
  [switch]$DryRun,
  [string]$Profile = 'production'
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$tempBuildRoot = Join-Path $env:TEMP 'ga-mobile-build'
$easWorkTemp = 'C:\temp\eas-cli-temp'

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
  'web-build',
  'eas-hooks',
  'scripts'
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
  '/A-:R',
  '/XD'
) + ($excludeDirs | ForEach-Object { Join-Path $projectRoot $_ })

& robocopy @robocopyArgs | Out-Null
$robocopyExitCode = $LASTEXITCODE
if ($robocopyExitCode -gt 7) {
  throw "Falha ao copiar projeto para pasta temporaria. Robocopy exit code: $robocopyExitCode"
}

# Remove atributos readonly herdados do OneDrive para evitar falhas de cleanup no EAS CLI.
& attrib -R "$tempBuildRoot\*" /S /D 2>$null

$requiredPath = Join-Path $tempBuildRoot 'src\contexts\AuthContext.tsx'
if (-not (Test-Path $requiredPath)) {
  throw "Arquivo obrigatorio ausente na copia temporaria: $requiredPath"
}

Write-Host 'Instalando dependencias na pasta temporaria...'
Push-Location $tempBuildRoot
try {
  & npm install --ignore-scripts --no-audit --prefer-offline 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao instalar dependencias na pasta temporaria."
  }
} finally {
  Pop-Location
}

if ($DryRun) {
  Write-Host 'Dry run concluido com sucesso. Nenhum build foi iniciado.'
  exit 0
}

# Inicializa git no temp para EAS usar git nativo (evita shallow-clone com EPERM no Windows)
Write-Host 'Inicializando repositorio git temporario...'
Push-Location $tempBuildRoot
try {
  & git init | Out-Null
  & git config user.email "build@local" | Out-Null
  & git config user.name "EAS Build" | Out-Null
  & git add -A | Out-Null
  & git commit -m "temp build snapshot" | Out-Null
} finally {
  Pop-Location
}

Push-Location $tempBuildRoot
try {
  New-Item -ItemType Directory -Path $easWorkTemp -Force | Out-Null

  $previousTemp = $env:TEMP
  $previousTmp = $env:TMP
  $previousProjectRoot = $env:EAS_PROJECT_ROOT

  $env:TEMP = $easWorkTemp
  $env:TMP = $easWorkTemp
  $env:EAS_PROJECT_ROOT = $tempBuildRoot

  $exitCode = 1
  for ($attempt = 1; $attempt -le 3; $attempt++) {
    Write-Host "Iniciando EAS build (tentativa $attempt de 3)..."
    & eas build --platform android --profile $Profile --non-interactive
    $exitCode = $LASTEXITCODE
    if ($exitCode -eq 0) {
      break
    }
    Write-Host "Tentativa $attempt falhou com exit code $exitCode."
  }

  if ($null -eq $previousTemp) {
    Remove-Item Env:TEMP -ErrorAction SilentlyContinue
  } else {
    $env:TEMP = $previousTemp
  }
  if ($null -eq $previousTmp) {
    Remove-Item Env:TMP -ErrorAction SilentlyContinue
  } else {
    $env:TMP = $previousTmp
  }
  if ($null -eq $previousProjectRoot) {
    Remove-Item Env:EAS_PROJECT_ROOT -ErrorAction SilentlyContinue
  } else {
    $env:EAS_PROJECT_ROOT = $previousProjectRoot
  }

  if ($exitCode -ne 0) {
    exit $exitCode
  }
} finally {
  Pop-Location
}
