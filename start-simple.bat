@echo off
echo Starting PayToPermit Backend (Simple Mode)...

REM Create uploads directory
if not exist "uploads" mkdir uploads

REM Start server directly
node_modules\.bin\tsx.cmd src/index.ts

pause
