window.GameTowers = window.GameTowers || {};

window.GameTowers.SEEKER = { 
    id: 'SEEKER', name: 'Seeker', rarity: "LEGENDARY", cost: 9, range: 8.0, damage: 30, fireRate: 120, 
    icon: '🚀', color: '#1e3a8a', desc: 'Accelerating Homing Missiles', projectileColor: '#3b82f6',
    targetType: 'BOTH', rotationOffset: Math.PI / 4, 
    splashRadius: 2.0,
    effect: { type: 'acceleration', baseSpeed: 2, maxSpeed: 12, damageScale: 1.5 }, // +1.5 dmg per frame alive

    update: function(tower, gameState) {
        if (tower.cooldown > 0) return;

        const stats = window.TowerUtils.getTowerStats(tower);
        const target = window.TowerUtils.findTarget(tower, gameState.enemies, stats.range);

        if (target) {
            tower.cooldown = tower.overclockTimer > 0 ? stats.fireRate / 2 : stats.fireRate;
            
            // Spawn Missile
            gameState.projectiles.push({
                type: 'homing_missile', 
                x: tower.x, y: tower.y, 
                targetId: target.id, 
                damage: stats.damage, 
                currentSpeed: this.effect.baseSpeed,
                maxSpeed: this.effect.maxSpeed,
                damageScale: this.effect.damageScale,
                flightTime: 0,
                color: this.projectileColor,
                splashRadius: this.splashRadius * 64
            });
            
            window.TowerUtils.updateRotation(tower, target);
        }
    }
};