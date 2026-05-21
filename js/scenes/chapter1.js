/* ============================================
   JAVA ODYSSEY - Chapter 1: Village of Variables
   Medieval world, green grasses, village
   Focus: Variables, Data Types, Basic I/O
   ============================================ */

// Fallback World manager (only used if world.js fails to load)
// This ensures Chapter 1 still works even if the normal World manager isn't available.
if (typeof window !== 'undefined' && typeof window.World === 'undefined') {
    window.World = {
        currentScene: null,
        scenes: {},

        registerScene(id, sceneData) {
            this.scenes[id] = sceneData;
        },

        async loadScene(sceneId, options = {}) {
            const scene = this.scenes[sceneId];
            if (!scene) return;

            this.currentScene = sceneId;
            if (window.GameState) {
                window.GameState.progress.currentScene = sceneId;
            }
            if (typeof Game !== 'undefined' && typeof Game.updateWorldMapUi === 'function') {
                Game.updateWorldMapUi(sceneId);
            }
            if (typeof Audio !== 'undefined') {
                if (sceneId.startsWith('ch1_cave_')) {
                    Audio.stopBgm(true);
                } else if (sceneId.startsWith('ch1_')) {
                    Audio.playBgm('mainMenu', true);
                }
            }

            // Basic UI adjustments
            if (window.Utils) {
                Utils.show('world-display');
                Utils.hide('combat-interface');
                Utils.hide('dialogue-box');

                // Avoid stacking the same village map behind the platformer canvas.
                const worldDisplay = Utils.$('world-display');
                if (worldDisplay) {
                    worldDisplay.style.background = 'var(--bg-darker)';
                }

                if (scene.art) {
                    Utils.setSceneArt(scene.art, scene.artClass || '');
                }
                Utils.setSceneText(scene.description || '');
                Utils.setActions(scene.actions || []);
            }

            if (sceneId.startsWith('ch1_')) {
                const phaserContainer = Utils.$('phaser-container');
                const sceneArt = Utils.$('scene-art');
                if (phaserContainer) phaserContainer.style.display = 'block';
                if (sceneArt) sceneArt.style.display = 'none';

                if (window.Platformer && typeof Platformer.start === 'function') {
                    Platformer.start('phaser-container');
                }
            }

            if (scene.onEnter) {
                await scene.onEnter(options);
            }
        },

        async goTo(sceneId, transitionText = null) {
            await this.loadScene(sceneId, { transition: true, transitionText });
        },

        updateActions(actions) {
            if (window.Utils) Utils.setActions(actions);
        }
    };
}

