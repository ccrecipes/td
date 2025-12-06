window.GameTowers = window.GameTowers || {};

window.GameTowers.CROSSFIRE = { 
    id: 'CROSSFIRE', name: 'Crossfire', rarity: "EPIC", cost: 7, range: 7.5, damage: 60, fireRate: 300, 
    icon: '✚', color: '#be185d', 
    desc: "A stationary turret that fires in a fixed cardinal pattern. Perfect for creating kill zones at intersections.",
    
    update: window.TowerEngine.updateTower,
    targetType: 'GROUND',
    fixed: true,
    fireMode: 'BURST_CARDINAL', 
    
    attackType: 'PROJECTILE',
    projectileType: 'LINEAR',
    projectileSpeed: 0.5, // Slower projectiles
    projectileColor: '#be185d',
    
    checkCollisions: true, // Fix: Hit enemies in path
    
    aoeRadius: 1.5,
    sequentialDelay: 60 // 1 second delay between shots
};