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
        
        // Set scene art
        if (scene.art) {
            Utils.setSceneArt(scene.art, scene.artClass || '');
        }
        
        // Set scene description
        if (scene.description) {
            Utils.setSceneText(scene.description);
        }
        
        // Set actions
        if (scene.actions) {
            Utils.setActions(scene.actions);
        } else {
            Utils.setActions([]);
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