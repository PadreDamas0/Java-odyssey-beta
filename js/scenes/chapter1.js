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
                title: 'Forge The Skill',
                questionType: 'Code Completion',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>The Arena Host slams a tournament ledger onto the table.</em> Create a Java method named <code>attack</code>.`,
                answerTip: 'Type the full method line.',
                inputPlaceholder: 'static void attack(){ }',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'This fight becomes the methods/functions checkpoint from the research paper.',
                hints: [
                    'The method does not need to return a value.',
                    'Use static void in the method header.',
                    'Full answer: static void attack(){ }'
                ],
                answers: ['static void attack(){ }', 'static void attack(){}'],
                damage: 24,
                explanation: 'static void attack(){ } is a valid method declaration for a method named attack.',
                concept: 'methods_declaration',
                conceptTitle: 'Method Declaration',
                codexTitle: 'Arena Host - Forge The Skill'
            },
            {
                id: 'ch1_host_2',
                title: 'Call The Spell',
                questionType: 'Code Completion',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>The host flicks his wrist.</em> Write the line that calls the method <code>heal()</code>.`,
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
                damage: 24,
                explanation: 'heal(); is the correct method call for a method with no parameters.',
                concept: 'methods_calling',
                conceptTitle: 'Method Calling',
                codexTitle: 'Arena Host - Call The Spell'
            },
            {
                id: 'ch1_host_3',
                title: 'Return The Damage',
                questionType: 'Short Answer',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>"A proper technique must give back power," the host says.</em> What Java keyword is used to return a value from a method?`,
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
                damage: 24,
                explanation: 'The return keyword sends a value back from a method.',
                concept: 'methods_return',
                conceptTitle: 'The return Keyword',
                codexTitle: 'Arena Host - return'
            },
            {
                id: 'ch1_host_4',
                title: 'Method Output',
                questionType: 'Predict the Output',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>The host scratches a quick example into the tabletop.</em> What is the output of this code?`,
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
                damage: 24,
                explanation: 'add(2,3) returns 5, so the printed output is 5.',
                concept: 'methods_output',
                conceptTitle: 'Method Output',
                codexTitle: 'Arena Host - Method Output'
            },
            {
                id: 'ch1_host_5',
                title: 'Empty Return',
                questionType: 'Short Answer',
                area: 'Rusty Tankard',
                npc: 'Arena Host',
                question: `<em>The host lowers his voice.</em> What return type means a method does <strong>not</strong> return a value?`,
                answerTip: 'Type only the return type.',
                inputPlaceholder: 'Type the return type',
                matchMode: 'exact',
                narrative: 'This finishes the methods section before the arena proper.',
                hints: [
                    'This return type is used for methods that only perform an action.',
                    'It is not int, String, or boolean.',
                    'Java uses one short keyword for it.'
                ],
                answers: ['void'],
                damage: 26,
                explanation: 'void means a method performs an action but does not return a value.',
                concept: 'methods_void',
                conceptTitle: 'void Return Type',
                codexTitle: 'Arena Host - void'
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
    getTrainingChallenges() {
        const area = 'Village of Variables - Training Grounds';
        const npc = 'Mentor Rowan';

        return [
            {
                id: 'ch1_train_story_1',
                type: 'multiple_choice',
                title: 'Mana Potion',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>Rowan draws four glowing type sigils.</em> Which Java data type is used for decimal values?`,
                narrative: 'The training dummy now moves from variables into data types.',
                hints: [
                    'A decimal number can store a fractional part.',
                    'int is only for whole numbers.',
                    'Java commonly uses double for decimal values.'
                ],
                choices: ['int', 'double', 'char', 'boolean'],
                correctOption: 1,
                answers: ['double'],
                damage: 8,
                autoShowHint: true,
                explanation: 'double is the Java data type used for decimal numbers.',
                concept: 'data_types_double',
                conceptTitle: 'Decimal Data Types',
                codexTitle: 'Training Dummy - Decimal Types',
                feedbackDuration: 2500
            },
            {
                id: 'ch1_train_story_2',
                type: 'multiple_choice',
                title: 'Crystal Energy',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>A crystal vial hums in Rowan's hand.</em> Which line correctly declares a variable with value <code>15.5</code>?`,
                narrative: 'You now apply the correct decimal type in a full declaration.',
                hints: [
                    '15.5 is not a whole number.',
                    'Use double, not int.',
                    'The variable name must stay energy.'
                ],
                choices: [
                    'int energy = 15.5;',
                    'double energy = 15.5;',
                    'char energy = 15.5;',
                    'boolean energy = 15.5;'
                ],
                correctOption: 1,
                answers: ['double energy = 15.5;'],
                damage: 8,
                autoShowHint: true,
                explanation: 'double energy = 15.5; is the correct declaration for a decimal value.',
                concept: 'data_types_decimal_declaration',
                conceptTitle: 'Declaring Decimal Variables',
                codexTitle: 'Training Dummy - Decimal Declaration',
                feedbackDuration: 2500
            },
            {
                id: 'ch1_train_story_3',
                type: 'multiple_choice',
                title: 'True Path',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>Rowan marks one route as stable.</em> Which Java data type stores <code>true</code> or <code>false</code> values?`,
                narrative: 'This is the boolean checkpoint.',
                hints: [
                    'This type is used for conditions and flags.',
                    'It is not int or char.',
                    'Java spells it in lowercase.'
                ],
                choices: ['int', 'char', 'boolean', 'double'],
                correctOption: 2,
                answers: ['boolean'],
                damage: 8,
                autoShowHint: true,
                explanation: 'boolean is the Java data type for true-or-false values.',
                concept: 'data_types_boolean',
                conceptTitle: 'Boolean Type',
                codexTitle: 'Training Dummy - boolean Type',
                feedbackDuration: 2500
            },
            {
                id: 'ch1_train_story_4',
                type: 'multiple_choice',
                title: 'Character Rune',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>Rowan etches a single letter into the air.</em> Which Java data type stores a single character?`,
                narrative: 'Now separate text strings from single-character values.',
                hints: [
                    'A single character is not a full String.',
                    'Java uses single quotes for char values.',
                    'The correct type has four letters.'
                ],
                choices: ['String', 'char', 'boolean', 'int'],
                correctOption: 1,
                answers: ['char'],
                damage: 8,
                autoShowHint: true,
                explanation: 'char stores a single character value in Java.',
                concept: 'data_types_char',
                conceptTitle: 'Character Type',
                codexTitle: 'Training Dummy - char Type',
                feedbackDuration: 2500
            },
            {
                id: 'ch1_train_story_5',
                type: 'multiple_choice',
                title: 'Dungeon Letter',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>The final training sigil flickers.</em> What is the output of this code?<br><code>char rank = 'A';<br>System.out.println(rank);</code>`,
                narrative: 'The dummy falls once you can read a basic char output correctly.',
                hints: [
                    'rank stores one character.',
                    'System.out.println prints the value, not the type name.',
                    'The output is the letter itself.'
                ],
                choices: ['"A"', 'A', 'char', 'rank'],
                correctOption: 1,
                answers: ['A'],
                damage: 8,
                autoShowHint: true,
                explanation: 'Printing a char variable outputs the character it stores, so the result is A.',
                concept: 'data_types_char_output',
                conceptTitle: 'Printing char Values',
                codexTitle: 'Training Dummy - char Output',
                feedbackDuration: 2600
            }
        ];
    },

    getGoblinChallenges() {
        const area = 'Corrupted Forest';
        const npc = 'Corrupted Goblin';

        return [
            {
                id: 'ch1_goblin_story_1',
                title: 'Scanner Import',
                questionType: 'True or False',
                area,
                npc,
                question: `<em>The goblin tears at a page from a coding manual.</em> True or false: <code>import java.util.Scanner;</code> is used to import the <code>Scanner</code> class in Java.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'The forest now shifts into user input, one of the next topics in the paper.',
                hints: [
                    'Scanner belongs to java.util.',
                    'Import statements are used before the class body.',
                    'The statement shown is the standard Scanner import.'
                ],
                answers: ['true'],
                damage: 10,
                autoShowHint: true,
                explanation: 'import java.util.Scanner; is the correct import line for Java Scanner.',
                concept: 'scanner_import',
                conceptTitle: 'Importing Scanner',
                codexTitle: 'Goblin - Scanner Import'
            },
            {
                id: 'ch1_goblin_story_2',
                title: 'Input Portal',
                questionType: 'True or False',
                area,
                npc,
                question: `<em>The goblin swipes at your next note.</em> True or false: <code>Scanner scan = new Scanner(System.in);</code> creates a Scanner object named <code>scan</code>.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'Now the question moves from importing Scanner to creating one.',
                hints: [
                    'new Scanner(System.in) builds a Scanner object.',
                    'scan is the variable name.',
                    'System.in listens for keyboard input.'
                ],
                answers: ['true'],
                damage: 10,
                autoShowHint: true,
                explanation: 'That line creates a Scanner object named scan that reads from System.in.',
                concept: 'scanner_creation',
                conceptTitle: 'Creating A Scanner',
                codexTitle: 'Goblin - Scanner Object'
            },
            {
                id: 'ch1_goblin_story_3',
                title: 'Read The Hero',
                questionType: 'True or False',
                area,
                npc,
                question: `<em>The goblin circles as your notes flutter loose.</em> True or false: the method <code>nextLine()</code> is used to read a <code>String</code> input from the user.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'The input topic continues with the method used for full text input.',
                hints: [
                    'A whole line of text is not read by nextInt().',
                    'Scanner has a dedicated method for line-based text.',
                    'The method named in the question is the standard one.'
                ],
                answers: ['true'],
                damage: 10,
                autoShowHint: true,
                explanation: 'nextLine() is used to read a line of text as a String from the user.',
                concept: 'scanner_nextline',
                conceptTitle: 'Reading String Input',
                codexTitle: 'Goblin - nextLine()'
            },
            {
                id: 'ch1_goblin_story_4',
                title: 'Read The Gold',
                questionType: 'True or False',
                area,
                npc,
                question: `<em>The goblin snarls at one misleading scribble.</em> True or false: the method <code>nextInt()</code> is used to read a <code>String</code> input.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'This one checks whether you can distinguish number input from text input.',
                hints: [
                    'nextInt() reads a number, not a line of text.',
                    'String input is commonly read with nextLine().',
                    'So the statement shown is incorrect.'
                ],
                answers: ['false'],
                damage: 10,
                autoShowHint: true,
                explanation: 'nextInt() reads an integer value, so it is not used for String input.',
                concept: 'scanner_nextint',
                conceptTitle: 'Reading Integer Input',
                codexTitle: 'Goblin - nextInt()'
            },
            {
                id: 'ch1_goblin_story_5',
                title: 'Enter The Name',
                questionType: 'True or False',
                area,
                npc,
                question: `<em>The goblin fades as a final input spell appears.</em> If the user enters <code>Kai</code>, will this code print <code>Kai</code>?<br><code>Scanner scan = new Scanner(System.in);<br>String name = scan.nextLine();<br>System.out.println(name);</code>`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'The last user-input check ties reading and printing together.',
                hints: [
                    'The input is stored in name.',
                    'The last line prints the variable name.',
                    'If the user typed Kai, that exact value is printed.'
                ],
                answers: ['true'],
                damage: 10,
                autoShowHint: true,
                explanation: 'The code reads a line into name, then prints the value stored in name.',
                concept: 'scanner_input_output',
                conceptTitle: 'Reading And Printing Input',
                codexTitle: 'Goblin - Input And Output'
            }
        ];
    },

    getAbandonedVillageChallenges() {
        const area = 'Abandoned Village';
        const npc = 'Village Goblin';

        return [
            {
                id: 'ch1_abandoned_story_1',
                title: 'Sword Strike',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>A scavenger goblin lunges with a rusty blade.</em> Which operator is used for addition in Java?`,
                answerTip: 'Type only the operator.',
                inputPlaceholder: 'Type the operator',
                matchMode: 'exact',
                narrative: 'The second goblin shifts from input to arithmetic operators.',
                hints: [
                    'It is the same symbol used in basic math for adding values.',
                    'Java uses one character for it.',
                    'It is also used with String concatenation.'
                ],
                answers: ['+'],
                damage: 10,
                autoShowHint: true,
                explanation: 'The + operator is used for addition in Java.',
                concept: 'arithmetic_addition',
                conceptTitle: 'Addition Operator',
                codexTitle: 'Abandoned Village - Addition'
            },
            {
                id: 'ch1_abandoned_story_2',
                title: 'Fire Slash',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The goblin trips over a scorched rune.</em> What is printed by this code?`,
                code: `System.out.println(10 - 3);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'A fast subtraction check keeps the pacing simple.',
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
                codexTitle: 'Abandoned Village - Subtraction'
            },
            {
                id: 'ch1_abandoned_story_3',
                title: 'Heavy Damage',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The goblin braces for a stronger hit.</em> Which operator is used for multiplication in Java?`,
                answerTip: 'Type only the operator.',
                inputPlaceholder: 'Type the operator',
                matchMode: 'exact',
                narrative: 'This step checks whether you know the core math symbols.',
                hints: [
                    'It is the same symbol used in many programming languages for multiply.',
                    'It is not the letter x.',
                    'Java uses a single symbol.'
                ],
                answers: ['*'],
                damage: 10,
                autoShowHint: true,
                explanation: 'The * operator is used for multiplication in Java.',
                concept: 'arithmetic_multiplication',
                conceptTitle: 'Multiplication Operator',
                codexTitle: 'Abandoned Village - Multiplication'
            },
            {
                id: 'ch1_abandoned_story_4',
                title: 'Goblin Remainder',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The goblin drops a broken division charm.</em> What is printed by this code?`,
                code: `System.out.println(10 % 4);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'Now the battle adds the remainder operator.',
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
                codexTitle: 'Abandoned Village - Remainder'
            },
            {
                id: 'ch1_abandoned_story_5',
                title: 'Binary Scroll',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The last stolen note shows a number written in another system.</em> What is the binary equivalent of decimal <code>5</code>?`,
                answerTip: 'Type only the binary number.',
                inputPlaceholder: 'Type the binary number',
                matchMode: 'exact',
                narrative: 'The goblin\'s last trick adds a light number-systems question before the cave.',
                hints: [
                    'Binary uses only 0 and 1.',
                    'Decimal 5 is 4 + 1.',
                    'So the binary digits should mark those places.'
                ],
                answers: ['101'],
                damage: 11,
                autoShowHint: true,
                explanation: 'The binary representation of decimal 5 is 101.',
                concept: 'number_systems_binary',
                conceptTitle: 'Binary Numbers',
                codexTitle: 'Abandoned Village - Binary Numbers'
            }
        ];
    },

    getEvilShroomChallenges() {
        const area = 'Crystal Cave';
        const npc = 'Evil Java Shroom';

        return [
            {
                id: 'ch1_shroom_story_1',
                title: 'Goblin Check',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The shroom releases a cloud that reacts to conditions.</em> What Java keyword is used to check a condition?`,
                answerTip: 'Type only the keyword.',
                inputPlaceholder: 'Type the keyword',
                matchMode: 'exact',
                narrative: 'The cave now steps into control structures.',
                hints: [
                    'This keyword starts a conditional block.',
                    'It comes before parentheses containing a condition.',
                    'It has only two letters.'
                ],
                answers: ['if'],
                damage: 14,
                autoShowHint: true,
                explanation: 'The if keyword is used to check a condition in Java.',
                concept: 'conditions_if',
                conceptTitle: 'if Statements',
                codexTitle: 'Shroom - if Statements'
            },
            {
                id: 'ch1_shroom_story_2',
                title: 'False Path',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The spores drift toward the wrong branch.</em> Which Java keyword runs when the condition is false?`,
                answerTip: 'Type only the keyword.',
                inputPlaceholder: 'Type the keyword',
                matchMode: 'exact',
                narrative: 'After if comes the branch for the false case.',
                hints: [
                    'This keyword often follows an if block.',
                    'It handles the opposite case.',
                    'It has four letters.'
                ],
                answers: ['else'],
                damage: 14,
                autoShowHint: true,
                explanation: 'The else keyword runs when the if condition is false.',
                concept: 'conditions_else',
                conceptTitle: 'else Statements',
                codexTitle: 'Shroom - else Statements'
            },
            {
                id: 'ch1_shroom_story_3',
                title: 'Arena Test',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The shroom's cap flashes with a simple conditional.</em> What is printed by this code?`,
                code: `int hp = 20;
if (hp > 10) {
    System.out.println("Alive");
}`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'This checks whether you can read a basic if statement correctly.',
                hints: [
                    'hp stores 20.',
                    '20 is greater than 10.',
                    'So the print statement inside the if block runs.'
                ],
                answers: ['Alive'],
                damage: 14,
                autoShowHint: true,
                explanation: 'Because hp > 10 is true, the code prints Alive.',
                concept: 'conditions_output',
                conceptTitle: 'Reading if Output',
                codexTitle: 'Shroom - if Output'
            },
            {
                id: 'ch1_shroom_story_4',
                title: 'Arena Choice',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The shroom opens several coded paths at once.</em> In a Java <code>switch</code> statement, which keyword defines an option?`,
                answerTip: 'Type only the keyword.',
                inputPlaceholder: 'Type the keyword',
                matchMode: 'exact',
                narrative: 'The control-structure topic now expands into switch statements.',
                hints: [
                    'Each possible branch starts with this label.',
                    'It appears before the value and colon.',
                    'It has four letters.'
                ],
                answers: ['case'],
                damage: 14,
                autoShowHint: true,
                explanation: 'case is the keyword that defines an option inside a switch statement.',
                concept: 'switch_case',
                conceptTitle: 'switch case Labels',
                codexTitle: 'Shroom - switch case'
            },
            {
                id: 'ch1_shroom_story_5',
                title: 'Training Loop',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The last spores circle in a fixed pattern.</em> Which loop is best when the number of repetitions is already known?`,
                answerTip: 'Type a short answer.',
                inputPlaceholder: 'Type the loop name',
                matchMode: 'exact',
                narrative: 'The shroom ends by introducing the loop concept before the cave boss.',
                hints: [
                    'This loop usually has initialization, condition, and update parts.',
                    'It is common when you know how many times to repeat.',
                    'Include the word loop in your answer.'
                ],
                answers: ['for loop', 'for'],
                damage: 16,
                autoShowHint: true,
                explanation: 'A for loop is commonly used when the number of repetitions is known ahead of time.',
                concept: 'loops_for',
                conceptTitle: 'for Loops',
                codexTitle: 'Shroom - for Loops'
            }
        ];
    },

    getFireWormChallenges() {
        const area = 'Crystal Cave - Lava Tunnel';
        const npc = 'Fire Worm';

        return [
            {
                id: 'ch1_fire_story_1',
                title: 'Crystal Storage',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The worm bursts from the lava and scatters crystal shards.</em> Create an array named <code>crystals</code> with the values <code>2</code>, <code>4</code>, and <code>6</code>.`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'int[] crystals = {2, 4, 6};',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The cave boss now handles the arrays section from your research paper.',
                hints: [
                    'Use int[] for an array of integers.',
                    'Use curly braces for the array values.',
                    'Full answer: int[] crystals = {2, 4, 6};'
                ],
                answers: ['int[] crystals = {2, 4, 6};', 'int[] crystals = {2,4,6};'],
                damage: 24,
                explanation: 'An int array uses int[] and is initialized with values inside curly braces.',
                concept: 'arrays_initialization',
                conceptTitle: 'Array Initialization',
                codexTitle: 'Fire Worm - Crystal Storage'
            },
            {
                id: 'ch1_fire_story_2',
                title: 'Middle Crystal',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The Fire Worm coils around three floating crystals.</em> What is printed by this code?`,
                code: `int[] crystals = {2, 4, 6};
System.out.println(crystals[1]);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'The second boss question checks whether you can read an array index.',
                hints: [
                    'Array indexes begin at 0.',
                    'crystals[0] is 2.',
                    'crystals[1] is the second value.'
                ],
                answers: ['4'],
                damage: 28,
                explanation: 'The element at index 1 is the second value in the array, which is 4.',
                concept: 'arrays_access',
                conceptTitle: 'Accessing Array Elements',
                codexTitle: 'Fire Worm - Middle Crystal'
            },
            {
                id: 'ch1_fire_story_3',
                title: 'First Index',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The worm whips its tail across the crystal line.</em> What is the first index of a Java array?`,
                answerTip: 'Type only the number.',
                inputPlaceholder: 'Type the number',
                matchMode: 'exact',
                narrative: 'This is the zero-based indexing check.',
                hints: [
                    'Java arrays do not start at 1.',
                    'The first valid position comes before index 1.',
                    'It is the smallest index you can use.'
                ],
                answers: ['0'],
                damage: 30,
                explanation: 'Java arrays start at index 0.',
                concept: 'arrays_indexing',
                conceptTitle: 'Array Indexing',
                codexTitle: 'Fire Worm - First Index'
            },
            {
                id: 'ch1_fire_story_4',
                title: 'Grid Structure',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The lava floor cracks into rows and columns.</em> What kind of structure stores data in rows and columns?`,
                answerTip: 'Type a short answer.',
                inputPlaceholder: 'Type the structure name',
                matchMode: 'exact',
                narrative: 'The arrays topic now widens into two-dimensional structures.',
                hints: [
                    'This is often described as a 2D layout.',
                    'A 2D array is one Java representation of it.',
                    'The common math term is also accepted.'
                ],
                answers: ['Matrix', 'matrix', '2D array', '2d array'],
                damage: 32,
                explanation: 'Data arranged in rows and columns is commonly described as a matrix or a 2D array.',
                concept: 'arrays_2d',
                conceptTitle: '2D Arrays',
                codexTitle: 'Fire Worm - Grid Structure'
            },
            {
                id: 'ch1_fire_story_5',
                title: 'Loop Inside Loop',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Fire Worm enters its final phase and splits the crystal grid again.</em> What is the term for a loop placed inside another loop?`,
                answerTip: 'Type a short answer.',
                inputPlaceholder: 'Type the term',
                matchMode: 'exact',
                narrative: 'The boss ends with the key idea often used when traversing 2D structures.',
                hints: [
                    'This pattern is common with 2D arrays.',
                    'One loop runs inside another loop.',
                    'Both words start with n and l.'
                ],
                answers: ['Nested', 'nested', 'nested loop', 'Nested loop'],
                damage: 34,
                explanation: 'A loop inside another loop is called a nested loop.',
                concept: 'arrays_nested_loops',
                conceptTitle: 'Nested Loops',
                codexTitle: 'Fire Worm - Nested Loops'
            }
        ];
    },

    getArenaSlimebugChallenges() {
        const area = 'Arena of Heroes';
        const npc = 'Slimebug';

        return [
            {
                id: 'ch1_arena_slime_story_1',
                title: 'Package Seal',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The Slimebug splashes across the arena floor and smears your source header.</em> Write the Java code that declares a package named <code>gameworld</code>.`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'package gameworld;',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The arena begins with package and class organization before access control.',
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
                codexTitle: 'Slimebug - Package Seal'
            },
            {
                id: 'ch1_arena_slime_story_2',
                title: 'Package Example',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The Slimebug hisses and tears the class body in half.</em> Write a complete class inside the <code>gameworld</code> package named <code>Game</code>.`,
                answerTip: 'Type the full code snippet.',
                inputPlaceholder: 'package gameworld; class Game { }',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'This stage ties a package header to a simple class declaration.',
                hints: [
                    'Put the package line first.',
                    'Then declare class Game with braces.',
                    'A compact one-line answer is accepted.'
                ],
                answers: ['package gameworld; class Game { }', 'package gameworld; class Game {}'],
                damage: 24,
                explanation: 'A package declaration can appear before a class declaration such as class Game { }.',
                concept: 'packages_class_example',
                conceptTitle: 'Classes Inside Packages',
                codexTitle: 'Slimebug - Package Example'
            },
            {
                id: 'ch1_arena_slime_story_3',
                title: 'Living Blueprint',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The slime briefly forms a warrior silhouette.</em> Create a Java class named <code>Hero</code>.`,
                answerTip: 'Type the full class declaration.',
                inputPlaceholder: 'class Hero { }',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The first arena fight now moves into class organization basics.',
                hints: [
                    'Use the class keyword.',
                    'The class name is Hero.',
                    'Include braces for the class body.'
                ],
                answers: ['class Hero { }', 'class Hero {}'],
                damage: 24,
                explanation: 'class Hero { } is a valid basic Java class declaration.',
                concept: 'class_organization_basic',
                conceptTitle: 'Basic Class Declarations',
                codexTitle: 'Slimebug - Living Blueprint'
            },
            {
                id: 'ch1_arena_slime_story_4',
                title: 'Class Keyword',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Slimebug keeps reshaping but never stabilizes.</em> What Java keyword begins a class declaration such as <code>_____ Hero { }</code>?`,
                answerTip: 'Type only the keyword.',
                inputPlaceholder: 'Type the keyword',
                matchMode: 'exact',
                narrative: 'This confirms the keyword behind the blueprint concept.',
                hints: [
                    'It is the same keyword used in class Hero { }.',
                    'It appears before the class name.',
                    'It is all lowercase.'
                ],
                answers: ['class'],
                damage: 24,
                explanation: 'A class declaration begins with the class keyword.',
                concept: 'class_keyword',
                conceptTitle: 'The class Keyword',
                codexTitle: 'Slimebug - Class Keyword'
            },
            {
                id: 'ch1_arena_slime_story_5',
                title: 'Summon The Form',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The last slime form hardens into a training construct.</em> Write the full line that creates an object of class <code>Hero</code> named <code>player</code>.`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'Hero player = new Hero();',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The class-organization stage ends by turning a class into an object.',
                hints: [
                    'Use the new keyword.',
                    'The variable type is Hero.',
                    'Call the constructor with Hero().'
                ],
                answers: ['Hero player = new Hero();'],
                damage: 26,
                explanation: 'Objects are created from classes with new ClassName().',
                concept: 'class_objects',
                conceptTitle: 'Creating Objects',
                codexTitle: 'Slimebug - Summon The Form'
            }
        ];
    },

    getArenaBirdChallenges() {
        const area = 'Arena of Heroes';
        const npc = 'Bird';

        return [
            {
                id: 'ch1_arena_bird_story_1',
                title: 'Open Gate',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The Bird sweeps low over the arena rail.</em> Create a class named <code>Hero</code> that is accessible from anywhere.`,
                answerTip: 'Type the full class declaration.',
                inputPlaceholder: 'public class Hero { }',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The second arena fight shifts into access modifiers.',
                hints: [
                    'Use the public access modifier.',
                    'The class name is Hero.',
                    'Include braces for the class body.'
                ],
                answers: ['public class Hero { }', 'public class Hero {}'],
                damage: 24,
                explanation: 'public class Hero { } declares a class that can be accessed from anywhere.',
                concept: 'access_public_class',
                conceptTitle: 'public Classes',
                codexTitle: 'Bird - Open Gate'
            },
            {
                id: 'ch1_arena_bird_story_2',
                title: 'Hidden Vault',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The Bird's shadow guards a sealed core.</em> Inside a class, declare a variable <code>hp</code> that can only be accessed within the same class.`,
                answerTip: 'Type the full class snippet.',
                inputPlaceholder: 'class Hero { private int hp; }',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'Now the arena teaches private access.',
                hints: [
                    'Use the private access modifier.',
                    'The variable type is int.',
                    'A compact class snippet is accepted.'
                ],
                answers: ['class Hero { private int hp; }', 'class Hero { private int hp;}', 'class Hero{ private int hp; }'],
                damage: 24,
                explanation: 'private int hp; restricts direct access to hp so it can only be used inside the same class.',
                concept: 'access_private_field',
                conceptTitle: 'private Fields',
                codexTitle: 'Bird - Hidden Vault'
            },
            {
                id: 'ch1_arena_bird_story_3',
                title: 'Access From Anywhere',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Bird cries over the cheering crowd.</em> Which Java access modifier makes a class or member accessible from anywhere?`,
                answerTip: 'Type only the modifier.',
                inputPlaceholder: 'Type the modifier',
                matchMode: 'exact',
                narrative: 'This is the direct vocabulary check for open access.',
                hints: [
                    'It is used in public class Hero { }.',
                    'It is the opposite of private in this lesson.',
                    'It has six letters.'
                ],
                answers: ['public'],
                damage: 24,
                explanation: 'public makes a class or member accessible from anywhere it is visible in the program.',
                concept: 'access_public',
                conceptTitle: 'The public Modifier',
                codexTitle: 'Bird - public Access'
            },
            {
                id: 'ch1_arena_bird_story_4',
                title: 'Same-Class Only',
                questionType: 'Short Answer',
                area,
                npc,
                question: `<em>The Bird shields its core behind a metallic crest.</em> Which Java access modifier restricts a field or method to the same class only?`,
                answerTip: 'Type only the modifier.',
                inputPlaceholder: 'Type the modifier',
                matchMode: 'exact',
                narrative: 'This is the lock on the other side of public.',
                hints: [
                    'It is commonly used for encapsulation.',
                    'Outside code cannot access the field directly.',
                    'It has seven letters.'
                ],
                answers: ['private'],
                damage: 24,
                explanation: 'private restricts access so that only the same class can use the member directly.',
                concept: 'access_private',
                conceptTitle: 'The private Modifier',
                codexTitle: 'Bird - private Access'
            },
            {
                id: 'ch1_arena_bird_story_5',
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
                concept: 'access_getter',
                conceptTitle: 'Basic Encapsulation',
                codexTitle: 'Bird - Guard The Core'
            }
        ];
    },

    getArenaBigBossChallenges() {
        const area = 'Arena of Heroes';
        const npc = 'Arena Sovereign';

        return [
            {
                id: 'ch1_arena_boss_story_1',
                title: 'Getter Forge',
                questionType: 'Code Completion',
                area,
                npc,
                question: `<em>The Arena Sovereign raises a locked steel hand.</em> Write a public getter method that returns an <code>int hp</code> field.`,
                answerTip: 'Type the full method.',
                inputPlaceholder: 'public int getHp(){ return hp; }',
                inputMode: 'code',
                matchMode: 'exact',
                narrative: 'The final arena battle starts by combining methods with access control.',
                hints: [
                    'The method must be public.',
                    'Its return type is int.',
                    'It should return hp.'
                ],
                answers: ['public int getHp(){ return hp; }', 'public int getHp() { return hp; }'],
                damage: 26,
                explanation: 'A getter is a public method that returns the value of a private field.',
                concept: 'boss_getter',
                conceptTitle: 'Getter Methods',
                codexTitle: 'Arena Sovereign - Getter Forge'
            },
            {
                id: 'ch1_arena_boss_story_2',
                title: 'Core Reading',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The sovereign presses a sealed crest into the ground.</em> What is printed by this code?`,
                code: `class Hero {
    private int hp = 12;

    public int getHp() {
        return hp;
    }
}

Hero h = new Hero();
System.out.println(h.getHp());`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'Now you read a private field through the correct public method.',
                hints: [
                    'hp starts at 12.',
                    'The getter method returns hp.',
                    'The printed value is the getter result.'
                ],
                answers: ['12'],
                damage: 26,
                explanation: 'getHp() returns the private field value 12, so the output is 12.',
                concept: 'boss_getter_output',
                conceptTitle: 'Getter Output',
                codexTitle: 'Arena Sovereign - Core Reading'
            },
            {
                id: 'ch1_arena_boss_story_3',
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
                    'Only the assignment line needs to change.'
                ],
                answers: ['this.name = name;'],
                damage: 28,
                explanation: 'this.name refers to the field, while name refers to the constructor parameter.',
                concept: 'boss_constructor_this',
                conceptTitle: 'Constructors And this',
                codexTitle: 'Arena Sovereign - Name The Core'
            },
            {
                id: 'ch1_arena_boss_story_4',
                type: 'multiple_choice',
                title: 'Choose The Shield',
                questionType: 'Multiple Choice',
                area,
                npc,
                question: `<em>The sovereign summons four false class fragments.</em> Which line correctly declares a private <code>int</code> field named <code>level</code>?`,
                narrative: 'This is the direct access-control check in the final arena fight.',
                hints: [
                    'The field type is int.',
                    'The access modifier must be private.',
                    'A field declaration ends with a semicolon.'
                ],
                choices: [
                    'private int level;',
                    'public level int;',
                    'int private level;',
                    'private level = int;'
                ],
                correctOption: 0,
                answers: ['private int level;'],
                damage: 26,
                explanation: 'private int level; is the correct Java field declaration using the private modifier.',
                concept: 'boss_private_field',
                conceptTitle: 'private Fields',
                codexTitle: 'Arena Sovereign - Choose The Shield'
            },
            {
                id: 'ch1_arena_boss_story_5',
                title: 'Charge The Guardian',
                questionType: 'Predict the Output',
                area,
                npc,
                question: `<em>The final phase begins.</em> Analyze this class and method flow. What is printed?`,
                code: `class Hero {
    private int level;

    Hero(int level) {
        this.level = level;
    }

    public void train() {
        level++;
    }

    public int getLevel() {
        return level;
    }
}

Hero h = new Hero(2);
h.train();
h.train();
System.out.println(h.getLevel());`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'The last arena question combines constructor use, methods, encapsulation, and state changes.',
                hints: [
                    'The hero starts at level 2.',
                    'train() increases level by 1 each time.',
                    'The getter prints the final level after two training calls.'
                ],
                answers: ['4'],
                damage: 32,
                explanation: 'The hero starts at 2, trains twice to reach 4, and getLevel() returns that final value.',
                concept: 'boss_encapsulation_flow',
                conceptTitle: 'Encapsulation And Methods',
                codexTitle: 'Arena Sovereign - Charge The Guardian'
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
