window.GameTowers = window.GameTowers || {};

window.GameTowers.MORTAR = { 
    id: 'MORTAR', name: 'Bomber', rarity: "RARE", cost: 6, range: 6.0, damage: 80, fireRate: 180, 
    icon: '💣', color: '#2d3748', 
    desc: "Lobs heavy explosives in a high arc. Ideal for blasting groups of enemies, provided they don't move too fast.",
    
    update: window.TowerEngine.updateTower,
    targetType: 'GROUND',
    minRange: 2.0, // Cannot fire at enemies closer than 2 tiles
    
    attackType: 'PROJECTILE',
    projectileType: 'ARC',
    projectileSpeed: 3,
    projectileColor: '#000',
    
    aoeRadius: 2.5
};