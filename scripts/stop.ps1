$ErrorActionPreference = "Stop"

$processes = Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path -match "python" }
if ($processes) {
    $processes | ForEach-Object { Write-Host "Stopping process id $($_.Id)"; Stop-Process -Id $_.Id -Force }
    Write-Host "Stopped Python processes."
} else {
    Write-Host "No Python processes found."
}
