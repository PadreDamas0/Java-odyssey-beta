/* ============================================
   JAVA ODYSSEY - Game State Management
   ============================================ */

const GameState = {
    // Current game phase
    phase: 'menu', // menu, intro, tutorial, portal, chapter1, etc.
    
    // Settings
    settings: {
        textSpeed: 'normal',
        musicVolume: 70,
        sfxVolume: 80
    },
    
    // Player data
    player: {
        name: 'Guardian',
        level: 1,
        xp: 0,
        xpToNext: 100,
        hp: 100,
        maxHp: 100,
        attack: 10,
        defense: 5,
        title: 'Trainee Code Guardian'
    },
    
    // Progress tracking
    progress: {
        currentChapter: 0,
        currentScene: '',
        completedQuests: [],
        completedChallenges: [],
        unlockedAreas: ['modern-world'],
        storyFlags: {}
    },
    
    // Performance tracking (for adaptive difficulty)
    performance: {
        totalAttempts: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        hintsUsed: 0,
        currentStreak: 0,
        bestStreak: 0,
        averageAttempts: 0,
        difficultyLevel: 'beginner', // beginner, intermediate, advanced
        challengeHistory: [] // { id, attempts, hintsUsed, timeSpent, correct }
    },
    
    // Inventory
    inventory: [],
    
    // Journal / Quest Log
    journal: {
        activeQuests: [],
        completedQuests: [],
        codex: [] // Learned Java concepts
    },
    
    // Current combat state
    combat: {
        active: false,
        enemy: null,
        currentChallenge: null,
        challengeIndex: 0,
        attempts: 0,
        hintsShown: 0,
        startTime: null
    },
    
    // Dialogue state
    dialogue: {
        active: false,
        queue: [],
        currentIndex: 0,
        callback: null
    },
    
    /**
     * Initialize fresh game state
     */
    init() {
        this.player = { ...CONFIG.PLAYER_DEFAULTS, title: 'Trainee Code Guardian' };
        this.progress = {
            currentChapter: 0,
            currentScene: '',
            completedQuests: [],
            completedChallenges: [],
            unlockedAreas: ['modern-world'],
            storyFlags: {}
        };
        this.performance = {
            totalAttempts: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            hintsUsed: 0,
            currentStreak: 0,
            bestStreak: 0,
            averageAttempts: 0,
            difficultyLevel: 'beginner',
            challengeHistory: []
        };
        this.inventory = [];
        this.journal = {
            activeQuests: [],
            completedQuests: [],
            codex: []
        };
        this.combat = {
            active: false,
            enemy: null,
            currentChallenge: null,
            challengeIndex: 0,
            attempts: 0,
            hintsShown: 0,
            startTime: null
        };
    },
    
    /**
     * Add XP and check for level up
     */
    addXP(amount) {
        this.player.xp += amount;
        Utils.notify(`+${amount} XP`, 'xp-gain');
        
        while (this.player.xp >= this.player.xpToNext) {
            this.player.xp -= this.player.xpToNext;
            this.player.level++;
            this.player.xpToNext = Math.floor(this.player.xpToNext * 1.5);
            this.player.maxHp += 10;
            this.player.hp = this.player.maxHp;
            this.player.attack += 3;
            this.player.defense += 2;
            
            Utils.notify(`⬆️ Level Up! Now Level ${this.player.level}!`, 'level-up', 4000);
        }
        
        this.updateHUD();
    },
    
    /**
     * Add item to inventory
     */
    addItem(item) {
        this.inventory.push(item);
        Utils.notify(`📦 Obtained: ${item.name}`, 'item-gain');
    },
    
    /**
     * Add quest to journal
     */
    addQuest(quest) {
        this.journal.activeQuests.push(quest);
        Utils.notify(`📜 New Quest: ${quest.title}`, 'quest-update');
    },
    
    /**
     * Complete a quest
     */
    completeQuest(questId) {
        const idx = this.journal.activeQuests.findIndex(q => q.id === questId);
        if (idx !== -1) {
            const quest = this.journal.activeQuests.splice(idx, 1)[0];
            quest.completed = true;
            this.journal.completedQuests.push(quest);
            this.progress.completedQuests.push(questId);
            Utils.notify(`✅ Quest Complete: ${quest.title}`, 'quest-update', 4000);
        }
    },
    
    /**
     * Add codex entry (learned concept)
     */
    addCodexEntry(entry) {
        if (!this.journal.codex.find(e => e.id === entry.id)) {
            this.journal.codex.push(entry);
            Utils.notify(`📚 New Codex Entry: ${entry.title}`, 'quest-update');
        }
    },
    
    /**
     * Set a story flag
     */
    setFlag(flag, value = true) {
        this.progress.storyFlags[flag] = value;
    },
    
    /**
     * Check a story flag
     */
    hasFlag(flag) {
        return !!this.progress.storyFlags[flag];
    },
    
    /**
     * Record challenge performance
     */
    recordChallenge(challengeId, attempts, hintsUsed, correct) {
        this.performance.totalAttempts += attempts;
        this.performance.hintsUsed += hintsUsed;
        
        if (correct) {
            this.performance.correctAnswers++;
            this.performance.currentStreak++;
            if (this.performance.currentStreak > this.performance.bestStreak) {
                this.performance.bestStreak = this.performance.currentStreak;
            }
        } else {
            this.performance.incorrectAnswers++;
            this.performance.currentStreak = 0;
        }
        
        this.performance.challengeHistory.push({
            id: challengeId,
            attempts,
            hintsUsed,
            correct,
            timestamp: Date.now()
        });
        
        // Update average attempts
        const total = this.performance.challengeHistory.length;
        const sumAttempts = this.performance.challengeHistory.reduce((s, c) => s + c.attempts, 0);
        this.performance.averageAttempts = sumAttempts / total;
        
        // Adaptive difficulty adjustment
        this.adjustDifficulty();
        
        if (correct) {
            this.progress.completedChallenges.push(challengeId);
        }
    },
    
    /**
     * Rule-based adaptive difficulty adjustment
     */
    adjustDifficulty() {
        const perf = this.performance;
        const recentChallenges = perf.challengeHistory.slice(-5);
        const recentCorrect = recentChallenges.filter(c => c.correct).length;
        const recentAvgAttempts = recentChallenges.reduce((s, c) => s + c.attempts, 0) / recentChallenges.length;
        
        // Rule: If streak >= threshold and avg attempts <= 1.5, increase difficulty
        if (perf.currentStreak >= CONFIG.DIFFICULTY.streakToIncrease && recentAvgAttempts <= 1.5) {
            const currentIdx = CONFIG.DIFFICULTY.levels.indexOf(perf.difficultyLevel);
            if (currentIdx < CONFIG.DIFFICULTY.levels.length - 1) {
                perf.difficultyLevel = CONFIG.DIFFICULTY.levels[currentIdx + 1];
                Utils.notify(`📈 Difficulty increased to ${perf.difficultyLevel}!`, 'quest-update');
            }
        }
        
        // Rule: If recent correct < 40% or avg attempts > 3, decrease difficulty
        if (recentChallenges.length >= 3) {
            if (recentCorrect / recentChallenges.length < 0.4 || recentAvgAttempts > 3) {
                const currentIdx = CONFIG.DIFFICULTY.levels.indexOf(perf.difficultyLevel);
                if (currentIdx > 0) {
                    perf.difficultyLevel = CONFIG.DIFFICULTY.levels[currentIdx - 1];
                    Utils.notify(`📉 Difficulty adjusted to ${perf.difficultyLevel}`, 'quest-update');
                }
            }
        }
    },
    
    /**
     * Update HUD display
     */
    updateHUD() {
        const nameEl = Utils.$('hud-player-name');
        const xpBar = Utils.$('hud-xp-bar');
        const xpText = Utils.$('hud-xp-text');
        const levelEl = Utils.$('hud-level');
        
        if (nameEl) nameEl.textContent = this.player.name;
        if (xpBar) xpBar.style.width = (this.player.xp / this.player.xpToNext * 100) + '%';
        if (xpText) xpText.textContent = `XP: ${this.player.xp} / ${this.player.xpToNext}`;
        if (levelEl) levelEl.textContent = `Lv. ${this.player.level}`;
    },
    
    /**
     * Save game state
     */
    save() {
        const saveData = {
            player: this.player,
            progress: this.progress,
            performance: this.performance,
            inventory: this.inventory,
            journal: this.journal,
            phase: this.phase,
            timestamp: Date.now()
        };
        return Utils.saveToStorage(CONFIG.SAVE_KEY, saveData);
    },
    
    /**
     * Load game state
     */
    load() {
        const data = Utils.loadFromStorage(CONFIG.SAVE_KEY);
        if (data) {
            this.player = data.player || this.player;
            this.progress = data.progress || this.progress;
            this.performance = data.performance || this.performance;
            this.inventory = data.inventory || this.inventory;
            this.journal = data.journal || this.journal;
            this.phase = data.phase || this.phase;
            return true;
        }
        return false;
    },
    
    /**
     * Check if save exists
     */
    hasSave() {
        return !!Utils.loadFromStorage(CONFIG.SAVE_KEY);
    }
};