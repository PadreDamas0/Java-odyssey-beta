/* ============================================
   Phaser World Layer (Village Square Tilemap)
   - Tilemap layers with collision
   - Full map boundary blockers
   - 1 player + 4 static NPCs
   ============================================ */

const PhaserWorld = {
  game: null,
  scene: null,

  start() {
    if (this.game) return;

    const parentId = "phaser-container";
    const container = document.getElementById(parentId);
    if (container) container.style.display = "block";

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: parentId,
      pixelArt: true,
      antialias: false,
      backgroundColor: "#1a6d2a",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: "100%",
        height: "100%"
      },
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false }
      },
      scene: [PhaserWorldScene]
    });
  },

  stop() {
    if (!this.game) return;
    this.game.destroy(true);
    this.game = null;
    this.scene = null;
    const container = document.getElementById("phaser-container");
    if (container) container.style.display = "none";
  }
};

class PhaserWorldScene extends Phaser.Scene {
  constructor() {
    super({ key: "PhaserWorldScene" });
    this.tileSize = 32;
    this.mapW = 24;
    this.mapH = 16;
  }

  create() {
    PhaserWorld.scene = this;

    this.createTextures();
    this.createTilemap();
    this.createNpcSprites();
    this.createPlayer();
    this.setupControls();
    this.setupCamera();
    this.createHudText();
  }

  createTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Terrain atlas in a single texture strip (7 tiles x 1 tile)
    // tile 0: grass
    g.clear();
    g.fillStyle(0x2f9f45, 1);
    g.fillRect(0, 0, 32, 32);
    for (let i = 0; i < 40; i++) {
      g.fillStyle(Phaser.Math.RND.pick([0x26903a, 0x37ad4e, 0x218335]), 1);
      g.fillRect(Phaser.Math.Between(0, 31), Phaser.Math.Between(0, 31), 2, 2);
    }
    g.generateTexture("tile_grass", 32, 32);

    // tile 1: dirt
    g.clear();
    g.fillStyle(0xceab62, 1);
    g.fillRect(0, 0, 32, 32);
    for (let i = 0; i < 35; i++) {
      g.fillStyle(Phaser.Math.RND.pick([0xbe9855, 0xdab776, 0xa77c41]), 1);
      g.fillCircle(Phaser.Math.Between(1, 30), Phaser.Math.Between(1, 30), 1);
    }
    g.generateTexture("tile_dirt", 32, 32);

    // tile 2: fence/wall
    g.clear();
    g.fillStyle(0x754f2b, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x8a6337, 1);
    g.fillRect(0, 12, 32, 8);
    for (let i = 4; i <= 28; i += 8) {
      g.fillStyle(0x5d3d20, 1);
      g.fillRect(i, 3, 4, 24);
    }
    g.generateTexture("tile_fence", 32, 32);

    // tile 3: tree trunk blocker
    g.clear();
    g.fillStyle(0x1f6e2d, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x267f34, 1);
    g.fillCircle(16, 12, 13);
    g.fillStyle(0x5f3b20, 1);
    g.fillRect(12, 17, 8, 14);
    g.generateTexture("tile_tree", 32, 32);

    // tile 4: rock blocker
    g.clear();
    g.fillStyle(0x2f9f45, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x757a84, 1);
    g.fillEllipse(16, 18, 22, 14);
    g.fillStyle(0x8f96a1, 1);
    g.fillEllipse(13, 15, 8, 5);
    g.generateTexture("tile_rock", 32, 32);

    // tile 5: flower decor
    g.clear();
    g.fillStyle(0x2f9f45, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 2);
    g.fillStyle(0xff5a5a, 1);
    g.fillCircle(15, 11, 2);
    g.fillStyle(0xf7d569, 1);
    g.fillCircle(24, 7, 2);
    g.generateTexture("tile_flower", 32, 32);

    // tile 6: empty center marker accent
    g.clear();
    g.fillStyle(0xceab62, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0xe2c684, 1);
    g.fillRect(10, 10, 12, 12);
    g.generateTexture("tile_center", 32, 32);

    // Build a combined terrain texture so tilemap can use one tileset image
    const atlas = this.make.renderTexture(
      { width: 32 * 7, height: 32, add: false },
      false
    );
    atlas.draw("tile_grass", 0, 0);
    atlas.draw("tile_dirt", 32, 0);
    atlas.draw("tile_fence", 64, 0);
    atlas.draw("tile_tree", 96, 0);
    atlas.draw("tile_rock", 128, 0);
    atlas.draw("tile_flower", 160, 0);
    atlas.draw("tile_center", 192, 0);
    atlas.saveTexture("terrain_tiles");
    atlas.destroy();

    // Player and NPC sprites
    this.createCharacterTexture("hero", 0xb62525);
    this.createCharacterTexture("npc_elder", 0x6b4ca6);
    this.createCharacterTexture("npc_villager", 0x2f7fc2);
    this.createCharacterTexture("npc_trainer", 0x2e7a39);
    this.createCharacterTexture("npc_merchant", 0xa8632a);

