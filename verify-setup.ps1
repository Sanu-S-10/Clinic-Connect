# ClinicConnect Setup Verification Script for PowerShell

Write-Host ""
Write-Host "========================================"
Write-Host "  ClinicConnect Setup Verification" -ForegroundColor Cyan
Write-Host "========================================"
Write-Host ""

$allPassed = $true

# Check 1: Node.js
Write-Host "[1/6] Checking Node.js..." -ForegroundColor White
try {
    $nodeVersion = node --version
    Write-Host "✓ $nodeVersion installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found! Install from nodejs.org" -ForegroundColor Red
    $allPassed = $false
}

# Check 2: npm
Write-Host "[2/6] Checking npm..." -ForegroundColor White
try {
    $npmVersion = npm --version
    Write-Host "✓ npm $npmVersion installed" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found!" -ForegroundColor Red
    $allPassed = $false
}

# Check 3: .env file
Write-Host "[3/6] Checking .env file..." -ForegroundColor White
if (Test-Path ".env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
} else {
    Write-Host "✗ .env file NOT found!" -ForegroundColor Red
    Write-Host "   Run: Copy-Item '.env.example' '.env'" -ForegroundColor Yellow
    Write-Host "   Then edit .env with your MongoDB/Email credentials" -ForegroundColor Yellow
    $allPassed = $false
}

# Check 4: node_modules
Write-Host "[4/6] Checking node_modules..." -ForegroundColor White
if (Test-Path "node_modules") {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Dependencies NOT installed!" -ForegroundColor Red
    Write-Host "   Run: npm install" -ForegroundColor Yellow
    $allPassed = $false
}

# Check 5: package.json
Write-Host "[5/6] Checking package.json..." -ForegroundColor White
if (Test-Path "package.json") {
    Write-Host "✓ package.json found" -ForegroundColor Green
} else {
    Write-Host "✗ package.json NOT found!" -ForegroundColor Red
    $allPassed = $false
}

# Check 6: MongoDB (test if possible)
Write-Host "[6/6] Checking MongoDB configuration..." -ForegroundColor White
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue
if ($envContent -match "MONGODB_URI") {
    Write-Host "✓ MongoDB URI configured in .env" -ForegroundColor Green
} else {
    Write-Host "⚠ MongoDB URI not configured in .env" -ForegroundColor Yellow
}

Write-Host ""
if ($allPassed) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ All checks passed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ✗ Some checks failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run admin:create" -ForegroundColor White
Write-Host "2. Run: npm run dev:all" -ForegroundColor White
Write-Host "3. Open: http://localhost:5173" -ForegroundColor White
Write-Host ""
