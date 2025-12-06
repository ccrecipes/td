window.GameTowers = window.GameTowers || {};

window.GameTowers.LASER = { 
    id: 'LASER', name: 'Void Eye', rarity: "LEGENDARY", cost: 9, range: 5.0, damage: 1, maxDamage: 10, rampUp: 0.1, 
    icon: '👁️', color: '#805ad5', desc: 'Ramps Up Damage', projectileColor: '#a855f7',
    targetType: 'BOTH', rotationOffset: 0,
    effect: { type: 'ramp', max: 10 },

    update: function(tower, gameState) {
        const stats = window.TowerUtils.getTowerStats(tower);
        
        // Prioritize current target
        let target = null;
        if (tower.laserTargetId !== -1) {
             const existing = gameState.enemies.find(e => e.id === tower.laserTargetId);
             if (existing && Math.hypot(existing.x - tower.x, existing.y - tower.y) <= stats.range * 64) {
                 target = existing;
             }
        }
        
        if (!target) {
            target = window.TowerUtils.findTarget(tower, gameState.enemies, stats.range);
            // Reset ramp if switching targets
            if (target && target.id !== tower.laserTargetId) {
                tower.laserDamage = stats.damage;
                tower.laserTargetId = target.id;
            }
        }

        if (target) {
            // Logic
            tower.laserDamage = Math.min(this.effect.max, tower.laserDamage + this.rampUp);
            target.health -= tower.laserDamage;
            
            // Visuals (Beam is drawn in main draw loop, but we spawn particles here)
            if(Math.random() > 0.7) {
                gameState.particles.push({ 
                    x: target.x, y: target.y, 
                    vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4, 
                    life: 20 + Math.random()*10, color: '#a855f7' 
                });
            }
        } else {
            // No target, reset
            tower.laserTargetId = -1;
            tower.laserDamage = this.damage; // base damage
        }
    }
};