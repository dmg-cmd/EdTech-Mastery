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
        this.btnStartGame = document.getElementById('btn-start-game');
        this.quizTopicInput = document.getElementById('quiz-topic');
        this.topicHistoryList = document.getElementById('topic-history-list');
        this.courseSelect = document.getElementById('course-select');
        this.playersList = document.getElementById('players-list');
        this.playerCountEl = document.getElementById('player-count');

        // Elementos de selección de IP
        this.ipSelectorContainer = document.getElementById('ip-selector-container');
        this.ipSelect = document.getElementById('ip-select');

        // AI Panel Elements
        this.aiPanel = document.getElementById('ai-generator-panel');
        this.aiTopicInput = document.getElementById('ai-topic');
        this.aiCountInput = document.getElementById('ai-question-count');
        this.btnGenerateAI = document.getElementById('btn-generate-ai');
        this.aiStatus = document.getElementById('ai-status');

        // Question count panel (regular)
        this.bankCountSelector = document.getElementById('bank-count-selector');
        this.questionCountInput = document.getElementById('question-count');
        this.maxQuestionsHint = document.getElementById('max-questions-hint');

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

        // Modales de ayuda
        this.apiHelpModal = document.getElementById('api-help-modal');
        this.linkApiHelp = document.getElementById('link-api-help');
        this.btnCloseHelp = document.getElementById('btn-close-help');
        this.btnCloseApiIcon = document.getElementById('close-api-help');
        this.btnGoToConfig = document.getElementById('btn-go-to-config');

        // Modal de Configuración API (Nuevo)
        this.apiConfigModal = document.getElementById('api-config-modal');
        this.apiKeyInput = document.getElementById('api-key-input');
        this.btnSaveApiKey = document.getElementById('btn-save-api-key');
        this.btnShowHelp = document.getElementById('btn-show-help');
        this.btnCloseApiConfig = document.getElementById('close-api-config');

        this.hasApiKey = false;
    }

    // ========================================
    // Inicialización de Event Listeners
    // ========================================
    initEventListeners() {
        if (this.btnStartGame) this.btnStartGame.addEventListener('click', () => this.startGame());
        if (this.btnReveal) this.btnReveal.addEventListener('click', () => this.revealAnswer());
        if (this.btnNext) this.btnNext.addEventListener('click', () => this.nextQuestion());
        if (this.btnExportResults) this.btnExportResults.addEventListener('click', () => this.exportResults());
        if (this.btnRestartGame) this.btnRestartGame.addEventListener('click', () => this.restartGame());

        // Lógica de Temas y Historial
        if (this.quizTopicInput) {
            this.quizTopicInput.addEventListener('input', () => {
                const topic = this.quizTopicInput.value.trim();
                const baseCategories = [
                    'Pedagogía Digital',
                    'Competencias Digitales Docentes',
                    'Herramientas Tecnológicas',
                    'Tendencias Actuales',
                    'all'
                ];

                // Si no coincide con categorías base, mostrar panel IA
                const isBaseCategory = baseCategories.some(c => c.toLowerCase() === topic.toLowerCase());

                if (topic !== '' && !isBaseCategory) {
                    this.aiPanel.style.display = 'block';
                    this.bankCountSelector.style.display = 'none';
                    // Sincronizar con el input oculto de la IA si aún existe
                    if (this.aiTopicInput) this.aiTopicInput.value = topic;
                } else {
                    this.aiPanel.style.display = 'none';
                    this.bankCountSelector.style.display = 'block';
                    if (isBaseCategory) {
                        this.updateMaxQuestionsHint(topic);
                    }
                }
            });
        }

        if (this.ipSelect) {
            this.ipSelect.addEventListener('change', () => {
                this.serverIp = this.ipSelect.value;
                localStorage.setItem('selectedServerIp', this.serverIp);
                this.generateQRCode();
            });
        }

        if (this.courseSelect) {
            this.courseSelect.addEventListener('change', () => {
                const courseId = this.courseSelect.value;
                this.socket.emit('admin-select-course', { courseId });
            });
        }

        if (this.btnGenerateAI) {
            this.btnGenerateAI.addEventListener('click', () => this.generateAIQuestions());
        }

        // Eventos de Modal de Ayuda
        if (this.linkApiHelp) {
            this.linkApiHelp.addEventListener('click', (e) => {
                e.preventDefault();
                this.apiConfigModal.style.display = 'block';
            });
        }

        if (this.btnGoToConfig) {
            this.btnGoToConfig.addEventListener('click', () => {
                this.apiHelpModal.style.display = 'none';
                this.apiConfigModal.style.display = 'block';
            });
        }

        if (this.btnCloseHelp) {
            this.btnCloseHelp.addEventListener('click', () => {
                this.apiHelpModal.style.display = 'none';
            });
        }

        if (this.btnCloseApiIcon) {
            this.btnCloseApiIcon.addEventListener('click', () => {
                this.apiHelpModal.style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === this.apiHelpModal) {
                this.apiHelpModal.style.display = 'none';
            }
            if (e.target === this.apiConfigModal) {
                this.apiConfigModal.style.display = 'none';
            }
        });

        if (this.btnSaveApiKey) {
            this.btnSaveApiKey.addEventListener('click', () => {
                const apiKey = this.apiKeyInput.value.trim();
                if (apiKey) {
                    this.socket.emit('admin-save-api-key', { apiKey });
                } else {
                    alert('Por favor, ingresa una clave válida');
                }
            });
        }

        if (this.btnShowHelp) {
            this.btnShowHelp.addEventListener('click', () => {
                this.apiConfigModal.style.display = 'none';
                this.apiHelpModal.style.display = 'block';
            });
        }

        if (this.btnCloseApiConfig) {
            this.btnCloseApiConfig.addEventListener('click', () => {
                this.apiConfigModal.style.display = 'none';
            });
        }
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

        this.socket.on('ai-generated', (data) => {
            this.btnGenerateAI.disabled = false;
            if (data.success) {
                this.aiStatus.innerHTML = `✅ ¡Listo! Se generaron ${data.count} preguntas sobre "${data.topic}"`;
                this.aiStatus.style.color = 'var(--accent)';
                if (data.topicHistory) {
                    this.updateTopicHistory(data.topicHistory);
                }
            } else {
                this.aiStatus.innerHTML = '❌ Error: ' + data.error;
                this.aiStatus.style.color = 'var(--danger)';
                // Si el error es por falta de API Key, ofrecer configurar
                if (data.error.includes('Key') || data.error.includes('configurado')) {
                    const link = document.createElement('a');
                    link.href = '#';
                    link.style.color = 'var(--primary)';
                    link.style.display = 'block';
                    link.style.marginTop = '5px';
                    link.textContent = 'Configurar API Key ahora';
                    link.onclick = (e) => {
                        e.preventDefault();
                        this.apiConfigModal.style.display = 'block';
                    };
                    this.aiStatus.appendChild(link);
                }
            }
        });

        this.socket.on('api-key-saved', (data) => {
            if (data.success) {
                this.hasApiKey = true;
                this.apiConfigModal.style.display = 'none';
                this.aiStatus.textContent = '✅ API Key configurada correctamente.';
                this.aiStatus.style.color = 'var(--accent)';
                alert('API Key de Gemini guardada correctamente.');
            } else {
                alert('Error al guardar la clave: ' + data.error);
            }
        });

        this.socket.on('topic-history-updated', (history) => {
            this.updateTopicHistory(history);
        });
    }

    // ========================================
    // Funciones de Lobby
    // ========================================
    generateQRCode() {
        // Usar la IP seleccionada en el dropdown si existe, si no usar hostname actual
        if (this.ipSelect && this.ipSelect.value) {
            this.serverIp = this.ipSelect.value;
        } else if (!this.serverIp || this.serverIp === 'localhost' || this.serverIp === '127.0.0.1') {
            this.serverIp = window.location.hostname;
        }

        this.serverPort = window.location.port || 3000;

        const url = `http://${this.serverIp}:${this.serverPort}`;
        this.connectionUrl.textContent = url;

        // Actualizar también el enlace directo
        if (this.directLink) {
            this.directLink.textContent = url;
            this.directLink.href = url;
        }

        // Generar código QR usando la libreria qrcode
        try {
            var qr = qrcode(0, 'L');
            qr.addData(url);
            qr.make();
            var moduleCount = qr.getModuleCount();
            var cellSize = 250 / moduleCount;
            var ctx = this.qrCanvas.getContext('2d');
            this.qrCanvas.width = 250;
            this.qrCanvas.height = 250;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 250, 250);
            ctx.fillStyle = '#1e293b';
            for (var row = 0; row < moduleCount; row++) {
                for (var col = 0; col < moduleCount; col++) {
                    if (qr.isDark(row, col)) {
                        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                    }
                }
            }
        } catch (error) {
            console.error('Error generando QR:', error);
        }

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
                </div>
                <div style="font-weight: 600; color: var(--primary);">${player.score} pts</div>
            </div>
        `).join('');

        this.btnStartGame.disabled = false;
    }

    startGame() {
        const topic = this.quizTopicInput ? this.quizTopicInput.value.trim() : 'all';
        const count = parseInt(this.questionCountInput.value) || 10;

        let category = topic || 'all';

        // Si el panel IA está visible, significa que es un tema personalizado
        if (this.aiPanel.style.display === 'block') {
            category = 'ai-custom';
        }

        this.socket.emit('admin-start-game', { category, topic, count });
    }

    generateAIQuestions() {
        if (!this.hasApiKey) {
            this.apiConfigModal.style.display = 'block';
            return;
        }

        const topic = this.quizTopicInput.value.trim();
        const count = parseInt(this.aiCountInput.value) || 5;

        if (!topic) {
            this.aiStatus.textContent = '❌ Por favor, ingresa un tema';
            this.aiStatus.style.color = 'var(--danger)';
            return;
        }

        this.aiStatus.textContent = '✨ Generando preguntas...';
        this.aiStatus.style.color = 'var(--primary)';
        this.btnGenerateAI.disabled = true;

        this.socket.emit('admin-generate-ai', { topic, count });
    }

    updateMaxQuestionsHint(category) {
        // Estos valores son estáticos basados en el banco questions.js
        const counts = {
            'all': 23,
            'Pedagogía Digital': 5,
            'Competencias Digitales Docentes': 5,
            'Herramientas Tecnológicas': 5,
            'Tendencias Actuales': 8
        };
        const max = counts[category] || 23;
        this.maxQuestionsHint.textContent = max;
        this.questionCountInput.max = max;
        if (parseInt(this.questionCountInput.value) > max) {
            this.questionCountInput.value = max;
        }
    }

    onGameStarted() {
        this.showView('game');
        this.updateGameStatus('En Juego');
        this.gameStatus = 'playing';
    }

    onNewQuestion(data) {
        this.currentQuestionIndex = data.questionIndex;
        this.totalQuestions = data.totalQuestions || 23;

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
        const players = Array.from(document.querySelectorAll('#final-leaderboard-body tr')).map(tr => {
            const tds = tr.querySelectorAll('td');
            return {
                posicion: tds[0].textContent,
                nombre: tds[1].textContent,
                aciertos: tds[2].textContent,
                puntos: tds[3].textContent
            };
        });

        const data = {
            fecha: new Date().toLocaleString(),
            juego: 'EdTech Mastery',
            totalParticipantes: parseInt(this.totalPlayersEl.textContent),
            promedioPuntuacion: this.avgScoreEl.textContent,
            promedioAciertos: this.avgCorrectEl.textContent,
            clasificacion: players
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
            this.totalQuestions = data.totalQuestions || 23;
        } else {
            this.showView('lobby');
            this.updateGameStatus('En Lobby');
            this.gameStatus = 'lobby';
        }

        this.updatePlayersList(data.players || []);
        this.hasApiKey = data.hasApiKey;

        // Manejar historial de temas
        if (data.topicHistory) {
            this.updateTopicHistory(data.topicHistory);
        }

        // Manejar visualización de IPs disponibles
        if (data.availableIps && data.availableIps.length > 1) {
            this.ipSelectorContainer.style.display = 'block';

            // Solo poblar si está vacío para evitar perder la selección actual
            if (this.ipSelect.options.length === 0) {
                const savedIp = localStorage.getItem('selectedServerIp');
                data.availableIps.forEach(ipInfo => {
                    const option = document.createElement('option');
                    option.value = ipInfo.address;
                    option.textContent = `${ipInfo.address} (${ipInfo.interface})`;

                    if (savedIp === ipInfo.address) {
                        option.selected = true;
                        this.serverIp = ipInfo.address;
                    } else if (!savedIp && ipInfo.address === data.currentServerIp) {
                        option.selected = true;
                        this.serverIp = ipInfo.address;
                    }
                    this.ipSelect.appendChild(option);
                });

                // Si después de todo no se seleccionó nada, usar el valor del select
                if (!this.serverIp && this.ipSelect.value) {
                    this.serverIp = this.ipSelect.value;
                }
            }
        } else {
            this.ipSelectorContainer.style.display = 'none';
        }

        // Poblar selector de cursos
        if (data.availableCourses) {
            // Guardar selección actual
            const currentSelectedValue = this.courseSelect.value;

            // Re-poblar siempre (pero limpiar primero el resto de opciones después de la primera)
            while (this.courseSelect.options.length > 1) {
                this.courseSelect.remove(1);
            }

            data.availableCourses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                this.courseSelect.appendChild(option);
            });

            // Restaurar selección o usar la que viene del servidor
            if (data.selectedCourse) {
                this.courseSelect.value = data.selectedCourse;
            } else if (currentSelectedValue) {
                this.courseSelect.value = currentSelectedValue;
            }
        }

        // Regenerar QR code para asegurar IP correcta
        this.generateQRCode();
    }

    updateTopicHistory(history) {
        if (!this.topicHistoryList) return;

        this.topicHistoryList.innerHTML = history.map(topic => `
            <option value="${topic}">${topic}</option>
        `).join('');
    }

    updateGameStatus(status) {
        this.gameStatusText.textContent = status;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.edTechAdmin = new EdTechAdmin();
});
