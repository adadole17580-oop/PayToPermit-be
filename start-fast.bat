@echo off
echo Starting PayToPermit Backend (Fast Mode)...
echo ========================================

REM Set environment to skip database
set SKIP_DATABASE=true

REM Start the server
node_modules\.bin\tsx.cmd watch src/index.ts

pause
