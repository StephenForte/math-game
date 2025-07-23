class MathGame {
    constructor() {
        this.score = 0;
        this.problemsSolved = 0;
        this.totalAttempts = 0;
        this.currentProblem = null;
        this.timeLeft = 30;
        this.timer = null;
        this.gameActive = false;
        this.isPaused = false;
        this.playerName = '';
        this.maxProblems = 10;
        this.currentProblemNumber = 1;
        this.startTime = null;
        this.endTime = null;
        this.problemStartTime = null;
        this.problemTimes = [];
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // Screens
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.resultScreen = document.getElementById('result-screen');
        
        // Game elements
        this.startBtn = document.getElementById('start-btn');
        this.submitBtn = document.getElementById('submit-btn');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.backToMenuBtn = document.getElementById('back-to-menu-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.finishBtn = document.getElementById('finish-btn');
        
        // Game display elements
        this.num1Element = document.getElementById('num1');
        this.num2Element = document.getElementById('num2');
        this.answerInput = document.getElementById('answer-input');
        this.timeLeftElement = document.getElementById('time-left');
        this.scoreElement = document.getElementById('score');
        this.feedbackElement = document.getElementById('feedback');
        this.playerNameInput = document.getElementById('player-name');
        this.playerDisplayElement = document.getElementById('player-display');
        this.finalPlayerNameElement = document.getElementById('final-player-name');
        this.currentProblemElement = document.getElementById('current-problem');
        
        // Result elements
        this.finalScoreElement = document.getElementById('final-score');
        this.problemsSolvedElement = document.getElementById('problems-solved');
        this.accuracyElement = document.getElementById('accuracy');
        this.resultTitleElement = document.getElementById('result-title');
        this.totalTimeElement = document.getElementById('total-time');
        this.averageTimeElement = document.getElementById('average-time');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.submitBtn.addEventListener('click', () => this.checkAnswer());
        this.playAgainBtn.addEventListener('click', () => this.startGame());
        this.backToMenuBtn.addEventListener('click', () => this.showStartScreen());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.finishBtn.addEventListener('click', () => this.finishGame());
        
        // Allow Enter key to submit answer
        this.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });
        
        // Allow Enter key to start game from name input
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startGame();
            }
        });
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show the specified screen
        document.getElementById(screenId).classList.add('active');
    }

    showStartScreen() {
        this.showScreen('start-screen');
        this.resetGame();
    }

    startGame() {
        // Get and validate player name
        const nameInput = this.playerNameInput.value.trim();
        if (!nameInput) {
            alert('Please enter your name to start the game!');
            this.playerNameInput.focus();
            return;
        }
        
        this.playerName = nameInput;
        this.resetGame();
        this.showScreen('game-screen');
        this.gameActive = true;
        this.startTime = Date.now();
        this.generateNewProblem();
        this.startTimer();
        this.answerInput.focus();
    }

    resetGame() {
        this.score = 0;
        this.problemsSolved = 0;
        this.totalAttempts = 0;
        this.timeLeft = 30;
        this.gameActive = false;
        this.isPaused = false;
        this.currentProblem = null;
        this.currentProblemNumber = 1;
        this.startTime = null;
        this.endTime = null;
        this.problemStartTime = null;
        this.problemTimes = [];
        
        // Clear timer
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // Reset UI
        this.updateScore();
        this.updateTimer();
        this.updatePlayerDisplay();
        this.updateProblemCounter();
        this.clearFeedback();
        this.answerInput.value = '';
        this.answerInput.disabled = false;
        this.submitBtn.disabled = false;
        this.pauseBtn.textContent = '⏸️ Pause';
        this.pauseBtn.disabled = false;
        this.finishBtn.disabled = false;
        
        // Remove warning class from timer
        this.timeLeftElement.parentElement.classList.remove('warning');
    }

    generateNewProblem() {
        if (this.isPaused) return;
        
        // Generate random numbers from 1-10
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        
        this.currentProblem = {
            num1: num1,
            num2: num2,
            answer: num1 * num2
        };
        
        // Display the problem
        this.num1Element.textContent = num1;
        this.num2Element.textContent = num2;
        
        // Reset timer to 30 seconds for this problem
        this.timeLeft = 30;
        this.updateTimer();
        
        // Start timing this problem
        this.problemStartTime = Date.now();
        
        // Clear previous feedback and input
        this.clearFeedback();
        this.answerInput.value = '';
        this.answerInput.focus();
    }

    checkAnswer() {
        if (!this.gameActive || !this.currentProblem || this.isPaused) return;
        
        const userAnswer = parseInt(this.answerInput.value);
        this.totalAttempts++;
        
        // Record time for this problem
        if (this.problemStartTime) {
            const problemTime = (Date.now() - this.problemStartTime) / 1000; // Convert to seconds
            this.problemTimes.push(problemTime);
        }
        
        if (userAnswer === this.currentProblem.answer) {
            // Correct answer
            this.score += 10;
            this.problemsSolved++;
            this.showFeedback('Correct! 🎉', 'correct');
            
            // Check if we've reached the maximum number of problems
            if (this.problemsSolved >= this.maxProblems) {
                setTimeout(() => {
                    this.endGame();
                }, 1000);
            } else {
                // Generate new problem after a short delay
                setTimeout(() => {
                    if (this.gameActive && !this.isPaused) {
                        this.currentProblemNumber++;
                        this.generateNewProblem();
                    }
                }, 1000);
            }
        } else {
            // Incorrect answer
            this.showFeedback(`Incorrect. The answer was ${this.currentProblem.answer}`, 'incorrect');
            
            // Generate new problem after a short delay
            setTimeout(() => {
                if (this.gameActive && !this.isPaused) {
                    this.currentProblemNumber++;
                    this.generateNewProblem();
                }
            }, 2000);
        }
        
        // Check if we've reached the maximum problem number (regardless of correct/incorrect)
        if (this.currentProblemNumber >= this.maxProblems) {
            setTimeout(() => {
                this.endGame();
            }, 2000);
        }
        
        this.updateScore();
        this.updateProblemCounter();
    }

    showFeedback(message, type) {
        this.feedbackElement.textContent = message;
        this.feedbackElement.className = `feedback ${type}`;
    }

    clearFeedback() {
        this.feedbackElement.textContent = '';
        this.feedbackElement.className = 'feedback';
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
    }

    updateTimer() {
        this.timeLeftElement.textContent = this.timeLeft;
        
        // Add warning animation when time is running low
        if (this.timeLeft <= 10) {
            this.timeLeftElement.parentElement.classList.add('warning');
        }
    }

    updatePlayerDisplay() {
        const displayName = this.playerName || 'Player';
        this.playerDisplayElement.textContent = displayName;
        this.finalPlayerNameElement.textContent = displayName;
    }

    updateProblemCounter() {
        this.currentProblemElement.textContent = this.currentProblemNumber;
    }

    startTimer() {
        this.timer = setInterval(() => {
            if (!this.isPaused) {
                this.timeLeft--;
                this.updateTimer();
                
                if (this.timeLeft <= 0) {
                    // Instead of ending the game, generate a new problem
                    this.generateNewProblem();
                }
            }
        }, 1000);
    }

    togglePause() {
        if (!this.gameActive) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.pauseBtn.textContent = '▶️ Resume';
            this.answerInput.disabled = true;
            this.submitBtn.disabled = true;
            this.showFeedback('Game Paused', 'paused');
        } else {
            this.pauseBtn.textContent = '⏸️ Pause';
            this.answerInput.disabled = false;
            this.submitBtn.disabled = false;
            this.clearFeedback();
            this.answerInput.focus();
        }
    }

    finishGame() {
        if (!this.gameActive) return;
        
        // Show confirmation dialog
        if (confirm('Are you sure you want to finish the game early?')) {
            this.endGame();
        }
    }

    endGame() {
        this.gameActive = false;
        clearInterval(this.timer);
        this.timer = null;
        
        // Record end time
        this.endTime = Date.now();
        
        // Disable input and submit button
        this.answerInput.disabled = true;
        this.submitBtn.disabled = true;
        
        // Calculate accuracy
        const accuracy = this.totalAttempts > 0 ? Math.round((this.problemsSolved / this.totalAttempts) * 100) : 0;
        
        // Calculate timing statistics
        const totalTime = this.startTime && this.endTime ? (this.endTime - this.startTime) / 1000 : 0;
        const averageTime = this.problemTimes.length > 0 ? 
            this.problemTimes.reduce((sum, time) => sum + time, 0) / this.problemTimes.length : 0;
        
        // Update result screen
        this.updatePlayerDisplay();
        this.finalScoreElement.textContent = this.score;
        this.problemsSolvedElement.textContent = this.problemsSolved;
        this.accuracyElement.textContent = `${accuracy}%`;
        this.totalTimeElement.textContent = `${totalTime.toFixed(1)}s`;
        this.averageTimeElement.textContent = `${averageTime.toFixed(1)}s`;
        
        // Set result title based on performance
        if (this.score >= 50) {
            this.resultTitleElement.textContent = 'Excellent Work! 🏆';
        } else if (this.score >= 30) {
            this.resultTitleElement.textContent = 'Good Job! 👍';
        } else if (this.score >= 10) {
            this.resultTitleElement.textContent = 'Keep Practicing! 💪';
        } else {
            this.resultTitleElement.textContent = 'Don\'t Give Up! 📚';
        }
        
        // Show result screen
        this.showScreen('result-screen');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MathGame();
}); 