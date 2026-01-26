# PowerShell script to initialize database on Vercel
# Usage: .\init-db.ps1

$url = "https://neetrino-calendar.vercel.app/api/admin/init-db"

Write-Host "Initializing database on Vercel..." -ForegroundColor Yellow
Write-Host "URL: $url" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json"
    
    Write-Host "`n✅ Database initialized successfully!" -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
    if ($response.admin) {
        Write-Host "`n📧 Admin credentials:" -ForegroundColor Yellow
        Write-Host "   Email: $($response.admin.email)" -ForegroundColor White
        Write-Host "   Password: $($response.admin.password)" -ForegroundColor White
    }
} catch {
    Write-Host "`n❌ Error initializing database:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}
