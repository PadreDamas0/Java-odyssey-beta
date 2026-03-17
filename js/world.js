/* ============================================
   JAVA ODYSSEY - World/Scene Management
   Handles scene transitions, exploration,
   NPC interactions, and navigation
   ============================================ */

const World = {
    currentScene: null,
    scenes: {},
    
    /**
     * Register a scene
     */
    registerScene(id, sceneData) {
        this.scenes[id] = sceneData;
    },
    
    /**
     * Load and display a scene
     * @param {string} sceneId - Scene identifier
     * @param {Object} options - Additional options
     */
    async loadScene(sceneId, options = {}) {
        const scene = this.scenes[sceneId];
        if (!scene) {
            console.error(`Scene not found: ${sceneId}`);
            return;
        }
        
        this.currentScene = sceneId;
        GameState.progress.currentScene = sceneId;

        const gameContainer = Utils.$('game-container');
        const phaserContainer = Utils.$('phaser-container');
        const isFullScreenMap = Boolean(scene.fullScreenMap);
        // If hidePhaser is explicitly set, use that; otherwise default to hiding for fullScreenMap
        const hidePhaser = scene.hidePhaser !== undefined ? scene.hidePhaser : isFullScreenMap;
        if (gameContainer) {
            gameContainer.classList.toggle('fullscreen-map-mode', isFullScreenMap);
        }
        if (phaserContainer) {
            phaserContainer.style.display = hidePhaser ? 'none' : 'block';
        }
        
        // Show transition if requested
        if (options.transition) {
            await Utils.showTransition(options.transitionText || '...', options.transitionDuration || 1500);
        }
        
        // Update HUD location
        const locationEl = Utils.$('hud-location');
        if (locationEl && scene.locationName) {
            locationEl.textContent = scene.locationName;
        }
        
        // Show world display
        Utils.show('world-display');
        Utils.hide('combat-interface');
        Utils.hide('dialogue-box');

        // Reset scroll so top area (Phaser canvas) is always visible on scene entry
        const worldDisplay = Utils.$('world-display');
        if (worldDisplay) worldDisplay.scrollTop = 0;
        
        // Set scene art
        if (scene.art) {
            Utils.setSceneArt(scene.art, scene.artClass || '');
        }
        
        // Set scene description
        Utils.setSceneText(scene.description || '');
        
        // Set actions
        if (scene.actions) {
            Utils.setActions(scene.actions);
        } else {
            Utils.setActions([]);
        }

        // Avoid stacking the same map image behind the platformer canvas.
        // Chapter 1 platformer scenes already draw their own background inside Platformer.
        if (worldDisplay) {
            worldDisplay.style.background = 'var(--bg-darker)';
        }

        // Chapter 1 scenes use the platformer canvas (replaces Phaser for the village platformer)
        // Reuse phaserContainer from above
        if (sceneId.startsWith('ch1_')) {
            const sceneArt = Utils.$('scene-art');

            if (phaserContainer) phaserContainer.style.display = 'block';
            if (sceneArt) sceneArt.style.display = 'none';

            if (Platformer && typeof Platformer.start === 'function') {
                Platformer.start('phaser-container');
            }

        } else {
            // Ensure platformer is stopped when leaving Chapter 1
            // Reuse phaserContainer from above
            if (phaserContainer) phaserContainer.style.display = 'none';
            if (Platformer && typeof Platformer.stop === 'function' && Platformer.running) {
                Platformer.stop();
            }
        }
        
        // Run scene's onEnter function
        if (scene.onEnter) {
            await scene.onEnter(options);
        }
    },
    
    /**
     * Add interactive elements to current scene
     */
    addInteraction(type, label, callback) {
        const descEl = Utils.$('scene-description');
        if (!descEl) return;
        
        const marker = document.createElement('span');
        marker.className = type === 'npc' ? 'npc-indicator' : 'location-marker';
        marker.textContent = label;
        marker.onclick = callback;
        
        descEl.appendChild(document.createElement('br'));
        descEl.appendChild(marker);
    },
    
    /**
     * Update scene actions
     */
    updateActions(actions) {
        Utils.setActions(actions);
    },
    
    /**
     * Append text to scene description
     */
    appendText(html) {
        const descEl = Utils.$('scene-description');
        if (descEl) {
            descEl.innerHTML += html;
            Utils.scrollSceneToBottom();
        }
    },
    
    /**
     * Clear and set new scene text
     */
    setText(html) {
        Utils.setSceneText(html);
    },
    
    /**
     * Navigate to a connected scene
     */
    async goTo(sceneId, transitionText = null) {
        await this.loadScene(sceneId, {
            transition: true,
            transitionText: transitionText || 'Traveling...'
        });
    }
};

// Ensure World is available globally (for scripts that check window.World)
if (typeof window !== 'undefined') {
    window.World = World;
}
