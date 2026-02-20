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
  },

  walkToNpc(role, onArrive) {
    if (!this.scene || !this.scene.startAutoWalkToNpc) {
      if (typeof onArrive === "function") onArrive();
      return false;
    }
    return this.scene.startAutoWalkToNpc(role, onArrive);
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
    this.createNpcAnimations();
    this.createTilemap();
    this.createNpcSprites();
    this.createPlayer();
    this.setupControls();
    this.setupCamera();
    this.createHudText();
    this.autoMove = null;
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

    // Player + custom NPC textures (2 idle frames each)
    this.createPlayerTexture();
    this.createNpcFrames();

    g.destroy();
  }

  createPlayerTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.clear();
    g.fillStyle(0x1f1f24, 1);
    g.fillRect(5, 2, 6, 8); // hair
    g.fillStyle(0xdbb58f, 1);
    g.fillRect(5, 0, 6, 3); // face
    g.fillStyle(0xb62525, 1);
    g.fillRect(4, 10, 8, 7); // torso
    g.fillStyle(0x332b26, 1);
    g.fillRect(4, 17, 3, 7); // left leg
    g.fillRect(9, 17, 3, 7); // right leg
    g.generateTexture("hero", 16, 24);
    g.destroy();
  }

  createNpcFrames() {
    this.createElderFrame("npc_elder_1", 0);
    this.createElderFrame("npc_elder_2", 1);
    this.createVillagerFrame("npc_villager_1", 0);
    this.createVillagerFrame("npc_villager_2", 1);
    this.createTrainerFrame("npc_trainer_1", 0);
    this.createTrainerFrame("npc_trainer_2", 1);
    this.createMerchantFrame("npc_merchant_1", 0);
    this.createMerchantFrame("npc_merchant_2", 1);
  }

  createNpcAnimations() {
    const addIdle = (key, a, b, fps) => {
      this.anims.create({
        key,
        frames: [{ key: a }, { key: b }],
        frameRate: fps,
        repeat: -1,
        yoyo: true
      });
    };

    addIdle("npc_elder_idle", "npc_elder_1", "npc_elder_2", 1.3);      // slow robe sway
    addIdle("npc_villager_idle", "npc_villager_1", "npc_villager_2", 2); // breathing
    addIdle("npc_trainer_idle", "npc_trainer_1", "npc_trainer_2", 2.6);  // confident bounce
    addIdle("npc_merchant_idle", "npc_merchant_1", "npc_merchant_2", 1.8);// pouch motion
  }

  createElderFrame(key, frame) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const sway = frame === 0 ? 0 : 1;

    g.clear();
    // hood + face + beard
    g.fillStyle(0x4f3a76, 1); g.fillRect(3 + sway, 1, 10, 9);
    g.fillStyle(0xdab9a1, 1); g.fillRect(6 + sway, 2, 4, 3);
    g.fillStyle(0x9b9ea6, 1); g.fillRect(6 + sway, 5, 4, 4);
    // thin robe silhouette
    g.fillStyle(0x6b4ca6, 1); g.fillRect(4 + sway, 10, 8, 8);
    g.fillStyle(0x4d535e, 1); g.fillRect(5 + sway, 18, 3, 6);
    g.fillRect(9 + sway, 18, 3, 6);
    // staff/cane
    g.fillStyle(0x8a6337, 1); g.fillRect(13 + sway, 8, 2, 15);
    g.fillStyle(0xcbb578, 1); g.fillRect(12 + sway, 7, 4, 2);

    g.generateTexture(key, 16, 24);
    g.destroy();
  }

  createVillagerFrame(key, frame) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const breathe = frame === 0 ? 0 : 1;

    g.clear();
    // cap + face
    g.fillStyle(0x2a5f80, 1); g.fillRect(4, 1, 8, 3);
    g.fillStyle(0xdbb58f, 1); g.fillRect(5, 4, 6, 3);
    // neutral body + apron
    g.fillStyle(0x2f7fc2, 1); g.fillRect(4, 8, 8, 7 + breathe);
    g.fillStyle(0x49a79f, 1); g.fillRect(6, 11, 4, 5 + breathe);
    g.fillStyle(0x332b26, 1); g.fillRect(4, 17 + breathe, 3, 7 - breathe);
    g.fillRect(9, 17 + breathe, 3, 7 - breathe);

    g.generateTexture(key, 16, 24);
    g.destroy();
  }

  createTrainerFrame(key, frame) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const bounce = frame === 0 ? 0 : -1;

    g.clear();
    // headband + face
    g.fillStyle(0xbf3434, 1); g.fillRect(4, 1 + bounce, 8, 2);
    g.fillStyle(0xdbb58f, 1); g.fillRect(5, 3 + bounce, 6, 3);
    // wider shoulders + belt + gloves
    g.fillStyle(0x2e7a39, 1); g.fillRect(3, 7 + bounce, 10, 7);
    g.fillStyle(0x7b532e, 1); g.fillRect(3, 14 + bounce, 10, 2);
    g.fillStyle(0x6a4525, 1); g.fillRect(2, 9 + bounce, 2, 3);
    g.fillRect(12, 9 + bounce, 2, 3);
    g.fillStyle(0x332b26, 1); g.fillRect(4, 16 + bounce, 3, 8);
    g.fillRect(9, 16 + bounce, 3, 8);

    g.generateTexture(key, 16, 24);
    g.destroy();
  }

  createMerchantFrame(key, frame) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const sway = frame === 0 ? 0 : 1;

    g.clear();
    // scarf + face
    g.fillStyle(0xc07e2f, 1); g.fillRect(4, 1, 8, 2);
    g.fillStyle(0xdbb58f, 1); g.fillRect(5, 3, 6, 3);
    // rounder body
    g.fillStyle(0xa8632a, 1); g.fillEllipse(8, 13, 11, 10);
    g.fillStyle(0xd8b24a, 1); g.fillRect(5, 10, 6, 3);
    // satchel + coin pouch
    g.fillStyle(0x7c4b27, 1); g.fillRect(2 + sway, 10, 3, 6);
    g.fillRect(11 - sway, 13, 3, 4);
    g.fillStyle(0x332b26, 1); g.fillRect(4, 17, 3, 7);
    g.fillRect(9, 17, 3, 7);

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
    this.spawnNpc("elder", "npc_elder_1", margin, margin);
    this.spawnNpc("villager", "npc_villager_1", mapPixelW - margin, margin);
    this.spawnNpc("trainer", "npc_trainer_1", margin, mapPixelH - margin);
    this.spawnNpc("merchant", "npc_merchant_1", mapPixelW - margin, mapPixelH - margin);
  }

  spawnNpc(role, texture, x, y) {
    const npc = this.npcs.create(x, y, texture).setScale(2).setOrigin(0.5, 0.5);
    npc.role = role;
    npc.refreshBody();

    const labelMap = {
      elder: "Elder NPC",
      villager: "Villager NPC",
      trainer: "Trainer NPC",
      merchant: "Merchant NPC"
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
    npc.play(`npc_${role}_idle`);
  }

  startAutoWalkToNpc(role, onArrive) {
    if (!this.player || !this.npcs) {
      if (typeof onArrive === "function") onArrive();
      return false;
    }

    const targetNpc = this.npcs.getChildren().find((npc) => npc.role === role);
    if (!targetNpc) {
      if (typeof onArrive === "function") onArrive();
      return false;
    }

    this.autoMove = {
      targetX: targetNpc.x,
      targetY: targetNpc.y + 24, // stop slightly below NPC so player faces them
      role,
      onArrive
    };
    return true;
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

    if (this.autoMove) {
      const dx = this.autoMove.targetX - this.player.x;
      const dy = this.autoMove.targetY - this.player.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= 10) {
        this.player.body.setVelocity(0, 0);
        const callback = this.autoMove.onArrive;
        this.autoMove = null;
        if (typeof callback === "function") callback();
      } else {
        vx = dx / distance;
        vy = dy / distance;
      }
    } else {
      const up = this.cursors.up.isDown || this.keys.w.isDown;
      const down = this.cursors.down.isDown || this.keys.s.isDown;
      const left = this.cursors.left.isDown || this.keys.a.isDown;
      const right = this.cursors.right.isDown || this.keys.d.isDown;

      if (left) vx -= 1;
      if (right) vx += 1;
      if (up) vy -= 1;
      if (down) vy += 1;
    }

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
