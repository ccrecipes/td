window.GameTowers = window.GameTowers || {};

window.GameTowers.INFERNO = { 
    id: 'INFERNO', name: 'Inferno', rarity: "MYTHIC", cost: 10, range: 6.5, damage: 80, fireRate: 240, 
    icon: '🌋', color: '#c2410c', 
    desc: "Unleashes the fury of a dormant volcano. Its magma projectiles create burning zones that melt even the toughest armor.",
    
    update: window.TowerEngine.updateTower,
    targetType: 'GROUND',
    minRange: 2.0,
    
    attackType: 'PROJECTILE',
    projectileType: 'ARC',
    projectileSpeed: 3,
    projectileColor: '#f97316',
    
    aoeRadius: 1.0,
    
    onHitZone: {
        radius: 1.0,
        duration: 600, // 10 seconds
        color: 'rgba(234, 88, 12, 0.5)',
        tickEffect: { 
            type: 'DOT', 
            name: 'magma_burn', 
            damage: 5, 
            tickRate: 20, 
            duration: 20,
            color: '#f97316'
        } 
    }
};