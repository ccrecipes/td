window.GameTowers = window.GameTowers || {};

window.GameTowers.SEEKER = { 
    id: 'SEEKER', name: 'Seeker', rarity: "LEGENDARY", cost: 9, range: 8.0, damage: 30, fireRate: 120, 
    icon: '🚀', color: '#1e3a8a', 
    desc: "Fires self-guided missiles that hunt down targets with relentless precision. You can run, but you'll just die tired.",
    
    update: window.TowerEngine.updateTower,
    targetType: 'BOTH',
    
    attackType: 'PROJECTILE',
    projectileType: 'HOMING',
    projectileSpeed: 2, // Starts slow...
    maxSpeed: 12,       // ...accelerates to 12
    projectileColor: '#3b82f6',
    
    aoeRadius: 2.0
};