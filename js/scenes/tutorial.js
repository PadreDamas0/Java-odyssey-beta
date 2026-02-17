/* ============================================
   JAVA ODYSSEY - Tutorial Scene
   First combat encounter (tutorial fight)
   Basic Java coding challenges
   ============================================ */

const TutorialScene = {
    
    /**
     * Start the tutorial combat
     */
    async startTutorialCombat() {
        GameState.phase = 'tutorial';
        
        // Play battle music
        Audio.playBgm('battle', true);
        
        // Define the tutorial enemy
        const enemy = {
            name: 'Syntax Bug',
            hp: 75,
            maxHp: 75,
            art: 'enemyBug',
            description: 'A corrupted creature born from broken code. It feeds on syntax errors!',
            reward: {
                name: 'Bug Fragment',
                icon: '🔮',
                description: 'A crystallized piece of purified code from a defeated Syntax Bug.'
            }
        };
        
        // Define tutorial challenges (very basic Java)
        const challenges = this.getTutorialChallenges();
        
        // Start combat
        Combat.start(enemy, challenges, () => this.onTutorialVictory());
    },
    
    /**
     * Get tutorial challenges based on difficulty
     */
    getTutorialChallenges() {
        return [
            {
                id: 'tutorial_print',
                prompt: `
                    <span class="challenge-title">⚔️ Challenge: Hello World!</span>
                    <p>The Syntax Bug is vulnerable to the most basic Java spell!</p>
                    <p>Write a Java statement that prints <strong>"Hello World"</strong> to the console.</p>
                    <p><em>Complete the code:</em></p>
                    <pre>______________________</pre>
                `,
                narrative: 'The Syntax Bug lunges at you! Quick, cast the Hello World spell!',
                hints: [
                    'In Java, we use System.out.println() to print text to the console.',
                    'The text inside println() should be wrapped in double quotes: "Hello World"',
                    'The full statement is: System.out.println("Hello World");'
                ],
                answers: [
                    'System.out.println("Hello World");',
                    'System.out.println("Hello World")',
                    'system.out.println("Hello World");',
                    'System.out.println( "Hello World" );',
                    'System.out.print("Hello World");'
                ],
                damage: 25,
                explanation: 'System.out.println() is the standard way to print text to the console in Java. The text must be enclosed in double quotes.',
                concept: 'print_statement',
                conceptTitle: 'Print Statements (System.out.println)'
            },
            {
                id: 'tutorial_variable',
                prompt: `
                    <span class="challenge-title">⚔️ Challenge: Declare a Variable!</span>
                    <p>The bug is weakening! Strike it with a variable declaration!</p>
                    <p>Declare an <strong>integer variable</strong> named <code>hp</code> and set it to <strong>100</strong>.</p>
                    <pre>______________________</pre>
                `,
                narrative: 'The Syntax Bug staggers! Declare a variable to deal another blow!',
                hints: [
                    'In Java, to declare an integer variable, use the keyword "int".',
                    'The syntax is: int variableName = value;',
                    'The answer is: int hp = 100;'
                ],
                answers: [
                    'int hp = 100;',
                    'int hp=100;',
                    'int hp = 100'
                ],
                damage: 25,
                explanation: 'In Java, "int" is used to declare integer variables. The syntax is: int variableName = value;',
                concept: 'variables_int',
                conceptTitle: 'Integer Variables (int)'
            },
            {
                id: 'tutorial_string',
                prompt: `
                    <span class="challenge-title">⚔️ Challenge: String Declaration!</span>
                    <p>One more hit should finish it! Declare a String!</p>
                    <p>Declare a <strong>String variable</strong> named <code>name</code> and set it to <strong>"Guardian"</strong>.</p>
                    <pre>______________________</pre>
                `,
                narrative: 'The Syntax Bug is almost defeated! Finish it with a String declaration!',
                hints: [
                    'In Java, String is a data type for text. Note: String starts with a capital S.',
                    'The syntax is: String variableName = "text value";',
                    'The answer is: String name = "Guardian";'
                ],
                answers: [
                    'String name = "Guardian";',
                    'String name="Guardian";',
                    'String name = "Guardian"'
                ],
                damage: 25,
                explanation: 'String is a reference type in Java used to store text. It always starts with a capital "S" and text values are enclosed in double quotes.',
                concept: 'variables_string',
                conceptTitle: 'String Variables'
            }
        ];
    },
    
    /**
     * Handle tutorial victory
     */
    async onTutorialVictory() {
        GameState.completeQuest('tutorial_fight');
        GameState.setFlag('tutorial_complete');
        
        // Show world display again
        Utils.show('world-display');
        Utils.setSceneArt('darkAlley', 'modern-city');
        Utils.setSceneText(`
            <div class="location-intro">🌙 Dark Alley — After the Battle</div>
            <p class="narrator">The corrupted creature dissolves into streams of purified code that dissipate into the night air. 
            The alley returns to its normal, quiet state.</p>
        `);
        
        await Dialogue.start([
            {
                speaker: 'mysterious',
                name: '???',
                text: `Incredible! You did it! You have a natural talent for code combat, ${GameState.player.name}!`,
                portrait: '🕵️'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `That was... actually kind of amazing! I used Java code to fight that thing?!`,
                portrait: '🧑‍💻'
            },
            {
                speaker: 'mysterious',
                name: '???',
                text: `Yes! Clean, correct code is the most powerful weapon against corruption. And you wielded it well for a beginner!`,
                portrait: '🕵️'
            },
            {
                speaker: 'mysterious',
                name: '???',
                text: `My name is <span class="highlight">Cipher</span>. I am — or was — a senior Code Guardian of the Java Realm.`,
                portrait: '🕵️'
            },
            {
                speaker: 'mysterious',
                name: 'Cipher',
                text: `The corruption that spawned that creature... it's just a tiny fraction of what's happening in my world. The <span class="highlight">Prime Scripts</span> are failing.`,
                portrait: '🕵️'
            },
            {
                speaker: 'mysterious',
                name: 'Cipher',
                text: `Without the Prime Scripts, the Java Realm will collapse. And when it does... the corruption will flood into every connected world — including yours.`,
                portrait: '🕵️'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `That sounds... really bad. What can we do about it?`,
                portrait: '🧑‍💻'
            },
            {
                speaker: 'mysterious',
                name: 'Cipher',
                text: `I'm too weakened to fight anymore. But you... you have the potential. I can open a <span class="highlight">portal</span> to the Java Realm.`,
                portrait: '🕵️'
            },
            {
                speaker: 'mysterious',
                name: 'Cipher',
                text: `There, you can learn to become a true Code Guardian. You'll need to travel through different regions, each one teaching you deeper Java concepts.`,
                portrait: '🕵️'
            },
            {
                speaker: 'mysterious',
                name: 'Cipher',
                text: `By restoring the corrupted Prime Scripts in each region, you'll save the Java Realm — and protect your own world in the process.`,
                portrait: '🕵️'
            }
        ]);
        
        // Choice to enter portal
        const choice = await Dialogue.askChoice(
            'mysterious',
            'Cipher',
            `I can open the portal now. ${GameState.player.name}... <span class="highlight">can you save the multiverse?</span>`,
            [
                { text: "I'll do it. Open the portal!", value: 'ready' },
                { text: "I'm scared... but I'll try. For both our worlds.", value: 'nervous' }
            ],
            '🕵️'
        );
        
        if (choice && choice.value === 'nervous') {
            await Dialogue.quick('mysterious', 'Cipher',
                `Courage isn't the absence of fear — it's acting despite it. You'll make a fine Guardian, ${GameState.player.name}.`,
                '🕵️');
        } else {
            await Dialogue.quick('mysterious', 'Cipher',
                `That determination... Yes, you are exactly what the Java Realm needs. Let's go!`,
                '🕵️');
        }
        
        GameState.setFlag('accepted_quest');
        
        // Transition to portal scene
        PortalScene.start();
    }
};