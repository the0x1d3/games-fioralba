@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Non trovo npm. Installa Node.js e riprova.
  pause
  exit /b 1
)

set EDITOR_APRI_BROWSER=1
npm run editor
echo.
pause