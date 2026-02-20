/**
 * EdTech Mastery LAN - Cliente (Aplicación del Alumno)
 * Maneja la conexión, juego y visualización para dispositivos móviles
 */

class EdTechClient {
    constructor() {
        this.socket = null;
        this.playerId = null;
        this.playerName = null;
        this.score = 0;
        this.streak = 0;
        this.currentQuestionIndex = 0;
        this.totalQuestions = 10;
        this.currentCorrectAnswer = null;
        this.isAnswering = false;
        this.lastAnswerIndex = null;
        this.hasAnswered = false;

        this.initElements();
        this.initEventListeners();
        this.connect();
    }

    // ========================================
    // Inicialización de Elementos del DOM
    // ========================================
    initElements() {
        // Pantallas
        this.screens = {
            connection: document.getElementById('connection-screen'),
            waiting: document.getElementById('waiting-screen'),
            question: document.getElementById('question-screen'),
            feedback: document.getElementById('feedback-screen'),
            results: document.getElementById('results-screen'),
            error: document.getElementById('error-screen')
        };

        // Formulario
        this.joinForm = document.getElementById('join-form');
        this.playerNameInput = document.getElementById('player-name');
        this.nameInputGroup = document.getElementById('name-input-group');
        this.nameSelectGroup = document.getElementById('name-select-group');
        this.playerNameSelect = document.getElementById('player-name-select');

        // Elementos de espera
        this.playerGreeting = document.getElementById('player-greeting');
        this.connectedPlayersCount = document.getElementById('connected-players');
        this.connectionStatus = document.getElementById('connection-status');

        // Elementos de pregunta
        this.headerPlayerName = document.getElementById('header-player-name');
        this.playerScoreEl = document.getElementById('player-score');
        this.playerStreakEl = document.getElementById('player-streak');
        this.questionProgressEl = document.getElementById('question-progress');
        this.progressFillEl = document.getElementById('progress-fill');
        this.timerTextEl = document.getElementById('timer-text');
        this.timerCircleEl = document.getElementById('timer-circle');
        this.questionCategoryEl = document.getElementById('question-category');
        this.questionTextEl = document.getElementById('question-text');
        this.questionContextEl = document.getElementById('question-context');
        this.optionsContainer = document.getElementById('options-container');

        // Elementos de feedback
        this.feedbackIcon = document.getElementById('feedback-icon');
        this.feedbackTitle = document.getElementById('feedback-title');
        this.feedbackPoints = document.getElementById('feedback-points');
        this.feedbackExplanation = document.getElementById('feedback-explanation');

        // Elementos de resultados
        this.finalScoreEl = document.getElementById('final-score');
        this.finalScoreCircle = document.getElementById('final-score-circle');
        this.finalCorrectEl = document.getElementById('final-correct');
        this.finalStreakEl = document.getElementById('final-streak');
        this.levelNameEl = document.getElementById('level-name');
        this.levelDescriptionEl = document.getElementById('level-description');

        // Pantalla de error
        this.errorMessage = document.getElementById('error-message');
        this.btnRetry = document.getElementById('btn-retry');
    }

