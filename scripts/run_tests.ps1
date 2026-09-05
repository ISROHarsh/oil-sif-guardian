# OIL-SIF Guardian Automated Test Runner
Write-Host "Running OIL-SIF Guardian Test Suite..." -ForegroundColor Cyan

$VenvPy = Join-Path $PSScriptRoot "..\.venv\Scripts\pytest.exe"
if (-not (Test-Path $VenvPy)) {
    Write-Host "Virtual environment pytest not found at $VenvPy. Falling back to py -m pytest..." -ForegroundColor Yellow
    py -m pytest backend/tests tests/ -v
} else {
    & $VenvPy backend/tests tests/ -v
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nAll Tests Passed Successfully! [100%]" -ForegroundColor Green
} else {
    Write-Host "`nTest Suite Encountered Failures." -ForegroundColor Red
}
