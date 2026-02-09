@echo off
chcp 850 >nul
title EdTech Mastery - Servidor LAN
cls

echo.
echo ================================================
echo      EdTech Mastery - Inicio del Servidor
echo ================================================
echo.

REM Cambiar al directorio del script (con comillas por si hay espacios)
cd /d "%~dp0"

echo Carpeta actual: %cd%
echo.

REM Verificar si Node.js esta instalado
echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js NO esta instalado.
    echo.
    echo Por favor, descarga e instala Node.js desde:
    echo    https://nodejs.org/es/download/
    echo.
    echo Elige "Windows (.msi)" para Windows.
    echo.
    echo Despues de instalar, REINICIA tu computadora.
    echo.
    pause
    exit /b 1
)
for /f "delims=" %%a in ('node --version') do set NODE_VERSION=%%a
echo OK: Node.js detectado: %NODE_VERSION%
echo.

REM Verificar e instalar dependencias
echo [2/5] Verificando dependencias...
if not exist "node_modules" (
    echo No existe node_modules.
    echo Instalando dependencias...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR al instalar dependencias.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo OK: Dependencias instaladas.
) else (
    echo OK: Dependencias ya instaladas.
)
echo.

REM Obtener direccion IP local
echo [3/5] Detectando red local...
set LOCAL_IP=localhost
for /f "tokens=14 delims= " %%a in ('ipconfig ^| findstr /c:"IPv4" ^| findstr /c:"192.168"') do set LOCAL_IP=%%a
echo OK: Tu IP local: %LOCAL_IP%
echo.

REM Mostrar informacion
echo [4/5] Servidor listo.
echo.
echo ================================================
echo      SERVIDOR LISTO PARA INICIAR
echo ================================================
echo.
echo Para ALUMNOS (telefonos): http://%LOCAL_IP%:3000
echo Para PROFESOR (tu PC):    http://%LOCAL_IP%:3000/admin
echo.
echo Los alumnos deben conectarse a la MISMA red WiFi.
echo.
pause

echo [5/5] Iniciando servidor...
echo.
echo ================================================
echo      EdTech Mastery CORRIENDO
echo ================================================
echo.
echo Presiona Ctrl+C para detener el servidor.
echo.

REM Ejecutar el servidor
node server.js

REM Si llega aqui, el servidor se cerro
echo.
echo El servidor se detuvo.
pause
