window.GameTowers = window.GameTowers || {};

window.GameTowers.INFERNO = { 
    id: 'INFERNO', name: 'Inferno', rarity: "MYTHIC", cost: 10, range: 6.5, minRange: 2.0, 
    damage: 80, // BUFFED: Was 40
    fireRate: 240, // 4 seconds cooldown
    icon: '🌋', color: '#c2410c', desc: 'Leaves burning pools of fire', projectileColor: '#f97316',
    targetType: 'GROUND', rotationOffset: 0,
    splashRadius: 1.0, 
    poolDuration: 600, 
    poolDamage: 5, // BUFFED: Was 2 (Now deals significant area damage)
    burnDamage: 3, // NEW: Burn DOT strength

    update: function(tower, gameState) {
        if (tower.cooldown > 0) return;

        const stats = window.TowerUtils.getTowerStats(tower);
        const target = window.TowerUtils.findTarget(tower, gameState.enemies, stats.range);

        if (target) {
            tower.cooldown = tower.overclockTimer > 0 ? stats.fireRate / 2 : stats.fireRate;
            
            const dist = Math.hypot(target.x - tower.x, target.y - tower.y);
            const flightDuration = dist / 3; 
            const groundSpeed = 1 / flightDuration; 
            
            gameState.projectiles.push({
                type: 'fire_mortar', 
                startX: tower.x, startY: tower.y, 
                targetX: target.x, targetY: target.y,
                x: tower.x, y: tower.y, 
                damage: stats.damage, 
                color: this.projectileColor,
                splashRadius: this.splashRadius * 64, 
                poolDuration: this.poolDuration,
                maxDuration: this.poolDuration,
                poolDamage: this.poolDamage,
                burnDamage: this.burnDamage, // PASSING NEW STAT
                progress: 0, 
                step: groundSpeed, 
                arcHeight: Math.min(250, dist/1.5), 
                height: 0
            });

            window.TowerUtils.updateRotation(tower, target);
        }
    }
};