@echo off
setlocal
cd /d "%~dp0"
title PRAWDOWID

where node >nul 2>&1
if errorlevel 1 goto no_node

where npm >nul 2>&1
if errorlevel 1 goto no_node

if not exist "node_modules" (
  echo.
  echo Installing dependencies. The first start can take a few minutes...
  echo.
  call npm ci
  if errorlevel 1 goto install_failed
)

echo.
echo Starting PRAWDOWID...
echo The browser will open automatically in a few seconds.
echo Keep this window open while using the app.
echo.

start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 5; Start-Process 'http://localhost:3100'"
call npm run dev

echo.
echo PRAWDOWID has stopped.
pause
exit /b 0

:no_node
echo.
echo Node.js was not found.
echo Install Node.js LTS from https://nodejs.org and run this file again.
echo.
start "" "https://nodejs.org/en/download"
pause
exit /b 1

:install_failed
echo.
echo Dependency installation failed.
echo Check your internet connection and run this file again.
echo.
pause
exit /b 1
