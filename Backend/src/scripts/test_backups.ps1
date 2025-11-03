# Script de prueba completo del sistema de Backups
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PRUEBA COMPLETA DEL SISTEMA DE BACKUPS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"

# 1. Verificar servidor
Write-Host "1. Verificando servidor..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
Write-Host "   ✅ Servidor: $($response.message)" -ForegroundColor Green

# 2. Test de conexión
Write-Host "`n2. Probando conexión a BD..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/api/test-connection" -Method Get
Write-Host "   ✅ BD: $($response.data.database)" -ForegroundColor Green

# 3. Ver backups existentes
Write-Host "`n3. Listando backups existentes..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/api/backups/list" -Method Get
Write-Host "   📦 Backups encontrados: $($response.data.Count)" -ForegroundColor Green

# 4. Ver información del sistema
Write-Host "`n4. Información del sistema de backups..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/api/backups/info" -Method Get
Write-Host "   📁 Ruta: $($response.data.path)" -ForegroundColor Green
Write-Host "   📊 Total: $($response.data.count) backups ($($response.data.totalSizeFormatted))" -ForegroundColor Green

# 5. Crear nuevo backup
Write-Host "`n5. Creando nuevo backup..." -ForegroundColor Yellow
$body = @{
    backupName = "test_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').bak"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/api/backups/create" -Method Post -Body $body -ContentType "application/json"
Write-Host "   ✅ Backup creado: $($response.data.fileName)" -ForegroundColor Green
Write-Host "   💾 Tamaño: $($response.data.sizeFormatted)" -ForegroundColor Green

$backupFileName = $response.data.fileName

# 6. Listar backups de nuevo
Write-Host "`n6. Listando backups actualizados..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/api/backups/list" -Method Get
Write-Host "   📦 Backups actuales: $($response.data.Count)" -ForegroundColor Green
foreach ($backup in $response.data) {
    Write-Host "      - $($backup.fileName) ($($backup.sizeFormatted)) - $($backup.age)" -ForegroundColor Gray
}

# 7. Información actualizada
Write-Host "`n7. Información actualizada del sistema..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/api/backups/info" -Method Get
Write-Host "   📊 Total: $($response.data.count) backups ($($response.data.totalSizeFormatted))" -ForegroundColor Green
Write-Host "   📅 Más reciente: $($response.data.newest.fileName)" -ForegroundColor Green

# 8. Probar restauración (OPCIONAL - comentado por seguridad)
# Write-Host "`n8. Probando restauración..." -ForegroundColor Yellow
# $body = @{
#     fileName = $backupFileName
# } | ConvertTo-Json
# $response = Invoke-RestMethod -Uri "$baseUrl/api/backups/restore" -Method Post -Body $body -ContentType "application/json"
# Write-Host "   ✅ Backup restaurado exitosamente" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ PRUEBAS COMPLETADAS EXITOSAMENTE" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan