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
        sfxVolume: 80,
        muted: false
    },

    // Player data
    player: {
        name: 'Guardian',
        level: 1,
        xp: 0,
        totalXp: 0,
        xpToNext: 100,
        gold: 0,
        hp: 100,
        maxHp: 100,
        position: CONFIG.PLAYER_HEALTH.startingPosition,
        attack: 10,
        defense: 5,
        xpBonus: 0,
        coinBonus: 0,
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

    meta: {
        totalPlayTimeMs: 0,
        sessionStartedAt: null,
        chapter1StartPlayTimeMs: 0,
        chapter1CompletedMs: null
    },

    remoteSyncTimer: null,

    // Performance tracking for adaptive difficulty
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
    createFreshMeta() {
        return {
            totalPlayTimeMs: 0,
            sessionStartedAt: Date.now(),
            chapter1StartPlayTimeMs: 0,
            chapter1CompletedMs: null
        };
    },

    hydrateMeta(meta = {}) {
        const parsedCompletion = Number(meta.chapter1CompletedMs);

        return {
            totalPlayTimeMs: Math.max(0, Number(meta.totalPlayTimeMs) || 0),
            sessionStartedAt: Date.now(),
            chapter1StartPlayTimeMs: Math.max(0, Number(meta.chapter1StartPlayTimeMs) || 0),
            chapter1CompletedMs: Number.isFinite(parsedCompletion) && parsedCompletion > 0
                ? parsedCompletion
                : null
        };
    },

    getXpToNextForLevel(level) {
        const targetLevel = Math.max(1, Number(level) || 1);
        let xpToNext = CONFIG.PLAYER_DEFAULTS.xpToNext || 100;

        for (let currentLevel = 1; currentLevel < targetLevel; currentLevel++) {
            xpToNext = Math.floor(xpToNext * 1.5);
        }

        return xpToNext;
    },

    getBaseLevelTotalXp(level) {
        const targetLevel = Math.max(1, Number(level) || 1);
        let totalXp = 0;
        let xpToNext = CONFIG.PLAYER_DEFAULTS.xpToNext || 100;

        for (let currentLevel = 1; currentLevel < targetLevel; currentLevel++) {
            totalXp += xpToNext;
            xpToNext = Math.floor(xpToNext * 1.5);
        }

        return totalXp;
    },

    normalizePlayerState() {
        if (!this.player) {
            this.player = { ...CONFIG.PLAYER_DEFAULTS };
        }

        const level = Math.max(1, Number(this.player.level) || 1);
        const xpToNext = this.getXpToNextForLevel(level);
        const baseMaxHp = 100 + Math.max(0, level - 1) * 10;
        const baseAttack = 10 + Math.max(0, level - 1) * 3;
        const baseDefense = 5 + Math.max(0, level - 1) * 2;
        const currentXp = Math.max(0, Number(this.player.xp) || 0);

        this.player.level = level;
        this.player.xpToNext = Math.max(1, xpToNext);
        this.player.xp = Math.min(currentXp, Math.max(0, this.player.xpToNext - 1));
        this.player.totalXp = Math.max(
            this.getBaseLevelTotalXp(level) + this.player.xp,
            Number(this.player.totalXp) || 0
        );
        this.player.gold = Math.max(0, Number(this.player.gold) || 0);
        this.player.maxHp = Math.max(baseMaxHp, Number(this.player.maxHp) || baseMaxHp);
        this.player.hp = Math.max(0, Math.min(this.player.maxHp, Number(this.player.hp) || this.player.maxHp));
        this.player.attack = Math.max(baseAttack, Number(this.player.attack) || baseAttack);
        this.player.defense = Math.max(baseDefense, Number(this.player.defense) || baseDefense);
        this.player.xpBonus = Math.max(0, Number(this.player.xpBonus) || 0);
        this.player.coinBonus = Math.max(0, Number(this.player.coinBonus) || 0);
    },

    getElapsedPlayTimeMs() {
        const sessionStartedAt = Number(this.meta.sessionStartedAt) || 0;
        const currentSessionMs = sessionStartedAt > 0
            ? Math.max(0, Date.now() - sessionStartedAt)
            : 0;

        return Math.max(0, Number(this.meta.totalPlayTimeMs) || 0) + currentSessionMs;
    },

    commitPlayTimeSnapshot() {
        this.meta.totalPlayTimeMs = this.getElapsedPlayTimeMs();
        this.meta.sessionStartedAt = Date.now();
        return this.meta.totalPlayTimeMs;
    },

    getChapterOneCompletionSeconds() {
        if (!Number.isFinite(this.meta.chapter1CompletedMs) || this.meta.chapter1CompletedMs === null) {
            return null;
        }

        return Math.max(1, Math.floor(this.meta.chapter1CompletedMs / 1000));
    },

    markChapterOneComplete() {
        if (this.meta.chapter1CompletedMs !== null) {
            return this.getChapterOneCompletionSeconds();
        }

        const elapsedPlayTimeMs = this.getElapsedPlayTimeMs();
        this.meta.totalPlayTimeMs = elapsedPlayTimeMs;
        this.meta.sessionStartedAt = Date.now();
        this.meta.chapter1CompletedMs = Math.max(
            0,
            elapsedPlayTimeMs - Math.max(0, Number(this.meta.chapter1StartPlayTimeMs) || 0)
        );

        return this.getChapterOneCompletionSeconds();
    },

    getRemoteProgressSnapshot() {
        this.commitPlayTimeSnapshot();

        return {
            level: Math.max(1, Number(this.player.level) || 1),
            coins: Math.max(0, Number(this.player.gold) || 0),
            hp: Math.max(0, Number(this.player.hp) || 0),
            xp: Math.max(0, Number(this.player.xp) || 0),
            total_xp: Math.max(0, Number(this.player.totalXp) || 0),
            time_completed: this.getChapterOneCompletionSeconds()
        };
    },

    scheduleRemoteSync(delayMs = 800) {
        if (this.remoteSyncTimer) {
            window.clearTimeout(this.remoteSyncTimer);
        }

        this.remoteSyncTimer = window.setTimeout(() => {
            this.remoteSyncTimer = null;

            if (window.Auth && typeof window.Auth.syncPlayerProgress === 'function') {
                window.Auth.syncPlayerProgress(this.player);
            }
        }, Math.max(0, delayMs));
    },
    /**
     * Initialize fresh game state
     */
    init() {
        if (this.remoteSyncTimer) {
            window.clearTimeout(this.remoteSyncTimer);
            this.remoteSyncTimer = null;
        }

        this.player = { ...CONFIG.PLAYER_DEFAULTS, title: 'Trainee Code Guardian' };
        this.meta = this.createFreshMeta();
        this.applyAuthenticatedProfile();
        this.decoratePlayerState();
        this.normalizePlayerState();
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
        this.updateHUD();
    },

    applyAuthenticatedProfile() {
        const profile = window.Auth && typeof window.Auth.getRemotePlayerProfile === 'function'
            ? window.Auth.getRemotePlayerProfile()
            : null;

        if (!profile) {
            return;
        }

        this.player = { ...this.player, ...profile };

        if (profile.timeCompleted) {
            this.meta.chapter1CompletedMs = Math.max(
                Number(this.meta.chapter1CompletedMs) || 0,
                Number(profile.timeCompleted) * 1000
            );
        }
    },

    syncAuthenticatedIdentity() {
        const user = window.Auth && window.Auth.currentUser ? window.Auth.currentUser : null;
        if (!user) {
            return;
        }

        this.player.name = user.username || this.player.name;
        this.player.userId = user.userId;
    },

    getSaveKey() {
        if (window.Auth && typeof window.Auth.getUserScopedKey === 'function') {
            return window.Auth.getUserScopedKey(CONFIG.SAVE_KEY);
        }

        return CONFIG.SAVE_KEY;
    },

    getStoredSaveData() {
        const scopedKey = this.getSaveKey();
        const scopedData = Utils.loadFromStorage(scopedKey);
        if (scopedData) {
            return scopedData;
        }

        if (scopedKey !== CONFIG.SAVE_KEY) {
            const legacyData = Utils.loadFromStorage(CONFIG.SAVE_KEY);
            if (legacyData) {
                Utils.saveToStorage(scopedKey, legacyData);
                return legacyData;
            }
        }

        return null;
    },

    /**
     * Ensure the player object always has the expected HP aliases and location data
     */
    decoratePlayerState() {
        if (!this.player) {
            this.player = { ...CONFIG.PLAYER_DEFAULTS };
        }

        if (!this.player.position) {
            this.player.position = CONFIG.PLAYER_HEALTH.startingPosition;
        }

        if (!Object.getOwnPropertyDescriptor(this.player, 'currentHP')) {
            Object.defineProperty(this.player, 'currentHP', {
                get() {
                    return this.hp;
                },
                set(value) {
                    this.hp = value;
                },
                configurable: true
            });
        }

        if (!Object.getOwnPropertyDescriptor(this.player, 'maxHP')) {
            Object.defineProperty(this.player, 'maxHP', {
                get() {
                    return this.maxHp;
                },
                set(value) {
                    this.maxHp = value;
                },
                configurable: true
            });
        }
    },

    /**
     * Track the player's current map position in a simple RPG-friendly way
     */
    setPlayerPosition(position) {
        this.player.position = position || CONFIG.PLAYER_HEALTH.startingPosition;
    },

    /**
     * Add XP and check for level up
     */
    addXP(amount) {
        const totalAmount = amount + (this.player.xpBonus || 0);
        this.player.xp += totalAmount;
        this.player.totalXp = Math.max(0, Number(this.player.totalXp) || 0) + totalAmount;
        Utils.notify(`+${totalAmount} XP`, 'xp-gain');

        while (this.player.xp >= this.player.xpToNext) {
            this.player.xp -= this.player.xpToNext;
            this.player.level++;
            this.player.xpToNext = Math.floor(this.player.xpToNext * 1.5);
            this.player.maxHp += 10;
            this.player.hp = this.player.maxHp;
            this.player.attack += 3;
            this.player.defense += 2;

            Utils.notify(`Level Up! Now Level ${this.player.level}!`, 'level-up', 4000);
        }

        this.updateHUD();
        this.scheduleRemoteSync();
    },

    /**
     * Add gold and update the HUD
     */
    addGold(amount, applyBonus = false) {
        const totalAmount = amount + (applyBonus ? (this.player.coinBonus || 0) : 0);
        this.player.gold = (this.player.gold || 0) + totalAmount;
        Utils.notify(`+${totalAmount} Gold`, 'item-gain');
        this.updateHUD();
        this.scheduleRemoteSync();
        return totalAmount;
    },

    /**
     * Spend gold if possible
     */
    spendGold(amount) {
        if ((this.player.gold || 0) < amount) return false;
        this.player.gold -= amount;
        this.updateHUD();
        this.scheduleRemoteSync();
        return true;
    },

    /**
     * Add item to inventory
     */
    addItem(item) {
        this.inventory.push(item);
        Utils.notify(`Obtained: ${item.name}`, 'item-gain');
    },

    hasItem(itemId) {
        return this.inventory.some(item => item.id === itemId);
    },

    /**
     * Add quest to journal
     */
    addQuest(quest) {
        if (!quest || !quest.id) return;
        if (this.journal.activeQuests.some(q => q.id === quest.id)) return;
        if (this.journal.completedQuests.some(q => q.id === quest.id)) return;
        if (this.progress.completedQuests.includes(quest.id)) return;

        this.journal.activeQuests.push(quest);
        Utils.notify(`New Quest: ${quest.title}`, 'quest-update');
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
            Utils.notify(`Quest Complete: ${quest.title}`, 'quest-update', 4000);
        }
    },

    /**
     * Add codex entry (learned concept)
     */
    addCodexEntry(entry) {
        if (!this.journal.codex.find(e => e.id === entry.id)) {
            this.journal.codex.push(entry);
            Utils.notify(`New Codex Entry: ${entry.title}`, 'quest-update');
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

        const total = this.performance.challengeHistory.length;
        const sumAttempts = this.performance.challengeHistory.reduce((s, c) => s + c.attempts, 0);
        this.performance.averageAttempts = sumAttempts / total;

        this.adjustDifficulty();

        if (correct) {
            this.progress.completedChallenges.push(challengeId);
        }
    },

    /**
     * Rule-based adaptive difficulty adjustment (IMPORTANT)
     */
    adjustDifficulty() {
        const perf = this.performance;
        const recentChallenges = perf.challengeHistory.slice(-5);
        const recentCorrect = recentChallenges.filter(c => c.correct).length;
        const recentAvgAttempts = recentChallenges.reduce((s, c) => s + c.attempts, 0) / recentChallenges.length;

        if (perf.currentStreak >= CONFIG.DIFFICULTY.streakToIncrease && recentAvgAttempts <= 1.5) {
            const currentIdx = CONFIG.DIFFICULTY.levels.indexOf(perf.difficultyLevel);
            if (currentIdx < CONFIG.DIFFICULTY.levels.length - 1) {
                perf.difficultyLevel = CONFIG.DIFFICULTY.levels[currentIdx + 1];
                Utils.notify(`Difficulty increased to ${perf.difficultyLevel}!`, 'quest-update');
            }
        }

        if (recentChallenges.length >= 3) {
            if (recentCorrect / recentChallenges.length < 0.4 || recentAvgAttempts > 3) {
                const currentIdx = CONFIG.DIFFICULTY.levels.indexOf(perf.difficultyLevel);
                if (currentIdx > 0) {
                    perf.difficultyLevel = CONFIG.DIFFICULTY.levels[currentIdx - 1];
                    Utils.notify(`Difficulty adjusted to ${perf.difficultyLevel}`, 'quest-update');
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
        const hpBar = Utils.$('hud-hp-bar');
        const hpText = Utils.$('hud-hp-text');
        const levelEl = Utils.$('hud-level');
        const goldEl = Utils.$('hud-gold');
        const shopHpEl = Utils.$('shop-hp');
        const shopGoldEl = Utils.$('shop-gold');
        const xpPercent = this.player.xpToNext > 0
            ? Math.max(0, Math.min(100, (this.player.xp / this.player.xpToNext) * 100))
            : 0;

        if (nameEl) nameEl.textContent = this.player.name;
        if (xpBar) xpBar.style.width = `${xpPercent}%`;
        if (xpText) xpText.textContent = `XP: ${this.player.xp} / ${this.player.xpToNext}`;
        if (hpBar) {
            const hpPercent = this.player.maxHp > 0
                ? Math.max(0, Math.min(100, (this.player.hp / this.player.maxHp) * 100))
                : 0;
            hpBar.style.width = `${hpPercent}%`;
            hpBar.className = 'player-hp-bar';
            if (hpPercent <= 25) {
                hpBar.classList.add('low');
            } else if (hpPercent <= 50) {
                hpBar.classList.add('medium');
            }
        }
        if (hpText) hpText.textContent = `HP: ${this.player.hp} / ${this.player.maxHp}`;
        if (levelEl) levelEl.textContent = `Lv. ${this.player.level}`;
        if (goldEl) goldEl.textContent = `${this.player.gold || 0} Gold`;
        if (shopHpEl) shopHpEl.textContent = `HP: ${this.player.hp} / ${this.player.maxHp}`;
        if (shopGoldEl) shopGoldEl.textContent = `${this.player.gold || 0} Gold`;
    },

    /**
     * Save game state
     */
    save() {
        this.commitPlayTimeSnapshot();
        const saveData = {
            player: this.player,
            progress: this.progress,
            performance: this.performance,
            inventory: this.inventory,
            journal: this.journal,
            phase: this.phase,
            meta: this.meta,
            timestamp: Date.now()
        };
        const saved = Utils.saveToStorage(this.getSaveKey(), saveData);

        if (saved && window.Auth && typeof window.Auth.syncPlayerProgress === 'function') {
            this.scheduleRemoteSync(0);
        }

        return saved;
    },

    /**
     * Load game state
     */
    load() {
        const data = this.getStoredSaveData();
        if (data) {
            if (this.remoteSyncTimer) {
                window.clearTimeout(this.remoteSyncTimer);
                this.remoteSyncTimer = null;
            }

            this.player = { ...CONFIG.PLAYER_DEFAULTS, ...this.player, ...(data.player || {}) };
            this.progress = data.progress || this.progress;
            this.performance = data.performance || this.performance;
            this.inventory = data.inventory || this.inventory;
            this.journal = data.journal || this.journal;
            this.phase = data.phase || this.phase;
            this.meta = this.hydrateMeta(data.meta || {});

            if (this.progress.storyFlags?.ch1_forest_complete && this.meta.chapter1CompletedMs === null) {
                const remoteTimeCompleted = Number(window.Auth?.remoteProgress?.time_completed);
                if (Number.isFinite(remoteTimeCompleted) && remoteTimeCompleted > 0) {
                    this.meta.chapter1CompletedMs = remoteTimeCompleted * 1000;
                }
            }

            this.decoratePlayerState();
            this.normalizePlayerState();
            this.syncAuthenticatedIdentity();
            this.updateHUD();
            return true;
        }
        return false;
    },

    /**
     * Check if save exists
     */
    hasSave() {
        return !!this.getStoredSaveData();
    }
};

if (typeof window !== 'undefined') {
    window.GameState = GameState;
}
