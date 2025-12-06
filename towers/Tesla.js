window.GameTowers = window.GameTowers || {};

window.GameTowers.TESLA = { 
    id: 'TESLA', name: 'Tesla', rarity: "EPIC", cost: 7, range: 4.0, damage: 45, fireRate: 50, 
    icon: '⚡', color: '#ecc94b', 
    
    update: window.TowerEngine.updateTower,
    targetType: 'BOTH',
    fixed: true,
    
    attackType: 'PROJECTILE',
    projectileType: 'LINEAR',
    projectileSpeed: 100, // Instant
    projectileColor: 'transparent', // INVISIBLE PROJECTILE
    
    chainConfig: {
        depth: 3,     
        range: 3.5,   
        decay: 0.3,
        color: '#ecc94b' // VISIBLE LIGHTNING COLOR
    }
};