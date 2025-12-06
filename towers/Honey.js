window.GameTowers = window.GameTowers || {};

window.GameTowers.HONEY = { 
    id: 'HONEY', 
    name: 'Honey', 
    rarity: "COMMON", 
    cost: 4, 
    range: 4.5, 
    damage: 10, // Impact damage
    fireRate: 90, // 1.5 seconds
    icon: '🍯', 
    color: '#d69e2e', 
    desc: 'Throws honey pots that leave sticky pools, slowing enemies.', 
    projectileColor: '#b7791f',
    targetType: 'GROUND', 
    rotationOffset: 0,
    splashRadius: 1.5,
    poolDuration: 240, // 4 seconds duration
    slowFactor: 0.5, // Reduces speed to 50%

    update: function(tower, gameState) {
        if (tower.cooldown > 0) return;

        const stats = window.TowerUtils.getTowerStats(tower);
        
        // --- CUSTOM TARGETING: Find "First" Enemy (Furthest on path) ---
        let target = null;
        let maxDist = -1;

        // Iterate all enemies to find the one with highest path progress within range
        gameState.enemies.forEach(e => {
            const dist = Math.hypot(e.x - tower.x, e.y - tower.y);
            const rangePx = stats.range * 64; // Convert grid range to pixels (assuming 64px cell)
            
            if (dist <= rangePx) {
                // Determine "First" based on pathIndex (node count) + distance to next node
                // (Simplified here to just pathIndex for performance)
                if (e.pathIndex > maxDist) {
                    maxDist = e.pathIndex;
                    target = e;
                }
            }
        });

        if (target) {
            tower.cooldown = tower.overclockTimer > 0 ? stats.fireRate / 2 : stats.fireRate;
            
            // Calculate arc trajectory logic
            const dist = Math.hypot(target.x - tower.x, target.y - tower.y);
            const flightDuration = dist / 4; // speed 4
            const groundSpeed = 1 / flightDuration; 
            
            gameState.projectiles.push({
                type: 'honey_pot', 
                startX: tower.x, startY: tower.y, 
                targetX: target.x, targetY: target.y,
                x: tower.x, y: tower.y, 
                damage: stats.damage, 
                color: this.projectileColor,
                splashRadius: this.splashRadius * 64, 
                poolDuration: this.poolDuration,
                maxDuration: this.poolDuration,
                slowFactor: this.slowFactor,
                progress: 0, 
                step: groundSpeed, 
                arcHeight: Math.min(250, dist/1.5), 
                height: 0
            });

            window.TowerUtils.updateRotation(tower, target);
        }
    }
};