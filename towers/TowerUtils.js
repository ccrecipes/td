window.GameTowers = window.GameTowers || {};

window.TowerUtils = {
    // Calculate stats based on tower level
    getTowerStats: function(tower) {
        const multi = 1 + ((tower.level - 1) * 0.3);
        return {
            damage: tower.type.damage * multi,
            range: tower.type.range * (1 + (tower.level-1)*0.1), 
            fireRate: Math.max(5, tower.type.fireRate / (1 + (tower.level-1)*0.2)) 
        };
    },

    // Standard targeting logic
    findTarget: function(tower, enemies, range) {
        const rangePx = range * 64; // 64 is CELL_SIZE
        
        let validTargets = enemies.filter(e => {
             const dist = Math.hypot(e.x - tower.x, e.y - tower.y);
             if (dist > rangePx) return false;
             if (tower.type.minRange && dist < tower.type.minRange * 64) return false;
             if (tower.type.targetType === 'GROUND' && e.isFlying) return false;
             if (tower.type.targetType === 'AIR' && !e.isFlying) return false;
             return true;
        });

        if (validTargets.length === 0) return null;

        // Sort by distance (closest first)
        validTargets.sort((a,b) => Math.hypot(a.x-tower.x, a.y-tower.y) - Math.hypot(b.x-tower.x, b.y-tower.y));
        return validTargets[0];
    },

    // Standard projectile firing logic
    fireProjectile: function(tower, target, stats, gameState) {
        tower.cooldown = tower.overclockTimer > 0 ? stats.fireRate / 2 : stats.fireRate;
        
        gameState.projectiles.push({
            type: 'bullet', 
            x: tower.x, 
            y: tower.y, 
            targetId: target.id, 
            damage: stats.damage, 
            speed: tower.type.projectileSpeed || 8, 
            color: tower.type.projectileColor,
            targetX: target.x, 
            targetY: target.y, 
            effect: tower.type.effect 
        });
    },

    // Helper to rotate tower visually
    updateRotation: function(tower, target) {
        if (target) {
            tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
        }
    }
};