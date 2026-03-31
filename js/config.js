/* ============================================
   JAVA ODYSSEY - Game Configuration
   ============================================ */

const CONFIG = {
    // Game Info
    GAME_TITLE: "Java Odyssey",
    GAME_SUBTITLE: "Trials of the Code Guardian",
    VERSION: "1.0.0",
    
    // Text Speed (ms per character)
    TEXT_SPEED: {
        fast: 15,
        normal: 30,
        slow: 50
    },
    
    // Player Defaults
    PLAYER_DEFAULTS: {
        name: "Guardian",
        level: 1,
        xp: 0,
        xpToNext: 100,
        gold: 0,
        hp: 100,
        maxHp: 100,
        position: "village",
        attack: 10,
        defense: 5,
        xpBonus: 0,
        coinBonus: 0
    },

    PLAYER_HEALTH: {
        startingPosition: "village",
        startingScene: "ch1_village_square",
        correctAnswerHeal: 5,
        easyWrongAnswerDamage: 10,
        mediumWrongAnswerDamage: 15,
        bossWrongAnswerDamage: 25,
        respawnDelayMs: 2000
    },
    
    // XP Rewards
    XP_REWARDS: {
        correctAnswer: 25,
        correctFirstTry: 50,
        questComplete: 100,
        chapterComplete: 250,
        bonusChallenge: 75
    },
    
    // Combat
    COMBAT: {
        baseDamage: 25,
        critMultiplier: 2,
        hintPenalty: 0.5, // damage multiplier when hint was used
        maxHints: 3,
        maxAttempts: 5
    },
    
    // Difficulty Scaling (rule-based adaptive)
    DIFFICULTY: {
        // If player gets X correct in a row, increase difficulty
        streakToIncrease: 3,
        // If player fails X times, decrease difficulty
        failsToDecrease: 2,
        levels: ['beginner', 'intermediate', 'advanced']
    },
    
    // Save Key
    SAVE_KEY: 'java_odyssey_save',
    SETTINGS_KEY: 'java_odyssey_settings',
    
    // ASCII Art Placeholders
    // These can be replaced with actual sprite images later
    PLACEHOLDER_SPRITES: false,
    ENABLE_PHASER_WORLD: false
};

// Character Portraits (emoji placeholders - replace with image paths)
const PORTRAITS = {
    player: '🧑‍💻',
    mentor: '🧙‍♂️',
    mysterious: '🕵️',
    villager: '👨‍🌾',
    elder: '👴',
    enemy_bug: '🐛',
    enemy_glitch: '👾',
    enemy_virus: '🦠',
    enemy_corrupted: '💀',
    enemy_null: '⬛',
    narrator: '📖'
};

