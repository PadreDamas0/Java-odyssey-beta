/* ============================================
   JAVA ODYSSEY - Combat/Challenge System
   Players type Java code to damage enemies
   ============================================ */

const Combat = {
    enemy: null,
    challenges: [],
    currentChallenge: null,
    currentChallengeIndex: 0,
    attempts: 0,
    hintsShown: 0,
    maxHints: 3,
    startTime: null,
    onVictory: null,
    onDefeat: null,
    multipleChoiceWrongSelections: 0,
    multipleChoiceLocked: false,
    codeInputReady: false,
    
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
        // Play battle music
        Audio.playBgm('battle', true);
        
        this.enemy = { ...enemyData };
        this.challenges = challenges;
        this.currentChallenge = null;
        this.currentChallengeIndex = 0;
        this.attempts = 0;
        this.hintsShown = 0;
        this.multipleChoiceWrongSelections = 0;
        this.multipleChoiceLocked = false;
        this.maxHints = enemyData.maxHints ?? CONFIG.COMBAT.maxHints;
        this.startTime = Date.now();
        this.onVictory = onVictory;
        this.onDefeat = onDefeat;

        if (typeof Platformer !== 'undefined' && typeof Platformer.clearInputState === 'function') {
            Platformer.clearInputState();
        }
        
        GameState.combat.active = true;
        GameState.combat.enemy = this.enemy;

        const worldMapModal = Utils.$('world-map-modal');
        if (worldMapModal) worldMapModal.style.display = 'none';

        const cityMapModal = Utils.$('city-map-modal');
        if (cityMapModal) cityMapModal.style.display = 'none';

        if (typeof window.WorldMapOverlay !== 'undefined' && typeof window.WorldMapOverlay.close === 'function') {
            window.WorldMapOverlay.close();
        }

        Utils.hide('world-map-ui-button');
        Utils.hide('city-map-ui-button');
        
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
        const nameEl = Utils.$('enemy-name');
        const hpBar = Utils.$('enemy-hp-bar');
        const hpText = Utils.$('enemy-hp-text');
        this.renderEnemyArt(this.enemy.hp <= 0 ? 'defeated' : 'idle');
        
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
        this.currentChallenge = challenge;
        const promptEl = Utils.$('challenge-prompt');
        const narrativeEl = Utils.$('combat-narrative');
        const hintArea = Utils.$('hint-area');
        const feedbackArea = Utils.$('feedback-area');
        const codeInput = Utils.$('code-input');
        const codeInputArea = document.querySelector('.code-input-area');
        const multipleChoiceArea = Utils.$('multiple-choice-area');

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
        this.multipleChoiceWrongSelections = 0;
        this.multipleChoiceLocked = false;

        // Clear code input
        codeInput.value = '';

        // Reset attempts for this challenge
        this.attempts = 0;
        this.hintsShown = 0;
        this.startTime = Date.now();
        GameState.combat.currentChallenge = challenge;
        GameState.combat.challengeIndex = this.currentChallengeIndex;

        Utils.updateLineNumbers(codeInput);

        if (this.isMultipleChoiceChallenge(challenge)) {
            if (codeInputArea) codeInputArea.style.display = 'none';
            if (multipleChoiceArea) multipleChoiceArea.style.display = 'block';
            this.renderMultipleChoiceOptions(challenge);
        } else {
            if (codeInputArea) codeInputArea.style.display = 'block';
            if (multipleChoiceArea) {
                multipleChoiceArea.style.display = 'none';
                const optionsEl = Utils.$('multiple-choice-options');
                if (optionsEl) optionsEl.innerHTML = '';
            }
            codeInput.focus();
        }

        if (challenge.autoShowHint || this.enemy.autoShowHint) {
            setTimeout(() => this.showHint(), 350);
        }
    },

    getEnemyArtForState(state = 'idle') {
        if (!this.enemy) return '';

        const artForState = {
            idle: this.enemy.art,
            hurt: this.enemy.hurtArt,
            defeated: this.enemy.defeatedArt
        };
        const selectedArt = artForState[state] || artForState.idle || this.enemy.id || 'enemyBug';

        return Assets.getEnemyArt(selectedArt, state);
    },

    renderEnemyArt(state = 'idle') {
        const artEl = Utils.$('enemy-art');
        if (!artEl) return;

        artEl.classList.remove('damaged', 'defeated');

        const enemyArt = this.getEnemyArtForState(state);
        if (typeof enemyArt === 'string' && enemyArt.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
            artEl.innerHTML = `<img src="${enemyArt}" alt="${this.enemy?.name || 'Enemy'}">`;
            return;
        }

        artEl.textContent = enemyArt || '';
    },
    
    /**
     * Set up code input event listeners
     */
    setupCodeInput() {
        if (this.codeInputReady) return;

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

        this.codeInputReady = true;
    },

    isMultipleChoiceChallenge(challenge) {
        return challenge && challenge.type === 'multiple_choice';
    },

    renderMultipleChoiceOptions(challenge) {
        const optionsEl = Utils.$('multiple-choice-options');
        if (!optionsEl) return;

        optionsEl.innerHTML = '';
        (challenge.choices || []).forEach((choice, index) => {
            const optionText = typeof choice === 'string' ? choice : choice.text;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'multiple-choice-option';
            button.innerHTML = `
                <span class="multiple-choice-option-letter">${String.fromCharCode(65 + index)}</span>
                <span class="multiple-choice-option-text">${optionText}</span>
            `;
            button.addEventListener('click', () => this.selectMultipleChoiceAnswer(index, button));
            optionsEl.appendChild(button);
        });
    },

    getCorrectChoiceIndex(challenge) {
        if (typeof challenge.correctOption === 'number') {
            return challenge.correctOption;
        }

        if (Array.isArray(challenge.choices)) {
            return challenge.choices.findIndex((choice) => typeof choice === 'object' && choice.correct);
        }

        return -1;
    },

    async selectMultipleChoiceAnswer(optionIndex, buttonEl) {
        const challenge = this.currentChallenge;
        if (!challenge || !this.isMultipleChoiceChallenge(challenge) || this.multipleChoiceLocked) {
            return;
        }

        const correctIndex = this.getCorrectChoiceIndex(challenge);
        if (optionIndex < 0 || optionIndex === correctIndex && buttonEl?.disabled) {
            return;
        }

        this.attempts++;
        GameState.performance.totalAttempts++;

        if (optionIndex === correctIndex) {
            this.multipleChoiceLocked = true;
            buttonEl?.classList.add('correct');
            this.lockMultipleChoiceOptions();
            await this.handleCorrectAnswer(challenge);
            return;
        }

        GameState.performance.incorrectAnswers++;
        this.multipleChoiceWrongSelections++;

        if (buttonEl) {
            buttonEl.classList.add('incorrect');
            buttonEl.disabled = true;
        }

        this.showFeedback(
            `Not quite. That option is out, but you can still recover. Each wrong choice only lowers your damage a little.`,
            'partial'
        );

        if (this.attempts >= 2 && this.hintsShown === 0) {
            setTimeout(() => this.showHint(), 700);
        }
    },

    lockMultipleChoiceOptions() {
        document.querySelectorAll('.multiple-choice-option').forEach((button) => {
            button.disabled = true;
        });
    },

    buildCodexSolutionEntry(challenge) {
        const answerText = this.getPrimaryAnswerText(challenge);
        const explanation = challenge.explanation || 'A correct answer strengthens your understanding of this concept.';
        return {
            id: challenge.codexId || `lesson_${challenge.id}`,
            title: challenge.codexTitle || `${challenge.conceptTitle || 'Combat Lesson'} Solution`,
            description: `${explanation}<br><br><strong>Correct answer:</strong>${answerText.startsWith('<pre>') ? answerText : `<pre>${answerText}</pre>`}`
        };
    },

    getPrimaryAnswerText(challenge) {
        if (this.isMultipleChoiceChallenge(challenge)) {
            const correctIndex = this.getCorrectChoiceIndex(challenge);
            const choice = Array.isArray(challenge.choices) ? challenge.choices[correctIndex] : '';
            return typeof choice === 'string' ? choice : (choice?.text || '');
        }

        return (challenge.answers && challenge.answers[0]) || '';
    },

    resumeSceneBgm() {
        const sceneId = (typeof World !== 'undefined' && World.currentScene)
            || GameState.progress.currentScene
            || '';

        if (!sceneId) {
            Audio.stopBgm(true);
            return;
        }

        if (sceneId.startsWith('ch1_cave_')) {
            Audio.stopBgm(true);
            return;
        }

        if (sceneId.startsWith('ch1_')) {
            Audio.playBgm('mainMenu', true);
            return;
        }

        Audio.stopBgm(true);
    },
    
    /**
     * Show hint for current challenge
     */
    showHint() {
        const challenge = this.challenges[this.currentChallengeIndex];
        const hintArea = Utils.$('hint-area');
        const hintText = Utils.$('hint-text');
        
        if (!challenge.hints || this.hintsShown >= challenge.hints.length || this.hintsShown >= this.maxHints) {
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
        if (this.isMultipleChoiceChallenge(this.currentChallenge)) {
            this.showFeedback('Choose one of the answers below to attack.', 'partial');
            return;
        }

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

        GameState.addCodexEntry(this.buildCodexSolutionEntry(challenge));
        
        // Award XP
        const xpReward = this.attempts === 1
            ? (this.enemy.firstTryXpReward ?? CONFIG.XP_REWARDS.correctFirstTry)
            : (this.enemy.correctXpReward ?? CONFIG.XP_REWARDS.correctAnswer);
        GameState.addXP(xpReward);
        
        // Animate damage
        await this.dealDamage(damage);
        
        // Check if enemy is defeated
        if (this.enemy.hp <= 0) {
            await this.victory();
        } else {
            // Move to next challenge
            this.currentChallengeIndex++;
            await Utils.wait(challenge.feedbackDuration || 2800);
            this.showChallenge();
        }
    },
    
    /**
     * Handle incorrect answer
     */
    handleIncorrectAnswer(challenge) {
        if (this.isMultipleChoiceChallenge(challenge)) {
            return;
        }

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

        if (this.isMultipleChoiceChallenge(challenge) && this.multipleChoiceWrongSelections > 0) {
            const penaltyMultiplier = Math.max(0.62, 1 - (this.multipleChoiceWrongSelections * 0.12));
            damage = Math.floor(damage * penaltyMultiplier);
        }

        return Math.max(damage, 5); // Minimum 5 damage
    },

    calculateCoinReward() {
        if (!this.enemy) return 25;
        if (typeof this.enemy.coinReward === 'number') return this.enemy.coinReward;

        const baseFromHp = Math.round(((this.enemy.maxHp || this.enemy.hp || 50) * 0.5) / 5) * 5;
        return Math.max(25, baseFromHp);
    },
    
    /**
     * Animate dealing damage to enemy
     */
    async dealDamage(amount) {
        const artEl = Utils.$('enemy-art');
        this.renderEnemyArt('hurt');
        
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
        this.renderEnemyArt('defeated');
        artEl.classList.add('defeated');
        
        await Utils.wait(1000);
        
        // Hide combat interface
        const combatUI = Utils.$('combat-interface');
        
        const victoryXpReward = this.enemy.victoryXpReward ?? CONFIG.XP_REWARDS.questComplete;
        const victoryCoinReward = GameState.addGold(this.calculateCoinReward(), true);

        // Show victory overlay
        const victoryHTML = `
            <div class="victory-overlay">
                <div class="victory-content">
                    <div class="victory-title">⚔️ Victory! ⚔️</div>
                    <p style="color: var(--text-light); font-family: var(--font-body); margin: 1rem 0;">
                        You defeated the <strong>${this.enemy.name}</strong>!
                    </p>
                    <div class="victory-rewards">
                        <div class="reward-item">✨ XP Earned: <span class="reward-value">+${victoryXpReward}</span></div>
                        <div class="reward-item">🪙 Gold Earned: <span class="reward-value">+${victoryCoinReward}</span></div>
                        ${this.enemy.reward ? `<div class="reward-item">📦 Obtained: <span class="reward-value">${this.enemy.reward.name}</span></div>` : ''}
                    </div>
                    <button class="menu-btn" onclick="Combat.endCombat()">Continue</button>
                </div>
            </div>
        `;
        
        combatUI.insertAdjacentHTML('beforeend', victoryHTML);
        
        // Award quest completion XP
        GameState.addXP(victoryXpReward);
        
        // Add reward item if any
        if (this.enemy.reward) {
            GameState.addItem(this.enemy.reward);
        }
        
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
        this.resumeSceneBgm();
        if (typeof Platformer !== 'undefined' && typeof Platformer.clearInputState === 'function') {
            Platformer.clearInputState();
        }
        if (
            CONFIG.ENABLE_PHASER_WORLD &&
            GameState.phase === 'chapter1' &&
            typeof PhaserWorld !== 'undefined' &&
            typeof PhaserWorld.refreshLayout === 'function'
        ) {
            PhaserWorld.refreshLayout();
        }

        // Reset combat state
        GameState.combat.active = false;
        this.enemy = null;
        this.challenges = [];
        this.currentChallenge = null;
        this.currentChallengeIndex = 0;
        this.multipleChoiceWrongSelections = 0;
        this.multipleChoiceLocked = false;
        GameState.combat.currentChallenge = null;
        
        // Call victory callback
        if (this.onVictory) {
            const cb = this.onVictory;
            this.onVictory = null;
            cb();
        }
    }
};
