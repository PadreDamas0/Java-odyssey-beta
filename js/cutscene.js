/* ============================================
   JAVA ODYSSEY - Cutscene System
   Handles cinematic sequences with text and art
   ============================================ */

const Cutscene = {
    scenes: [],
    currentIndex: 0,
    isPlaying: false,
    onComplete: null,
    skipRequested: false,
    
    /**
     * Play a cutscene sequence
     * @param {Array} scenes - Array of cutscene frames
     * @param {Function} onComplete - Callback when cutscene ends
     * 
     * Scene frame format:
     * {
     *   art: 'ASCII art or art key',
     *   artClass: 'CSS class for art',
     *   text: 'Narrative text',
     *   duration: 3000, // ms to show (auto-advance)
     *   waitForClick: true, // wait for user click instead of auto
     *   fadeIn: true,
     *   fadeOut: true
     * }
     */
    async play(scenes, onComplete = null) {
        this.scenes = scenes;
        this.currentIndex = 0;
        this.isPlaying = true;
        this.onComplete = onComplete;
        this.skipRequested = false;
        
        const overlay = Utils.$('cutscene-overlay');
        overlay.style.display = 'flex';
        
        // Click to advance
        overlay.onclick = () => {
            if (this.isPlaying) {
                this.advanceFrame();
            }
        };
        
        await this.showFrame();
    },
    
    /**
     * Show current cutscene frame
     */
    async showFrame() {
        if (this.skipRequested || this.currentIndex >= this.scenes.length) {
            this.end();
            return;
        }
        
        const frame = this.scenes[this.currentIndex];
        const artEl = Utils.$('cutscene-art');
        const textEl = Utils.$('cutscene-text');
        
        // Reset
        artEl.classList.remove('visible');
        textEl.classList.remove('visible');
        artEl.textContent = '';
        textEl.innerHTML = '';
        
         // Show art
         if (frame.art) {
             const sceneArt = Assets.getSceneArt(frame.art);
             const resolvedArt = sceneArt || (typeof frame.art === 'string' ? frame.art : '');
             if (ASCII_ART[frame.art] && CONFIG.PLACEHOLDER_SPRITES) {
                 // Show ASCII art if using placeholders
                 artEl.textContent = ASCII_ART[frame.art];
                 artEl.style.backgroundImage = 'none';
             } else if (
                 typeof resolvedArt === 'string' &&
                 (/\.(png|jpg|jpeg)$/i.test(resolvedArt) || resolvedArt.startsWith('assets/'))
             ) {
                 // Show image if it's a file path
                 artEl.textContent = '';
                 artEl.style.backgroundImage = `url('${resolvedArt}')`;
                 artEl.style.backgroundSize = 'contain';
                 artEl.style.backgroundPosition = 'center';
                 artEl.style.backgroundRepeat = 'no-repeat';
                 artEl.style.minHeight = '400px';
             } else {
                 // Fallback to text if neither
                 artEl.textContent = frame.art;
                 artEl.style.backgroundImage = 'none';
             }
             
             if (frame.fadeIn !== false) {
                 await Utils.wait(300);
             }
             artEl.classList.add('visible');
         }
        
        // Show text
        if (frame.text) {
            await Utils.wait(500);
            textEl.classList.add('visible');
            await Utils.typeText(textEl, frame.text);
        }
        
        // Auto-advance or wait for click
        if (!frame.waitForClick && frame.duration) {
            await Utils.wait(frame.duration);
            if (!this.skipRequested) {
                this.currentIndex++;
                await this.showFrame();
            }
        }
        // If waitForClick, the click handler will call advanceFrame
    },
    
    /**
     * Advance to next frame
     */
    async advanceFrame() {
        // Skip typing if still typing
        const textEl = Utils.$('cutscene-text');
        if (textEl._isTyping && textEl._skipTyping) {
            textEl._skipTyping();
            return;
        }
        
        this.currentIndex++;
        
        // Fade out current
        const artEl = Utils.$('cutscene-art');
        artEl.classList.remove('visible');
        textEl.classList.remove('visible');
        
        await Utils.wait(500);
        await this.showFrame();
    },
    
    /**
     * Skip the entire cutscene
     */
    skip() {
        this.skipRequested = true;
        this.end();
    },
    
    /**
     * End the cutscene
     */
    async end() {
        this.isPlaying = false;
        
        const overlay = Utils.$('cutscene-overlay');
        await Utils.fadeOut(overlay, 500);
        overlay.onclick = null;
        
        this.scenes = [];
        this.currentIndex = 0;
        
        if (this.onComplete) {
            const cb = this.onComplete;
            this.onComplete = null;
            cb();
        }
    }
};
