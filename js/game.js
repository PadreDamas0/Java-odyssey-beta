/* ============================================
   JAVA ODYSSEY - Main Game Controller
   Ties all systems together
   ============================================ */

const Game = {
    activeShopId: null,
    activeCodexCategory: null,
    WORLD_MAP_DESTINATIONS: {
        village: {
            sceneId: 'ch1_village_square',
            label: 'Village of Variables',
            transitionText: 'Travelling to the Village of Variables...'
        },
        corrupted_forest: {
            sceneId: 'ch1_corrupted_forest_1',
            label: 'Corrupted Forest',
            transitionText: 'Travelling to the Corrupted Forest...'
        },
        cave: {
            sceneId: 'ch1_cave_entrance',
            label: 'Cave Entrance',
            transitionText: 'Travelling to the Cave Entrance...',
            unlockFlag: 'ch1_cave_unlocked'
        },
        syntax_city: {
            sceneId: 'ch1_syntax_city_entry',
            label: 'Syntax City',
            transitionText: 'Travelling to Syntax City...',
            unlockFlag: 'ch1_syntax_city_unlocked'
        }
    },
    CITY_MAP_DESTINATIONS: {
        city_market: {
            sceneId: 'ch1_syntax_city_market',
            label: 'City Market',
            transitionText: 'Travelling to the City Market...',
            unlockFlag: 'ch1_city_market_unlocked'
        },
        city_square: {
            sceneId: 'ch1_syntax_city_square',
            label: 'City Square',
            transitionText: 'Travelling to the City Square...',
            unlockFlag: 'ch1_city_square_unlocked'
        },
        tavern: {
            sceneId: 'ch1_syntax_city_tavern',
            label: 'Tavern',
            transitionText: 'Travelling to the Tavern...',
            unlockFlag: 'ch1_city_tavern_unlocked'
        },
        castle: {
            sceneId: 'ch1_syntax_city_castle',
            label: 'Castle',
            transitionText: 'Travelling to the Castle...',
            unlockFlag: 'ch1_syntax_castle_unlocked'
        }
    },
    SHOP_ITEMS: {
        blacksmith: [
            {
                id: 'iron_dagger',
                name: 'Iron Dagger',
                icon: '🗡️',
                price: 50,
                description: 'A balanced blade for close combat.',
                effectText: '+5 damage permanently.'
            },
            {
                id: 'scholar_tome',
                name: 'Scholar\'s Tome',
                icon: '📘',
                price: 80,
                description: 'A study tome that sharpens every lesson.',
                effectText: '+3 XP from every future XP reward.'
            },
            {
                id: 'reinforced_bracers',
                name: 'Reinforced Bracers',
                icon: '🛡️',
                price: 65,
                description: 'Forged bracers that help you weather harder fights.',
                effectText: '+2 defense permanently.'
            },
            {
                id: 'vitality_charm',
                name: 'Vitality Charm',
                icon: '❤️',
                price: 75,
                description: 'A rune charm that bolsters your stamina.',
                effectText: '+20 max HP permanently.'
            },
            {
                id: 'lucky_coin',
                name: 'Lucky Coin',
                icon: '🪙',
                price: 90,
                description: 'A polished coin said to draw extra treasure.',
                effectText: '+10 gold after every future victory.'
            }
        ],
        merchant: []
    },
    
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

            if (typeof Platformer !== 'undefined' && typeof Platformer.stop === 'function' && Platformer.running) {
                Platformer.stop();
            }
            if (typeof World !== 'undefined') {
                World.currentScene = null;
            }
            
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
                    const savedScene = GameState.progress.currentScene;
                    if (
                        savedScene &&
                        typeof World !== 'undefined' &&
                        World.scenes &&
                        World.scenes[savedScene] &&
                        !GameState.hasFlag('ch1_forest_complete')
                    ) {
                        await World.loadScene(savedScene);
                        break;
                    }
                    if (!GameState.hasFlag('ch1_elder_intro_complete')) {
                        GameState.addQuest({
                            id: 'ch1_meet_elder',
                            title: 'Talk to the Village Elder',
                            description: 'Find Elder Varion in the village square and hear what is troubling the Village of Variables.'
                        });
                    } else if (!GameState.hasFlag('ch1_training_complete')) {
                        GameState.addQuest({
                            id: 'ch1_training',
                            title: 'Train with Rowan',
                            description: 'Complete Rowan\'s training dummy lesson before returning to Elder Varion.'
                        });
                    }
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
        const musicSlider = Utils.$('music-volume');
        const sfxSlider = Utils.$('sfx-volume');
        const musicVal = Utils.$('music-volume-value');
        const sfxVal = Utils.$('sfx-volume-value');
        const muteBtn = Utils.$('mute-toggle-btn');
        if (musicSlider) {
            musicSlider.style.setProperty('--range-fill', `${GameState.settings.musicVolume}%`);
        }
        if (sfxSlider) {
            sfxSlider.style.setProperty('--range-fill', `${GameState.settings.sfxVolume}%`);
        }
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
        const modal = Utils.$(modalId);
        if (modal) modal.style.display = 'none';
        if (modalId === 'world-map-modal' && typeof window.WorldMapOverlay !== 'undefined' && typeof window.WorldMapOverlay.close === 'function') {
            window.WorldMapOverlay.close();
        }
        if (modalId === 'shop-modal') {
            this.activeShopId = null;
        }
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
        this.activeCodexCategory = null;
        Utils.$('journal-modal').style.display = 'flex';
        this.showJournalTab('quests');
    },

    setJournalTabActive(tab) {
        document.querySelectorAll('.journal-tab').forEach((button) => {
            const label = (button.textContent || '').trim().toLowerCase();
            button.classList.toggle('active', label === tab);
        });
    },

    getCodexCategories() {
        return [
            {
                id: 'print_statements',
                title: 'PRINT STATEMENTS',
                matchers: [/system\.out\.println/i, /\bprint/i, /\boutput\b/i]
            },
            {
                id: 'integer',
                title: 'INTEGER',
                matchers: [/\binteger\b/i, /\bint\b/i]
            },
            {
                id: 'variables',
                title: 'VARIABLES',
                matchers: [/\bvariable/i, /\bvariables\b/i, /\bboolean\b/i, /\bstring\b/i, /\bdata type\b/i]
            }
        ];
    },

    getGroupedCodexEntries() {
        const categories = this.getCodexCategories().map((category) => ({ ...category, entries: [] }));
        GameState.journal.codex.forEach((entry) => {
            const searchable = `${entry.title} ${entry.description}`;
            const matchedCategory = categories.find((category) =>
                category.matchers.some((matcher) => matcher.test(searchable))
            ) || categories[categories.length - 1];
            matchedCategory.entries.push(entry);
        });
        return categories;
    },

    openCodexCategory(categoryId) {
        this.activeCodexCategory = categoryId;
        this.setJournalTabActive('codex');
        const body = Utils.$('journal-body');
        if (body) {
            body.innerHTML = this.renderCodexContent();
        }
    },

    renderCodexContent() {
        const groupedCodexEntries = this.getGroupedCodexEntries();
        const selectedCategory = groupedCodexEntries.find((category) => category.id === this.activeCodexCategory) || null;

        if (!selectedCategory) {
            let codexHomeHTML = `
                <h3 style="color: var(--text-gold); font-family: var(--font-heading); margin-bottom: 0.5rem;">Java Codex</h3>
                <p style="color: var(--text-light); margin-bottom: 0.9rem; line-height: 1.6;">
                    This is where you review your attacks, lessons, and correct answers as your Codex grows.
                </p>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:0.85rem; margin-bottom:1rem;">
            `;

            groupedCodexEntries.forEach((category) => {
                const unlocked = category.entries.length > 0;
                codexHomeHTML += `
                    <button
                        type="button"
                        class="journal-entry codex-category-card"
                        ${unlocked ? `onclick="Game.openCodexCategory('${category.id}')"` : 'disabled'}
                        style="margin:0; text-align:left; border-color:${unlocked ? 'rgba(240, 208, 96, 0.45)' : 'rgba(255,255,255,0.12)'}; background:${unlocked ? 'rgba(240,208,96,0.06)' : 'rgba(255,255,255,0.03)'}; width:100%; cursor:${unlocked ? 'pointer' : 'default'};"
                    >
                        <div class="quest-title" style="margin-bottom:0.35rem;">${category.title}</div>
                        <div class="quest-desc">
                            <p style="margin:0 0 0.35rem 0;">${unlocked ? `${category.entries.length} lesson${category.entries.length === 1 ? '' : 's'} ready to review.` : 'This section unlocks as the story progresses.'}</p>
                            <p style="margin:0; color: var(--text-dim); font-size:0.88rem;">${unlocked ? 'Click to review this topic.' : 'Keep learning to fill this section.'}</p>
                        </div>
                    </button>
                `;
            });

            codexHomeHTML += '</div>';

            if (GameState.journal.codex.length === 0) {
                codexHomeHTML += '<p style="color: var(--text-dim); font-style: italic;">No codex entries yet. Complete challenges to start filling these sections.</p>';
            }

            return codexHomeHTML;
        }

        let categoryHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:0.85rem;">
                <div>
                    <h3 style="color: var(--text-gold); font-family: var(--font-heading); margin:0 0 0.25rem 0;">${selectedCategory.title}</h3>
                    <p style="color: var(--text-light); margin:0;">Review the attacks, tips, and correct answers you've learned for this topic.</p>
                </div>
                <button class="menu-btn" type="button" onclick="Game.openCodexCategory(null)">Back</button>
            </div>
        `;

        if (selectedCategory.entries.length === 0) {
            categoryHTML += '<p style="color: var(--text-dim); font-style: italic;">Nothing here yet. Learn more in the story to unlock this topic.</p>';
            return categoryHTML;
        }

        selectedCategory.entries.forEach((entry) => {
            categoryHTML += `
                <div class="journal-entry">
                    <div class="quest-title">${entry.title}</div>
                    <div class="quest-desc">${entry.description}</div>
                </div>
            `;
        });

        return categoryHTML;
    },
    
    /**
     * Show journal tab
     */
    showJournalTab(tab) {
        this.setJournalTabActive(tab);
        
        const body = Utils.$('journal-body');

        if (tab === 'codex') {
            this.activeCodexCategory = null;
            body.innerHTML = this.renderCodexContent();
            return;
        }
        
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
                {
                    const codexCategories = [
                        {
                            id: 'print_statements',
                            title: 'PRINT STATEMENTS',
                            matchers: [/system\.out\.println/i, /\bprint/i, /\boutput\b/i]
                        },
                        {
                            id: 'integer',
                            title: 'INTEGER',
                            matchers: [/\binteger\b/i, /\bint\b/i]
                        },
                        {
                            id: 'variables',
                            title: 'VARIABLES',
                            matchers: [/\bvariable/i, /\bvariables\b/i, /\bboolean\b/i, /\bstring\b/i, /\bdata type\b/i]
                        }
                    ];

                    const groupedCodexEntries = codexCategories.map(category => ({ ...category, entries: [] }));
                    GameState.journal.codex.forEach(entry => {
                        const searchable = `${entry.title} ${entry.description}`;
                        const matchedCategory = groupedCodexEntries.find(category =>
                            category.matchers.some((matcher) => matcher.test(searchable))
                        ) || groupedCodexEntries[groupedCodexEntries.length - 1];
                        matchedCategory.entries.push(entry);
                    });

                    let codexReviewHTML = `
                        <h3 style="color: var(--text-gold); font-family: var(--font-heading); margin-bottom: 0.5rem;">Java Codex</h3>
                        <p style="color: var(--text-light); margin-bottom: 0.9rem; line-height: 1.6;">
                            This is where you review your attacks, lessons, and correct answers as your Codex grows.
                        </p>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:0.85rem; margin-bottom:1rem;">
                    `;

                    groupedCodexEntries.forEach(category => {
                        const unlocked = category.entries.length > 0;
                        codexReviewHTML += `
                            <div class="journal-entry" style="margin:0; border-color:${unlocked ? 'rgba(240, 208, 96, 0.45)' : 'rgba(255,255,255,0.12)'}; background:${unlocked ? 'rgba(240,208,96,0.06)' : 'rgba(255,255,255,0.03)'};">
                                <div class="quest-title" style="margin-bottom:0.35rem;">${category.title}</div>
                                <div class="quest-desc">
                                    <p style="margin:0 0 0.35rem 0;">${unlocked ? `${category.entries.length} lesson${category.entries.length === 1 ? '' : 's'} ready to review.` : 'This section unlocks as the story progresses.'}</p>
                                    <p style="margin:0; color: var(--text-dim); font-size:0.88rem;">${unlocked ? 'Open the entries below to review exact answers.' : 'Keep learning to fill this section.'}</p>
                                </div>
                            </div>
                        `;
                    });

                    codexReviewHTML += '</div>';

                    if (GameState.journal.codex.length === 0) {
                        codexReviewHTML += '<p style="color: var(--text-dim); font-style: italic;">No codex entries yet. Complete challenges to start filling these sections.</p>';
                    } else {
                        groupedCodexEntries.forEach(category => {
                            if (category.entries.length === 0) return;
                            codexReviewHTML += `<h3 style="color: var(--text-gold); font-family: var(--font-heading); margin: 1rem 0 0.5rem;">${category.title}</h3>`;
                            category.entries.forEach(entry => {
                                codexReviewHTML += `
                                    <div class="journal-entry">
                                        <div class="quest-title">ðŸ“š ${entry.title}</div>
                                        <div class="quest-desc">${entry.description}</div>
                                    </div>
                                `;
                            });
                        });
                    }

                    body.innerHTML = codexReviewHTML;
                    break;
                }
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
                            <p>Gold: ${GameState.player.gold || 0}</p>
                            <p>Total XP Earned: ${GameState.player.xp + (GameState.player.level - 1) * 100}</p>
                            <p>XP Bonus: +${GameState.player.xpBonus || 0}</p>
                            <p>Gold Bonus Per Victory: +${GameState.player.coinBonus || 0}</p>
                            <p>Attack: ${GameState.player.attack}</p>
                            <p>Defense: ${GameState.player.defense}</p>
                            <p>Max HP: ${GameState.player.maxHp}</p>
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

    isCityScene(sceneId) {
        return typeof sceneId === 'string' && (
            sceneId === 'ch1_syntax_city_entry' ||
            sceneId === 'ch1_syntax_city_market' ||
            sceneId === 'ch1_syntax_city_square' ||
            sceneId === 'ch1_syntax_city_tavern' ||
            sceneId === 'ch1_syntax_city_castle'
        );
    },

    handleWorldMapClick() {
        if (!GameState.hasFlag('ch1_world_map_unlocked')) {
            Utils.notify('You do not have the world map yet.', 'default');
            return;
        }
        if (GameState.combat && GameState.combat.active) {
            Utils.notify('You cannot open the world map during combat.', 'default');
            return;
        }
        if (GameState.dialogue && GameState.dialogue.active) {
            Utils.notify('Finish the current dialogue before opening the world map.', 'default');
            return;
        }

        this.refreshWorldMapHotspots();

        if (typeof window.WorldMapOverlay !== 'undefined' && typeof window.WorldMapOverlay.open === 'function') {
            window.WorldMapOverlay.open();
            return;
        }

        const modal = Utils.$('world-map-modal');
        if (modal) modal.style.display = 'flex';
    },

    async handleWorldMapTravel(destinationId) {
        if (!GameState.hasFlag('ch1_world_map_unlocked')) {
            Utils.notify('You do not have the world map yet.', 'default');
            return;
        }

        const destination = this.WORLD_MAP_DESTINATIONS[destinationId];
        if (!destination) {
            Utils.notify('That destination is still locked for now.', 'default');
            return;
        }
        if (destination.unlockFlag && !GameState.hasFlag(destination.unlockFlag)) {
            Utils.notify(`${destination.label} is still locked for now.`, 'default');
            return;
        }

        if (World && World.currentScene === destination.sceneId) {
            Utils.notify(`You are already at the ${destination.label}.`, 'default');
            return;
        }

        if (typeof window.WorldMapOverlay !== 'undefined' && typeof window.WorldMapOverlay.close === 'function') {
            window.WorldMapOverlay.close();
        }
        const modal = Utils.$('world-map-modal');
        if (modal) modal.style.display = 'none';

        await World.goTo(destination.sceneId, destination.transitionText);
        GameState.save();
    },

    refreshWorldMapHotspots() {
        Object.entries(this.WORLD_MAP_DESTINATIONS).forEach(([destinationId, destination]) => {
            if (!destination.unlockFlag) return;
            const hotspot = document.querySelector(`.world-map-hotspot[data-destination="${destinationId}"]`);
            if (!hotspot) return;

            const unlocked = GameState.hasFlag(destination.unlockFlag);
            hotspot.classList.toggle('is-unlocked', unlocked);
            hotspot.classList.toggle('is-locked', !unlocked);
            hotspot.setAttribute('data-state', unlocked ? 'Available' : 'Locked');
            hotspot.setAttribute('aria-label', unlocked ? `Travel to ${destination.label}` : `${destination.label} locked`);
            hotspot.title = unlocked ? `Travel to ${destination.label}` : 'Locked for now';
        });
    },

    updateWorldMapUi(sceneId) {
        const button = Utils.$('world-map-ui-button');
        if (!button) return;
        this.refreshWorldMapHotspots();

        const unlocked = GameState.hasFlag('ch1_world_map_unlocked');
        const isChapter1Scene = typeof sceneId === 'string' && sceneId.startsWith('ch1_');
        const dialogueOpen = !!(GameState.dialogue && GameState.dialogue.active);
        const caveSequenceLocked = (
            sceneId === 'ch1_cave_entrance' ||
            sceneId === 'ch1_cave_rush' ||
            sceneId === 'ch1_cave_inner'
        ) && !GameState.hasFlag('ch1_cave_return_ready');
        button.style.display = unlocked && isChapter1Scene && !caveSequenceLocked && !dialogueOpen ? 'flex' : 'none';
        this.updateCityMapUi(sceneId);
    },

    handleCityMapClick() {
        if (!GameState.hasFlag('ch1_city_map_unlocked')) {
            Utils.notify('You do not have the city map yet.', 'default');
            return;
        }
        if (GameState.combat && GameState.combat.active) {
            Utils.notify('You cannot open the city map during combat.', 'default');
            return;
        }
        if (GameState.dialogue && GameState.dialogue.active) {
            Utils.notify('Finish the current dialogue before opening the city map.', 'default');
            return;
        }
        if (!this.isCityScene(World.currentScene || GameState.progress.currentScene)) {
            Utils.notify('The city map only works inside Syntax City.', 'default');
            return;
        }

        this.refreshCityMapHotspots();
        const modal = Utils.$('city-map-modal');
        if (modal) modal.style.display = 'flex';
    },

    async handleCityMapTravel(destinationId) {
        if (!GameState.hasFlag('ch1_city_map_unlocked')) {
            Utils.notify('You do not have the city map yet.', 'default');
            return;
        }

        const destination = this.CITY_MAP_DESTINATIONS[destinationId];
        if (!destination) {
            Utils.notify('That district is still locked for now.', 'default');
            return;
        }
        if (destination.unlockFlag && !GameState.hasFlag(destination.unlockFlag)) {
            Utils.notify(`${destination.label} is still locked for now.`, 'default');
            return;
        }
        if (World && World.currentScene === destination.sceneId) {
            Utils.notify(`You are already at the ${destination.label}.`, 'default');
            return;
        }

        const modal = Utils.$('city-map-modal');
        if (modal) modal.style.display = 'none';

        await World.goTo(destination.sceneId, destination.transitionText);
        GameState.save();
    },

    refreshCityMapHotspots() {
        Object.entries(this.CITY_MAP_DESTINATIONS).forEach(([destinationId, destination]) => {
            const hotspot = document.querySelector(`.city-map-hotspot[data-destination="${destinationId}"]`);
            if (!hotspot) return;

            const unlocked = GameState.hasFlag(destination.unlockFlag);
            hotspot.classList.toggle('is-unlocked', unlocked);
            hotspot.classList.toggle('is-locked', !unlocked);
            hotspot.setAttribute('data-state', unlocked ? 'Available' : 'Locked');
            hotspot.setAttribute('aria-label', unlocked ? `Travel to ${destination.label}` : `${destination.label} locked`);
            hotspot.title = unlocked ? `Travel to ${destination.label}` : 'Locked for now';
        });
    },

    updateCityMapUi(sceneId) {
        const button = Utils.$('city-map-ui-button');
        if (!button) return;

        this.refreshCityMapHotspots();
        const unlocked = GameState.hasFlag('ch1_city_map_unlocked');
        const dialogueOpen = !!(GameState.dialogue && GameState.dialogue.active);
        button.style.display = unlocked && this.isCityScene(sceneId) && !dialogueOpen ? 'flex' : 'none';
    },

    showBlacksmithShop() {
        this.showShop('blacksmith');
    },

    showMerchantShop() {
        this.showShop('merchant');
    },

    showShop(shopId) {
        this.activeShopId = shopId;
        const modal = Utils.$('shop-modal');
        if (!modal) return;
        modal.style.display = 'flex';
        this.renderShop();
    },

    renderShop() {
        const shopId = this.activeShopId;
        const items = this.SHOP_ITEMS[shopId] || [];
        const list = Utils.$('shop-items');
        const title = Utils.$('shop-title');
        const goldEl = Utils.$('shop-gold');
        if (!list || !title || !goldEl) return;

        title.textContent = shopId === 'blacksmith' ? '⚒️ Blacksmith Brawn\'s Shop' : 'Shop';
        goldEl.textContent = `${GameState.player.gold || 0} Gold`;
        list.innerHTML = '';

        if (shopId === 'merchant') {
            title.textContent = 'Syntax City Market Stall';
        }

        if (items.length === 0) {
            list.innerHTML = `
                <div class="shop-item">
                    <div>
                        <div class="shop-item-name">Stock Coming Soon</div>
                        <div class="shop-item-desc">The merchant stall is open, but its shelves are still being prepared.</div>
                    </div>
                </div>
            `;
            return;
        }

        items.forEach((item) => {
            const owned = GameState.hasItem(item.id);
            const affordable = (GameState.player.gold || 0) >= item.price;
            const row = document.createElement('div');
            row.className = `shop-item ${affordable && !owned ? 'affordable' : ''}`;

            const actionLabel = owned ? 'Owned' : (affordable ? 'Buy' : 'Need Gold');
            row.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div>
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-desc">${item.description}</div>
                    <div class="shop-item-desc">${item.effectText}</div>
                    <div class="shop-item-price">Price: ${item.price} Gold</div>
                </div>
                <button class="menu-btn shop-buy-btn" ${(owned || !affordable) ? 'disabled' : ''} onclick="Game.purchaseShopItem('${item.id}')">${actionLabel}</button>
            `;
            list.appendChild(row);
        });
    },

    purchaseShopItem(itemId) {
        const shopId = this.activeShopId;
        const item = (this.SHOP_ITEMS[shopId] || []).find(entry => entry.id === itemId);
        if (!item) return;
        if (GameState.hasItem(item.id)) {
            Utils.notify(`${item.name} is already in your inventory.`, 'default');
            this.renderShop();
            return;
        }
        if (!GameState.spendGold(item.price)) {
            Utils.notify(`You need ${item.price} Gold for ${item.name}.`, 'default');
            this.renderShop();
            return;
        }

        switch (item.id) {
            case 'iron_dagger':
                GameState.player.attack += 5;
                break;
            case 'scholar_tome':
                GameState.player.xpBonus = (GameState.player.xpBonus || 0) + 3;
                break;
            case 'reinforced_bracers':
                GameState.player.defense += 2;
                break;
            case 'vitality_charm':
                GameState.player.maxHp += 20;
                GameState.player.hp = Math.min(GameState.player.maxHp, GameState.player.hp + 20);
                break;
            case 'lucky_coin':
                GameState.player.coinBonus = (GameState.player.coinBonus || 0) + 10;
                break;
            default:
                break;
        }

        GameState.addItem({
            id: item.id,
            name: item.name,
            icon: item.icon,
            description: `${item.description} ${item.effectText}`
        });
        GameState.updateHUD();
        Utils.notify(`${item.name} purchased. ${item.effectText}`, 'quest-update');
        this.renderShop();
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

        ['shop-modal', 'world-map-modal', 'inventory-modal', 'journal-modal', 'settings-modal'].forEach((modalId) => {
            const modal = Utils.$(modalId);
            if (modal) modal.style.display = 'none';
        });
        if (typeof window.WorldMapOverlay !== 'undefined' && typeof window.WorldMapOverlay.close === 'function') {
            window.WorldMapOverlay.close();
        }
        this.activeShopId = null;

        if (typeof Platformer !== 'undefined' && typeof Platformer.stop === 'function' && Platformer.running) {
            Platformer.stop();
        }
        if (typeof World !== 'undefined') {
            World.currentScene = null;
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
        if (typeof GameState !== 'undefined' && GameState.dialogue && GameState.dialogue.active) {
            return;
        }
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
