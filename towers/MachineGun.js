window.GameTowers = window.GameTowers || {};

window.GameTowers.MACHINE_GUN = { 
    id: 'MACHINE_GUN', name: 'Gatling', rarity: "EPIC", cost: 8, range: 6.0, damage: 8, fireRate: 4, 
    icon: '🔫', color: '#4a5568', 
    
    update: window.TowerEngine.updateTower,
    targetType: 'GROUND',
    defaultStrategy: 'CLOSEST',
    
    attackType: 'PROJECTILE',
    projectileType: 'LINEAR',
    projectileSpeed: 12,
    projectileColor: '#fbbf24',
    
    checkCollisions: true, // "Dumbfire" - hits whatever it touches first
    
    // Mechanics supported by engine:
    maxAmmo: 60,
    reloadTime: 120, // 2 seconds reload
    critChance: 0.05
};