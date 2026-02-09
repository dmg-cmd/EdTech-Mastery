#!/bin/bash

# ================================================
#   EdTech Mastery - Script de Inicio (Linux)
# ================================================

# Cambiar al directorio del script
cd "$(dirname "$0")"

# Colores para la salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  🎓 EdTech Mastery - Inicio del Servidor${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Verificar si Node.js está instalado
echo -e "${YELLOW}[1/4]${NC} Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ ERROR:${NC} Node.js no está instalado."
    echo ""
    echo "Por favor, instala Node.js ejecutando:"
    echo "  sudo apt update && sudo apt install nodejs npm"
    echo ""
    echo "O descarga desde: https://nodejs.org/es/download/"
    echo ""
    read -p "Presiona Enter para salir..."
    exit 1
fi
echo -e "${GREEN}✅ Node.js detectado:${NC} $(node --version)"

# Verificar e instalar dependencias
echo ""
echo -e "${YELLOW}[2/4]${NC} Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦${NC} Instalando dependencias..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ ERROR al instalar dependencias${NC}"
        read -p "Presiona Enter para salir..."
        exit 1
    fi
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
else
    echo -e "${GREEN}✅ Dependencias ya instaladas${NC}"
fi

# Obtener dirección IP local
echo ""
echo -e "${YELLOW}[3/4]${NC} Detectando red local..."
LOCAL_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
fi
echo -e "${GREEN}✅ IP detectada:${NC} $LOCAL_IP"

# Iniciar el servidor
echo ""
echo -e "${YELLOW}[4/4]${NC} Iniciando servidor..."
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  ✅ Servidor listo${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${GREEN}📡 ACCESO PARA ALUMNOS (teléfonos):${NC}"
echo "   http://$LOCAL_IP:3000"
echo ""
echo -e "${GREEN}🖥️  PANEL DEL PROFESOR:${NC}"
echo "   http://$LOCAL_IP:3000/admin"
echo ""
echo -e "${YELLOW}💡${NC} Los alumnos deben conectarse a la misma red WiFi"
echo "   y escanear el código QR que aparecerá en el panel."
echo ""
echo -e "${BLUE}================================================${NC}"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""

# Ejecutar el servidor
node server.js

# Si el servidor se detiene, esperar antes de cerrar
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ El servidor encontró un error.${NC}"
    read -p "Presiona Enter para salir..."
fi