    g.destroy();
  }

  createCharacterTexture(key, bodyColor) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.clear();
    g.fillStyle(0x1f1f24, 1);
    g.fillRect(5, 2, 6, 8); // hair
    g.fillStyle(0xdbb58f, 1);
    g.fillRect(5, 0, 6, 3); // face
    g.fillStyle(bodyColor, 1);
    g.fillRect(4, 10, 8, 7); // torso
    g.fillStyle(0x332b26, 1);
    g.fillRect(4, 17, 3, 7); // left leg
    g.fillRect(9, 17, 3, 7); // right leg
    g.generateTexture(key, 16, 24);
    g.destroy();
  }

  createTilemap() {
    const groundData = [];
    const decorData = [];
    const collisionData = [];
    const centerX = Math.floor(this.mapW / 2);
    const centerY = Math.floor(this.mapH / 2);

    for (let y = 0; y < this.mapH; y++) {
      const gRow = [];
      const dRow = [];
      const cRow = [];

      for (let x = 0; x < this.mapW; x++) {
        gRow.push(0); // base grass
        dRow.push(-1);
        cRow.push(-1);

        // Main cross roads + village central square
        const inVerticalRoad = Math.abs(x - centerX) <= 2;
        const inHorizontalRoad = Math.abs(y - centerY) <= 2;
        const inCenterSquare = Math.abs(x - centerX) <= 5 && Math.abs(y - centerY) <= 4;
        if (inVerticalRoad || inHorizontalRoad || inCenterSquare) {
          gRow[x] = 1;
        }

        // Decorative flower patches away from center
        if (!inCenterSquare && Math.random() < 0.045) {
          dRow[x] = 5;
        }

        // Hard perimeter: fence with trees/rocks mixed in
        const onBorder = x === 0 || y === 0 || x === this.mapW - 1 || y === this.mapH - 1;
        if (onBorder) {
          const edgePick = Phaser.Math.RND.pick([2, 2, 2, 3, 4]);
          cRow[x] = edgePick;
        }
      }

      groundData.push(gRow);
      decorData.push(dRow);
      collisionData.push(cRow);
    }

    // Extra inside blockers to feel like enclosed village
    this.placeBlockerLine(collisionData, 4, 4, 9, "h", [3, 4]);
    this.placeBlockerLine(collisionData, this.mapW - 10, 4, 9, "h", [3, 4]);
    this.placeBlockerLine(collisionData, 4, this.mapH - 5, 9, "h", [3, 4]);
    this.placeBlockerLine(collisionData, this.mapW - 10, this.mapH - 5, 9, "h", [3, 4]);

    const map = this.make.tilemap({
      data: groundData,
      tileWidth: this.tileSize,
      tileHeight: this.tileSize
    });
    const tileset = map.addTilesetImage("terrain_tiles");

    this.groundLayer = map.createLayer(0, tileset, 0, 0);
    const decorMap = this.make.tilemap({
      data: decorData,
      tileWidth: this.tileSize,
      tileHeight: this.tileSize
    });
    this.decorLayer = decorMap.createLayer(0, tileset, 0, 0);

    const collisionMap = this.make.tilemap({
      data: collisionData,
      tileWidth: this.tileSize,
      tileHeight: this.tileSize
    });
    this.boundaryLayer = collisionMap.createLayer(0, tileset, 0, 0);
    this.boundaryLayer.setCollision([2, 3, 4]);

    this.physics.world.setBounds(0, 0, this.mapW * this.tileSize, this.mapH * this.tileSize);
  }

  placeBlockerLine(layerData, startX, startY, len, dir, tileChoices) {
    for (let i = 0; i < len; i++) {
      const x = dir === "h" ? startX + i : startX;
      const y = dir === "v" ? startY + i : startY;
      layerData[y][x] = Phaser.Math.RND.pick(tileChoices);
    }
  }

  createNpcSprites() {
    this.npcs = this.physics.add.staticGroup();
    const mapPixelW = this.mapW * this.tileSize;
    const mapPixelH = this.mapH * this.tileSize;
    const margin = 96;

    // Fixed NPC placement requested by user
    this.spawnNpc("elder", "npc_elder", margin, margin);
    this.spawnNpc("villager", "npc_villager", mapPixelW - margin, margin);
    this.spawnNpc("trainer", "npc_trainer", margin, mapPixelH - margin);
    this.spawnNpc("merchant", "npc_merchant", mapPixelW - margin, mapPixelH - margin);
  }

  spawnNpc(role, texture, x, y) {
    const npc = this.npcs.create(x, y, texture).setScale(2).setOrigin(0.5, 0.5);
    npc.role = role;
    npc.refreshBody();

    const labelMap = {
      elder: "Elder",
      villager: "Villager",
      trainer: "Trainer",
      merchant: "Merchant"
    };

    const label = this.add
      .text(x, y - 34, labelMap[role] || "NPC", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#fff4cf",
        backgroundColor: "#00000077",
        padding: { x: 4, y: 2 }
      })
      .setOrigin(0.5, 1)
      .setDepth(4000);

    npc.nameLabel = label;
  }

  createPlayer() {
    const startX = Math.floor(this.mapW / 2) * this.tileSize + this.tileSize / 2;
    const startY = Math.floor(this.mapH / 2) * this.tileSize + this.tileSize / 2;

    this.player = this.physics.add.image(startX, startY, "hero").setScale(2);
    this.player.body.setSize(11, 8);
    this.player.body.setOffset(2, 16);
    this.player.body.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, this.boundaryLayer);
    this.physics.add.collider(this.player, this.npcs);
  }

  setupControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, this.mapW * this.tileSize, this.mapH * this.tileSize);
    this.cameras.main.startFollow(this.player, true, 0.14, 0.14);
    this.cameras.main.setZoom(2.15);
  }

  createHudText() {
    this.posText = this.add
      .text(12, 12, "", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#f6f1dc",
        backgroundColor: "#00000066",
        padding: { x: 6, y: 3 }
      })
      .setScrollFactor(0)
      .setDepth(5000);
  }

  update() {
    const speed = this.keys.shift.isDown ? 170 : 130;
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

    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.player.body.setVelocity(vx * speed, vy * speed);

    const px = Math.floor(this.player.x);
    const py = Math.floor(this.player.y);
    this.posText.setText(`Village Square | WASD/Arrows move | x:${px} y:${py}`);
  }
}
