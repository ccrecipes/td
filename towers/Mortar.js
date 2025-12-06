window.GameTowers = window.GameTowers || {};

window.GameTowers.MORTAR = { 
    id: 'MORTAR', name: 'Bomber', rarity: "RARE", cost: 6, range: 6.0, minRange: 2.0, damage: 80, splashRadius: 2.5, fireRate: 180, projectileSpeed: 3, 
    icon: '💣', color: '#2d3748', desc: 'Area Damage', projectileColor: '#000',
    targetType: 'GROUND', rotationOffset: 0,

    update: function(tower, gameState) {
        if (tower.cooldown > 0) return;

        const stats = window.TowerUtils.getTowerStats(tower);
        const target = window.TowerUtils.findTarget(tower, gameState.enemies, stats.range);

        if (target) {
            tower.cooldown = tower.overclockTimer > 0 ? stats.fireRate / 2 : stats.fireRate;
            
            const dist = Math.hypot(target.x - tower.x, target.y - tower.y);
            const flightDuration = dist / this.projectileSpeed;
            const groundSpeed = 1 / flightDuration; 
            
            gameState.projectiles.push({
                type: 'mortar', 
                startX: tower.x, startY: tower.y, 
                targetX: target.x, targetY: target.y,
                x: tower.x, y: tower.y, 
                damage: stats.damage, 
                color: this.projectileColor,
                splashRadius: this.splashRadius * 64, 
                effect: this.effect,
                progress: 0, 
                step: groundSpeed, 
                arcHeight: Math.min(250, dist/1.5), 
                height: 0
            });

            window.TowerUtils.updateRotation(tower, target);
        }
    }
};