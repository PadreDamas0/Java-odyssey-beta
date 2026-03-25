/* ============================================
   Simple Canvas Platformer (replacement for Phaser in Chapter 1)
   ============================================ */

const Platformer = {
  containerId: 'phaser-container',
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  running: false,
  lastTimestamp: 0,
  keys: {},
  assets: {},
  npcs: [],
  nearestNpc: null,
  frameTimer: 0,
  npcFrameTimer: 0,
  assetsLoaded: false,
  assetsLoadingPromise: null,
  currentSceneId: null,
  currentMap: null,
  exitPrompt: {
    active: false,
    lock: false,
    zone: null
  },
  exitSuppressedUntil: 0,
  movementLocked: false,
  autoWalk: null,
  player: {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    w: 48,
    h: 64,
    renderW: 68,
    renderH: 92,
    dir: 1,
    state: 'idle',
    frame: 0
  },
  constants: {
    gravity: 1600,
    moveSpeed: 280,
    jumpVelocity: -700,
    referenceHeight: 768,
    groundOffset: 210,
    groundBaselineLift: 5,
    animationSpeed: 90,
    npcAnimationSpeed: 180
  },

  init(containerId) {
    if (containerId) this.containerId = containerId;
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Create canvas if missing
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.display = 'block';
      this.canvas.style.pointerEvents = 'none'; // allow UI click-through
      container.style.position = 'relative';
      container.style.backgroundImage = 'none';
      container.style.backgroundColor = 'transparent';
      container.style.color = 'transparent';
      container.innerHTML = '';
      container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;

      // Input
      window.addEventListener('keydown', (e) => (this.keys[e.code] = true));
      window.addEventListener('keyup', (e) => (this.keys[e.code] = false));

      window.addEventListener('resize', () => this.resize());

      // Keep canvas appropriately sized when container resizes (e.g., when UI changes)
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(container);
      }
    }

    this.resize();
  },

  getSceneConfig(sceneId) {
    const heraDefinition = {
      id: 'hera',
      role: 'hera',
      name: 'Hera',
      relX: 0.52,
      interactionRange: 104,
      dialogue: 'Please, Guardian... a goblin is blocking the deeper forest path.',
      portrait: '🧝',
      sprite: {
        assetKey: 'npc_hera',
        frameCount: 6,
        frameWidth: 128,
        frameHeight: 128,
        cropX: 0,
        cropY: 0,
        cropWidth: 84,
        cropHeight: 128,
        drawWidth: 64,
        drawHeight: 96
      }
    };

    const goblinDefinition = {
      id: 'forest-goblin',
      role: 'goblin',
      name: 'Corrupted Goblin',
      relX: 0.52,
      interactionRange: 120,
      dialogue: 'Arrrrggh... me kill everyone!',
      portrait: '👹',
      sprite: {
        assetKey: 'enemy_goblin_idle',
        frameCount: 4,
        frameWidth: 150,
        frameHeight: 150,
        cropX: 0,
        cropY: 0,
        cropWidth: 150,
        cropHeight: 150,
        drawWidth: 86,
        drawHeight: 86
      }
    };

    const abandonedGoblinDefinition = {
      id: 'abandoned-goblin',
      role: 'abandoned_goblin',
      name: 'Village Goblin',
      relX: 0.52,
      interactionRange: 120,
      dialogue: 'Raaagh! No heroes past this place!',
      portrait: '👹',
      sprite: {
        assetKey: 'enemy_goblin_idle',
        frameCount: 4,
        frameWidth: 150,
        frameHeight: 150,
        cropX: 0,
        cropY: 0,
        cropWidth: 150,
        cropHeight: 150,
        drawWidth: 104,
        drawHeight: 104
      }
    };

    const caveHeraDefinition = {
      ...heraDefinition,
      id: 'cave-hera',
      role: 'cave_hera',
      relX: 0.16,
      dialogue: `Good, you're here. I'm sensing the fragment is in that cave.`
    };

    const caveEntryDefinition = {
      id: 'cave-entry',
      role: 'cave_entry',
      name: '',
      relX: 0.53,
      interactionRange: 88,
      hidden: true,
      hideLabel: true,
      dialogue: 'The cave hums with corrupted power.',
      portrait: '📜',
      sprite: {
        assetKey: null,
        frameCount: 1,
        frameWidth: 1,
        frameHeight: 1,
        cropX: 0,
        cropY: 0,
        cropWidth: 1,
        cropHeight: 1,
        drawWidth: 0,
        drawHeight: 72
      }
    };

    const fireWormDefinition = {
      id: 'fire-worm-boss',
      role: 'fire_worm_boss',
      name: 'Small Fire Worm',
      relX: 0.76,
      interactionRange: 0,
      dialogue: 'The tunnel burns with a sudden hiss.',
      portrait: '🔥',
      sprite: {
        assetKey: 'enemy_fire_worm_world',
        frameCount: 9,
        frameWidth: 90,
        frameHeight: 90,
        cropX: 0,
        cropY: 0,
        cropWidth: 90,
        cropHeight: 90,
        drawWidth: 188,
        drawHeight: 146
      }
    };

    const neutralScene = {
      id: sceneId || 'ch1_generic',
      backgroundKey: 'bg_village',
      groundOffset: this.constants.groundOffset,
      spawnX: 140,
      npcScene: false
    };

    const sceneConfigs = {
      ch1_village_square: {
        id: 'ch1_village_square',
        backgroundKey: 'bg_village',
        groundOffset: this.constants.groundOffset,
        spawnX: 140,
        npcScene: true,
        exitRight: {
          zone: 'right',
          threshold: 16,
          prompt: 'Leave the village and head into the Corrupted Forest?',
          onConfirm: async () => {
            if (typeof Chapter1Scene !== 'undefined' && typeof Chapter1Scene.tryForest === 'function') {
              await Chapter1Scene.tryForest();
              return;
            }
            if (typeof World !== 'undefined' && typeof World.goTo === 'function') {
              await World.goTo('ch1_corrupted_forest_1', 'Leaving the village...');
            }
          }
        }
      },
      ch1_training: {
        id: 'ch1_training',
        backgroundKey: 'bg_village',
        groundOffset: this.constants.groundOffset,
        spawnX: 140,
        npcScene: false
      },
      ch1_forest: {
        id: 'ch1_forest',
        backgroundKey: 'bg_corrupted_forest_1',
        groundOffset: 168,
        spawnX: 120,
        npcScene: false
      },
      ch1_corrupted_forest_1: {
        id: 'ch1_corrupted_forest_1',
        backgroundKey: 'bg_corrupted_forest_1',
        groundOffset: 176,
        spawnX: 120,
        npcScene: true,
        npcDefinitions: () => (
          typeof GameState !== 'undefined' &&
          typeof GameState.hasFlag === 'function' &&
          !GameState.hasFlag('ch1_goblin_defeated')
        ) ? [heraDefinition] : [],
        exitLeft: {
          zone: 'left',
          threshold: 16,
          prompt: 'Return to the Village of Variables?',
          onConfirm: async () => {
            if (typeof World !== 'undefined' && typeof World.goTo === 'function') {
              await World.goTo('ch1_village_square', 'Returning to the village...');
            }
          }
        },
        exitRight: {
          zone: 'right',
          threshold: 16,
          prompt: 'Go deeper into Corrupted Forest 2?',
          onConfirm: async () => {
            if (typeof Chapter1Scene !== 'undefined' && typeof Chapter1Scene.goToForest2 === 'function') {
              await Chapter1Scene.goToForest2();
            }
          }
        }
      },
      ch1_corrupted_forest_2: {
        id: 'ch1_corrupted_forest_2',
        backgroundKey: 'bg_corrupted_forest_2',
        groundOffset: 170,
        spawnX: (width) => Math.max(96, width - 180),
        npcScene: true,
        npcDefinitions: () => {
          const hasState = typeof GameState !== 'undefined' && typeof GameState.hasFlag === 'function';
          if (!hasState) return [goblinDefinition];
          if (GameState.hasFlag('ch1_abandoned_goblin_defeated')) return [];
          if (GameState.hasFlag('ch1_goblin_defeated')) return [{ ...heraDefinition, relX: 0.52 }];
          return [goblinDefinition];
        },
        exitLeft: {
          zone: 'left',
          threshold: 16,
          prompt: 'Return to Corrupted Forest 1?',
          onConfirm: async () => {
            if (typeof World !== 'undefined' && typeof World.goTo === 'function') {
              await World.goTo('ch1_corrupted_forest_1', 'Heading back to Hera...');
            }
          }
        },
        exitRight: {
          zone: 'right',
          threshold: 16,
          prompt: 'Follow the deeper trail into the abandoned village?',
          onConfirm: async () => {
            if (typeof Chapter1Scene !== 'undefined' && typeof Chapter1Scene.goToAbandonedVillage === 'function') {
              await Chapter1Scene.goToAbandonedVillage();
            }
          }
        }
      },
      ch1_abandoned_village: {
        id: 'ch1_abandoned_village',
        backgroundKey: 'bg_abandoned_village',
        groundOffset: 182,
        spawnX: 180,
        npcScene: true,
        npcDefinitions: () => (
          typeof GameState !== 'undefined' &&
          typeof GameState.hasFlag === 'function' &&
          GameState.hasFlag('ch1_abandoned_goblin_defeated')
        ) ? [{ ...heraDefinition, relX: 0.52 }] : [abandonedGoblinDefinition],
        exitLeft: {
          zone: 'left',
          threshold: 16,
          prompt: 'Head back to Corrupted Forest 2?',
          onConfirm: async () => {
            if (typeof World !== 'undefined' && typeof World.goTo === 'function') {
              await World.goTo('ch1_corrupted_forest_2', 'Heading back through the deeper forest...');
            }
          }
        }
      },
      ch1_cave_entrance: {
        id: 'ch1_cave_entrance',
        backgroundKey: 'bg_cave_entrance',
        groundOffset: 196,
        spawnX: 120,
        npcScene: true,
        npcDefinitions: () => [caveHeraDefinition, caveEntryDefinition]
      },
      ch1_cave_rush: {
        id: 'ch1_cave_rush',
        backgroundKey: 'bg_cave_rush',
        groundOffset: 204,
        spawnX: 140,
        npcScene: false
      },
      ch1_cave_inner: {
        id: 'ch1_cave_inner',
        backgroundKey: 'bg_cave_1',
        groundOffset: 204,
        spawnX: 150,
        npcScene: true,
        npcDefinitions: () => {
          const hasState = typeof GameState !== 'undefined' && typeof GameState.hasFlag === 'function';
          if (!hasState) return [caveHeraDefinition];
          if (GameState.hasFlag('ch1_fire_worm_defeated')) return [caveHeraDefinition];
          if (GameState.hasFlag('ch1_fire_worm_revealed')) return [caveHeraDefinition, fireWormDefinition];
          return [caveHeraDefinition];
        }
      }
    };

    return sceneConfigs[sceneId] || neutralScene;
  },

  loadAssets() {
    if (this.assetsLoaded) {
      return Promise.resolve();
    }

    if (this.assetsLoadingPromise) {
      return this.assetsLoadingPromise;
    }

    const images = {
      bg_village: 'assets/background/village.jpg',
      bg_corrupted_forest_1: 'assets/background/corruptedforest.png',
      bg_corrupted_forest_2: 'assets/background/corruptedforest2.png',
      bg_abandoned_village: 'assets/background/abandonedvillage.png',
      bg_cave_entrance: 'assets/background/caveEntrance.png',
      bg_cave_1: 'assets/background/cave1.png',
      bg_cave_rush: 'assets/background/cave2.png',
      ui_right_arrow: 'assets/UI/Right-Arrow.png',
      idle_0: 'assets/sprites/mc/adventurer-idle-00.png',
      idle_1: 'assets/sprites/mc/adventurer-idle-01.png',
      idle_2: 'assets/sprites/mc/adventurer-idle-02.png',
      run_0: 'assets/sprites/mc/adventurer-run3-00.png',
      run_1: 'assets/sprites/mc/adventurer-run3-01.png',
      run_2: 'assets/sprites/mc/adventurer-run3-02.png',
      run_3: 'assets/sprites/mc/adventurer-run3-03.png',
      run_4: 'assets/sprites/mc/adventurer-run3-04.png',
      run_5: 'assets/sprites/mc/adventurer-run3-05.png',
      jump_0: 'assets/sprites/mc/adventurer-jump-00.png',
      jump_1: 'assets/sprites/mc/adventurer-jump-01.png',
      jump_2: 'assets/sprites/mc/adventurer-jump-02.png',
      jump_3: 'assets/sprites/mc/adventurer-jump-03.png',
      npc_elder: 'assets/sprites/npc/VillageElder.png',
      npc_trainer: 'assets/sprites/npc/VillageTrainer.png',
      npc_blacksmith: 'assets/sprites/npc/Blacksmith.png',
      npc_hera: 'assets/sprites/npc/Hera.png',
      enemy_goblin_idle: 'assets/sprites/worldEnemies/goblinIdle.png',
      enemy_fire_worm_world: 'assets/sprites/worldEnemies/SmallFireWorm.png'
    };

    const keys = Object.keys(images);
    let loaded = 0;
    const total = keys.length;

    this.assetsLoadingPromise = new Promise((resolve) => {
      keys.forEach((key) => {
        const img = new Image();
        img.src = images[key];
        img.onload = () => {
          this.assets[key] = img;
          loaded += 1;
          if (loaded === total) {
            this.assetsLoaded = true;
            resolve();
          }
        };
        img.onerror = () => {
          console.warn('Platformer asset failed to load:', images[key]);
          loaded += 1;
          if (loaded === total) {
            this.assetsLoaded = true;
            resolve();
          }
        };
      });
    });

    return this.assetsLoadingPromise;
  },

  getGroundY(groundOffset) {
    const designHeight = this.constants.referenceHeight || 768;
    const scale = this.height > 0 ? this.height / designHeight : 1;
    const scaledGroundOffset = groundOffset * scale;
    const scaledBaselineLift = this.constants.groundBaselineLift * scale;
    return this.height - scaledGroundOffset - scaledBaselineLift;
  },

  syncSceneState(forceResetPlayer = false) {
    const nextSceneId = (typeof World !== 'undefined' && World.currentScene)
      ? World.currentScene
      : 'ch1_village_square';
    const sceneChanged = this.currentSceneId !== nextSceneId;
    this.currentSceneId = nextSceneId;
    this.currentMap = this.getSceneConfig(nextSceneId);
    this.groundY = this.getGroundY(this.currentMap.groundOffset);
    this.autoWalk = null;
    this.movementLocked = false;

    if (sceneChanged || forceResetPlayer) {
      this.resetPlayer();
    } else {
      this.resetNpcs();
    }

    this.resetExitPrompt();
    this.clampPlayerToGround();
  },

  async start(containerId) {
    this.init(containerId);
    await this.loadAssets();
    this.syncSceneState(!this.running);

    if (this.running) return;

    this.running = true;
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  },

  stop() {
    this.running = false;

    if (this.resizeObserver && this.resizeObserver.disconnect) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;

    const container = document.getElementById(this.containerId);
    if (container) {
      container.style.backgroundImage = '';
      container.style.backgroundColor = '';
      container.style.color = '';
    }
  },

  resetPlayer() {
    const spawnX = this.currentMap
      ? (typeof this.currentMap.spawnX === 'function' ? this.currentMap.spawnX(this.width) : this.currentMap.spawnX)
      : 140;
    this.player.x = spawnX;
    this.player.y = this.groundY - this.player.h;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.state = 'idle';
    this.player.frame = 0;
    this.player.dir = 1;
    this.frameTimer = 0;
    this.npcFrameTimer = 0;
    if (window.NPCSystem) NPCSystem.resetInputState();
    this.resetNpcs();
  },

  resetNpcs() {
    if (!this.currentMap || !this.currentMap.npcScene) {
      this.npcs = [];
      return;
    }

    const groundY = this.groundY || 0;
    const width = this.width || 800;
    const sceneDefinitions = typeof this.currentMap.npcDefinitions === 'function'
      ? this.currentMap.npcDefinitions()
      : this.currentMap.npcDefinitions;
    const hasSceneDefinitions = Array.isArray(sceneDefinitions);
    const fallbackTemplate = [
      {
        id: 'elder-varion',
        role: 'elder',
        name: 'Elder Varion',
        relX: 0.22,
        interactionRange: 96,
        dialogue: 'Welcome, traveler. Our village has been waiting for you.',
        portrait: '👴',
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
      },
      {
        id: 'blacksmith',
        role: 'blacksmith',
        name: 'Blacksmith Brawn',
        relX: 0.5,
        interactionRange: 108,
        dialogue: 'If your gear is dull, bring it here. I can forge it stronger.',
        portrait: '⚒️',
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
      },
      {
        id: 'rowan',
        role: 'rowan',
        name: 'Trainer Rowan',
        relX: 0.78,
        interactionRange: 96,
        dialogue: 'The forest hides many secrets. Stay alert on your journey.',
        portrait: '🧭',
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
    ];

    const generatedNpcs = hasSceneDefinitions
      ? sceneDefinitions.map((definition, index) => ({
          ...definition,
          ...definition.sprite,
          x: Math.floor(width * definition.relX),
          y: groundY - definition.sprite.drawHeight,
          frame: index % definition.sprite.frameCount
        }))
      : window.NPCSystem && typeof NPCSystem.createPlatformerNpcs === 'function'
        ? NPCSystem.createPlatformerNpcs(width, groundY)
        : null;

    const npcSource = hasSceneDefinitions
      ? generatedNpcs
      : generatedNpcs && generatedNpcs.length > 0
        ? generatedNpcs
        : fallbackTemplate.map((item, index) => ({
            ...item,
            x: Math.floor(width * item.relX),
            y: groundY - item.drawHeight,
            frame: index % item.frameCount
          }));

    this.npcs = npcSource;
  },

  loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min(1 / 30, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame((ts) => this.loop(ts));
  },

  update(dt) {
    const dialogueOpen = window.NPCSystem
      ? NPCSystem.isDialogueOpen()
      : !!(window.GameState && GameState.dialogue && GameState.dialogue.active);
    const combatOpen = !!(window.GameState && GameState.combat && GameState.combat.active);

    // Keep idle animation playing even while the dialogue box is open.
    this.frameTimer += dt * 1000;
    if (this.frameTimer >= this.constants.animationSpeed) {
      this.frameTimer = 0;
      this.player.frame = (this.player.frame + 1) % 4;
    }

    this.npcFrameTimer += dt * 1000;
    if (this.npcFrameTimer >= this.constants.npcAnimationSpeed) {
      this.npcFrameTimer = 0;
      this.npcs.forEach((npc) => {
        npc.frame = (npc.frame + 1) % npc.frameCount;
      });
    }

    this.nearestNpc = dialogueOpen || !window.NPCSystem
      ? null
      : NPCSystem.findNearestNpc(this.player, this.npcs);

    // Player movement is disabled during dialogue.
    if (dialogueOpen || combatOpen) {
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.state = 'idle';
      if (window.NPCSystem) NPCSystem.handleInteractionInput(this.keys, null);
      return;
    }

    if (this.autoWalk) {
      this.nearestNpc = null;
      this.updateAutoWalk(dt);
      return;
    }

    if (this.movementLocked) {
      this.nearestNpc = null;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.state = 'idle';
      this.player.y = this.groundY - this.player.h;
      return;
    }

    const left = this.keys['ArrowLeft'] || this.keys['KeyA'];
    const right = this.keys['ArrowRight'] || this.keys['KeyD'];
    const up = this.keys['ArrowUp'] || this.keys['Space'] || this.keys['KeyW'];

    // Horizontal movement
    const speed = this.constants.moveSpeed;
    if (left) {
      this.player.vx = -speed;
      this.player.dir = -1;
    } else if (right) {
      this.player.vx = speed;
      this.player.dir = 1;
    } else {
      this.player.vx *= 0.8; // friction
    }

    // Jumping
    if (up && this.player.y + this.player.h >= this.groundY) {
      this.player.vy = this.constants.jumpVelocity;
    }

    // Gravity
    this.player.vy += this.constants.gravity * dt;

    // Update position
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Ground collision
    if (this.player.y + this.player.h > this.groundY) {
      this.player.y = this.groundY - this.player.h;
      this.player.vy = 0;
    }

    // Keep player in bounds
    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x + this.player.w > this.width) this.player.x = this.width - this.player.w;

    // Set animation state
    if (Math.abs(this.player.vx) > 10) {
      this.player.state = 'run';
    } else if (this.player.vy < -10) {
      this.player.state = 'jump';
    } else {
      this.player.state = 'idle';
    }

    // Opening dialogue from the E key is centralized in NPCSystem.
    if (window.NPCSystem) {
      NPCSystem.handleInteractionInput(this.keys, this.nearestNpc);
    }

    this.updateSceneExit(dialogueOpen, combatOpen);
  },

  draw() {
    if (!this.ctx) return;

    // Clear
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Background
    const bg = this.currentMap ? this.assets[this.currentMap.backgroundKey] : this.assets.bg_village;
    if (bg) {
      this.ctx.drawImage(bg, 0, 0, this.width, this.height);
    } else {
      this.ctx.fillStyle = '#2b2b2b';
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Keep ground collision active without drawing the old dark overlay.

    // Draw NPCs
    this.ctx.imageSmoothingEnabled = false;
    this.npcs.forEach((npc) => {
      if (npc.hidden) {
        return;
      }
      const img = this.assets[npc.assetKey];
      const x = npc.x - npc.drawWidth / 2;
      const y = npc.y;
      if (img) {
        const sx = (npc.frame * npc.frameWidth) + npc.cropX;
        this.ctx.drawImage(
          img,
          sx,
          npc.cropY,
          npc.cropWidth,
          npc.cropHeight,
          x,
          y,
          npc.drawWidth,
          npc.drawHeight
        );
      } else {
        this.ctx.fillStyle = 'rgba(120,160,200,0.85)';
        this.ctx.fillRect(x, y, npc.drawWidth, npc.drawHeight);
      }
      // Name label
      if (!npc.hideLabel && npc.name) {
        this.ctx.font = '12px sans-serif';
        this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(npc.name, npc.x, y - 8);
      }
    });

    if (this.shouldDrawVillageExitArrow()) {
      this.drawVillageExitArrow();
    }

    // Draw player (fallback to colored rectangle if sprite missing)
    const sprite = this.getCurrentFrame();
    if (sprite) {
      this.ctx.save();
      const px = this.player.x + this.player.w / 2;
      const py = this.player.y;
      this.ctx.translate(px, py);
      if (this.player.dir < 0) this.ctx.scale(-1, 1);
      // Draw the player larger while keeping the collision box unchanged.
      const drawX = -this.player.renderW / 2;
      const drawY = this.player.h - this.player.renderH;
      this.ctx.drawImage(sprite, drawX, drawY, this.player.renderW, this.player.renderH);
      this.ctx.restore();
    } else {
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      this.ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    }

    // The floating E prompt is drawn here for the nearest NPC only.
    if (this.nearestNpc) {
      this.drawInteractionPrompt(this.nearestNpc);
    }
  },

  drawInteractionPrompt(npc) {
    const bobOffset = Math.sin(this.lastTimestamp * (window.NPCSystem ? NPCSystem.promptBobSpeed : 0.008))
      * (window.NPCSystem ? NPCSystem.promptBobAmount : 4);
    const promptX = npc.x;
    const promptY = npc.y - 22 + bobOffset;

    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = 'bold 16px sans-serif';

    this.ctx.fillStyle = 'rgba(10, 10, 18, 0.88)';
    this.ctx.fillRect(promptX - 16, promptY - 16, 32, 32);
    this.ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    this.ctx.strokeRect(promptX - 16, promptY - 16, 32, 32);

    this.ctx.fillStyle = 'rgba(255,255,255,1)';
    this.ctx.fillText(window.NPCSystem ? NPCSystem.promptText : 'E', promptX, promptY + 1);
    this.ctx.restore();
  },

  drawVillageExitArrow() {
    const arrow = this.assets.ui_right_arrow;
    if (!arrow) return;

    const bobOffset = Math.sin(this.lastTimestamp * 0.006) * 5;
    const drawWidth = 34;
    const drawHeight = 34;
    const x = this.width - drawWidth - 18;
    const y = this.groundY - 110 + bobOffset;

    this.ctx.save();
    this.ctx.globalAlpha = 0.95;
    this.ctx.drawImage(arrow, x, y, drawWidth, drawHeight);
    this.ctx.restore();
  },

  getCurrentFrame() {
    const state = this.player.state;
    const idx = this.player.frame;
    if (state === 'run') {
      return this.assets[`run_${idx}`] || this.assets.run_0;
    }
    if (state === 'jump') {
      return this.assets[`jump_${idx}`] || this.assets.jump_0;
    }
    return this.assets[`idle_${idx}`] || this.assets.idle_0;
  },

  getNearestNpc(range) {
    if (!this.npcs || this.npcs.length === 0) return null;
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h / 2;

    let best = null;
    let bestDist = Infinity;
    this.npcs.forEach((npc) => {
      const npcCenterY = npc.y + npc.drawHeight / 2;
      const dx = px - npc.x;
      const dy = py - npcCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist && dist <= range) {
        bestDist = dist;
        best = npc;
      }
    });
    return best;
  },

  resize() {
    if (!this.canvas) return;
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const rect = container.getBoundingClientRect();
    this.width = Math.floor(rect.width);
    this.height = Math.floor(rect.height);
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    this.ctx.imageSmoothingEnabled = false;

    const groundOffset = this.currentMap ? this.currentMap.groundOffset : this.constants.groundOffset;
    this.groundY = this.getGroundY(groundOffset);

    // Reposition player on the ground if it was already initialized
    if (this.player) {
      this.clampPlayerToGround();
    }

    // Update NPC positions to stay on the ground
    this.resetNpcs();
  },

  clampPlayerToGround() {
    if (!this.player) return;

    if (this.player.y < 0) {
      this.player.y = this.groundY - this.player.h;
    }

    if (this.player.y + this.player.h > this.groundY) {
      this.player.y = this.groundY - this.player.h;
    }
  },

  resetExitPrompt() {
    this.exitPrompt.active = false;
    this.exitPrompt.lock = false;
    this.exitPrompt.zone = null;
  },

  suppressSceneExit(durationMs = 1000) {
    this.exitSuppressedUntil = performance.now() + durationMs;
    this.resetExitPrompt();
  },

  clearInputState() {
    this.keys = {};
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.state = 'idle';
    if (window.NPCSystem) NPCSystem.resetInputState();
  },

  getNpcById(npcId) {
    return this.npcs.find((npc) => npc.id === npcId) || null;
  },

  startAutoWalk(targetX, onComplete = null) {
    this.movementLocked = true;
    this.autoWalk = {
      targetX,
      onComplete
    };
  },

  updateAutoWalk(dt) {
    if (!this.autoWalk) return;

    const direction = this.autoWalk.targetX >= this.player.x ? 1 : -1;
    const speed = this.constants.moveSpeed * 0.8;
    const nextX = this.player.x + (direction * speed * dt);
    const reachedTarget = direction > 0
      ? nextX >= this.autoWalk.targetX
      : nextX <= this.autoWalk.targetX;

    this.player.dir = direction;
    this.player.state = 'run';
    this.player.vx = direction * speed;
    this.player.vy = 0;
    this.player.y = this.groundY - this.player.h;

    if (reachedTarget) {
      const callback = this.autoWalk.onComplete;
      this.player.x = this.autoWalk.targetX;
      this.player.vx = 0;
      this.player.state = 'idle';
      this.autoWalk = null;
      if (typeof callback === 'function') {
        callback();
      }
      return;
    }

    this.player.x = nextX;
  },

  releaseMovementLock() {
    this.autoWalk = null;
    this.movementLocked = false;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.state = 'idle';
    this.player.y = this.groundY - this.player.h;
  },

  beginForest2GoblinApproach() {
    if (
      this.currentSceneId !== 'ch1_corrupted_forest_2' ||
      !this.getNpcById('forest-goblin') ||
      !(typeof GameState !== 'undefined' && GameState.hasFlag && GameState.hasFlag('ch1_hera_help_started')) ||
      (typeof GameState !== 'undefined' && GameState.hasFlag && GameState.hasFlag('ch1_goblin_defeated'))
    ) {
      return;
    }

    const goblin = this.getNpcById('forest-goblin');
    const targetX = Math.max(64, goblin.x - 118);
    this.startAutoWalk(targetX, () => {
      this.movementLocked = true;
      if (typeof Chapter1Scene !== 'undefined' && typeof Chapter1Scene.startGoblinEncounter === 'function') {
        Chapter1Scene.startGoblinEncounter();
      }
    });
  },

  isForestExitUnlocked() {
    return !!(
      typeof GameState !== 'undefined' &&
      typeof GameState.hasFlag === 'function' &&
      GameState.hasFlag('ch1_forest_path_unlocked')
    );
  },

  shouldDrawVillageExitArrow() {
    return !!(
      this.currentMap &&
      this.currentMap.exitRight &&
      this.currentSceneId === 'ch1_village_square' &&
      this.canUseSceneExit(this.currentMap.exitRight)
    );
  },

  canUseSceneExit(exit) {
    if (!exit || !this.currentMap) return false;

    if (this.currentSceneId === 'ch1_village_square' && exit.zone === 'right') {
      return this.isForestExitUnlocked();
    }

    if (this.currentSceneId === 'ch1_corrupted_forest_1' && exit.zone === 'right') {
      return !!(
        typeof GameState !== 'undefined' &&
        typeof GameState.hasFlag === 'function' &&
        GameState.hasFlag('ch1_hera_help_started')
      );
    }

    if (this.currentSceneId === 'ch1_corrupted_forest_2' && exit.zone === 'right') {
      return !!(
        typeof GameState !== 'undefined' &&
        typeof GameState.hasFlag === 'function' &&
        GameState.hasFlag('ch1_abandoned_village_unlocked')
      );
    }

    return true;
  },

  getTriggeredExit() {
    if (!this.currentMap) return null;

    if (this.currentMap.exitRight && this.canUseSceneExit(this.currentMap.exitRight)) {
      const rightEdge = this.player.x + this.player.w;
      if (rightEdge >= this.width - this.currentMap.exitRight.threshold) {
        return this.currentMap.exitRight;
      }
    }

    if (this.currentMap.exitLeft && this.canUseSceneExit(this.currentMap.exitLeft)) {
      if (this.player.x <= this.currentMap.exitLeft.threshold) {
        return this.currentMap.exitLeft;
      }
    }

    return null;
  },

  updateSceneExit(dialogueOpen, combatOpen) {
    if (performance.now() < this.exitSuppressedUntil) {
      return;
    }

    const exit = this.getTriggeredExit();

    if (!exit) {
      this.exitPrompt.lock = false;
      this.exitPrompt.zone = null;
      return;
    }

    if (dialogueOpen || combatOpen || this.exitPrompt.active) return;

    if (this.exitPrompt.lock && this.exitPrompt.zone === exit.zone) {
      return;
    }

    this.exitPrompt.lock = true;
    this.exitPrompt.zone = exit.zone;
    this.promptSceneExit(exit);
  },

  async promptSceneExit(exit) {
    this.exitPrompt.active = true;

    const choice = await Dialogue.askChoice(
      'narrator',
      'Narrator',
      exit.prompt,
      [
        { text: 'Yes', value: 'yes' },
        { text: 'No', value: 'no' }
      ],
      '📜'
    );

    this.exitPrompt.active = false;

    if (!choice || choice.value !== 'yes') {
      return;
    }

    if (typeof exit.onConfirm === 'function') {
      await exit.onConfirm();
    }
  }
};
