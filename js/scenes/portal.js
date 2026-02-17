/* ============================================
   JAVA ODYSSEY - Portal Transition Scene
   Transition from modern world to Java Realm
   ============================================ */

const PortalScene = {
    
    /**
     * Start the portal sequence
     */
    async start() {
        GameState.phase = 'portal';
        
        // Portal opening cutscene
        await this.portalCutscene();
        
        // Entering the portal
        await this.enterPortal();
                // ✅ CLEAR BUTTONS so player can't click again
        Utils.setActions([]);

        // ✅ PLAY PORTAL CUTSCENE
        await Cutscene.play([
            {
            speaker: 'narrator',
            name: 'Narrator',
            text: `<em>You step into the swirling vortex of luminous code...</em>`,
            portrait: '📖'
            }
            // (rest of your cutscene entries)
        ]);
        
        // Transition to Chapter 1
        await this.transitionToJavaRealm();
    },
    
    /**
     * Portal opening cutscene
     */
    async portalCutscene() {
        Utils.setSceneArt('darkAlley', 'modern-city');
        
        await Dialogue.start([
            {
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>Cipher raises his hands, and streams of glowing code begin to swirl in the air before you. The code fragments orbit faster and faster, forming a brilliant vortex of light.</em>`,
                portrait: '📖'
            },
            {
                speaker: 'mysterious',
                name: 'Cipher',
                text: `The portal is opening! On the other side lies the <span class="highlight">Java Realm</span> — a world that mirrors the structure of Java programming itself.`,
                portrait: '🕵️'
            },
            {
                speaker: 'mysterious',
                name: 'Cipher',
                text: `You'll arrive in the <span class="highlight">Village of Variables</span>, the first region. The people there will help you begin your training.`,
                portrait: '🕵️'
            },
            {
                speaker: 'mysterious',
                name: 'Cipher',
                text: `Remember what you learned today — <span class="code-inline">System.out.println()</span>, <span class="code-inline">int</span>, <span class="code-inline">String</span> — these are your first weapons. You'll learn many more.`,
                portrait: '🕵️'
            },
            {
                speaker: 'mysterious',
                name: 'Cipher',
                text: `I'll try to contact you when I can, but my power is fading. Seek out the <span class="highlight">Village Elder</span> when you arrive. They'll guide you.`,
                portrait: '🕵️'
            },
            {
                speaker: 'mysterious',
                name: 'Cipher',
                text: `One last thing — the creatures in the Java Realm are stronger than what you faced here. But so will you become. Trust in the code, ${GameState.player.name}.`,
                portrait: '🕵️'
            }
        ]);
        
        // Show portal art
        Utils.setSceneArt('portal', 'portal');
        Utils.setSceneText(`
            <div class="location-intro">✨ The Portal Opens ✨</div>
            <p class="narrator">A swirling vortex of luminous code materializes before you. Through its shimmering surface, 
            you can glimpse green fields, medieval buildings, and a world unlike anything you've ever seen.</p>
            <p class="narrator">The portal hums with energy, waiting for you to step through...</p>
        `);
        
        Utils.setActions([
        {
            label: 'Step into the Portal',
            icon: '🌀',
            primary: true,
            callback: () => {
            if (this._enterResolve) {
                const r = this._enterResolve;
                this._enterResolve = null;
                r(); // ✅ ito ang magpapatuloy sa PortalScene.start()
            }
            }
        }
        ]);

        
        // Wait for player to click
        await new Promise(resolve => {
            this._enterResolve = resolve;
            
        });
    },
    
    /**
     * Enter the portal
     */
    async enterPortal() {
        if (this._enterResolve) {
            const resolve = this._enterResolve;
            this._enterResolve = null;
            // Don't resolve yet, let the sequence play
        }
        
        Utils.setActions([]);
        
        // Fade out current music
        Audio.stopBgm(true);
        
        // Play portal video with music
        try {
            await Audio.playVideo('portalTransition', {
                loop: false,
                autoplay: true,
                onEnd: () => {
                    // Play menu music when video ends
                    Audio.playBgm('mainMenu', true);
                }
            });
        } catch (e) {
            console.warn('Portal video not available, skipping:', e);
            Audio.playBgm('mainMenu', true);
        }
        
        // Portal entry cutscene
        await Cutscene.play([
            {
                art: 'portal',
                text: `You take a deep breath and step into the swirling vortex of code...`,
                waitForClick: true
            },
            {
                art: `
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
    ░░▓▓▓▓░░░░░░░░░░░░░░░░▓▓▓▓░░░
    ░░░░▓▓▓▓░░░░░░░░░░░░▓▓▓▓░░░░░
    ░░░░░░▓▓▓▓░░░░░░░░▓▓▓▓░░░░░░░
    ░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░
    ░░░░░░░░░░▓▓▓▓▓▓▓▓░░░░░░░░░░░
    ░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░
    ░░░░░░▓▓▓▓░░░░░░░░▓▓▓▓░░░░░░░
    ░░░░▓▓▓▓░░░░░░░░░░░░▓▓▓▓░░░░░
    ░░▓▓▓▓░░░░░░░░░░░░░░░░▓▓▓▓░░░
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░`,
                text: `Reality warps around you. Streams of code rush past — variables, methods, classes — the building blocks of a digital universe.`,
                waitForClick: true
            },
            {
                art: '',
                text: `<em>For a moment, everything goes white...</em>`,
                duration: 2000
            },
            {
                art: '',
                text: `<em>...and then you feel solid ground beneath your feet. The smell of fresh grass fills your lungs. Birds are singing.</em>`,
                waitForClick: true
            }
        ]);
        
        GameState.setFlag('entered_portal');
        GameState.setFlag('reached_java_realm');
    },
    
    /**
     * Transition to Java Realm - Chapter 1
     */
    async transitionToJavaRealm() {
        // Chapter title card
        await Utils.showChapterTitle(
            '1',
            'The Village of Variables',
            'Welcome to the Java Realm'
        );
        
        GameState.progress.currentChapter = 1;
        GameState.progress.unlockedAreas.push('village-of-variables');
        
        // Add main quest
        GameState.addQuest({
            id: 'ch1_main',
            title: 'Restore the Prime Script of Variables',
            description: 'The Village of Variables is corrupted. Find the Village Elder and learn how to restore the Prime Script.'
        });
        
        // Start Chapter 1
        Chapter1Scene.start();
    }
};