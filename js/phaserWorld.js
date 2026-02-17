/* ============================================
   Phaser World Layer (Movement Only)
   - Works with DOM-based UI system
   - WASD / Arrow Keys movement
   ============================================ */

const PhaserWorld = {
  game: null,
  scene: null,

  start() {
    // prevent double init
    if (this.game) return;

    const parentId = "phaser-container";

    const config = {
      type: Phaser.AUTO,
      parent: parentId,
      backgroundColor: "#0b0f14",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: "100%",
        height: "100%"
      },
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [PhaserWorldScene]
    };

    this.game = new Phaser.Game(config);
  },

  stop() {
    if (!this.game) return;
    this.game.destroy(true);
    this.game = null;
    this.scene = null;
  }
};

class PhaserWorldScene extends Phaser.Scene {
  constructor() {
    super({ key: "PhaserWorldScene" });
  }

  create() {
    PhaserWorld.scene = this;

    // WORLD SIZE (virtual map)
    this.worldW = 1200;
    this.worldH = 800;

    // Simple tile-ish background grid
    const g = this.add.graphics();
    g.lineStyle(1, 0x1f2a38, 1);
    for (let x = 0; x <= this.worldW; x += 40) g.lineBetween(x, 0, x, this.worldH);
    for (let y = 0; y <= this.worldH; y += 40) g.lineBetween(0, y, this.worldW, y);

    // A few obstacles (rectangles)
    this.obstacles = this.physics.add.staticGroup();
    this.makeWall(300, 250, 260, 40);
    this.makeWall(700, 520, 320, 40);
    this.makeWall(950, 220, 40, 240);

    // Player (simple rectangle)
    this.player = this.add.rectangle(80, 80, 26, 26, 0x4a9eff);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    // Set world bounds
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);

    // Player collider with obstacles
    this.physics.add.collider(this.player, this.obstacles);

    // Camera follow player
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // Keyboard
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });

    // Optional: show position debug text
    this.posText = this.add.text(12, 12, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#e0dcd0"
    }).setScrollFactor(0).setAlpha(0.8);

    // Resize handler so it fits container
    this.scale.on("resize", () => this.onResize());
    this.onResize();
  }

  makeWall(x, y, w, h) {
    const rect = this.add.rectangle(x, y, w, h, 0xc9a84c).setAlpha(0.25);
    this.physics.add.existing(rect, true);
    this.obstacles.add(rect);
  }

  onResize() {
    // nothing heavy needed; RESIZE handles it
  }

  update() {
    const body = this.player.body;

    const baseSpeed = this.keys.shift.isDown ? 220 : 170;
    let vx = 0;
    let vy = 0;

    const up = this.cursors.up.isDown || this.keys.w.isDown;
    const down = this.cursors.down.isDown || this.keys.s.isDown;
    const left = this.cursors.left.isDown || this.keys.a.isDown;
    const right = this.cursors.right.isDown || this.keys.d.isDown;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    // normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    body.setVelocity(vx * baseSpeed, vy * baseSpeed);

    // Debug position text
    this.posText.setText(`x:${Math.floor(this.player.x)} y:${Math.floor(this.player.y)}  speed:${baseSpeed}`);
  }
}
