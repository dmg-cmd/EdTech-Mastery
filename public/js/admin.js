/**
 * EdTech Mastery LAN - Panel de Administración (Profesor)
 * Maneja la lógica del servidor, estadísticas y control del juego
 */

class EdTechAdmin {
    constructor() {
        this.socket = null;
        this.gameStatus = 'lobby';
        this.currentQuestionIndex = 0;
        this.totalQuestions = 10;
        this.serverIp = '';
        this.serverPort = 3000;

        this.initElements();
        this.initEventListeners();
        this.connect();
    }

    // ========================================
    // Inicialización de Elementos del DOM
    // ========================================
    initElements() {
        // Vistas
        this.views = {
            lobby: document.getElementById('lobby-view'),
            game: document.getElementById('game-view'),
            results: document.getElementById('results-view')
        };

        // Elementos de lobby
        this.connectionUrl = document.getElementById('connection-url');
        this.qrCanvas = document.getElementById('qr-canvas');
        this.directLink = document.getElementById('direct-link');
        this.roomCode = document.getElementById('room-code');
        this.playersList = document.getElementById('players-list');
        this.playerCountEl = document.getElementById('player-count');
        this.btnStartGame = document.getElementById('btn-start-game');

        // Elementos de juego
        this.questionNumberEl = document.getElementById('question-number');
        this.timerDisplayEl = document.getElementById('timer-display');
        this.questionCategoryEl = document.getElementById('question-category');
        this.questionTextEl = document.getElementById('question-text');
        this.questionContextEl = document.getElementById('question-context');
        this.answeredCountEl = document.getElementById('answered-count');
        this.pendingCountEl = document.getElementById('pending-count');
        this.leaderboardPreview = document.getElementById('leaderboard-preview');
        this.answerRevealPanel = document.getElementById('answer-reveal');
        this.correctOptionEl = document.getElementById('correct-option');
        this.revealExplanationEl = document.getElementById('reveal-explanation');
        this.revealCorrectEl = document.getElementById('reveal-correct');
        this.revealWrongEl = document.getElementById('reveal-wrong');

        // Botones de control
        this.btnReveal = document.getElementById('btn-reveal');
        this.btnNext = document.getElementById('btn-next');

        // Elementos de resultados
        this.winnerNameEl = document.getElementById('winner-name');
        this.winnerScoreEl = document.getElementById('winner-score');
        this.totalPlayersEl = document.getElementById('total-players');
        this.avgScoreEl = document.getElementById('avg-score');
        this.avgCorrectEl = document.getElementById('avg-correct');
        this.finalLeaderboardBody = document.getElementById('final-leaderboard-body');
        this.categoryBarsEl = document.getElementById('category-bars');
        this.btnExportResults = document.getElementById('btn-export-results');
        this.btnRestartGame = document.getElementById('btn-restart-game');

        // Barra de estado
        this.gameStatusEl = document.querySelector('.game-status');
        this.gameStatusText = this.gameStatusEl.querySelector('.status-text');
    }

    // ========================================
    // Inicialización de Event Listeners
    // ========================================
    initEventListeners() {
        this.btnStartGame.addEventListener('click', () => this.startGame());
        this.btnReveal.addEventListener('click', () => this.revealAnswer());
        this.btnNext.addEventListener('click', () => this.nextQuestion());
        this.btnExportResults.addEventListener('click', () => this.exportResults());
        this.btnRestartGame.addEventListener('click', () => this.restartGame());
    }

    // ========================================
    // Conexión al Servidor
    // ========================================
    connect() {
        // Conectar como admin
        this.socket = io({
            reconnection: true
        });

        this.socket.on('connect', () => {
            console.log('Conectado como administrador');
            this.socket.emit('admin-join');
            // Generar QR después de conectarse
            this.generateQRCode();
        });

        this.socket.on('disconnect', () => {
            console.log('Desconectado del servidor');
        });

        // Eventos del juego
        this.socket.on('admin-state', (data) => {
            this.onAdminState(data);
        });

        this.socket.on('update-players', (data) => {
            this.updatePlayersList(data.players);
            this.playerCountEl.textContent = data.count;
            this.updateAnswerCounts();
        });

        this.socket.on('game-started', () => {
            this.onGameStarted();
        });

        this.socket.on('new-question', (data) => {
            this.onNewQuestion(data);
        });

        this.socket.on('timer-update', (data) => {
            this.timerDisplayEl.textContent = `${data.timeLeft}s`;
        });

        this.socket.on('answer-submitted', (data) => {
            this.updateAnswerCounts();
            this.updateLeaderboardPreview();
            this.updateChartBars();
        });

        this.socket.on('reveal-answer', (data) => {
            this.onRevealAnswer(data);
        });

        this.socket.on('game-ended', (data) => {
            this.onGameEnded(data);
        });

        this.socket.on('final-results', (data) => {
            this.showFinalResults(data);
        });
    }

