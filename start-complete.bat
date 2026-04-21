@echo off
echo ========================================
echo    PayToPermit Complete System
echo ========================================
echo.
echo Starting complete backend system...
echo This includes:
echo - Complete authentication system
echo - File upload functionality  
echo - Payment processing
echo - Fee management
echo - Notification system
echo - No database required
echo.

REM Set environment for complete mode
set SKIP_DATABASE=true
set COMPLETE_MODE=true

REM Create uploads directory if it doesn't exist
if not exist "uploads" mkdir uploads

echo Starting backend server...
echo Server will be available at: http://localhost:3000
echo API Health Check: http://localhost:3000/api/health
echo.

REM Start the server
node_modules\.bin\tsx.cmd watch src/index.ts

pause
