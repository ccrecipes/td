window.GameTowers = window.GameTowers || {};

window.GameTowers.PYRO = { 
    id: 'PYRO', name: 'Pyro', rarity: "RARE", cost: 6, range: 3.5, damage: 0.4, fireRate: 2, 
    icon: '🔥', color: '#ed8936', desc: 'Flamethrower Cone', projectileColor: 'transparent',
    targetType: 'GROUND', rotationOffset: 0, fixed: false,
    coneAngle: 0.8,
    effect: { type: 'burn', damage: 5, duration: 180 },

    update: function(tower, gameState) {
        // Reuse cooldown logic manually since Pyro fires every few frames
        if (tower.cooldown > 0) return;

        const stats = window.TowerUtils.getTowerStats(tower);
        
        // Custom finding logic to prioritize existing target to stop jitter
        let target = null;
        if (tower.laserTargetId !== -1) {
             target = gameState.enemies.find(e => e.id === tower.laserTargetId);
             // Verify still in range
             if (target && Math.hypot(target.x - tower.x, target.y - tower.y) > stats.range * 64) {
                 target = null;
             }
        }
        
        if (!target) {
            target = window.TowerUtils.findTarget(tower, gameState.enemies, stats.range);
        }

        if (target) {
            tower.cooldown = stats.fireRate;
            tower.laserTargetId = target.id;

            // Rotate towards target
            const targetAngle = Math.atan2(target.y - tower.y, target.x - tower.x);
            tower.angle = targetAngle;

            // A. Visuals: Cone Particle System
            const coneHalf = this.coneAngle / 2;
            for(let k=0; k<5; k++) { 
                const pAngle = tower.angle + (Math.random() * this.coneAngle - coneHalf);
                const speed = 6 + Math.random() * 6;
                const life = 15 + Math.random() * 15;
                const colors = ['#ffffff', '#fef08a', '#fbd38d', '#f6ad55', '#ef4444'];
                const color = colors[Math.floor(Math.random() * colors.length)];

                gameState.particles.push({
                    x: tower.x + Math.cos(pAngle)*20,
                    y: tower.y + Math.sin(pAngle)*20,
                    vx: Math.cos(pAngle) * speed, 
                    vy: Math.sin(pAngle) * speed,
                    life: life, maxLife: life, color: color, isFire: true
                });
            }

            // B. Mechanics: Damage everyone in Cone
            const rangePx = stats.range * 64;
            gameState.enemies.forEach(enemy => {
                if (enemy.isFlying && this.targetType === 'GROUND') return;

                const ex = enemy.x - tower.x;
                const ey = enemy.y - tower.y;
                const dist = Math.hypot(ex, ey);
                
                if (dist > rangePx) return;

                const angleToEnemy = Math.atan2(ey, ex);
                let angleDiff = angleToEnemy - tower.angle;
                // Normalize angle
                while (angleDiff <= -Math.PI) angleDiff += Math.PI*2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI*2;

                if (Math.abs(angleDiff) < coneHalf) {
                    enemy.health -= stats.damage;
                    // Apply Burn Effect logic inline or helper
                    if(this.effect) {
                         enemy.isBurned = true;
                         enemy.burnDamage = this.effect.damage;
                         enemy.burnDuration = this.effect.duration;
                         enemy.burnTick = 0;
                    }
                }
            });
        } else {
            tower.laserTargetId = -1;
        }
    }
};