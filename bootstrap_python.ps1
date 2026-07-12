# bootstrap_python.ps1
# This script downloads, configures, and packages a portable Python 3.11 environment in the workspace.

$ErrorActionPreference = 'Stop'
$embedDir = Join-Path $PSScriptRoot "python-embed"
$zipPath = Join-Path $embedDir "python-3.11.9-embed-amd64.zip"
$pipInstaller = Join-Path $embedDir "get-pip.py"

if (-not (Test-Path $embedDir)) {
    New-Item -ItemType Directory -Path $embedDir | Out-Null
}

Write-Host "1. Downloading Python 3.11.9 portable package..." -ForegroundColor Cyan
if (-not (Test-Path $zipPath)) {
    curl.exe -L -o $zipPath "https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip"
}

Write-Host "2. Extracting Python package..." -ForegroundColor Cyan
Expand-Archive -Path $zipPath -DestinationPath $embedDir -Force

Write-Host "3. Cleaning up zip file..." -ForegroundColor Cyan
Remove-Item -Path $zipPath -Force

Write-Host "4. Configuring Python search paths (python311._pth)..." -ForegroundColor Cyan
$pthFile = Join-Path $embedDir "python311._pth"
if (Test-Path $pthFile) {
    $content = Get-Content $pthFile
    
    # Enable site-packages and uncomment import sys
    $newContent = @()
    foreach ($line in $content) {
        if ($line -eq "#import sys") {
            $newContent += "import sys"
        } else {
            $newContent += $line
        }
    }
    
    # Add site-packages path to search list if not present
    if ($newContent -notcontains "site-packages") {
        $newContent += "site-packages"
    }
    
    $newContent | Set-Content $pthFile
}

Write-Host "5. Downloading pip bootstrap..." -ForegroundColor Cyan
if (-not (Test-Path $pipInstaller)) {
    curl.exe -L -o $pipInstaller "https://bootstrap.pypa.io/get-pip.py"
}

Write-Host "6. Installing pip in portable environment..." -ForegroundColor Cyan
$pythonExe = Join-Path $embedDir "python.exe"
& $pythonExe $pipInstaller --no-warn-script-location

Write-Host "7. Installing FastAPI, Uvicorn, Librosa, and NumPy..." -ForegroundColor Cyan
& $pythonExe -m pip install fastapi uvicorn librosa numpy python-multipart --no-warn-script-location

Write-Host "Python environment bootstrapped successfully!" -ForegroundColor Green
