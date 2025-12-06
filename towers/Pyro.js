window.GameTowers = window.GameTowers || {};

window.GameTowers.PYRO = { 
    id: 'PYRO', name: 'Pyro', rarity: "RARE", cost: 6, range: 3.5, damage: 2, fireRate: 3, 
    icon: '🔥', color: '#ed8936', 
    
    update: window.TowerEngine.updateTower,
    targetType: 'GROUND',
    defaultStrategy: 'CLOSEST',
    
    // NEW CONE CONFIGURATION
    attackType: 'CONE',
    coneAngle: 0.8, // ~45 degrees
    projectileColor: 'rgba(237, 137, 54, 0.7)', // Particle color
    
    onHitEffect: { 
        type: 'DOT', 
        name: 'burn', 
        damage: 5, 
        duration: 180,
        color: '#ed8936'
    }
};