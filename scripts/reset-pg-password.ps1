# IHG Platform - PostgreSQL password reset
# Run this as Administrator

$ErrorActionPreference = 'Stop'
$pgHba = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
$backup = "$pgHba.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Step 1: Backup the file
Write-Host "[1/5] Backing up pg_hba.conf..." -ForegroundColor Cyan
Copy-Item $pgHba $backup
Write-Host "  Backup: $backup"

# Step 2: Replace scram-sha-256 with trust for local connections
Write-Host "[2/5] Enabling trust auth temporarily..." -ForegroundColor Cyan
$content = Get-Content $pgHba -Raw
$newContent = $content -replace 'host\s+all\s+all\s+127\.0\.0\.1/32\s+scram-sha-256', 'host all all 127.0.0.1/32 trust'
$newContent = $newContent -replace 'host\s+all\s+all\s+::1/128\s+scram-sha-256', 'host all all ::1/128 trust'
Set-Content $pgHba $newContent
Write-Host "  pg_hba.conf updated to use trust auth"

# Step 3: Restart PostgreSQL service
Write-Host "[3/5] Restarting PostgreSQL service..." -ForegroundColor Cyan
Restart-Service postgresql-x64-18 -Force
Start-Sleep -Seconds 3
Write-Host "  Service status: $((Get-Service postgresql-x64-18).Status)"

# Step 4: Connect with no password and set a new one
Write-Host "[4/5] Setting new password for postgres user..." -ForegroundColor Cyan
$env:PGPASSWORD = ''
$setPassword = @"
ALTER USER postgres WITH PASSWORD 'IHG_Secure_2026';
"@
psql -U postgres -c $setPassword
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Failed to set password" -ForegroundColor Red
    exit 1
}

# Step 5: Restore scram-sha-256 security
Write-Host "[5/5] Restoring secure auth..." -ForegroundColor Cyan
$content = Get-Content $pgHba -Raw
$newContent = $content -replace 'host\s+all\s+all\s+127\.0\.0\.1/32\s+trust', 'host all all 127.0.0.1/32 scram-sha-256'
$newContent = $newContent -replace 'host\s+all\s+all\s+::1/128\s+trust', 'host all all ::1/128 scram-sha-256'
Set-Content $pgHba $newContent
Restart-Service postgresql-x64-18 -Force
Start-Sleep -Seconds 3
Write-Host "  Service restarted"

# Verify
Write-Host ""
Write-Host "=== VERIFICATION ===" -ForegroundColor Green
$env:PGPASSWORD = 'IHG_Secure_2026'
$test = psql -U postgres -h localhost -c "SELECT version();" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Connection works with new password" -ForegroundColor Green
    $test | Select-Object -First 3
} else {
    Write-Host "FAILED: $($test -join ' ')" -ForegroundColor Red
}
