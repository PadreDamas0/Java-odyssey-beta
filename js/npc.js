/* ============================================
   JAVA ODYSSEY - Reusable NPC Interaction Data
   Keeps NPC data and interaction logic in one place
   ============================================ */

const NPCSystem = {
    promptText: 'E',
    promptBobSpeed: 0.008,
    promptBobAmount: 4,
    lastInteractDown: false,

    /**
     * NPC data lives here so adding more NPCs later is just a data change.
     */
    getPlatformerNpcDefinitions() {
        return [
            {
                id: 'elder-varion',
                role: 'elder',
                name: 'Elder Varion',
                relX: 0.22,
                interactionRange: 96,
                dialogue: 'Welcome, traveler. Our village has been waiting for you.',
                portrait: '👴',
                sprite: {
                    assetKey: 'npc_elder',
                    frameCount: 4,
                    frameWidth: 160,
                    frameHeight: 144,
                    cropX: 66,
                    cropY: 50,
                    cropWidth: 24,
                    cropHeight: 46,
                    drawWidth: 44,
                    drawHeight: 84
                }
            },
            {
                id: 'blacksmith',
                role: 'blacksmith',
                name: 'Blacksmith Brawn',
                relX: 0.5,
                interactionRange: 108,
                dialogue: 'If your gear is dull, bring it here. I can forge it stronger.',
                portrait: '⚒️',
                sprite: {
                    assetKey: 'npc_blacksmith',
                    frameCount: 7,
                    frameWidth: 96,
                    frameHeight: 96,
                    cropX: 8,
                    cropY: 22,
                    cropWidth: 68,
                    cropHeight: 58,
                    drawWidth: 86,
                    drawHeight: 74
                }
            },
            {
                id: 'rowan',
                role: 'rowan',
                name: 'Trainer Rowan',
                relX: 0.78,
                interactionRange: 96,
                dialogue: 'The forest hides many secrets. Stay alert on your journey.',
                portrait: '🧭',
                sprite: {
                    assetKey: 'npc_trainer',
                    frameCount: 4,
                    frameWidth: 160,
                    frameHeight: 144,
                    cropX: 66,
                    cropY: 50,
                    cropWidth: 24,
                    cropHeight: 46,
                    drawWidth: 44,
                    drawHeight: 84
                }
            }
        ];
    },

    createPlatformerNpcs(width, groundY) {
        return this.getPlatformerNpcDefinitions().map((definition, index) => ({
            ...definition,
            ...definition.sprite,
            x: Math.floor(width * definition.relX),
            y: groundY - definition.sprite.drawHeight,
            frame: index % definition.sprite.frameCount
        }));
    },

    isDialogueOpen() {
        return typeof GameState !== 'undefined' && !!(GameState.dialogue && GameState.dialogue.active);
    },

    /**
     * NPC interaction range is checked here. Only the nearest valid NPC can be used.
     */
    findNearestNpc(player, npcs) {
        if (!player || !npcs || npcs.length === 0) return null;

        const px = player.x + (player.w / 2);
        const py = player.y + (player.h / 2);
        let nearestNpc = null;
        let nearestDistance = Infinity;

        npcs.forEach((npc) => {
            const npcCenterY = npc.y + (npc.drawHeight / 2);
            const dx = px - npc.x;
            const dy = py - npcCenterY;
            const distance = Math.sqrt((dx * dx) + (dy * dy));

            if (distance <= npc.interactionRange && distance < nearestDistance) {
                nearestNpc = npc;
                nearestDistance = distance;
            }
        });

        return nearestNpc;
    },

    /**
     * Opening dialogue is centralized here so the platformer only needs to pass input state.
     */
    handleInteractionInput(keys, nearestNpc) {
        const interactDown = !!keys['KeyE'];

        if (!this.isDialogueOpen() && interactDown && !this.lastInteractDown && nearestNpc) {
            this.openDialogue(nearestNpc);
        }

        this.lastInteractDown = interactDown;
    },

    openDialogue(npc) {
        if (!npc || this.isDialogueOpen() || typeof Dialogue === 'undefined') return false;

        if (typeof Chapter1Scene !== 'undefined' && typeof GameState !== 'undefined' && GameState.phase === 'chapter1') {
            if (npc.role === 'elder' && typeof Chapter1Scene.talkToElder === 'function') {
                Chapter1Scene.talkToElder();
                return true;
            }
            if ((npc.role === 'rowan' || npc.role === 'trainer') && typeof Chapter1Scene.talkToTrainer === 'function') {
                Chapter1Scene.talkToTrainer();
                return true;
            }
            if (npc.role === 'blacksmith' && typeof Chapter1Scene.talkToBlacksmith === 'function') {
                Chapter1Scene.talkToBlacksmith();
                return true;
            }
            if (npc.role === 'hera' && typeof Chapter1Scene.talkToHera === 'function') {
                Chapter1Scene.talkToHera();
                return true;
            }
        }

        Dialogue.openNpcDialogue(npc);
        return true;
    },

    resetInputState() {
        this.lastInteractDown = false;
    }
};

if (typeof window !== 'undefined') {
    window.NPCSystem = NPCSystem;
}
