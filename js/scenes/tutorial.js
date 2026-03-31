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
                id: 'tutorial_java_intro',
                type: 'multiple_choice',
                title: 'The First Oath',
                questionType: 'Multiple Choice',
                area: 'Dark Alley',
                npc: 'Cipher',
                question: `<em>Cipher steadies the portal.</em> Which statement best describes <code>Java</code>?`,
                narrative: 'The Syntax Bug lashes out. Understanding the language itself is your first defense.',
                hints: [
                    'Java is a programming language, not a database or operating system.',
                    'It is commonly described as high-level and object-oriented.',
                    'Pick the answer about building applications.'
                ],
                choices: [
                    'A high-level, object-oriented programming language used to build many kinds of applications.',
                    'A styling language used only to design web pages.',
                    'A database engine that stores rows and tables.',
                    'An operating system made only for mobile games.'
                ],
                correctOption: 0,
                answers: ['A high-level, object-oriented programming language used to build many kinds of applications.'],
                damage: 20,
                explanation: 'Java is a general-purpose, high-level programming language and is commonly taught as an object-oriented language.',
                concept: 'java_intro_language',
                conceptTitle: 'What Java Is',
                codexTitle: 'Tutorial - What Is Java?'
            },
            {
                id: 'tutorial_program_structure',
                title: 'Shape The Spell',
                questionType: 'True or False',
                area: 'Dark Alley',
                npc: 'Cipher',
                question: `<em>A rune tablet appears in the air.</em> True or false: <code>class FirstTrial { }</code> is a valid Java class declaration.`,
                answerTip: 'Type only true or false.',
                inputPlaceholder: 'Type true or false',
                matchMode: 'exact',
                narrative: 'The creature recoils. Confirm whether the cracked class shell is valid.',
                hints: [
                    'Java programs are organized into classes.',
                    'The keyword comes before the class name.',
                    'The braces form the class body.'
                ],
                answers: ['true'],
                damage: 18,
                explanation: 'A Java class declaration uses the class keyword, a class name, and braces to hold the class body.',
                concept: 'java_program_structure',
                conceptTitle: 'Structure Of A Java Program',
                codexTitle: 'Tutorial - Program Structure'
            },
            {
                id: 'tutorial_main_method',
                title: 'Awaken The Entry Rune',
                questionType: 'Fill in the Blank',
                area: 'Dark Alley',
                npc: 'Cipher',
                question: `<em>Cipher points to the spell that begins every true journey.</em> Fill in the blank: <code>public static void ____ (String[] args)</code>`,
                answerTip: 'Type only the missing method name.',
                inputPlaceholder: 'Type the missing method name',
                matchMode: 'exact',
                narrative: 'The Syntax Bug falters. Restore the missing entry point.',
                hints: [
                    'The main method is public, static, and void.',
                    'It uses String[] args as its parameter list.',
                    'The missing word is the method name.'
                ],
                answers: ['main', 'main()'],
                damage: 18,
                explanation: 'The standard Java entry point is public static void main(String[] args).',
                concept: 'java_main_method',
                conceptTitle: 'The main Method',
                codexTitle: 'Tutorial - The main Method'
            },
            {
                id: 'tutorial_print_statement',
                title: 'Speak The First Spell',
                questionType: 'Code Completion',
                area: 'Dark Alley',
                npc: 'Cipher',
                question: `<em>The final seal on the bug flickers.</em> Complete the missing method name so the line prints <code>"Hello, Java Realm!"</code>.`,
                code: 'System.out._______("Hello, Java Realm!");',
                answerTip: 'Type only the missing method name.',
                inputPlaceholder: 'Type the missing method name',
                matchMode: 'exact',
                narrative: 'The Syntax Bug lunges one last time. Complete the print spell and end the fight.',
                hints: [
                    'Use System.out.println().',
                    'The text must be inside double quotes.',
                    'The missing part prints a full line.'
                ],
                answers: ['println', 'println()'],
                damage: 20,
                explanation: 'System.out.println() prints a line of text, and String literals must be wrapped in double quotes.',
                concept: 'print_statement',
                conceptTitle: 'Printing Output',
                codexTitle: 'Tutorial - Printing Output'
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