    // ========================================
    // Inicialización de Event Listeners
    // ========================================
    initEventListeners() {
        this.joinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.joinGame();
        });

        this.btnRetry.addEventListener('click', () => {
            this.connect();
        });
    }

    // ========================================
    // Conexión al Servidor
    // ========================================
    connect() {
        this.showScreen('connection');
        this.updateConnectionStatus('Conectando...', false);

        // Determinar URL del servidor
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        const serverUrl = `${protocol}//${window.location.host}`;

        this.socket = io(serverUrl, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
            console.log('Conectado al servidor');
            this.updateConnectionStatus('Conectado', true);
        });

        this.socket.on('disconnect', () => {
            console.log('Desconectado del servidor');
            this.updateConnectionStatus('Desconectado', false);
            this.showError('Se perdió la conexión con el servidor');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Error de conexión:', error);
            this.updateConnectionStatus('Error de conexión', false);
        });

        // Eventos del juego
        this.socket.on('join-success', (data) => {
            this.playerId = data.playerId;
            this.playerName = data.playerName;
            this.onJoinSuccess();
        });

        this.socket.on('error', (data) => {
            this.showError(data.message);
        });

        this.socket.on('course-selected', (data) => {
            this.updateStudentListUI(data.selectedCourse, data.studentList);
        });

        this.socket.on('game-started', () => {
            this.onGameStarted();
        });

        this.socket.on('new-question', (data) => {
            this.onNewQuestion(data);
        });

        this.socket.on('timer-update', (data) => {
            this.updateTimer(data.timeLeft);
        });

        this.socket.on('time-up', () => {
            this.onTimeUp();
        });

        this.socket.on('answer-received', (data) => {
            this.onAnswerReceived(data);
        });

        this.socket.on('reveal-answer', (data) => {
            this.onRevealAnswer(data);
        });

        this.socket.on('game-ended', (data) => {
            this.onGameEnded(data);
        });

        this.socket.on('update-players', (data) => {
            if (this.screens.waiting.classList.contains('active')) {
                this.connectedPlayersCount.textContent = data.count;
            }
        });
    }

    updateStudentListUI(courseId, students) {
        if (!courseId || !students || students.length === 0) {
            this.nameInputGroup.style.display = 'block';
            this.nameSelectGroup.style.display = 'none';
            this.playerNameInput.required = true;
            this.playerNameSelect.required = false;
        } else {
            this.nameInputGroup.style.display = 'none';
            this.nameSelectGroup.style.display = 'block';
            this.playerNameInput.required = false;
            this.playerNameSelect.required = true;

            // Guardar opción actual si existe
            const currentVal = this.playerNameSelect.value;

            this.playerNameSelect.innerHTML = '<option value="">Selecciona quién eres</option>' +
                students.map(name => `<option value="${name}">${name}</option>`).join('');

            if (currentVal) this.playerNameSelect.value = currentVal;
        }
    }

    joinGame() {
        let name = '';
        if (this.nameSelectGroup.style.display === 'block') {
            name = this.playerNameSelect.value;
        } else {
            name = this.playerNameInput.value.trim();
        }

        if (!name) {
            alert('Por favor selecciona o ingresa tu nombre');
            return;
        }

        this.socket.emit('join-game', {
            name: name,
            specialty: 'Docente' // Valor por defecto ya que se quitó la elección
        });
    }

    onJoinSuccess() {
        this.playerGreeting.textContent = `¡Bienvenido, ${this.playerName}!`;
        this.headerPlayerName.textContent = this.playerName;
        this.showScreen('waiting');
    }

    onGameStarted() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.streak = 0;
        this.updateScoreDisplay();
        this.showScreen('question');
    }

    onNewQuestion(data) {
        this.currentQuestionIndex = data.questionIndex;
        this.totalQuestions = data.totalQuestions || 23;
        this.currentCorrectAnswer = null;
        this.isAnswering = true;
        this.hasAnswered = false;
        this.lastAnswerIndex = null;

        // Actualizar progreso
        this.questionProgressEl.textContent = `${this.currentQuestionIndex + 1} / ${this.totalQuestions}`;
        this.progressFillEl.style.width = `${((this.currentQuestionIndex) / this.totalQuestions) * 100}%`;

        // Mostrar categoría y pregunta
        this.questionCategoryEl.textContent = data.category || 'Pregunta';
        this.questionTextEl.textContent = data.question;
        this.questionContextEl.textContent = data.context || '';
        this.questionContextEl.style.display = data.context ? 'block' : 'none';

        // Generar opciones
        this.optionsContainer.innerHTML = '';

        const options = ['A', 'B', 'C', 'D'];
        const questionOptions = data.options || [];

        questionOptions.forEach((optionText, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.dataset.index = i;
            btn.innerHTML = `
                <span class="option-letter">${options[i]}</span>
                <span class="option-text">${optionText}</span>
            `;
            btn.addEventListener('click', () => this.submitAnswer(i));
            btn.disabled = false;
            this.optionsContainer.appendChild(btn);
        });

        // Reiniciar temporizador visual
        this.timerTextEl.textContent = data.timeLeft || 30;
        this.updateTimerCircle(30, 30);
    }

    updateTimer(timeLeft) {
        this.timerTextEl.textContent = timeLeft;
        this.updateTimerCircle(timeLeft, 30);
    }

    updateTimerCircle(current, total) {
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (current / total) * circumference;

        this.timerCircleEl.style.strokeDashoffset = offset;

        this.timerCircleEl.classList.remove('warning', 'danger');
        if (current <= 5) {
            this.timerCircleEl.classList.add('danger');
        } else if (current <= 10) {
            this.timerCircleEl.classList.add('warning');
        }
    }

    submitAnswer(answerIndex) {
        if (!this.isAnswering) return;

        this.isAnswering = false;
        this.lastAnswerIndex = answerIndex;
        this.hasAnswered = true;
        this.socket.emit('submit-answer', { answerIndex });

        // Deshabilitar todos los botones
        const buttons = this.optionsContainer.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.disabled = true);
    }

    onAnswerReceived(data) {
        // Guardamos los puntos pero no los mostramos aún
        this.score = this.score + (data.points || 0);
        this.streak = data.streak || 0;
        // No actualizamos el marcador visible todavía para no dar pistas

        // Mostrar pantalla de espera neutral
        this.showWaitingScreen();
    }

    showWaitingScreen() {
        this.showScreen('feedback');
        this.feedbackIcon.className = 'feedback-icon waiting';
        this.feedbackIcon.textContent = '⏳';
        this.feedbackTitle.textContent = 'Respuesta Recibida';
        this.feedbackPoints.style.display = 'none';
        this.feedbackExplanation.textContent = 'Esperando a que el tiempo termine para ver el resultado...';
    }

    onTimeUp() {
        this.isAnswering = false;
        const buttons = this.optionsContainer.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.disabled = true);
    }

    onRevealAnswer(data) {
        // Marcar respuesta correcta
        const buttons = this.optionsContainer.querySelectorAll('.option-btn');
        buttons.forEach((btn, index) => {
            btn.disabled = true; // Deshabilitar todos
            if (index === data.correctIndex) {
                btn.classList.add('correct');
            } else if (index === this.lastAnswerIndex) {
                btn.classList.add('wrong');
            }
        });

        // Mostrar feedback final
        setTimeout(() => {
            const isCorrect = this.lastAnswerIndex === data.correctIndex;
            // Ahora sí actualizamos el marcador visible
            this.updateScoreDisplay();
            this.showFeedback(isCorrect, 0, data.explanation, true);
        }, 1500);
    }

    showFeedback(isCorrect, points, explanation, isReveal = false) {
        this.showScreen('feedback');

        if (isReveal) {
            this.feedbackTitle.textContent = isCorrect ? '¡Acertaste!' : (this.hasAnswered ? '¡Casi!' : 'Tiempo agotado');
            this.feedbackIcon.className = isCorrect ? 'feedback-icon correct' : 'feedback-icon wrong';
            this.feedbackIcon.textContent = isCorrect ? '✓' : '✗';
            this.feedbackPoints.style.display = 'none';
        }

        this.feedbackExplanation.textContent = explanation || '';
    }

    updateScoreDisplay() {
        this.playerScoreEl.textContent = this.score;
        this.playerStreakEl.textContent = this.streak;
    }

    onGameEnded(data) {
        this.showScreen('results');

        // Buscar resultado del jugador
        const playerResult = data.players.find(p => p.id === this.playerId);
        const finalScore = playerResult ? playerResult.score : 0;
        const correctAnswers = playerResult ? playerResult.correctAnswers : 0;

        // Animar puntuación
        this.animateScore(finalScore);

        // Mostrar estadísticas
        this.finalCorrectEl.textContent = `${correctAnswers}/${this.totalQuestions}`;
        this.finalStreakEl.textContent = playerResult ? playerResult.bestStreak : 0;

        // Determinar nivel
        const percentage = (correctAnswers / this.totalQuestions) * 100;
        const level = this.getLevel(percentage);

        this.levelNameEl.textContent = level.name;
        this.levelDescriptionEl.textContent = level.description;
    }

    animateScore(targetScore) {
        const duration = 1500;
        const startTime = Date.now();
        const startScore = 0;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentScore = Math.round(startScore + (targetScore - startScore) * eased);

            this.finalScoreEl.textContent = currentScore;

            // Actualizar círculo
            const percentage = (currentScore / (this.totalQuestions * 150)) * 100;
            const circumference = 2 * Math.PI * 45;
            const offset = circumference - (percentage / 100) * circumference;

            this.finalScoreCircle.style.strokeDashoffset = offset;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        // Crear gradiente SVG si no existe
        if (!document.querySelector('#scoreGradientClient')) {
            const svg = this.finalScoreEl.closest('.score-circle').querySelector('svg');
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = `
                <linearGradient id="scoreGradientClient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#3B82F6"/>
                    <stop offset="100%" stop-color="#10B981"/>
                </linearGradient>
            `;
            svg.insertBefore(defs, svg.firstChild);
            this.finalScoreCircle.style.stroke = 'url(#scoreGradientClient)';
        }

        animate();
    }

    getLevel(percentage) {
        if (percentage >= 80) {
            return {
                name: 'Pionero EdTech',
                icon: '🚀',
                description: '¡Excelente! Tienes competencias digitales avanzadas. Considera mentorizar a tus colegas.'
            };
        } else if (percentage >= 60) {
            return {
                name: 'Maestro Digital',
                icon: '🌳',
                description: 'Buen trabajo. Tienes una base sólida. Sigue explorando herramientas avanzadas.'
            };
        } else if (percentage >= 40) {
            return {
                name: 'Integrador Novato',
                icon: '🌿',
                description: 'Buen progreso. Estás integrando la tecnología en tu práctica. Sigue así.'
            };
        } else {
            return {
                name: 'Explorador Digital',
                icon: '🌱',
                description: 'Este es un excelente punto de partida. Continúa aprendiendo y experimentando con nuevas herramientas.'
            };
        }
    }

    // ========================================
    // Utilidades de UI
    // ========================================
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        this.screens[screenName].classList.add('active');
    }

    updateConnectionStatus(status, connected) {
        this.connectionStatus.querySelector('.status-text').textContent = status;
        this.connectionStatus.classList.toggle('connected', connected);
    }

    showError(message) {
        this.errorMessage.textContent = message || 'Error de conexión';
        this.showScreen('error');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.edTechClient = new EdTechClient();
});
