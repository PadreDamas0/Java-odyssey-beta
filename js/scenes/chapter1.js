/* ============================================
   JAVA ODYSSEY - Chapter 1: Village of Variables
   Medieval world, green grasses, village
   Focus: Variables, Data Types, Basic I/O
   ============================================ */

const Chapter1Scene = {
    
    /**
     * Start Chapter 1
     */
    async start() {
        GameState.phase = 'chapter1';

        // ✅ make sure the game UI is visible
        Utils.showScreen('game-container');

        // ✅ START PHASER (movement) ONCE when Chapter 1 starts
        if (CONFIG.ENABLE_PHASER_WORLD) {
            PhaserWorld.start();
        }

        // Register all Chapter 1 scenes
        this.registerScenes();

        // Start at village entrance
        await this.villageEntrance();
    },
    
    /**
     * Register all scenes for this chapter
     */
    registerScenes() {
        // Village Entrance
        World.registerScene('ch1_entrance', {
            locationName: 'Village of Variables — Entrance',
            art: 'medievalVillage',
            artClass: 'medieval-village',
            description: `
                <div class="location-intro">🏰 Village of Variables — Entrance</div>
                <p class="narrator">You stand at the entrance of a quaint medieval village. Thatched-roof cottages line 
                cobblestone streets, and villagers go about their daily routines. However, something is clearly wrong — 
                some buildings flicker like broken holograms, and strange glitchy artifacts float in the air.</p>
            `,
            actions: [
                { label: 'Enter Village', icon: '🏘️', primary: true, callback: () => World.goTo('ch1_village_square', 'Entering the village...') },
                { label: 'Look Around', icon: '👀', callback: () => Chapter1Scene.lookAroundEntrance() }
            ]
        });
        
        // Village Square
        World.registerScene('ch1_village_square', {
            locationName: 'Village of Variables — Square',
            art: 'medievalVillage',
            artClass: 'medieval-village',
            description: `
                <div class="location-intro">⛲ Village Square</div>
                <p class="narrator">The village square is the heart of the settlement. A stone fountain stands in the center, 
                though its water flows erratically — sometimes upward, sometimes freezing mid-air. Villagers gather in small groups, 
                whispering worriedly about the corruption.</p>
            `,
            actions: [
                { label: 'Talk to Elder', icon: '👴', primary: true, callback: () => Chapter1Scene.walkToNpcThenTalk('elder', () => Chapter1Scene.talkToElder()) },
                { label: 'Talk to Villager', icon: '👨‍🌾', callback: () => Chapter1Scene.walkToNpcThenTalk('villager', () => Chapter1Scene.talkToVillager()) },
                { label: 'Visit Training Grounds', icon: '⚔️', callback: () => World.goTo('ch1_training', 'Walking to the training grounds...') },
                { label: 'Explore Forest Path', icon: '🌲', callback: () => Chapter1Scene.tryForest() }
            ]
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
        if (GameState.hasFlag('ch1_elder_talked') && GameState.hasFlag('ch1_training_complete')) {
            // After training, elder gives new info
            await this.elderPostTraining();
            return;
        }
        
        if (GameState.hasFlag('ch1_elder_talked')) {
            await Dialogue.quick('elder', 'Elder Varion',
                `Have you completed your training at the Training Grounds yet, ${GameState.player.name}? You'll need those skills to face the corruption in the forest.`,
                '👴');
            return;
        }
        
        GameState.setFlag('ch1_elder_talked');
        
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
                text: `Go to the <span class="highlight">Training Grounds</span> east of the square. Practice your coding skills there before venturing into the forest.`,
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
            title: 'Training Grounds Practice',
            description: 'Complete the coding challenges at the Training Grounds to prepare for the Corrupted Forest.'
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
     * Try to enter forest before training
     */
    async tryForest() {
        if (!GameState.hasFlag('ch1_training_complete')) {
            await Dialogue.quick('narrator', 'Narrator',
                `<em>The path to the forest is blocked by a barrier of corrupted code. You'll need to complete your training at the Training Grounds before you can pass through.</em>`,
                '📖');
            return;
        }
        
        await World.goTo('ch1_forest', 'Venturing into the forest...');
    },
    
    /**
     * Training Grounds - coding practice
     */
    async startTraining() {
        if (GameState.hasFlag('ch1_training_complete')) {
            await Dialogue.quick('narrator', 'Narrator',
                `<em>You've already completed the training. The corrupted forest awaits!</em>`,
                '📖');
            return;
        }
        
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
                text: `You're ready to face the <span class="highlight">Corrupted Forest</span>. The Prime Script fragment is guarded by a powerful creature — the <span class="highlight">Data Glitch</span>.`,
                portrait: '👴'
            },
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `The Data Glitch corrupts variable types — it turns integers into strings, booleans into nulls. You'll need all your knowledge to defeat it.`,
                portrait: '👴'
            },
            {
                speaker: 'elder',
                name: 'Elder Varion',
                text: `Go north to the forest. May the clean code guide your way, Guardian.`,
                portrait: '👴'
            }
        ]);
        
        // Update quest
        GameState.addQuest({
            id: 'ch1_forest_quest',
            title: 'Defeat the Data Glitch',
            description: 'Enter the Corrupted Forest and defeat the Data Glitch to recover the Prime Script fragment.'
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
    }
};



