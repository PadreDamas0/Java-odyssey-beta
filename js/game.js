/* ============================================
   JAVA ODYSSEY - Main Game Controller
   Ties all systems together
   ============================================ */

const Game = {
    
    /**
     * Initialize the game
     */
    async init() {
        console.log('Java Odyssey: Initializing...');
        
        // Load settings
        this.loadSettings();
        
        // Generate menu particles
        Utils.generateCodeParticles();
        
        // Simulate loading
        await Assets.loadAll((progress, message) => {
            const bar = Utils.$('loading-bar');
            const text = Utils.$('loading-text');
            if (bar) bar.style.width = progress + '%';
            if (text) text.textContent = message;
        });
        
        // Check for save data
        if (GameState.hasSave()) {
            const continueBtn = Utils.$('btn-continue');
            if (continueBtn) continueBtn.style.display = 'block';
        }
        
        // Show main menu
        await Utils.wait(500);
        Utils.showScreen('main-menu');
        
        // Play main menu music
        Audio.playBgm('mainMenu', true);
        
        console.log('Java Odyssey: Ready!');
    },
    
    /**
     * Start a new game
     */
    async startNewGame() {
        // Initialize fresh state
        GameState.init();
        
        // Hide menu, show game
        Utils.showScreen('game-container');
        
        // Start intro sequence
        await IntroScene.start();
    },
    
    /**
     * Continue from save
     */
    async continueGame() {
        if (GameState.load()) {
            Utils.showScreen('game-container');
            GameState.updateHUD();
            
            // Resume from saved phase
            switch (GameState.phase) {
                case 'intro':
                    await IntroScene.start();
                    break;
                case 'tutorial':
                    TutorialScene.startTutorialCombat();
                    break;
                case 'portal':
                    await PortalScene.start();
                    break;
                case 'chapter1':
                    // Load the appropriate scene
                    Chapter1Scene.registerScenes();
                    if (GameState.hasFlag('ch1_forest_complete')) {
                        await Chapter1Scene.chapterConclusion();
                    } else if (GameState.hasFlag('ch1_training_complete')) {
                        await World.loadScene('ch1_village_square');
                    } else if (GameState.hasFlag('ch1_elder_talked')) {
                        await World.loadScene('ch1_village_square');
                    } else {
                        await Chapter1Scene.start();
                    }
                    break;
                default:
                    await IntroScene.start();
            }
        } else {
            Utils.notify('No save data found!', 'default');
        }
    },
    
    /**
     * Save the game
     */
    saveGame() {
        if (GameState.save()) {
            Utils.notify('💾 Game saved!', 'default');
        } else {
            Utils.notify('❌ Failed to save game.', 'default');
        }
    },
    
    /**
     * Show settings modal
     */
    showSettings() {
        const modal = Utils.$('settings-modal');
        modal.style.display = 'flex';
        
        // Load current settings
        Utils.$('text-speed').value = GameState.settings.textSpeed;
        Utils.$('music-volume').value = GameState.settings.musicVolume;
        Utils.$('sfx-volume').value = GameState.settings.sfxVolume;
        this.refreshAudioSettingsUi();
    },
    
    /**
     * Update settings
     */
    updateSettings() {
        GameState.settings.textSpeed = Utils.$('text-speed').value;
        GameState.settings.musicVolume = parseInt(Utils.$('music-volume').value);
        GameState.settings.sfxVolume = parseInt(Utils.$('sfx-volume').value);

        // Apply audio immediately (real-time volume changes)
        Audio.setBgmVolume(GameState.settings.musicVolume / 100);
        Audio.setSfxVolume(GameState.settings.sfxVolume / 100);
        Audio.setMuted(!!GameState.settings.muted);
        this.refreshAudioSettingsUi();
        
        Utils.saveToStorage(CONFIG.SETTINGS_KEY, GameState.settings);
    },

    /**
     * Toggle global audio mute
     */
    toggleMute() {
        GameState.settings.muted = !GameState.settings.muted;
        Audio.setMuted(GameState.settings.muted);
        this.refreshAudioSettingsUi();
        Utils.saveToStorage(CONFIG.SETTINGS_KEY, GameState.settings);
    },

    /**
     * Keep settings UI in sync with current audio state
     */
    refreshAudioSettingsUi() {
        const musicVal = Utils.$('music-volume-value');
        const sfxVal = Utils.$('sfx-volume-value');
        const muteBtn = Utils.$('mute-toggle-btn');
        if (musicVal) musicVal.textContent = `${GameState.settings.musicVolume}%`;
        if (sfxVal) sfxVal.textContent = `${GameState.settings.sfxVolume}%`;
        if (muteBtn) muteBtn.textContent = `Mute: ${GameState.settings.muted ? 'On' : 'Off'}`;
    },
    
    /**
     * Load settings from storage
     */
    loadSettings() {
        const saved = Utils.loadFromStorage(CONFIG.SETTINGS_KEY);
        if (saved) {
            GameState.settings = { ...GameState.settings, ...saved };
        }
        Audio.setBgmVolume((GameState.settings.musicVolume || 0) / 100);
        Audio.setSfxVolume((GameState.settings.sfxVolume || 0) / 100);
        Audio.setMuted(!!GameState.settings.muted);
    },
    
    /**
     * Show about modal
     */
    showAbout() {
        Utils.$('about-modal').style.display = 'flex';
    },
    
    /**
     * Close a modal
     */
    closeModal(modalId) {
        Utils.$(modalId).style.display = 'none';
    },
    
    /**
     * Toggle pause menu
     */
    togglePauseMenu() {
        const pause = Utils.$('pause-menu');
        if (pause.style.display === 'none' || !pause.style.display) {
            pause.style.display = 'flex';
        } else {
            pause.style.display = 'none';
        }
    },
    
    /**
     * Show journal
     */
    showJournal() {
        Utils.$('journal-modal').style.display = 'flex';
        this.showJournalTab('quests');
    },
    
    /**
     * Show journal tab
     */
    showJournalTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.journal-tab').forEach(t => t.classList.remove('active'));
        event.target?.classList.add('active');
        
        const body = Utils.$('journal-body');
        
        switch (tab) {
            case 'quests':
                let questHTML = '<h3 style="color: var(--text-gold); font-family: var(--font-heading); margin-bottom: 0.5rem;">Active Quests</h3>';
                
                if (GameState.journal.activeQuests.length === 0) {
                    questHTML += '<p style="color: var(--text-dim); font-style: italic;">No active quests.</p>';
                } else {
                    GameState.journal.activeQuests.forEach(q => {
                        questHTML += `
                            <div class="journal-entry">
                                <div class="quest-title">📜 ${q.title}</div>
                                <div class="quest-desc">${q.description}</div>
                            </div>
                        `;
                    });
                }
                
                questHTML += '<h3 style="color: var(--accent-green); font-family: var(--font-heading); margin: 1rem 0 0.5rem;">Completed Quests</h3>';
                
                if (GameState.journal.completedQuests.length === 0) {
                    questHTML += '<p style="color: var(--text-dim); font-style: italic;">No completed quests yet.</p>';
                } else {
                    GameState.journal.completedQuests.forEach(q => {
                        questHTML += `
                            <div class="journal-entry completed">
                                <div class="quest-title">✅ ${q.title}</div>
                                <div class="quest-desc">${q.description}</div>
                            </div>
                        `;
                    });
                }
                
                body.innerHTML = questHTML;
                break;
                
            case 'codex':
                let codexHTML = '<h3 style="color: var(--text-gold); font-family: var(--font-heading); margin-bottom: 0.5rem;">Java Codex</h3>';
                
                if (GameState.journal.codex.length === 0) {
                    codexHTML += '<p style="color: var(--text-dim); font-style: italic;">No codex entries yet. Complete challenges to learn Java concepts!</p>';
                } else {
                    GameState.journal.codex.forEach(entry => {
                        codexHTML += `
                            <div class="journal-entry">
                                <div class="quest-title">📚 ${entry.title}</div>
                                <div class="quest-desc">${entry.description}</div>
                            </div>
                        `;
                    });
                }
                
                body.innerHTML = codexHTML;
                break;
                
            case 'stats':
                const perf = GameState.performance;
                const statsHTML = `
                    <h3 style="color: var(--text-gold); font-family: var(--font-heading); margin-bottom: 0.5rem;">Guardian Stats</h3>
                    <div class="journal-entry">
                        <div class="quest-title">📊 Performance</div>
                        <div class="quest-desc">
                            <p>Level: ${GameState.player.level}</p>
                            <p>Total XP Earned: ${GameState.player.xp + (GameState.player.level - 1) * 100}</p>
                            <p>Challenges Completed: ${perf.correctAnswers}</p>
                            <p>Total Attempts: ${perf.totalAttempts}</p>
                            <p>Hints Used: ${perf.hintsUsed}</p>
                            <p>Current Streak: ${perf.currentStreak}</p>
                            <p>Best Streak: ${perf.bestStreak}</p>
                            <p>Average Attempts: ${perf.averageAttempts.toFixed(1)}</p>
                            <p>Difficulty Level: ${perf.difficultyLevel}</p>
                        </div>
                    </div>
                `;
                body.innerHTML = statsHTML;
                break;
        }
    },
    
    /**
     * Show inventory
     */
    showInventory() {
        Utils.$('inventory-modal').style.display = 'flex';
        
        const grid = Utils.$('inventory-items');
        grid.innerHTML = '';
        
        // Fill with items
        GameState.inventory.forEach(item => {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.innerHTML = `
                <span class="item-icon">${item.icon || '📦'}</span>
                <span class="item-name">${item.name}</span>
            `;
            slot.title = item.description || item.name;
            grid.appendChild(slot);
        });
        
        // Fill remaining slots
        const remaining = 12 - GameState.inventory.length;
        for (let i = 0; i < remaining; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.innerHTML = '<span class="item-icon" style="opacity:0.2">—</span>';
            grid.appendChild(slot);
        }
    },
    
    /**
     * Return to main menu
     */
    returnToMenu() {
        // Save before leaving
        GameState.save();
        
        // Hide pause menu
        Utils.$('pause-menu').style.display = 'none';
        
        // Reset combat if active
        if (GameState.combat.active) {
            Utils.$('combat-interface').style.display = 'none';
            GameState.combat.active = false;
        }
        
        // Show continue button
        const continueBtn = Utils.$('btn-continue');
        if (continueBtn) continueBtn.style.display = 'block';
        
        // Show main menu
        Utils.showScreen('main-menu');
    }
};

// ============================================
// Initialize game when page loads
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

// Handle keyboard shortcuts
window.addEventListener('keydown', (e) => {
    // Escape to toggle pause
    if (e.key === 'Escape') {
        const gameContainer = Utils.$('game-container');
        if (gameContainer && gameContainer.classList.contains('active')) {
            // Close any open modals first
            const modals = document.querySelectorAll('.modal');
            let closedModal = false;
            modals.forEach(m => {
                if (m.style.display === 'flex') {
                    m.style.display = 'none';
                    closedModal = true;
                }
            });
            
            if (!closedModal) {
                Game.togglePauseMenu();
            }
        }
    }
});
