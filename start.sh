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

# Obtener todas las IPs disponibles (excluyendo loopback)
ips=($(hostname -I))

if [ ${#ips[@]} -eq 0 ]; then
    LOCAL_IP="127.0.0.1"
    echo -e "${YELLOW}⚠️ No se detectó red local, usando localhost${NC}"
elif [ ${#ips[@]} -eq 1 ]; then
    LOCAL_IP=${ips[0]}
    echo -e "${GREEN}✅ IP detectada automáticamente:${NC} $LOCAL_IP"
else
    echo -e "${BLUE}Se detectaron múltiples direcciones IP. Selecciona la que usará la red local:${NC}"
    for i in "${!ips[@]}"; do
        echo -e "   $((i+1))) ${GREEN}${ips[$i]}${NC}"
    done
    
    while true; do
        read -p "Elige una opción (1-${#ips[@]}): " opt
        if [[ "$opt" =~ ^[0-9]+$ ]] && [ "$opt" -ge 1 ] && [ "$opt" -le "${#ips[@]}" ]; then
            LOCAL_IP=${ips[$((opt-1))]}
            break
        else
            echo -e "${RED}Opción inválida. Intenta de nuevo.${NC}"
        fi
    done
    echo -e "${GREEN}✅ Has seleccionado:${NC} $LOCAL_IP"
fi

# Exportar la IP para que el servidor Node.js la use
export SERVER_IP=$LOCAL_IP

# Iniciar el servidor
echo ""
echo -e "${YELLOW}[4/4]${NC} Preparando inicio..."
echo ""

ADMIN_URL="http://$LOCAL_IP:3000/admin"

# Intentar abrir el navegador en segundo plano después de un breve retraso
if command -v xdg-open &> /dev/null; then
    (sleep 2; xdg-open "$ADMIN_URL") &
elif command -v gnome-open &> /dev/null; then
    (sleep 2; gnome-open "$ADMIN_URL") &
elif command -v x-www-browser &> /dev/null; then
    (sleep 2; x-www-browser "$ADMIN_URL") &
fi

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  ✅ Servidor iniciando...${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${GREEN}📡 ACCESO PARA ALUMNOS (teléfonos):${NC}"
echo -e "   ${YELLOW}http://$LOCAL_IP:3000${NC}"
echo ""
echo -e "${GREEN}🖥️  PANEL DEL PROFESOR (abriendo...):${NC}"
echo -e "   ${YELLOW}$ADMIN_URL${NC}"
echo ""
echo -e "${YELLOW}💡${NC} Asegúrate de que los teléfonos estén en la MISMA red WiFi."
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
