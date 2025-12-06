window.GameTowers = window.GameTowers || {};
const genericUpdate = window.TowerEngine.updateTower;

// 1. GUNNER (Cannon)
window.GameTowers.GUNNER = { 
    id: 'GUNNER', name: 'Cannon', rarity: "COMMON", cost: 3, range: 3.5, damage: 20, fireRate: 40, 
    icon: '💣', color: '#718096', 
    desc: "A standard-issue heavy cannon used by the Emoji Guard. Reliable, sturdy, and always ready to defend the kingdom from circular threats.",
    
    update: genericUpdate,
    targetType: 'GROUND',
    attackType: 'PROJECTILE',
    projectileType: 'LOCKED', // Tracks enemy
    projectileSpeed: 8,
    projectileColor: '#000'
};

// 2. SNIPER (Ranger)
window.GameTowers.SNIPER = { 
    id: 'SNIPER', name: 'Ranger', rarity: "RARE", cost: 5, range: 7, damage: 100, fireRate: 140, 
    icon: '🏹', color: '#4299e1', 
    desc: "Armed with a long-range spectral bow, the Ranger picks off high-value targets from a distance. Rumor has it they never blink.",
    
    update: genericUpdate,
    targetType: 'BOTH',
    defaultStrategy: 'STRONGEST',
    
    attackType: 'PROJECTILE',
    projectileType: 'LOCKED', // Tracks enemy
    projectileSpeed: 20,
    projectileColor: '#63b3ed',
    
    critChance: 0.2, 
    critMultiplier: 2.0
};

// 3. AIR (Skyguard)
window.GameTowers.AIR = { 
    id: 'AIR', name: 'Skyguard', rarity: "RARE", cost: 5, range: 6.5, damage: 35, fireRate: 20, 
    icon: '☁️', color: '#e53e3e', 
    desc: "Constructed after the Great Balloon Invasion, the Skyguard specializes in puncturing anything that dares to fly.",
    
    update: genericUpdate,
    targetType: 'AIR', 
    
    attackType: 'PROJECTILE',
    projectileType: 'LOCKED', // Tracks enemy
    projectileSpeed: 12,
    projectileColor: '#fc8181'
};

// 4. RAPID (Flak)
window.GameTowers.RAPID = { 
    id: 'RAPID', name: 'Flak', rarity: "COMMON", cost: 4, range: 4.5, damage: 12, fireRate: 6, 
    icon: '🎇', color: '#D69E2E', 
    desc: "Fires a storm of shrapnel to shred aerial swarms. The operators are known for their love of loud noises.",
    
    update: genericUpdate,
    targetType: 'AIR',
    
    attackType: 'PROJECTILE',
    projectileType: 'LOCKED', // Tracks enemy
    projectileSpeed: 10,
    projectileColor: '#FAF089'
};

// 5. ICE (Frost)
window.GameTowers.ICE = { 
    id: 'ICE', name: 'Frost', rarity: "COMMON", cost: 4, range: 4.0, damage: 8, fireRate: 40, 
    icon: '❄️', color: '#81e6d9', 
    desc: "Harnesses the chill of the Northern Pixels. Enemies struck by its shards find their movement slowed to a crawl.",
    
    update: genericUpdate,
    targetType: 'GROUND',
    fixed: true, 
    
    attackType: 'PROJECTILE',
    projectileType: 'LINEAR', // Keeps shooting straight
    projectileSpeed: 8,
    projectileColor: '#e6fffa',
    
    onHitEffect: { 
        type: 'SLOW', 
        factor: 0.5, 
        duration: 60,
        chance: 1.0 
    }
};

// 6. VENOM (Poison)
window.GameTowers.VENOM = { 
    id: 'VENOM', name: 'Venom', rarity: "RARE", cost: 5, range: 4.5, damage: 15, fireRate: 60, 
    icon: '🤢', color: '#48bb78', 
    desc: "Dips its projectiles in a corrosive toxin brewed in the swamp lands. The poison lingers long after the impact.",
    
    update: genericUpdate,
    targetType: 'GROUND',
    
    attackType: 'PROJECTILE',
    projectileType: 'LOCKED', // Tracks enemy
    projectileSpeed: 8,
    projectileColor: '#68d391',
    
    onHitEffect: { 
        type: 'DOT', 
        name: 'poison', 
        damage: 2, 
        duration: 600, 
        tickRate: 40,
        color: '#48bb78'
    }
};