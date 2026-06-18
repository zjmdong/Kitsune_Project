$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host ""
Write-Host "Starting BranchWise AI..." -ForegroundColor Cyan
Write-Host "Project: $projectRoot"
Write-Host ""

if (-not (Test-Path ".env.local") -and (Test-Path ".env.example")) {
  Copy-Item ".env.example" ".env.local"
  Write-Host "Created .env.local from .env.example. Add your LLM API key if real analysis is needed." -ForegroundColor Yellow
}

$codexNodeBin = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
if (-not (Get-Command node -ErrorAction SilentlyContinue) -and (Test-Path (Join-Path $codexNodeBin "node.exe"))) {
  $env:PATH = "$codexNodeBin;$env:PATH"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js was not found. Install Node.js 20+ from https://nodejs.org/ and run this script again."
}

$nextCmd = Join-Path $projectRoot "node_modules\.bin\next.CMD"
if (-not (Test-Path $nextCmd)) {
  Write-Host "Dependencies are missing. Installing now..." -ForegroundColor Yellow
  if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm install
  } elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    npm install
  } else {
    throw "No package manager found. Install pnpm or npm, then run this script again."
  }
}

Write-Host ""
Write-Host "BranchWise AI will open at http://localhost:3000" -ForegroundColor Green
Write-Host "Keep this window open while presenting. Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

& $nextCmd dev
