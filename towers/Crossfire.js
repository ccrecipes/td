window.GameTowers = window.GameTowers || {};

window.GameTowers.CROSSFIRE = { 
    id: 'CROSSFIRE', name: 'Crossfire', rarity: "EPIC", cost: 7, range: 7.5, damage: 60, fireRate: 300, 
    icon: '✚', color: '#be185d', 
    
    update: window.TowerEngine.updateTower,
    targetType: 'GROUND',
    fixed: true,
    fireMode: 'BURST_CARDINAL', // The engine handles the 4-way split
    
    attackType: 'PROJECTILE',
    projectileType: 'LINEAR',
    projectileSpeed: 4, // Slow moving projectiles
    projectileColor: '#be185d',
    
    aoeRadius: 1.5
};