    // ========================================
    // Funciones de Lobby
    // ========================================
    generateQRCode() {
        // Obtener IP del servidor
        this.serverIp = window.location.hostname;
        this.serverPort = window.location.port || 3000;
        
        const url = `http://${this.serverIp}:${this.serverPort}`;
        this.connectionUrl.textContent = url;
        
        // Actualizar también el enlace directo
        if (this.directLink) {
            this.directLink.textContent = url;
            this.directLink.href = url;
        }

        // Generar código QR
        SimpleQR.toCanvas(this.qrCanvas, url, {
            width: 250,
            margin: 2,
            color: {
                dark: '#1e293b',
                light: '#ffffff'
            }
        }, (error) => {
            if (error) {
                console.error('Error generando QR:', error);
            }
        });

        // Generar código de acceso
        this.roomCode.textContent = this.generateRoomCode();
    }

    generateRoomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    updatePlayersList(players) {
        if (players.length === 0) {
            this.playersList.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🔍</span>
                    <p>Esperando jugadores...</p>
                </div>
            `;
            this.btnStartGame.disabled = true;
            return;
        }

        this.playersList.innerHTML = players.map((player, index) => `
            <div class="player-item" style="animation-delay: ${index * 0.05}s">
                <div class="player-avatar">${player.name.charAt(0).toUpperCase()}</div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-specialty">${player.specialty}</div>
                </div>
                <div style="font-weight: 600; color: var(--primary);">${player.score} pts</div>
            </div>
        `).join('');

        this.btnStartGame.disabled = false;
    }

    // ========================================
    // Control del Juego
    // ========================================
    startGame() {
        this.socket.emit('admin-start-game');
    }

    onGameStarted() {
        this.showView('game');
        this.updateGameStatus('En Juego');
        this.gameStatus = 'playing';
    }

    onNewQuestion(data) {
        this.currentQuestionIndex = data.questionIndex;
        this.totalQuestions = 10;

        // Ocultar panel de respuesta
        this.answerRevealPanel.classList.remove('active');

        // Actualizar número de pregunta
        this.questionNumberEl.textContent = `Pregunta ${this.currentQuestionIndex + 1}/${this.totalQuestions}`;

        // Mostrar pregunta
        this.questionCategoryEl.textContent = data.category || 'General';
        this.questionTextEl.textContent = data.question;
        this.questionContextEl.textContent = data.context || '';
        this.questionContextEl.style.display = data.context ? 'block' : 'none';

        // Resetear barras de respuesta
        for (let i = 0; i < 4; i++) {
            document.getElementById(`bar-${i}`).style.width = '0%';
            document.getElementById(`count-${i}`).textContent = '0';
        }

        // Actualizarcontador
        this.updateAnswerCounts();
        this.updateLeaderboardPreview();
    }

    updateAnswerCounts() {
        const answered = parseInt(this.answeredCountEl.textContent.split('/')[0]) || 0;
        const total = parseInt(this.playerCountEl.textContent);
        const pending = total - answered;
        this.pendingCountEl.textContent = pending;
    }

    updateLeaderboardPreview() {
        const players = Array.from(document.querySelectorAll('.player-item'))
            .map(item => ({
                name: item.querySelector('.player-name').textContent,
                score: parseInt(item.querySelector('div:last-child').textContent) || 0
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        if (players.length === 0) {
            this.leaderboardPreview.innerHTML = '<li class="empty">Esperando...</li>';
            return;
        }

        this.leaderboardPreview.innerHTML = players.map((p, i) => `
            <li>${i + 1}. ${p.name} (${p.score})</li>
        `).join('');
    }

    updateChartBars() {
        // Las barras se actualizan en tiempo real cuando llegan respuestas
        // Esto se maneja en answer-submitted
    }

    revealAnswer() {
        this.socket.emit('admin-reveal-answer');
    }

    onRevealAnswer(data) {
        // Mostrar respuesta correcta
        const options = ['A', 'B', 'C', 'D'];
        this.correctOptionEl.textContent = options[data.correctIndex];
        this.revealExplanationEl.textContent = data.explanation;
        this.revealCorrectEl.textContent = data.playerStats.correctCount;
        this.revealWrongEl.textContent = data.playerStats.wrongCount;

        // Actualizar barras finales
        const total = data.playerStats.totalResponses || 1;
        data.playerStats.answerDistribution.forEach((count, index) => {
            const percentage = (count / total) * 100;
            const bar = document.getElementById(`bar-${index}`);
            const countEl = document.getElementById(`count-${index}`);
            
            bar.style.width = `${percentage}%`;
            bar.style.background = index === data.correctIndex ? 'var(--accent)' : 'var(--primary)';
            countEl.textContent = count;
        });

        this.answerRevealPanel.classList.add('active');
    }

    nextQuestion() {
        this.socket.emit('admin-next-question');
    }

    // ========================================
    // Resultados Finales
    // ========================================
    onGameEnded(data) {
        this.showFinalResults(data);
        this.showView('results');
        this.updateGameStatus('Finalizado');
    }

    showFinalResults(data) {
        const players = data.players;

        // Encontrar ganador
        if (players.length > 0) {
            const winner = players[0];
            this.winnerNameEl.textContent = winner.name;
            this.winnerScoreEl.textContent = `${winner.score} puntos`;
        }

        // Estadísticas generales
        this.totalPlayersEl.textContent = players.length;
        const avgScore = Math.round(players.reduce((a, b) => a + b.score, 0) / players.length);
        this.avgScoreEl.textContent = avgScore;
        const avgCorrect = Math.round(players.reduce((a, b) => a + b.correctAnswers, 0) / players.length);
        this.avgCorrectEl.textContent = `${avgCorrect}/${data.totalQuestions}`;

        // Tabla de clasificación
        this.finalLeaderboardBody.innerHTML = players.map((player, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${player.name}</td>
                <td>${player.specialty}</td>
                <td>${player.correctAnswers}/${data.totalQuestions}</td>
                <td><strong>${player.score}</strong></td>
            </tr>
        `).join('');

        // Estadísticas por categoría
        this.renderCategoryStats(data.categoryStats);
    }

