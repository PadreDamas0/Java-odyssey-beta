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
            hp: 36,
            maxHp: 36,
            coinReward: 40,
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
                id: 'tutorial_variable_int',
                title: 'Gold Storage',
                questionType: 'Code Completion',
                area: 'Dark Alley',
                npc: 'Cipher',
                question: `<em>Cipher sketches a glowing inventory rune.</em> Which Java line declares an <code>int</code> variable named <code>gold</code> with the value <code>100</code>?`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'int gold = 100;',
                inputMode: 'code',
                narrative: 'The tutorial now starts with the most basic weapon in Java: declaring a variable.',
                hints: [
                    'Use int for a whole number.',
                    'The variable name must be gold.',
                    'Full answer: int gold = 100;'
                ],
                answers: ['int gold = 100;'],
                damage: 12,
                explanation: 'int gold = 100; declares an integer variable named gold and stores the value 100.',
                concept: 'variables_int',
                conceptTitle: 'Integer Variables',
                codexTitle: 'Tutorial - Gold Storage'
            },
            {
                id: 'tutorial_variable_string',
                title: 'Hero Name',
                questionType: 'Code Completion',
                area: 'Dark Alley',
                npc: 'Cipher',
                question: `<em>The next rune glows with your identity.</em> Which Java line stores <code>"Rowan"</code> in a variable named <code>hero</code>?`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'String hero = "Rowan";',
                inputMode: 'code',
                narrative: 'After whole numbers comes text. Java stores text with String variables.',
                hints: [
                    'Use String with a capital S.',
                    'Text values need double quotes.',
                    'Full answer: String hero = "Rowan";'
                ],
                answers: ['String hero = "Rowan";'],
                damage: 12,
                explanation: 'String hero = "Rowan"; stores a text value inside a String variable.',
                concept: 'variables_string',
                conceptTitle: 'String Variables',
                codexTitle: 'Tutorial - Hero Name'
            },
            {
                id: 'tutorial_variable_boolean',
                title: 'Battle Flag',
                questionType: 'Code Completion',
                area: 'Dark Alley',
                npc: 'Cipher',
                question: `<em>Cipher raises a shield sigil.</em> Which line declares a <code>boolean</code> variable named <code>ready</code> and sets it to <code>true</code>?`,
                answerTip: 'Type the full Java line.',
                inputPlaceholder: 'boolean ready = true;',
                inputMode: 'code',
                narrative: 'The third lesson is true-or-false state. Java uses boolean for that.',
                hints: [
                    'Use boolean for true or false values.',
                    'true is lowercase in Java.',
                    'Full answer: boolean ready = true;'
                ],
                answers: ['boolean ready = true;'],
                damage: 12,
                explanation: 'boolean ready = true; creates a boolean variable and stores a true value in it.',
                concept: 'variables_boolean',
                conceptTitle: 'boolean Variables',
                codexTitle: 'Tutorial - Battle Flag'
            },
            {
                id: 'tutorial_variable_print',
                title: 'Torch Message',
                questionType: 'Code Completion',
                area: 'Dark Alley',
                npc: 'Cipher',
                question: `<em>The alley darkens for a moment.</em> Type the Java command that will print <code>Torch Lit</code>.`,
                answerTip: 'Type the full print command. Semicolon is accepted but optional here.',
                inputPlaceholder: 'System.out.println("Torch Lit");',
                inputMode: 'code',
                narrative: 'Now you use a variable lesson together with output: clean Java still needs correct printing.',
                hints: [
                    'Printing text starts with System.out.println.',
                    'Torch Lit must be inside double quotes.',
                    'Full answer: System.out.println("Torch Lit");'
                ],
                answers: [
                    'System.out.println("Torch Lit");',
                    'System.out.println("Torch Lit")'
                ],
                damage: 12,
                explanation: 'System.out.println("Torch Lit"); prints the text Torch Lit on its own line.',
                concept: 'variables_print',
                conceptTitle: 'Printing Output',
                codexTitle: 'Tutorial - Torch Message'
            },
            {
                id: 'tutorial_variable_output',
                title: 'Print The Gold',
                questionType: 'Predict the Output',
                area: 'Dark Alley',
                npc: 'Cipher',
                question: `<em>The Syntax Bug flickers as one final rune appears.</em> What is printed by this code?`,
                code: `int gold = 50;
System.out.println(gold);`,
                answerTip: 'Type only the output.',
                inputPlaceholder: 'Type the exact output',
                matchMode: 'exact',
                narrative: 'The tutorial ends by reading a variable and predicting its printed value.',
                hints: [
                    'gold stores the whole number 50.',
                    'System.out.println prints the value inside the parentheses.',
                    'The output is just the number.'
                ],
                answers: ['50'],
                damage: 16,
                explanation: 'The variable gold contains 50, so printing gold outputs 50.',
                concept: 'variables_output',
                conceptTitle: 'Printing Variable Values',
                codexTitle: 'Tutorial - Print The Gold'
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
            <div class="location-intro">Dark Alley - After the Battle</div>
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
                text: `My name is <span class="highlight">Cipher</span>. I am - or was - a senior Code Guardian of the Java Realm.`,
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
                text: `Without the Prime Scripts, the Java Realm will collapse. And when it does... the corruption will flood into every connected world - including yours.`,
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
                text: `By restoring the corrupted Prime Scripts in each region, you'll save the Java Realm - and protect your own world in the process.`,
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
            await Dialogue.quick(
                'mysterious',
                'Cipher',
                `Courage isn't the absence of fear - it's acting despite it. You'll make a fine Guardian, ${GameState.player.name}.`,
                '🕵️'
            );
        } else {
            await Dialogue.quick(
                'mysterious',
                'Cipher',
                `That determination... Yes, you are exactly what the Java Realm needs. Let's go!`,
                '🕵️'
            );
        }

        GameState.setFlag('accepted_quest');

        // Transition to portal scene
        PortalScene.start();
    }
};
