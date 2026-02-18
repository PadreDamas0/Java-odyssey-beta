/* ============================================
   JAVA ODYSSEY - Utility Functions
   ============================================ */

const Utils = {
    /**
     * Get a DOM element by ID
     */
    $(id) {
        return document.getElementById(id);
    },

    /**
     * Show a screen by ID, hide all others
     */
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        const screen = this.$(screenId);
        if (screen) {
            screen.classList.add('active');
            screen.style.display = 'flex';
        }
    },

    /**
     * Show an element
     */
    show(elementOrId) {
        const el = typeof elementOrId === 'string' ? this.$(elementOrId) : elementOrId;
        if (el) el.style.display = el.dataset.display || 'flex';
    },

    /**
     * Hide an element
     */
    hide(elementOrId) {
        const el = typeof elementOrId === 'string' ? this.$(elementOrId) : elementOrId;
        if (el) el.style.display = 'none';
    },

    /**
     * Type text character by character (typewriter effect)
     * Returns a promise that resolves when typing is complete
     */
    typeText(element, text, speed = null) {
        return new Promise((resolve) => {
            const textSpeed = speed || CONFIG.TEXT_SPEED[GameState.settings.textSpeed || 'normal'];
            element.innerHTML = '';
            let i = 0;
            let isSkipped = false;
            let displayContent = '';
            element._isTyping = true;

            // Store skip function on element for external access
            element._skipTyping = () => {
                if (!element._isTyping) return; // Already done
                isSkipped = true;
                element._isTyping = false;
                element.innerHTML = text;
                resolve();
            };

            function type() {
                if (isSkipped) return;
                if (i < text.length) {
                    // Handle HTML tags - add them all at once
                    if (text[i] === '<') {
                        const closeIndex = text.indexOf('>', i);
                        if (closeIndex !== -1) {
                            displayContent += text.substring(i, closeIndex + 1);
                            i = closeIndex + 1;
                        } else {
                            displayContent += text[i];
                            i++;
                        }
                    } else {
                        displayContent += text[i];
                        i++;
                    }
                    element.innerHTML = displayContent;
                    setTimeout(type, textSpeed);
                } else {
                    element._isTyping = false;
                    delete element._skipTyping;
                    resolve();
                }
            }
            type();
        });
    },

    /**
     * Wait for a specified duration
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Fade in an element
     */
    fadeIn(element, duration = 500) {
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.display = element.dataset.display || 'flex';
            element.style.transition = `opacity ${duration}ms ease`;
            requestAnimationFrame(() => {
                element.style.opacity = '1';
                setTimeout(resolve, duration);
            });
        });
    },

    /**
     * Fade out an element
     */
    fadeOut(element, duration = 500) {
        return new Promise(resolve => {
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '0';
            setTimeout(() => {
                element.style.display = 'none';
                element.style.opacity = '1';
                resolve();
            }, duration);
        });
    },

    /**
     * Show a notification
     */
    notify(message, type = 'default', duration = 3000) {
        const area = this.$('notification-area');
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        notif.textContent = message;
        area.appendChild(notif);
        
        setTimeout(() => {
            if (notif.parentNode) {
                notif.remove();
            }
        }, duration);
    },

    /**
     * Show a transition screen with text
     */
    async showTransition(text, duration = 2000) {
        const overlay = this.$('transition-overlay');
        const content = this.$('transition-content');
        content.innerHTML = text;
        overlay.style.display = 'flex';
        overlay.style.opacity = '0';
        
        await this.fadeIn(overlay, 500);
        await this.wait(duration);
        await this.fadeOut(overlay, 500);
    },

    /**
     * Show chapter title card
     */
    async showChapterTitle(number, name, subtitle = '') {
        const overlay = this.$('transition-overlay');
        const content = this.$('transition-content');
        content.innerHTML = `
            <div class="chapter-title-display" style="position:relative;background:transparent;">
                <div class="chapter-number">Chapter ${number}</div>
                <div class="chapter-name">${name}</div>
                ${subtitle ? `<div class="chapter-subtitle">${subtitle}</div>` : ''}
            </div>
        `;
        overlay.style.display = 'flex';
        overlay.style.opacity = '0';
        
        await this.fadeIn(overlay, 1000);
        await this.wait(3000);
        await this.fadeOut(overlay, 1000);
    },

    /**
     * Normalize code string for comparison
     */
    normalizeCode(code) {
        return code
            .replace(/\s+/g, ' ')
            .replace(/\s*;\s*/g, ';')
            .replace(/\s*\{\s*/g, '{')
            .replace(/\s*\}\s*/g, '}')
            .replace(/\s*\(\s*/g, '(')
            .replace(/\s*\)\s*/g, ')')
            .replace(/\s*=\s*/g, '=')
            .replace(/\s*,\s*/g, ',')
            .trim()
            .toLowerCase();
    },

    /**
     * Check if user code matches expected answer
     * Supports multiple valid answers
     */
    checkCode(userCode, validAnswers) {
        const normalized = this.normalizeCode(userCode);
        
        if (Array.isArray(validAnswers)) {
            return validAnswers.some(answer => {
                const normalizedAnswer = this.normalizeCode(answer);
                return normalized === normalizedAnswer || 
                       normalized.includes(normalizedAnswer) ||
                       normalizedAnswer.includes(normalized);
            });
        }
        
        const normalizedAnswer = this.normalizeCode(validAnswers);
        return normalized === normalizedAnswer || 
               normalized.includes(normalizedAnswer) ||
               normalizedAnswer.includes(normalized);
    },

    /**
     * Partial code match - returns similarity score 0-1
     */
    codeSimilarity(userCode, expectedCode) {
        const user = this.normalizeCode(userCode);
        const expected = this.normalizeCode(expectedCode);
        
        if (user === expected) return 1;
        
        // Check for key tokens
        const expectedTokens = expected.split(/[^a-zA-Z0-9_]+/).filter(t => t.length > 0);
        const userTokens = user.split(/[^a-zA-Z0-9_]+/).filter(t => t.length > 0);
        
        let matches = 0;
        expectedTokens.forEach(token => {
            if (userTokens.includes(token)) matches++;
        });
        
        return expectedTokens.length > 0 ? matches / expectedTokens.length : 0;
    },

    /**
     * Generate floating code particles for menu background
     */
    generateCodeParticles() {
        const container = this.$('code-particles');
        if (!container) return;
        
        const codeSnippets = [
            'public class', 'void main()', 'int x = 0;', 'String name',
            'if (true)', 'for (i=0)', 'while ()', 'return;',
            'System.out.println()', 'new Object()', 'boolean flag',
            'double pi = 3.14', 'char c', 'import java.util',
            'try { } catch', 'extends', 'implements', 'static',
            'private', 'public', 'protected', 'final',
            'class Guardian', 'void attack()', 'int hp = 100'
        ];
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'code-particle';
            particle.textContent = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (15 + Math.random() * 20) + 's';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.fontSize = (0.6 + Math.random() * 0.4) + 'rem';
            container.appendChild(particle);
        }
    },

    /**
     * Update line numbers in code editor
     */
    updateLineNumbers(textarea) {
        const lineNumbers = this.$('code-line-numbers');
        if (!lineNumbers || !textarea) return;
        
        const lines = textarea.value.split('\n').length;
        let nums = '';
        for (let i = 1; i <= Math.max(lines, 1); i++) {
            nums += i + '\n';
        }
        lineNumbers.textContent = nums.trim();
    },

    /**
     * Save data to localStorage
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('Failed to save:', e);
            return false;
        }
    },

    /**
     * Load data from localStorage
     */
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('Failed to load:', e);
            return null;
        }
    },

    /**
     * Create action buttons dynamically
     */
    setActions(actions) {
        const area = this.$('action-area');
        const container = this.$('action-buttons');
        container.innerHTML = '';
        
        if (actions.length === 0) {
            area.style.display = 'none';
            return;
        }
        
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = `action-btn ${action.primary ? 'primary' : ''}`;
            btn.innerHTML = action.icon ? `<span class="btn-emoji">${action.icon}</span>${action.label}` : action.label;
            btn.onclick = action.callback;
            container.appendChild(btn);
        });
        
        area.style.display = 'block';
    },

     /**
      * Set scene art (ASCII or placeholder for image)
      */
     setSceneArt(artKey, cssClass = '') {
         const artEl = this.$('scene-art');
         if (!artEl) return;
         
         artEl.className = 'scene-art ' + cssClass;
         artEl.style.minHeight = '';
         artEl.style.backgroundImage = 'none';
         
         const sceneArt = Assets.getSceneArt(artKey) || '';
         const isImagePath = /\.(png|jpe?g|webp|gif)$/i.test(sceneArt);
         if (ASCII_ART[artKey] && CONFIG.PLACEHOLDER_SPRITES) {
             // Show ASCII art if using placeholders
             artEl.textContent = ASCII_ART[artKey];
         } else if (isImagePath) {
             // Show image if available, otherwise fallback to ASCII/text label
             const img = new Image();
             img.onload = () => {
                 artEl.textContent = '';
                 artEl.style.backgroundImage = `url('${sceneArt}')`;
                 artEl.style.backgroundSize = 'contain';
                 artEl.style.backgroundPosition = 'center';
                 artEl.style.backgroundRepeat = 'no-repeat';
                 artEl.style.minHeight = '400px';
             };
             img.onerror = () => {
                 if (ASCII_ART[artKey]) {
                     artEl.textContent = ASCII_ART[artKey];
                 } else {
                     artEl.textContent = `[Missing scene art: ${artKey}]`;
                 }
             };
             img.src = sceneArt;
         } else {
             // Fallback to text if neither
             artEl.textContent = artKey;
         }
     },

    /**
     * Set scene description text
     */
    setSceneText(html) {
        const descEl = this.$('scene-description');
        if (descEl) descEl.innerHTML = html;
    },

    /**
     * Scroll scene description to bottom
     */
    scrollSceneToBottom() {
        const display = this.$('world-display');
        if (display) {
            display.scrollTop = display.scrollHeight;
        }
    }
};
