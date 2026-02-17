/* ============================================
   JAVA ODYSSEY - Combat/Challenge System
   Players type Java code to damage enemies
   ============================================ */

const Combat = {
    enemy: null,
    challenges: [],
    currentChallengeIndex: 0,
    attempts: 0,
    hintsShown: 0,
    maxHints: 3,
    startTime: null,
    onVictory: null,
    onDefeat: null,
    
    /**
     * Start a combat encounter
     * @param {Object} enemyData - Enemy configuration
     * @param {Array} challenges - Array of coding challenges
     * @param {Function} onVictory - Callback on victory
     * @param {Function} onDefeat - Callback on defeat (optional)
     * 
     * Enemy format:
     * {
     *   name: 'Syntax Bug',
     *   hp: 100,
     *   maxHp: 100,
     *   art: 'enemyBug', // ASCII art key
     *   description: 'A corrupted creature...'
     * }
     * 
     * Challenge format:
     * {
     *   id: 'tutorial_1',
     *   prompt: 'HTML prompt text',
     *   hints: ['Hint 1', 'Hint 2', 'Hint 3'],
     *   answers: ['valid answer 1', 'valid answer 2'],
     *   damage: 25,
     *   explanation: 'Why this is correct...',
     *   concept: 'variables' // Java concept being tested
     * }
     */
    start(enemyData, challenges, onVictory, onDefeat = null) {
        this.enemy = { ...enemyData };
        this.challenges = challenges;
        this.currentChallengeIndex = 0;
        this.attempts = 0;
        this.hintsShown = 0;
        this.maxHints = CONFIG.COMBAT.maxHints;
        this.startTime = Date.now();
        this.onVictory = onVictory;
        this.onDefeat = onDefeat;
        
        GameState.combat.active = true;
        GameState.combat.enemy = this.enemy;
        
        // Show combat interface
        const combatUI = Utils.$('combat-interface');
        combatUI.style.display = 'flex';
        
        // Hide other elements
        Utils.hide('world-display');
        Utils.hide('action-area');
        Utils.hide('dialogue-box');
        
        // Set up enemy display
        this.updateEnemyDisplay();
        
        // Set up first challenge
        this.showChallenge();
        
        // Set up code input
        this.setupCodeInput();
    },
    
    /**
     * Update enemy display (art, HP bar, name)
     */
    updateEnemyDisplay() {
        const artEl = Utils.$('enemy-art');
        const nameEl = Utils.$('enemy-name');
        const hpBar = Utils.$('enemy-hp-bar');
        const hpText = Utils.$('enemy-hp-text');
        
        // Set enemy art - map art key to Assets enemy id
        // art 'enemyBug' -> id 'syntaxBug', etc.
        const artKey = this.enemy.art || this.enemy.id || 'enemyBug';
        const enemyArt = Assets.getEnemyArt(artKey);
        // Check if it's an image path or ASCII art
        if (enemyArt.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
            artEl.innerHTML = `<img src="${enemyArt}" alt="${this.enemy.name}" style="max-width: 100%; height: auto; max-height: 200px;">`;
        } else {
            artEl.textContent = enemyArt;
        }
        
        nameEl.textContent = this.enemy.name;
        
        // Update HP
        const hpPercent = (this.enemy.hp / this.enemy.maxHp) * 100;
        hpBar.style.width = hpPercent + '%';
        hpText.textContent = `HP: ${this.enemy.hp}/${this.enemy.maxHp}`;
        
        // HP bar color
        hpBar.className = 'hp-bar';
        if (hpPercent <= 25) {
            hpBar.classList.add('low');
        } else if (hpPercent <= 50) {
            hpBar.classList.add('medium');
        }
    },
    
    /**
     * Show current challenge
     */
    showChallenge() {
        if (this.currentChallengeIndex >= this.challenges.length) {
            // All challenges done but enemy still alive - repeat
            this.currentChallengeIndex = 0;
        }
        
        const challenge = this.challenges[this.currentChallengeIndex];
        const promptEl = Utils.$('challenge-prompt');
        const narrativeEl = Utils.$('combat-narrative');
        const hintArea = Utils.$('hint-area');
        const feedbackArea = Utils.$('feedback-area');
        const codeInput = Utils.$('code-input');
        
        // Set challenge prompt
        promptEl.innerHTML = challenge.prompt;
        
        // Set combat narrative
        if (challenge.narrative) {
            narrativeEl.textContent = challenge.narrative;
        } else {
            narrativeEl.textContent = `The ${this.enemy.name} attacks! Write the correct Java code to counter it!`;
        }
        
        // Reset hint and feedback
        hintArea.style.display = 'none';
        feedbackArea.style.display = 'none';
        
        // Clear code input
        codeInput.value = '';
        codeInput.focus();
        
        // Reset attempts for this challenge
        this.attempts = 0;
        this.hintsShown = 0;
        this.startTime = Date.now();
        
        Utils.updateLineNumbers(codeInput);
    },
    
    /**
     * Set up code input event listeners
     */
    setupCodeInput() {
        const codeInput = Utils.$('code-input');
        
        codeInput.addEventListener('input', () => {
            Utils.updateLineNumbers(codeInput);
        });
        
        codeInput.addEventListener('keydown', (e) => {
            // Tab key inserts spaces instead of changing focus
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = codeInput.selectionStart;
                const end = codeInput.selectionEnd;
                codeInput.value = codeInput.value.substring(0, start) + '    ' + codeInput.value.substring(end);
                codeInput.selectionStart = codeInput.selectionEnd = start + 4;
                Utils.updateLineNumbers(codeInput);
            }
            
            // Ctrl+Enter to submit
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.submitAnswer();
            }
        });
    },
    
    /**
     * Show hint for current challenge
     */
    showHint() {
        const challenge = this.challenges[this.currentChallengeIndex];
        const hintArea = Utils.$('hint-area');
        const hintText = Utils.$('hint-text');
        
        if (!challenge.hints || this.hintsShown >= challenge.hints.length) {
            hintText.textContent = 'No more hints available! Try your best!';
            hintArea.style.display = 'flex';
            return;
        }
        
        hintText.textContent = challenge.hints[this.hintsShown];
        hintArea.style.display = 'flex';
        this.hintsShown++;
        
        GameState.performance.hintsUsed++;
    },
    
    /**
     * Submit answer for current challenge
     */
    async submitAnswer() {
        const codeInput = Utils.$('code-input');
        const userCode = codeInput.value.trim();
        
        if (!userCode) {
            this.showFeedback('Please type your Java code before submitting!', 'incorrect');
            return;
        }
        
        this.attempts++;
        GameState.performance.totalAttempts++;
        
        const challenge = this.challenges[this.currentChallengeIndex];
        const isCorrect = Utils.checkCode(userCode, challenge.answers);
        
        if (isCorrect) {
            await this.handleCorrectAnswer(challenge);
        } else {
            this.handleIncorrectAnswer(challenge);
        }
    },
    
    /**
     * Handle correct answer
     */
    async handleCorrectAnswer(challenge) {
        const damage = this.calculateDamage(challenge);
        
        // Show success feedback
        this.showFeedback(
            `✅ Correct! ${challenge.explanation || 'Well done!'}<br>` +
            `<strong>Damage dealt: ${damage}</strong>`,
            'correct'
        );
        
        // Record performance
        const timeSpent = Date.now() - this.startTime;
        GameState.recordChallenge(challenge.id, this.attempts, this.hintsShown, true);
        
        // Add codex entry if concept is new
        if (challenge.concept) {
            GameState.addCodexEntry({
                id: challenge.concept,
                title: challenge.conceptTitle || challenge.concept,
                description: challenge.explanation || ''
            });
        }
        
        // Award XP
        const xpReward = this.attempts === 1 ? CONFIG.XP_REWARDS.correctFirstTry : CONFIG.XP_REWARDS.correctAnswer;
        GameState.addXP(xpReward);
        
        // Animate damage
        await this.dealDamage(damage);
        
        // Check if enemy is defeated
        if (this.enemy.hp <= 0) {
            await this.victory();
        } else {
            // Move to next challenge
            this.currentChallengeIndex++;
            await Utils.wait(1500);
            this.showChallenge();
        }
    },
    
    /**
     * Handle incorrect answer
     */
    handleIncorrectAnswer(challenge) {
        GameState.performance.incorrectAnswers++;
        
        let feedbackMsg = '';
        
        if (this.attempts >= CONFIG.COMBAT.maxAttempts) {
            // Too many attempts - show answer and move on with reduced damage
            feedbackMsg = `❌ Too many attempts! The correct answer was:<br>` +
                `<pre>${challenge.answers[0]}</pre>` +
                `${challenge.explanation || ''}<br>` +
                `<em>The enemy takes reduced damage...</em>`;
            
            this.showFeedback(feedbackMsg, 'incorrect');
            
            GameState.recordChallenge(challenge.id, this.attempts, this.hintsShown, false);
            
            // Deal reduced damage and move on
            setTimeout(async () => {
                const reducedDamage = Math.floor(CONFIG.COMBAT.baseDamage * 0.25);
                await this.dealDamage(reducedDamage);
                
                if (this.enemy.hp <= 0) {
                    await this.victory();
                } else {
                    this.currentChallengeIndex++;
                    await Utils.wait(1000);
                    this.showChallenge();
                }
            }, 2000);
        } else {
            // Provide feedback based on similarity
            const similarity = Utils.codeSimilarity(
                Utils.$('code-input').value,
                challenge.answers[0]
            );
            
            if (similarity > 0.7) {
                feedbackMsg = `⚠️ Almost there! Your code is very close. Check for small errors like typos, missing semicolons, or incorrect syntax.`;
                this.showFeedback(feedbackMsg, 'partial');
            } else if (similarity > 0.3) {
                feedbackMsg = `❌ Not quite right. You have some of the right elements. Try using a hint if you're stuck!`;
                this.showFeedback(feedbackMsg, 'incorrect');
            } else {
                feedbackMsg = `❌ That's not correct. Read the challenge carefully and try again. Use hints if needed!`;
                this.showFeedback(feedbackMsg, 'incorrect');
            }
            
            // Auto-show hint after 2 failed attempts
            if (this.attempts >= 2 && this.hintsShown === 0) {
                setTimeout(() => this.showHint(), 1000);
            }
        }
    },
    
    /**
     * Calculate damage based on performance
     */
    calculateDamage(challenge) {
        let damage = challenge.damage || CONFIG.COMBAT.baseDamage;
        
        // First try bonus
        if (this.attempts === 1) {
            damage = Math.floor(damage * CONFIG.COMBAT.critMultiplier);
        }
        
        // Hint penalty
        if (this.hintsShown > 0) {
            damage = Math.floor(damage * CONFIG.COMBAT.hintPenalty);
        }
        
        return Math.max(damage, 5); // Minimum 5 damage
    },
    
    /**
     * Animate dealing damage to enemy
     */
    async dealDamage(amount) {
        const artEl = Utils.$('enemy-art');
        
        // Shake animation
        artEl.classList.add('damaged');
        
        // Show floating damage number
        this.showDamageNumber(amount);
        
        // Reduce HP
        this.enemy.hp = Math.max(0, this.enemy.hp - amount);
        
        await Utils.wait(300);
        artEl.classList.remove('damaged');
        
        // Update display
        this.updateEnemyDisplay();
    },
    
    /**
     * Show floating damage number
     */
    showDamageNumber(amount) {
        const combatScene = document.querySelector('.combat-scene');
        const dmgEl = document.createElement('div');
        dmgEl.className = 'damage-number';
        dmgEl.textContent = `-${amount}`;
        dmgEl.style.left = '50%';
        dmgEl.style.top = '40%';
        combatScene.appendChild(dmgEl);
        
        setTimeout(() => dmgEl.remove(), 1000);
    },
    
    /**
     * Show feedback message
     */
    showFeedback(message, type) {
        const feedbackArea = Utils.$('feedback-area');
        const feedbackContent = Utils.$('feedback-content');
        
        feedbackArea.style.display = 'block';
        feedbackArea.className = `feedback-area ${type}`;
        feedbackContent.className = `feedback-content ${type}`;
        feedbackContent.innerHTML = message;
    },
    
    /**
     * Victory sequence
     */
    async victory() {
        const artEl = Utils.$('enemy-art');
        artEl.classList.add('defeated');
        
        await Utils.wait(1000);
        
        // Hide combat interface
        const combatUI = Utils.$('combat-interface');
        
        // Show victory overlay
        const victoryHTML = `
            <div class="victory-overlay">
                <div class="victory-content">
                    <div class="victory-title">⚔️ Victory! ⚔️</div>
                    <p style="color: var(--text-light); font-family: var(--font-body); margin: 1rem 0;">
                        You defeated the <strong>${this.enemy.name}</strong>!
                    </p>
                    <div class="victory-rewards">
                        <div class="reward-item">✨ XP Earned: <span class="reward-value">+${CONFIG.XP_REWARDS.questComplete}</span></div>
                        ${this.enemy.reward ? `<div class="reward-item">📦 Obtained: <span class="reward-value">${this.enemy.reward.name}</span></div>` : ''}
                    </div>
                    <button class="menu-btn" onclick="Combat.endCombat()">Continue</button>
                </div>
            </div>
        `;
        
        combatUI.insertAdjacentHTML('beforeend', victoryHTML);
        
        // Award quest completion XP
        GameState.addXP(CONFIG.XP_REWARDS.questComplete);
        
        // Add reward item if any
        if (this.enemy.reward) {
            GameState.addItem(this.enemy.reward);
        }
        
        GameState.combat.active = false;
    },
    
    /**
     * End combat and return to world
     */
    endCombat() {
        const combatUI = Utils.$('combat-interface');
        combatUI.style.display = 'none';
        
        // Remove victory overlay
        const victoryOverlay = combatUI.querySelector('.victory-overlay');
        if (victoryOverlay) victoryOverlay.remove();
        
        // Show world display
        Utils.show('world-display');
        
        // Reset combat state
        this.enemy = null;
        this.challenges = [];
        this.currentChallengeIndex = 0;
        
        // Call victory callback
        if (this.onVictory) {
            const cb = this.onVictory;
            this.onVictory = null;
            cb();
        }
    }
};