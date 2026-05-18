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
                id: 'tutorial_programming_1',
                type: 'multiple_choice',
                title: 'Initiation Trial',
                questionType: 'Multiple Choice',
                area: 'Dark Alley',
                npc: 'Cipher',
                question: `<em>Cipher opens the first lesson like a gate.</em> What is programming?`,
                narrative: 'The new tutorial starts with the most basic foundation: what programming actually is.',
                hints: [
                    'Think about what a programmer gives to a computer.',
                    'Programming is not just playing or storing files.',
                    'It is about instructions and logic.'
                ],
                choices: [
                    'Drawing pictures',
                    'Writing instructions for a computer',
                    'Playing games',
                    'Storing files'
                ],
                correctOption: 1,
                answers: ['Writing instructions for a computer'],
                damage: 12,
                explanation: 'Programming means writing instructions that tell a computer what to do.',
                concept: 'programming_concepts_intro',
                conceptTitle: 'What Programming Is',
                codexTitle: 'Tutorial - Initiation Trial'
            },
            {
                id: 'tutorial_programming_2',
                type: 'multiple_choice',
                title: 'Logic Path',
                questionType: 'Multiple Choice',
                area: 'Dark Alley',
                npc: 'Cipher',
                question: `<em>A second rune appears beneath your feet.</em> Which is the first step in problem solving?`,
                narrative: 'Before code comes planning.',
                hints: [
                    'Good code usually starts before typing.',
                    'You should understand the problem first.',
                    'Think preparation, not execution.'
                ],
                choices: [
                    'Coding',
                    'Planning',
                    'Running',
                    'Deleting'
                ],
                correctOption: 1,
                answers: ['Planning'],
                damage: 12,
                explanation: 'Planning is the first step in problem solving because it helps define the path before coding begins.',
                concept: 'programming_concepts_planning',
                conceptTitle: 'Planning Before Coding',
                codexTitle: 'Tutorial - Logic Path'
            },
            {
                id: 'tutorial_programming_3',
                type: 'multiple_choice',
                title: 'Algorithm Rune',
                questionType: 'Multiple Choice',
                area: 'Dark Alley',
                npc: 'Cipher',
                question: `<em>The third seal asks for precision.</em> An algorithm is:`,
                narrative: 'This is the core problem-solving idea behind all programming.',
                hints: [
                    'It is not a variable or a compiler.',
                    'An algorithm helps solve a problem in order.',
                    'Think step by step.'
                ],
                choices: [
                    'A Java variable',
                    'A step-by-step solution to a problem',
                    'A compiler',
                    'A loop'
                ],
                correctOption: 1,
                answers: ['A step-by-step solution to a problem'],
                damage: 12,
                explanation: 'An algorithm is a step-by-step solution used to solve a problem logically.',
                concept: 'programming_concepts_algorithm',
                conceptTitle: 'Algorithms',
                codexTitle: 'Tutorial - Algorithm Rune'
            },
            {
                id: 'tutorial_programming_4',
                type: 'multiple_choice',
                title: 'Flowchart Vision',
                questionType: 'Multiple Choice',
                area: 'Dark Alley',
                npc: 'Cipher',
                question: `<em>The final tutorial glyph unfolds into linked boxes and arrows.</em> A flowchart is used to:`,
                narrative: 'The first battle ends with visual problem solving.',
                hints: [
                    'A flowchart helps visualize logic.',
                    'It is not mainly for storing or compiling.',
                    'Think diagrams and steps.'
                ],
                choices: [
                    'Store data',
                    'Show program steps visually',
                    'Compile code',
                    'Delete errors'
                ],
                correctOption: 1,
                answers: ['Show program steps visually'],
                damage: 16,
                explanation: 'A flowchart shows the steps of a program or algorithm visually.',
                concept: 'programming_concepts_flowchart',
                conceptTitle: 'Flowcharts',
                codexTitle: 'Tutorial - Flowchart Vision'
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
