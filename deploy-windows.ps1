Write-Host "🚀 SpawnKit Windows Deployment Script" -ForegroundColor Green
Write-Host ""

Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps for deployment:" -ForegroundColor Cyan
Write-Host "1. Go to Cloudflare Dashboard"
Write-Host "2. Navigate to Pages"
Write-Host "3. Select your skapp project"
Write-Host "4. Deploy the .next folder"
Write-Host ""
Write-Host "🌐 Or use: git push origin main" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to continue"
