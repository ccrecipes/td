window.GameTowers = window.GameTowers || {};

window.GameTowers.TESLA = { 
    id: 'TESLA', name: 'Tesla', rarity: "EPIC", cost: 7, range: 4.0, damage: 45, fireRate: 50, 
    icon: '⚡', color: '#ecc94b', desc: 'Chain Lightning', projectileColor: '#f6e05e',
    targetType: 'BOTH', rotationOffset: 0, fixed: true,
    effect: { type: 'chain', depth: 3, range: 3.5, decay: 0.3 },

    update: function(tower, gameState) {
        if (tower.cooldown > 0) return;

        const stats = window.TowerUtils.getTowerStats(tower);
        const target = window.TowerUtils.findTarget(tower, gameState.enemies, stats.range);

        if (target) {
            tower.cooldown = stats.fireRate;
            
            // 1. Chain Logic
            let chain = [target];
            let currentTarget = target;
            let currentDmg = stats.damage;
            const chainRangePx = this.effect.range * 64; // 64 is CELL_SIZE

            target.health -= currentDmg;

            // 2. Find Chain Targets
            for(let k=0; k < this.effect.depth; k++) {
                currentDmg *= (1 - this.effect.decay); // Reduce dmg
                
                let nextTarget = null;
                let minDist = chainRangePx;

                gameState.enemies.forEach(other => {
                    if(chain.includes(other)) return; // No loops
                    const d = Math.hypot(other.x - currentTarget.x, other.y - currentTarget.y);
                    if(d < minDist) {
                        minDist = d;
                        nextTarget = other;
                    }
                });

                if(nextTarget) {
                    chain.push(nextTarget);
                    nextTarget.health -= currentDmg;
                    currentTarget = nextTarget;
                } else {
                    break;
                }
            }

            // 3. Visuals
            gameState.particles.push({
                type: 'lightning',
                points: [{x:tower.x, y:tower.y}, ...chain.map(e => ({x:e.x, y:e.y}))],
                life: 8, maxLife: 8,
                color: this.projectileColor,
                vx: 0, vy: 0
            });
        }
    }
};