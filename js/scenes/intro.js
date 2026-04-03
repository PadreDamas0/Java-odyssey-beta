/* ============================================
   JAVA ODYSSEY - Introduction Scene
   Modern world, MC is a CS student,
   mysterious character appears
   ============================================ */

const IntroScene = {
    
    /**
     * Start the introduction sequence
     */
    async start() {
        GameState.phase = 'intro';
        
        // Show game container
        Utils.showScreen('game-container');
        GameState.updateHUD();
        
        // Opening cutscene
        await this.openingCutscene();
        
        // Name input
        await this.nameInput();
        
        // Campus scene
        await this.campusScene();
        
        // Walking home - dark alley encounter
        await this.darkAlleyEncounter();
    },
    
    /**
     * Opening cutscene - sets the stage
     */
    async openingCutscene() {
        await Cutscene.play([
            {
                art: '',
                text: '<em>In a world where technology and code shape reality...</em>',
                waitForClick: true
            },
            {
                art: 'modernCity',
                text: 'The modern world hums with digital life. Smartphones, computers, and networks connect billions of people across the globe.',
                waitForClick: true
            },
            {
                art: 'modernCity',
                text: 'But beneath the surface of this digital world lies something deeper — the very fabric of code that holds everything together.',
                waitForClick: true
            },
            {
                art: 'campus',
                text: 'Our story begins at a university campus, where a young Computer Science student is about to have their life changed forever...',
                waitForClick: true
            }
        ]);
    },
    
    /**
     * Name input scene
     */
    nameInput() {
        const authenticatedUser = window.Auth && window.Auth.currentUser
            ? window.Auth.currentUser
            : null;

        if (authenticatedUser && authenticatedUser.username) {
            GameState.player.name = authenticatedUser.username;
            GameState.player.userId = authenticatedUser.userId;
            GameState.updateHUD();
            return Promise.resolve();
        }

        return new Promise(resolve => {
            Utils.setSceneArt('campus', 'modern-city');
            Utils.setSceneText(`
                <div class="location-intro">🏫 University Campus — CS Department</div>
                <p class="narrator">Another day of classes has ended. You step out of the Computer Science building, 
                your bag heavy with textbooks on Java programming.</p>
                <p>Before we continue, what is your name, aspiring Code Guardian?</p>
                <div class="name-input-container">
                    <input type="text" class="name-input" id="player-name-input" 
                           placeholder="Enter your name..." maxlength="20" autofocus>
                    <button class="menu-btn" id="name-submit-btn" onclick="IntroScene.submitName()">
                        Confirm Name
                    </button>
                </div>
            `);
            
            Utils.setActions([]);
            
            // Store resolve for the submit handler
            this._nameResolve = resolve;
            
            // Focus input and handle Enter key
            setTimeout(() => {
                const input = Utils.$('player-name-input');
                if (input) {
                    input.focus();
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            this.submitName();
                        }
                    });
                }
            }, 100);
        });
    },
    
    /**
     * Handle name submission
     */
    submitName() {
        const input = Utils.$('player-name-input');
        const name = input ? input.value.trim() : '';
        
        if (!name) {
            input.style.borderColor = 'var(--accent-red)';
            input.placeholder = 'Please enter a name!';
            return;
        }
        
        GameState.player.name = name;
        GameState.updateHUD();
        
        if (this._nameResolve) {
            const resolve = this._nameResolve;
            this._nameResolve = null;
            resolve();
        }
    },
    
    /**
     * Campus scene - establishing the MC
     */
    async campusScene() {
        // Play modern world music
        Audio.playBgm('modernWorld', true);
        
        Utils.setSceneArt('campus', 'modern-city');
        Utils.setSceneText(`
            <div class="location-intro">🏫 University Campus — Evening</div>
            <p class="narrator">The sun is setting over the campus. Students are heading home after a long day of lectures.</p>
        `);
        
        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>${GameState.player.name} walks out of the CS building, stretching after a long Java programming lecture.</em>`,
                portrait: '📖'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `*yawns* That was a tough lecture on Java basics... Variables, data types, print statements... My brain is fried.`,
                portrait: '🧑‍💻'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `I should head home and review my notes. The exam is coming up and I still need to practice coding...`,
                portrait: '🧑‍💻'
            },
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>As ${GameState.player.name} walks across the campus grounds, the streetlights begin to flicker strangely...</em>`,
                portrait: '📖'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `Huh? That's weird... The lights are acting up. Must be an electrical issue.`,
                portrait: '🧑‍💻'
            },
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>A strange static noise fills the air. Your phone screen glitches momentarily, displaying garbled code before returning to normal.</em>`,
                portrait: '📖'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `What the—?! My phone just glitched out! Is there some kind of interference?`,
                portrait: '🧑‍💻'
            }
        ]);
        
        // Transition to walking home
        await Utils.showTransition('Walking home...', 1500);
    },
    
    /**
     * Dark alley encounter - mysterious character appears
     */
    async darkAlleyEncounter() {
        // Play dark alley music
        Audio.playBgm('darkAlley', true);
        
        Utils.setSceneArt('darkAlley', 'modern-city');
        Utils.setSceneText(`
            <div class="location-intro">🌙 Dark Alley — Night</div>
            <p class="narrator">Taking a shortcut through a dimly lit alley, you notice something unusual. 
            The shadows seem to move on their own, and the air crackles with an unseen energy.</p>
        `);
        
        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>Suddenly, a figure materializes from the shadows - a hooded stranger crackling with digital energy. Their form seems to glitch in and out of reality.</em>`,
                portrait: '📖'
            },
            {
                speaker: 'mysterious',
                name: '???',
                text: `You there... You can see me? *coughs* Please... I need your help...`,
                portrait: '🕵️'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `W-What?! Who are you?! How did you just appear out of nowhere?!`,
                portrait: '🧑‍💻'
            },
            {
                speaker: 'mysterious',
                name: '???',
                text: `There's no time to explain everything... I am a <span class="highlight">Code Guardian</span> from another realm — the <span class="highlight">Java Realm</span>.`,
                portrait: '🕵️'
            },
            {
                speaker: 'mysterious',
                name: '???',
                text: `Our world is built upon <span class="highlight">Prime Scripts</span> — the fundamental code that governs all of reality. But they've been <span class="highlight">corrupted</span>...`,
                portrait: '🕵️'
            },
            {
                speaker: 'mysterious',
                name: '???',
                text: `The corruption is spreading... It's already reaching into your world. Those glitches you saw? That was just the beginning.`,
                portrait: '🕵️'
            },
            {
                speaker: 'player',
                name: GameState.player.name,
                text: `The glitching lights... my phone... That was because of this "corruption"?`,
                portrait: '🧑‍💻'
            },
            {
                speaker: 'mysterious',
                name: '???',
                text: `Yes! And it's getting worse. The corrupted code is spawning <span class="highlight">digital creatures</span> — bugs, glitches, errors made manifest. They're already here in your world!`,
                portrait: '🕵️'
            },
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>As if on cue, the shadows at the end of the alley begin to writhe and twist. Strange, pixelated creatures emerge from the darkness — their bodies made of corrupted code.</em>`,
                portrait: '📖'
            },
            {
                speaker: 'mysterious',
                name: '???',
                text: `They're here! Listen — the only way to fight these creatures is with <span class="highlight">clear Java thinking</span>. Sometimes you'll write code, sometimes you'll read it, debug it, or predict what it does.`,
                portrait: '🕵️'
            },
            {
                speaker: 'mysterious',
                name: '???',
                text: `You're a programming student, right? I can sense it. You have the potential to be a <span class="highlight">Code Guardian</span>. Will you help me fight them off?`,
                portrait: '🕵️'
            }
        ]);
        
        // Choice: Help or not (but both lead to helping)
        const choice = await Dialogue.askChoice(
            'player',
            GameState.player.name,
            'The creatures are approaching! What do you do?',
            [
                { text: "I'll help! Tell me what to do!", value: 'brave' },
                { text: "This is crazy... but I can't just run away!", value: 'reluctant' }
            ],
            '🧑‍💻'
        );
        
        if (choice && choice.value === 'brave') {
            await Dialogue.quick('mysterious', '???', 
                `That's the spirit! You have the heart of a true Guardian! Now, let me teach you the basics of <span class="highlight">Code Combat</span>!`,
                '🕵️');
        } else {
            await Dialogue.quick('mysterious', '???', 
                `Your courage speaks louder than your fear! Don't worry — I'll guide you through this. Let me teach you <span class="highlight">Code Combat</span>!`,
                '🕵️');
        }
        
        // Tutorial explanation
        await Dialogue.start([
            {
                speaker: 'mysterious',
                name: '???',
                text: `Listen carefully! To defeat these corrupted creatures, you need to write <span class="highlight">correct Java code</span>. Each creature has a weakness — a coding challenge you must solve!`,
                portrait: '🕵️'
            },
            {
                speaker: 'mysterious',
                name: '???',
                text: `When you see a challenge, <span class="highlight">type the correct answer or Java code</span> in the panel and press <span class="code-inline">Submit Answer</span> to attack!`,
                portrait: '🕵️'
            },
            {
                speaker: 'mysterious',
                name: '???',
                text: `If you're stuck, you can use <span class="highlight">Hints</span> — but using hints will reduce your damage. Try to solve challenges on your first attempt for maximum power!`,
                portrait: '🕵️'
            },
            {
                speaker: 'mysterious',
                name: '???',
                text: `Ready? Here they come! Remember — clean Java logic is what purifies the corruption!`,
                portrait: '🕵️'
            }
        ]);
        
        // Set flag and transition to tutorial combat
        GameState.setFlag('intro_complete');
        GameState.setFlag('met_mysterious');
        
        // Add quest
        GameState.addQuest({
            id: 'tutorial_fight',
            title: 'First Code Combat',
            description: 'Defeat the Syntax Bugs attacking in the alley using Java code.'
        });
        
        // Start tutorial combat
        TutorialScene.startTutorialCombat();
    }
};
