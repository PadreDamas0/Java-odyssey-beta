/* ============================================
   Phaser World Layer (Natural Biome + Pathfinding)
   ============================================ */

const PhaserWorld = {
  game: null,
  scene: null,

  start() {
    const parentId = "phaser-container";
    const container = document.getElementById(parentId);
    if (container) container.style.display = "block";
    if (this.game) return;

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: parentId,
      pixelArt: false,
      antialias: true,
      backgroundColor: "#6fa974",
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH, width: "100%", height: "100%" },
      physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
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
    this.mapW = 42;
    this.mapH = 28;
    this.playerSpeed = 220;
    this.sprintSpeed = 300;
    this.waypointThreshold = 6;
  }

  preload() {}

  create() {
    PhaserWorld.scene = this;
    this.createTextures();
    this.createVillageMap();
    this.createCharacters();
    this.createNpcAnimations();
    this.setupPathfinding();
    this.setupInput();
    this.setupCamera();
    this.createUiHints();
    this.createEnvironmentFx();
  }

  createTextures() {
    this.makeGrassTexture("tile_grass_a", "#5f9957", "#7db869", "#4f824a");
    this.makeGrassTexture("tile_grass_b", "#5b9153", "#76b164", "#497747");
    this.makePathTexture("tile_path_a", "#9f8766", "#b99a77");
    this.makePathTexture("tile_path_b", "#947b5d", "#ad8d6c");
    this.makeRockTexture("tile_rock");
    this.makeFlowerTexture("tile_flower");
    this.makeTrunkTexture("tile_trunk");
    this.makeHeroTexture("hero");
    this.makeNpcFrames();
    this.makeTreeCanopyTexture("tree_s", 52, 72, "#2c6635", "#4d8a48", "#22512c");
    this.makeTreeCanopyTexture("tree_l", 74, 96, "#275e31", "#437e42", "#1e4b26");
    this.makeShadowTexture("fx_shadow");
    this.makeVignetteTexture("fx_vignette");

    const atlas = this.make.renderTexture({ width: 32 * 8, height: 32, add: false }, false);
    atlas.draw("tile_grass_a", 0, 0);   // 0 walkable
    atlas.draw("tile_grass_b", 32, 0);  // 1 walkable
    atlas.draw("tile_path_a", 64, 0);   // 2 walkable
    atlas.draw("tile_path_b", 96, 0);   // 3 walkable
    atlas.draw("tile_flower", 128, 0);  // 4 walkable
    atlas.draw("tile_trunk", 160, 0);   // 5 blocked
    atlas.draw("tile_rock", 192, 0);    // 6 blocked
    atlas.draw("tile_grass_a", 224, 0); // filler
    atlas.saveTexture("terrain_tiles");
    atlas.destroy();
  }

  makeGrassTexture(key, base, light, dark) {
    const t = this.textures.createCanvas(key, 32, 32);
    const c = t.getContext();
    const g = c.createLinearGradient(0, 0, 0, 32);
    g.addColorStop(0, light); g.addColorStop(1, base);
    c.fillStyle = g; c.fillRect(0, 0, 32, 32);
    c.globalAlpha = 0.25; c.strokeStyle = dark; c.lineWidth = 1;
    for (let i = 0; i < 36; i++) {
      const x = Math.random() * 32, y = 8 + Math.random() * 24;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Phaser.Math.Between(-1, 1), y - (2 + Math.random() * 6)); c.stroke();
    }
    c.globalAlpha = 1; t.refresh();
  }

  makePathTexture(key, base, light) {
    const t = this.textures.createCanvas(key, 32, 32);
    const c = t.getContext();
    const g = c.createLinearGradient(0, 0, 32, 32);
    g.addColorStop(0, light); g.addColorStop(1, base);
    c.fillStyle = g; c.fillRect(0, 0, 32, 32);
    for (let i = 0; i < 24; i++) {
      c.fillStyle = i % 2 === 0 ? "#81684a" : "#c4a986";
      c.globalAlpha = 0.2 + Math.random() * 0.25;
      c.fillRect(Math.random() * 31, Math.random() * 31, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    c.globalAlpha = 1; t.refresh();
  }

  makeRockTexture(key) {
    const t = this.textures.createCanvas(key, 32, 32);
    const c = t.getContext();
    c.fillStyle = "#5f6461"; c.beginPath(); c.ellipse(16, 18, 11, 9, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#888f8a"; c.beginPath(); c.ellipse(12, 14, 4, 3, 0, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 0.2; c.fillStyle = "#000"; c.fillRect(8, 24, 16, 3); c.globalAlpha = 1;
    t.refresh();
  }

  makeFlowerTexture(key) {
    const t = this.textures.createCanvas(key, 32, 32);
    const c = t.getContext();
    c.fillStyle = "#6ea866"; c.fillRect(0, 0, 32, 32);
    for (let i = 0; i < 10; i++) {
      c.fillStyle = Phaser.Math.RND.pick(["#ffd166", "#f9f3ce", "#ff89a8", "#fca311"]);
      c.beginPath(); c.arc(Phaser.Math.Between(3, 29), Phaser.Math.Between(6, 28), Phaser.Math.Between(1, 2), 0, Math.PI * 2); c.fill();
    }
    t.refresh();
  }

  makeTrunkTexture(key) {
    const t = this.textures.createCanvas(key, 32, 32);
    const c = t.getContext();
    c.fillStyle = "#5c3e28"; c.fillRect(12, 12, 8, 18);
    c.fillStyle = "#477649"; c.beginPath(); c.ellipse(16, 10, 12, 7, 0, 0, Math.PI * 2); c.fill();
    t.refresh();
  }

  makeHeroTexture(key) {
    const t = this.textures.createCanvas(key, 30, 46);
    const c = t.getContext();
    c.fillStyle = "#1f252b"; c.fillRect(8, 3, 14, 8);
    c.fillStyle = "#f1c8a3"; c.fillRect(9, 8, 12, 9);
    c.fillStyle = "#2f7898"; c.fillRect(6, 17, 18, 15);
    c.fillStyle = "#3c8eb1"; c.fillRect(7, 18, 3, 12);
    c.fillStyle = "#8c4e39"; c.fillRect(8, 31, 14, 4);
    c.fillStyle = "#233548"; c.fillRect(8, 35, 6, 10); c.fillRect(16, 35, 6, 10);
    c.fillStyle = "#35271f"; c.fillRect(8, 44, 6, 2); c.fillRect(16, 44, 6, 2);
    t.refresh();
  }

  makeNpcFrames() {
    const makeNpc = (key, torso, accent, shift) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xdab9a1, 1); g.fillRect(5 + shift, 2, 6, 4);
      g.fillStyle(torso, 1); g.fillRect(4 + shift, 8, 8, 9);
      g.fillStyle(accent, 1); g.fillRect(5 + shift, 11, 6, 3);
      g.fillStyle(0x332b26, 1); g.fillRect(4 + shift, 17, 3, 7); g.fillRect(9 + shift, 17, 3, 7);
      g.generateTexture(key, 16, 24); g.destroy();
    };
    makeNpc("npc_elder_1", 0x6b4ca6, 0x9b9ea6, 0); makeNpc("npc_elder_2", 0x6b4ca6, 0x9b9ea6, 1);
    makeNpc("npc_villager_1", 0x2f7fc2, 0x49a79f, 0); makeNpc("npc_villager_2", 0x2f7fc2, 0x49a79f, 1);
    makeNpc("npc_trainer_1", 0x2e7a39, 0x7b532e, 0); makeNpc("npc_trainer_2", 0x2e7a39, 0x7b532e, 1);
    makeNpc("npc_merchant_1", 0xa8632a, 0xd8b24a, 0); makeNpc("npc_merchant_2", 0xa8632a, 0xd8b24a, 1);
  }

  makeTreeCanopyTexture(key, w, h, base, light, dark) {
    const t = this.textures.createCanvas(key, w, h);
    const c = t.getContext();
    const g = c.createRadialGradient(w * 0.35, h * 0.28, 6, w * 0.5, h * 0.42, w * 0.44);
    g.addColorStop(0, light); g.addColorStop(1, base);
    c.fillStyle = g; c.beginPath(); c.ellipse(w * 0.5, h * 0.42, w * 0.42, h * 0.28, 0, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 0.35; c.fillStyle = dark;
    for (let i = 0; i < 30; i++) { c.beginPath(); c.ellipse(Phaser.Math.Between(8, w - 8), Phaser.Math.Between(8, Math.floor(h * 0.64)), Phaser.Math.Between(2, 6), Phaser.Math.Between(2, 5), 0, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1; c.fillStyle = "#5f3d24"; c.fillRect(Math.floor(w * 0.45), Math.floor(h * 0.56), Math.floor(w * 0.1), Math.floor(h * 0.44));
    t.refresh();
  }

  makeShadowTexture(key) {
    const t = this.textures.createCanvas(key, 80, 36);
    const c = t.getContext();
    const g = c.createRadialGradient(40, 18, 4, 40, 18, 35);
    g.addColorStop(0, "rgba(0,0,0,0.42)"); g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g; c.fillRect(0, 0, 80, 36); t.refresh();
  }

  makeVignetteTexture(key) {
    const t = this.textures.createCanvas(key, 512, 512);
    const c = t.getContext();
    const g = c.createRadialGradient(256, 256, 90, 256, 256, 290);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.34)");
    c.fillStyle = g; c.fillRect(0, 0, 512, 512); t.refresh();
  }

  createVillageMap() {
    const ground = [], obstacle = [], decor = [], treeSpots = [];
    const cx = Math.floor(this.mapW / 2), cy = Math.floor(this.mapH / 2);

    for (let y = 0; y < this.mapH; y++) {
      ground[y] = []; obstacle[y] = []; decor[y] = [];
      for (let x = 0; x < this.mapW; x++) {
        const noise = Math.sin(x * 0.22) + Math.cos(y * 0.2);
        let g = noise > 0 ? 1 : 0, o = -1, d = -1;
        const curve = Math.min(Math.abs(x - (cx + Math.sin((y - cy) * 0.34) * 2)), Math.abs(y - (cy + Math.cos((x - cx) * 0.31) * 1.7)));
        if (curve <= 1.2) g = Phaser.Math.Between(0, 1) ? 2 : 3;
        if (x === 0 || y === 0 || x === this.mapW - 1 || y === this.mapH - 1) o = 6;
        if (curve > 2 && Math.random() < 0.02) d = 4;
        ground[y][x] = g; obstacle[y][x] = o; decor[y][x] = d;
      }
    }

    for (let y = 2; y < this.mapH - 2; y++) {
      for (let x = 2; x < this.mapW - 2; x++) {
        const dist = Math.abs(x - cx) + Math.abs(y - cy);
        if (dist > 11 && Math.random() < 0.12) { obstacle[y][x] = 5; treeSpots.push({ x, y }); }
        if (dist > 13 && Math.random() < 0.03) obstacle[y][x] = 6;
      }
    }

    this.fillRect(obstacle, cx - 3, cy - 2, 7, 5, -1);
    this.carvePath(obstacle, 0, cy, cx, cy);
    this.carvePath(obstacle, this.mapW - 1, cy, cx, cy);
    this.carvePath(obstacle, cx, 0, cx, cy);
    this.carvePath(obstacle, cx, this.mapH - 1, cx, cy);

    const map = this.make.tilemap({ data: ground, tileWidth: this.tileSize, tileHeight: this.tileSize });
    const tileset = map.addTilesetImage("terrain_tiles");
    this.groundLayer = map.createLayer(0, tileset, 0, 0);
    const obstacleMap = this.make.tilemap({ data: obstacle, tileWidth: this.tileSize, tileHeight: this.tileSize });
    this.obstacleLayer = obstacleMap.createLayer(0, tileset, 0, 0);
    this.obstacleLayer.setCollision([5, 6]);
    const decorMap = this.make.tilemap({ data: decor, tileWidth: this.tileSize, tileHeight: this.tileSize });
    this.decorLayer = decorMap.createLayer(0, tileset, 0, 0);
    this.map = map;
    this.baseGrid = this.buildWalkGrid(obstacle);
    this.physics.world.setBounds(0, 0, this.mapW * this.tileSize, this.mapH * this.tileSize);
    this.createTreeCanopies(treeSpots);

    this.npcObjects = [
      { name: "elder", x: cx - 8, y: cy - 4 },
      { name: "villager", x: cx + 8, y: cy - 3 },
      { name: "trainer", x: cx - 7, y: cy + 4 },
      { name: "merchant", x: cx + 7, y: cy + 4 }
    ];
  }

  fillRect(layer, x, y, w, h, v) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (yy >= 0 && xx >= 0 && yy < this.mapH && xx < this.mapW) layer[yy][xx] = v; }
  carvePath(layer, x0, y0, x1, y1) { let x = x0, y = y0; while (x !== x1 || y !== y1) { if (x < x1) x++; else if (x > x1) x--; if (y < y1) y++; else if (y > y1) y--; for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) if (x + ox > 0 && y + oy > 0 && x + ox < this.mapW - 1 && y + oy < this.mapH - 1) layer[y + oy][x + ox] = -1; } }

  createTreeCanopies(treeSpots) {
    treeSpots.forEach((s) => {
      if (Math.random() < 0.2) return;
      const p = this.tileToWorld(s.x, s.y), large = Math.random() > 0.62;
      this.add.image(p.x + 1, p.y + 12, "fx_shadow").setScale(large ? 0.88 : 0.7).setAlpha(0.24).setDepth(p.y - 1);
      this.add.image(p.x, p.y - 22, large ? "tree_l" : "tree_s").setScale(0.9 + Math.random() * 0.2).setDepth(p.y + 20);
    });
  }

  buildWalkGrid(obstacleData) {
    const grid = [];
    for (let y = 0; y < this.mapH; y++) { grid[y] = []; for (let x = 0; x < this.mapW; x++) grid[y][x] = obstacleData[y][x] >= 0 ? 1 : 0; }
    return grid;
  }

  createCharacters() {
    const cX = Math.floor(this.mapW / 2), cY = Math.floor(this.mapH / 2), start = this.tileToWorld(cX, cY);
    this.playerShadow = this.add.image(start.x, start.y + 14, "fx_shadow").setScale(0.62).setAlpha(0.34);
    this.player = this.physics.add.image(start.x, start.y, "hero").setScale(1.58);
    this.player.body.setSize(14, 12); this.player.body.setOffset(8, 30); this.player.body.setCollideWorldBounds(true);
    this.npcs = this.physics.add.staticGroup(); this.npcByRole = {};
    this.npcObjects.forEach((obj) => {
      const p = this.tileToWorld(obj.x, obj.y), key = `npc_${obj.name}_1`;
      const npc = this.npcs.create(p.x, p.y, key).setScale(2); npc.role = obj.name; npc.tileX = obj.x; npc.tileY = obj.y; npc.refreshBody();
      npc.shadow = this.add.image(npc.x + 1, npc.y + 12, "fx_shadow").setScale(0.44).setAlpha(0.26);
      npc.setInteractive(new Phaser.Geom.Rectangle(-12, -16, 24, 32), Phaser.Geom.Rectangle.Contains);
      npc.on("pointerdown", () => this.startAutoWalkToNpc(obj.name, () => this.tryTalkToRole(obj.name)));
      npc.nameLabel = this.add.text(npc.x, npc.y - 34, `${obj.name.toUpperCase()} NPC`, { fontFamily: "Georgia, serif", fontSize: "11px", color: "#f6f2df", backgroundColor: "#1a1f1f88", padding: { x: 5, y: 2 } }).setOrigin(0.5, 1);
      this.npcByRole[obj.name] = npc;
    });
    this.physics.add.collider(this.player, this.obstacleLayer);
    this.physics.add.collider(this.player, this.npcs);
  }

  createNpcAnimations() {
    const addIdle = (key, a, b, fps) => this.anims.create({ key, frames: [{ key: a }, { key: b }], frameRate: fps, repeat: -1, yoyo: true });
    addIdle("npc_elder_idle", "npc_elder_1", "npc_elder_2", 1.3);
    addIdle("npc_villager_idle", "npc_villager_1", "npc_villager_2", 2);
    addIdle("npc_trainer_idle", "npc_trainer_1", "npc_trainer_2", 2.6);
    addIdle("npc_merchant_idle", "npc_merchant_1", "npc_merchant_2", 1.8);
    this.npcs.getChildren().forEach((npc) => npc.play(`npc_${npc.role}_idle`));
  }

  createEnvironmentFx() {
    const w = this.mapW * this.tileSize, h = this.mapH * this.tileSize;
    this.add.ellipse(w * 0.25, h * 0.16, 560, 360, 0xffefbf, 0.12).setDepth(2000);
    this.add.particles(0, 0, "tile_flower", { x: { min: 0, max: w }, y: { min: 0, max: h }, lifespan: { min: 3400, max: 6500 }, speedX: { min: -6, max: 6 }, speedY: { min: -9, max: 0 }, scale: { start: 0.07, end: 0.02 }, alpha: { start: 0.16, end: 0 }, quantity: 1, frequency: 300 }).setDepth(1900);
    this.vignette = this.add.image(w / 2, h / 2, "fx_vignette").setDisplaySize(w, h).setDepth(9990).setAlpha(0.55);
  }

  setupPathfinding() {
    this.pathFinder = (window.EasyStar && window.EasyStar.js) ? new window.EasyStar.js() : null;
    this.currentPath = []; this.pathIndex = 0; this.isPathMoving = false; this.pendingArriveCallback = null; this.lastPathRequestAt = 0; this.pathRequestCooldownMs = 70;
    if (this.pathFinder) { this.pathFinder.setAcceptableTiles([0]); this.pathFinder.enableDiagonals(); this.pathFinder.disableCornerCutting(); this.pathFinder.setIterationsPerCalculation(2000); this.pathFinder.setGrid(this.baseGrid); }
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({ w: Phaser.Input.Keyboard.KeyCodes.W, a: Phaser.Input.Keyboard.KeyCodes.A, s: Phaser.Input.Keyboard.KeyCodes.S, d: Phaser.Input.Keyboard.KeyCodes.D, shift: Phaser.Input.Keyboard.KeyCodes.SHIFT, e: Phaser.Input.Keyboard.KeyCodes.E });
    this.input.on("pointerdown", (pointer) => { const npc = this.getNpcAtWorld(pointer.worldX, pointer.worldY); if (npc) this.startAutoWalkToNpc(npc.role, () => this.tryTalkToRole(npc.role)); else this.startAutoWalkToWorld(pointer.worldX, pointer.worldY, null); });
  }

  setupCamera() {
    const w = this.mapW * this.tileSize, h = this.mapH * this.tileSize;
    this.cameras.main.setBounds(0, 0, w, h); this.cameras.main.startFollow(this.player, true, 0.12, 0.12); this.cameras.main.setZoom(1.35);
  }

  createUiHints() {
    this.promptText = this.add.text(12, 12, "", { fontFamily: "monospace", fontSize: "12px", color: "#f6f1dc", backgroundColor: "#00000066", padding: { x: 8, y: 4 } }).setScrollFactor(0).setDepth(10000);
    this.debugText = this.add.text(12, 36, "", { fontFamily: "monospace", fontSize: "10px", color: "#d3e7ff", backgroundColor: "#00000055", padding: { x: 6, y: 3 } }).setScrollFactor(0).setDepth(10000);
  }

  worldToTile(wx, wy) { return { x: Phaser.Math.Clamp(this.map.worldToTileX(wx), 0, this.mapW - 1), y: Phaser.Math.Clamp(this.map.worldToTileY(wy), 0, this.mapH - 1) }; }
  tileToWorld(tx, ty) { return { x: this.map.tileToWorldX(tx) + this.tileSize / 2, y: this.map.tileToWorldY(ty) + this.tileSize / 2 }; }
  getNpcAtWorld(wx, wy) { let found = null, best = Infinity; this.npcs.getChildren().forEach((npc) => { const d = Phaser.Math.Distance.Between(wx, wy, npc.x, npc.y); if (d < 26 && d < best) { best = d; found = npc; } }); return found; }
  isWalkableTile(tx, ty, navGrid) { if (tx < 0 || ty < 0 || tx >= this.mapW || ty >= this.mapH) return false; return navGrid[ty][tx] === 0; }
  copyGridWithNpcBlocks(targetRole) { const grid = this.baseGrid.map((row) => row.slice()); this.npcs.getChildren().forEach((npc) => { if (npc.role !== targetRole) grid[npc.tileY][npc.tileX] = 1; }); return grid; }
  nearestWalkableAdjacentToNpc(role, navGrid, fromTile) { const npc = this.npcByRole[role]; if (!npc) return null; const dirs = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]; const c = dirs.map(([dx, dy]) => ({ x: npc.tileX + dx, y: npc.tileY + dy })).filter((t) => this.isWalkableTile(t.x, t.y, navGrid)); if (c.length === 0) return null; c.sort((a, b) => (Math.abs(a.x - fromTile.x) + Math.abs(a.y - fromTile.y)) - (Math.abs(b.x - fromTile.x) + Math.abs(b.y - fromTile.y))); return c[0]; }

  startAutoWalkToNpc(role, onArrive) {
    const npc = this.npcByRole[role];
    if (!npc) { if (typeof onArrive === "function") onArrive(); return false; }
    const startTile = this.worldToTile(this.player.x, this.player.y), navGrid = this.copyGridWithNpcBlocks(role), goal = this.nearestWalkableAdjacentToNpc(role, navGrid, startTile);
    if (!goal) { if (typeof onArrive === "function") onArrive(); return false; }
    this.findPath(startTile, goal, navGrid, (path) => { if (!path || path.length === 0) { if (typeof onArrive === "function") onArrive(); return; } this.startFollowingPath(path, onArrive); });
    return true;
  }

  startAutoWalkToWorld(worldX, worldY, onArrive) {
    const now = performance.now(); if (now - this.lastPathRequestAt < this.pathRequestCooldownMs) return false; this.lastPathRequestAt = now;
    const startTile = this.worldToTile(this.player.x, this.player.y), goalTile = this.worldToTile(worldX, worldY), navGrid = this.copyGridWithNpcBlocks(null);
    let goal = goalTile; if (!this.isWalkableTile(goal.x, goal.y, navGrid)) { goal = this.findNearestWalkable(goalTile, navGrid, 5); if (!goal) return false; }
    this.findPath(startTile, goal, navGrid, (path) => { if (!path || path.length === 0) return; this.startFollowingPath(path, onArrive); });
    return true;
  }

  findNearestWalkable(origin, navGrid, maxRadius) { if (this.isWalkableTile(origin.x, origin.y, navGrid)) return origin; for (let r = 1; r <= maxRadius; r++) for (let y = origin.y - r; y <= origin.y + r; y++) for (let x = origin.x - r; x <= origin.x + r; x++) if (this.isWalkableTile(x, y, navGrid)) return { x, y }; return null; }
  findPath(startTile, endTile, navGrid, callback) { if (!this.pathFinder) { callback([startTile, endTile]); return; } this.pathFinder.setGrid(navGrid); this.pathFinder.findPath(startTile.x, startTile.y, endTile.x, endTile.y, (path) => callback(path || null)); }
  startFollowingPath(path, onArrive) { this.currentPath = path; this.pathIndex = 0; this.isPathMoving = true; this.pendingArriveCallback = onArrive || null; }

  advanceAlongPath(speed) {
    if (!this.isPathMoving || this.currentPath.length === 0) return false;
    if (this.pathIndex >= this.currentPath.length) { this.stopPathMove(true); return false; }
    const node = this.currentPath[this.pathIndex], target = this.tileToWorld(node.x, node.y), dx = target.x - this.player.x, dy = target.y - this.player.y, dist = Math.hypot(dx, dy);
    if (dist <= this.waypointThreshold) { this.pathIndex += 1; if (this.pathIndex >= this.currentPath.length) this.stopPathMove(true); this.player.body.setVelocity(0, 0); return true; }
    this.player.body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
    return true;
  }

  stopPathMove(arrived) {
    this.isPathMoving = false; this.currentPath = []; this.pathIndex = 0; this.player.body.setVelocity(0, 0);
    if (arrived && typeof this.pendingArriveCallback === "function") { const cb = this.pendingArriveCallback; this.pendingArriveCallback = null; cb(); } else this.pendingArriveCallback = null;
  }

  tryTalkToRole(role) {
    if (!window.Chapter1Scene) return;
    if (role === "elder" && typeof Chapter1Scene.talkToElder === "function") Chapter1Scene.talkToElder();
    else if (role === "villager" && typeof Chapter1Scene.talkToVillager === "function") Chapter1Scene.talkToVillager();
  }

  nearestNpcInRange(rangePx) {
    let closest = null, best = Infinity;
    this.npcs.getChildren().forEach((npc) => { const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y); if (d <= rangePx && d < best) { best = d; closest = npc; } });
    return closest;
  }

  updateDepths() {
    this.playerShadow.setPosition(this.player.x + 1, this.player.y + 14).setDepth(this.player.y - 2);
    this.player.setDepth(this.player.y + 18);
    this.npcs.getChildren().forEach((npc) => {
      npc.setDepth(npc.y + 18);
      if (npc.shadow) npc.shadow.setPosition(npc.x + 1, npc.y + 12).setDepth(npc.y - 2);
      if (npc.nameLabel) npc.nameLabel.setPosition(npc.x, npc.y - 34).setDepth(npc.y + 60);
    });
  }

  update() {
    if (this.pathFinder) this.pathFinder.calculate();
    const movingSpeed = this.keys.shift.isDown ? this.sprintSpeed : this.playerSpeed;
    let handledByPath = false; if (this.isPathMoving) handledByPath = this.advanceAlongPath(movingSpeed);

    if (!handledByPath) {
      let vx = 0, vy = 0;
      const up = this.cursors.up.isDown || this.keys.w.isDown, down = this.cursors.down.isDown || this.keys.s.isDown, left = this.cursors.left.isDown || this.keys.a.isDown, right = this.cursors.right.isDown || this.keys.d.isDown;
      if (left) vx -= 1; if (right) vx += 1; if (up) vy -= 1; if (down) vy += 1;
      if (vx !== 0 && vy !== 0) { vx *= 0.7071; vy *= 0.7071; }
      this.player.body.setVelocity(vx * movingSpeed, vy * movingSpeed);
    }

    this.updateDepths();
    const nearNpc = this.nearestNpcInRange(42);
    if (nearNpc) { this.promptText.setText(`Press E to talk: ${nearNpc.role.toUpperCase()}`); if (Phaser.Input.Keyboard.JustDown(this.keys.e)) this.tryTalkToRole(nearNpc.role); }
    else this.promptText.setText("Click ground or NPC to move");
    const p = this.worldToTile(this.player.x, this.player.y);
    this.debugText.setText(`Tile ${p.x},${p.y} | speed ${movingSpeed} | path ${this.currentPath.length}`);
  }
}
