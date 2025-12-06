window.GameTowers = window.GameTowers || {};

// Shared update function for standard towers
function standardUpdate(tower, gameState) {
    if (tower.cooldown > 0) return;
    
    const stats = window.TowerUtils.getTowerStats(tower);
    const target = window.TowerUtils.findTarget(tower, gameState.enemies, stats.range);
    
    if (target) {
        window.TowerUtils.fireProjectile(tower, target, stats, gameState);
        window.TowerUtils.updateRotation(tower, target);
    }
}

// 1. GUNNER
window.GameTowers.GUNNER = { 
    id: 'GUNNER', name: 'Cannon', rarity: "COMMON", cost: 3, range: 3.5, damage: 20, fireRate: 40, 
    icon: '🔫', color: '#718096', desc: 'Standard Defense', projectileColor: '#000',
    targetType: 'GROUND', rotationOffset: Math.PI,
    update: standardUpdate
};

// 2. SNIPER
window.GameTowers.SNIPER = { 
    id: 'SNIPER', name: 'Ranger', rarity: "RARE", cost: 5, range: 7, damage: 100, fireRate: 140, 
    icon: '🏹', color: '#4299e1', desc: 'High Single Target', projectileColor: '#63b3ed',
    targetType: 'BOTH', rotationOffset: Math.PI / 4 + Math.PI,
    update: standardUpdate
};

// 3. AIR (Anti-Air)
window.GameTowers.AIR = { 
    id: 'AIR', name: 'Skyguard', rarity: "RARE", cost: 5, range: 6.5, damage: 35, fireRate: 20, 
    icon: '🚀', color: '#e53e3e', desc: 'Rapid Air Fire', projectileColor: '#fc8181',
    targetType: 'AIR', rotationOffset: Math.PI / 4,
    update: standardUpdate
};

// 4. RAPID (Flak)
window.GameTowers.RAPID = { 
    id: 'RAPID', name: 'Flak', rarity: "COMMON", cost: 4, range: 4.5, damage: 12, fireRate: 6, 
    icon: '🚁', color: '#D69E2E', desc: 'Rapid Air Shredder', projectileColor: '#FAF089',
    targetType: 'AIR', rotationOffset: Math.PI,
    update: standardUpdate
};

// 5. ICE (Frost)
window.GameTowers.ICE = { 
    id: 'ICE', name: 'Frost', rarity: "COMMON", cost: 4, range: 4.0, damage: 8, fireRate: 40, 
    icon: '❄️', color: '#81e6d9', desc: 'Slows Enemies', projectileColor: '#e6fffa',
    targetType: 'GROUND', rotationOffset: 0, fixed: true,
    effect: { type: 'slow', factor: 0.5, duration: 60 },
    update: standardUpdate
};

// 6. VENOM (Poison)
window.GameTowers.VENOM = { 
    id: 'VENOM', name: 'Venom', rarity: "RARE", cost: 5, range: 4.5, damage: 15, fireRate: 60, 
    icon: '🐍', color: '#48bb78', desc: 'Applies Poison', projectileColor: '#68d391',
    targetType: 'GROUND', rotationOffset: Math.PI / 2,
    effect: { type: 'poison', damage: 2, duration: 600 },
    update: standardUpdate
};