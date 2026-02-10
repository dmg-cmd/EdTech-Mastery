@echo off
chcp 850 >nul
title EdTech Mastery - Servidor LAN
cls

echo.
echo ====================================
echo    EdTech Mastery - Inicio del Servidor
echo ====================================
echo.

cd /d "%~dp0"

echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado.
    echo Descarga desde: https://nodejs.org
    pause
    exit
)
for /f "delims=" %%a in ('node --version') do echo OK: Node.js %%a
echo.

REM Detectar todas las direcciones IP
echo [2/5] Detectando direcciones IP...
echo.
echo Lista de direcciones IP disponibles:
echo.

set count=0
setlocal EnableDelayedExpansion

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set ip=%%a
    set ip=!ip: =!
    if not "!ip!"=="" (
        if not "!ip!"==":" (
            set /a count+=1
            echo   [!count!] !ip!
            set ip!count!=!ip!
        )
    )
)

if !count! equ 0 (
    echo ERROR: No se encontro ninguna direccion IP.
    pause
    exit
)

echo.
set /p selected="Selecciona el numero de la IP a usar [1-!count!]: "

if "!ip%selected%!"=="" (
    echo ERROR: Seleccion invalida.
    pause
    exit
)

set "LOCAL_IP=!ip%selected%!"
set "LOCAL_IP=!LOCAL_IP: =!"
setx LOCAL_IP "%LOCAL_IP%"

echo.
echo OK: IP seleccionada: %LOCAL_IP%
echo.

REM Configurar variable de entorno para el servidor
setx SERVER_IP "%LOCAL_IP%" >nul

REM Verificar dependencias
echo [3/5] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo ERROR al instalar dependencias.
        pause
        exit
    )
    echo OK: Dependencias instaladas.
) else (
    echo OK: Dependencias listas.
)
echo.

REM Mostrar informacion
echo [4/5] Servidor listo.
echo.
echo ====================================
echo       SERVIDOR PREPARADO
echo ====================================
echo.
echo PARA ALUMNOS: http://%LOCAL_IP%:3000
echo PARA PROFESOR: http://%LOCAL_IP%:3000/admin
echo.
echo Los alumnos deben estar en la MISMA red WiFi.
echo.
pause

REM Iniciar servidor
echo [5/5] Iniciando servidor...
echo.
echo ====================================
echo    EdTech Mastery CORRIENDO
echo ====================================
echo.
echo Presiona Ctrl+C para detener.
echo.

node server.js

echo.
echo El servidor se detuvo.
pause
