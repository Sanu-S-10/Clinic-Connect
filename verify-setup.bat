@echo off
REM ClinicConnect Setup Verification Script for Windows

echo.
echo ========================================
echo  ClinicConnect Setup Verification
echo ========================================
echo.

REM Check Node.js
echo [1/6] Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node --version') do echo ✓ Node.js %%i installed
) else (
    echo ✗ Node.js not found! Install from nodejs.org
    exit /b 1
)

REM Check npm
echo [2/6] Checking npm...
npm --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('npm --version') do echo ✓ npm %%i installed
) else (
    echo ✗ npm not found!
    exit /b 1
)

REM Check if .env exists
echo [3/6] Checking .env file...
if exist ".env" (
    echo ✓ .env file found
) else (
    echo ✗ .env file NOT found!
    echo   Run: Copy-Item ".env.example" ".env"
    echo   Then edit .env with your MongoDB/Email credentials
    exit /b 1
)

REM Check if node_modules exists
echo [4/6] Checking node_modules...
if exist "node_modules" (
    echo ✓ Dependencies installed
) else (
    echo ✗ Dependencies NOT installed!
    echo   Run: npm install
    exit /b 1
)

REM Check package.json exists
echo [5/6] Checking package.json...
if exist "package.json" (
    echo ✓ package.json found
) else (
    echo ✗ package.json NOT found!
    exit /b 1
)

REM Check MongoDB connection (optional)
echo [6/6] Checking MongoDB connection...
echo   (Skipping - depends on .env configuration)
echo   Run 'npm run admin:create' to test MongoDB connection

echo.
echo ========================================
echo  ✓ All checks passed!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm run admin:create
echo 2. Run: npm run dev:all
echo 3. Open: http://localhost:5173
echo.
