window.GameTowers = window.GameTowers || {};
const genericUpdate = window.TowerEngine.updateTower;

// 1. GUNNER (Cannon) - CHANGED to LOCKED
window.GameTowers.GUNNER = { 
    id: 'GUNNER', name: 'Cannon', rarity: "COMMON", cost: 3, range: 3.5, damage: 20, fireRate: 40, 
    icon: '💣', color: '#718096', 
    
    update: genericUpdate,
    targetType: 'GROUND',
    attackType: 'PROJECTILE',
    projectileType: 'LOCKED', // Tracks enemy
    projectileSpeed: 8,
    projectileColor: '#000'
};

// 2. SNIPER (Ranger) - CHANGED to LOCKED
window.GameTowers.SNIPER = { 
    id: 'SNIPER', name: 'Ranger', rarity: "RARE", cost: 5, range: 7, damage: 100, fireRate: 140, 
    icon: '🏹', color: '#4299e1', 
    
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

// 3. AIR (Skyguard) - CHANGED to LOCKED
window.GameTowers.AIR = { 
    id: 'AIR', name: 'Skyguard', rarity: "RARE", cost: 5, range: 6.5, damage: 35, fireRate: 20, 
    icon: '🚀', color: '#e53e3e', 
    
    update: genericUpdate,
    targetType: 'AIR', 
    
    attackType: 'PROJECTILE',
    projectileType: 'LOCKED', // Tracks enemy
    projectileSpeed: 12,
    projectileColor: '#fc8181'
};

// 4. RAPID (Flak) - CHANGED to LOCKED
window.GameTowers.RAPID = { 
    id: 'RAPID', name: 'Flak', rarity: "COMMON", cost: 4, range: 4.5, damage: 12, fireRate: 6, 
    icon: '💥', color: '#D69E2E', 
    
    update: genericUpdate,
    targetType: 'AIR',
    
    attackType: 'PROJECTILE',
    projectileType: 'LOCKED', // Tracks enemy
    projectileSpeed: 10,
    projectileColor: '#FAF089'
};

// 5. ICE (Frost) - FIXED (Kept LINEAR as it is usually a skill shot, but can be LOCKED if preferred)
window.GameTowers.ICE = { 
    id: 'ICE', name: 'Frost', rarity: "COMMON", cost: 4, range: 4.0, damage: 8, fireRate: 40, 
    icon: '❄️', color: '#81e6d9', 
    
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

// 6. VENOM (Poison) - CHANGED to LOCKED
window.GameTowers.VENOM = { 
    id: 'VENOM', name: 'Venom', rarity: "RARE", cost: 5, range: 4.5, damage: 15, fireRate: 60, 
    icon: '🧪', color: '#48bb78', 
    
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