# Script para hacer push y deploy a Vercel
# Ejecutar con: .\scripts\deploy.ps1

Write-Host "🚀 Iniciando proceso de deploy..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar estado de Git
Write-Host "📊 Verificando cambios en Git..." -ForegroundColor Yellow
git status

Write-Host ""
$response = Read-Host "¿Continuar con el commit y push? (S/N)"
if ($response -ne "S" -and $response -ne "s") {
    Write-Host "❌ Deploy cancelado" -ForegroundColor Red
    exit 0
}

# 2. Agregar todos los archivos
Write-Host ""
Write-Host "📦 Agregando archivos..." -ForegroundColor Yellow
git add .

# 3. Hacer commit
Write-Host ""
$commitMsg = Read-Host "Mensaje del commit (Enter para usar mensaje por defecto)"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "feat: Sincronización completa con Supabase - todas las interacciones persisten en BD"
}

git commit -m "$commitMsg"

# 4. Push a main
Write-Host ""
Write-Host "🔼 Subiendo cambios a GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Push exitoso a GitHub" -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🌐 DEPLOY A VERCEL" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Vercel detectará automáticamente los cambios y desplegará." -ForegroundColor White
    Write-Host ""
    Write-Host "Para forzar un re-deploy:" -ForegroundColor Yellow
    Write-Host "1. Ve a: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Selecciona tu proyecto 'Agenda_Equipo'" -ForegroundColor White
    Write-Host "3. Ve a la pestaña 'Deployments'" -ForegroundColor White
    Write-Host "4. Haz click en '...' del último deploy → 'Redeploy'" -ForegroundColor White
    Write-Host ""
    Write-Host "O ejecuta en terminal:" -ForegroundColor Yellow
    Write-Host "   vercel --prod" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Verificar variables de entorno en Vercel:" -ForegroundColor Yellow
    Write-Host "   • NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor White
    Write-Host "   • NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor White
    Write-Host ""
    Write-Host "Deberían estar en: Settings → Environment Variables" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Error en el push" -ForegroundColor Red
    Write-Host "Verifica que tengas permisos y que el remote esté configurado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Proceso completado!" -ForegroundColor Green