// ASCII Art for scenes and enemies
const ASCII_ART = {
    // Modern City Scene
    modernCity: `
        ┌──────┐  ┌────────┐  ┌──────┐
        │ ████ │  │ ██████ │  │ ████ │
        │ ████ │  │ ██████ │  │ ████ │
        │ ████ │  │ ██████ │  │ ████ │
        │ ████ │  │ ██████ │  │ ████ │
        │ ▓▓▓▓ │  │ ▓▓▓▓▓▓ │  │ ▓▓▓▓ │
        │ ░░░░ │  │ ░░░░░░ │  │ ░░░░ │
        └──┬┬──┘  └───┬┬───┘  └──┬┬──┘
    ═══════╧╧═════════╧╧═════════╧╧═══════
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░`,

    // Campus/University
    campus: `
           ╔══════════════════╗
           ║  CS DEPARTMENT   ║
           ╠══════════════════╣
           ║ ┌──┐  ┌──┐ ┌──┐ ║
           ║ │░░│  │░░│ │░░│ ║
           ║ │░░│  │░░│ │░░│ ║
           ║ └──┘  └──┘ └──┘ ║
           ║     ┌────┐      ║
           ╚═════╡ ▓▓ ╞══════╝
    ─────────────┴────┴──────────────`,

    // Dark Alley
    darkAlley: `
    ▓▓▓▓│          │▓▓▓▓
    ▓▓▓▓│  ░░  ░░  │▓▓▓▓
    ▓▓▓▓│          │▓▓▓▓
    ▓▓▓▓│    ??    │▓▓▓▓
    ▓▓▓▓│          │▓▓▓▓
    ▓▓▓▓│  ░░  ░░  │▓▓▓▓
    ▓▓▓▓│          │▓▓▓▓
    ════╧══════════╧════`,

    // Portal
    portal: `
           ╭─────────────╮
        ╭──┤  ◈ ◈ ◈ ◈   ├──╮
       ╭┤  │ ◈       ◈   │  ├╮
       │╰──┤   PORTAL    ├──╯│
       │   │ ◈       ◈   │   │
       ╰──┬┤  ◈ ◈ ◈ ◈   ├┬──╯
          ╰┤             ├╯
           ╰─────────────╯
        ～～～～～～～～～～～～～`,

    // Medieval Village
    medievalVillage: `
        🌳          ⛪          🌳
           🏠    🏠    🏠    🏠
        🌳    🏠    ⛲    🏠    🌳
           🏠    🏠    🏠    🏠
    ═══════════════════════════════════
    ～～～🌿～～～🌿～～～🌿～～～🌿～～～`,

    // Forest Path
    forestPath: `
    🌲🌳  🌲  🌳🌲  🌳  🌲🌳
      🌲    ░░░░░░    🌲
    🌳  🌲  ░░░░░░  🌲  🌳
      🌳    ░░░░░░    🌳
    🌲  🌳  ░░░░░░  🌳  🌲
      🌲    ░░░░░░    🌲
    🌳🌲  🌳  🌲🌳  🌲  🌳🌲`,

    // Bug Enemy
    enemyBug: `
        ╔═══════════╗
        ║  ┌─┐ ┌─┐  ║
        ║  │●│ │●│  ║
        ║  └─┘ └─┘  ║
        ║   ╲___╱   ║
        ║  ╱│   │╲  ║
        ║ ╱ │ ▓ │ ╲ ║
        ║╱  │   │  ╲║
        ╚═══╧═══╧═══╝
         [SYNTAX BUG]`,

    // Glitch Enemy
    enemyGlitch: `
        ▓░▓░▓░▓░▓░▓
        ░ ╔═══════╗ ░
        ▓ ║ █ ░ █ ║ ▓
        ░ ║ ░▓▓▓░ ║ ░
        ▓ ║ ▓▓▓▓▓ ║ ▓
        ░ ║ █░░░█ ║ ░
        ▓ ╚═══════╝ ▓
        ░▓░▓░▓░▓░▓░▓
        [DATA GLITCH]`,

    // Null Pointer Enemy
    enemyNull: `
        ┌───────────┐
        │  N U L L  │
        │ ┌───────┐ │
        │ │ ????? │ │
        │ │ ????? │ │
        │ │ ????? │ │
        │ └───────┘ │
        │  P T R    │
        └───────────┘
       [NULL POINTER]`,

    // Corrupted Script Enemy
    enemyCorrupted: `
        ╔═══════════╗
        ║ ▒▒▒▒▒▒▒▒▒ ║
        ║ ▒ ERROR ▒ ║
        ║ ▒▒▒▒▒▒▒▒▒ ║
        ║ █████████ ║
        ║ ▒ 0x0FF ▒ ║
        ║ ▒▒▒▒▒▒▒▒▒ ║
        ╚═══════════╝
      [CORRUPTED SCRIPT]`,

    // Player Character
    player: `
        ┌───┐
        │ ◕ │
        ├───┤
        │ ▓ │
        │ ▓ │
        └─┬─┘
         ╱ ╲`
};