    renderCategoryStats(categoryStats) {
        this.categoryBarsEl.innerHTML = '';

        Object.entries(categoryStats).forEach(([category, stats]) => {
            const percentage = Math.round((stats.correct / stats.total) * 100);
            const color = percentage >= 70 ? 'var(--accent)' : percentage >= 40 ? 'var(--warning)' : 'var(--danger)';

            const barItem = document.createElement('div');
            barItem.className = 'category-bar-item';
            barItem.innerHTML = `
                <span class="category-bar-label">${category}</span>
                <div class="category-bar-container">
                    <div class="category-bar-fill" style="width: ${percentage}%; background: ${color}"></div>
                </div>
                <span class="category-bar-value">${percentage}%</span>
            `;
            this.categoryBarsEl.appendChild(barItem);
        });
    }

    exportResults() {
        const data = {
            fecha: new Date().toLocaleString(),
            juego: 'EdTech Mastery',
            totalParticipantes: parseInt(this.totalPlayersEl.textContent),
            promedioPuntuacion: this.avgScoreEl.textContent,
            promedioAciertos: this.avgCorrectEl.textContent
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resultados-edtech-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    restartGame() {
        this.socket.emit('admin-restart');
        this.showView('lobby');
        this.updateGameStatus('En Lobby');
        this.gameStatus = 'lobby';
        this.answerRevealPanel.classList.remove('active');
    }

    // ========================================
    // Utilidades de UI
    // ========================================
    showView(viewName) {
        Object.values(this.views).forEach(view => {
            view.classList.remove('active');
        });
        this.views[viewName].classList.add('active');
    }

    onAdminState(data) {
        if (data.status === 'ended' || data.status === 'revealed') {
            this.showView('results');
            this.updateGameStatus('Finalizado');
        } else if (data.status === 'waiting_answer' || data.status === 'playing') {
            this.showView('game');
            this.updateGameStatus('En Juego');
            this.gameStatus = 'playing';
            this.currentQuestionIndex = data.currentQuestionIndex;
        } else {
            this.showView('lobby');
            this.updateGameStatus('En Lobby');
            this.gameStatus = 'lobby';
        }

        this.updatePlayersList(data.players || []);
        
        // Regenerar QR code para asegurar IP correcta
        this.generateQRCode();
    }

    updateGameStatus(status) {
        this.gameStatusText.textContent = status;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.edTechAdmin = new EdTechAdmin();
});
