@echo off
chcp 65001 >nul
title EdTech Mastery - Servidor LAN
cls

echo.
echo ================================================
echo   🎓 EdTech Mastery - Inicio del Servidor
echo ================================================
echo.

REM Cambiar al directorio del script
cd /d "%~dp0"
echo 📁 Carpeta actual: %cd%
echo.

REM Verificar si Node.js está instalado
echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Node.js NO está instalado.
    echo.
    echo Por favor, descarga e instala Node.js desde:
    echo   👉 https://nodejs.org/es/download/
    echo.
    echo Elije "Windows (.msi)"版本 para Windows.
    echo.
    echo Despues de instalar, REINICIA tu computadora.
    echo.
    pause
    exit /b 1
)
for /f "delims=" %%a in ('node --version') do set NODE_VERSION=%%a
echo ✅ Node.js detectado: %NODE_VERSION%
echo.

REM Verificar e instalar dependencias
echo [2/5] Verificando dependencias...
if not exist "node_modules" (
    echo 📦 node_modules NO existe.
    echo ⏳ Instalando dependencias (puede tomar unos segundos)...
    echo.
    npm install
    if errorlevel 1 (
        echo.
        echo ❌ ERROR al instalar dependencias.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo ✅ Dependencias instaladas correctamente.
) else (
    echo ✅ Dependencias ya instaladas.
)
echo.

REM Obtener dirección IP local
echo [3/5] Detectando red local...
set LOCAL_IP=No detectada
for /f "tokens=14 delims= " %%a in ('ipconfig ^| findstr /c:"IPv4" ^| findstr /c:"192.168"') do set LOCAL_IP=%%a
if "%LOCAL_IP%"=="No detectada" set LOCAL_IP=localhost
echo ✅ Tu IP local: %LOCAL_IP%
echo.

REM Mostrar información antes de iniciar
echo [4/5] Preparando servidor...
echo.
echo ================================================
echo   ✅ SERVIDOR LISTO PARA INICIAR
echo ================================================
echo.
echo 📡 ACCESO PARA ALUMNOS (teléfonos):
echo    http://%LOCAL_IP%:3000
echo.
echo 🖥️  PANEL DEL PROFESOR:
echo    http://%LOCAL_IP%:3000/admin
echo.
echo 💡 Los alumnos deben conectarse a la misma red WiFi
echo    y escanear el código QR que aparecerá.
echo.
echo ⏸️  El servidor iniciará en 3 segundos...
echo.
pause

REM Iniciar el servidor
echo [5/5] Iniciando servidor...
echo.
echo ================================================
echo   🎓 EdTech Mastery CORRIENDO
echo ================================================
echo.
echo ⏹️  Presiona Ctrl+C para detener el servidor
echo.
echo.

REM Ejecutar el servidor
node server.js

REM Si llega aquí, el servidor se cerró
echo.
echo ================================================
echo   ⚠️  El servidor se detuvo
echo ================================================
echo.
pause
