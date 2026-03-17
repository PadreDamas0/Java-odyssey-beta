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
    groundOffset: 210,
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

    this.loadAssets(() => {
      this.resize();
      this.resetPlayer();
    });
  },

  loadAssets(callback) {
    const images = {
      bg: 'assets/background/village.jpg',
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
      npc_blacksmith: 'assets/sprites/npc/Blacksmith.png'
    };

    const keys = Object.keys(images);
    let loaded = 0;
    const total = keys.length;

    keys.forEach((key) => {
      const img = new Image();
      img.src = images[key];
      img.onload = () => {
        this.assets[key] = img;
        loaded += 1;
        if (loaded === total && typeof callback === 'function') callback();
      };
      img.onerror = () => {
        console.warn('Platformer asset failed to load:', images[key]);
        loaded += 1;
        if (loaded === total && typeof callback === 'function') callback();
      };
    });
  },

  async start(containerId) {
    if (this.running) return;
    this.running = true;
    this.init(containerId);
    // Wait for assets to load
    await new Promise(resolve => {
      this.loadAssets(resolve);
    });
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
    this.player.x = 140;
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
    const groundY = this.groundY || 0;
    const width = this.width || 800;
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
        name: 'Blacksmith',
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
        name: 'Rowan',
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

    const generatedNpcs = window.NPCSystem && typeof NPCSystem.createPlatformerNpcs === 'function'
      ? NPCSystem.createPlatformerNpcs(width, groundY)
      : null;

    const npcSource = generatedNpcs && generatedNpcs.length > 0
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
    if (dialogueOpen) {
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.state = 'idle';
      if (window.NPCSystem) NPCSystem.handleInteractionInput(this.keys, null);
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
  },

  draw() {
    if (!this.ctx) return;

    // Clear
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Background
    const bg = this.assets.bg;
    if (bg) {
      this.ctx.drawImage(bg, 0, 0, this.width, this.height);
    } else {
      this.ctx.fillStyle = '#2b2b2b';
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Ground (for debugging / visibility)
    this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this.ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);

    // Draw NPCs
    this.ctx.imageSmoothingEnabled = false;
    this.npcs.forEach((npc) => {
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
      this.ctx.font = '12px sans-serif';
      this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(npc.name, npc.x, y - 8);
    });

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

    this.groundY = this.height - this.constants.groundOffset;

    // Reposition player on the ground if it was already initialized
    if (this.player) {
      // If the player is above the sky (y < 0), reset them to ground.
      if (this.player.y < 0) {
        this.player.y = this.groundY - this.player.h;
      }
      // Ensure the player never falls below ground
      if (this.player.y + this.player.h > this.groundY) {
        this.player.y = this.groundY - this.player.h;
      }
    }

    // Update NPC positions to stay on the ground
    this.resetNpcs();
  }
};
