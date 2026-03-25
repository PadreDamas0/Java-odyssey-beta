/* ============================================
   JAVA ODYSSEY - Dialogue System
   Handles all character dialogues, choices,
   and narrative text display
   ============================================ */

const Dialogue = {
    queue: [],
    currentIndex: 0,
    isTyping: false,
    callback: null,
    choiceCallback: null,
    keyboardBound: false,

    getSafePortrait(entry) {
        const fallbackPortraits = {
            narrator: '📜',
            player: '🧑‍💻',
            elder: '👴',
            trainer: '🥋',
            blacksmith: '🛠️',
            villager: '👨‍🌾',
            hera: '🧝',
            goblin: '👹',
            mysterious: '🕵️',
            npc: '💬'
        };

        const rawPortrait = typeof entry?.portrait === 'string'
            ? entry.portrait.trim()
            : '';
        const assetPortrait = (typeof Assets !== 'undefined' && typeof Assets.getPortrait === 'function')
            ? Assets.getPortrait(entry?.speaker)
            : '';
        const fallbackPortrait = assetPortrait || fallbackPortraits[entry?.speaker] || '?';

        if (!rawPortrait) {
            return fallbackPortrait;
        }

        return /[ÃðâÂ]/.test(rawPortrait) ? fallbackPortrait : rawPortrait;
    },
    
    isCorruptedText(value) {
        return typeof value === 'string' && /(?:\u00C3|\u00F0|\u00E2|\u00C2)/.test(value);
    },

    resolvePortrait(entry) {
        const fallbackPortraits = {
            narrator: '\u{1F4DC}',
            player: '\u{1F9D1}\u200D\u{1F4BB}',
            elder: '\u{1F474}',
            trainer: '\u{1F94B}',
            blacksmith: '\u{1F6E0}\uFE0F',
            villager: '\u{1F468}\u200D\u{1F33E}',
            hera: '\u{1F9DD}',
            goblin: '\u{1F479}',
            mysterious: '\u{1F575}\uFE0F',
            npc: '\u{1F4AC}'
        };

        const rawPortrait = typeof entry?.portrait === 'string'
            ? entry.portrait.trim()
            : '';
        const assetPortrait = (typeof Assets !== 'undefined' && typeof Assets.getPortrait === 'function')
            ? Assets.getPortrait(entry?.speaker)
            : '';
        const safeAssetPortrait = this.isCorruptedText(assetPortrait) ? '' : assetPortrait;
        const fallbackPortrait = safeAssetPortrait || fallbackPortraits[entry?.speaker] || '?';

        if (!rawPortrait) {
            return fallbackPortrait;
        }

        return this.isCorruptedText(rawPortrait) ? fallbackPortrait : rawPortrait;
    },

    /**
     * Start a dialogue sequence
     * @param {Array} dialogues - Array of dialogue objects
     * @param {Function} onComplete - Callback when all dialogues are done
     * 
     * Dialogue object format:
     * {
     *   speaker: 'character_id',
     *   name: 'Display Name',
     *   text: 'Dialogue text with <span class="highlight">highlights</span>',
     *   portrait: 'emoji or image path',
     *   choices: [ { text: 'Choice 1', value: 'choice1' }, ... ] // optional
     * }
     */
    start(dialogues, onComplete = null) {
        return new Promise((resolve) => {
            this.ensureKeyboardControls();
            this.queue = dialogues;
            this.currentIndex = 0;
            // Wrap the callback to resolve the promise
            this.callback = () => {
                if (onComplete) onComplete();
                resolve();
            };
            this.choiceCallback = null;
            
            GameState.dialogue.active = true;
            
            const box = Utils.$('dialogue-box');
            if (box) {
                box.style.display = 'flex';
                
                // Set up click handler for advancing dialogue
                box.onclick = (e) => {
                    // Don't advance if clicking on choices
                    if (e.target.classList.contains('dialogue-choice')) return;
                    this.advance();
                };
            }
            
            this.showCurrent();
        });
    },
    
    /**
     * Show the current dialogue entry
     */
    async showCurrent() {
        if (this.currentIndex >= this.queue.length) {
            this.end();
            return;
        }
        
        const entry = this.queue[this.currentIndex];
        const nameEl = Utils.$('dialogue-name');
        const textEl = Utils.$('dialogue-text');
        const portraitEl = Utils.$('portrait-img');
        const continueEl = Utils.$('dialogue-continue');
        const choicesEl = Utils.$('dialogue-choices');
        const dialogueBox = Utils.$('dialogue-box');
        const isLastEntry = this.currentIndex >= this.queue.length - 1;
        
        try {
            // Handle Cipher centered portrait display with defensive checks
            const centeredPortraitDisplay = Utils.$('centered-portrait-display');
            const centeredPortraitImg = Utils.$('centered-portrait-img');
            
            if (centeredPortraitDisplay && centeredPortraitImg) {
                if (entry.speaker === 'mysterious') {
                    // Cipher is talking - show talk image
                    centeredPortraitDisplay.style.display = 'block';
                    centeredPortraitImg.src = 'assets/npcs/cipher_talk.png';
                    if (dialogueBox) dialogueBox.classList.add('with-centered-portrait');
                } else if (entry.speaker === 'player' && GameState.getFlag && GameState.getFlag('met_mysterious')) {
                    // Player is talking after meeting Cipher - show idle image
                    centeredPortraitDisplay.style.display = 'block';
                    centeredPortraitImg.src = 'assets/npcs/cipher_idle.png';
                    if (dialogueBox) dialogueBox.classList.add('with-centered-portrait');
                } else if (entry.speaker === 'narrator' && GameState.getFlag && GameState.getFlag('met_mysterious')) {
                    // Narrator is talking after meeting Cipher - show idle image
                    centeredPortraitDisplay.style.display = 'block';
                    centeredPortraitImg.src = 'assets/npcs/cipher_idle.png';
                    if (dialogueBox) dialogueBox.classList.add('with-centered-portrait');
                } else {
                    // Haven't met Cipher yet or not relevant, hide centered portrait
                    centeredPortraitDisplay.style.display = 'none';
                    if (dialogueBox) dialogueBox.classList.remove('with-centered-portrait');
                }
            }
        } catch (e) {
            console.warn('Centered portrait error:', e);
        }
        
        // Set portrait
        if (entry.portrait) {
            portraitEl.textContent = this.resolvePortrait(entry);
        } else {
            portraitEl.textContent = Assets.getPortrait(entry.speaker) || '❓';
        }
        
        // Set name
        nameEl.textContent = entry.name || entry.speaker || '???';
        
        // Dialogue UI is rendered here in the shared bottom-screen box.
        continueEl.style.display = 'none';
        choicesEl.style.display = 'none';
        choicesEl.innerHTML = '';
        continueEl.textContent = isLastEntry
            ? 'Press E or Enter to close • ESC to close'
            : 'Press E or Enter to continue • ESC to close';
        
        // Type the text
        this.isTyping = true;
        await Utils.typeText(textEl, entry.text);
        this.isTyping = false;
        
        // Show choices if available
        if (entry.choices && entry.choices.length > 0) {
            this.showChoices(entry.choices);
        } else {
            continueEl.style.display = 'block';
        }
    },
    
    /**
     * Show dialogue choices
     */
    showChoices(choices) {
        const choicesEl = Utils.$('dialogue-choices');
        choicesEl.innerHTML = '';
        choicesEl.style.display = 'flex';
        
        choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.className = 'dialogue-choice';
            btn.innerHTML = `<span class="choice-marker">${index + 1}.</span> ${choice.text}`;
            btn.onclick = (e) => {
                e.stopPropagation();
                this.selectChoice(choice);
            };
            choicesEl.appendChild(btn);
        });
    },
    
    /**
     * Handle choice selection
     */
    selectChoice(choice) {
        const choicesEl = Utils.$('dialogue-choices');
        choicesEl.style.display = 'none';
        
        // Store choice in state if needed
        if (choice.flag) {
            GameState.setFlag(choice.flag, choice.value !== undefined ? choice.value : true);
        }
        
        // If choice has a callback
        if (choice.callback) {
            choice.callback(choice);
        }
        
        // If choice has follow-up dialogues
        if (choice.followUp) {
            // Insert follow-up dialogues after current
            this.queue.splice(this.currentIndex + 1, 0, ...choice.followUp);
        }
        
        // Advance to next
        this.currentIndex++;
        this.showCurrent();
    },
    
    /**
     * Advance to next dialogue
     */
    advance() {
        if (this.isTyping) {
            // Skip typing animation
            const textEl = Utils.$('dialogue-text');
            if (textEl._isTyping && textEl._skipTyping) {
                textEl._skipTyping();
            }
            return;
        }
        
        // Check if current entry has choices (don't auto-advance)
        const entry = this.queue[this.currentIndex];
        if (entry && entry.choices && entry.choices.length > 0) {
            return; // Wait for choice selection
        }
        
        this.currentIndex++;
        this.showCurrent();
    },

    close() {
        if (!GameState.dialogue.active) return;
        this.end();
    },

    ensureKeyboardControls() {
        if (this.keyboardBound) return;

        window.addEventListener('keydown', (e) => {
            if (!GameState.dialogue.active || e.repeat) return;

            if (e.code === 'KeyE' || e.code === 'Enter') {
                e.preventDefault();
                this.advance();
            } else if (e.code === 'Escape') {
                e.preventDefault();
                this.close();
            }
        });

        this.keyboardBound = true;
    },

    openNpcDialogue(npc) {
        if (!npc) return Promise.resolve();

        return this.start([
            {
                speaker: 'npc',
                name: npc.name,
                text: npc.dialogue,
                portrait: npc.portrait || '💬'
            }
        ]);
    },
    
    /**
     * End the dialogue sequence
     */
    end() {
        GameState.dialogue.active = false;
        const box = Utils.$('dialogue-box');
        
        if (box) {
            box.style.display = 'none';
            box.onclick = null;
            box.classList.remove('with-centered-portrait');
        }
        
        const centeredPortraitDisplay = Utils.$('centered-portrait-display');
        if (centeredPortraitDisplay) {
            centeredPortraitDisplay.style.display = 'none';
        }
        
        this.queue = [];
        this.currentIndex = 0;
        this.isTyping = false;
        
        if (this.callback) {
            const cb = this.callback;
            this.callback = null;
            cb();
        }
    },
    
    /**
     * Quick dialogue - show a single message
     */
    quick(speaker, name, text, portrait = null) {
        return new Promise(resolve => {
            this.start([{
                speaker,
                name,
                text,
                portrait
            }], resolve);
        });
    },
    
    /**
     * Narrator text - no portrait
     */
    narrate(text) {
        return new Promise(resolve => {
            this.start([{
                speaker: 'narrator',
                name: 'Narrator',
                text: `<em>${text}</em>`,
                portrait: '📖'
            }], resolve);
        });
    },
    
    /**
     * Show a choice dialogue and return the selected choice
     */
    askChoice(speaker, name, text, choices, portrait = null) {
        return new Promise(resolve => {
            const dialogueEntry = {
                speaker,
                name,
                text,
                portrait,
                choices: choices.map(c => ({
                    ...c,
                    callback: () => resolve(c)
                }))
            };
            
            this.start([dialogueEntry], () => {
                // If dialogue ends without choice (shouldn't happen), resolve with null
                resolve(null);
            });
        });
    }
};

if (typeof window !== 'undefined') {
    window.Dialogue = Dialogue;
}