const Chapter1Scene = {
    
    /**
     * Start Chapter 1
     */
    async start() {
        GameState.phase = 'chapter1';

        // ✅ make sure the game UI is visible
        Utils.showScreen('game-container');

        if (!GameState.hasFlag('ch1_elder_intro_complete')) {
            GameState.addQuest({
                id: 'ch1_meet_elder',
                title: 'Talk to the Village Elder',
                description: 'Find Elder Varion in the village square and hear what is troubling the Village of Variables.'
            });
        }

            // Register all Chapter 1 scenes
        this.registerScenes();

        // Start at village entrance
        await this.villageEntrance();
    },

    // NOTE: World is now treated as a best-effort dependency. If world.js fails to load,
    // a minimal fallback World implementation (created at the top of this file) will keep
    // Chapter 1 running.

    async waitForWorld() {
        // No-op: the fallback above guarantees `window.World` exists by the time this runs.
        return;
    },

    /**
     * Register all scenes for this chapter
     */
    registerScenes() {
        // Village Entrance
        World.registerScene('ch1_entrance', {
            locationName: 'Village of Variables — Entrance',
            art: 'fullMap',
            artClass: 'portal-entry-map',
            description: `
                <div class="location-intro">🏰 Village of Variables — Entrance</div>
                <p class="narrator">You stand at the entrance of a quaint medieval village. Thatched-roof cottages line 
                cobblestone streets, and villagers go about their daily routines. However, something is clearly wrong — 
                some buildings flicker like broken holograms, and strange glitchy artifacts float in the air.</p>
            `,
            actions: [
                { label: 'Enter Village', icon: '🏘️', primary: true, callback: () => World.goTo('ch1_village_square', 'Entering the village...') },
                { label: 'Look Around', icon: '👀', callback: () => Chapter1Scene.lookAroundEntrance() }
            ],
            hidePhaser: true
        });
        
        // Village Square
        World.registerScene('ch1_village_square', {
            locationName: 'Village of Variables — Square',
            art: 'village',
            artClass: 'full-screen-map',
            description: '',
            actions: [],
            // Full-screen map mode hides Phaser canvas (used for static map view), so disable it for the platformer.
            fullScreenMap: false,
            hidePhaser: false  // Show Phaser with player
        });
        
        World.registerScene('ch1_corrupted_forest_1', {
            locationName: 'Corrupted Forest 1',
            art: 'forestPath',
            artClass: 'dark-forest',
            description: '',
            actions: [],
            fullScreenMap: false,
            hidePhaser: false
        });

        World.registerScene('ch1_corrupted_forest_2', {
            locationName: 'Corrupted Forest 2',
            art: 'forestPath',
            artClass: 'dark-forest',
            description: '',
            actions: [],
            fullScreenMap: false,
            hidePhaser: false,
            onEnter: async () => this.enterForest2()
        });

        World.registerScene('ch1_abandoned_village', {
            locationName: 'Abandoned Village',
            art: 'forestPath',
            artClass: 'dark-forest',
            description: '',
            actions: [],
            fullScreenMap: false,
            hidePhaser: false,
            onEnter: async () => this.enterAbandonedVillage()
        });

        World.registerScene('ch1_cave_entrance', {
            locationName: 'Cave Entrance',
            art: 'forestPath',
            artClass: 'dark-forest',
            description: '',
            actions: [],
            fullScreenMap: false,
            hidePhaser: false,
            onEnter: async () => this.enterCaveEntrance()
        });

        World.registerScene('ch1_cave_rush', {
            locationName: 'Cave Depths',
            art: 'forestPath',
            artClass: 'dark-forest',
            description: '',
            actions: [],
            fullScreenMap: false,
            hidePhaser: false,
            onEnter: async () => this.enterCaveRush()
        });

        World.registerScene('ch1_cave_inner', {
            locationName: 'Inner Cave',
            art: 'forestPath',
            artClass: 'dark-forest',
            description: '',
            actions: [],
            fullScreenMap: false,
            hidePhaser: false,
            onEnter: async () => this.enterCaveInner()
        });

        World.registerScene('ch1_syntax_city_entry', {
            locationName: 'Syntax City - Entrance',
            art: 'forestPath',
            artClass: 'dark-forest',
            description: '',
            actions: [],
            fullScreenMap: false,
            hidePhaser: false
        });

        World.registerScene('ch1_syntax_city_market', {
            locationName: 'Syntax City - Market',
            art: 'forestPath',
            artClass: 'dark-forest',
            description: '',
            actions: [],
            fullScreenMap: false,
            hidePhaser: false
        });

        World.registerScene('ch1_syntax_city_square', {
            locationName: 'Syntax City - City Square',
            art: 'forestPath',
            artClass: 'dark-forest',
            description: '',
            actions: [],
            fullScreenMap: false,
            hidePhaser: false
        });

        World.registerScene('ch1_syntax_city_tavern', {
            locationName: 'Syntax City - Tavern',
            art: 'forestPath',
            artClass: 'dark-forest',
            description: '',
            actions: [],
            fullScreenMap: false,
            hidePhaser: false
        });

        World.registerScene('ch1_syntax_city_castle', {
            locationName: 'Syntax City - Castle',
            art: 'forestPath',
            artClass: 'dark-forest',
            description: '',
            actions: [],
            fullScreenMap: false,
            hidePhaser: false
        });

        World.registerScene('ch1_arena_outskirts', {
            locationName: 'Arena of Heroes - Outskirts',
            art: 'forestPath',
            artClass: 'dark-forest',
            description: '',
            actions: [],
            fullScreenMap: false,
            hidePhaser: false,
            onEnter: async () => this.enterArenaOutskirts()
        });

        World.registerScene('ch1_arena_inside', {
            locationName: 'Arena of Heroes - Inside',
            art: 'forestPath',
            artClass: 'dark-forest',
            description: '',
            actions: [],
            fullScreenMap: false,
            hidePhaser: false,
            onEnter: async () => this.enterArenaInside()
        });

        // Training Grounds
        World.registerScene('ch1_training', {
            locationName: 'Village of Variables — Training Grounds',
            art: `
    ╔═══════════════════════════════════╗
    ║     TRAINING GROUNDS              ║
    ║  ┌─────┐  ⚔️  ┌─────┐           ║
    ║  │DUMMY│      │DUMMY│           ║
    ║  └──┬──┘      └──┬──┘           ║
    ║     │    ░░░░    │              ║
    ║  ═══╧════════════╧═══           ║
    ║     🌿    🌿    🌿              ║
    ╚═══════════════════════════════════╝`,
            artClass: 'medieval-village',
            description: `
                <div class="location-intro">⚔️ Training Grounds</div>
                <p class="narrator">A cleared area at the edge of the village serves as the training grounds. 
                Wooden practice dummies stand in rows, and targets are set up for ranged practice. 
                This is where aspiring Code Guardians hone their skills.</p>
            `,
            actions: [
                { label: 'Practice Coding', icon: '📝', primary: true, callback: () => Chapter1Scene.startTraining() },
                { label: 'Return to Square', icon: '🔙', callback: () => World.goTo('ch1_village_square', 'Returning to the village square...') }
            ]
        });
        
        // Forest Path (locked until training complete)
        World.registerScene('ch1_forest', {
            locationName: 'Village of Variables — Forest Path',
            art: 'forestPath',
            artClass: 'dark-forest',
            description: `
                <div class="location-intro">🌲 Forest Path — Corrupted Zone</div>
                <p class="narrator">The forest path leads deeper into the corrupted zone. The trees here are twisted and 
                glitchy, their leaves flickering between green and digital static. Strange creatures lurk in the shadows, 
                their forms made of broken code.</p>
                <p class="narrator" style="color: var(--accent-red);">⚔️ Danger ahead! Corrupted creatures patrol this area.</p>
            `,
            actions: [
                { label: 'Face the Corruption', icon: '⚔️', primary: true, callback: () => Chapter1Scene.forestBattle() },
                { label: 'Return to Village', icon: '🔙', callback: () => World.goTo('ch1_village_square', 'Retreating to the village...') }
            ]
        });
    },
    
    /**
     * Walk to an NPC first, then trigger talk.
     */
    walkToNpcThenTalk(role, talkFn) {
        if (CONFIG.ENABLE_PHASER_WORLD && PhaserWorld && typeof PhaserWorld.walkToNpc === 'function') {
            PhaserWorld.walkToNpc(role, talkFn);
            return;
        }
        talkFn();
    },

    /**
     * Village Entrance - first arrival
     */
    async villageEntrance() {
        // Start at the entrance so the player can choose to enter the village (buttons available)
        await World.loadScene('ch1_entrance');
        
        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>You emerge from the portal into a world of rolling green hills and medieval architecture. The air is fresh, but there's an unmistakable digital hum beneath everything.</em>`,
                portrait: '📖'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `Whoa... This is the Java Realm? It looks like a medieval fantasy world! But I can see the corruption Cipher mentioned — those glitchy spots in the air...`,
                portrait: '🧑‍💻'
            },
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>A sign at the village entrance reads: "Welcome to the Village of Variables — Where All Things Begin."</em>`,
                portrait: '📖'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `"Village of Variables"... Cipher said to find the Village Elder. I should head into the village and look for them.`,
                portrait: '🧑‍💻'
            }
        ]);
    },
    
    /**
     * Look around at entrance
     */
    async lookAroundEntrance() {
        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>You take a moment to observe your surroundings. The village is nestled in a valley surrounded by gentle hills. To the north, a dark forest looms — its trees twisted with corruption.</em>`,
                portrait: '📖'
            },
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The village itself has about a dozen buildings. You can see a central square with a fountain, what appears to be training grounds to the east, and the corrupted forest to the north.</em>`,
                portrait: '📖'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `I can see the corruption is worse near the forest. I should talk to the villagers first and figure out what's going on.`,
                portrait: '🧑‍💻'
            }
        ]);
    },
    
    /**
     * Talk to the Village Elder
     */
    async talkToElder() {
        if (GameState.hasFlag('ch1_elder_intro_complete') && GameState.hasFlag('ch1_training_complete')) {
            // After training, elder gives new info
            await this.elderPostTraining();
            return;
        }
        
        if (GameState.hasFlag('ch1_elder_intro_complete')) {
            GameState.addQuest({
                id: 'ch1_training',
                title: 'Train with Rowan',
                description: 'Complete Rowan\'s training dummy lesson before returning to Elder Varion.'
            });
            await Dialogue.quick('elder', 'Elder Varion',
                `Have you trained with <span class="highlight">Rowan</span> yet, ${GameState.player.name}? Complete her dummy lesson first, then return to me.`,
                '👴');
            return;
        }
        
        GameState.setFlag('ch1_elder_talked');
        GameState.setFlag('ch1_elder_intro_complete');
        GameState.completeQuest('ch1_meet_elder');
        
        await Dialogue.start([
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `Ah, a newcomer! And... you came through the portal? Then you must be the one Cipher spoke of in his message.`,
                portrait: '👴'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `You know Cipher? He sent me here to help restore the Prime Scripts!`,
                portrait: '🧑‍💻'
            },
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `Indeed. I am <span class="highlight">Elder Varion</span>, keeper of this village. Our region's Prime Script governs <span class="highlight">Variables and Data Types</span> — the foundation of all code.`,
                portrait: '👴'
            },
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `When the corruption struck, our Prime Script shattered into fragments. Without it, nothing in our village works properly. The fountain runs backward, numbers lose their values, names become garbled...`,
                portrait: '👴'
            },
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `The fragments were scattered into the <span class="highlight">Corrupted Forest</span> to the north. Corrupted creatures now guard them.`,
                portrait: '👴'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `So I need to go into the forest, defeat the creatures, and recover the Prime Script fragments?`,
                portrait: '🧑‍💻'
            },
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `Yes, but you're not ready yet. The creatures in the forest are stronger than simple Syntax Bugs. You need to understand <span class="highlight">Variables and Data Types</span> deeply.`,
                portrait: '👴'
            },
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `Let me teach you the basics. In Java, a <span class="highlight">variable</span> is like a container that holds data. Each variable has a <span class="highlight">type</span> that determines what kind of data it can hold.`,
                portrait: '👴'
            },
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `The basic types are: <span class="code-inline">int</span> for whole numbers, <span class="code-inline">double</span> for decimal numbers, <span class="code-inline">boolean</span> for true/false, <span class="code-inline">char</span> for single characters, and <span class="code-inline">String</span> for text.`,
                portrait: '👴'
            },
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `Go to the <span class="highlight">Training Grounds</span> east of the square and train with <span class="highlight">Rowan</span>. Return to me after you complete her dummy trial.`,
                portrait: '👴'
            }
        ]);
        
        // Add codex entries
        GameState.addCodexEntry({
            id: 'variables_basics',
            title: 'Variables — The Basics',
            description: 'A variable is a container that holds data. In Java, you declare a variable with: type name = value; Example: int age = 20;'
        });
        
        GameState.addCodexEntry({
            id: 'data_types',
            title: 'Primitive Data Types',
            description: 'int (whole numbers), double (decimals), boolean (true/false), char (single character), String (text). Each type determines what data a variable can hold.'
        });
        
        // Add training quest
        GameState.addQuest({
            id: 'ch1_training',
            title: 'Train with Rowan',
            description: 'Complete Rowan\'s training dummy lesson before returning to Elder Varion.'
        });
    },
    
    /**
     * Talk to a villager
     */
    async talkToVillager() {
        const villagerDialogues = [
            {
                speaker: 'villager',
                name: 'Villager Ada',
                text: `Ever since the Prime Script broke, my name keeps changing! Yesterday I was "Ada", today the system calls me "null". It's very confusing!`,
                portrait: '👨‍🌾'
            },
            {
                speaker: 'villager',
                name: 'Villager Ada',
                text: `The Elder says it's because the <span class="code-inline">String</span> variables aren't working properly. Without the Prime Script, text data gets corrupted.`,
                portrait: '👨‍🌾'
            },
            {
                speaker: 'villager',
                name: 'Villager Ada',
                text: `Please help us, Guardian! If you can restore the Prime Script, everything will go back to normal.`,
                portrait: '👨‍🌾'
            }
        ];
        
        await Dialogue.start(villagerDialogues);
    },

    /**
     * Talk to the village trainer
     */
    async talkToTrainer() {
        if (!GameState.hasFlag('ch1_elder_talked')) {
            await Dialogue.quick('trainer', 'Trainer Rowan',
                `Easy there, Guardian. Elder Varion asked to speak with you first. Hear the Elder's guidance, then come back and I'll get you started.`,
                '🥋');
            return;
        }

        if (GameState.hasFlag('ch1_training_complete')) {
            await Dialogue.quick('trainer', 'Trainer Rowan',
                `<em>You've already cleared my dummy trial. Report back to Elder Varion and be ready for what comes next.</em>`,
                '🥋');
            return;
        }

        const choice = await Dialogue.askChoice(
            'trainer',
            'Trainer Rowan',
            `I'm Rowan, the village trainer. Want to do a quick round with the dummy? I'll keep it easy and give you hints if you need them.`,
            [
                { text: 'Yes, let\'s train.', value: 'train' },
                { text: 'Not yet.', value: 'later' }
            ],
            '🥋'
        );

        if (!choice || choice.value !== 'train') {
            await Dialogue.quick('trainer', 'Trainer Rowan',
                `No rush. When you're ready, come back and I'll run you through the basics.`,
                '🥋');
            return;
        }

        await this.startTraining();
        return;

        await Dialogue.start([
            {
                speaker: 'trainer',
                name: 'Trainer Rowan',
                text: `Welcome, Guardian. I oversee the <span class="highlight">Training Grounds</span> and prepare every new Code Guardian for the road ahead. Variables may look simple, but mastering them is where your strength begins.`,
                portrait: '🥋'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `Got it — I'll start training right away!`,
                portrait: '🧑‍💻'
            },
            {
                speaker: 'trainer',
                name: 'Trainer Rowan',
                text: `Remember: variables are like containers. Learn what each type can hold, and the Prime Script will start to obey your commands.`,
                portrait: '🥋'
            }
        ]);

        // Kick off training for convenience
        await this.startTraining();
    },

    async talkToWizard() {
        await this.talkToTrainer();
    },

    /**
     * Talk to the blacksmith
     */
    async talkToBlacksmith() {
        const choice = await Dialogue.askChoice(
            'blacksmith',
            'Blacksmith Brawn',
            `I've got steel, charms, and study gear for a growing Code Guardian. Want to browse my wares?`,
            [
                { text: 'Show me the shop.', value: 'shop' },
                { text: 'Maybe later.', value: 'later' }
            ],
            '⚒️'
        );

        if (choice && choice.value === 'shop') {
            if (typeof Game !== 'undefined' && typeof Game.showBlacksmithShop === 'function') {
                Game.showBlacksmithShop();
            }
            return;
        }

        await Dialogue.quick(
            'blacksmith',
            'Blacksmith Brawn',
            `No problem. Come back when you want to turn that gold into better gear.`,
            '⚒️'
        );
        return;

        await Dialogue.start([
            {
                speaker: 'blacksmith',
                name: 'Blacksmith Brawn',
                text: `The forge hasn't run right since the corruption came. I can still make a simple tool, but I need the Prime Script restored before I can craft anything truly powerful.`,
                portrait: '🛠️'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `I'll do my best. First I need to learn the basics and recover the Prime Script fragments.`,
                portrait: '🧑‍💻'
            },
            {
                speaker: 'blacksmith',
                name: 'Blacksmith Brawn',
                text: `Come back after you've trained. I might have something useful for a Code Guardian like you.`,
                portrait: '🛠️'
            }
        ]);
    },

    /**
     * Try to enter forest before training
     */
    async tryForest() {
        if (!GameState.hasFlag('ch1_training_complete')) {
            await Dialogue.quick('narrator', 'Narrator',
                `<em>The path to the forest is blocked by a barrier of corrupted code. You'll need to complete your training at the Training Grounds before you can pass through.</em>`,
                '📖');
            return;
        }

        if (!GameState.hasFlag('ch1_forest_path_unlocked')) {
            await Dialogue.quick('elder', 'Elder Varion',
                `Return to me first, ${GameState.player.name}. I have final guidance before you enter the forest.`,
                'ðŸ‘´');
            return;
        }

        if (!GameState.hasFlag('ch1_forest_path_unlocked')) {
            await Dialogue.quick('elder', 'Elder Varion',
                `Return to me first, ${GameState.player.name}. I have final guidance before you enter the forest.`,
                '👴');
            return;
        }

        await World.goTo('ch1_corrupted_forest_1', 'Leaving the village...');
    },
    
    async tryForest() {
        if (!GameState.hasFlag('ch1_training_complete')) {
            await Dialogue.quick('narrator', 'Narrator',
                `<em>The path to the forest is blocked by a barrier of corrupted code. You'll need to complete your training at the Training Grounds before you can pass through.</em>`,
                '📜');
            return;
        }

        if (!GameState.hasFlag('ch1_forest_path_unlocked')) {
            await Dialogue.quick('elder', 'Elder Varion',
                `Return to me first, ${GameState.player.name}. I have final guidance before you enter the forest.`,
                '👴');
            return;
        }

        await World.goTo('ch1_corrupted_forest_1', 'Leaving the village...');
    },

    syncQuest(quest) {
        if (!quest || !quest.id || !GameState || !GameState.journal) return;

        const activeQuest = GameState.journal.activeQuests.find((entry) => entry.id === quest.id);
        if (activeQuest) {
            activeQuest.title = quest.title;
            activeQuest.description = quest.description;
            return;
        }

        const completed = GameState.journal.completedQuests.some((entry) => entry.id === quest.id)
            || GameState.progress.completedQuests.includes(quest.id);
        if (!completed) {
            GameState.addQuest(quest);
        }
    },

    async talkToHera() {
        if (GameState.hasFlag('ch1_report_to_elder_after_abandoned')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                `We're close now, ${GameState.player.name}. Take the map back to Elder Varion so he can guide the final push toward the fragment.`,
                'ðŸ§'
            );
            return;
        }

        if (GameState.hasFlag('ch1_abandoned_goblin_defeated')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                `The abandoned village is clear. Elder Varion needs to see the route I marked on the map.`,
                'ðŸ§'
            );
            return;
        }

        if (GameState.hasFlag('ch1_abandoned_village_unlocked')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                `The trail beyond this grove leads to an <span class="highlight">abandoned village</span>. Take the right path when you're ready, and stay sharp.`,
                'ðŸ§'
            );
            return;
        }

        if (GameState.hasFlag('ch1_goblin_defeated') && !GameState.hasFlag('ch1_abandoned_village_unlocked')) {
            await Dialogue.start([
                {
                    speaker: 'hera',
                    name: 'Hera',
                    text: `You really saved me, ${GameState.player.name}. That goblin was guarding the route to the real corruption source.`,
                    portrait: 'ðŸ§'
                },
                {
                    speaker: 'player',
                    name: GameState.player.name,
                    text: `Then the Prime Script fragment is still deeper in the forest.`,
                    portrait: 'Ã°Å¸Â§â€˜Ã¢â‚¬ÂÃ°Å¸â€™Â»'
                },
                {
                    speaker: 'hera',
                    name: 'Hera',
                    text: `Yes. I can sense the Data Glitch's trail from here. It leads through an <span class="highlight">abandoned village</span> farther east.`,
                    portrait: 'ðŸ§'
                },
                {
                    speaker: 'hera',
                    name: 'Hera',
                    text: `Take the path on the right when you're ready. I'll guide you as far as I can.`,
                    portrait: 'ðŸ§'
                }
            ]);

            GameState.setFlag('ch1_abandoned_village_unlocked');
            this.syncQuest({
                id: 'ch1_forest_quest',
                title: 'Follow Hera Deeper',
                description: 'Follow Hera toward the abandoned village and trace the route to the Prime Script fragment.'
            });
            return;
        }

        if (GameState.hasFlag('ch1_goblin_defeated')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                `You really saved me, ${GameState.player.name}. The goblin is gone, and the deeper trail is safe again.`,
                '🧝'
            );
            return;
        }

        if (GameState.hasFlag('ch1_hera_help_started')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                `Please hurry. The goblin is deeper in <span class="highlight">Corrupted Forest 2</span>. Take the path on the right.`,
                '🧝'
            );
            return;
        }

        await Dialogue.start([
            {
                speaker: 'hera',
                name: 'Hera',
                text: `Wait! Please don't go any farther alone. I'm <span class="highlight">Hera</span>, and a corrupted goblin drove me back from the deeper trail.`,
                portrait: '🧝'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `A goblin? Then that's what's been stalking this part of the forest.`,
                portrait: 'ðŸ§‘â€ðŸ’»'
            },
            {
                speaker: 'hera',
                name: 'Hera',
                text: `Yes. It's somewhere in <span class="highlight">Corrupted Forest 2</span>. If you can defeat it, the path should open again.`,
                portrait: '🧝'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `Stay here and keep low. I'll handle the goblin and come back once the trail is clear.`,
                portrait: 'ðŸ§‘â€ðŸ’»'
            }
        ]);

        GameState.setFlag('ch1_hera_help_started');
        GameState.addQuest({
            id: 'ch1_help_hera',
            title: 'Help Hera',
            description: 'Travel into Corrupted Forest 2 and defeat the corrupted goblin threatening Hera.'
        });
    },

    async goToForest2() {
        if (!GameState.hasFlag('ch1_hera_help_started')) {
            await Dialogue.quick(
                'narrator',
                'Narrator',
                `<em>You should speak with Hera first. She knows what is waiting deeper in the forest.</em>`,
                '📜'
            );
            return;
        }

        await World.goTo('ch1_corrupted_forest_2', 'Pushing deeper into the corrupted woods...');
    },

    async enterForest2() {
        if (
            !GameState.hasFlag('ch1_goblin_defeated') &&
            typeof Platformer !== 'undefined' &&
            typeof Platformer.beginForest2GoblinApproach === 'function'
        ) {
            Platformer.movementLocked = true;
            await Utils.wait(150);
            Platformer.beginForest2GoblinApproach();
        }
    },

    async goToAbandonedVillage() {
        if (!GameState.hasFlag('ch1_goblin_defeated')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                `We can't risk the deeper trail until that first goblin is down.`,
                'ðŸ§'
            );
            return;
        }

        if (!GameState.hasFlag('ch1_abandoned_village_unlocked')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                `Talk to me first. I need to explain where the corruption trail leads next.`,
                'ðŸ§'
            );
            return;
        }

        await World.goTo('ch1_abandoned_village', 'Following the corruption trail into the abandoned village...');
    },

    async enterAbandonedVillage() {
        if (
            GameState.hasFlag('ch1_abandoned_goblin_defeated') &&
            typeof Platformer !== 'undefined' &&
            typeof Platformer.releaseMovementLock === 'function'
        ) {
            Platformer.releaseMovementLock();
        }
    },

    async talkToCaveHera() {
        await this.showCaveGuideDialogue();
        return;

        if (GameState.hasFlag('ch1_fragment_recovered')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                `The fragment is finally safe. Open the map and let's get back to the village so Elder Varion can see it.`,
                'ðŸ§'
            );
            return;
        }

        await Dialogue.quick(
            'hera',
            'Hera',
            `Good, you're here. I'm sensing the fragment is in that cave.`,
            'ðŸ§'
        );
        return;

        if (GameState.hasFlag('ch1_fragment_recovered') && !GameState.hasFlag('ch1_syntax_city_unlocked')) {
            await Dialogue.start([
                {
                    speaker: 'elder',
                    name: 'Elder Varion',
                    text: `You've got the fragment. This part of the realm will be safe... for now.`,
                    portrait: 'ðŸ‘´'
                },
                {
                    speaker: 'elder',
                    name: 'Elder Varion',
                    text: `But the same disruption is appearing in <span class="highlight">Syntax City</span>. Orders are breaking apart, notices are rewriting themselves, and the city's structure is slipping out of balance.`,
                    portrait: 'ðŸ‘´'
                },
                {
                    speaker: 'elder',
                    name: 'Elder Varion',
                    text: `You must go there next. If Syntax City falls deeper into corruption, the rest of the realm may lose the ability to speak, record, and command clearly.`,
                    portrait: 'ðŸ‘´'
                },
                {
                    speaker: 'hera',
                    name: 'Hera',
                    text: `Take care on your journey, ${GameState.player.name}. If the city's syntax is breaking, even simple statements may turn dangerous.`,
                    portrait: 'ðŸ§'
                }
            ]);

            GameState.setFlag('ch1_syntax_city_unlocked');
            this.syncQuest({
                id: 'ch1_syntax_city',
                title: 'Travel to Syntax City',
                description: 'Open the world map and travel to Syntax City to investigate the spreading corruption.'
            });
            if (typeof Game !== 'undefined' && typeof Game.updateWorldMapUi === 'function') {
                Game.updateWorldMapUi(World.currentScene || GameState.progress.currentScene);
            }
            return;
        }

        if (GameState.hasFlag('ch1_syntax_city_unlocked') && !GameState.hasFlag('ch1_city_map_unlocked')) {
            await Dialogue.quick(
                'elder',
                'Elder Varion',
                `Syntax City is marked on your map now. Travel there, find the source of the disruption, and learn what the city needs from you.`,
                'ðŸ‘´'
            );
            return;
        }

        if (GameState.hasFlag('ch1_fragment_recovered')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                `The fragment is finally safe. Open the map and let's get back to the village.`,
                '🧝'
            );
            return;
        }

        await Dialogue.quick(
            'hera',
            'Hera',
            `Good, you're here. I'm sensing the fragment is in that cave.`,
            '🧝'
        );
    },

    async talkToSyntaxStranger() {
        if (GameState.hasFlag('ch1_city_map_unlocked')) {
            await Dialogue.quick(
                'stranger',
                'Stranger',
                `The king will only notice people who prove themselves useful. Start in the market, then follow the trail toward the arena host.`,
                'ðŸ•µï¸'
            );
            return;
        }

        await Dialogue.start([
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `I'm looking for King Aureon. Elder Varion said Syntax City is in trouble.`,
                portrait: 'ðŸ§‘â€ðŸ’»'
            },
            {
                speaker: 'stranger',
                name: 'Stranger',
                text: `Then you came at the right time, but not the right rank. The king will not grant an audience to a nameless traveler.`,
                portrait: 'ðŸ•µï¸'
            },
            {
                speaker: 'stranger',
                name: 'Stranger',
                text: `If you want the court to notice you, join the tournament. To do that, you need the <span class="highlight">Arena Host</span>.`,
                portrait: 'ðŸ•µï¸'
            },
            {
                speaker: 'stranger',
                name: 'Stranger',
                text: `Take this city map. Start with the <span class="highlight">market</span>. People talk more freely there than they do in front of palace guards.`,
                portrait: 'ðŸ•µï¸'
            }
        ]);

        GameState.setFlag('ch1_city_map_unlocked');
        GameState.setFlag('ch1_city_market_unlocked');
        GameState.setFlag('ch1_syntax_stranger_met');
        GameState.completeQuest('ch1_main');
        GameState.completeQuest('ch1_forest_quest');
        this.syncQuest({
            id: 'ch1_syntax_city',
            title: 'Find the Arena Host',
            description: 'Use the city map, visit the market first, and learn how to reach the tournament host.'
        });

        if (typeof Game !== 'undefined' && typeof Game.updateWorldMapUi === 'function') {
            Game.updateWorldMapUi(World.currentScene || GameState.progress.currentScene);
        }
    },

    async talkToMarketMerchant() {
        if (GameState.hasFlag('ch1_city_square_unlocked')) {
            await Dialogue.quick(
                'merchant',
                'Market Merchant',
                `If you're still chasing the tournament, ask around the <span class="highlight">city square</span>. That's where desperate people notice everything.`,
                'ðŸ›’'
            );
            if (typeof Game !== 'undefined' && typeof Game.showMerchantShop === 'function') {
                Game.showMerchantShop();
            }
            return;
        }

        await Dialogue.start([
            {
                speaker: 'merchant',
                name: 'Market Merchant',
                text: `The city is jittery these days. Signs are changing, orders are malformed, and half my ledgers refuse to print correctly.`,
                portrait: 'ðŸ›’'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `I'm trying to find the Arena Host. Someone said the tournament is the only way to reach the king.`,
                portrait: 'ðŸ§‘â€ðŸ’»'
            },
            {
                speaker: 'merchant',
                name: 'Market Merchant',
                text: `Then head to the <span class="highlight">city square</span>. The people there know who drifts in and out of the tavern, and that's where the arena crowd usually passes through.`,
                portrait: 'ðŸ›’'
            }
        ]);

        GameState.setFlag('ch1_city_square_unlocked');
        this.syncQuest({
            id: 'ch1_syntax_city',
            title: 'Ask Around the City Square',
            description: 'Travel to the city square and ask who can lead you to the Arena Host.'
        });

        if (typeof Game !== 'undefined') {
            if (typeof Game.showMerchantShop === 'function') {
                Game.showMerchantShop();
            }
            if (typeof Game.updateWorldMapUi === 'function') {
                Game.updateWorldMapUi(World.currentScene || GameState.progress.currentScene);
            }
        }
    },

    async talkToSquareBeggar() {
        if (GameState.hasFlag('ch1_city_tavern_unlocked')) {
            await Dialogue.quick(
                'beggar',
                'Square Beggar',
                `Told you already - if you want the host, find the tavern and follow the loudest voices.`,
                'ðŸ§Ž'
            );
            return;
        }

        await Dialogue.start([
            {
                speaker: 'beggar',
                name: 'Square Beggar',
                text: `You look lost, traveler. Looking for someone important?`,
                portrait: 'ðŸ§Ž'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `The Arena Host. I need to enter the tournament if I want to meet the king.`,
                portrait: 'ðŸ§‘â€ðŸ’»'
            },
            {
                speaker: 'beggar',
                name: 'Square Beggar',
                text: `Then stop searching the square and head to the <span class="highlight">tavern</span>. That fool drinks there when he's not shouting at fighters.`,
                portrait: 'ðŸ§Ž'
            }
        ]);

        GameState.setFlag('ch1_city_tavern_unlocked');
        this.syncQuest({
            id: 'ch1_syntax_city',
            title: 'Find the Tavern',
            description: 'Travel to the tavern and ask around for the Arena Host.'
        });

        if (typeof Game !== 'undefined' && typeof Game.updateWorldMapUi === 'function') {
            Game.updateWorldMapUi(World.currentScene || GameState.progress.currentScene);
        }
    },

    async talkToTavernBarkeep() {
        await Dialogue.quick(
            'barkeep',
            'Barkeep',
            `Tournament crowd? They come and go, but the loudest drunk in the room usually knows where the host wandered off to.`,
            'ðŸº'
        );

        GameState.setFlag('ch1_tavern_barkeep_talked');
        await this.checkTavernHostTrigger();
    },

    async talkToTavernBarmaid() {
        await Dialogue.quick(
            'barmaid',
            'Barmaid',
            `If you're after the Arena Host, ask the drunk at the side table... or wait for him to stumble in himself.`,
            'ðŸ·'
        );

        GameState.setFlag('ch1_tavern_barmaid_talked');
        await this.checkTavernHostTrigger();
    },

    async talkToTavernDrunk() {
        await Dialogue.quick(
            'drunk',
            'Drunk Patron',
            `Zzzz... *hik hik* whaaat zu yu wann... the host? Hah... tavern always finds him first...`,
            'ðŸ»'
        );

        GameState.setFlag('ch1_tavern_drunk_talked');
        await this.checkTavernHostTrigger();
    },

    async talkToArenaHost() {
        const sceneId = (typeof World !== 'undefined' && World.currentScene) || GameState.progress.currentScene;

        if (sceneId === 'ch1_arena_outskirts') {
            if (!GameState.hasFlag('ch1_tournament_registered')) {
                await this.enterArenaOutskirts(true);
                return;
            }

            await Dialogue.quick(
                'host',
                'Arena Host',
                `You're already registered for the <span class="highlight">Arena of Heroes</span>. The gate is open. Head inside and take your place.`,
                '\u2694\uFE0F'
            );
            await World.goTo('ch1_arena_inside', 'Returning to the Arena of Heroes...');
            return;
        }

        if (GameState.hasFlag('ch1_tournament_registered')) {
            await Dialogue.quick(
                'host',
                'Arena Host',
                `You're already in the bracket. Meet me at the arena outskirts whenever you're ready for the next step.`,
                '\u2694\uFE0F'
            );
            return;
        }

        if (GameState.hasFlag('ch1_tavern_host_defeated') && !GameState.hasFlag('ch1_tournament_registered')) {
            await Dialogue.start([
                {
                    speaker: 'host',
                    name: 'Arena Host',
                    text: `You handled yourself well. Come with me to the arena. I'll register you for the tournament.`,
                    portrait: '\u2694\uFE0F'
                },
                {
                    speaker: 'player',
                    name: GameState.player.name,
                    text: `Good. That's exactly what I came for.`,
                    portrait: '\u{1F9D1}\u200D\u{1F4BB}'
                }
            ]);

            GameState.setFlag('ch1_arena_outskirts_unlocked');
            this.syncQuest({
                id: 'ch1_syntax_city',
                title: 'Head To The Arena Of Heroes',
                description: 'Follow the Arena Host to the arena outskirts and complete your tournament registration.'
            });
            await World.goTo('ch1_arena_outskirts', 'Following the Arena Host to the Arena of Heroes...');
            return;
        }

        if (!GameState.hasFlag('ch1_tavern_host_defeated')) {
            await Dialogue.start([
                {
                    speaker: 'host',
                    name: 'Arena Host',
                    text: `Hah! Not yet. First let's see if you can handle a few sloppy swings.`,
                    portrait: '\u2694\uFE0F'
                },
                {
                    speaker: 'player',
                    name: GameState.player.name,
                    text: `Fine. If a tavern brawl is the price of entry, let's get it over with.`,
                    portrait: '\u{1F9D1}\u200D\u{1F4BB}'
                }
            ]);
            await this.startArenaHostEncounter();
            return;
        }

        if (GameState.hasFlag('ch1_tavern_host_defeated')) {
            await Dialogue.quick(
                'host',
                'Arena Host',
                `You handled yourself well. Come find me again when you're ready to enter the tournament properly.`,
                'âš”ï¸'
            );
            return;
        }

        await Dialogue.quick(
            'host',
            'Arena Host',
            `Hah! Not yet. First let's see if you can handle a few sloppy swings.`,
            'âš”ï¸'
        );
    },

    async checkTavernHostTrigger() {
        const allTalked = GameState.hasFlag('ch1_tavern_barkeep_talked')
            && GameState.hasFlag('ch1_tavern_barmaid_talked')
            && GameState.hasFlag('ch1_tavern_drunk_talked');

        if (!allTalked || GameState.hasFlag('ch1_tavern_host_visible') || GameState.hasFlag('ch1_tavern_host_defeated')) {
            return;
        }

        GameState.setFlag('ch1_tavern_host_visible');
        if (typeof Platformer !== 'undefined' && typeof Platformer.resetNpcs === 'function') {
            Platformer.resetNpcs();
        }

        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>A chair scrapes across the tavern floor. A red-cloaked fighter lurches out from the shadows, swaying with drink and grinning like trouble.</em>`,
                portrait: 'ðŸ“œ'
            },
            {
                speaker: 'host',
                name: 'Arena Host',
                text: `Who keeps asking for me? If you want my attention, you can earn it the hard way!`,
                portrait: 'âš”ï¸'
            }
        ]);

        await this.startArenaHostEncounter();
    },

    async startArenaHostEncounter() {
        const host = {
            name: 'Drunken Arena Host',
            hp: 96,
            maxHp: 96,
            coinReward: 35,
            art: 'assets/sprites/npc/ArenaHost_combat.png',
            description: 'A half-drunk tournament master who still knows how to swing hard.',
            maxHints: 2,
            correctXpReward: 16,
            firstTryXpReward: 28,
            victoryXpReward: 50
        };

        Combat.start(host, this.getArenaHostChallenges(), () => this.onArenaHostVictory());
    },

    getArenaHostChallenges() {
        const topic = 'programming_language_if_else';
        const mainChallenges = [
            {
                id: 'ch1_host_1',
                title: 'Compiler Role',
                questionType: 'True or False',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>The Arena Host jabs a finger at a cracked machine diagram.</em> True or false: a compiler translates source code into machine language.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'The tavern fight now bridges programming language basics into conditionals.',
                hints: [
                    'A compiler changes one form of code into another.',
                    'This is one of the core roles of a compiler.',
                    'The statement in the question is correct.'
                ],
                answers: ['true'],
                damage: 24,
                explanation: 'A compiler translates source code into machine-oriented instructions.',
                concept: 'programming_language_compiler',
                conceptTitle: 'What A Compiler Does',
                codexTitle: 'Arena Host - Compiler Role'
            },
            {
                id: 'ch1_host_2',
                title: 'Java Basics',
                questionType: 'True or False',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>The host laughs and kicks over a mug.</em> True or false: Java runs directly on hardware without needing any software.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'This checks a basic fact about how Java actually runs.',
                hints: [
                    'Java programs commonly rely on software such as the JVM.',
                    'So the statement as written is not correct.',
                    'Think false.'
                ],
                answers: ['false'],
                damage: 24,
                explanation: 'Java does not run directly on bare hardware in the usual model; it runs through software such as the JVM.',
                concept: 'programming_language_java_runtime',
                conceptTitle: 'How Java Runs',
                codexTitle: 'Arena Host - Java Basics'
            },
            {
                id: 'ch1_host_3',
                title: 'Goblin Check',
                questionType: 'Short Answer',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>The host lowers his voice.</em> Which keyword checks a condition in Java?`,
                answerTip: 'Type only the keyword.',
                inputPlaceholder: 'Type the keyword',
                matchMode: 'exact',
                narrative: 'The fight now turns toward if/else conditions.',
                hints: [
                    'This keyword starts a conditional block.',
                    'It comes before parentheses that contain a condition.',
                    'It has only two letters.'
                ],
                answers: ['if'],
                damage: 24,
                explanation: 'The if keyword is used to check a condition in Java.',
                concept: 'if_else_if',
                conceptTitle: 'The if Keyword',
                codexTitle: 'Arena Host - Goblin Check'
            },
            {
                id: 'ch1_host_4',
                title: 'False Path',
                questionType: 'Short Answer',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>The host drags a knife across the table.</em> Which keyword runs when a condition is false?`,
                answerTip: 'Type only the keyword.',
                inputPlaceholder: 'Type the keyword',
                matchMode: 'exact',
                narrative: 'This is the matching branch used after if when the condition fails.',
                hints: [
                    'This keyword often follows an if block.',
                    'It handles the opposite branch.',
                    'It has four letters.'
                ],
                answers: ['else'],
                damage: 24,
                explanation: 'The else keyword runs when the if condition is false.',
                concept: 'if_else_else',
                conceptTitle: 'The else Keyword',
                codexTitle: 'Arena Host - False Path'
            },
            {
                id: 'ch1_host_5',
                title: 'Arena Test',
                questionType: 'Predict the Output',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>The host scratches a quick combat test into the wood.</em> What is the output of this code?`,
                code: `int hp = 20;
if (hp > 10) {
    System.out.println("Alive");
}`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'Now you read a simple if statement under pressure.',
                hints: [
                    'hp stores 20.',
                    '20 is greater than 10.',
                    'So the statement inside the if block runs.'
                ],
                answers: ['Alive'],
                damage: 24,
                explanation: 'Because hp > 10 is true, the code prints Alive.',
                concept: 'if_else_output',
                conceptTitle: 'Reading if Output',
                codexTitle: 'Arena Host - Arena Test'
            },
            {
                id: 'ch1_host_6',
                title: 'Pass The Trial',
                questionType: 'Code Completion',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>The host slams the final bracket shut.</em> Complete the condition in this line: <code>if(_____){ System.out.println("Passed"); }</code>`,
                answerTip: 'Type only the missing condition.',
                inputPlaceholder: 'score >= 75',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The condition section ends by completing a comparison expression.',
                hints: [
                    'The missing condition checks whether score is at least 75.',
                    'Use the variable name score.',
                    'Use the greater-than-or-equal operator.'
                ],
                answers: ['score >= 75', 'score>=75'],
                damage: 26,
                explanation: 'score >= 75 is the condition that checks whether the score meets the passing value.',
                concept: 'if_else_condition',
                conceptTitle: 'Completing Conditions',
                codexTitle: 'Arena Host - Pass The Trial'
            }
        ];

        const recoveryChallenges = [
            {
                id: 'ch1_host_recovery_1',
                title: 'Condition Starter',
                questionType: 'True or False',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>The host slows down and redraws the condition.</em> True or false: the keyword <code>if</code> is used to start a condition in Java.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'The host gives you an easier follow-up while staying in the if/else lesson.',
                hints: [
                    'This keyword checks whether something is true.',
                    'It appears before a condition in parentheses.',
                    'The statement is correct.',
                    'Type true.'
                ],
                answers: ['true'],
                damage: 12,
                autoShowHint: true,
                explanation: 'if is the keyword used to begin a conditional statement in Java.'
            },
            {
                id: 'ch1_host_recovery_2',
                title: 'Other Branch',
                questionType: 'Short Answer',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>He taps the other side of the bracket.</em> Which keyword handles the other branch when the <code>if</code> condition is false?`,
                answerTip: 'Type only the keyword.',
                inputPlaceholder: 'Type the keyword',
                matchMode: 'exact',
                narrative: 'This recovery question keeps the player on the same conditionals topic with a clearer prompt.',
                hints: [
                    'It usually comes after an if block.',
                    'It has four letters.',
                    'It handles the false path.',
                    'The answer is else.'
                ],
                answers: ['else'],
                damage: 12,
                autoShowHint: true,
                explanation: 'else handles the branch that runs when the if condition is false.'
            }
        ];

        return this.buildAdaptiveEncounterQuestions(mainChallenges, recoveryChallenges, topic);
    },

    async onArenaHostVictory() {
        GameState.setFlag('ch1_tavern_host_defeated');

        if (typeof Platformer !== 'undefined' && typeof Platformer.resetNpcs === 'function') {
            Platformer.resetNpcs();
        }

        await Dialogue.start([
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `I'm not here to brawl for fun. I'm just looking for the tournament host.`,
                portrait: 'ðŸ§‘â€ðŸ’»'
            },
            {
                speaker: 'host',
                name: 'Arena Host',
                text: `Then you found him. I <span class="highlight">am</span> the host... and you're stronger than you look. Want to join the tourney?`,
                portrait: 'âš”ï¸'
            }
        ]);

        this.syncQuest({
            id: 'ch1_syntax_city',
            title: 'Register For The Arena Of Heroes',
            description: 'Talk to the Arena Host again in the tavern so he can bring you to the arena and register you for the tournament.'
        });
    },

    async enterArenaOutskirts(forceDialogue = false) {
        if (!forceDialogue && !GameState.hasFlag('ch1_arena_outskirts_intro_done')) {
            GameState.setFlag('ch1_arena_outskirts_unlocked');
            if (!GameState.hasFlag('ch1_arena_outskirts_arrived')) {
                GameState.setFlag('ch1_arena_outskirts_arrived');
                this.syncQuest({
                    id: 'ch1_syntax_city',
                    title: 'Speak With The Arena Host',
                    description: 'Approach the Arena Host at the outskirts and press E to begin your tournament registration.'
                });
                Utils.notify('Approach the Arena Host and press E.', 'quest-update', 3200);
            }
            return;
        }

        const shouldRunIntro = forceDialogue || !GameState.hasFlag('ch1_arena_outskirts_intro_done');
        if (!shouldRunIntro) {
            return;
        }

        GameState.setFlag('ch1_arena_outskirts_intro_done');
        GameState.setFlag('ch1_arena_outskirts_unlocked');

        await Dialogue.start([
            {
                speaker: 'host',
                name: 'Arena Host',
                text: `Here we are. Welcome to the <span class="highlight">Arena of Heroes</span>.`,
                portrait: '\u2694\uFE0F'
            },
            {
                speaker: 'host',
                name: 'Arena Host',
                text: `I'll register you for the tournament myself. Once your name is on the board, there's no turning back.`,
                portrait: '\u2694\uFE0F'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `That's fine. Put my name down. I'm ready to fight my way in.`,
                portrait: '\u{1F9D1}\u200D\u{1F4BB}'
            },
            {
                speaker: 'host',
                name: 'Arena Host',
                text: `Done. You're in. Stay sharp and keep close. The Arena of Heroes doesn't forgive hesitation.`,
                portrait: '\u2694\uFE0F'
            }
        ]);

        GameState.setFlag('ch1_tournament_registered');
        this.syncQuest({
            id: 'ch1_syntax_city',
            title: 'Enter The Arena Of Heroes',
            description: 'The Arena Host registered you. Follow him through the opened gate and step into the arena proper.'
        });

        await new Promise((resolve) => {
            Cutscene.play([
                {
                    art: 'assets/background/arenaOutskirtsopendoor',
                    text: `<em>The Arena Host signals the guards. The heavy doors groan open, revealing the tournament path beyond.</em>`,
                    duration: 2200
                }
            ], resolve);
        });

        if (typeof Platformer !== 'undefined' && Platformer.currentMap && Platformer.currentSceneId === 'ch1_arena_outskirts') {
            Platformer.currentMap.backgroundKey = 'bg_arena_outskirts_open_door';
            await this.walkPlayerIntoArenaGate();
        }

        await new Promise((resolve) => {
            Cutscene.play([
                {
                    art: 'assets/background/arenaBeforeEnter',
                    text: `<em>The Arena Host lowers his voice. "This is the arena. Are you ready for the opponents waiting inside?"</em>`,
                    duration: 2400
                },
                {
                    art: 'assets/background/arenaBeforeEnter',
                    text: `<em>You steady your breath, tighten your grip, and step toward the roar of the crowd.</em>`,
                    duration: 2200
                }
            ], resolve);
        });

        await World.goTo('ch1_arena_inside', 'Stepping into the Arena of Heroes...');
    },

    async walkPlayerIntoArenaGate() {
        if (typeof Platformer === 'undefined' || typeof Platformer.startAutoWalk !== 'function') {
            return;
        }

        const targetX = Math.floor((Platformer.width || 960) * 0.49);
        await new Promise((resolve) => {
            Platformer.startAutoWalk(targetX, resolve);
        });
    },

    getArenaCurrentEnemyId() {
        if (!GameState.hasFlag('ch1_arena_slimebug_defeated')) return 'slimebug';
        if (!GameState.hasFlag('ch1_arena_bird_defeated')) return 'bird';
        if (!GameState.hasFlag('ch1_arena_bigboss_defeated')) return 'bigboss';
        return null;
    },

    getArenaQuestState() {
        const enemyId = this.getArenaCurrentEnemyId();
        if (enemyId === 'slimebug') {
            return {
                id: 'ch1_arena_trials',
                title: 'Arena Of Heroes Trial',
                description: 'Approach the Slimebug in the arena and press E to start the first fight.'
            };
        }

        if (enemyId === 'bird') {
            return {
                id: 'ch1_arena_trials',
                title: 'Arena Of Heroes Trial',
                description: 'The Slimebug is down. Approach the Bird and press E to start the second fight.'
            };
        }

        if (enemyId === 'bigboss') {
            return {
                id: 'ch1_arena_trials',
                title: 'Arena Of Heroes Trial',
                description: 'Only the Arena Sovereign remains. Move close and press E to begin the final arena battle.'
            };
        }

        return {
            id: 'ch1_arena_trials',
            title: 'Arena Of Heroes Cleared',
            description: 'The Arena Sovereign has fallen, and the gate beyond the arena now stands open.'
        };
    },

    getArenaPromptForCurrentEnemy() {
        const enemyId = this.getArenaCurrentEnemyId();
        if (enemyId === 'slimebug') return 'Approach the Slimebug and press E to start the fight.';
        if (enemyId === 'bird') return 'Approach the Bird and press E to start the fight.';
        if (enemyId === 'bigboss') return 'Approach the Arena Sovereign and press E to start the final fight.';
        return 'The Arena Sovereign is down. The gate beyond the arena stands open.';
    },

    refreshArenaInsideNpcs() {
        if (
            typeof Platformer !== 'undefined' &&
            typeof Platformer.resetNpcs === 'function' &&
            Platformer.currentSceneId === 'ch1_arena_inside'
        ) {
            Platformer.resetNpcs();
        }
    },

    async enterArenaInside() {
        if (!GameState.hasFlag('ch1_arena_inside_intro_done')) {
            GameState.setFlag('ch1_arena_inside_intro_done');
            this.syncQuest(this.getArenaQuestState());

            await Dialogue.start([
                {
                    speaker: 'narrator',
                    name: 'Narrator',
                    text: `<em>The Arena of Heroes falls quiet for a moment. Three opponents will challenge you here: the Slimebug, the Bird, and the Arena Sovereign.</em>`,
                    portrait: '📜'
                },
                {
                    speaker: 'player',
                    name: GameState.player.name,
                    text: `Then I'll take them one by one. I'll move in when I'm ready and start each fight myself.`,
                    portrait: '\u{1F9D1}\u200D\u{1F4BB}'
                }
            ]);
        } else {
            this.syncQuest(this.getArenaQuestState());
        }

        this.refreshArenaInsideNpcs();
        if (GameState.hasFlag('ch1_chapter_complete')) {
            this.showArenaChapterCompleteState();
            Utils.notify('Chapter 1 is complete. The gate beyond the arena stands open.', 'quest-update', 3200);
            return;
        }

        Utils.notify(this.getArenaPromptForCurrentEnemy(), 'quest-update', 3200);
    },

    handleArenaEnemyInteraction(npc) {
        if (!npc || World.currentScene !== 'ch1_arena_inside') {
            return;
        }

        if (npc.enemyId === 'slimebug') {
            if (!GameState.hasFlag('ch1_arena_slimebug_defeated')) {
                this.startArenaSlimebugEncounter();
            }
            return;
        }

        if (npc.enemyId === 'bird') {
            if (!GameState.hasFlag('ch1_arena_bird_defeated')) {
                this.startArenaBirdEncounter();
            }
            return;
        }

        if (npc.enemyId === 'bigboss') {
            if (!GameState.hasFlag('ch1_arena_bigboss_defeated')) {
                this.startArenaBigBossEncounter();
            }
        }
    },

    async startArenaSlimebugEncounter() {
        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The Slimebug splashes forward across the arena floor, ready to smother your footing.</em>`,
                portrait: '📜'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `You're first. Let's clean this up fast.`,
                portrait: '\u{1F9D1}\u200D\u{1F4BB}'
            }
        ]);

        const slimebug = {
            name: 'Slimebug',
            hp: 114,
            maxHp: 114,
            coinReward: 42,
            art: 'assets/sprites/worldEnemies/arena_slimebug.png',
            description: 'A sticky arena pest that attacks with slippery, corrupted syntax.',
            maxHints: 2,
            correctXpReward: 20,
            firstTryXpReward: 34,
            victoryXpReward: 72
        };

        Combat.start(slimebug, this.getArenaSlimebugChallenges(), () => this.onArenaSlimebugVictory());
    },

    getArenaSlimebugChallenges() {
        return [
            {
                id: 'ch1_arena_slimebug_1',
                prompt: `
                    <span class="challenge-title">Slimebug: Count The Bounce</span>
                    <p>Declare an <strong>int</strong> named <code>slimeCount</code> with the value <strong>3</strong>.</p>
                `,
                narrative: 'The Slimebug multiplies across the sand. Lock the count in before it spreads.',
                hints: [
                    'Use the int keyword.',
                    'The variable name is slimeCount.',
                    'Answer: int slimeCount = 3;'
                ],
                answers: ['int slimeCount = 3;', 'int slimeCount=3;', 'int slimeCount = 3'],
                damage: 34,
                explanation: 'An int variable stores whole numbers.',
                concept: 'arena_slimebug_int',
                conceptTitle: 'Integer Declarations',
                codexTitle: 'Slimebug - Count The Bounce'
            },
            {
                id: 'ch1_arena_slimebug_2',
                type: 'multiple_choice',
                prompt: `
                    <span class="challenge-title">Slimebug: Pick The Correct Print Line</span>
                    <p>Which line correctly prints <strong>"Slimebug!"</strong> in Java?</p>
                `,
                narrative: 'The Slimebug recoils. One clean print statement will keep the pressure on.',
                hints: [
                    'Use System.out.println.',
                    'The text needs double quotes.',
                    'Answer: System.out.println("Slimebug!");'
                ],
                choices: [
                    'print("Slimebug!");',
                    'System.out.println("Slimebug!");',
                    'System.out.println(Slimebug!);',
                    'System.out.printline("Slimebug!");'
                ],
                correctOption: 1,
                answers: ['System.out.println("Slimebug!");'],
                damage: 38,
                explanation: 'Java prints text with System.out.println and double quotes around the String literal.',
                concept: 'arena_slimebug_print',
                conceptTitle: 'Print Statements',
                codexTitle: 'Slimebug - Print The Strike'
            },
            {
                id: 'ch1_arena_slimebug_3',
                prompt: `
                    <span class="challenge-title">Slimebug: Ready The Arena</span>
                    <p>Declare a <strong>boolean</strong> named <code>arenaReady</code> and set it to <strong>true</strong>.</p>
                `,
                narrative: 'Finish the Slimebug by locking the arena state into a clean true/false value.',
                hints: [
                    'Use the boolean keyword.',
                    'The value should be true without quotes.',
                    'Answer: boolean arenaReady = true;'
                ],
                answers: ['boolean arenaReady = true;', 'boolean arenaReady=true;', 'boolean arenaReady = true'],
                damage: 42,
                explanation: 'boolean variables can store only true or false.',
                concept: 'arena_slimebug_boolean',
                conceptTitle: 'Boolean Variables',
                codexTitle: 'Slimebug - Ready The Arena'
            }
        ];
    },

    async onArenaSlimebugVictory() {
        GameState.setFlag('ch1_arena_slimebug_defeated');
        this.refreshArenaInsideNpcs();
        this.syncQuest(this.getArenaQuestState());

        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The Slimebug collapses into harmless goo. A harsh cry echoes above as the Bird drops into the arena for the next round.</em>`,
                portrait: '📜'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `One down. The next one can come closer.`,
                portrait: '\u{1F9D1}\u200D\u{1F4BB}'
            }
        ]);

        Utils.notify('Approach the Bird and press E to start the next fight.', 'quest-update', 3400);
    },

    async startArenaBirdEncounter() {
        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The Bird scrapes its claws against the stone and darts sideways, waiting to dive.</em>`,
                portrait: '📜'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `Fast or not, you're still my second match.`,
                portrait: '\u{1F9D1}\u200D\u{1F4BB}'
            }
        ]);

        const bird = {
            name: 'Bird',
            hp: 126,
            maxHp: 126,
            coinReward: 48,
            art: 'assets/sprites/worldEnemies/arena_bird.png',
            description: 'A sharp-eyed arena predator that strikes with quick, precise attacks.',
            maxHints: 2,
            correctXpReward: 22,
            firstTryXpReward: 36,
            victoryXpReward: 80
        };

        Combat.start(bird, this.getArenaBirdChallenges(), () => this.onArenaBirdVictory());
    },

    getArenaBirdChallenges() {
        return [
            {
                id: 'ch1_arena_bird_1',
                prompt: `
                    <span class="challenge-title">Bird: Name The Target</span>
                    <p>Declare a <strong>String</strong> named <code>enemyName</code> with the value <strong>"Bird"</strong>.</p>
                `,
                narrative: 'The Bird circles for an opening. Name the target before it dives.',
                hints: [
                    'Use the String keyword.',
                    'Bird must be inside double quotes.',
                    'Answer: String enemyName = "Bird";'
                ],
                answers: ['String enemyName = "Bird";', 'String enemyName="Bird";', 'String enemyName = "Bird"'],
                damage: 38,
                explanation: 'Strings store text values wrapped in double quotes.',
                concept: 'arena_bird_string',
                conceptTitle: 'String Variables',
                codexTitle: 'Bird - Name The Target'
            },
            {
                id: 'ch1_arena_bird_2',
                type: 'multiple_choice',
                prompt: `
                    <span class="challenge-title">Bird: Choose The Wing Count</span>
                    <p>Which line correctly declares <code>wings</code> as the integer value <strong>2</strong>?</p>
                `,
                narrative: 'The Bird feints left. Pin down the right number before it changes rhythm.',
                hints: [
                    'Use int because 2 is a whole number.',
                    'The variable name is wings.',
                    'Answer: int wings = 2;'
                ],
                choices: [
                    'int wings = "2";',
                    'wings = 2;',
                    'int wings = 2;',
                    'double wings = 2;'
                ],
                correctOption: 2,
                answers: ['int wings = 2;'],
                damage: 40,
                explanation: 'Whole numbers should use int, and declarations need the variable type.',
                concept: 'arena_bird_wings',
                conceptTitle: 'Integer Setup',
                codexTitle: 'Bird - Choose The Wing Count'
            },
            {
                id: 'ch1_arena_bird_3',
                prompt: `
                    <span class="challenge-title">Bird: Call The Dive</span>
                    <p>Using <code>enemyName</code>, print <strong>Bird dives!</strong> exactly like this:</p>
                    <pre>System.out.println(enemyName + " dives!");</pre>
                `,
                narrative: 'The Bird commits to the dive. Call it out correctly and break its attack line.',
                hints: [
                    'Use System.out.println.',
                    'Concatenate enemyName with the String " dives!".',
                    'Answer: System.out.println(enemyName + " dives!");'
                ],
                answers: [
                    'System.out.println(enemyName + " dives!");',
                    'System.out.println(enemyName+" dives!");'
                ],
                damage: 48,
                explanation: 'You can combine a variable and a String using + inside System.out.println.',
                concept: 'arena_bird_concat',
                conceptTitle: 'String Concatenation',
                codexTitle: 'Bird - Call The Dive'
            }
        ];
    },

    async onArenaBirdVictory() {
        GameState.setFlag('ch1_arena_bird_defeated');
        this.refreshArenaInsideNpcs();
        this.syncQuest(this.getArenaQuestState());

        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The Bird crashes into the arena sand and fades into static. Heat rolls through the coliseum as the Arena Sovereign steps forward for the final battle.</em>`,
                portrait: '📜'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `So the last one finally decided to show up.`,
                portrait: '\u{1F9D1}\u200D\u{1F4BB}'
            }
        ]);

        Utils.notify('Approach the Arena Sovereign and press E to start the final fight.', 'quest-update', 3600);
    },

    async startArenaBigBossEncounter() {
        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The battlefield falls silent as the sky fractures above the Arena. The final guardian of Chapter 1 steps forward: the <span class="highlight">Arena Sovereign</span>.</em>`,
                portrait: '📜'
            },
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>Forged from fallen champions, he speaks with many voices at once. Chains of cursed light drag behind him. With each step, the ground cracks, the walls shift, and fire spills from the stone.</em>`,
                portrait: '📜'
            },
            {
                speaker: 'boss',
                name: 'The Arena Sovereign',
                text: `You are not the first to reach me... and you will not be the last to fall.`,
                portrait: '🔥'
            },
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>Shadows lash in from every angle. This is not just a battle. This is a judgment.</em>`,
                portrait: '📜'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `Then hear my answer. I'm still standing.`,
                portrait: '\u{1F9D1}\u200D\u{1F4BB}'
            }
        ]);

        const bigBoss = {
            name: 'Arena Sovereign',
            hp: 162,
            maxHp: 162,
            coinReward: 70,
            art: 'assets/sprites/worldEnemies/arena_bigboss.png',
            description: 'The final guardian of the Arena of Heroes, forged from fallen champions and cursed fire.',
            maxHints: 3,
            correctXpReward: 26,
            firstTryXpReward: 40,
            victoryXpReward: 110
        };

        Combat.start(bigBoss, this.getArenaBigBossChallenges(), () => this.onArenaBigBossVictory());
    },

    getArenaBigBossChallenges() {
        return [
            {
                id: 'ch1_arena_bigboss_1',
                prompt: `
                    <span class="challenge-title">Arena Sovereign: Arm The Counter</span>
                    <p>Write <strong>two lines</strong>:</p>
                    <pre>int fire = 8;
int guard = 3;</pre>
                `,
                narrative: 'The Arena Sovereign raises its weapon. Build your counter with two clean integer declarations.',
                hints: [
                    'Both lines use int.',
                    'The variable names are fire and guard.',
                    'Answer:\nint fire = 8;\nint guard = 3;'
                ],
                answers: [
                    'int fire = 8;\nint guard = 3;',
                    'int guard = 3;\nint fire = 8;'
                ],
                damage: 50,
                explanation: 'Multiple int variables can be declared on separate lines in one response.',
                concept: 'arena_bigboss_two_line_setup',
                conceptTitle: 'Multiple Integer Declarations',
                codexTitle: 'Arena Sovereign - Arm The Counter'
            },
            {
                id: 'ch1_arena_bigboss_2',
                type: 'multiple_choice',
                prompt: `
                    <span class="challenge-title">Arena Sovereign: Choose The Damage Formula</span>
                    <p>Given:</p>
                    <pre>int fire = 8;
int guard = 3;</pre>
                    <p>Which line correctly declares <code>totalDamage</code> as <code>(fire * 2) - guard</code>?</p>
                `,
                narrative: 'The Arena Sovereign lunges. Only the right expression will cut through its armor.',
                hints: [
                    'Create a new int named totalDamage.',
                    'Use parentheses around fire * 2.',
                    'Answer: int totalDamage = (fire * 2) - guard;'
                ],
                choices: [
                    'int totalDamage = fire * (2 - guard);',
                    'totalDamage = (fire * 2) - guard;',
                    'int totalDamage = (fire * 2) - guard;',
                    'int totalDamage = (fire * 2) - "guard";'
                ],
                correctOption: 2,
                answers: ['int totalDamage = (fire * 2) - guard;'],
                damage: 52,
                explanation: 'The correct expression keeps the multiplication grouped before subtracting guard.',
                concept: 'arena_bigboss_expression',
                conceptTitle: 'Arithmetic Expressions',
                codexTitle: 'Arena Sovereign - Choose The Damage Formula'
            },
            {
                id: 'ch1_arena_bigboss_3',
                prompt: `
                    <span class="challenge-title">Arena Sovereign: Claim The Finish</span>
                    <p>Declare a <strong>String</strong> named <code>title</code> with the value <strong>"Champion"</strong>.</p>
                `,
                narrative: 'The final blow is within reach. Lock in the winning title and finish the arena cleanly.',
                hints: [
                    'Use the String keyword.',
                    'Champion needs double quotes.',
                    'Answer: String title = "Champion";'
                ],
                answers: ['String title = "Champion";', 'String title="Champion";', 'String title = "Champion"'],
                damage: 60,
                explanation: 'Strings store text values, and Java wraps text literals in double quotes.',
                concept: 'arena_bigboss_title',
                conceptTitle: 'String Declarations',
                codexTitle: 'Arena Sovereign - Claim The Finish'
            }
        ];
    },

    async onArenaBigBossVictory() {
        const chapterAlreadyComplete = GameState.hasFlag('ch1_chapter_complete')
            || GameState.meta.chapter1CompletedMs !== null;

        GameState.setFlag('ch1_arena_bigboss_defeated');
        GameState.setFlag('ch1_arena_trials_complete');
        GameState.setFlag('ch1_arena_gate_opened');
        GameState.setFlag('ch1_chapter_complete');
        this.refreshArenaInsideNpcs();
        GameState.completeQuest('ch1_arena_trials');
        GameState.completeQuest('ch1_syntax_city');
        GameState.completeQuest('ch1_main');
        Utils.setActions([]);

        await this.playArenaSovereignEndingCutscene();

        if (!chapterAlreadyComplete) {
            GameState.addXP(CONFIG.XP_REWARDS.chapterComplete);
        }

        GameState.markChapterOneComplete();
        GameState.save();

        await Utils.showTransition(`
            <div class="chapter-title-display" style="position:relative;background:transparent;">
                <div class="chapter-number">Chapter 1 Complete</div>
                <div class="chapter-name">Champion of the Arena</div>
                <div class="chapter-subtitle">The Arena has chosen its champion, but the journey ends here for now.</div>
            </div>
        `, 2600);

        this.showArenaChapterCompleteState();
        Utils.notify('Chapter 1 complete. The Arena Sovereign has fallen.', 'level-up', 5000);
    },

    async playArenaSovereignEndingCutscene() {
        await new Promise((resolve) => {
            Cutscene.play([
                {
                    art: 'assets/background/ArenaInside.png',
                    text: `<em>The battlefield falls silent. Beneath the fractured sky, your final strike drives the Arena Sovereign to one knee.</em>`,
                    waitForClick: true
                },
                {
                    art: 'assets/sprites/worldEnemies/arena_bigboss.png',
                    text: `<em>The Sovereign kneels... then shatters into light. The chains of fallen warriors break apart, and the Arena collapses into silence.</em>`,
                    waitForClick: true
                },
                {
                    art: 'assets/background/ArenaInside.png',
                    text: `"You have proven yourself... but the world beyond this Arena is far more cruel..."`,
                    waitForClick: true
                },
                {
                    art: 'assets/background/ArenaInside.png',
                    text: `<em>A massive gate opens ahead of you. Before you can step forward, the screen fades to black.</em>`,
                    waitForClick: true
                }
            ], resolve);
        });
    },

    showArenaChapterCompleteState() {
        Utils.setSceneText(`
            <div class="location-intro">Chapter 1 Complete</div>
            <p class="narrator">The Arena has chosen its champion. The coliseum stands silent, and the great gate beyond the sands has finally opened.</p>
            <p class="narrator">What waits past that gate belongs to another chapter. For now, your journey pauses here.</p>
        `);

        Utils.setActions([
            { label: 'Continue Beyond the Gate (Coming Soon)', primary: true, callback: () => this.showComingSoon() },
            { label: 'Return to Syntax City', callback: () => World.goTo('ch1_syntax_city_square', 'Leaving the Arena of Heroes...') },
            { label: 'Return to Main Menu', callback: () => Game.returnToMenu() }
        ]);
    },

    async showCaveGuideDialogue() {
        if (GameState.hasFlag('ch1_fragment_recovered')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                `The fragment is finally safe. Open the map and let's get back to the village so Elder Varion can see it.`
            );
            return;
        }

        if (GameState.hasFlag('ch1_cave_entered')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                `You've already broken the seal on the outer tunnel. Stay focused and keep moving deeper until you find the fragment guardian.`
            );
            return;
        }

        await Dialogue.quick(
            'hera',
            'Hera',
            `Good, you're here. I'm sensing the fragment is in that cave. When you're ready, step to the entrance and push inside.`
        );
    },

    async handleCaveGuideInteraction() {
        if (GameState.hasFlag('ch1_fragment_recovered')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                GameState.hasFlag('ch1_syntax_city_unlocked')
                    ? `The cave challenge is complete. Your next destination is <span class="highlight">Syntax City</span>.`
                    : `The cave challenge is complete. Open the map and return to the <span class="highlight">Village of Variables</span> so Elder Varion can see the fragment.`
            );
            return;
        }

        if (GameState.hasFlag('ch1_fire_worm_revealed')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                `The final guardian is awake. Push deeper and finish the cave challenge to secure the fragment.`
            );
            return;
        }

        if (GameState.hasFlag('ch1_shroom_defeated')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                `The outer tunnel is clear, but the real fragment guardian is still deeper inside the cave.`
            );
            return;
        }

        return this.showCaveGuideDialogue();

        if (GameState.hasFlag('ch1_fragment_recovered')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                GameState.hasFlag('ch1_syntax_city_unlocked')
                    ? `The cave challenge is complete. Your next destination is <span class="highlight">Syntax City</span>.`
                    : `The cave challenge is complete. Open the map and return to the <span class="highlight">Village of Variables</span> so Elder Varion can see the fragment.`,
                'ðŸ§'
            );
            return;
        }

        if (GameState.hasFlag('ch1_fire_worm_revealed')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                `The final guardian is awake. Push deeper and finish the cave challenge to secure the fragment.`,
                'ðŸ§'
            );
            return;
        }

        if (GameState.hasFlag('ch1_shroom_defeated')) {
            await Dialogue.quick(
                'hera',
                'Hera',
                `The outer tunnel is clear, but the real fragment guardian is still deeper inside the cave.`,
                'ðŸ§'
            );
            return;
        }

        await this.showCaveGuideDialogue();
    },

    async handleCaveEntryInteraction() {
        if (GameState.hasFlag('ch1_fragment_recovered')) {
            const caveNextObjectiveText = GameState.hasFlag('ch1_syntax_city_unlocked')
                ? `This cave challenge is already complete. Your next objective is to travel to <span class="highlight">Syntax City</span>.`
                : `This cave challenge is already complete. Open the map and return to the <span class="highlight">Village of Variables</span> with the recovered fragment.`;
            await Dialogue.quick(
                'narrator',
                'Narrator',
                `<em>${caveNextObjectiveText}</em>`
            );
            return;
        }

        if (GameState.hasFlag('ch1_cave_entered')) {
            const caveProgressText = GameState.hasFlag('ch1_shroom_defeated')
                ? `The outer tunnel is clear. The next step is deeper inside the cave, where the real fragment guardian is waiting.`
                : `You've already started this cave challenge. Keep going forward and clear the tunnel to reach the fragment guardian.`;
            await Dialogue.quick(
                'narrator',
                'Narrator',
                `<em>${caveProgressText}</em>`
            );
            return;
        }

        return this.enterCaveDepths();

        if (GameState.hasFlag('ch1_fragment_recovered')) {
            const nextStep = GameState.hasFlag('ch1_syntax_city_unlocked')
                ? `This cave challenge is already complete. Your next objective is to travel to <span class="highlight">Syntax City</span>.`
                : `This cave challenge is already complete. Open the map and return to the <span class="highlight">Village of Variables</span> with the recovered fragment.`;
            await Dialogue.quick(
                'narrator',
                'Narrator',
                `<em>${nextStep}</em>`,
                'ðŸ“œ'
            );
            return;
        }

        if (GameState.hasFlag('ch1_cave_entered')) {
            const progressText = GameState.hasFlag('ch1_shroom_defeated')
                ? `The outer tunnel is clear. The next step is deeper inside the cave, where the real fragment guardian is waiting.`
                : `You've already started this cave challenge. Keep going forward and clear the tunnel to reach the fragment guardian.`;
            await Dialogue.quick(
                'narrator',
                'Narrator',
                `<em>${progressText}</em>`,
                'ðŸ“œ'
            );
            return;
        }

        await this.enterCaveDepths();
    },

    async enterCaveEntrance() {
        if (!GameState.hasFlag('ch1_cave_intro_done')) {
            GameState.setFlag('ch1_cave_intro_done');
            await Dialogue.start([
                {
                    speaker: 'hera',
                    name: 'Hera',
                    text: `The energy around this entrance is unstable. The fragment is definitely somewhere inside, but the tunnel is not going to let you pass quietly.`
                },
                {
                    speaker: 'player',
                    name: GameState.player.name,
                    text: `Then this is the place. I'll take a breath, get ready, and head in when I'm set.`
                }
            ]);
        }
        return;

        if (!GameState.hasFlag('ch1_cave_intro_done')) {
            GameState.setFlag('ch1_cave_intro_done');
            await Dialogue.start([
                {
                    speaker: 'hera',
                    name: 'Hera',
                    text: `Good, you're here. I'm sensing the fragment is in that cave.`,
                    portrait: '🧝'
                },
                {
                    speaker: 'player',
                    name: GameState.player.name,
                    text: `Then this is it. I'll head inside and flush out whatever is guarding it.`,
                    portrait: '🧑‍💻'
                }
            ]);
        }
    },

    async enterCaveDepths() {
        if (GameState.hasFlag('ch1_cave_entered')) {
            return;
        }

        GameState.setFlag('ch1_cave_entered');

        if (typeof Platformer !== 'undefined') {
            Platformer.movementLocked = true;
            if (typeof Platformer.suppressSceneExit === 'function') {
                Platformer.suppressSceneExit(2200);
            }
        }

        await Cutscene.play([
            {
                art: 'assets/background/caveEntrance.png',
                text: `You are entering the cave. The air grows colder, and every step carries a warning through the stone.`,
                duration: 1800
            },
            {
                art: 'assets/background/cave2.png',
                text: `You sense creatures lurking in the dark ahead. Something corrupted is moving fast through the tunnel.`,
                duration: 2200
            }
        ]);

        await World.goTo('ch1_cave_rush', 'Entering the cave...');
    },

    async enterCaveRush() {
        if (!GameState.hasFlag('ch1_shroom_defeated')) {
            await this.startEvilShroomEncounter();
        }
    },

    async startEvilShroomEncounter() {
        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>A twisted mushroom creature bursts from the dark, rushing straight toward you on a trail of spores.</em>`,
                portrait: '📜'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `So this is what was lurking in the tunnel. Come on, then.`,
                portrait: '🧑‍💻'
            }
        ]);

        const shroom = {
            name: 'Evil Java Shroom',
            hp: 52,
            maxHp: 52,
            coinReward: 45,
            art: 'assets/sprites/enemies/evilshroom.png',
            hurtArt: 'assets/sprites/enemies/evilshroom_hurt.png',
            defeatedArt: 'assets/sprites/enemies/evilshroom_defeated.png',
            description: 'A corrupted cave predator that thrives on bad logic and unstable variables.',
            maxHints: 2,
            correctXpReward: 22,
            firstTryXpReward: 36,
            victoryXpReward: 75
        };

        Combat.start(shroom, this.getEvilShroomChallenges(), () => this.onEvilShroomVictory());
    },

    getEvilShroomChallenges() {
        return [
            {
                id: 'ch1_shroom_1',
                prompt: `
                    <span class="challenge-title">Shroom Rush: Stabilize The Spores</span>
                    <p>Write <strong>two lines</strong>:</p>
                    <pre>int spores = 6;
boolean tunnelSafe = false;</pre>
                `,
                narrative: 'The shroom floods the tunnel with spores. Lock the cave state down before it overruns you!',
                hints: [
                    'The first line is an int declaration.',
                    'The second line is a boolean declaration.',
                    'Answer:\nint spores = 6;\nboolean tunnelSafe = false;'
                ],
                answers: [
                    'int spores = 6;\nboolean tunnelSafe = false;',
                    'boolean tunnelSafe = false;\nint spores = 6;'
                ],
                damage: 34,
                explanation: 'Different variable types can be declared on separate lines in the same answer.',
                concept: 'shroom_multi_type_setup',
                conceptTitle: 'Declaring Multiple Variables',
                codexTitle: 'Shroom Rush - Stabilize The Spores',
                feedbackDuration: 3000
            },
            {
                id: 'ch1_shroom_2',
                type: 'multiple_choice',
                prompt: `
                    <span class="challenge-title">Shroom Rush: Pick The Safe Expression</span>
                    <p>Given:</p>
                    <pre>int wand = 7;
int slash = 5;</pre>
                    <p>Which answer correctly declares <code>burstDamage</code> as <code>(wand * 2) + slash</code>?</p>
                `,
                narrative: 'The shroom recoils, but only the correct expression will burst through its cap.',
                hints: [
                    'Create a new int variable named burstDamage.',
                    'Use parentheses around wand * 2.',
                    'Answer: int burstDamage = (wand * 2) + slash;'
                ],
                choices: [
                    'int burstDamage = wand * (2 + slash);',
                    'int burstDamage = (wand * 2) + slash;',
                    'burstDamage = (wand * 2) + slash;',
                    'int burstDamage = wand * 2 + "slash";'
                ],
                correctOption: 1,
                answers: ['int burstDamage = (wand * 2) + slash;'],
                damage: 38,
                explanation: 'Parentheses make the intended order of operations clear inside an expression.',
                concept: 'shroom_expression_order',
                conceptTitle: 'Expressions With Parentheses',
                codexTitle: 'Shroom Rush - Expression Choice',
                feedbackDuration: 3000
            },
            {
                id: 'ch1_shroom_3',
                prompt: `
                    <span class="challenge-title">Shroom Rush: Report The Breach</span>
                    <p>Write <strong>two lines</strong>:</p>
                    <pre>String threat = "Java Shroom";
System.out.println(threat + " blocked the tunnel");</pre>
                `,
                narrative: 'Finish the ambush by recording exactly what attacked you.',
                hints: [
                    'The first line declares a String named threat.',
                    'The second line prints using concatenation.',
                    'Answer:\nString threat = "Java Shroom";\nSystem.out.println(threat + " blocked the tunnel");'
                ],
                answers: [
                    'String threat = "Java Shroom";\nSystem.out.println(threat + " blocked the tunnel");',
                    'String threat="Java Shroom";\nSystem.out.println(threat+" blocked the tunnel");'
                ],
                damage: 42,
                explanation: 'You can declare a variable and use it on the next line in output.',
                concept: 'shroom_string_report',
                conceptTitle: 'Using Variables Across Lines',
                codexTitle: 'Shroom Rush - Report The Breach',
                feedbackDuration: 3000
            }
        ];

        return [
            {
                id: 'ch1_shroom_1',
                prompt: `
                    <span class="challenge-title">🍄 Shroom Rush: Stabilize The Spores</span>
                    <p>Write <strong>two lines</strong>:</p>
                    <pre>int spores = 6;
boolean tunnelSafe = false;</pre>
                `,
                narrative: 'The shroom floods the tunnel with spores. Lock the cave state down before it overruns you!',
                hints: [
                    'The first line is an int declaration.',
                    'The second line is a boolean declaration.',
                    'Answer:\nint spores = 6;\nboolean tunnelSafe = false;'
                ],
                answers: [
                    'int spores = 6;\nboolean tunnelSafe = false;',
                    'boolean tunnelSafe = false;\nint spores = 6;'
                ],
                damage: 34,
                explanation: 'Different variable types can be declared on separate lines in the same answer.',
                concept: 'shroom_multi_type_setup',
                conceptTitle: 'Declaring Multiple Variables'
            },
            {
                id: 'ch1_shroom_2',
                prompt: `
                    <span class="challenge-title">🍄 Shroom Rush: Mix The Damage</span>
                    <p>Given:</p>
                    <pre>int wand = 7;
int slash = 5;</pre>
                    <p>Declare an <strong>int</strong> named <code>burstDamage</code> equal to <code>(wand * 2) + slash</code>.</p>
                    <pre>______________________</pre>
                `,
                narrative: 'The shroom recoils, but only a stronger expression will break through its cap.',
                hints: [
                    'Create a new int variable named burstDamage.',
                    'Use parentheses around wand * 2.',
                    'Answer: int burstDamage = (wand * 2) + slash;'
                ],
                answers: [
                    'int burstDamage = (wand * 2) + slash;',
                    'int burstDamage=(wand*2)+slash;',
                    'int burstDamage = (wand * 2) + slash'
                ],
                damage: 38,
                explanation: 'Parentheses make the intended order of operations clear inside an expression.',
                concept: 'shroom_expression_order',
                conceptTitle: 'Expressions With Parentheses'
            },
            {
                id: 'ch1_shroom_3',
                prompt: `
                    <span class="challenge-title">🍄 Shroom Rush: Report The Breach</span>
                    <p>Write <strong>two lines</strong>:</p>
                    <pre>String threat = "Java Shroom";
System.out.println(threat + " blocked the tunnel");</pre>
                `,
                narrative: 'Finish the ambush by recording exactly what attacked you.',
                hints: [
                    'The first line declares a String named threat.',
                    'The second line prints using concatenation.',
                    'Answer:\nString threat = "Java Shroom";\nSystem.out.println(threat + " blocked the tunnel");'
                ],
                answers: [
                    'String threat = "Java Shroom";\nSystem.out.println(threat + " blocked the tunnel");',
                    'String threat="Java Shroom";\nSystem.out.println(threat+" blocked the tunnel");'
                ],
                damage: 42,
                explanation: 'You can declare a variable and use it on the next line in output.',
                concept: 'shroom_string_report',
                conceptTitle: 'Using Variables Across Lines'
            }
        ];
    },

    async onEvilShroomVictory() {
        GameState.setFlag('ch1_shroom_defeated');

        await World.goTo('ch1_cave_inner', 'Pressing deeper into the cave...');
    },

    async enterCaveInner() {
        if (GameState.hasFlag('ch1_fire_worm_defeated')) {
            return;
        }

        if (!GameState.hasFlag('ch1_shroom_question_done')) {
            GameState.setFlag('ch1_shroom_question_done');
            await Dialogue.start([
                {
                    speaker: 'hera',
                    name: 'Hera',
                    text: `The shroom didn't drop a fragment... why?`,
                    portrait: '🧝'
                },
                {
                    speaker: 'player',
                    name: GameState.player.name,
                    text: `Then it was only guarding the way. Something stronger must still be deeper in here.`,
                    portrait: '🧑‍💻'
                }
            ]);
        }

        if (!GameState.hasFlag('ch1_fire_worm_revealed')) {
            await Utils.showTransition('A dark heat rolls through the cave...', 1400);
            GameState.setFlag('ch1_fire_worm_revealed');
            if (typeof Platformer !== 'undefined' && typeof Platformer.resetNpcs === 'function') {
                Platformer.resetNpcs();
            }
            await Dialogue.start([
                {
                    speaker: 'narrator',
                    name: 'Narrator',
                    text: `<em>The darkness ripples. A <span class="highlight">Small Fire Worm</span> erupts beside the tunnel wall, far larger than anything you've faced here so far.</em>`,
                    portrait: '📜'
                },
                {
                    speaker: 'player',
                    name: GameState.player.name,
                    text: `There you are. That heat... you must be the real guardian of the fragment.`,
                    portrait: '🧑‍💻'
                }
            ]);
        }

        await this.startFireWormEncounter();
    },

    async startFireWormEncounter() {
        const fireWorm = {
            name: 'Small Fire Worm',
            hp: 220,
            maxHp: 220,
            coinReward: 100,
            art: 'assets/sprites/enemies/smallworm.png',
            description: 'A blazing tunnel boss wrapped in corrupted heat and guarded by harder logic.',
            maxHints: 2,
            correctXpReward: 28,
            firstTryXpReward: 45,
            victoryXpReward: 110,
            reward: {
                id: 'prime_fragment_variables',
                name: 'Prime Script Fragment - Variables',
                icon: '📜',
                description: 'A restored fragment recovered from the cave guardian.'
            }
        };

        Combat.start(fireWorm, this.getFireWormChallenges(), () => this.onFireWormVictory());
    },

    getFireWormChallenges() {
        return [
            {
                id: 'ch1_fire_worm_1',
                prompt: `
                    <span class="challenge-title">Fire Worm: Build The Shield</span>
                    <p>Write <strong>two lines</strong>:</p>
                    <pre>int shield = 18;
boolean ready = true;</pre>
                `,
                narrative: 'The worm surges forward in a wave of heat. Build your defense in two clean lines!',
                hints: [
                    'First declare shield as an int.',
                    'Then declare ready as a boolean.',
                    'Answer:\nint shield = 18;\nboolean ready = true;'
                ],
                answers: [
                    'int shield = 18;\nboolean ready = true;',
                    'boolean ready = true;\nint shield = 18;'
                ],
                damage: 46,
                explanation: 'A stronger encounter can still be stabilized one declaration at a time.',
                concept: 'fire_worm_shield_setup',
                conceptTitle: 'Multi-Line Setup',
                codexTitle: 'Fire Worm - Build The Shield',
                feedbackDuration: 3200
            },
            {
                id: 'ch1_fire_worm_2',
                type: 'multiple_choice',
                prompt: `
                    <span class="challenge-title">Fire Worm: Choose The Counter</span>
                    <p>Given:</p>
                    <pre>int flame = 12;
int strike = 9;</pre>
                    <p>Which answer correctly creates <code>totalDamage</code> and prints it?</p>
                `,
                narrative: 'The cave trembles. Pick the correct two-line counter before the worm crashes through your guard.',
                hints: [
                    'Line 1 declares totalDamage with parentheses.',
                    'Line 2 prints totalDamage.',
                    'Answer:\nint totalDamage = (flame + strike) * 2;\nSystem.out.println(totalDamage);'
                ],
                choices: [
                    'int totalDamage = flame + strike * 2;\nSystem.out.println(flame);',
                    'int totalDamage = (flame + strike) * 2;\nSystem.out.println(totalDamage);',
                    'totalDamage = (flame + strike) * 2;\nSystem.out.println(totalDamage);',
                    'int totalDamage = (flame + strike) * 2;\nSystem.out.println("totalDamage");'
                ],
                correctOption: 1,
                answers: ['int totalDamage = (flame + strike) * 2;\nSystem.out.println(totalDamage);'],
                damage: 54,
                explanation: 'You can combine arithmetic and output across multiple lines.',
                concept: 'fire_worm_counter_combo',
                conceptTitle: 'Multi-Line Combat Expressions',
                codexTitle: 'Fire Worm - Counter Choice',
                feedbackDuration: 3200
            },
            {
                id: 'ch1_fire_worm_3',
                prompt: `
                    <span class="challenge-title">Fire Worm: Seal The Fragment</span>
                    <p>Write <strong>two lines</strong>:</p>
                    <pre>String fragment = "secured";
System.out.println("Fragment " + fragment);</pre>
                `,
                narrative: 'The fire worm weakens. Seal the fragment state before the cave collapses around it!',
                hints: [
                    'First declare the fragment String.',
                    'Then print "Fragment " plus fragment.',
                    'Answer:\nString fragment = "secured";\nSystem.out.println("Fragment " + fragment);'
                ],
                answers: [
                    'String fragment = "secured";\nSystem.out.println("Fragment " + fragment);',
                    'String fragment="secured";\nSystem.out.println("Fragment " + fragment);',
                    'String fragment = "secured";\nSystem.out.println("Fragment "+fragment);'
                ],
                damage: 62,
                explanation: 'A variable declared on one line can be used immediately on the next line.',
                concept: 'fire_worm_fragment_finish',
                conceptTitle: 'Completing A Multi-Line Finish',
                codexTitle: 'Fire Worm - Seal The Fragment',
                feedbackDuration: 3200
            }
        ];

        return [
            {
                id: 'ch1_fire_worm_1',
                prompt: `
                    <span class="challenge-title">🔥 Fire Worm: Build The Shield</span>
                    <p>Write <strong>two lines</strong>:</p>
                    <pre>int shield = 18;
boolean ready = true;</pre>
                `,
                narrative: 'The worm surges forward in a wave of heat. Build your defense in two clean lines!',
                hints: [
                    'First declare shield as an int.',
                    'Then declare ready as a boolean.',
                    'Answer:\nint shield = 18;\nboolean ready = true;'
                ],
                answers: [
                    'int shield = 18;\nboolean ready = true;',
                    'boolean ready = true;\nint shield = 18;'
                ],
                damage: 46,
                explanation: 'A stronger encounter can still be stabilized one declaration at a time.',
                concept: 'fire_worm_shield_setup',
                conceptTitle: 'Multi-Line Setup'
            },
            {
                id: 'ch1_fire_worm_2',
                prompt: `
                    <span class="challenge-title">🔥 Fire Worm: Calculate The Counter</span>
                    <p>Given:</p>
                    <pre>int flame = 12;
int strike = 9;</pre>
                    <p>Write <strong>two lines</strong>:</p>
                    <pre>int totalDamage = (flame + strike) * 2;
System.out.println(totalDamage);</pre>
                `,
                narrative: 'The cave trembles. Only a stronger two-line counterattack will break its guard.',
                hints: [
                    'Line 1 declares totalDamage with parentheses.',
                    'Line 2 prints totalDamage.',
                    'Answer:\nint totalDamage = (flame + strike) * 2;\nSystem.out.println(totalDamage);'
                ],
                answers: [
                    'int totalDamage = (flame + strike) * 2;\nSystem.out.println(totalDamage);',
                    'int totalDamage=(flame+strike)*2;\nSystem.out.println(totalDamage);'
                ],
                damage: 54,
                explanation: 'You can combine arithmetic and output across multiple lines.',
                concept: 'fire_worm_counter_combo',
                conceptTitle: 'Multi-Line Combat Expressions'
            },
            {
                id: 'ch1_fire_worm_3',
                prompt: `
                    <span class="challenge-title">🔥 Fire Worm: Seal The Fragment</span>
                    <p>Write <strong>two lines</strong>:</p>
                    <pre>String fragment = "secured";
System.out.println("Fragment " + fragment);</pre>
                `,
                narrative: 'The fire worm weakens. Seal the fragment state before the cave collapses around it!',
                hints: [
                    'First declare the fragment String.',
                    'Then print "Fragment " plus fragment.',
                    'Answer:\nString fragment = "secured";\nSystem.out.println("Fragment " + fragment);'
                ],
                answers: [
                    'String fragment = "secured";\nSystem.out.println("Fragment " + fragment);',
                    'String fragment="secured";\nSystem.out.println("Fragment " + fragment);',
                    'String fragment = "secured";\nSystem.out.println("Fragment "+fragment);'
                ],
                damage: 62,
                explanation: 'A variable declared on one line can be used immediately on the next line.',
                concept: 'fire_worm_fragment_finish',
                conceptTitle: 'Completing A Multi-Line Finish'
            }
        ];
    },

    async onFireWormVictory() {
        GameState.setFlag('ch1_fire_worm_defeated');
        GameState.setFlag('ch1_fragment_recovered');
        GameState.setFlag('ch1_cave_return_ready');

        if (typeof Platformer !== 'undefined' && typeof Platformer.resetNpcs === 'function') {
            Platformer.resetNpcs();
        }

        await Dialogue.start([
            {
                speaker: 'hera',
                name: 'Hera',
                text: `You did it. The fragment is finally ours.`,
                portrait: '🧝'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `Then let's use the map and head back to the village. Elder Varion needs to see this.`,
                portrait: '🧑‍💻'
            }
        ]);

        this.syncQuest({
            id: 'ch1_forest_quest',
            title: 'Return to the Village',
            description: 'Open the map and travel back to the Village of Variables with the recovered fragment.'
        });

        if (typeof Game !== 'undefined' && typeof Game.updateWorldMapUi === 'function') {
            Game.updateWorldMapUi(World.currentScene || GameState.progress.currentScene);
        }
    },

    async startGoblinEncounter() {
        if (GameState.hasFlag('ch1_goblin_defeated')) {
            if (typeof Platformer !== 'undefined' && typeof Platformer.releaseMovementLock === 'function') {
                Platformer.releaseMovementLock();
            }
            return;
        }

        await Dialogue.start([
            {
                speaker: 'goblin',
                name: 'Corrupted Goblin',
                text: `Arrrrggh... me kill everyone... no one gets through!`,
                portrait: '👹'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `You're done terrorizing this forest. I'm ending this now.`,
                portrait: 'ðŸ§‘â€ðŸ’»'
            }
        ]);

        const goblin = {
            name: 'Corrupted Goblin',
            hp: 26,
            maxHp: 26,
            coinReward: 30,
            art: 'assets/sprites/enemies/code_goblin.png',
            hurtArt: 'assets/sprites/enemies/code_goblin_hurt.png',
            defeatedArt: 'assets/sprites/enemies/code_goblin_defeated.png',
            description: 'A vicious goblin warped by corrupted code and brute force.',
            maxHints: 2,
            correctXpReward: 20,
            firstTryXpReward: 35,
            victoryXpReward: 70
        };

        Combat.start(goblin, this.getGoblinChallenges(), () => this.onGoblinVictory());
    },

    async startAbandonedVillageGoblinEncounter() {
        if (GameState.hasFlag('ch1_abandoned_goblin_defeated')) {
            return;
        }

        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The abandoned village is nearly silent. Then a smaller goblin darts from the rubble and lunges at you.</em>`,
                portrait: 'ðŸ“œ'
            },
            {
                speaker: 'goblin',
                name: 'Village Goblin',
                text: `Raaagh! No heroes past this place!`,
                portrait: 'ðŸ‘¹'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `One more guard. Fine - let's clear the road.`,
                portrait: 'Ã°Å¸Â§â€˜Ã¢â‚¬ÂÃ°Å¸â€™Â»'
            }
        ]);

        const goblin = {
            name: 'Village Goblin',
            hp: 24,
            maxHp: 24,
            coinReward: 30,
            art: 'assets/sprites/enemies/code_goblin.png',
            hurtArt: 'assets/sprites/enemies/code_goblin_hurt.png',
            defeatedArt: 'assets/sprites/enemies/code_goblin_defeated.png',
            description: 'A corrupted goblin left behind to guard the abandoned village approach.',
            maxHints: 1,
            correctXpReward: 14,
            firstTryXpReward: 22,
            victoryXpReward: 40
        };

        Combat.start(goblin, this.getAbandonedVillageChallenges(), () => this.onAbandonedVillageGoblinVictory());
    },

    getGoblinChallenges() {
        return [
            {
                id: 'ch1_goblin_1',
                prompt: `
                    <span class="challenge-title">⚔️ Goblin Clash: Lock In The Type</span>
                    <p>Declare an <strong>int</strong> named <code>goblinHp</code> with a value of <strong>45</strong>.</p>
                    <pre>______________________</pre>
                `,
                narrative: 'The goblin lunges. Stabilize your first variable before it breaks through!',
                hints: [
                    'Use the int keyword for whole numbers.',
                    'The variable name must be goblinHp.',
                    'Answer: int goblinHp = 45;'
                ],
                answers: [
                    'int goblinHp = 45;',
                    'int goblinHp=45;',
                    'int goblinHp = 45'
                ],
                damage: 28,
                explanation: 'An int stores whole numbers like 45.',
                concept: 'goblin_int_variable',
                conceptTitle: 'Declaring Integer Variables'
            },
            {
                id: 'ch1_goblin_2',
                prompt: `
                    <span class="challenge-title">⚔️ Goblin Clash: Name The Warning</span>
                    <p>Declare a <strong>String</strong> named <code>warning</code> with the value <strong>"Stay back"</strong>.</p>
                    <pre>______________________</pre>
                `,
                narrative: 'Dark code twists through the air. Anchor the warning phrase before it corrupts.',
                hints: [
                    'Strings need double quotes around the text.',
                    'Use the name warning.',
                    'Answer: String warning = "Stay back";'
                ],
                answers: [
                    'String warning = "Stay back";',
                    'String warning="Stay back";',
                    'String warning = "Stay back"'
                ],
                damage: 30,
                explanation: 'Strings hold text values wrapped in double quotes.',
                concept: 'goblin_string_variable',
                conceptTitle: 'Declaring String Variables'
            },
            {
                id: 'ch1_goblin_3',
                prompt: `
                    <span class="challenge-title">⚔️ Goblin Clash: Add The Damage</span>
                    <p>Given:</p>
                    <pre>int dagger = 12;
int spell = 8;</pre>
                    <p>Declare an <strong>int</strong> named <code>totalDamage</code> that equals <code>dagger + spell</code>.</p>
                    <pre>______________________</pre>
                `,
                narrative: 'The goblin braces itself. Combine your attacks into one clean strike!',
                hints: [
                    'Create a new int variable.',
                    'Use dagger + spell on the right side.',
                    'Answer: int totalDamage = dagger + spell;'
                ],
                answers: [
                    'int totalDamage = dagger + spell;',
                    'int totalDamage=dagger+spell;',
                    'int totalDamage = dagger + spell'
                ],
                damage: 32,
                explanation: 'Variables can be added together inside an expression.',
                concept: 'goblin_damage_sum',
                conceptTitle: 'Using Variables In Expressions'
            },
            {
                id: 'ch1_goblin_4',
                prompt: `
                    <span class="challenge-title">⚔️ Final Blow: Print The Result</span>
                    <p>Given:</p>
                    <pre>String enemy = "Goblin";
int totalDamage = 20;</pre>
                    <p>Print: <strong>"Goblin took 20 damage"</strong> using the variables.</p>
                    <pre>______________________</pre>
                `,
                narrative: 'Finish the corrupted goblin with one final statement!',
                hints: [
                    'Use System.out.println().',
                    'Combine the text and variable with +.',
                    'Answer: System.out.println(enemy + " took " + totalDamage + " damage");'
                ],
                answers: [
                    'System.out.println(enemy + " took " + totalDamage + " damage");',
                    'System.out.println(enemy+" took "+totalDamage+" damage");',
                    'System.out.println(enemy + " took " + totalDamage + " damage")'
                ],
                damage: 38,
                explanation: 'String concatenation lets you mix text and numbers in one output line.',
                concept: 'goblin_print_damage',
                conceptTitle: 'Printing With Concatenation'
            }
        ];
    },

    getAbandonedVillageChallenges() {
        return [
            {
                id: 'ch1_abandoned_goblin_1',
                prompt: `
                    <span class="challenge-title">⚔️ Village Ambush: Set The Value</span>
                    <p>Declare an <strong>int</strong> named <code>supplies</code> with a value of <strong>3</strong>.</p>
                    <pre>______________________</pre>
                `,
                narrative: 'A goblin scrambles across the broken road. Lock in the supply count before it closes the gap!',
                hints: [
                    'Use the int keyword.',
                    'Answer: int supplies = 3;'
                ],
                answers: [
                    'int supplies = 3;',
                    'int supplies=3;',
                    'int supplies = 3'
                ],
                damage: 32,
                explanation: 'Whole numbers like 3 use the int type.',
                concept: 'abandoned_supplies_int',
                conceptTitle: 'Declaring Integer Variables'
            },
            {
                id: 'ch1_abandoned_goblin_2',
                prompt: `
                    <span class="challenge-title">⚔️ Village Ambush: Clear The Path</span>
                    <p>Declare a <strong>boolean</strong> named <code>pathClear</code> with the value <strong>true</strong>.</p>
                    <pre>______________________</pre>
                `,
                narrative: 'The last corrupted guard stumbles back. Finish the fight by restoring a clear true/false state!',
                hints: [
                    'Use the boolean keyword.',
                    'true is written without quotes.',
                    'Answer: boolean pathClear = true;'
                ],
                answers: [
                    'boolean pathClear = true;',
                    'boolean pathClear=true;',
                    'boolean pathClear = true'
                ],
                damage: 40,
                explanation: 'boolean variables store only true or false values.',
                concept: 'abandoned_path_boolean',
                conceptTitle: 'Declaring Boolean Variables'
            }
        ];
    },

    async onGoblinVictory() {
        GameState.setFlag('ch1_goblin_defeated');
        GameState.completeQuest('ch1_help_hera');
        this.syncQuest({
            id: 'ch1_forest_quest',
            title: 'Speak with Hera',
            description: 'Return to Hera in Corrupted Forest 2 and learn where the corruption trail leads next.'
        });

        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The goblin collapses into fading strands of corrupted code. The deeper forest grows quiet for the first time in days.</em>`,
                portrait: '📜'
            },
            {
                speaker: 'hera',
                name: 'Hera',
                text: `You did it! The trail is safe again. Please, take this reward - <span class="highlight">15 gold</span> for your help.`,
                portrait: '🧝'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `I'm glad I got here in time. Stay safe, Hera.`,
                portrait: 'ðŸ§‘â€ðŸ’»'
            }
        ]);

        GameState.addGold(15);

        if (typeof Platformer !== 'undefined') {
            if (typeof Platformer.releaseMovementLock === 'function') {
                Platformer.releaseMovementLock();
            }
            if (typeof Platformer.resetNpcs === 'function') {
                Platformer.resetNpcs();
            }
        }
    },

    async onAbandonedVillageGoblinVictory() {
        if (typeof Platformer !== 'undefined') {
            Platformer.movementLocked = true;
            if (typeof Platformer.suppressSceneExit === 'function') {
                Platformer.suppressSceneExit(2200);
            }
        }

        GameState.setFlag('ch1_abandoned_goblin_defeated');
        GameState.setFlag('ch1_world_map_unlocked');
        GameState.setFlag('ch1_report_to_elder_after_abandoned');

        this.syncQuest({
            id: 'ch1_forest_quest',
            title: 'Report Back to Elder Varion',
            description: 'Return to the Village of Variables and tell Elder Varion what Hera discovered near the corruption source.'
        });

        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The last goblin falls into static. The abandoned village quiets, leaving only the hum of corrupted code deeper ahead.</em>`,
                portrait: 'ðŸ“œ'
            },
            {
                speaker: 'hera',
                name: 'Hera',
                text: `I'm sensing we're near, but I need you to report back to Elder Varion first. Take this map with you.`,
                portrait: 'ðŸ§'
            },
            {
                speaker: 'hera',
                name: 'Hera',
                text: `It marks the route from this village toward the fragment. Once the elder sees it, he'll know how to prepare you for the Data Glitch.`,
                portrait: 'ðŸ§'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `I'll bring it to him right away. Wait here - we're close to ending this.`,
                portrait: 'Ã°Å¸Â§â€˜Ã¢â‚¬ÂÃ°Å¸â€™Â»'
            }
        ]);

        if (typeof Game !== 'undefined' && typeof Game.updateWorldMapUi === 'function') {
            Game.updateWorldMapUi(World.currentScene || GameState.progress.currentScene);
        }

        if (typeof Platformer !== 'undefined') {
            if (typeof Platformer.releaseMovementLock === 'function') {
                Platformer.releaseMovementLock();
            }
            if (typeof Platformer.suppressSceneExit === 'function') {
                Platformer.suppressSceneExit(1600);
            }
            if (Platformer.player && typeof Platformer.width === 'number') {
                const safeX = Math.floor(Platformer.width * 0.35);
                const maxX = Math.max(72, Platformer.width - Platformer.player.w - 72);
                Platformer.player.x = Math.max(72, Math.min(safeX, maxX));
                Platformer.player.y = Platformer.groundY - Platformer.player.h;
            }
            if (typeof Platformer.resetExitPrompt === 'function') {
                Platformer.resetExitPrompt();
            }
            if (typeof Platformer.clearInputState === 'function') {
                Platformer.clearInputState();
            }
            if (typeof Platformer.resetNpcs === 'function') {
                Platformer.resetNpcs();
            }
        }
    },

    /**
     * Training Grounds - coding practice
     */
    async startTraining() {
        if (!GameState.hasFlag('ch1_elder_talked')) {
            await Dialogue.quick('trainer', 'Trainer Rowan',
                `Talk to Elder Varion first. Once you've heard the village's situation, I'll take you through your first training round.`,
                '🥋');
            return;
        }

        if (GameState.hasFlag('ch1_training_complete')) {
            await Dialogue.quick('narrator', 'Narrator',
                `<em>You've already completed the training. The corrupted forest awaits!</em>`,
                '📖');
            return;
        }
        
        await Utils.showTransition('Rowan leads you to the Training Grounds...', 1200);
        await World.loadScene('ch1_training');
        if (false) {

        if (GameState.hasFlag('ch1_forest_path_unlocked')) {
            await Dialogue.quick('elder', 'Elder Varion',
                `The Corrupted Forest lies to the far right of the village, ${GameState.player.name}. Follow the trail, find Hera, and discover where the fragment is hidden.`,
                'ðŸ‘´');
            return;
        }

        }

        await Dialogue.start([
            {
                speaker: 'trainer',
                name: 'Trainer Rowan',
                text: `We'll start small. This dummy is tuned for beginners, and I'll give you hints as soon as the challenge begins.`,
                portrait: '🥋'
            },
            {
                speaker: 'trainer',
                name: 'Trainer Rowan',
                text: `Land a couple of clean answers, learn the basics, and then head back to Elder Varion.`,
                portrait: '🥋'
            }
        ]);

        const easyEnemy = {
            name: 'Training Dummy',
            hp: 24,
            maxHp: 24,
            coinReward: 25,
            art: `
    ╔═══════════════════════════════════╗
    ║   ┌─────────┐   ║
    ║   │ TRAIN   │   ║
    ║   │ DUMMY   │   ║
    ║   └────┬────┘   ║
    ║        │        ║
    ║   ┌─────────┐   ║
    ║   │ int     │   ║
    ║   │ boolean │   ║
    ║   └─────────┘   ║
    ╚═══════════════════════════════════╝`,
            description: 'A patient dummy built for first lessons in Java variables.',
            maxHints: 3,
            autoShowHint: true,
            correctXpReward: 5,
            firstTryXpReward: 10,
            victoryXpReward: 20
        };

        Combat.start(easyEnemy, this.getTrainingChallenges(), () => this.onTrainingComplete());
        return;

        await Dialogue.quick('narrator', 'Narrator',
            `<em>You approach the training dummies. Each one represents a coding challenge. Defeat them all to complete your training!</em>`,
            '📖');
        
        // Training combat - practice dummies
        const enemy = {
            name: 'Training Dummy — Variables',
            hp: 100,
            maxHp: 100,
            art: `
    ╔═══════════════════════════════════╗
    ║   ┌─────────┐   ║
    ║   │ TRAIN   │   ║
    ║   │ DUMMY   │   ║
    ║   └────┬────┘   ║
    ║       │       ║
    ║   ┌─────────┐   ║
    ║   │ int   │   ║
    ║   │String │   ║
    ║   │double │   ║
    ║   └─────────┘   ║
    ╚═══════════════════════════════════╝`,
            description: 'A training dummy enchanted with variable challenges.'
        };
        
        const challenges = this.getTrainingChallenges();
        
        Combat.start(enemy, challenges, () => this.onTrainingComplete());
    },
    
    /**
     * Get training challenges
     */
    getTrainingChallenges() {
        return [
            {
                id: 'ch1_train_1',
                prompt: `
                    <span class="challenge-title">Training: Integer Variable</span>
                    <p>Declare an <strong>integer variable</strong> named <code>score</code> with a value of <strong>10</strong>.</p>
                    <pre>______________________</pre>
                `,
                narrative: 'Rowan calls out: start with a simple integer declaration!',
                hints: [
                    'Use the "int" keyword to declare an integer variable.',
                    'Format: int variableName = value;',
                    'Answer: int score = 10;'
                ],
                answers: ['int score = 10;', 'int score=10;', 'int score = 10'],
                damage: 18,
                autoShowHint: true,
                explanation: 'int is used for whole numbers. Syntax: int variableName = value;',
                concept: 'int_declaration',
                conceptTitle: 'Integer Declaration',
                codexTitle: 'Training Dummy - Integer Variable',
                feedbackDuration: 3200
            },
            {
                id: 'ch1_train_2',
                type: 'multiple_choice',
                prompt: `
                    <span class="challenge-title">Training: Boolean Check</span>
                    <p>Which line correctly declares a <strong>boolean variable</strong> named <code>isReady</code> and sets it to <strong>true</strong>?</p>
                `,
                narrative: 'Good. Now finish with a quick choice attack and spot the correct boolean declaration.',
                hints: [
                    'Use the "boolean" keyword for true/false values.',
                    'true and false are lowercase in Java.',
                    'Answer: boolean isReady = true;'
                ],
                choices: [
                    'Boolean isReady = true;',
                    'boolean ready = "true";',
                    'boolean isReady = true;',
                    'int isReady = true;'
                ],
                correctOption: 2,
                answers: ['boolean isReady = true;'],
                damage: 20,
                autoShowHint: true,
                explanation: 'boolean stores true or false values. Useful for conditions and flags.',
                concept: 'boolean_declaration',
                conceptTitle: 'Boolean Declaration',
                codexTitle: 'Training Dummy - Boolean Variable',
                feedbackDuration: 3200
            }
        ];

        return [
            {
                id: 'ch1_train_1',
                prompt: `
                    <span class="challenge-title">📝 Training: Integer Variable</span>
                    <p>Declare an <strong>integer variable</strong> named <code>score</code> with a value of <strong>10</strong>.</p>
                    <pre>______________________</pre>
                `,
                narrative: 'Rowan calls out: start with a simple integer declaration!',
                hints: [
                    'Use the "int" keyword to declare an integer variable.',
                    'Format: int variableName = value;',
                    'Answer: int score = 10;'
                ],
                answers: ['int score = 10;', 'int score=10;', 'int score = 10'],
                damage: 25,
                autoShowHint: true,
                explanation: 'int is used for whole numbers. Syntax: int variableName = value;',
                concept: 'int_declaration',
                conceptTitle: 'Integer Declaration'
            },
            {
                id: 'ch1_train_2',
                prompt: `
                    <span class="challenge-title">📝 Training: Boolean Variable</span>
                    <p>Declare a <strong>boolean variable</strong> named <code>isReady</code> and set it to <strong>true</strong>.</p>
                    <pre>______________________</pre>
                `,
                narrative: 'Good. Now finish with a true-or-false variable.',
                hints: [
                    'Use the "boolean" keyword for true/false values.',
                    'true and false are lowercase in Java.',
                    'Answer: boolean isReady = true;'
                ],
                answers: ['boolean isReady = true;', 'boolean isReady=true;', 'boolean isReady = true'],
                damage: 25,
                autoShowHint: true,
                explanation: 'boolean stores true or false values. Useful for conditions and flags.',
                concept: 'boolean_declaration',
                conceptTitle: 'Boolean Declaration'
            }
        ];

        const difficulty = GameState.performance.difficultyLevel;
        
        const beginnerChallenges = [
            {
                id: 'ch1_train_1',
                prompt: `
                    <span class="challenge-title">📝 Training: Integer Variable</span>
                    <p>Declare an <strong>integer variable</strong> named <code>score</code> with a value of <strong>50</strong>.</p>
                    <pre>______________________</pre>
                `,
                narrative: 'The training dummy glows! Declare a variable to strike!',
                hints: [
                    'Use the "int" keyword to declare an integer variable.',
                    'Format: int variableName = value;',
                    'Answer: int score = 50;'
                ],
                answers: ['int score = 50;', 'int score=50;', 'int score = 50'],
                damage: 25,
                explanation: 'int is used for whole numbers. Syntax: int variableName = value;',
                concept: 'int_declaration',
                conceptTitle: 'Integer Declaration'
            },
            {
                id: 'ch1_train_2',
                prompt: `
                    <span class="challenge-title">📝 Training: Double Variable</span>
                    <p>Declare a <strong>double variable</strong> named <code>price</code> with a value of <strong>9.99</strong>.</p>
                    <pre>______________________</pre>
                `,
                narrative: 'Good hit! Now try a decimal number variable!',
                hints: [
                    'Use the "double" keyword for decimal numbers.',
                    'Format: double variableName = value;',
                    'Answer: double price = 9.99;'
                ],
                answers: ['double price = 9.99;', 'double price=9.99;', 'double price = 9.99'],
                damage: 25,
                explanation: 'double is used for decimal (floating-point) numbers. Syntax: double variableName = value;',
                concept: 'double_declaration',
                conceptTitle: 'Double Declaration'
            },
            {
                id: 'ch1_train_3',
                prompt: `
                    <span class="challenge-title">📝 Training: Boolean Variable</span>
                    <p>Declare a <strong>boolean variable</strong> named <code>isReady</code> and set it to <strong>true</strong>.</p>
                    <pre>______________________</pre>
                `,
                narrative: 'Almost there! Declare a boolean to land the next blow!',
                hints: [
                    'Use the "boolean" keyword for true/false values.',
                    'Boolean values are lowercase: true or false',
                    'Answer: boolean isReady = true;'
                ],
                answers: ['boolean isReady = true;', 'boolean isReady=true;', 'boolean isReady = true'],
                damage: 25,
                explanation: 'boolean stores true or false values. Useful for conditions and flags. Syntax: boolean variableName = true/false;',
                concept: 'boolean_declaration',
                conceptTitle: 'Boolean Declaration'
            },
            {
                id: 'ch1_train_4',
                prompt: `
                    <span class="challenge-title">📝 Training: Print a Variable</span>
                    <p>Given: <code>String greeting = "Hello Java Realm";</code></p>
                    <p>Write the code to <strong>print the variable <code>greeting</code></strong> to the console.</p>
                    <pre>String greeting = "Hello Java Realm";
______________________</pre>
                `,
                narrative: 'Final strike! Print the variable to finish the dummy!',
                hints: [
                    'Use System.out.println() to print.',
                    'Put the variable name inside the parentheses — no quotes needed for variables!',
                    'Answer: System.out.println(greeting);'
                ],
                answers: [
                    'System.out.println(greeting);',
                    'System.out.println(greeting)',
                    'system.out.println(greeting);'
                ],
                damage: 25,
                explanation: 'When printing a variable, don\'t use quotes around the variable name. Quotes are only for literal text (Strings).',
                concept: 'print_variable',
                conceptTitle: 'Printing Variables'
            }
        ];
        
        const intermediateChallenges = [
            {
                id: 'ch1_train_adv_1',
                prompt: `
                    <span class="challenge-title">📝 Training: Char Variable</span>
                    <p>Declare a <strong>char variable</strong> named <code>grade</code> with the value <strong>'A'</strong>.</p>
                    <p><em>Remember: char uses single quotes!</em></p>
                    <pre>______________________</pre>
                `,
                narrative: 'Advanced training! Declare a character variable!',
                hints: [
                    'Use the "char" keyword for single characters.',
                    'char values use single quotes: \'A\' (not double quotes)',
                    'Answer: char grade = \'A\';'
                ],
                answers: ["char grade = 'A';", "char grade='A';", "char grade = 'A'"],
                damage: 35,
                explanation: 'char stores a single character using single quotes. String uses double quotes for text.',
                concept: 'char_declaration',
                conceptTitle: 'Char Declaration'
            },
            ...beginnerChallenges.slice(0, 3)
        ];
        
        // Return challenges based on difficulty
        if (difficulty === 'intermediate' || difficulty === 'advanced') {
            return intermediateChallenges;
        }
        return beginnerChallenges;
    },
    
    /**
     * Training complete callback
     */
    async onTrainingComplete() {
        GameState.setFlag('ch1_training_complete');
        GameState.completeQuest('ch1_training');

        await Utils.showTransition('Rowan sends you back to the village square...', 1200);
        await World.loadScene('ch1_village_square');

        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The training dummy splinters apart. The basics of variables already feel much clearer in your hands.</em>`,
                portrait: '📖'
            },
            {
                speaker: 'trainer',
                name: 'Trainer Rowan',
                text: `Nice work. That's enough for your first lesson. Go report back to Elder Varion, and remember to check your Codex whenever you want to review your attacks.`,
                portrait: '🥋'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `I get it now. Variables really are the foundation. I'd better return to the elder.`,
                portrait: '🧑‍💻'
            }
        ]);

        World.updateActions([]);
        return;
        
        Utils.show('world-display');
        
        await World.loadScene('ch1_training');
        
        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The training dummies crumble to dust. You've mastered the basics of variable declaration!</em>`,
                portrait: '📖'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `I'm getting the hang of this! int for whole numbers, double for decimals, boolean for true/false, String for text, and char for single characters.`,
                portrait: '🧑‍💻'
            },
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>You feel stronger. Your understanding of variables has deepened, and with it, your power as a Code Guardian grows.</em>`,
                portrait: '📖'
            }
        ]);
        
        // Update actions
        World.updateActions([
            { label: 'Return to Square', icon: '🔙', primary: true, callback: () => World.goTo('ch1_village_square', 'Returning to the village square...') }
        ]);
    },
    
    /**
     * Elder dialogue after training
     */
    async elderPostTraining() {
        if (GameState.hasFlag('ch1_forest_complete')) {
            await this.elderAfterForest();
            return;
        }

        if (GameState.hasFlag('ch1_report_to_elder_after_abandoned')) {
            await Dialogue.start([
                {
                    speaker: 'elder',
                    name: 'Elder Varion',
                    text: `So Hera found the abandoned village... then the corruption source truly is close.`,
                    portrait: 'ðŸ‘´'
                },
                {
                    speaker: 'player',
                    name: GameState.player.name,
                    text: `She gave me a map. It points to a cave beyond the old ruins. Hera thinks the fragment is there.`,
                    portrait: 'ðŸ§‘â€ðŸ’»'
                },
                {
                    speaker: 'elder',
                    name: 'Elder Varion',
                    text: `Then the cave is the next step. I am unlocking it on your map now. Travel there, meet Hera, and claim the fragment before the corruption closes in around it.`,
                    portrait: 'ðŸ‘´'
                },
                {
                    speaker: 'elder',
                    name: 'Elder Varion',
                    text: `Be careful inside. The things hiding in that darkness will be fiercer than the goblins you faced outside.`,
                    portrait: 'ðŸ‘´'
                }
            ]);

            GameState.setFlag('ch1_report_to_elder_after_abandoned', false);
            GameState.setFlag('ch1_cave_unlocked');
            GameState.setFlag('ch1_elder_has_map_report', false);
            this.syncQuest({
                id: 'ch1_forest_quest',
                title: 'Travel to the Cave',
                description: 'Open the map, travel to the cave, and meet Hera at the entrance.'
            });
            if (typeof Game !== 'undefined' && typeof Game.updateWorldMapUi === 'function') {
                Game.updateWorldMapUi(World.currentScene || GameState.progress.currentScene);
            }
            return;
        }

        if (GameState.hasFlag('ch1_fragment_recovered') && !GameState.hasFlag('ch1_syntax_city_unlocked')) {
            await Dialogue.start([
                {
                    speaker: 'elder',
                    name: 'Elder Varion',
                    text: `You've got the fragment. This part of the realm will be safe... for now.`,
                    portrait: 'ðŸ‘´'
                },
                {
                    speaker: 'elder',
                    name: 'Elder Varion',
                    text: `But the same disruption is appearing in <span class="highlight">Syntax City</span>. Orders are breaking apart, notices are rewriting themselves, and the city's structure is slipping out of balance.`,
                    portrait: 'ðŸ‘´'
                },
                {
                    speaker: 'elder',
                    name: 'Elder Varion',
                    text: `You must go there next. If Syntax City falls deeper into corruption, the rest of the realm may lose the ability to speak, record, and command clearly.`,
                    portrait: 'ðŸ‘´'
                },
                {
                    speaker: 'hera',
                    name: 'Hera',
                    text: `Take care on your journey, ${GameState.player.name}. If the city's syntax is breaking, even simple statements may turn dangerous.`,
                    portrait: 'ðŸ§'
                }
            ]);

            GameState.setFlag('ch1_syntax_city_unlocked');
            GameState.completeQuest('ch1_main');
            GameState.completeQuest('ch1_forest_quest');
            this.syncQuest({
                id: 'ch1_syntax_city',
                title: 'Travel to Syntax City',
                description: 'Open the world map and travel to Syntax City to investigate the spreading corruption.'
            });
            if (typeof Game !== 'undefined' && typeof Game.updateWorldMapUi === 'function') {
                Game.updateWorldMapUi(World.currentScene || GameState.progress.currentScene);
            }
            return;
        }

        if (GameState.hasFlag('ch1_syntax_city_unlocked') && !GameState.hasFlag('ch1_city_map_unlocked')) {
            await Dialogue.quick(
                'elder',
                'Elder Varion',
                `Syntax City is marked on your map now. Travel there, find the source of the disruption, and learn what the city needs from you.`,
                'ðŸ‘´'
            );
            return;
        }

        if (GameState.hasFlag('ch1_fragment_recovered')) {
            await Dialogue.quick(
                'elder',
                'Elder Varion',
                `The path to Syntax City is open now, ${GameState.player.name}. Follow the map, earn the city's trust, and find the source of the disruption.`,
                '👴'
            );
            return;
        }

        if (GameState.hasFlag('ch1_cave_unlocked') && !GameState.hasFlag('ch1_fragment_recovered')) {
            await Dialogue.quick(
                'elder',
                'Elder Varion',
                `The cave is marked on your map now. Travel there and meet Hera at the entrance.`,
                '👴'
            );
            return;
        }

        if (GameState.hasFlag('ch1_elder_has_map_report')) {
            await Dialogue.quick(
                'elder',
                'Elder Varion',
                `Keep Hera's map with you, ${GameState.player.name}. The path to the fragment is marked now - we only need the right moment to push deeper.`,
                '👴'
            );
            return;
        }

        if (GameState.hasFlag('ch1_forest_path_unlocked')) {
            await Dialogue.quick('elder', 'Elder Varion',
                `The Corrupted Forest lies to the far right of the village, ${GameState.player.name}. Follow the trail, find Hera, and discover where the fragment is hidden.`,
                '👴');
            return;
        }
        
        await Dialogue.start([
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `Excellent work at the Training Grounds, ${GameState.player.name}! I can sense your growing power.`,
                portrait: '👴'
            },
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `You're ready to enter the <span class="highlight">Corrupted Forest</span>. Somewhere deeper inside, the Prime Script fragment is being guarded by the corruption source.`,
                portrait: '👴'
            },
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `Hera was scouting the trail before the forest turned on her. Find her, follow the signs of corruption, and learn where the <span class="highlight">Data Glitch</span> is hiding.`,
                portrait: '👴'
            },
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `Go north to the forest. Recover what you can, then report back if the trail changes. May the clean code guide your way, Guardian.`,
                portrait: '👴'
            }
        ]);
        
        GameState.setFlag('ch1_forest_path_unlocked');

        this.syncQuest({
            id: 'ch1_forest_quest',
            title: 'Investigate the Corrupted Forest',
            description: 'Enter the Corrupted Forest, find Hera, and trace the route to the Prime Script fragment.'
        });
    },
    
    /**
     * Forest battle - boss of Chapter 1
     */
    async forestBattle() {
        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>Deep in the corrupted forest, you find a clearing. In its center, a massive creature of garbled data writhes and pulses — the Data Glitch.</em>`,
                portrait: '📖'
            },
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>Behind it, you can see a glowing fragment — a piece of the Prime Script, pulsing with golden light.</em>`,
                portrait: '📖'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `There's the Prime Script fragment! I just need to get past this creature... Time to put my training to use!`,
                portrait: '🧑‍💻'
            }
        ]);
        
        // Boss battle
        const boss = {
            name: 'Data Glitch',
            hp: 150,
            maxHp: 150,
            coinReward: 90,
            art: 'enemyGlitch',
            description: 'A powerful corrupted entity that distorts data types and variable values.',
            reward: {
                name: 'Prime Script Fragment — Variables',
                icon: '📜',
                description: 'A fragment of the Prime Script governing Variables and Data Types.'
            }
        };
        
        const challenges = this.getForestChallenges();
        
        Combat.start(boss, challenges, () => this.onForestVictory());
    },
    
    /**
     * Get forest battle challenges
     */
    getForestChallenges() {
        const difficulty = GameState.performance.difficultyLevel;
        
        const challenges = [
            {
                id: 'ch1_boss_1',
                prompt: `
                    <span class="challenge-title">⚔️ Data Glitch Attack: Type Confusion!</span>
                    <p>The Data Glitch scrambles your variables! Fix the declaration:</p>
                    <p>Declare an <strong>integer</strong> named <code>level</code> with value <strong>1</strong> and a <strong>String</strong> named <code>rank</code> with value <strong>"Trainee"</strong>.</p>
                    <p><em>Write both declarations (one per line):</em></p>
                    <pre>______________________
______________________</pre>
                `,
                narrative: 'The Data Glitch attacks with Type Confusion! Declare the correct variables!',
                hints: [
                    'You need two lines: one for int and one for String.',
                    'int level = 1; on the first line, String rank = "Trainee"; on the second.',
                    'Full answer:\nint level = 1;\nString rank = "Trainee";'
                ],
                answers: [
                    'int level = 1;\nString rank = "Trainee";',
                    'int level = 1; String rank = "Trainee";',
                    'int level=1;\nString rank="Trainee";',
                    'int level = 1;\nString rank = "Trainee"',
                    'String rank = "Trainee";\nint level = 1;'
                ],
                damage: 30,
                explanation: 'Multiple variables can be declared on separate lines. Each needs its own type, name, and value.',
                concept: 'multiple_variables',
                conceptTitle: 'Multiple Variable Declarations'
            },
            {
                id: 'ch1_boss_2',
                prompt: `
                    <span class="challenge-title">⚔️ Data Glitch Attack: Value Swap!</span>
                    <p>The Glitch tries to corrupt a calculation! Write the correct code:</p>
                    <p>Declare two integers: <code>a</code> with value <strong>10</strong> and <code>b</code> with value <strong>20</strong>. 
                    Then declare an integer <code>sum</code> that equals <strong>a + b</strong>.</p>
                    <pre>int a = 10;
int b = 20;
______________________</pre>
                `,
                narrative: 'The Data Glitch corrupts your calculations! Fix the sum!',
                hints: [
                    'You need to declare a new int variable that stores the result of adding a and b.',
                    'Use the + operator to add variables: a + b',
                    'Answer: int sum = a + b;'
                ],
                answers: [
                    'int sum = a + b;',
                    'int sum=a+b;',
                    'int sum = a + b',
                    'int sum = a+b;'
                ],
                damage: 30,
                explanation: 'Variables can be used in expressions. int sum = a + b; creates a new variable that stores the result of adding a and b.',
                concept: 'variable_expressions',
                conceptTitle: 'Variable Expressions & Arithmetic'
            },
            {
                id: 'ch1_boss_3',
                prompt: `
                    <span class="challenge-title">⚔️ Data Glitch Attack: String Corruption!</span>
                    <p>The Glitch corrupts text data! Fix it by concatenating strings:</p>
                    <p>Given: <code>String firstName = "Code";</code> and <code>String lastName = "Guardian";</code></p>
                    <p>Create a <strong>String</strong> named <code>fullName</code> that combines them with a space in between.</p>
                    <pre>String firstName = "Code";
String lastName = "Guardian";
______________________</pre>
                `,
                narrative: 'The Data Glitch scrambles your strings! Concatenate them correctly!',
                hints: [
                    'In Java, you can join strings using the + operator.',
                    'To add a space between words, concatenate " " (a string with a space).',
                    'Answer: String fullName = firstName + " " + lastName;'
                ],
                answers: [
                    'String fullName = firstName + " " + lastName;',
                    'String fullName=firstName+" "+lastName;',
                    'String fullName = firstName + " " + lastName',
                    'String fullName = firstName+ " " +lastName;'
                ],
                damage: 30,
                explanation: 'String concatenation uses the + operator to join strings together. You can include literal strings like " " for spaces.',
                concept: 'string_concatenation',
                conceptTitle: 'String Concatenation'
            },
            {
                id: 'ch1_boss_4',
                prompt: `
                    <span class="challenge-title">⚔️ Final Strike: Print the Result!</span>
                    <p>Finish off the Data Glitch! Print a message using string concatenation:</p>
                    <p>Given: <code>String name = "${GameState.player.name}";</code> and <code>int level = 1;</code></p>
                    <p>Print: <strong>"Guardian [name] is level [level]"</strong> using the variables.</p>
                    <pre>String name = "${GameState.player.name}";
int level = 1;
______________________</pre>
                `,
                narrative: 'The Data Glitch is weakening! Deliver the final blow!',
                hints: [
                    'Use System.out.println() with string concatenation.',
                    'Mix literal strings with variables using +: "text" + variable + "more text"',
                    `Answer: System.out.println("Guardian " + name + " is level " + level);`
                ],
                answers: [
                    `System.out.println("Guardian " + name + " is level " + level);`,
                    `System.out.println("Guardian "+name+" is level "+level);`,
                    `System.out.println("Guardian " + name + " is level " + level)`,
                    `system.out.println("Guardian " + name + " is level " + level);`
                ],
                damage: 60,
                explanation: 'You can concatenate strings and variables of different types using +. Java automatically converts numbers to strings when concatenating.',
                concept: 'mixed_concatenation',
                conceptTitle: 'Mixed Type Concatenation'
            }
        ];
        
        return challenges;
    },
    
    /**
     * Forest victory - Chapter 1 boss defeated
     */
    async onForestVictory() {
        GameState.setFlag('ch1_forest_complete');
        GameState.completeQuest('ch1_forest_quest');
        
        Utils.show('world-display');
        Utils.setSceneArt('forestPath', 'medieval-village');
        Utils.setSceneText(`
            <div class="location-intro">✨ Corrupted Forest — Purified</div>
            <p class="narrator">The Data Glitch dissolves into streams of clean code. The corruption in the forest begins to recede, 
            and the trees slowly return to their natural state. The Prime Script fragment floats gently into your hands.</p>
        `);
        
        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>As you hold the Prime Script fragment, knowledge flows into you. You understand variables and data types at a deeper level than ever before.</em>`,
                portrait: '📖'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `I can feel it... The Prime Script fragment is resonating with me. I understand now — variables are the foundation of everything in code.`,
                portrait: '🧑‍💻'
            },
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The forest around you transforms. Corrupted trees become healthy oaks, glitchy ground becomes solid earth. The Village of Variables is being restored!</em>`,
                portrait: '📖'
            }
        ]);
        
        // Award chapter completion XP
        GameState.addXP(CONFIG.XP_REWARDS.chapterComplete);
        
        // Return to village for conclusion
        await Utils.showTransition('Returning to the village...', 2000);
        await this.chapterConclusion();
    },
    
    /**
     * Elder dialogue after forest
     */
    async elderAfterForest() {
        await Dialogue.quick('elder', 'Elder Varion',
            `You've done it, ${GameState.player.name}! The Prime Script of Variables is restored! Our village is saved. You are a true Code Guardian!`,
            '👴');
    },
    
    /**
     * Chapter 1 conclusion
     */
    async chapterConclusion() {
        Utils.setSceneArt('medievalVillage', 'medieval-village');
        Utils.setSceneText(`
            <div class="location-intro">🏰 Village of Variables — Restored</div>
            <p class="narrator">The village is transformed. Buildings stand solid and real, the fountain flows normally, 
            and villagers cheer as the corruption fades away. You've restored the first Prime Script!</p>
        `);
        
        await Dialogue.start([
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `${GameState.player.name}! You've done it! The Prime Script of Variables is restored! Look — the village is returning to normal!`,
                portrait: '👴'
            },
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The villagers gather around you, cheering. The fountain in the square now flows with crystal-clear water, and the buildings stand solid and true.</em>`,
                portrait: '📖'
            },
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `You've proven yourself worthy, Guardian. But this is only the beginning. There are more regions, more Prime Scripts to restore.`,
                portrait: '👴'
            },
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `To the east lies the <span class="highlight">Conditional Crossroads</span> — where the Prime Script of <span class="highlight">If-Else Statements</span> has been corrupted. The path there has just opened.`,
                portrait: '👴'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `I won't stop until all the Prime Scripts are restored. The Java Realm is counting on me!`,
                portrait: '🧑‍💻'
            },
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `That's the spirit! Take this with you — a <span class="highlight">Guardian's Codex</span>. It will record everything you learn on your journey.`,
                portrait: '👴'
            },
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>Elder Varion hands you an ancient-looking book that glows with a soft golden light. Your journal has been upgraded!</em>`,
                portrait: '📖'
            }
        ]);
        
        // Complete main quest
        GameState.completeQuest('ch1_main');
        GameState.markChapterOneComplete();
        
        // Add item
        GameState.addItem({
            name: "Guardian's Codex",
            icon: '📕',
            description: 'A magical book that records your Java knowledge. Check your Journal to review learned concepts.'
        });
        
        // Chapter complete notification
        Utils.notify('🎉 Chapter 1 Complete!', 'level-up', 5000);
        
        // Save game
        GameState.save();
        
        // Show end of chapter actions
        Utils.setActions([
            { label: 'Continue to Chapter 2 (Coming Soon)', icon: '➡️', callback: () => this.showComingSoon() },
            { label: 'Explore Village', icon: '🏘️', callback: () => World.goTo('ch1_village_square', 'Exploring the village...') },
            { label: 'Return to Main Menu', icon: '🏠', callback: () => Game.returnToMenu() }
        ]);
    },
    
    /**
     * Coming soon message
     */
    async showComingSoon() {
        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The road ahead leads toward Chapter 2: The Conditional Crossroads. That path is not open yet, but harsher trials are waiting there.</em>`,
                portrait: '📖'
            },
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>For now, you can revisit Chapter 1, review your Codex, or return to the main menu. Your progress has been saved.</em>`,
                portrait: '📖'
            }
        ]);
    },

    // Story-aligned challenge overrides. These later method definitions replace the
    // older legacy question pools above without changing the rest of the scene flow.
    buildAdaptiveEncounterQuestions(mainChallenges, recoveryChallenges, topicKey) {
        const normalizedTopic = topicKey || 'chapter1';

        return [
            ...(mainChallenges || []).map((challenge) => ({
                ...challenge,
                adaptiveTopic: challenge.adaptiveTopic || normalizedTopic
            })),
            ...(recoveryChallenges || []).map((challenge) => ({
                ...challenge,
                adaptiveTopic: challenge.adaptiveTopic || normalizedTopic,
                isRecovery: true
            }))
        ];
    },

    getTrainingChallenges() {
        const area = 'Village of Variables - Training Grounds';
        const npc = 'Mentor Rowan';
        const topic = 'user_input';

        const mainChallenges = [
            {
                id: 'ch1_train_story_1',
                title: 'Scanner Import',
                questionType: 'True or False',
                area,
                npc,
                question: `<em>Rowan taps a worn coding scroll.</em> True or false: <code>import java.util.Scanner;</code> is used to import the <code>Scanner</code> class in Java.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'The training grounds now start with user input, matching the new Q&A file.',
                hints: [
                    'Scanner belongs to the java.util package.',
                    'Import statements appear before using external classes.',
                    'The line shown is the standard Scanner import.'
                ],
                answers: ['true'],
                damage: 8,
                autoShowHint: true,
                explanation: 'import java.util.Scanner; is the correct line used to import the Scanner class.',
                concept: 'user_input_import',
                conceptTitle: 'Importing Scanner',
                codexTitle: 'Training Dummy - Scanner Import',
                feedbackDuration: 2500
            },
            {
                id: 'ch1_train_story_2',
                title: 'Input Portal',
                questionType: 'True or False',
                area,
                npc,
                question: `<em>Rowan points toward a glowing terminal gate.</em> True or false: <code>Scanner scan = new Scanner(System.in);</code> creates a Scanner object named <code>scan</code>.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'The second step moves from importing Scanner to creating one.',
                hints: [
                    'new Scanner(System.in) builds the object.',
                    'scan is the variable name.',
                    'System.in listens for keyboard input.'
                ],
                answers: ['true'],
                damage: 8,
                autoShowHint: true,
                explanation: 'That line creates a Scanner object named scan that reads from System.in.',
                concept: 'user_input_creation',
                conceptTitle: 'Creating A Scanner',
                codexTitle: 'Training Dummy - Input Portal',
                feedbackDuration: 2500
            },
            {
                id: 'ch1_train_story_3',
                title: 'Read The Hero',
                questionType: 'True or False',
                area,
                npc,
                question: `<em>Rowan scribbles a name into the dust.</em> True or false: the method <code>nextLine()</code> is used to read a <code>String</code> input from the user.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'Now the lesson checks which Scanner method reads text.',
                hints: [
                    'A whole line of text is not read by nextInt().',
                    'Scanner has a method meant for line-based text input.',
                    'The method named in the question is the standard one.'
                ],
                answers: ['true'],
                damage: 8,
                autoShowHint: true,
                explanation: 'nextLine() is used to read a full line of text as a String.',
                concept: 'user_input_nextline',
                conceptTitle: 'Reading Text Input',
                codexTitle: 'Training Dummy - Read The Hero',
                feedbackDuration: 2500
            },
            {
                id: 'ch1_train_story_4',
                title: 'Read The Gold',
                questionType: 'True or False',
                area,
                npc,
                question: `<em>The dummy rattles as Rowan changes the prompt.</em> True or false: the method <code>nextInt()</code> is used to read a <code>String</code> input.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'The last training question separates number input from text input.',
                hints: [
                    'nextInt() reads integers, not lines of text.',
                    'String input is commonly read with nextLine().',
                    'So the statement in the question is incorrect.'
                ],
                answers: ['false'],
                damage: 8,
                autoShowHint: true,
                explanation: 'nextInt() is used for integer input, so it does not read a String input.',
                concept: 'user_input_nextint',
                conceptTitle: 'Reading Integer Input',
                codexTitle: 'Training Dummy - Read The Gold',
                feedbackDuration: 2600
            }
        ];

        const recoveryChallenges = [
            {
                id: 'ch1_train_recovery_1',
                title: 'Keyboard Source',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>Rowan lowers the pace and points at the keyboard.</em> In Java, what source is commonly placed inside <code>new Scanner(_____)</code> to read keyboard input?`,
                answerTip: 'Type only the missing source.',
                inputPlaceholder: 'System.in',
                matchMode: 'exact',
                narrative: 'You struggled a bit, so Rowan gives a more guided Scanner question from the same lesson.',
                hints: [
                    'It starts with System.',
                    'It refers to standard input.',
                    'The missing text includes a dot.',
                    'The full answer is System.in.'
                ],
                answers: ['System.in'],
                damage: 7,
                autoShowHint: true,
                explanation: 'System.in is the standard keyboard input source used with Scanner.'
            },
            {
                id: 'ch1_train_recovery_2',
                title: 'Text Reader',
                questionType: 'Multiple Choice',
                area,
                npc,
                type: 'multiple_choice',
                question: `<em>Rowan taps the scroll again.</em> Which Scanner method is used to read a whole line of text?`,
                narrative: 'The lesson stays on user input, but the next question becomes easier and more direct.',
                hints: [
                    'It reads text, not a number.',
                    'It includes the word line.',
                    'It is not nextInt().',
                    'Choose the method used for a full line.'
                ],
                choices: ['nextInt()', 'nextLine()', 'close()', 'print()'],
                correctOption: 1,
                answers: ['nextLine()'],
                damage: 7,
                autoShowHint: true,
                explanation: 'nextLine() reads a whole line of text from the user.'
            }
        ];

        return this.buildAdaptiveEncounterQuestions(mainChallenges, recoveryChallenges, topic);
    },

    getGoblinChallenges() {
        const area = 'Corrupted Forest';
        const npc = 'Corrupted Goblin';
        const topic = 'arithmetic';

        const mainChallenges = [
            {
                id: 'ch1_goblin_story_1',
                title: 'Sword Strike',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The goblin lunges with a rough strike.</em> Which operator adds numbers in Java?`,
                answerTip: 'Type only the operator.',
                inputPlaceholder: 'Type the operator',
                matchMode: 'exact',
                narrative: 'The first forest fight now covers arithmetic operators.',
                hints: [
                    'It is the same symbol used in basic math for addition.',
                    'Java uses a single character for it.',
                    'It is also used for String concatenation.'
                ],
                answers: ['+'],
                damage: 10,
                autoShowHint: true,
                explanation: 'The + operator is used to add numbers in Java.',
                concept: 'arithmetic_addition',
                conceptTitle: 'Addition Operator',
                codexTitle: 'Goblin - Sword Strike'
            },
            {
                id: 'ch1_goblin_story_2',
                title: 'Fire Slash',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The goblin trips over a scorched rune.</em> What is the output of this code?`,
                code: `System.out.println(10 - 3);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'This second strike checks subtraction.',
                hints: [
                    'Subtract 3 from 10.',
                    'System.out.println prints the result of the expression.',
                    'The answer is a whole number.'
                ],
                answers: ['7'],
                damage: 10,
                autoShowHint: true,
                explanation: '10 - 3 evaluates to 7, so the output is 7.',
                concept: 'arithmetic_subtraction',
                conceptTitle: 'Subtraction',
                codexTitle: 'Goblin - Fire Slash'
            },
            {
                id: 'ch1_goblin_story_3',
                title: 'Heavy Blow',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The goblin braces for a heavier hit.</em> Which operator multiplies numbers in Java?`,
                answerTip: 'Type only the operator.',
                inputPlaceholder: 'Type the operator',
                matchMode: 'exact',
                narrative: 'The third arithmetic lesson checks multiplication.',
                hints: [
                    'It is the same symbol used in many programming languages.',
                    'It is not the letter x.',
                    'Java uses one character for multiplication.'
                ],
                answers: ['*'],
                damage: 10,
                autoShowHint: true,
                explanation: 'The * operator is used for multiplication in Java.',
                concept: 'arithmetic_multiplication',
                conceptTitle: 'Multiplication Operator',
                codexTitle: 'Goblin - Heavy Blow'
            },
            {
                id: 'ch1_goblin_story_4',
                title: 'Loot Remainder',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The goblin drops a broken division charm.</em> What is the output of this code?`,
                code: `System.out.println(10 % 4);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'The last arithmetic question checks the remainder operator.',
                hints: [
                    'The % operator gives the remainder after division.',
                    '10 divided by 4 leaves something left over.',
                    'That leftover value is the answer.'
                ],
                answers: ['2'],
                damage: 10,
                autoShowHint: true,
                explanation: '10 % 4 leaves a remainder of 2, so the output is 2.',
                concept: 'arithmetic_remainder',
                conceptTitle: 'Remainder Operator',
                codexTitle: 'Goblin - Loot Remainder'
            }
        ];

        const recoveryChallenges = [
            {
                id: 'ch1_goblin_recovery_1',
                title: 'Quick Count',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The goblin stumbles, giving you a simpler opening.</em> What is the output of this code?`,
                code: `System.out.println(2 + 3);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the number',
                matchMode: 'exact',
                narrative: 'The goblin is still teaching arithmetic, but this follow-up eases the pace.',
                hints: [
                    'Add the two numbers.',
                    '2 plus 3 equals a small whole number.',
                    'System.out.println prints that result.',
                    'The answer is 5.'
                ],
                answers: ['5'],
                damage: 8,
                autoShowHint: true,
                explanation: '2 + 3 equals 5, so the output is 5.'
            },
            {
                id: 'ch1_goblin_recovery_2',
                title: 'Minus Sign',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The goblin swings wide and leaves a basic symbol in the dirt.</em> Which operator subtracts numbers in Java?`,
                answerTip: 'Type only the operator.',
                inputPlaceholder: 'Type the operator',
                matchMode: 'exact',
                narrative: 'This recovery question stays inside the arithmetic topic with a simpler symbol check.',
                hints: [
                    'Think of basic subtraction in math.',
                    'Java uses the same symbol.',
                    'It is a single horizontal mark.',
                    'The answer is the minus sign.'
                ],
                answers: ['-'],
                damage: 8,
                autoShowHint: true,
                explanation: 'The - operator is used for subtraction in Java.'
            }
        ];

        return this.buildAdaptiveEncounterQuestions(mainChallenges, recoveryChallenges, topic);
    },

    getAbandonedVillageChallenges() {
        const area = 'Abandoned Village';
        const npc = 'Village Goblin';
        const topic = 'variables';

        const mainChallenges = [
            {
                id: 'ch1_abandoned_story_1',
                title: 'Gold Storage',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The village records flutter in the dust.</em> Which code declares an integer variable <code>gold</code> with value <code>100</code>?`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'int gold = 100;',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'This fight now covers variables exactly as listed in the new Q&A file.',
                hints: [
                    'Use int for a whole number.',
                    'The variable name must be gold.',
                    'The value is 100.'
                ],
                answers: ['int gold = 100;'],
                damage: 10,
                autoShowHint: true,
                explanation: 'int gold = 100; correctly declares an integer variable named gold.',
                concept: 'variables_int',
                conceptTitle: 'Integer Variables',
                codexTitle: 'Abandoned Village - Gold Storage'
            },
            {
                id: 'ch1_abandoned_story_2',
                title: 'Hero Name Storage',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>A broken village banner still shows a name.</em> Which code stores <code>"Rowan"</code> in a variable called <code>hero</code>?`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'String hero = "Rowan";',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'Now the battle moves from whole numbers to text variables.',
                hints: [
                    'Use String with a capital S.',
                    'Text values need double quotes.',
                    'The variable name must be hero.'
                ],
                answers: ['String hero = "Rowan";'],
                damage: 10,
                autoShowHint: true,
                explanation: 'String hero = "Rowan"; stores text in a variable named hero.',
                concept: 'variables_string',
                conceptTitle: 'String Variables',
                codexTitle: 'Abandoned Village - Hero Name Storage'
            },
            {
                id: 'ch1_abandoned_story_3',
                title: 'Battle Flag',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The path ahead flickers between safe and unsafe.</em> Which code sets a <code>boolean</code> variable <code>ready</code> to <code>true</code>?`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'boolean ready = true;',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The third variable lesson introduces true-or-false state.',
                hints: [
                    'Use boolean for true-or-false values.',
                    'true is lowercase in Java.',
                    'The variable name must be ready.'
                ],
                answers: ['boolean ready = true;'],
                damage: 10,
                autoShowHint: true,
                explanation: 'boolean ready = true; stores a true value in a boolean variable.',
                concept: 'variables_boolean',
                conceptTitle: 'Boolean Variables',
                codexTitle: 'Abandoned Village - Battle Flag'
            },
            {
                id: 'ch1_abandoned_story_4',
                title: 'Torch Message Output',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>A torch by the road suddenly flares to life.</em> What is printed by this code?`,
                code: `System.out.println("Torch Lit");`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'This checks whether you can read simple printed output.',
                hints: [
                    'The text is already inside double quotes.',
                    'System.out.println prints the exact text.',
                    'Type only what appears in the output.'
                ],
                answers: ['Torch Lit'],
                damage: 10,
                autoShowHint: true,
                explanation: 'System.out.println("Torch Lit"); prints Torch Lit.',
                concept: 'variables_print_output',
                conceptTitle: 'Reading Printed Output',
                codexTitle: 'Abandoned Village - Torch Message Output'
            },
            {
                id: 'ch1_abandoned_story_5',
                title: 'Print Gold Output',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The last village note shows a stored reward.</em> What is printed by this code?<br><code>int gold = 50;<br>System.out.println(gold);</code>`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'The variables section ends by printing a stored integer value.',
                hints: [
                    'gold stores the whole number 50.',
                    'System.out.println prints the variable value.',
                    'The output is just the number.'
                ],
                answers: ['50'],
                damage: 11,
                autoShowHint: true,
                explanation: 'The variable gold contains 50, so printing gold outputs 50.',
                concept: 'variables_print_value',
                conceptTitle: 'Printing Variable Values',
                codexTitle: 'Abandoned Village - Print Gold Output'
            }
        ];

        const recoveryChallenges = [
            {
                id: 'ch1_abandoned_recovery_1',
                title: 'Lives Variable',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>A quiet note survives under the rubble.</em> Declare an <code>int</code> variable named <code>lives</code> with the value <code>3</code>.`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'int lives = 3;',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'This easier recovery keeps the lesson on variable declarations with a shorter line.',
                hints: [
                    'Use int for a whole number.',
                    'The variable name is lives.',
                    'Set it equal to 3.',
                    'End the statement with a semicolon.'
                ],
                answers: ['int lives = 3;', 'int lives=3;'],
                damage: 8,
                autoShowHint: true,
                explanation: 'int lives = 3; is a correct integer variable declaration.'
            },
            {
                id: 'ch1_abandoned_recovery_2',
                title: 'Text Type',
                type: 'multiple_choice',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>The wind flips to a simpler note.</em> Which Java data type is used to store text like <code>"Rowan"</code>?`,
                narrative: 'The recovery question stays on beginner variables and adds more guidance.',
                hints: [
                    'Text uses double quotes.',
                    'The correct type starts with a capital S.',
                    'It is not int or boolean.',
                    'Choose the type used for words.'
                ],
                choices: ['int', 'String', 'boolean', 'char'],
                correctOption: 1,
                answers: ['String'],
                damage: 8,
                autoShowHint: true,
                explanation: 'String is the Java data type used to store text.'
            }
        ];

        return this.buildAdaptiveEncounterQuestions(mainChallenges, recoveryChallenges, topic);
    },

    getEvilShroomChallenges() {
        const area = 'Crystal Cave';
        const npc = 'Evil Java Shroom';
        const topic = 'data_types';

        const mainChallenges = [
            {
                id: 'ch1_shroom_story_1',
                type: 'multiple_choice',
                title: 'Mana Potion',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>The shroom glows with a wavering potion aura.</em> Which data type stores decimal values?`,
                narrative: 'The cave entrance now teaches data types before control flow.',
                hints: [
                    'A decimal number can store a fractional part.',
                    'int stores whole numbers only.',
                    'Java commonly uses double for decimal values.'
                ],
                choices: ['int', 'double', 'char', 'boolean'],
                correctOption: 1,
                answers: ['double'],
                damage: 14,
                autoShowHint: true,
                explanation: 'double is the Java data type used to store decimal values.',
                concept: 'data_types_double',
                conceptTitle: 'Decimal Data Types',
                codexTitle: 'Shroom - Mana Potion'
            },
            {
                id: 'ch1_shroom_story_2',
                type: 'multiple_choice',
                title: 'Crystal Energy',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>The shroom feeds on unstable crystal charge.</em> Which is the correct declaration for <code>15.5</code>?`,
                narrative: 'The next cave question applies the decimal type in a full declaration.',
                hints: [
                    '15.5 is not a whole number.',
                    'Use double, not int.',
                    'The variable name must be energy.'
                ],
                choices: [
                    'int energy = 15.5;',
                    'double energy = 15.5;',
                    'char energy = 15.5;',
                    'boolean energy = 15.5;'
                ],
                correctOption: 1,
                answers: ['double energy = 15.5;'],
                damage: 14,
                autoShowHint: true,
                explanation: 'double energy = 15.5; is the correct declaration for a decimal value.',
                concept: 'data_types_decimal_declaration',
                conceptTitle: 'Declaring Decimal Variables',
                codexTitle: 'Shroom - Crystal Energy'
            },
            {
                id: 'ch1_shroom_story_3',
                title: 'True Path',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>A green spore marks the safe route.</em> Which data type stores <code>true</code> or <code>false</code>?`,
                answerTip: 'Type only the data type.',
                inputPlaceholder: 'Type the data type',
                matchMode: 'exact',
                narrative: 'Now the question checks the true-or-false data type directly.',
                hints: [
                    'This type is commonly used in conditions and flags.',
                    'It is written in lowercase in Java.',
                    'It is not int or char.'
                ],
                answers: ['boolean'],
                damage: 14,
                autoShowHint: true,
                explanation: 'boolean is the Java data type used for true and false values.',
                concept: 'data_types_boolean',
                conceptTitle: 'Boolean Type',
                codexTitle: 'Shroom - True Path'
            },
            {
                id: 'ch1_shroom_story_4',
                title: 'Character Rune',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The shroom spins a single glowing letter through the air.</em> Which data type stores a single character?`,
                answerTip: 'Type only the data type.',
                inputPlaceholder: 'Type the data type',
                matchMode: 'exact',
                narrative: 'This is the single-character data type check.',
                hints: [
                    'A single character is not a full String.',
                    'Java uses single quotes for char values.',
                    'The correct type has four letters.'
                ],
                answers: ['char'],
                damage: 14,
                autoShowHint: true,
                explanation: 'char stores a single character value in Java.',
                concept: 'data_types_char',
                conceptTitle: 'Character Type',
                codexTitle: 'Shroom - Character Rune'
            },
            {
                id: 'ch1_shroom_story_5',
                type: 'multiple_choice',
                title: 'Dungeon Letter',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>The last spores settle into a single rank symbol.</em> What is the output of this code?<br><code>char rank = 'A';<br>System.out.println(rank);</code>`,
                narrative: 'The data types section ends with a basic char output check.',
                hints: [
                    'rank stores one character.',
                    'System.out.println prints the value, not the type name.',
                    'The output is the letter itself.'
                ],
                choices: ['"A"', 'A', 'char', 'rank'],
                correctOption: 1,
                answers: ['A'],
                damage: 16,
                autoShowHint: true,
                explanation: 'Printing a char variable outputs the character it stores, so the result is A.',
                concept: 'data_types_char_output',
                conceptTitle: 'Printing char Values',
                codexTitle: 'Shroom - Dungeon Letter'
            }
        ];

        const recoveryChallenges = [
            {
                id: 'ch1_shroom_recovery_1',
                type: 'multiple_choice',
                title: 'Whole Number Type',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>The spores thin for a moment.</em> Which Java data type stores whole numbers?`,
                narrative: 'The shroom eases up with a simpler data-type check before the lesson continues.',
                hints: [
                    'Whole numbers do not have decimal points.',
                    'It is one of the most common beginner types.',
                    'It has three letters.',
                    'Choose the type used for 1, 2, and 3.'
                ],
                choices: ['double', 'String', 'int', 'boolean'],
                correctOption: 2,
                answers: ['int'],
                damage: 10,
                autoShowHint: true,
                explanation: 'int is the Java data type used for whole numbers.'
            },
            {
                id: 'ch1_shroom_recovery_2',
                title: 'Quoted Text',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>A calm crystal reflects the word <code>"Java"</code>.</em> Which data type stores text written in double quotes?`,
                answerTip: 'Type only the data type.',
                inputPlaceholder: 'Type the data type',
                matchMode: 'exact',
                narrative: 'This recovery question stays in the data-types lesson with a more direct text example.',
                hints: [
                    'It stores words, not one single character.',
                    'Its name starts with a capital S.',
                    'It is longer than char.',
                    'The answer is String.'
                ],
                answers: ['String'],
                damage: 10,
                autoShowHint: true,
                explanation: 'String is used to store text in Java.'
            }
        ];

        return this.buildAdaptiveEncounterQuestions(mainChallenges, recoveryChallenges, topic);
    },

    getFireWormChallenges() {
        const area = 'Crystal Cave - Lava Tunnel';
        const npc = 'Fire Worm';
        const topic = 'number_systems';

        const mainChallenges = [
            {
                id: 'ch1_fire_story_1',
                title: 'Binary Gate',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Fire Worm opens a gate of flickering digits.</em> What number system uses only <code>0</code> and <code>1</code>?`,
                answerTip: 'Type the name of the number system.',
                inputPlaceholder: 'Type the answer',
                matchMode: 'exact',
                narrative: 'The cave boss now follows the number-systems section from the new file.',
                hints: [
                    'It uses only two digits.',
                    'Computers use this system at the lowest level.',
                    'Its name starts with B.'
                ],
                answers: ['Binary', 'binary'],
                damage: 24,
                explanation: 'Binary is the number system that uses only 0 and 1.',
                concept: 'number_systems_binary',
                conceptTitle: 'Binary Numbers',
                codexTitle: 'Fire Worm - Binary Gate'
            },
            {
                id: 'ch1_fire_story_2',
                title: 'Decimal Kingdom',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The tunnel wall glows with ten carved marks.</em> What is the base of the decimal system?`,
                answerTip: 'Type only the number.',
                inputPlaceholder: 'Type the number',
                matchMode: 'exact',
                narrative: 'The second number-systems question checks decimal base knowledge.',
                hints: [
                    'Decimal is the normal counting system most people use daily.',
                    'Its base matches the number of digits from 0 through 9.',
                    'Type only the base value.'
                ],
                answers: ['10'],
                damage: 28,
                explanation: 'The decimal system uses base 10.',
                concept: 'number_systems_decimal',
                conceptTitle: 'Decimal Base',
                codexTitle: 'Fire Worm - Decimal Kingdom'
            },
            {
                id: 'ch1_fire_story_3',
                title: 'Hex Crystal',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Fire Worm spits out a glowing hexadecimal sigil.</em> What hexadecimal letter represents <code>10</code>?`,
                answerTip: 'Type only the letter.',
                inputPlaceholder: 'Type the letter',
                matchMode: 'exact',
                narrative: 'The third number-systems question checks hexadecimal basics.',
                hints: [
                    'Hexadecimal continues after 9 with letters.',
                    'The first letter used is the answer.',
                    'Type the capital letter.'
                ],
                answers: ['A', 'a'],
                damage: 30,
                explanation: 'In hexadecimal, the value 10 is represented by A.',
                concept: 'number_systems_hex',
                conceptTitle: 'Hexadecimal Basics',
                codexTitle: 'Fire Worm - Hex Crystal'
            },
            {
                id: 'ch1_fire_story_4',
                title: 'Binary Scroll',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The worm carves a value into the cave wall.</em> What is the binary equivalent of decimal <code>5</code>?`,
                answerTip: 'Type only the binary number.',
                inputPlaceholder: 'Type the binary number',
                matchMode: 'exact',
                narrative: 'Now the boss checks whether you can convert a small decimal value to binary.',
                hints: [
                    'Binary uses only 0 and 1.',
                    'Decimal 5 is 4 + 1.',
                    'Mark those places in binary.'
                ],
                answers: ['101'],
                damage: 32,
                explanation: 'The binary representation of decimal 5 is 101.',
                concept: 'number_systems_binary_conversion',
                conceptTitle: 'Binary Conversion',
                codexTitle: 'Fire Worm - Binary Scroll'
            },
            {
                id: 'ch1_fire_story_5',
                title: 'Binary Rule',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The last flames collapse into two repeating marks.</em> How many digits are used in binary?`,
                answerTip: 'Type only the number.',
                inputPlaceholder: 'Type the number',
                matchMode: 'exact',
                narrative: 'The number-systems section ends by reinforcing the binary digit set.',
                hints: [
                    'Binary uses only 0 and 1.',
                    'Count how many distinct digits that is.',
                    'Type the number only.'
                ],
                answers: ['2'],
                damage: 34,
                explanation: 'Binary uses exactly two digits: 0 and 1.',
                concept: 'number_systems_binary_digits',
                conceptTitle: 'Binary Digits',
                codexTitle: 'Fire Worm - Binary Rule'
            }
        ];

        const recoveryChallenges = [
            {
                id: 'ch1_fire_recovery_1',
                title: 'Base Two',
                questionType: 'True or False',
                area,
                npc,
                question: `<em>The tunnel cools just enough for a clearer sign.</em> True or false: binary is a base-2 number system.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'The Fire Worm gives a simpler recovery question from the same number-systems topic.',
                hints: [
                    'Binary uses 0 and 1.',
                    'A system with two symbols has base 2.',
                    'The statement is correct.',
                    'Type true.'
                ],
                answers: ['true'],
                damage: 12,
                autoShowHint: true,
                explanation: 'Binary is the base-2 number system.'
            },
            {
                id: 'ch1_fire_recovery_2',
                title: 'Everyday System',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>A safer flame draws a familiar counting line.</em> What number system do people commonly use every day: binary or decimal?`,
                answerTip: 'Type the system name.',
                inputPlaceholder: 'Type the answer',
                matchMode: 'exact',
                narrative: 'This guided recovery question keeps the lesson on number systems but lowers the difficulty.',
                hints: [
                    'Think of normal counting from 0 to 9.',
                    'It uses base 10.',
                    'It is not binary.',
                    'The answer is decimal.'
                ],
                answers: ['decimal', 'Decimal'],
                damage: 12,
                autoShowHint: true,
                explanation: 'People normally use the decimal number system in everyday counting.'
            }
        ];

        return this.buildAdaptiveEncounterQuestions(mainChallenges, recoveryChallenges, topic);
    },

    getArenaSlimebugChallenges() {
        const area = 'Arena of Heroes';
        const npc = 'Slimebug';
        const topic = 'switch';

        const mainChallenges = [
            {
                id: 'ch1_arena_slime_story_1',
                title: 'Case Rune',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Slimebug splits the arena into multiple paths.</em> In a Java <code>switch</code> statement, which keyword defines an option?`,
                answerTip: 'Type only the keyword.',
                inputPlaceholder: 'Type the keyword',
                matchMode: 'exact',
                narrative: 'The first arena enemy now teaches switch statements.',
                hints: [
                    'Each possible branch starts with this label.',
                    'It appears before the value and colon.',
                    'It has four letters.'
                ],
                answers: ['case'],
                damage: 24,
                explanation: 'case is the keyword that defines an option in a switch statement.',
                concept: 'switch_case',
                conceptTitle: 'switch case Labels',
                codexTitle: 'Slimebug - Case Rune'
            },
            {
                id: 'ch1_arena_slime_story_2',
                title: 'Break Seal',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The slime threatens to keep sliding into the next branch.</em> Which keyword stops execution in a <code>switch</code> statement?`,
                answerTip: 'Type only the keyword.',
                inputPlaceholder: 'Type the keyword',
                matchMode: 'exact',
                narrative: 'The second switch lesson prevents fallthrough.',
                hints: [
                    'This keyword ends the current case.',
                    'Without it, execution can continue into the next case.',
                    'It has five letters.'
                ],
                answers: ['break'],
                damage: 24,
                explanation: 'break stops execution so the switch does not continue into later cases.',
                concept: 'switch_break',
                conceptTitle: 'break In switch',
                codexTitle: 'Slimebug - Break Seal'
            },
            {
                id: 'ch1_arena_slime_story_3',
                title: 'Dungeon Door',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The arena floor reshapes into numbered doors.</em> What is the output of this code?`,
                code: `int door = 2;
switch(door){
    case 2:
        System.out.println("South");
}`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'Now you read a basic switch result directly.',
                hints: [
                    'door stores the value 2.',
                    'The matching case is case 2.',
                    'That case prints the direction.'
                ],
                answers: ['South'],
                damage: 24,
                explanation: 'Since door is 2, the switch selects case 2 and prints South.',
                concept: 'switch_output',
                conceptTitle: 'Reading switch Output',
                codexTitle: 'Slimebug - Dungeon Door'
            },
            {
                id: 'ch1_arena_slime_story_4',
                title: 'Default Path',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The slime leaves one last route with no clear match.</em> Which block runs in a <code>switch</code> when no case matches?`,
                answerTip: 'Type only the keyword.',
                inputPlaceholder: 'Type the keyword',
                matchMode: 'exact',
                narrative: 'The switch section ends with its fallback path.',
                hints: [
                    'This block is the fallback branch.',
                    'It runs if none of the case labels match.',
                    'It has seven letters.'
                ],
                answers: ['default'],
                damage: 24,
                explanation: 'default is the block that runs when no case in a switch matches.',
                concept: 'switch_default',
                conceptTitle: 'default In switch',
                codexTitle: 'Slimebug - Default Path'
            }
        ];

        const recoveryChallenges = [
            {
                id: 'ch1_arena_slime_recovery_1',
                title: 'Fallback Branch',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The slime pauses and points to the backup route.</em> Which switch keyword is the fallback when no case matches?`,
                answerTip: 'Type only the keyword.',
                inputPlaceholder: 'Type the keyword',
                matchMode: 'exact',
                narrative: 'The recovery question stays in switch statements with a simpler fallback idea.',
                hints: [
                    'It is the backup branch.',
                    'It runs when none of the cases match.',
                    'It has seven letters.',
                    'The answer is default.'
                ],
                answers: ['default'],
                damage: 12,
                autoShowHint: true,
                explanation: 'default is the fallback branch in a switch statement.'
            },
            {
                id: 'ch1_arena_slime_recovery_2',
                title: 'Stop The Slide',
                questionType: 'True or False',
                area,
                npc,
                question: `<em>A cleaner switch symbol appears.</em> True or false: <code>break</code> is used to stop a switch case from continuing into the next one.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'This easier follow-up keeps the player in the same switch lesson.',
                hints: [
                    'Without it, execution can keep falling through.',
                    'The statement describes the usual role of break.',
                    'The statement is correct.',
                    'Type true.'
                ],
                answers: ['true'],
                damage: 12,
                autoShowHint: true,
                explanation: 'break is used to stop a switch case and prevent fallthrough.'
            }
        ];

        return this.buildAdaptiveEncounterQuestions(mainChallenges, recoveryChallenges, topic);
    },

    getArenaBirdChallenges() {
        const area = 'Arena of Heroes';
        const npc = 'Bird';
        const topic = 'loops';

        const mainChallenges = [
            {
                id: 'ch1_arena_bird_story_1',
                title: 'Training Loop',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Bird circles in a steady pattern.</em> Which loop is best when repetitions are known?`,
                answerTip: 'Type a short answer.',
                inputPlaceholder: 'Type the loop name',
                matchMode: 'exact',
                narrative: 'The second arena enemy now teaches loops.',
                hints: [
                    'This loop usually has initialization, condition, and update parts.',
                    'It is common when you already know the count.',
                    'Include the word loop in your answer.'
                ],
                answers: ['for loop', 'for'],
                damage: 24,
                explanation: 'A for loop is commonly used when the number of repetitions is known.',
                concept: 'loops_for',
                conceptTitle: 'for Loops',
                codexTitle: 'Bird - Training Loop'
            },
            {
                id: 'ch1_arena_bird_story_2',
                title: 'Endless Tunnel',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Bird hovers as if it could keep going forever.</em> Which loop repeats while a condition is true?`,
                answerTip: 'Type a short answer.',
                inputPlaceholder: 'Type the loop name',
                matchMode: 'exact',
                narrative: 'This question checks the condition-based loop.',
                hints: [
                    'This loop checks a condition before each repetition.',
                    'It continues as long as the condition stays true.',
                    'Include the word loop in your answer.'
                ],
                answers: ['while loop', 'while'],
                damage: 24,
                explanation: 'A while loop repeats as long as its condition remains true.',
                concept: 'loops_while',
                conceptTitle: 'while Loops',
                codexTitle: 'Bird - Endless Tunnel'
            },
            {
                id: 'ch1_arena_bird_story_3',
                title: 'First March',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The Bird traces three steps in the arena air.</em> What is the output of this code?`,
                code: `for(int i=1;i<=3;i++) {
    System.out.println(i);
}`,
                answerTip: 'Type the output in order.',
                inputPlaceholder: '1 2 3',
                matchMode: 'exact',
                narrative: 'This is the loop output-reading check.',
                hints: [
                    'The loop starts at 1.',
                    'It continues while i is less than or equal to 3.',
                    'It prints one value per iteration.'
                ],
                answers: ['1 2 3', '1\n2\n3', '1,2,3'],
                damage: 24,
                explanation: 'The loop prints 1, then 2, then 3.',
                concept: 'loops_output',
                conceptTitle: 'Reading Loop Output',
                codexTitle: 'Bird - First March'
            },
            {
                id: 'ch1_arena_bird_story_4',
                title: 'Guaranteed Step',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Bird lands once before leaping again.</em> Which loop runs at least once?`,
                answerTip: 'Type a short answer.',
                inputPlaceholder: 'Type the loop name',
                matchMode: 'exact',
                narrative: 'This checks the loop type that always executes its body at least one time.',
                hints: [
                    'This loop checks its condition after the body runs.',
                    'It combines do and while.',
                    'Either spaced or hyphenated answers are accepted.'
                ],
                answers: ['do while', 'do-while', 'do while loop', 'do-while loop'],
                damage: 24,
                explanation: 'A do-while loop runs the body first, so it executes at least once.',
                concept: 'loops_do_while',
                conceptTitle: 'do-while Loops',
                codexTitle: 'Bird - Guaranteed Step'
            },
            {
                id: 'ch1_arena_bird_story_5',
                title: 'Array Walker',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Bird glides over a line of stored values.</em> Which loop is commonly used with arrays?`,
                answerTip: 'Type a short answer.',
                inputPlaceholder: 'Type the loop name',
                matchMode: 'exact',
                narrative: 'The loops section ends with the array-friendly loop type.',
                hints: [
                    'This loop visits each element directly.',
                    'It is often written as for-each.',
                    'Answers with or without a hyphen are accepted.'
                ],
                answers: ['for each loop', 'for-each loop', 'foreach', 'for each'],
                damage: 26,
                explanation: 'A for-each loop is commonly used to iterate through array elements.',
                concept: 'loops_for_each',
                conceptTitle: 'for-each Loops',
                codexTitle: 'Bird - Array Walker'
            }
        ];

        const recoveryChallenges = [
            {
                id: 'ch1_arena_bird_recovery_1',
                title: 'Known Count',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Bird circles slower and marks a fixed number of laps.</em> Which loop is commonly used when you already know how many times to repeat?`,
                answerTip: 'Type the loop name.',
                inputPlaceholder: 'Type the loop name',
                matchMode: 'exact',
                narrative: 'The loops lesson stays in order, but this follow-up becomes more guided.',
                hints: [
                    'It often has initialization, condition, and update in one line.',
                    'It is the most common counting loop.',
                    'Answers with or without the word loop are accepted.',
                    'The answer is for.'
                ],
                answers: ['for', 'for loop'],
                damage: 12,
                autoShowHint: true,
                explanation: 'A for loop is commonly used when the number of repetitions is known.'
            },
            {
                id: 'ch1_arena_bird_recovery_2',
                title: 'At Least Once',
                questionType: 'True or False',
                area,
                npc,
                question: `<em>The Bird lands once before taking off again.</em> True or false: a <code>do-while</code> loop runs its body at least one time.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'This recovery question keeps the player on the loop topic with a simpler yes-or-no check.',
                hints: [
                    'This loop checks the condition after the body runs.',
                    'That means the body happens first.',
                    'So the statement is correct.',
                    'Type true.'
                ],
                answers: ['true'],
                damage: 12,
                autoShowHint: true,
                explanation: 'A do-while loop runs the body first, so it always executes at least once.'
            }
        ];

        return this.buildAdaptiveEncounterQuestions(mainChallenges, recoveryChallenges, topic);
    },

    getArenaBigBossChallenges() {
        const area = 'Arena of Heroes';
        const npc = 'Arena Sovereign';
        const topic = 'arrays';

        const mainChallenges = [
            {
                id: 'ch1_arena_boss_story_1',
                title: 'Crystal Storage',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The Arena Sovereign drags glowing shards into formation.</em> Declare an integer array named <code>crystals</code> containing <code>2</code>, <code>4</code>, and <code>6</code>.`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'int[] crystals = {2, 4, 6};',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The final arena battle now handles arrays and indexed thinking.',
                hints: [
                    'Use int[] for an array of integers.',
                    'Use curly braces for the values.',
                    'The variable name must be crystals.'
                ],
                answers: ['int[] crystals = {2, 4, 6};', 'int[] crystals = {2,4,6};'],
                damage: 26,
                explanation: 'An int array uses int[] and is initialized with values inside curly braces.',
                concept: 'arrays_declaration',
                conceptTitle: 'Array Declaration',
                codexTitle: 'Arena Sovereign - Crystal Storage'
            },
            {
                id: 'ch1_arena_boss_story_2',
                title: 'Middle Crystal Check',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The sovereign points to the center shard in the pattern.</em> If <code>crystals = {2, 4, 6}</code>, what value is stored in <code>crystals[1]</code>?`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the value',
                matchMode: 'exact',
                narrative: 'The second array question checks indexed access.',
                hints: [
                    'Array indexes start at 0.',
                    'crystals[0] is 2.',
                    'crystals[1] is the second value.'
                ],
                answers: ['4'],
                damage: 26,
                explanation: 'The value at index 1 is the second array element, which is 4.',
                concept: 'arrays_access',
                conceptTitle: 'Accessing Array Elements',
                codexTitle: 'Arena Sovereign - Middle Crystal Check'
            },
            {
                id: 'ch1_arena_boss_story_3',
                title: 'First Position Rule',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The sovereign marks the edge of the array with a blade.</em> In Java arrays, what index represents the first element?`,
                answerTip: 'Type only the number.',
                inputPlaceholder: 'Type the number',
                matchMode: 'exact',
                narrative: 'This reinforces zero-based indexing.',
                hints: [
                    'Java arrays do not start at 1.',
                    'The first valid index comes before index 1.',
                    'Type the smallest valid index.'
                ],
                answers: ['0'],
                damage: 28,
                explanation: 'Java arrays start at index 0.',
                concept: 'arrays_indexing',
                conceptTitle: 'Array Indexing',
                codexTitle: 'Arena Sovereign - First Position Rule'
            },
            {
                id: 'ch1_arena_boss_story_4',
                title: 'Grid Structure',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The arena floor widens into rows and columns.</em> What structure stores data in rows and columns?`,
                answerTip: 'Type a short answer.',
                inputPlaceholder: 'Type the answer',
                matchMode: 'exact',
                narrative: 'Now the battle widens from 1D arrays into 2D thinking.',
                hints: [
                    'A 2D array is one Java representation of it.',
                    'The common mathematics term is accepted.',
                    'The answer is often used with tables or grids.'
                ],
                answers: ['Matrix', 'matrix'],
                damage: 26,
                explanation: 'A matrix stores values in rows and columns.',
                concept: 'arrays_2d',
                conceptTitle: '2D Arrays',
                codexTitle: 'Arena Sovereign - Grid Structure'
            },
            {
                id: 'ch1_arena_boss_story_5',
                title: 'Nested Loop',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The final phase stacks one motion inside another.</em> What is a loop inside another loop called?`,
                answerTip: 'Type the term.',
                inputPlaceholder: 'Type the term',
                matchMode: 'exact',
                narrative: 'The array section ends with the loop pattern often used for 2D arrays.',
                hints: [
                    'This pattern is common in 2D array traversal.',
                    'One loop runs inside another loop.',
                    'Two-word answers are accepted.'
                ],
                answers: ['Nested loop', 'nested loop', 'Nested', 'nested'],
                damage: 32,
                explanation: 'A loop placed inside another loop is called a nested loop.',
                concept: 'arrays_nested_loops',
                conceptTitle: 'Nested Loops',
                codexTitle: 'Arena Sovereign - Nested Loop'
            }
        ];

        const recoveryChallenges = [
            {
                id: 'ch1_arena_boss_recovery_1',
                title: 'First Slot',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The sovereign redraws the array from the beginning.</em> What is the first index of a Java array?`,
                answerTip: 'Type only the number.',
                inputPlaceholder: 'Type the number',
                matchMode: 'exact',
                narrative: 'The array lesson stays in place, but the next question becomes more basic.',
                hints: [
                    'Java arrays start counting before 1.',
                    'It is the smallest valid index.',
                    'It is one digit.',
                    'The answer is 0.'
                ],
                answers: ['0'],
                damage: 14,
                autoShowHint: true,
                explanation: 'Java arrays start at index 0.'
            },
            {
                id: 'ch1_arena_boss_recovery_2',
                title: 'Array Truth',
                questionType: 'True or False',
                area,
                npc,
                question: `<em>A cleaner array pattern appears.</em> True or false: <code>int[] values = {1, 2};</code> is a valid Java array declaration.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'This easier recovery still teaches arrays, but with a direct declaration check.',
                hints: [
                    'The code uses int[] and curly braces.',
                    'That is the standard style for initializing an int array.',
                    'The statement is correct.',
                    'Type true.'
                ],
                answers: ['true'],
                damage: 14,
                autoShowHint: true,
                explanation: 'int[] values = {1, 2}; is a valid Java array declaration and initialization.'
            }
        ];

        return this.buildAdaptiveEncounterQuestions(mainChallenges, recoveryChallenges, topic);
    },

    getForestChallenges() {
        const area = 'Corrupted Forest Core';
        const npc = 'Data Glitch';
        const topic = 'methods_packages_modifiers';

        const mainChallenges = [
            {
                id: 'ch1_glitch_story_1',
                title: 'Forge The Skill',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The Data Glitch fractures your action into reusable pieces.</em> Create a method named <code>attack</code>.`,
                answerTip: 'Type the full method line.',
                inputPlaceholder: 'static void attack(){ }',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The forest core now handles methods, then packages and modifiers.',
                hints: [
                    'The method does not need to return a value.',
                    'Use static void in the method header.',
                    'A compact answer is accepted.'
                ],
                answers: ['static void attack(){ }', 'static void attack(){}'],
                damage: 20,
                explanation: 'static void attack(){ } is a valid Java method declaration.',
                concept: 'methods_declaration',
                conceptTitle: 'Method Declaration',
                codexTitle: 'Data Glitch - Forge The Skill'
            },
            {
                id: 'ch1_glitch_story_2',
                title: 'Call The Spell',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The Glitch tears open a method circle in the air.</em> Write the line that calls the method <code>heal()</code>.`,
                answerTip: 'Type the exact Java line.',
                inputPlaceholder: 'heal();',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'After declaring a method, the next step is calling it correctly.',
                hints: [
                    'Use the method name followed by parentheses.',
                    'This method takes no arguments.',
                    'End the statement with a semicolon.'
                ],
                answers: ['heal();'],
                damage: 20,
                explanation: 'heal(); is the correct method call for a method with no parameters.',
                concept: 'methods_calling',
                conceptTitle: 'Method Calling',
                codexTitle: 'Data Glitch - Call The Spell'
            },
            {
                id: 'ch1_glitch_story_3',
                title: 'Return The Damage',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Glitch demands a value be sent back correctly.</em> What Java keyword is used to return a value from a method?`,
                answerTip: 'Type only the keyword.',
                inputPlaceholder: 'Type the keyword',
                matchMode: 'exact',
                narrative: 'This checks the core keyword used by value-returning methods.',
                hints: [
                    'This keyword sends a value back to the caller.',
                    'It appears inside the method body.',
                    'The keyword itself is enough here.'
                ],
                answers: ['return', 'return;'],
                damage: 20,
                explanation: 'The return keyword sends a value back from a method.',
                concept: 'methods_return',
                conceptTitle: 'The return Keyword',
                codexTitle: 'Data Glitch - Return The Damage'
            },
            {
                id: 'ch1_glitch_story_4',
                title: 'Method Output',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The Glitch copies one method into four mirrors.</em> What is the output of this code?`,
                code: `static int add(int a, int b){ return a + b; }
System.out.println(add(2,3));`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'Now you apply a method and predict the returned value.',
                hints: [
                    'The method returns a + b.',
                    'The call passes 2 and 3.',
                    'That result is then printed.'
                ],
                answers: ['5'],
                damage: 20,
                explanation: 'add(2,3) returns 5, so the printed output is 5.',
                concept: 'methods_output',
                conceptTitle: 'Method Output',
                codexTitle: 'Data Glitch - Method Output'
            },
            {
                id: 'ch1_glitch_story_5',
                title: 'Empty Return',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Glitch tries to hollow out the method shell.</em> What return type means a method does <strong>not</strong> return a value?`,
                answerTip: 'Type only the return type.',
                inputPlaceholder: 'Type the return type',
                matchMode: 'exact',
                narrative: 'This completes the methods section.',
                hints: [
                    'This return type is used for methods that only perform an action.',
                    'It is not int, String, or boolean.',
                    'Java uses one short keyword for it.'
                ],
                answers: ['void'],
                damage: 24,
                explanation: 'void means a method performs an action but does not return a value.',
                concept: 'methods_void',
                conceptTitle: 'void Return Type',
                codexTitle: 'Data Glitch - Empty Return'
            },
            {
                id: 'ch1_glitch_story_6',
                title: 'Package Seal',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The Glitch smears the top of your class file.</em> Write the Java statement that declares a package named <code>gameworld</code>.`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'package gameworld;',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'Now the fight moves from methods into packages and modifiers.',
                hints: [
                    'Package declarations start with the package keyword.',
                    'The package name must be gameworld.',
                    'End the line with a semicolon.'
                ],
                answers: ['package gameworld;'],
                damage: 24,
                explanation: 'package gameworld; declares that the class belongs to the gameworld package.',
                concept: 'packages_declaration',
                conceptTitle: 'Package Declaration',
                codexTitle: 'Data Glitch - Package Seal'
            },
            {
                id: 'ch1_glitch_story_7',
                title: 'Class Inside Package',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The Glitch tears the class body away from its package.</em> Create a class named <code>Game</code> inside the package <code>gameworld</code>.`,
                answerTip: 'Type the full code snippet.',
                inputPlaceholder: 'package gameworld; public class Game { }',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'This combines package declaration with a public class.',
                hints: [
                    'Put the package line first.',
                    'Use public class Game.',
                    'A compact one-line answer is accepted.'
                ],
                answers: ['package gameworld; public class Game { }', 'package gameworld; public class Game {}'],
                damage: 24,
                explanation: 'A package declaration can appear before a public class declaration such as public class Game { }.',
                concept: 'packages_public_class',
                conceptTitle: 'Public Classes In Packages',
                codexTitle: 'Data Glitch - Class Inside Package'
            },
            {
                id: 'ch1_glitch_story_8',
                title: 'Open Gate',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The final fragment turns into a single guarded field.</em> Declare a variable <code>level</code> that is accessible everywhere.`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'public int level = 1;',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The last question finishes the packages and modifiers section with a public field.',
                hints: [
                    'Use the public modifier.',
                    'The field type is int.',
                    'Initialize it with 1.'
                ],
                answers: ['public int level = 1;', 'public int level=1;'],
                damage: 26,
                explanation: 'public int level = 1; declares a public variable that is accessible from anywhere it is visible.',
                concept: 'modifiers_public_field',
                conceptTitle: 'public Fields',
                codexTitle: 'Data Glitch - Open Gate'
            }
        ];

        const recoveryChallenges = [
            {
                id: 'ch1_glitch_recovery_1',
                title: 'Return Signal',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Glitch pauses and isolates the easiest part.</em> Which Java keyword sends a value back from a method?`,
                answerTip: 'Type only the keyword.',
                inputPlaceholder: 'Type the keyword',
                matchMode: 'exact',
                narrative: 'The lesson stays on methods, but this recovery question narrows the focus.',
                hints: [
                    'It appears inside a method body.',
                    'It gives a value back to the caller.',
                    'The keyword begins with r.',
                    'The answer is return.'
                ],
                answers: ['return'],
                damage: 12,
                autoShowHint: true,
                explanation: 'The return keyword sends a value back from a method.'
            },
            {
                id: 'ch1_glitch_recovery_2',
                title: 'Package Name',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>A stable shard shows the top of a class file.</em> Write the Java statement that declares the package <code>gameworld</code>.`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'package gameworld;',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'This easier follow-up keeps the fight inside the packages section with a short one-line answer.',
                hints: [
                    'Start with the package keyword.',
                    'Use the name gameworld.',
                    'End with a semicolon.',
                    'The full line is package gameworld;'
                ],
                answers: ['package gameworld;'],
                damage: 12,
                autoShowHint: true,
                explanation: 'package gameworld; declares the package name at the top of the file.'
            }
        ];

        return this.buildAdaptiveEncounterQuestions(mainChallenges, recoveryChallenges, topic);
    }
};
