@echo off
echo ========================================
echo PRUEBA COMPLETA DEL SISTEMA DE BACKUPS
echo ========================================
echo.

set BASE_URL=http://localhost:3000

echo 1. Verificando servidor...
curl -s %BASE_URL%/health
echo.

echo 2. Probando conexion a BD...
curl -s %BASE_URL%/api/test-connection
echo.

echo 3. Listando backups existentes...
curl -s %BASE_URL%/api/backups/list
echo.

echo 4. Informacion del sistema...
curl -s %BASE_URL%/api/backups/info
echo.

echo 5. Creando nuevo backup...
curl -s -X POST %BASE_URL%/api/backups/create -H "Content-Type: application/json"
echo.

echo 6. Listando backups actualizados...
curl -s %BASE_URL%/api/backups/list
echo.

echo ========================================
echo PRUEBAS COMPLETADAS
echo ========================================
pause