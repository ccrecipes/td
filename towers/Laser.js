window.GameTowers = window.GameTowers || {};

window.GameTowers.LASER = { 
    id: 'LASER', name: 'Void Eye', rarity: "LEGENDARY", cost: 9, range: 5.0, 
    desc: "An ancient artifact that stares into your soul. Its beam intensifies the longer it focuses on a single target.",
    
    // RAMPING STATS
    damage: 30,         // Starting DPS (low)
    maxDamage: 1000,     // Max DPS (very high)
    rampDuration: 600,  // Time to reach max (10 seconds)
    
    fireRate: 1, // Fires every frame (beam logic handles per-frame damage)
    icon: '👁️', color: '#805ad5', 
    
    update: window.TowerEngine.updateTower,
    targetType: 'BOTH',
    defaultStrategy: 'FIRST',
    
    attackType: 'BEAM', // Trigger beam logic
    projectileColor: '#a855f7'
};