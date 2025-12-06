window.GameTowers = window.GameTowers || {};

window.GameTowers.MACHINE_GUN = { 
    id: 'MACHINE_GUN', name: 'Gatling', rarity: "EPIC", cost: 8, range: 6.5, damage: 8, fireRate: 4, // Very fast fire rate (15 shots/sec)
    icon: '🔫', color: '#4a5568', desc: 'Rapid fire inaccurate spray', projectileColor: '#fbbf24',
    targetType: 'BOTH', rotationOffset: 0,
    spreadAngle: 0.2, // Cone spread in radians (~11 degrees) - Narrower

    update: function(tower, gameState) {
        if (tower.cooldown > 0) return;

        const stats = window.TowerUtils.getTowerStats(tower);
        const target = window.TowerUtils.findTarget(tower, gameState.enemies, stats.range);

        // Even if no target, we might want to keep firing at last known position if "wind up" mechanic existed,
        // but for now standard targeting.
        if (target) {
            tower.cooldown = tower.overclockTimer > 0 ? stats.fireRate / 2 : stats.fireRate;
            
            // Calculate base angle to target
            const angleToTarget = Math.atan2(target.y - tower.y, target.x - tower.x);
            
            // Add random spread
            const spread = (Math.random() - 0.5) * this.spreadAngle;
            const finalAngle = angleToTarget + spread;
            
            const speed = 12; // Fast bullets
            
            gameState.projectiles.push({
                type: 'linear_bullet', // New type: Dumbfire projectile
                x: tower.x, y: tower.y,
                vx: Math.cos(finalAngle) * speed,
                vy: Math.sin(finalAngle) * speed,
                damage: stats.damage,
                color: this.projectileColor,
                distTraveled: 0,
                maxDist: stats.range * 64, // Range in pixels
                hit: false // Track if it hit something
            });

            // Visual rotation (smoothly track target, ignore spread for visual tower rotation)
            tower.angle = angleToTarget;
        }
    }
};