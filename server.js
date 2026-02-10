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

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configuración del servidor
const PORT = process.env.PORT || 3000;
// Usar IP especificada por变量 de entorno, o detectar automáticamente
const LOCAL_IP = process.env.SERVER_IP || ip.address();

// Almacenar preguntas (se puede mover a archivo separado)
const questions = require('./public/js/questions.js');

// Estado del juego en memoria
let gameState = {
    status: 'lobby', // lobby, waiting_answer, revealed, ended
    currentQuestionIndex: 0,
    players: new Map(), // Map: socketId -> { id, name, specialty, score, answers: [] }
    currentAnswers: new Map(), // Map: socketId -> { answerIndex, timestamp }
    isGameStarted: false
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
        
        if (existingPlayer && gameState.isGameStarted) {
            socket.emit('error', { message: 'Ya hay un jugador con ese nombre en la partida actual' });
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

        // Si el juego ya comenzó, enviar pregunta actual
        if (gameState.isGameStarted && gameState.status === 'waiting_answer') {
            const currentQ = questions[gameState.currentQuestionIndex];
            if (currentQ) {
                socket.emit('new-question', {
                    questionIndex: gameState.currentQuestionIndex,
                    question: currentQ.question,
                    context: currentQ.context,
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

        const currentQ = questions[gameState.currentQuestionIndex];
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
            players: getPlayersList(),
            question: gameState.status === 'waiting_answer' || gameState.status === 'revealed' 
                ? getCurrentQuestionData() 
                : null
        });
    });

    // Iniciar juego
    socket.on('admin-start-game', () => {
        if (gameState.isGameStarted) return;
        
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

    // Siguiente pregunta
    socket.on('admin-next-question', () => {
        if (!gameState.isGameStarted) return;

        const nextIndex = gameState.currentQuestionIndex + 1;
        
        if (nextIndex >= questions.length) {
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
        const currentQ = questions[gameState.currentQuestionIndex];

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
    const question = questions[index];
    if (!question) return;

    const startTime = Date.now();
    
    // Notificar a todos los clientes
    io.emit('new-question', {
        questionIndex: index,
        question: question.question,
        context: question.context,
        category: question.category,
        difficulty: question.difficulty,
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
    // Tiempo restante estimado basado en cuando se inició la pregunta
    return Math.max(0, 30 - Math.floor((Date.now() - (Date.now() % 1000)) / 1000) % 31);
}

function getCurrentQuestionData() {
    const question = questions[gameState.currentQuestionIndex];
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
        totalQuestions: questions.length,
        categoryStats: calculateCategoryStats()
    };

    io.emit('game-ended', finalResults);
    io.to('admin').emit('final-results', finalResults);

    console.log('Juego finalizado');
}

function calculateCategoryStats() {
    const categories = {};
    
    questions.forEach(q => {
        if (!categories[q.category]) {
            categories[q.category] = { total: 0, correct: 0 };
        }
        categories[q.category].total++;
    });

    // Calcular aciertos por categoría
    gameState.players.forEach(player => {
        player.answers.forEach(answer => {
            const q = questions[answer.questionIndex];
            if (q && answer.correct) {
                categories[q.category].correct++;
            }
        });
    });

    return categories;
}

// ========================================
// Iniciar servidor
// ========================================
server.listen(PORT, () => {
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
