@echo off
echo 🚀 SpawnKit Windows Deployment Script
echo.

echo 📦 Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo ✅ Build successful!
echo.
echo 📋 Next steps for deployment:
echo 1. Go to Cloudflare Dashboard
echo 2. Navigate to Pages
echo 3. Select your skapp project
echo 4. Deploy the .next folder
echo.
echo 🌐 Or use: git push origin main
echo.
pause
