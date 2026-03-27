/* ============================================
   JAVA ODYSSEY - Asset Management
   Placeholder system for sprites, maps, sounds
   ============================================ */

const Assets = {
    // Image placeholders - replace paths with actual sprite files
    images: {
        // Character Sprites (replace with actual image paths)
        player: {
            idle: 'assets/sprites/player/idle.png',
            walk: 'assets/sprites/player/walk.png',
            attack: 'assets/sprites/player/attack.png',
            portrait: 'assets/sprites/player/portrait.png'
        },
        
        // NPC Sprites
        npcs: {
            mentor: {
                idle: 'assets/sprites/npcs/mentor_idle.png',
                portrait: 'assets/sprites/npcs/mentor_portrait.png'
            },
            mysterious: {
                idle: 'assets/sprites/npcs/mysterious_idle.png',
                portrait: 'assets/sprites/npcs/mysterious_portrait.png'
            },
            villageElder: {
                idle: 'assets/sprites/npcs/elder_idle.png',
                portrait: 'assets/sprites/npcs/elder_portrait.png'
            },
            villager1: {
                idle: 'assets/sprites/npcs/villager1_idle.png',
                portrait: 'assets/sprites/npcs/villager1_portrait.png'
            },
            villager2: {
                idle: 'assets/sprites/npcs/villager2_idle.png',
                portrait: 'assets/sprites/npcs/villager2_portrait.png'
            }
        },
        
        // Enemy Sprites
        enemies: {
            syntaxBug: {
                idle: 'assets/sprites/enemies/syntax_bug.png',
                hurt: 'assets/sprites/enemies/syntax_bug_hurt.png',
                defeated: 'assets/sprites/enemies/syntax_bug_defeated.png'
            },
            dataGlitch: {
                idle: 'assets/sprites/enemies/data_glitch.png',
                hurt: 'assets/sprites/enemies/data_glitch_hurt.png',
                defeated: 'assets/sprites/enemies/data_glitch_defeated.png'
            },
            nullPointer: {
                idle: 'assets/sprites/enemies/null_pointer.png',
                hurt: 'assets/sprites/enemies/null_pointer_hurt.png',
                defeated: 'assets/sprites/enemies/null_pointer_defeated.png'
            },
            corruptedScript: {
                idle: 'assets/sprites/enemies/corrupted_script.png',
                hurt: 'assets/sprites/enemies/corrupted_script_hurt.png',
                defeated: 'assets/sprites/enemies/corrupted_script_defeated.png'
            }
        },
        
        // Background/Map Images
        backgrounds: {
            mainMenu: 'assets/backgrounds/main_menu.png',
            modernCity: 'assets/backgrounds/modern_city.png',
            campus: 'assets/backgrounds/campus.jpg',
            darkAlley: 'assets/backgrounds/dark_alley.jpg',
            portal: 'assets/backgrounds/portal.jpg',
            medievalVillage: 'assets/backgrounds/medieval_village.png',
            forestPath: 'assets/backgrounds/forest_path.png',
            villageSquare: 'assets/backgrounds/village_square.png',
            trainingGrounds: 'assets/backgrounds/training_grounds.png'
        },
        
        // UI Elements
        ui: {
            dialogueBox: 'assets/ui/dialogue_box.png',
            hpBar: 'assets/ui/hp_bar.png',
            xpBar: 'assets/ui/xp_bar.png',
            buttonFrame: 'assets/ui/button_frame.png',
            inventorySlot: 'assets/ui/inventory_slot.png'
        }
    },
    
    // Videos
    videos: {
        portalTransition: 'assets/videos/portal.mp4'
    },
    
    // Sound placeholders
    sounds: {
        bgm: {
            mainMenu: 'assets/audio/bgm/main_menu.mp3',
            modernWorld: 'assets/audio/bgm/modern_world.mp3',
            darkAlley: 'assets/audio/bgm/dark_alley.mp3',
            battle: 'assets/audio/bgm/battle.mp3',
            medievalVillage: 'assets/audio/bgm/medieval_village.mp3',
            forest: 'assets/audio/bgm/forest.mp3',
            victory: 'assets/audio/bgm/victory.mp3'
        },
        sfx: {
            click: 'assets/audio/sfx/click.mp3',
            textType: 'assets/audio/sfx/text_type.mp3',
            codeCorrect: 'assets/audio/sfx/code_correct.mp3',
            codeError: 'assets/audio/sfx/code_error.mp3',
            enemyHit: 'assets/audio/sfx/enemy_hit.mp3',
            enemyDefeat: 'assets/audio/sfx/enemy_defeat.mp3',
            levelUp: 'assets/audio/sfx/level_up.mp3',
            questComplete: 'assets/audio/sfx/quest_complete.mp3',
            portalOpen: 'assets/audio/sfx/portal_open.mp3',
            notification: 'assets/audio/sfx/notification.mp3'
        }
    },
    
    // Loaded assets cache
    loaded: {},
    
    /**
     * Simulate loading assets (since we're using placeholders)
     * In production, this would actually load images/sounds
     */
    async loadAll(progressCallback) {
        const totalAssets = 20; // Simulated count
        let loaded = 0;
        
        const loadingMessages = [
            'Initializing Java Realm...',
            'Loading Prime Scripts...',
            'Summoning Code Guardians...',
            'Preparing challenges...',
            'Calibrating difficulty engine...',
            'Loading character sprites...',
            'Rendering medieval landscapes...',
            'Compiling quest data...',
            'Establishing portal connections...',
            'Ready to begin your journey...'
        ];
        
        for (let i = 0; i < totalAssets; i++) {
            await Utils.wait(100 + Math.random() * 150);
            loaded++;
            const progress = (loaded / totalAssets) * 100;
            const msgIndex = Math.floor((loaded / totalAssets) * (loadingMessages.length - 1));
            
            if (progressCallback) {
                progressCallback(progress, loadingMessages[msgIndex]);
            }
        }
    },
    
    /**
     * Get portrait for a character (returns emoji placeholder or image path)
     */
    getPortrait(characterId) {
        // If actual images are loaded, return image path
        // For now, return emoji placeholder
        return PORTRAITS[characterId] || '❓';
    },
    
    /**
     * Get scene background (returns ASCII art or image path)
     */
    getSceneArt(sceneId) {
        if (CONFIG.PLACEHOLDER_SPRITES) {
            return ASCII_ART[sceneId] || '';
        }
        return this.images.backgrounds[sceneId] || '';
    },
    
    /**
     * Get enemy art
     */
    getEnemyArt(enemyId, state = 'idle') {
        if (typeof enemyId === 'string' && /\.(png|jpg|jpeg|gif|svg)$/i.test(enemyId)) {
            return enemyId;
        }

        // Map art keys from enemy objects to Assets enemy ids
        const artToIdMap = {
            'enemyBug': 'syntaxBug',
            'enemyGlitch': 'dataGlitch',
            'enemyNull': 'nullPointer',
            'enemyCorrupted': 'corruptedScript'
        };
        
        // If using art key, convert to id
        const mappedId = artToIdMap[enemyId] || enemyId;
        
        if (CONFIG.PLACEHOLDER_SPRITES) {
            return ASCII_ART[mappedId] || ASCII_ART.enemyBug;
        }
        const enemyImages = this.images.enemies[mappedId];
        if (!enemyImages) {
            return '';
        }

        return enemyImages[state] || enemyImages.idle || '';
    }
};
