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
  frameTimer: 0,
  player: {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    w: 48,
    h: 64,
    dir: 1,
    state: 'idle',
    frame: 0
  },
  constants: {
    gravity: 1600,
    moveSpeed: 280,
    jumpVelocity: -700,
    groundOffset: 210,
    animationSpeed: 90
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
      jump_3: 'assets/sprites/mc/adventurer-jump-03.png'
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

    // Animation
    this.frameTimer += dt * 1000;
    if (this.frameTimer >= this.constants.animationSpeed) {
      this.frameTimer = 0;
      this.player.frame = (this.player.frame + 1) % 4; // cycle through frames
    }

    // Set animation state
    if (Math.abs(this.player.vx) > 10) {
      this.player.state = 'run';
    } else if (this.player.vy < -10) {
      this.player.state = 'jump';
    } else {
      this.player.state = 'idle';
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

    // Draw player (fallback to colored rectangle if sprite missing)
    const sprite = this.getCurrentFrame();
    if (sprite) {
      this.ctx.save();
      const px = this.player.x + this.player.w / 2;
      const py = this.player.y;
      this.ctx.translate(px, py);
      if (this.player.dir < 0) this.ctx.scale(-1, 1);
      this.ctx.drawImage(sprite, -this.player.w / 2, 0, this.player.w, this.player.h);
      this.ctx.restore();
    } else {
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      this.ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    }

    // Debug: show that platformer is running
    this.ctx.font = '14px sans-serif';
    this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
    this.ctx.fillText('Platformer active', 12, 20);
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
  }
};