# 🎓 EdTech Mastery - Sistema de Diagnóstico LAN

Sistema de juego educativo en tiempo real para red local (LAN) diseñado para el **Taller de Tecnología Educativa**. Permite que los alumnos participen con sus teléfonos móviles mientras el profesor controla el juego desde su computadora.

## 📋 Características

- 🎮 **Multijugador Real-Time**: Hasta 100+ alumnos simultáneos.
- ✨ **Modo IA**: Generación dinámica de preguntas sobre cualquier tema usando Google Gemini.
- 📊 **Resultados**: Exportación de resultados y análisis de competencias.
- 📱 **QR Login**: Conexión instantánea sin necesidad de instalar apps.
- 📡 **LAN Ready**: Funciona en redes locales sin necesidad de internet (excepto para el Modo IA).

## 🛠️ Requisitos e Instalación

1. **Node.js**: Asegúrate de tener instalado Node.js (v16+).
2. **Dependencias**:
   ```bash
   npm install
   ```
3. **Modo IA (Opcional)**:
   - Crea un archivo `.env` en la raíz (puedes usar el ejemplo proporcionado).
   - Consigue tu API KEY gratuita en [Google AI Studio](https://aistudio.google.com/app/apikey).
   - Añádela: `GEMINI_API_KEY=tu_api_key`

## 📁 Estructura del Proyecto

```
edtech-mastery-lan/
├── package.json              # Dependencias del proyecto
├── server.js                 # Servidor Node.js con Socket.io
├── start.bat                 # Script de inicio para Windows
├── start.sh                  # Script de inicio para Linux/Mac
└── public/
    ├── index.html            # Interfaz del alumno (móvil)
    ├── admin.html            # Panel del profesor
    ├── css/
    │   ├── admin.css         # Estilos del panel
    │   └── client.css        # Estilos del cliente móvil
    └── js/
        ├── questions.js      # Banco de preguntas
        ├── client.js         # Lógica del cliente
        └── admin.js          # Lógica del administrador
```

## 🚀 Instalación y Ejecución

### Prerrequisitos

- **Node.js** versión 14 o superior
- Conexión a red local (WiFi)

### Windows

1. Abre la carpeta `edtech-mastery-lan`
2. Haz **doble clic** en `start.bat`
3. El servidor iniciará y mostrará la dirección IP

### Linux/Mac

1. Abre una terminal en la carpeta `edtech-mastery-lan`
2. Ejecuta:
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

### Desde la terminal (cualquier sistema)

```bash
cd edtech-mastery-lan
npm install  # Solo la primera vez
npm start
```

## 📱 Cómo Usar

### 1. Iniciar el Servidor (Profesor)

1. Ejecuta `start.bat` (Windows) o `./start.sh` (Linux/Mac)
2. El servidor mostrará:
   - **URL para alumnos**: `http://192.168.X.X:3000`
   - **URL del panel**: `http://192.168.X.X:3000/admin`
3. El código QR se mostrará automáticamente en el panel del profesor

### 2. Conectar Alumnos

1. Los alumnos escanean el código QR con su teléfono
2. O pueden acceder directamente a `http://[IP-DEL-PROFESOR]:3000`
3. Ingresan su nombre y especialidad
4. Esperan a que inicie el juego

### 3. Control del Juego (Profesor)

1. Abre el panel en `http://[IP]:3000/admin`
2. Espera a que todos los alumnos se conecten
3. Clic en **"Iniciar Juego"**
4. Las preguntas aparecerán en los teléfonos de los alumnos
5. Observa las respuestas en tiempo real
6. Clic en **"Revelar Respuesta"** para mostrar el resultado
7. Clic en **"Siguiente Pregunta"** para continuar

### 4. Ver Resultados

Al finalizar todas las preguntas, se mostrarán:
- Clasificación final
- Estadísticas por categoría
- Recomendaciones personalizadas

## 🔧 Solución de Problemas

### El servidor no inicia

```bash
# Verificar Node.js
node --version

# Si no está instalado, descarga desde:
# https://nodejs.org/es/download/
```

### Los teléfonos no pueden conectarse

1. Verifica que estén en la **misma red WiFi** que el profesor
2. Verifica que el firewall no bloquee el puerto 3000
3. Comprueba la IP mostrada en la consola del servidor

### El código QR no aparece

1. Abre el panel del profesor: `http://[IP]:3000/admin`
2. Verifica que el navegador tenga conexión a internet (para cargar la biblioteca QR)
3. Alternativamente, usa directamente la URL mostrada

### Error de conexión

```bash
# En Windows, verificar el firewall:
# Panel de Control > Sistema y seguridad > Firewall de Windows
# Permite la aplicación "Node.js" o el puerto 3000
```

## 📊 Preguntas Incluidas

El banco de preguntas incluye 23 ítems de opción múltiple sobre:

| Categoría | Descripción | Dificultad |
|-----------|-------------|------------|
| Pedagogía Digital | TPACK, SAMR, constructivismo | Básico-Intermedio |
| Competencias Docentes | DigCompEdu, seguridad, REA | Básico-Intermedio |
| Herramientas | LMS, Kahoot, Google Workspace | Intermedio |
| Tendencias | IA, gamificación, VR, MOOCs | Básico-Intermedio |

## 🔐 Seguridad

- El servidor funciona solo en tu red local
- No se envía datos a servidores externos
- Los datos se almacenan únicamente en memoria RAM

## 📝 Personalización

### Agregar/Modificar Preguntas

Edita el archivo `public/js/questions.js`:

```javascript
{
    id: 24,
    category: "Tu Categoría",
    difficulty: "básico",
    question: "Tu pregunta aquí",
    context: "Contexto opcional",
    options: ["A", "B", "C", "D"],
    correctIndex: 0,  // 0=A, 1=B, 2=C, 3=D
    explanation: "Explicación de la respuesta"
}
```

### Cambiar Tiempo por Pregunta

Edita `server.js` línea ~260:

```javascript
let timeLeft = 30;  // Segundos
```

## 📄 Licencia

Este proyecto es de uso educativo gratuito.

---

**Desarrollado con ❤️ para docentes**
