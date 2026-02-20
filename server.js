/**
 * EdTech Mastery LAN Server
 * Servidor para juego educativo en red local
 * 
 * Uso: node server.js
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const ip = require('ip');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const TOPICS_FILE = path.join(__dirname, 'topics.json');
const CURSOS_DIR = path.join(__dirname, 'cursos');

// Asegurar que existe la carpeta de cursos
if (!fs.existsSync(CURSOS_DIR)) {
    fs.mkdirSync(CURSOS_DIR);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configuración de Gemini
let genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
let aiModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

function updateAIConfig(apiKey) {
    if (!apiKey || apiKey === 'tu_api_key_aqui') return false;
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        aiModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        process.env.GEMINI_API_KEY = apiKey;
        return true;
    } catch (e) {
        console.error('Error actualizando config AI:', e);
        return false;
    }
}

// Configuración del servidor
const PORT = process.env.PORT || 3000;
// Obtener todas las IPs disponibles
const networkInterfaces = require('os').networkInterfaces();
const availableIps = [];

Object.keys(networkInterfaces).forEach((iface) => {
    networkInterfaces[iface].forEach((details) => {
        if (details.family === 'IPv4' && !details.internal) {
            availableIps.push({
                address: details.address,
                interface: iface
            });
        }
    });
});

// Usar IP especificada por variable de entorno, o la primera detectada, o localhost
const LOCAL_IP = process.env.SERVER_IP || (availableIps.length > 0 ? availableIps[0].address : '127.0.0.1');

// Almacenar preguntas (se puede mover a archivo separado)
const questions = require('./public/js/questions.js');

// Estado del juego en memoria
let gameState = {
    status: 'lobby', // lobby, waiting_answer, revealed, ended
    currentQuestionIndex: 0,
    players: new Map(), // Map: socketId -> { id, name, specialty, score, answers: [] }
    currentAnswers: new Map(), // Map: socketId -> { answerIndex, timestamp }
    isGameStarted: false,
    currentQuestionStartTime: 0,
    sessionQuestions: [], // Preguntas seleccionadas para esta partida
    selectedCourse: null, // Nombre del archivo del curso seleccionado
    studentList: []       // Lista de alumnos del curso seleccionado
};

// Configurar Express para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ========================================
// Socket.io - Manejo de conexiones
// ========================================
io.on('connection', (socket) => {
    console.log(`Nueva conexión: ${socket.id}`);

    // Enviar curso actual si existe
    if (gameState.selectedCourse) {
        socket.emit('course-selected', {
            selectedCourse: gameState.selectedCourse,
            studentList: getAvailableStudents()
        });
    }

    // ----------------------------------------
    // Eventos del Cliente (Alumnos)
    // ----------------------------------------

    // Unirse al juego
    socket.on('join-game', (playerData) => {
        const { name, specialty } = playerData;

        if (!name || name.trim() === '') {
            socket.emit('error', { message: 'El nombre es obligatorio' });
            return;
        }

        // Verificar nombre duplicado
        const existingPlayer = Array.from(gameState.players.values())
            .find(p => p.name.toLowerCase() === name.toLowerCase());

        if (existingPlayer) {
            socket.emit('error', { message: 'Este nombre ya está en uso por otro participante' });
            return;
        }

        // Registrar jugador
        gameState.players.set(socket.id, {
            id: socket.id,
            name: name.trim(),
            specialty: specialty || 'No especificada',
            score: 0,
            streak: 0,
            bestStreak: 0,
            correctAnswers: 0,
            totalTime: 0,
            answers: []
        });

        socket.emit('join-success', {
            playerId: socket.id,
            playerName: name.trim()
        });

        // Notificar a todos los clientes更新列表
        io.emit('update-players', {
            players: getPlayersList(),
            count: gameState.players.size
        });

        // Actualizar lista de nombres disponibles para otros alumnos
        if (gameState.selectedCourse) {
            io.emit('course-selected', {
                selectedCourse: gameState.selectedCourse,
                studentList: getAvailableStudents()
            });
        }

        // Si el juego ya comenzó, enviar pregunta actual
        if (gameState.isGameStarted && gameState.status === 'waiting_answer') {
            const currentQ = gameState.sessionQuestions[gameState.currentQuestionIndex];
            if (currentQ) {
                socket.emit('new-question', {
                    questionIndex: gameState.currentQuestionIndex,
                    question: currentQ.question,
                    context: currentQ.context,
                    options: currentQ.options,
                    totalQuestions: gameState.sessionQuestions.length,
                    timeLeft: getRemainingTime()
                });
            }
        }

        console.log(`Jugador joined: ${name} (${specialty})`);
    });

    // Enviar respuesta
    socket.on('submit-answer', (data) => {
        const { answerIndex } = data;
        const player = gameState.players.get(socket.id);

        if (!player || gameState.status !== 'waiting_answer') {
            return;
        }

        // Verificar si ya respondió
        if (gameState.currentAnswers.has(socket.id)) {
            return;
        }

        const currentQ = gameState.sessionQuestions[gameState.currentQuestionIndex];
        const isCorrect = answerIndex === currentQ.correctIndex;
        const timestamp = Date.now();

        // Guardar respuesta
        gameState.currentAnswers.set(socket.id, {
            answerIndex,
            isCorrect,
            timestamp
        });

        // Actualizar estadísticas del jugador
        player.answers.push({
            questionIndex: gameState.currentQuestionIndex,
            answer: answerIndex,
            correct: isCorrect,
            timestamp
        });

        if (isCorrect) {
            player.correctAnswers++;
            player.streak++;
            if (player.streak > player.bestStreak) {
                player.bestStreak = player.streak;
            }

            // Calcular puntuación
            const timeBonus = Math.max(0, getRemainingTime()) * 2;
            const basePoints = 100;
            const streakBonus = player.streak >= 3 ? 1.2 : 1;
            const points = Math.round((basePoints + timeBonus) * streakBonus);
            player.score += points;
        } else {
            player.streak = 0;
        }

        // Confirmar respuesta al jugador
        socket.emit('answer-received', {
            correct: isCorrect,
            points: isCorrect ? Math.round((100 + Math.max(0, getRemainingTime()) * 2) * (player.streak >= 3 ? 1.2 : 1)) : 0,
            streak: player.streak,
            answeredCount: gameState.currentAnswers.size,
            totalPlayers: gameState.players.size
        });

        // Notificar al panel de control
        io.to('admin').emit('answer-submitted', {
            playerName: player.name,
            playerId: socket.id,
            isCorrect,
            answeredCount: gameState.currentAnswers.size,
            totalPlayers: gameState.players.size
        });
    });

    // ----------------------------------------
    // Eventos del Administrador (Profesor)
    // ----------------------------------------

    // Unirse como admin
    socket.on('admin-join', () => {
        socket.join('admin');
        console.log('Panel de administrador conectado');

        // Enviar estado actual
        socket.emit('admin-state', {
            status: gameState.status,
            currentQuestionIndex: gameState.currentQuestionIndex,
            totalQuestions: gameState.sessionQuestions.length,
            players: getPlayersList(),
            availableIps: availableIps,
            currentServerIp: LOCAL_IP,
            topicHistory: loadTopicHistory(),
            availableCourses: getAvailableCourses(),
            selectedCourse: gameState.selectedCourse,
            studentList: getAvailableStudents(),
            hasApiKey: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'tu_api_key_aqui'),
            question: gameState.status === 'waiting_answer' || gameState.status === 'revealed'
                ? getCurrentQuestionData()
                : null
        });
    });

    // Guardar API Key
    socket.on('admin-save-api-key', (data) => {
        const { apiKey } = data;
        if (updateAIConfig(apiKey)) {
            // Guardar en el archivo .env
            try {
                let envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
                if (envContent.includes('GEMINI_API_KEY=')) {
                    envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${apiKey}`);
                } else {
                    envContent += `\nGEMINI_API_KEY=${apiKey}\n`;
                }
                fs.writeFileSync(path.join(__dirname, '.env'), envContent);
                socket.emit('api-key-saved', { success: true });
                console.log('✅ API Key de Gemini actualizada y guardada en .env');
            } catch (err) {
                console.error('Error guardando .env:', err);
                socket.emit('api-key-saved', { success: false, error: 'Error al escribir el archivo .env' });
            }
        } else {
            socket.emit('api-key-saved', { success: false, error: 'API Key inválida' });
        }
    });

    // Seleccionar curso
    socket.on('admin-select-course', (data) => {
        const { courseId } = data;
        if (!courseId) {
            gameState.selectedCourse = null;
            gameState.studentList = [];
        } else {
            gameState.selectedCourse = courseId;
            gameState.studentList = loadCourseStudents(courseId);
        }

        // Notificar a todos (incluyendo alumnos para que refresquen su lista)
        io.emit('course-selected', {
            selectedCourse: gameState.selectedCourse,
            studentList: getAvailableStudents()
        });

        console.log(`Curso seleccionado: ${courseId || 'Ninguno'}. Alumnos: ${gameState.studentList.length}`);
    });

    // Iniciar juego
    socket.on('admin-start-game', (data) => {
        if (gameState.isGameStarted) return;

        const selectedCategory = data ? data.category : 'all';
        const requestedCount = data ? parseInt(data.count) || 10 : 10;

        // Filtrar preguntas según el tema elegido por el docente
        if (selectedCategory === 'all') {
            // Si no hay preguntas de sesión (IA), usar las por defecto barajadas
            if (gameState.sessionQuestions.length === 0) {
                gameState.sessionQuestions = shuffleArray([...questions]).slice(0, requestedCount);
            }
        } else if (selectedCategory === 'ai-custom') {
            // Validar que se hayan generado preguntas con IA antes de empezar
            if (gameState.sessionQuestions.length === 0) {
                socket.emit('error', { message: 'Primero debes generar las preguntas con IA' });
                return;
            }
        } else {
            // Tema fijo seleccionado + barajar y limitar
            const filtered = questions.filter(q => q.category === selectedCategory);
            gameState.sessionQuestions = shuffleArray(filtered).slice(0, requestedCount);
        }

        if (gameState.sessionQuestions.length === 0) {
            socket.emit('error', { message: 'No hay preguntas disponibles para este tema' });
            return;
        }

        // Guardar tema en el historial si es válido
        if (data.topic && data.topic !== 'all' && data.topic !== 'ai-custom') {
            saveTopicToHistory(data.topic);
            io.to('admin').emit('topic-history-updated', loadTopicHistory());
        }

        gameState.isGameStarted = true;
        gameState.status = 'waiting_answer';
        gameState.currentQuestionIndex = 0;
        gameState.currentAnswers.clear();

        // Reiniciar puntuaciones
        gameState.players.forEach(p => {
            p.score = 0;
            p.streak = 0;
            p.bestStreak = 0;
            p.correctAnswers = 0;
            p.answers = [];
        });

        io.emit('game-started');
        sendQuestion(0);

        console.log('Juego iniciado por administrador');
    });

    // Generar preguntas con IA
    socket.on('admin-generate-ai', async (data) => {
        const { topic } = data;
        const count = parseInt(data.count) || 5;

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'tu_api_key_aqui' || process.env.GEMINI_API_KEY === '') {
            socket.emit('ai-generated', {
                success: false,
                error: 'No se ha configurado la API Key de Gemini en el archivo .env'
            });
            return;
        }

        try {
            const prompt = `Actúa como un experto en educación y tecnología. Genera exactamente ${count} preguntas de opción múltiple sobre el tema: "${topic}". 
            Las preguntas deben ser desafiantes y educativas para docentes.
            Responde ÚNICAMENTE con un objeto JSON siguiendo exactamente este formato:
            {
              "questions": [
                {
                  "id": number,
                  "category": "${topic}",
                  "difficulty": "Media",
                  "question": "texto de la pregunta",
                  "context": "breve contexto o explicación previa",
                  "options": ["opción A", "opción B", "opción C", "opción D"],
                  "correctIndex": number (0-3),
                  "explanation": "explicación detallada de por qué es la correcta"
                }
              ]
            }`;

            const result = await aiModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Limpiar el texto de posibles bloques de código markdown
            const jsonStr = text.replace(/```json|```/g, '').trim();
            const aiData = JSON.parse(jsonStr);

            if (aiData.questions && aiData.questions.length > 0) {
                gameState.sessionQuestions = aiData.questions.map((q, idx) => ({
                    ...q,
                    id: idx + 100 // IDs para evitar choques con banco local
                }));

                // Guardar tema en el historial
                saveTopicToHistory(topic);
                const updatedHistory = loadTopicHistory();

                socket.emit('ai-generated', {
                    success: true,
                    topic: topic,
                    count: aiData.questions.length,
                    topicHistory: updatedHistory
                });
            } else {
                throw new Error('Formato de respuesta IA inválido');
            }

        } catch (error) {
            console.error('Error generando preguntas con IA:', error);
            socket.emit('ai-generated', {
                success: false,
                error: 'Error al generar preguntas: ' + error.message
            });
        }
    });

    // Siguiente pregunta
    socket.on('admin-next-question', () => {
        if (!gameState.isGameStarted) return;

        const nextIndex = gameState.currentQuestionIndex + 1;

        if (nextIndex >= gameState.sessionQuestions.length) {
            // Fin del juego
            endGame();
        } else {
            gameState.currentQuestionIndex = nextIndex;
            gameState.currentAnswers.clear();
            gameState.status = 'waiting_answer';
            sendQuestion(nextIndex);
        }
    });

    // Revelar respuesta
    socket.on('admin-reveal-answer', () => {
        if (gameState.status !== 'waiting_answer') return;

        gameState.status = 'revealed';
        const currentQ = gameState.sessionQuestions[gameState.currentQuestionIndex];

        // Enviar resultado a todos
        io.emit('reveal-answer', {
            correctIndex: currentQ.correctIndex,
            correctAnswer: currentQ.options[currentQ.correctIndex],
            explanation: currentQ.explanation,
            playerStats: getQuestionStats()
        });

        console.log(`Respuesta revelada: ${currentQ.options[currentQ.correctIndex]}`);
    });

    // Reiniciar juego
    socket.on('admin-restart', () => {
        gameState.isGameStarted = false;
        gameState.status = 'lobby';
        gameState.currentQuestionIndex = 0;
        gameState.currentAnswers.clear();
        gameState.players.clear();
        gameState.sessionQuestions = []; // Clear session questions on restart

        io.emit('game-restarted');
        io.emit('update-players', { players: [], count: 0 });

        console.log('Juego reiniciado');
    });

    // ----------------------------------------
    // Eventos de desconexión
    // ----------------------------------------

    socket.on('disconnect', () => {
        const player = gameState.players.get(socket.id);

        if (player) {
            console.log(`Jugador desconectado: ${player.name}`);
            gameState.players.delete(socket.id);
            gameState.currentAnswers.delete(socket.id);

            io.emit('update-players', {
                players: getPlayersList(),
                count: gameState.players.size
            });
        } else if (socket.rooms.has('admin')) {
            console.log('Administrador desconectado');
        }
    });
});

// ========================================
// Funciones auxiliares
// ========================================

function getPlayersList() {
    return Array.from(gameState.players.values())
        .map(p => ({
            id: p.id,
            name: p.name,
            specialty: p.specialty,
            score: p.score,
            correctAnswers: p.correctAnswers
        }))
        .sort((a, b) => b.score - a.score);
}

function sendQuestion(index) {
    const question = gameState.sessionQuestions[index];
    if (!question) return;

    const startTime = Date.now();
    gameState.currentQuestionStartTime = startTime;

    // Notificar a todos los clientes
    io.emit('new-question', {
        questionIndex: index,
        question: question.question,
        context: question.context,
        options: question.options,
        category: question.category,
        difficulty: question.difficulty,
        totalQuestions: gameState.sessionQuestions.length,
        timeLeft: 30
    });

    // Iniciar temporizador en servidor
    let timeLeft = 30;
    const timerInterval = setInterval(() => {
        if (gameState.status !== 'waiting_answer' ||
            gameState.currentQuestionIndex !== index ||
            timeLeft <= 0) {
            clearInterval(timerInterval);
            return;
        }

        io.emit('timer-update', { timeLeft });
        timeLeft--;

        if (timeLeft <= 0) {
            // Tiempo agotado
            io.emit('time-up');
        }
    }, 1000);

    console.log(`Enviando pregunta ${index + 1}: ${question.question.substring(0, 50)}...`);
}

function getRemainingTime() {
    if (gameState.currentQuestionStartTime === 0) return 30;
    const elapsed = Math.floor((Date.now() - gameState.currentQuestionStartTime) / 1000);
    return Math.max(0, 30 - elapsed);
}

function getCurrentQuestionData() {
    const question = gameState.sessionQuestions[gameState.currentQuestionIndex];
    if (!question) return null;

    return {
        question: question.question,
        context: question.context,
        options: question.options,
        correctIndex: question.correctIndex
    };
}

function getQuestionStats() {
    const stats = {
        totalResponses: gameState.currentAnswers.size,
        correctCount: 0,
        wrongCount: 0,
        answerDistribution: [0, 0, 0, 0] // Distribución de respuestas A, B, C, D
    };

    gameState.currentAnswers.forEach((answer, socketId) => {
        if (answer.isCorrect) {
            stats.correctCount++;
        } else {
            stats.wrongCount++;
        }
        if (answer.answerIndex >= 0 && answer.answerIndex < 4) {
            stats.answerDistribution[answer.answerIndex]++;
        }
    });

    return stats;
}

function endGame() {
    gameState.status = 'ended';

    const finalResults = {
        players: getPlayersList(),
        totalQuestions: gameState.sessionQuestions.length,
        categoryStats: calculateCategoryStats()
    };

    io.emit('game-ended', finalResults);
    io.to('admin').emit('final-results', finalResults);

    console.log('Juego finalizado');
}

function calculateCategoryStats() {
    const categories = {};

    gameState.sessionQuestions.forEach(q => {
        if (!categories[q.category]) {
            categories[q.category] = { total: 0, correct: 0 };
        }
        categories[q.category].total++;
    });

    // Calcular aciertos por categoría
    gameState.players.forEach(player => {
        player.answers.forEach(answer => {
            const q = gameState.sessionQuestions[answer.questionIndex];
            if (q && answer.correct) {
                categories[q.category].correct++;
            }
        });
    });

    return categories;
}

function loadTopicHistory() {
    try {
        if (fs.existsSync(TOPICS_FILE)) {
            const data = fs.readFileSync(TOPICS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading topics:', error);
    }
    // Temas por defecto si no hay archivo
    return [
        'Pedagogía Digital',
        'Competencias Digitales Docentes',
        'Herramientas Tecnológicas',
        'Tendencias Actuales'
    ];
}

function saveTopicToHistory(topic) {
    if (!topic || topic === 'all' || topic === 'ai-custom' || topic.trim() === '') return;

    let topics = loadTopicHistory();
    const normalizedTopic = topic.trim();

    // Evitar duplicados (case insensitive)
    const exists = topics.some(t => t.toLowerCase() === normalizedTopic.toLowerCase());

    if (!exists) {
        topics.unshift(normalizedTopic);
        // Limitar a los últimos 20 temas para no sobrecargar
        if (topics.length > 20) topics = topics.slice(0, 20);

        try {
            fs.writeFileSync(TOPICS_FILE, JSON.stringify(topics, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving topics:', error);
        }
    }
    return false;
}

// ========================================
// Utilidades
// ========================================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getAvailableCourses() {
    try {
        if (!fs.existsSync(CURSOS_DIR)) return [];
        return fs.readdirSync(CURSOS_DIR)
            .filter(file => file.endsWith('.xlsx'))
            .map(file => ({
                id: file,
                name: file.replace('.xlsx', '')
            }));
    } catch (error) {
        console.error('Error listing courses:', error);
        return [];
    }
}

function loadCourseStudents(fileName) {
    try {
        const filePath = path.join(CURSOS_DIR, fileName);
        if (!fs.existsSync(filePath)) return [];

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Intentar encontrar una columna con nombres o combinar First/Last Name
        return data.map(row => {
            const keys = Object.keys(row);
            const getVal = (key) => row[key] ? row[key].toString().trim() : '';

            // 1. Caso: Columnas separadas de Nombre y Apellido (Inglés o Español)
            const firstNameKey = keys.find(k => ['first name', 'nombre', 'nombres', 'name'].includes(k.toLowerCase().trim()));
            const lastNameKey = keys.find(k => ['last name', 'apellido', 'apellidos', 'lastname', 'surname'].includes(k.toLowerCase().trim()));

            if (firstNameKey && lastNameKey && firstNameKey !== lastNameKey) {
                return `${getVal(firstNameKey)} ${getVal(lastNameKey)}`.trim();
            }

            // 2. Caso: Columna única de nombre completo
            const nameKey = keys.find(key => {
                const k = key.toLowerCase().trim();
                return ['full name', 'nombre completo', 'alumno', 'estudiante', 'nombre', 'nombres', 'estudiantes', 'alumnos'].includes(k);
            });

            if (nameKey) {
                return getVal(nameKey);
            }

            // 3. Fallback: Si solo hay una columna de datos, usarla
            if (keys.length === 1) {
                return getVal(keys[0]);
            }

            return null;
        }).filter(name => name !== null && name !== '');
    } catch (error) {
        console.error('Error loading students:', error);
        return [];
    }
}

function getAvailableStudents() {
    if (!gameState.selectedCourse || !gameState.studentList) return [];
    const takenNames = Array.from(gameState.players.values()).map(p => p.name.toLowerCase());
    return gameState.studentList.filter(name => !takenNames.includes(name.toLowerCase()));
}

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(60));
    console.log('🎓 EdTech Mastery - Servidor LAN');
    console.log('='.repeat(60));
    console.log(`\n📡 Servidor iniciado en:`);
    console.log(`   • Red local: http://${LOCAL_IP}:${PORT}`);
    console.log(`   • Localhost: http://localhost:${PORT}`);
    console.log(`\n📱 Para alumnos (teléfonos):`);
    console.log(`   http://${LOCAL_IP}:${PORT}`);
    console.log(`\n🖥️  Panel del profesor:`);
    console.log(`   http://${LOCAL_IP}:${PORT}/admin`);
    console.log('\n' + '='.repeat(60) + '\n');
});

// Manejo de errores
process.on('uncaughtException', (err) => {
    console.error('Error no manejado:', err);
});

process.on('SIGINT', () => {
    console.log('\n⏹️  Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado');
        process.exit(0);
    });
});
