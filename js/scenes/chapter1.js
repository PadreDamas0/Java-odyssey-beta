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
        return [
            {
                id: 'ch1_host_1',
                type: 'multiple_choice',
                title: 'Name The Technique',
                questionType: 'Multiple Choice',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>The Arena Host slams a tournament ledger onto the table.</em> Which declaration correctly defines a method that returns the sum of two integers?`,
                narrative: 'The host tests whether you can shape a combat technique into a proper method.',
                hints: [
                    'The method should return an int.',
                    'The parameters are int a and int b.',
                    'A non-void method that computes a value must use return.'
                ],
                choices: [
                    'public static int add(int a, int b) { return a + b; }',
                    'public static void add(int a, int b) { a + b; }',
                    'public static int add(a, b) { return a + b; }',
                    'public static add(int a, int b) { return a + b; }'
                ],
                correctOption: 0,
                answers: ['public static int add(int a, int b) { return a + b; }'],
                damage: 24,
                explanation: 'A method that returns a whole number needs the int return type and a return statement.',
                concept: 'methods_declaration',
                conceptTitle: 'Method Declaration',
                codexTitle: 'Arena Host - Method Declaration'
            },
            {
                id: 'ch1_host_2',
                title: 'Call The Technique',
                questionType: 'Predict the Output',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>The host flicks his wrist.</em> What is printed by this method call?`,
                code: `public static int cheer(int crowd) {
    return crowd + 2;
}

System.out.println(cheer(3));`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'He waits for a fast answer. Predict the result before he snaps the ledger shut.',
                hints: [
                    'The method returns crowd + 2.',
                    'The argument passed is 3.',
                    'Find the returned value, then print it.'
                ],
                answers: ['5'],
                damage: 24,
                explanation: 'The method is called with 3, so it returns 3 + 2, which is 5.',
                concept: 'methods_calling',
                conceptTitle: 'Method Calling',
                codexTitle: 'Arena Host - Method Calls'
            },
            {
                id: 'ch1_host_3',
                title: 'The Shout That Returns Nothing',
                questionType: 'Code Completion',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>"Some moves strike, some simply announce," the host says.</em> Fill in the missing return type so the method prints <code>"Ready!"</code> and returns nothing.`,
                code: `public static ____ announce() {
    System.out.println("Ready!");
}`,
                answerTip: 'Type only the missing return type.',
                inputPlaceholder: 'Type the missing return type',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The tavern crowd leans in. Complete the method before the host loses patience.',
                hints: [
                    'A method that returns nothing uses void.',
                    'Use System.out.println("Ready!"); inside the braces.',
                    'The missing piece is the return type, not the method name.'
                ],
                answers: ['void'],
                damage: 24,
                explanation: 'void means the method does not return a value, so printing inside the method is valid without returning anything.',
                concept: 'methods_void',
                conceptTitle: 'void Methods',
                codexTitle: 'Arena Host - void Methods'
            },
            {
                id: 'ch1_host_4',
                title: 'Arguments At The Gate',
                questionType: 'Short Answer',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>The host taps the registration form.</em> In the call <code>castSpell(5, "Fire")</code>, what are <code>5</code> and <code>"Fire"</code> called?`,
                answerTip: 'Type one programming term.',
                inputPlaceholder: 'Type the term',
                matchMode: 'exact',
                narrative: 'This is a vocabulary strike. Miss it, and the host keeps the gate closed.',
                hints: [
                    'Parameters appear in the method declaration.',
                    'Values passed during the call are arguments.',
                    'This question asks about the call, not the declaration.'
                ],
                answers: ['arguments', 'Arguments'],
                damage: 24,
                explanation: 'Values supplied when a method is called are arguments.',
                concept: 'methods_arguments',
                conceptTitle: 'Parameters And Arguments',
                codexTitle: 'Arena Host - Arguments'
            },
            {
                id: 'ch1_host_5',
                title: 'Truth In The Arena',
                questionType: 'Identify the Error',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>The host lowers his voice.</em> Identify the missing return type in this broken method header.`,
                code: `public static ____ isReady(int hp) {
    return hp > 0;
}`,
                answerTip: 'Type only the missing return type.',
                inputPlaceholder: 'Type the missing return type',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'One final answer decides whether the tournament gate opens for you.',
                hints: [
                    'This method returns a logical value.',
                    'Java uses a dedicated type for true/false.',
                    'It is not String or int.'
                ],
                answers: ['boolean'],
                damage: 26,
                explanation: 'Methods that return true or false use the boolean return type.',
                concept: 'methods_return_type',
                conceptTitle: 'Return Types',
                codexTitle: 'Arena Host - Return Types'
            }
        ];
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
                description: 'Only the Big Boss remains. Move close and press E to begin the final arena battle.'
            };
        }

        return {
            id: 'ch1_arena_trials',
            title: 'Arena Of Heroes Cleared',
            description: 'All three arena opponents have been defeated.'
        };
    },

    getArenaPromptForCurrentEnemy() {
        const enemyId = this.getArenaCurrentEnemyId();
        if (enemyId === 'slimebug') return 'Approach the Slimebug and press E to start the fight.';
        if (enemyId === 'bird') return 'Approach the Bird and press E to start the fight.';
        if (enemyId === 'bigboss') return 'Approach the Big Boss and press E to start the final fight.';
        return 'The Arena of Heroes is clear.';
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
                    text: `<em>The Arena of Heroes falls quiet for a moment. Three opponents will challenge you here: the Slimebug, the Bird, and the Big Boss.</em>`,
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
                text: `<em>The Bird crashes into the arena sand and fades into static. Heat rolls through the coliseum as the Big Boss steps forward for the final battle.</em>`,
                portrait: '📜'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `So the last one finally decided to show up.`,
                portrait: '\u{1F9D1}\u200D\u{1F4BB}'
            }
        ]);

        Utils.notify('Approach the Big Boss and press E to start the final fight.', 'quest-update', 3600);
    },

    async startArenaBigBossEncounter() {
        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The Big Boss plants its burning weapon against the arena floor. The final match begins under the roar of the crowd.</em>`,
                portrait: '📜'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `You're the last wall between me and this arena. I'm ending it here.`,
                portrait: '\u{1F9D1}\u200D\u{1F4BB}'
            }
        ]);

        const bigBoss = {
            name: 'Big Boss',
            hp: 162,
            maxHp: 162,
            coinReward: 70,
            art: 'assets/sprites/worldEnemies/arena_bigboss.png',
            description: 'The final arena tyrant, armored in corrupted fire and heavy code.',
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
                    <span class="challenge-title">Big Boss: Arm The Counter</span>
                    <p>Write <strong>two lines</strong>:</p>
                    <pre>int fire = 8;
int guard = 3;</pre>
                `,
                narrative: 'The Big Boss raises its weapon. Build your counter with two clean integer declarations.',
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
                codexTitle: 'Big Boss - Arm The Counter'
            },
            {
                id: 'ch1_arena_bigboss_2',
                type: 'multiple_choice',
                prompt: `
                    <span class="challenge-title">Big Boss: Choose The Damage Formula</span>
                    <p>Given:</p>
                    <pre>int fire = 8;
int guard = 3;</pre>
                    <p>Which line correctly declares <code>totalDamage</code> as <code>(fire * 2) - guard</code>?</p>
                `,
                narrative: 'The Big Boss lunges. Only the right expression will cut through its armor.',
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
                codexTitle: 'Big Boss - Choose The Damage Formula'
            },
            {
                id: 'ch1_arena_bigboss_3',
                prompt: `
                    <span class="challenge-title">Big Boss: Claim The Finish</span>
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
                codexTitle: 'Big Boss - Claim The Finish'
            }
        ];
    },

    async onArenaBigBossVictory() {
        GameState.setFlag('ch1_arena_bigboss_defeated');
        GameState.setFlag('ch1_arena_trials_complete');
        this.refreshArenaInsideNpcs();
        GameState.completeQuest('ch1_arena_trials');

        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>The Big Boss drops to one knee, then shatters into drifting embers. The crowd erupts as the Arena of Heroes falls silent around you.</em>`,
                portrait: '📜'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `All three are down. The arena is mine now.`,
                portrait: '\u{1F9D1}\u200D\u{1F4BB}'
            }
        ]);

        Utils.notify('Arena cleared! Slimebug, Bird, and Big Boss defeated.', 'level-up', 4200);
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
                text: `<em>Chapter 2: The Conditional Crossroads is coming soon! In the next chapter, you'll learn about if-else statements, comparison operators, and logical conditions.</em>`,
                portrait: '📖'
            },
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>For now, you can explore the restored Village of Variables, review your Codex, or return to the main menu. Your progress has been saved!</em>`,
                portrait: '📖'
            }
        ]);
    },

    // Story-aligned challenge overrides. These later method definitions replace the
    // older legacy question pools above without changing the rest of the scene flow.
    getTrainingChallenges() {
        const area = 'Village of Variables - Training Grounds';
        const npc = 'Mentor Rowan';

        return [
            {
                id: 'ch1_train_story_1',
                title: 'Light Attack',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>Rowan points to the dummy.</em> Type the Java command that will print <code>Light Attack</code>.`,
                answerTip: 'Type the full print command. Semicolon is accepted but optional here.',
                inputPlaceholder: 'System.out.println("Light Attack");',
                inputMode: 'code',
                narrative: 'Rowan keeps the first strike short: print the attack name exactly.',
                hints: [
                    'Use System.out.println to print text.',
                    'Light Attack must be inside double quotes.',
                    'Full answer: System.out.println("Light Attack");'
                ],
                answers: [
                    'System.out.println("Light Attack");',
                    'System.out.println("Light Attack")'
                ],
                damage: 10,
                autoShowHint: true,
                explanation: 'System.out.println("Light Attack"); prints the attack name on its own line.',
                concept: 'light_attack_print',
                conceptTitle: 'Printing A Basic Attack',
                codexTitle: 'Training Dummy - Light Attack',
                feedbackDuration: 2600
            },
            {
                id: 'ch1_train_story_2',
                title: 'Guard Command',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>"Now block," Rowan says.</em> Type the Java command that will print <code>Guard Up</code>.`,
                answerTip: 'Type the full System.out.println command.',
                inputPlaceholder: 'System.out.println("Guard Up");',
                inputMode: 'code',
                narrative: 'A second beginner spell: print a short defensive command.',
                hints: [
                    'Use the same print command as the Light Attack.',
                    'Guard Up is text, so put it inside double quotes.',
                    'Full answer: System.out.println("Guard Up");'
                ],
                answers: [
                    'System.out.println("Guard Up");',
                    'System.out.println("Guard Up")'
                ],
                damage: 10,
                autoShowHint: true,
                explanation: 'The same System.out.println pattern can print any short text command.',
                concept: 'guard_up_print',
                conceptTitle: 'Printing Text Commands',
                codexTitle: 'Training Dummy - Guard Up',
                feedbackDuration: 2600
            },
            {
                id: 'ch1_train_story_3',
                title: 'Count Your Strength',
                questionType: 'True or False',
                area,
                npc,
                question: `<em>Rowan taps the dummy's chest.</em> True or false: <code>int score = 10;</code> is a valid Java declaration.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'Now Rowan checks whether you can recognize a basic integer declaration.',
                hints: [
                    'int stores whole numbers.',
                    'score is a valid variable name.',
                    '10 should not be wrapped in quotes.'
                ],
                answers: ['true'],
                damage: 7,
                autoShowHint: true,
                explanation: 'int is the Java type for whole numbers like 10.',
                concept: 'int_declaration',
                conceptTitle: 'Integer Variables',
                codexTitle: 'Training Dummy - int Variables',
                feedbackDuration: 2600
            },
            {
                id: 'ch1_train_story_4',
                type: 'multiple_choice',
                title: 'Pick The Text Type',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>"Words matter too," Rowan says.</em> Which type correctly fits here: <code>_____ village = "Oakroot";</code>?`,
                narrative: 'Still easy. Just pick the type Java uses for text.',
                hints: [
                    'Use String with a capital S.',
                    'Text literals need double quotes.',
                    'You are choosing the type only.'
                ],
                choices: [
                    'String',
                    'int',
                    'double',
                    'boolean'
                ],
                correctOption: 0,
                answers: ['String'],
                damage: 7,
                autoShowHint: true,
                explanation: 'String stores text values, and Java String literals use double quotes.',
                concept: 'string_declaration',
                conceptTitle: 'String Variables',
                codexTitle: 'Training Dummy - String Variables',
                feedbackDuration: 2600
            },
            {
                id: 'ch1_train_story_5',
                type: 'multiple_choice',
                title: 'Raise The Ready Flag',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>Rowan nods toward the final beginner sigil.</em> Which line correctly declares a <code>boolean</code> named <code>isReady</code> with the value <code>true</code>?`,
                narrative: 'This is Rowan\'s last easy check: spot the correct true-or-false declaration.',
                hints: [
                    'Use boolean for true or false values.',
                    'true is lowercase in Java.',
                    'Do not wrap true in quotes.'
                ],
                choices: [
                    'Boolean isReady = true;',
                    'boolean ready = "true";',
                    'boolean isReady = true;',
                    'int isReady = true;'
                ],
                correctOption: 2,
                answers: ['boolean isReady = true;'],
                damage: 8,
                autoShowHint: true,
                explanation: 'boolean stores true or false values, and Java writes them in lowercase.',
                concept: 'boolean_declaration',
                conceptTitle: 'boolean Variables',
                codexTitle: 'Training Dummy - boolean Variables',
                feedbackDuration: 2600
            },
            {
                id: 'ch1_train_story_6',
                type: 'multiple_choice',
                title: 'Print The Variable',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>Rowan points to the spell you just prepared.</em> Which line correctly prints the variable below?`,
                code: `String greeting = "Hello, Java Realm!";
_____`,
                narrative: 'Last Rowan question. Pick the line that uses the variable correctly.',
                hints: [
                    'Use System.out.println to print a line.',
                    'Put the variable name inside the parentheses.',
                    'Do not wrap greeting in quotes.'
                ],
                choices: [
                    'System.out.println("greeting");',
                    'System.out.println(greeting);',
                    'print(greeting);',
                    'System.out.println = greeting;'
                ],
                correctOption: 1,
                answers: ['System.out.println(greeting);'],
                damage: 8,
                autoShowHint: true,
                explanation: 'When printing a variable, use its name directly inside System.out.println(...).',
                concept: 'print_variable',
                conceptTitle: 'Printing Variables',
                codexTitle: 'Training Dummy - Printing Variables',
                feedbackDuration: 2800
            }
        ];
    },

    getGoblinChallenges() {
        const area = 'Corrupted Forest';
        const npc = 'Corrupted Goblin';

        return [
            {
                id: 'ch1_goblin_story_1',
                title: 'Slash Attack',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The goblin rushes from the brush.</em> Type the Java command that will print <code>Slash Attack</code>.`,
                answerTip: 'Type the full System.out.println command. Semicolon is accepted but optional here.',
                inputPlaceholder: 'System.out.println("Slash Attack");',
                inputMode: 'code',
                narrative: 'The first forest counter is still beginner-friendly: print the attack name.',
                hints: [
                    'Start with System.out.println.',
                    'Slash Attack must be inside double quotes.',
                    'Full answer: System.out.println("Slash Attack");'
                ],
                answers: [
                    'System.out.println("Slash Attack");',
                    'System.out.println("Slash Attack")'
                ],
                damage: 10,
                autoShowHint: true,
                explanation: 'System.out.println("Slash Attack"); prints the attack text and makes a clean basic command.',
                concept: 'goblin_slash_print',
                conceptTitle: 'Printing A Combat Command',
                codexTitle: 'Goblin - Slash Attack'
            },
            {
                id: 'ch1_goblin_story_2',
                type: 'multiple_choice',
                title: 'Fill The Mana Flask',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>The goblin stumbles back as a mana vial glows.</em> Which line correctly declares a <code>double</code> named <code>mana</code> with the value <code>19.5</code>?`,
                narrative: 'You are still in beginner territory. Pick the correct decimal declaration.',
                hints: [
                    'double stores decimal values.',
                    'The variable name must be mana.',
                    'Do not put 19.5 in quotes.'
                ],
                choices: [
                    'double mana = 19.5;',
                    'int mana = 19.5;',
                    'double "mana" = 19.5;',
                    'double mana = "19.5";'
                ],
                correctOption: 0,
                answers: ['double mana = 19.5;'],
                damage: 8,
                autoShowHint: true,
                explanation: 'double is used for decimal numbers such as 19.5.',
                concept: 'goblin_double_variable',
                conceptTitle: 'double Variables',
                codexTitle: 'Goblin - double Variables'
            },
            {
                id: 'ch1_goblin_story_3',
                type: 'multiple_choice',
                title: 'Name The Warning',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>The goblin growls as you call out a warning.</em> Which line correctly creates a <code>String</code> named <code>warning</code> with the value <code>"Stay back"</code>?`,
                narrative: 'Still beginner level. Pick the clean text declaration.',
                hints: [
                    'Use String with a capital S.',
                    'The text must use double quotes.',
                    'The variable name is warning.'
                ],
                choices: [
                    'String warning = "Stay back";',
                    'string warning = "Stay back";',
                    'String warning = Stay back;',
                    'warning = "Stay back";'
                ],
                correctOption: 0,
                answers: ['String warning = "Stay back";'],
                damage: 9,
                autoShowHint: true,
                explanation: 'String variables store text, and Java wraps text literals in double quotes.',
                concept: 'goblin_string_variable',
                conceptTitle: 'String Variables',
                codexTitle: 'Goblin - String Variables'
            },
            {
                id: 'ch1_goblin_story_4',
                type: 'multiple_choice',
                title: 'Add The Strike',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>The goblin braces itself for your next hit.</em> Which line correctly declares <code>totalDamage</code> as <code>dagger + spell</code>?`,
                code: `int dagger = 12;
int spell = 8;
_____`,
                narrative: 'Now you add two beginner variables together. Pick the right line.',
                hints: [
                    'Create a new int variable.',
                    'Use dagger + spell on the right side.',
                    'The variable name must be totalDamage.'
                ],
                choices: [
                    'int totalDamage = dagger + spell;',
                    'totalDamage = dagger + spell;',
                    'int totalDamage = "dagger + spell";',
                    'int totalDamage = dagger spell;'
                ],
                correctOption: 0,
                answers: ['int totalDamage = dagger + spell;'],
                damage: 10,
                autoShowHint: true,
                explanation: 'You can add two int variables and store the result in a new int variable.',
                concept: 'goblin_damage_sum',
                conceptTitle: 'Using Variables In Expressions',
                codexTitle: 'Goblin - Variable Expressions'
            },
            {
                id: 'ch1_goblin_story_5',
                type: 'multiple_choice',
                title: 'Finish With A Message',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>The goblin is almost down.</em> Which line correctly prints <code>Goblin took 20 damage</code> using the variables below?`,
                code: `String enemy = "Goblin";
int totalDamage = 20;
_____`,
                narrative: 'The first goblin ends with one easy message. Pick the line that joins text and variables.',
                hints: [
                    'Use System.out.println.',
                    'Join the text and variables with +.',
                    'Keep the spaces inside the quoted text.'
                ],
                choices: [
                    'System.out.println(enemy + " took " + totalDamage + " damage");',
                    'System.out.println("enemy took totalDamage damage");',
                    'print(enemy + totalDamage);',
                    'System.out.println(enemy, totalDamage);'
                ],
                correctOption: 0,
                answers: ['System.out.println(enemy + " took " + totalDamage + " damage");'],
                damage: 10,
                autoShowHint: true,
                explanation: 'String concatenation lets you mix text and variables in one printed message.',
                concept: 'goblin_print_damage',
                conceptTitle: 'Printing With Concatenation',
                codexTitle: 'Goblin - Printing With Concatenation'
            }
        ];
    },

    getAbandonedVillageChallenges() {
        const area = 'Abandoned Village';
        const npc = 'Village Goblin';

        return [
            {
                id: 'ch1_abandoned_story_1',
                title: 'Clear Path',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>A smaller goblin blocks the road.</em> Type the Java command that will print <code>Clear Path</code>.`,
                answerTip: 'Type the full System.out.println command. Semicolon is accepted but optional here.',
                inputPlaceholder: 'System.out.println("Clear Path");',
                inputMode: 'code',
                narrative: 'This second goblin begins with another short print attack.',
                hints: [
                    'Use System.out.println for a line of output.',
                    'Clear Path is text, so wrap it in double quotes.',
                    'Full answer: System.out.println("Clear Path");'
                ],
                answers: [
                    'System.out.println("Clear Path");',
                    'System.out.println("Clear Path")'
                ],
                damage: 10,
                autoShowHint: true,
                explanation: 'System.out.println("Clear Path"); prints a short command for the road-clearing strike.',
                concept: 'abandoned_clear_path_print',
                conceptTitle: 'Printing A Path Command',
                codexTitle: 'Abandoned Village - Clear Path'
            },
            {
                id: 'ch1_abandoned_story_2',
                title: 'Count The Supplies',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>You check what the village still has left.</em> What is printed by this code?`,
                code: `int food = 2;
int water = 3;
System.out.println(food + water);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'This is still a gentle warm-up. Add the two whole numbers together.',
                hints: [
                    'Use the + operator.',
                    '2 + 3 is a whole number.',
                    'The output is the total.'
                ],
                answers: ['5'],
                damage: 10,
                autoShowHint: true,
                explanation: 'The + operator adds the two int values, so the output is 5.',
                concept: 'abandoned_simple_output',
                conceptTitle: 'Basic Output',
                codexTitle: 'Abandoned Village - Basic Output'
            },
            {
                id: 'ch1_abandoned_story_3',
                title: 'Clear The Road',
                questionType: 'Fill in the Blank',
                area,
                npc,
                question: `<em>A faded marker shows the road is safe again.</em> Fill in the missing type: <code>_____ pathClear = true;</code>`,
                answerTip: 'Type only the missing type.',
                inputPlaceholder: 'Type the missing type',
                matchMode: 'exact',
                narrative: 'The goblin is weakening. Restore one more beginner variable correctly.',
                hints: [
                    'This variable stores only true or false.',
                    'Java uses the boolean type for that.',
                    'Type only the keyword.'
                ],
                answers: ['boolean'],
                damage: 11,
                autoShowHint: true,
                explanation: 'boolean is the Java type used for true and false values.',
                concept: 'abandoned_boolean_intro',
                conceptTitle: 'boolean Variables',
                codexTitle: 'Abandoned Village - boolean Variables'
            },
            {
                id: 'ch1_abandoned_story_4',
                title: 'Repair The Village Name',
                questionType: 'Fix the Code',
                area,
                npc,
                question: `<em>A cracked sign still tries to name the place.</em> Fix the broken line so the String value is written correctly.`,
                code: `String village = Oakroot;`,
                answerTip: 'Type the full corrected line.',
                inputPlaceholder: 'Type the corrected Java line',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'One missing pair of quotes keeps the sign from making sense.',
                hints: [
                    'String values use double quotes.',
                    'Keep the variable name village.',
                    'The word Oakroot is text, not a variable.'
                ],
                answers: ['String village = "Oakroot";'],
                damage: 12,
                autoShowHint: true,
                explanation: 'Java String literals must be wrapped in double quotes.',
                concept: 'abandoned_string_fix',
                conceptTitle: 'Fixing String Literals',
                codexTitle: 'Abandoned Village - String Literals'
            },
            {
                id: 'ch1_abandoned_story_5',
                title: 'Announce Arrival',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The path opens deeper into the village.</em> Write the line that prints <code>Entering Abandoned Village</code> using the variable below.`,
                code: `String place = "Abandoned Village";
_____`,
                answerTip: 'Type the full missing line.',
                inputPlaceholder: 'Type the Java print line',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The last tutorial step here is a simple print with concatenation.',
                hints: [
                    'Use System.out.println.',
                    'Start with the text "Entering ".',
                    'Then add the variable place.'
                ],
                answers: ['System.out.println("Entering " + place);'],
                damage: 12,
                autoShowHint: true,
                explanation: 'You can join a String literal and a variable with + inside System.out.println.',
                concept: 'abandoned_print_concat',
                conceptTitle: 'Printing With Concatenation',
                codexTitle: 'Abandoned Village - Printing'
            }
        ];
    },

    getEvilShroomChallenges() {
        const area = 'Crystal Cave';
        const npc = 'Evil Java Shroom';

        return [
            {
                id: 'ch1_shroom_story_1',
                title: 'Torch Spark',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The shroom blocks the cave path.</em> Type the Java command that will print <code>Torch Spark</code>.`,
                answerTip: 'Type the full System.out.println command. Semicolon is accepted but optional here.',
                inputPlaceholder: 'System.out.println("Torch Spark");',
                inputMode: 'code',
                narrative: 'Start with a simple print attack to light the cave.',
                hints: [
                    'Use System.out.println to print text.',
                    'Torch Spark must be inside double quotes.',
                    'Full answer: System.out.println("Torch Spark");'
                ],
                answers: [
                    'System.out.println("Torch Spark");',
                    'System.out.println("Torch Spark")'
                ],
                damage: 14,
                autoShowHint: true,
                explanation: 'System.out.println("Torch Spark"); prints a short text attack.',
                concept: 'shroom_print_attack',
                conceptTitle: 'Printing A Cave Attack',
                codexTitle: 'Shroom - Torch Spark'
            },
            {
                id: 'ch1_shroom_story_2',
                type: 'multiple_choice',
                title: 'Count The Spores',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>Three glowing spores float near the shroom.</em> Which line correctly stores the number <code>3</code> in an <code>int</code> named <code>spores</code>?`,
                narrative: 'Use the beginner whole-number type.',
                hints: [
                    'int stores whole numbers.',
                    'The variable name is spores.',
                    'Numbers like 3 do not need quotes.'
                ],
                choices: [
                    'int spores = 3;',
                    'String spores = 3;',
                    'int spores = "3";',
                    'spores int = 3;'
                ],
                correctOption: 0,
                answers: ['int spores = 3;'],
                damage: 14,
                autoShowHint: true,
                explanation: 'int spores = 3; stores the whole number 3 in an integer variable.',
                concept: 'shroom_int_variable',
                conceptTitle: 'Integer Variables',
                codexTitle: 'Shroom - int Variables'
            },
            {
                id: 'ch1_shroom_story_3',
                title: 'Name The Potion',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>Hera tosses you a cave potion.</em> Write the line that stores <code>"Healing Potion"</code> in a <code>String</code> named <code>item</code>.`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'String item = "Healing Potion";',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The shroom weakens when you label the item correctly.',
                hints: [
                    'String stores text.',
                    'Text values need double quotes.',
                    'Full answer: String item = "Healing Potion";'
                ],
                answers: [
                    'String item = "Healing Potion";',
                    'String item = "Healing Potion"'
                ],
                damage: 14,
                autoShowHint: true,
                explanation: 'String item = "Healing Potion"; stores text in a String variable.',
                concept: 'shroom_string_variable',
                conceptTitle: 'String Variables',
                codexTitle: 'Shroom - String Variables'
            },
            {
                id: 'ch1_shroom_story_4',
                title: 'Add The Spores',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The shroom splits into two small clouds.</em> What is printed by this code?`,
                code: `int left = 2;
int right = 3;
System.out.println(left + right);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'Finish with a tiny addition check.',
                hints: [
                    'left is 2.',
                    'right is 3.',
                    '2 + 3 equals 5.'
                ],
                answers: ['5'],
                damage: 14,
                autoShowHint: true,
                explanation: 'System.out.println(left + right); adds the two int values and prints 5.',
                concept: 'shroom_basic_addition',
                conceptTitle: 'Adding Integer Variables',
                codexTitle: 'Shroom - Basic Addition'
            }
        ];
    },

    getFireWormChallenges() {
        const area = 'Crystal Cave - Lava Tunnel';
        const npc = 'Fire Worm';

        return [
            {
                id: 'ch1_fire_story_1',
                title: 'Build The Shield',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The worm erupts beside the tunnel wall.</em> Write the two lines that set up your defense.`,
                code: `_____
_____`,
                answerTip: 'Type both Java lines.',
                inputPlaceholder: 'Type the two Java lines',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'This is the first real spike. Start with a clean multi-line setup before the heat closes in.',
                hints: [
                    'The first line declares an int shield with value 18.',
                    'The second line declares a boolean ready with value true.',
                    'Write one statement per line.'
                ],
                answers: [
                    'int shield = 18;\nboolean ready = true;',
                    'boolean ready = true;\nint shield = 18;'
                ],
                damage: 24,
                explanation: 'Boss fights can still start with strong basics: correct types, correct values, clean syntax.',
                concept: 'fire_worm_multi_setup',
                conceptTitle: 'Multi-Line Setup',
                codexTitle: 'Fire Worm - Setup'
            },
            {
                id: 'ch1_fire_story_2',
                type: 'multiple_choice',
                title: 'Choose The Counter',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>The worm thrashes through the lava glow.</em> Which line correctly declares <code>burstDamage</code> as <code>(flame + strike) * 2</code>?`,
                narrative: 'Now the boss expects a more careful expression. Parentheses matter here.',
                hints: [
                    'Create a new int variable named burstDamage.',
                    'Add flame and strike first, then multiply by 2.',
                    'Only one option keeps the intended grouping.'
                ],
                choices: [
                    'int burstDamage = flame + strike * 2;',
                    'int burstDamage = (flame + strike) * 2;',
                    'burstDamage = (flame + strike) * 2;',
                    'int burstDamage = (flame + strike) * "2";'
                ],
                correctOption: 1,
                answers: ['int burstDamage = (flame + strike) * 2;'],
                damage: 28,
                explanation: 'Parentheses ensure flame and strike are added together before the result is multiplied.',
                concept: 'fire_worm_expression_order',
                conceptTitle: 'Expression Order',
                codexTitle: 'Fire Worm - Expressions'
            },
            {
                id: 'ch1_fire_story_3',
                title: 'Cut Away The Heat',
                questionType: 'Fix the Code',
                area,
                npc,
                question: `<em>The heat reading is too precise for the shield spell.</em> Fix the broken line so only the whole-number part of <code>double heat = 14.9;</code> is stored in <code>int heavyHit</code>.`,
                code: `int heavyHit = heat;`,
                answerTip: 'Type the full corrected line.',
                inputPlaceholder: 'Type the corrected Java line',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'This boss starts demanding cleaner thinking. You need a cast now.',
                hints: [
                    'Converting from double to int needs an explicit cast.',
                    'Place (int) in front of heat.',
                    'Keep the variable type as int.'
                ],
                answers: ['int heavyHit = (int) heat;'],
                damage: 30,
                explanation: 'Casting with (int) removes the decimal part and allows the value to be stored in an int.',
                concept: 'fire_worm_type_casting',
                conceptTitle: 'Type Casting',
                codexTitle: 'Fire Worm - Type Casting'
            },
            {
                id: 'ch1_fire_story_4',
                title: 'Read The Fragment Signal',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The fragment flashes through the fire.</em> What is printed by this code?`,
                code: `String fragment = "Prime";
int piece = 2;
System.out.println(fragment + " " + piece);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'You are now mixing text and numbers under pressure.',
                hints: [
                    'fragment stores text.',
                    'A space is added between the String and the number.',
                    'The output keeps both values.'
                ],
                answers: ['Prime 2'],
                damage: 32,
                explanation: 'Java concatenates the String, the space, and the number to produce Prime 2.',
                concept: 'fire_worm_mixed_output',
                conceptTitle: 'Mixed Output',
                codexTitle: 'Fire Worm - Mixed Output'
            },
            {
                id: 'ch1_fire_story_5',
                title: 'Seal The Fragment',
                questionType: 'Boss Challenge',
                area,
                npc,
                question: `<em>The cave shakes as the boss starts to fall.</em> Write the two lines that mark the fragment as secured and print <code>Fragment secured</code>.`,
                code: `_____
_____`,
                answerTip: 'Type both Java lines.',
                inputPlaceholder: 'Type the two Java lines',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'This is the boss finish. You need one correct declaration and one correct print line under pressure.',
                hints: [
                    'The first line declares String fragment = "secured";',
                    'The second line prints "Fragment " plus the variable.',
                    'Write one full statement per line.'
                ],
                answers: [
                    'String fragment = "secured";\nSystem.out.println("Fragment " + fragment);',
                    'String fragment="secured";\nSystem.out.println("Fragment " + fragment);',
                    'String fragment = "secured";\nSystem.out.println("Fragment "+fragment);'
                ],
                damage: 34,
                explanation: 'The boss finale combines a String declaration and a printed result using concatenation.',
                concept: 'fire_worm_boss_finish',
                conceptTitle: 'Boss Finish',
                codexTitle: 'Fire Worm - Boss Finish'
            }
        ];
    },

    getArenaSlimebugChallenges() {
        const area = 'Arena of Heroes';
        const npc = 'Slimebug';

        return [
            {
                id: 'ch1_arena_slime_story_1',
                title: 'Name The Tray',
                questionType: 'Fill in the Blank',
                area,
                npc,
                question: `<em>The Slimebug splits into droplets across the arena tiles.</em> Fill in the missing type so the line declares an array of integers named <code>slimeDrops</code>.`,
                code: `_____ slimeDrops;`,
                answerTip: 'Type only the missing type.',
                inputPlaceholder: 'Type the missing array type',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The Slimebug is many pieces at once. Arrays let you track them together.',
                hints: [
                    'This is a one-dimensional int array.',
                    'The square brackets go with the type.',
                    'You are declaring the array, not filling it yet.'
                ],
                answers: ['int[]'],
                damage: 24,
                explanation: 'int[] declares a one-dimensional array of integers.',
                concept: 'arrays_declaration',
                conceptTitle: 'Array Declaration',
                codexTitle: 'Slimebug - Array Declaration'
            },
            {
                id: 'ch1_arena_slime_story_2',
                title: 'Bind The Droplets',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>You trap three droplets in runic containers.</em> Write the full line that initializes an int array named <code>drops</code> with the values <code>2</code>, <code>4</code>, and <code>6</code>.`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'Type the full Java line',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The arena floor quivers. Only the correct array literal will bind the droplets.',
                hints: [
                    'Use curly braces for the values.',
                    'The variable name is drops.',
                    'All elements are integers.'
                ],
                answers: ['int[] drops = {2, 4, 6};'],
                damage: 24,
                explanation: 'An array initializer uses curly braces with comma-separated values.',
                concept: 'arrays_initialization',
                conceptTitle: 'Array Initialization',
                codexTitle: 'Slimebug - Array Initialization'
            },
            {
                id: 'ch1_arena_slime_story_3',
                title: 'Strike The Middle',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>Three droplets bounce in a row.</em> What is printed by this code?`,
                code: `int[] drops = {2, 4, 6};
System.out.println(drops[1]);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'The Slimebug\'s center mass is just an indexed element in disguise.',
                hints: [
                    'Array indexes begin at 0.',
                    'drops[0] is 2.',
                    'drops[1] is the second element.'
                ],
                answers: ['4'],
                damage: 24,
                explanation: 'The element at index 1 is the second element, which is 4.',
                concept: 'arrays_access',
                conceptTitle: 'Accessing Array Elements',
                codexTitle: 'Slimebug - Array Access'
            },
            {
                id: 'ch1_arena_slime_story_4',
                title: 'Count The Spill',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The arena slick spreads wider.</em> Given <code>int[] drops = {2, 4, 6};</code>, what property gives the number of elements in the array?`,
                answerTip: 'Type only the property name.',
                inputPlaceholder: 'Type the property name',
                matchMode: 'exact',
                narrative: 'You need the size of the array, not one of its values.',
                hints: [
                    'Arrays use a built-in property.',
                    'It is not a method call.',
                    'Do not use parentheses.'
                ],
                answers: ['length', 'drops.length'],
                damage: 24,
                explanation: 'Java arrays use the length property to report how many elements they contain.',
                concept: 'arrays_length',
                conceptTitle: 'Array length',
                codexTitle: 'Slimebug - Array length'
            },
            {
                id: 'ch1_arena_slime_story_5',
                title: 'Sweep The Arena',
                questionType: 'Fix the Code',
                area,
                npc,
                question: `<em>You sweep the whole slime trail from left to right.</em> Fix the broken loop condition so it visits every valid index without crashing.`,
                code: `for (int i = 0; i <= drops.length; i++) {
    total += drops[i];
}`,
                answerTip: 'Type only the corrected loop condition.',
                inputPlaceholder: 'Type the corrected loop condition',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'This final pass uses a loop to traverse the whole array safely.',
                hints: [
                    'The last valid index is one less than the array length.',
                    'Using <= goes one step too far.',
                    'Only the condition needs to change.'
                ],
                answers: ['i < drops.length'],
                damage: 26,
                explanation: 'Array indexes go from 0 to length - 1, so the loop must use < rather than <=.',
                concept: 'arrays_traversal',
                conceptTitle: 'Traversing Arrays',
                codexTitle: 'Slimebug - Array Traversal'
            }
        ];
    },

    getArenaBirdChallenges() {
        const area = 'Arena of Heroes';
        const npc = 'Bird';

        return [
            {
                id: 'ch1_arena_bird_story_1',
                title: 'The Living Blueprint',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Bird leaves afterimages in the air.</em> What Java keyword begins a class declaration such as <code>_____ Bird { }</code>?`,
                answerTip: 'Type only the keyword.',
                inputPlaceholder: 'Type the keyword',
                matchMode: 'exact',
                narrative: 'The arena demands a true blueprint. Name the keyword that starts it.',
                hints: [
                    'This keyword defines a blueprint.',
                    'It comes before the class name.',
                    'It is lowercase in Java.'
                ],
                answers: ['class'],
                damage: 24,
                explanation: 'A class declaration begins with the keyword class.',
                concept: 'oop_class',
                conceptTitle: 'Classes',
                codexTitle: 'Bird - Classes'
            },
            {
                id: 'ch1_arena_bird_story_2',
                title: 'Summon The Form',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The Bird dives, then reforms.</em> Write the full line that creates an object of class <code>Bird</code> named <code>hawk</code>.`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'Type the full Java line',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'Object creation turns the blueprint into something real.',
                hints: [
                    'Use the new keyword.',
                    'The variable type is Bird.',
                    'The constructor call uses Bird().'
                ],
                answers: ['Bird hawk = new Bird();'],
                damage: 24,
                explanation: 'Objects are created with new ClassName().',
                concept: 'oop_object',
                conceptTitle: 'Objects',
                codexTitle: 'Bird - Objects'
            },
            {
                id: 'ch1_arena_bird_story_3',
                title: 'Name The Constructor',
                questionType: 'Fix the Code',
                area,
                npc,
                question: `<em>The Bird's true name must be bound the moment it is born.</em> Fix the broken assignment line inside this constructor.`,
                code: `Bird(String name) {
    name = name;
}`,
                answerTip: 'Type only the corrected assignment line.',
                inputPlaceholder: 'Type the corrected Java line',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'Constructor magic shapes an object at creation. Repair the binding.',
                hints: [
                    'The field and the parameter have the same name.',
                    'Use this.name to refer to the field.',
                    'Only the assignment line is wrong.'
                ],
                answers: ['this.name = name;'],
                damage: 24,
                explanation: 'this.name refers to the field, while name refers to the constructor parameter.',
                concept: 'oop_constructor',
                conceptTitle: 'Constructors',
                codexTitle: 'Bird - Constructors'
            },
            {
                id: 'ch1_arena_bird_story_4',
                title: 'Read The Attribute',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The Bird's afterimage reveals a name etched into its feathers.</em> What is printed by this code?`,
                code: `class Bird {
    String name = "Skyrend";
}

Bird b = new Bird();
System.out.println(b.name);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'Now the arena tests whether you can read an attribute from an object.',
                hints: [
                    'The object b is created from Bird.',
                    'name is an attribute of that object.',
                    'b.name accesses the field.'
                ],
                answers: ['Skyrend'],
                damage: 24,
                explanation: 'b.name accesses the object\'s name field, which stores Skyrend.',
                concept: 'oop_attributes',
                conceptTitle: 'Attributes',
                codexTitle: 'Bird - Attributes'
            },
            {
                id: 'ch1_arena_bird_story_5',
                title: 'The Dive Method',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The Bird gathers speed before plunging.</em> What is printed by this code?`,
                code: `class Bird {
    int speed = 3;

    void dive() {
        speed += 2;
    }
}

Bird b = new Bird();
b.dive();
System.out.println(b.speed);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'The method changes the Bird\'s state. Read the updated speed after the dive.',
                hints: [
                    'speed starts at 3.',
                    'dive() adds 2 to speed.',
                    'The updated value is printed.'
                ],
                answers: ['5'],
                damage: 24,
                explanation: 'Calling dive() increases speed from 3 to 5.',
                concept: 'oop_methods',
                conceptTitle: 'Methods In A Class',
                codexTitle: 'Bird - Methods In A Class'
            },
            {
                id: 'ch1_arena_bird_story_6',
                title: 'Guard The Core',
                questionType: 'Scenario-based Question',
                area,
                npc,
                question: `<em>The Bird's heart-core is protected.</em> Given a <code>Falcon</code> object named <code>f</code> with a public getter <code>getHp()</code>, what line reads its hp value correctly?`,
                answerTip: 'Type only the Java expression.',
                inputPlaceholder: 'Type the Java expression',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'This is the arena\'s lesson in basic encapsulation: protect the field, expose a getter.',
                hints: [
                    'private means direct outside access is restricted.',
                    'getHp() is the public getter.',
                    'Call the method on the object.'
                ],
                answers: ['f.getHp()'],
                damage: 26,
                explanation: 'With encapsulation, a private field is read through a public getter such as getHp().',
                concept: 'oop_encapsulation',
                conceptTitle: 'Basic Encapsulation',
                codexTitle: 'Bird - Encapsulation'
            }
        ];
    },

    getArenaBigBossChallenges() {
        const area = 'Arena of Heroes';
        const npc = 'Big Boss';

        return [
            {
                id: 'ch1_arena_boss_story_1',
                title: 'The Pulse Sequence',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The Big Boss raises rune-shields across the arena.</em> What is printed by this code?`,
                code: `public static int pulse(int n) {
    if (n % 2 == 0) return n / 2;
    return n * 2;
}

int total = 0;
for (int i = 1; i <= 3; i++) {
    total += pulse(i);
}

System.out.println(total);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'The arena falls silent. This first boss question mixes methods, conditions, and loops.',
                hints: [
                    'pulse(1) returns 2 because 1 is odd.',
                    'pulse(2) returns 1 because 2 is even.',
                    'pulse(3) returns 6, then add all three results.'
                ],
                answers: ['9'],
                damage: 26,
                explanation: 'The loop adds pulse(1)=2, pulse(2)=1, and pulse(3)=6 for a total of 9.',
                concept: 'boss_methods_loops',
                conceptTitle: 'Methods And Loops',
                codexTitle: 'Big Boss - Pulse Sequence'
            },
            {
                id: 'ch1_arena_boss_story_2',
                type: 'multiple_choice',
                title: 'The Shield That Never Drains',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>The Big Boss grins.</em> What is printed by this code?`,
                code: `int hp = 4;
int mana = 6;
boolean shield = hp++ > 3 || --mana > 5;

System.out.println(hp + ":" + mana + ":" + shield);`,
                narrative: 'This is a short-circuit trial. One side of the condition may stop the other from running.',
                hints: [
                    'hp++ > 3 is evaluated first and is true.',
                    'Because || short-circuits when the left side is true, --mana > 5 is not evaluated.',
                    'hp still increments because hp++ uses the value and then increases it.'
                ],
                choices: ['4:5:true', '5:5:true', '5:6:true', '5:6:false'],
                correctOption: 2,
                answers: ['5:6:true'],
                damage: 26,
                explanation: 'The left side is true, so the right side is skipped. hp becomes 5, mana stays 6, and shield is true.',
                concept: 'boss_short_circuit',
                conceptTitle: 'Logical Short-Circuiting',
                codexTitle: 'Big Boss - Short-Circuit Logic'
            },
            {
                id: 'ch1_arena_boss_story_3',
                title: 'The Falling Marks',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The Boss stamps symbols into the arena floor and leaves out every break.</em> What is printed by this code?`,
                code: `int mark = 2;
switch (mark) {
    case 1:
        System.out.print("A");
    case 2:
        System.out.print("B");
    case 3:
        System.out.print("C");
    default:
        System.out.print("D");
}`,
                answerTip: 'Type the exact output with no spaces.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'A missing break can change the whole battle. Read the fallthrough correctly.',
                hints: [
                    'Execution starts at case 2.',
                    'There are no break statements after case 2.',
                    'So the switch continues through the remaining labels.'
                ],
                answers: ['BCD'],
                damage: 26,
                explanation: 'With no break after case 2, execution continues into case 3 and default, printing BCD.',
                concept: 'boss_switch_fallthrough',
                conceptTitle: 'switch Fallthrough',
                codexTitle: 'Big Boss - switch Fallthrough'
            },
            {
                id: 'ch1_arena_boss_story_4',
                title: 'The Skipping Runes',
                questionType: 'Boss Challenge',
                area,
                npc,
                question: `<em>Only every other rune on the arena floor is safe to step on.</em> Read the array and stepped loop carefully. What is printed?`,
                code: `int[] runes = {3, 1, 4, 1};
int sum = 0;

for (int i = 0; i < runes.length; i += 2) {
    sum += runes[i];
}

System.out.println(sum);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'The Boss forces you to read an array with a stepped loop instead of visiting every element.',
                hints: [
                    'The loop visits indexes 0 and 2.',
                    'runes[0] is 3.',
                    'runes[2] is 4, then both visited values are added.'
                ],
                answers: ['7'],
                damage: 28,
                explanation: 'The loop adds runes[0] and runes[2], which are 3 and 4, for a total of 7.',
                concept: 'boss_arrays_loops',
                conceptTitle: 'Arrays With Loops',
                codexTitle: 'Big Boss - Skipping Runes'
            },
            {
                id: 'ch1_arena_boss_story_5',
                title: 'Name The Core',
                questionType: 'Fix the Code',
                area,
                npc,
                question: `<em>The Boss points to a molten construct.</em> Fix the broken constructor assignment so the field stores the incoming parameter.`,
                code: `Boss(String name) {
    name = name;
}`,
                answerTip: 'Type only the corrected assignment line.',
                inputPlaceholder: 'Type the corrected Java line',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'This is the constructor trap. One wrong binding and the core stays empty.',
                hints: [
                    'The parameter and the field have the same name.',
                    'Use this.name for the field.',
                    'Only the assignment line is broken.'
                ],
                answers: ['this.name = name;'],
                damage: 28,
                explanation: 'this.name refers to the field in the object, while name refers to the constructor parameter.',
                concept: 'boss_constructor_this',
                conceptTitle: 'Constructors And this',
                codexTitle: 'Big Boss - Constructors'
            },
            {
                id: 'ch1_arena_boss_story_6',
                title: 'The Shared Blade',
                questionType: 'Scenario-based Question',
                area,
                npc,
                question: `<em>The Boss summons two phantom swords, but both are bound to the same cursed core.</em> If <code>Guardian b = a;</code> and changing <code>b.level</code> also changes <code>a.level</code>, why does that happen?`,
                answerTip: 'Type a short answer.',
                inputPlaceholder: 'Type a short answer',
                matchMode: 'exact',
                narrative: 'This is a reference test. You need the idea, not just the number.',
                hints: [
                    'The variables do not hold separate objects.',
                    'They point to the same Guardian.',
                    'Think in terms of references.'
                ],
                answers: ['same object', 'same reference', 'same object reference', 'they refer to the same object'],
                damage: 28,
                explanation: 'a and b refer to the same object, so changing the object through b is visible through a.',
                concept: 'boss_reference_aliasing',
                conceptTitle: 'Object References',
                codexTitle: 'Big Boss - Shared References'
            },
            {
                id: 'ch1_arena_boss_story_7',
                title: 'The Inner Circuit',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>Runes spiral beneath your feet in two tightening rings.</em> What is printed by this code?`,
                code: `int score = 0;

for (int i = 1; i <= 3; i++) {
    for (int j = 1; j <= 2; j++) {
        if (i == j) {
            continue;
        }
        score += i + j;
    }
}

System.out.println(score);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'The Boss combines nested loops with continue. Track every allowed pair.',
                hints: [
                    'Skip the cases where i == j.',
                    'The added pairs are (1,2), (2,1), (3,1), and (3,2).',
                    'Add the values of each surviving pair.'
                ],
                answers: ['15'],
                damage: 30,
                explanation: 'The surviving pairs contribute 3, 3, 4, and 5, so the total is 15.',
                concept: 'boss_nested_loops',
                conceptTitle: 'Nested Loops',
                codexTitle: 'Big Boss - Nested Loops'
            },
            {
                id: 'ch1_arena_boss_story_8',
                title: 'Charge The Orb',
                questionType: 'Boss Challenge',
                area,
                npc,
                question: `<em>The final phase begins.</em> Analyze every line of this class, method call, and loop. What is printed?`,
                code: `class Orb {
    int power;

    Orb(int power) {
        this.power = power;
    }

    int pulse(int step) {
        if (step % 2 == 0) {
            return step;
        }
        return step + 1;
    }
}

Orb o = new Orb(1);
for (int i = 1; i <= 3; i++) {
    o.power += o.pulse(i);
}

System.out.println(o.power);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'The last boss question mixes a constructor, a method, conditionals, and a loop.',
                hints: [
                    'The orb starts with power 1.',
                    'pulse(1) returns 2, pulse(2) returns 2, and pulse(3) returns 4.',
                    'Add each returned value to the orb\'s power.'
                ],
                answers: ['9'],
                damage: 32,
                explanation: 'The orb starts at 1 and gains 2, 2, and 4, so it ends with power 9.',
                concept: 'boss_oop_loop_mix',
                conceptTitle: 'Objects, Methods, And Loops',
                codexTitle: 'Big Boss - Charge The Orb'
            }
        ];
    },

    getForestChallenges() {
        const area = 'Corrupted Forest Core';
        const npc = 'Data Glitch';

        return [
            {
                id: 'ch1_glitch_story_1',
                title: 'Shatter The Decimal Mask',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The Data Glitch twists a value into a shimmering fraction.</em> What is printed by this code?`,
                code: `double fragment = 7.9;
int whole = (int) fragment;
System.out.println(whole);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'The creature distorts types, but a correct cast restores order.',
                hints: [
                    'Casting from double to int removes the decimal part.',
                    'The value is not rounded.',
                    'Only the whole-number portion remains.'
                ],
                answers: ['7'],
                damage: 20,
                explanation: 'Casting 7.9 to int removes the decimal part, leaving 7.',
                concept: 'forest_type_casting',
                conceptTitle: 'Type Casting',
                codexTitle: 'Data Glitch - Type Casting'
            },
            {
                id: 'ch1_glitch_story_2',
                title: 'Restore The Name',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The Glitch tries to tear apart the title of every Code Guardian.</em> Write the full line that joins <code>first</code> and <code>last</code> with a space and stores the result in <code>fullTitle</code>.`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'Type the full Java line',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'To steady the fragment, you must rebuild the title from two separate strings.',
                hints: [
                    'String concatenation uses +.',
                    'A space should appear between the two words.',
                    'Store the result in a variable named fullTitle.'
                ],
                answers: ['String fullTitle = first + " " + last;'],
                damage: 20,
                explanation: 'The + operator concatenates strings, and " " inserts a space between them.',
                concept: 'forest_string_concat',
                conceptTitle: 'String Concatenation',
                codexTitle: 'Data Glitch - String Concatenation'
            },
            {
                id: 'ch1_glitch_story_3',
                title: 'Prove The Blessing',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The Prime Script fragment responds only if both the hero's level and blessing are sufficient.</em> What is printed by this code?`,
                code: `int level = 6;
boolean blessed = true;

if (level > 5 && blessed) {
    System.out.println("Ready");
} else {
    System.out.println("Wait");
}`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'This is a final test of conditions before the fragment yields.',
                hints: [
                    'level > 5 is true.',
                    'blessed is also true.',
                    'Both conditions are connected with &&.'
                ],
                answers: ['Ready'],
                damage: 20,
                explanation: 'Because both conditions are true, the if block prints Ready.',
                concept: 'forest_conditions',
                conceptTitle: 'Conditions',
                codexTitle: 'Data Glitch - Conditions'
            },
            {
                id: 'ch1_glitch_story_4',
                title: 'Choose The Direction',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The corrupted clearing twists into four false roads.</em> What is printed by this code?`,
                code: `int lane = 3;
switch (lane) {
    case 1:
        System.out.println("North");
        break;
    case 2:
        System.out.println("East");
        break;
    case 3:
        System.out.println("South");
        break;
    default:
        System.out.println("Unknown");
}`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'The Glitch turns the ground itself into a switch statement.',
                hints: [
                    'lane has the value 3.',
                    'The matching case is case 3.',
                    'That case prints the direction you need.'
                ],
                answers: ['South'],
                damage: 20,
                explanation: 'Because lane is 3, the switch selects case 3 and prints South.',
                concept: 'forest_switch',
                conceptTitle: 'switch Review',
                codexTitle: 'Data Glitch - switch Review'
            },
            {
                id: 'ch1_glitch_story_5',
                title: 'Gather The Fragment',
                questionType: 'Boss Challenge',
                area,
                npc,
                question: `<em>The last pieces of the fragment scatter into an array of glowing values.</em> What is printed by this code?`,
                code: `int[] relics = {2, 4, 6};
int total = 0;

for (int i = 0; i < relics.length; i++) {
    total += relics[i];
}

System.out.println(total);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'The final recovery sweep asks you to traverse every piece of the fragment.',
                hints: [
                    'The loop visits every array element.',
                    'Add 2, then 4, then 6.',
                    'Print the complete total.'
                ],
                answers: ['12'],
                damage: 24,
                explanation: 'Traversing the array adds all three elements: 2 + 4 + 6 = 12.',
                concept: 'forest_array_review',
                conceptTitle: 'Arrays Review',
                codexTitle: 'Data Glitch - Array Review'
            },
            {
                id: 'ch1_glitch_story_6',
                title: 'Seal The Sweep',
                questionType: 'Fix the Code',
                area,
                npc,
                question: `<em>The Glitch tries to make your fragment sweep crash at the final step.</em> Fix the loop condition so it visits every valid array index exactly once.`,
                code: `for (int i = 0; i <= relics.length; i++) {
    total += relics[i];
}`,
                answerTip: 'Type only the corrected loop condition.',
                inputPlaceholder: 'Type the corrected loop condition',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'One small symbol keeps the final recovery spell from breaking.',
                hints: [
                    'The last valid index is one less than relics.length.',
                    'Using <= steps one index too far.',
                    'Only the condition needs to change.'
                ],
                answers: ['i < relics.length'],
                damage: 24,
                explanation: 'Array indexes stop at length - 1, so the loop must use < instead of <=.',
                concept: 'forest_loop_fix',
                conceptTitle: 'Loop Boundaries',
                codexTitle: 'Data Glitch - Loop Boundaries'
            }
        ];
    }
};
