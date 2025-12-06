window.GameTowers = window.GameTowers || {};

window.GameTowers.HONEY = { 
    id: 'HONEY', name: 'Honey', rarity: "COMMON", cost: 4, range: 2, damage: 0, fireRate: 90, 
    icon: '🍯', color: '#d69e2e', 
    desc: "Sticky, sweet, and incredibly annoying. Covers the ground in high-viscosity syrup that slows enemies to a halt.",
    
    update: window.TowerEngine.updateTower,
    targetType: 'GROUND',
    defaultStrategy: 'FIRST', // Targets front of the line
    
    attackType: 'PROJECTILE',
    projectileType: 'ARC',
    projectileSpeed: 4,
    projectileColor: '#b7791f',
    
    aoeRadius: 1.5, // Impact Splash
    
    onHitZone: {
        radius: 0.75,
        duration: 240, // 4 seconds
        color: 'rgba(214, 158, 46, 0.5)',
        tickEffect: { type: 'SLOW', factor: 0.5, duration: 10 }
    }
};