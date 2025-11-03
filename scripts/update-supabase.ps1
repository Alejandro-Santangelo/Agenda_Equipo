# Script para actualizar la base de datos de Supabase
# Ejecutar con: .\scripts\update-supabase.ps1

Write-Host "Actualizando base de datos de Supabase..." -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el archivo SQL
$sqlFile = "SUPABASE_COMPLETO.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "Error: No se encuentra el archivo $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Archivo SQL encontrado: $sqlFile" -ForegroundColor Green
Write-Host ""

# Leer las credenciales del .env.local
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local"
    $supabaseUrl = ($envContent | Select-String "NEXT_PUBLIC_SUPABASE_URL=(.*)").Matches.Groups[1].Value
    
    if ($supabaseUrl) {
        Write-Host "URL de Supabase detectada: $supabaseUrl" -ForegroundColor Green
    }
} else {
    Write-Host "Archivo .env.local no encontrado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "INSTRUCCIONES PARA ACTUALIZAR SUPABASE:" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ve a: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Selecciona tu proyecto" -ForegroundColor White
Write-Host "3. Ve a SQL Editor en el menu lateral" -ForegroundColor White
Write-Host "4. Haz click en New query" -ForegroundColor White
Write-Host "5. Copia TODO el contenido de: $sqlFile" -ForegroundColor White
Write-Host "6. Pegalo en el editor SQL" -ForegroundColor White
Write-Host "7. Haz click en RUN o presiona Ctrl+Enter" -ForegroundColor White
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "TIP: El script creara/actualizara:" -ForegroundColor Cyan
Write-Host "   + 7 tablas (team_members, shared_files, chat_messages, etc.)" -ForegroundColor Green
Write-Host "   + Indices para optimizacion" -ForegroundColor Green
Write-Host "   + Politicas de seguridad (RLS)" -ForegroundColor Green
Write-Host "   + Usuarios iniciales (Paula, Gabi, Caro)" -ForegroundColor Green
Write-Host ""

# Preguntar si quiere abrir el archivo
$response = Read-Host "Abrir el archivo SQL para copiar? (S/N)"
if ($response -eq "S" -or $response -eq "s") {
    notepad.exe $sqlFile
}

Write-Host ""
Write-Host "Una vez ejecutado el script en Supabase, presiona Enter aqui..." -ForegroundColor Green
Read-Host

Write-Host "Perfecto! La base de datos deberia estar actualizada." -ForegroundColor Green
Write-Host ""
Write-Host "Verifica en Supabase Dashboard - Table Editor que las tablas existen:" -ForegroundColor Cyan
Write-Host "   - team_members" -ForegroundColor White
Write-Host "   - shared_files" -ForegroundColor White
Write-Host "   - chat_messages" -ForegroundColor White
Write-Host "   - tasks" -ForegroundColor White
Write-Host "   - projects" -ForegroundColor White
Write-Host "   - events" -ForegroundColor White
Write-Host "   - event_participants" -ForegroundColor White
Write-Host ""
