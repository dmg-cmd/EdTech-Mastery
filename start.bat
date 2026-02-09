@echo off
chcp 65001 >nul
title EdTech Mastery - Servidor LAN

echo.
echo ================================================
echo   🎓 EdTech Mastery - Inicio del Servidor
echo ================================================
echo.

REM Cambiar al directorio del script
cd /d "%~dp0"

REM Verificar si Node.js está instalado
echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js no está instalado.
    echo.
    echo Por favor, descarga e instala Node.js desde:
    echo   https://nodejs.org/es/download/
    echo.
    echo Presiona cualquier tecla para salir...
    pause >nul
    exit /b 1
)
echo ✅ Node.js detectado

REM Verificar e instalar dependencias
echo [2/4] Verificando dependencias...
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo ❌ ERROR al instalar dependencias
        pause >nul
        exit /b 1
    )
    echo ✅ Dependencias instaladas
) else (
    echo ✅ Dependencias ya instaladas
)

REM Obtener dirección IP local
echo [3/4] Detectando red local...
for /f "tokens=14 delims= " %%a in ('ipconfig ^| findstr /c:"IPv4" ^| findstr /c:"192.168"') do set LOCAL_IP=%%a
if not defined LOCAL_IP set LOCAL_IP=localhost

REM Iniciar el servidor
echo [4/4] Iniciando servidor...
echo.
echo ================================================
echo   ✅ Servidor listo
echo ================================================
echo.
echo 📡 ACCESO PARA ALUMNOS (teléfonos):
echo    http://%LOCAL_IP%:3000
echo.
echo 🖥️  PANEL DEL PROFESOR:
echo    http://%LOCAL_IP%:3000/admin
echo.
echo 💡 Los alumnos deben conectarse a la misma red WiFi
echo    y escanear el código QR que aparecerá en el panel.
echo.
echo ================================================
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

REM Ejecutar el servidor
node server.js

REM Mantener la ventana abierta si hay error
if errorlevel 1 (
    echo.
    echo ❌ El servidor encontró un error.
    pause
)
