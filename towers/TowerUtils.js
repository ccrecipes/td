window.GameTowers = window.GameTowers || {};

window.TowerUtils = {
    // --- 1. CORE UTILITIES ---

    getTowerStats: function(tower) {
        const multi = 1 + ((tower.level - 1) * 0.3);
        return {
            damage: tower.type.damage * multi,
            range: tower.type.range * (1 + (tower.level - 1) * 0.1),
            fireRate: Math.max(5, tower.type.fireRate / (1 + (tower.level - 1) * 0.2)),
            multi: multi 
        };
    },

    updateRotation: function(tower, target) {
        if (target) {
            tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
        }
    },

    // --- 2. STATUS EFFECTS SYSTEM ---
    Effects: {
        apply: function(enemy, effectConfig) {
            if (!enemy.activeEffects) enemy.activeEffects = {};

            const id = effectConfig.type;

            if (id === 'SLOW') {
                enemy.activeEffects[id] = {
                    timer: effectConfig.duration,
                    factor: effectConfig.factor
                };
            } else if (id === 'STUN') {
                enemy.activeEffects[id] = {
                    timer: effectConfig.duration,
                    factor: 0
                };
            } else if (id === 'DOT') { 
                const name = effectConfig.name;
                if (!enemy.activeEffects[name]) {
                    enemy.activeEffects[name] = {
                        timer: effectConfig.duration,
                        tickRate: effectConfig.tickRate || 60,
                        tickTimer: 0,
                        damage: effectConfig.damage,
                        color: effectConfig.color,
                        stacks: 1 
                    };
                } else {
                    enemy.activeEffects[name].timer = effectConfig.duration;
                    if (name === 'poison') {
                        enemy.activeEffects[name].stacks = (enemy.activeEffects[name].stacks || 1) + 1;
                    }
                }
            }
        },

        updateEnemy: function(enemy) {
            if (!enemy.activeEffects) return 1.0; 

            let speedMod = 1.0;

            Object.keys(enemy.activeEffects).forEach(key => {
                const effect = enemy.activeEffects[key];
                effect.timer--;

                if (key === 'SLOW' || key === 'STUN') {
                    speedMod *= effect.factor;
                }

                if (effect.tickRate) {
                    effect.tickTimer--;
                    if (effect.tickTimer <= 0) {
                        const stacks = effect.stacks || 1;
                        enemy.health -= effect.damage * stacks;
                        effect.tickTimer = effect.tickRate;
                        if (window.gameState && window.gameState.particles) {
                             window.gameState.particles.push({
                                x: enemy.x, y: enemy.y,
                                vx: 0, vy: -0.5,
                                life: 10, color: effect.color || '#fff'
                             });
                        }
                    }
                }

                if (effect.timer <= 0) delete enemy.activeEffects[key];
            });

            return speedMod;
        }
    },

    // --- 3. TARGETING SYSTEM ---
    Targeting: {
        findTarget: function(tower, enemies, gameState) { 
            const stats = window.TowerUtils.getTowerStats(tower);
            const def = tower.type;
            const rangePx = stats.range * 64; 
            const minRangePx = (def.minRange || 0) * 64;

            if (def.attackType === 'BEAM' && tower.laserTargetId !== -1) {
                const current = enemies.find(e => e.id === tower.laserTargetId);
                if (current) {
                    const dist = Math.hypot(current.x - tower.x, current.y - tower.y);
                    const type = def.targetType || 'BOTH';
                    const isValidType = (type === 'BOTH') || 
                                        (type === 'GROUND' && !current.isFlying) || 
                                        (type === 'AIR' && current.isFlying);
                    
                    if (dist <= rangePx && dist >= minRangePx && isValidType) {
                        return current; 
                    }
                }
                tower.laserTargetId = -1;
                tower.rampTimer = 0;
            }

            const eligible = enemies.filter(e => {
                const dist = Math.hypot(e.x - tower.x, e.y - tower.y);
                if (dist > rangePx) return false;
                if (dist < minRangePx) return false;

                const type = def.targetType || 'BOTH';
                if (type === 'GROUND' && e.isFlying) return false;
                if (type === 'AIR' && !e.isFlying) return false;

                return true;
            });

            if (eligible.length === 0) return null;

            if (def.id === 'LASER' || def.attackType === 'BEAM') {
                 eligible.sort((a, b) => {
                     if (b.health !== a.health) return b.health - a.health;
                     const distA = Math.hypot(a.x - tower.x, a.y - tower.y);
                     const distB = Math.hypot(b.x - tower.x, b.y - tower.y);
                     return distA - distB;
                 });
                 return eligible[0];
            }

            const strategy = tower.targetingStrategy || def.defaultStrategy || 'FIRST';

            const getDistToEnd = (e) => {
                if (e.isFlying) {
                    const endX = (gameState.end.x * 64) + 32;
                    const endY = (gameState.end.y * 64) + 32;
                    return Math.hypot(e.x - endX, e.y - endY);
                } else {
                    if (!e.path) return 99999;
                    return (e.path.length - e.pathIndex) * 64;
                }
            };

            eligible.sort((a, b) => {
                if (strategy === 'FIRST') return getDistToEnd(a) - getDistToEnd(b);
                if (strategy === 'LAST') return getDistToEnd(b) - getDistToEnd(a);
                if (strategy === 'CLOSEST') return Math.hypot(a.x - tower.x, a.y - tower.y) - Math.hypot(b.x - tower.x, b.y - tower.y);
                if (strategy === 'STRONGEST') return b.maxHealth - a.maxHealth;
                if (strategy === 'WEAKEST') return a.health - b.health;
                if (strategy === 'FASTEST') return b.baseSpeed - a.baseSpeed;
                return getDistToEnd(a) - getDistToEnd(b); 
            });

            return eligible[0];
        }
    },

    // --- 4. COMBAT SYSTEM ---
    Combat: {
        calculateDamage: function(baseDamage, towerType) {
            let finalDamage = baseDamage;
            let isCrit = false;
            if (towerType.critChance) {
                if (Math.random() < towerType.critChance) {
                    finalDamage *= (towerType.critMultiplier || 2.0);
                    isCrit = true;
                }
            }
            return { damage: finalDamage, isCrit: isCrit };
        },

        resolveHit: function(target, payload, gameState) {
            const dmgInfo = this.calculateDamage(payload.damage, payload.sourceDef || {});
            target.health -= dmgInfo.damage;

            if (dmgInfo.isCrit && gameState.particles) {
                gameState.particles.push({
                    x: target.x, y: target.y - 20,
                    text: "CRIT!", life: 30, color: '#ffff00', vx: 0, vy: -1, type: 'text'
                });
            }

            if (payload.applyEffect) {
                const chance = payload.applyEffect.chance || 1.0;
                if (Math.random() <= chance) {
                    window.TowerUtils.Effects.apply(target, payload.applyEffect);
                }
            }

            if (payload.chain) {
                this.handleChainLightning(target, payload, gameState);
            }
        },

        handleChainLightning: function(initialTarget, payload, gameState) {
            let chainList = [initialTarget];
            let current = initialTarget;
            let dmg = payload.damage;
            const cfg = payload.chain; 

            for(let k=0; k < cfg.depth; k++) {
                dmg *= (1 - (cfg.decay || 0)); 
                let next = null;
                let minDist = (cfg.range || 5) * 64;
                gameState.enemies.forEach(other => {
                    if(chainList.includes(other)) return;
                    const d = Math.hypot(other.x - current.x, other.y - current.y);
                    if(d < minDist) { minDist = d; next = other; }
                });
                if(next) { chainList.push(next); next.health -= dmg; current = next; } 
                else { break; }
            }
            
            if (gameState.particles) {
                const rawPoints = chainList.map(e => ({x:e.x, y:e.y}));
                if (payload.sourceX !== undefined) {
                    rawPoints.unshift({x: payload.sourceX, y: payload.sourceY});
                }

                let jaggedPath = [];
                for(let i=0; i<rawPoints.length-1; i++) {
                    const p1 = rawPoints[i];
                    const p2 = rawPoints[i+1];
                    jaggedPath.push(p1);
                    
                    const segments = 3;
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.hypot(dx, dy);
                    
                    for(let j=1; j<segments; j++) {
                        const t = j/segments;
                        const offset = (Math.random() - 0.5) * (dist * 0.3);
                        jaggedPath.push({
                            x: p1.x + dx*t - (dy/dist)*offset,
                            y: p1.y + dy*t + (dx/dist)*offset
                        });
                    }
                }
                jaggedPath.push(rawPoints[rawPoints.length-1]); 

                gameState.particles.push({
                    type: 'lightning',
                    points: jaggedPath,
                    life: 8, maxLife: 8, 
                    color: (cfg && cfg.color) || payload.color || '#ecc94b', 
                    vx:0, vy:0
                });

                chainList.forEach(target => {
                    for(let i=0; i<5; i++) { 
                        gameState.particles.push({
                            x: target.x, y: target.y,
                            vx: (Math.random()-0.5)*6, 
                            vy: (Math.random()-0.5)*6,
                            life: 15 + Math.random()*10,
                            color: '#fff' 
                        });
                    }
                });
            }
        }
    },

    // --- 5. PROJECTILE SYSTEM ---
    Projectiles: {
        spawn: function(gameState, config) {
            gameState.projectiles.push({
                ...config,
                x: config.x || config.startX,
                y: config.y || config.startY,
                payload: { ...config.payload, sourceDef: config.sourceDef }
            });
        },

        update: function(p, gameState, index) {
            let hit = false;
            let impactX = p.x;
            let impactY = p.y;

            if (p.moveType === 'LINEAR') {
                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                const dist = Math.hypot(dx, dy);
                if (p.checkCollisions) {
                    const hitEnemy = gameState.enemies.find(e => Math.hypot(e.x - p.x, e.y - p.y) < (e.radius || 15) + 5);
                    if (hitEnemy) {
                        hit = true; impactX = hitEnemy.x; impactY = hitEnemy.y;
                        window.TowerUtils.Combat.resolveHit(hitEnemy, p.payload, gameState);
                        gameState.projectiles.splice(index, 1);
                        return;
                    }
                }
                if (dist <= p.speed) { hit = true; impactX = p.targetX; impactY = p.targetY; } 
                else { p.x += (dx/dist) * p.speed; p.y += (dy/dist) * p.speed; }

            } else if (p.moveType === 'LOCKED') {
                const target = gameState.enemies.find(e => e.id === p.targetId);
                if (target) { p.targetX = target.x; p.targetY = target.y; }
                const dx = p.targetX - p.x; const dy = p.targetY - p.y;
                const dist = Math.hypot(dx, dy);
                if (dist <= p.speed) { hit = true; impactX = p.targetX; impactY = p.targetY; } 
                else { p.x += (dx/dist) * p.speed; p.y += (dy/dist) * p.speed; }

            } else if (p.moveType === 'ARC') {
                p.progress += p.step;
                if (p.progress >= 1) { hit = true; impactX = p.targetX; impactY = p.targetY; } 
                else {
                    p.x = p.startX + (p.targetX - p.startX) * p.progress;
                    p.y = p.startY + (p.targetY - p.startY) * p.progress;
                    p.height = 4 * (p.arcHeight || 100) * p.progress * (1 - p.progress);
                }

            } else if (p.moveType === 'HOMING') {
                const target = gameState.enemies.find(e => e.id === p.targetId);
                if (!target) { gameState.projectiles.splice(index, 1); return; }
                const dist = Math.hypot(target.x - p.x, target.y - p.y);
                if (dist <= p.currentSpeed) { hit = true; impactX = target.x; impactY = target.y; } 
                else {
                    if (p.currentSpeed < (p.maxSpeed || 12)) p.currentSpeed += 0.5;
                    p.x += ((target.x - p.x) / dist) * p.currentSpeed;
                    p.y += ((target.y - p.y) / dist) * p.currentSpeed;
                }
            }

            if (hit) {
                gameState.projectiles.splice(index, 1);
                this.triggerPayload(p.payload, impactX, impactY, gameState, p.targetId);
            }
        },

        triggerPayload: function(payload, x, y, gameState, intendedTargetId) {
            const range = (payload.aoeRadius || 0.1) * 64; 
            const def = payload.sourceDef || {};
            const type = def.targetType || 'BOTH';

            if (payload.aoeRadius) {
                gameState.enemies.forEach(e => {
                    if (type === 'GROUND' && e.isFlying) return;
                    if (type === 'AIR' && !e.isFlying) return;

                    const dist = Math.hypot(e.x - x, e.y - y);
                    if (dist <= range + (e.radius || 10)) {
                        window.TowerUtils.Combat.resolveHit(e, payload, gameState);
                    }
                });
            } else {
                let target = null;
                if (intendedTargetId !== undefined) {
                    target = gameState.enemies.find(e => e.id === intendedTargetId);
                }
                if (!target) {
                    let closestDist = Infinity;
                    gameState.enemies.forEach(e => {
                        if (type === 'GROUND' && e.isFlying) return;
                        if (type === 'AIR' && !e.isFlying) return;
                        const dist = Math.hypot(e.x - x, e.y - y);
                        if (dist <= 40 && dist < closestDist) {
                            closestDist = dist;
                            target = e;
                        }
                    });
                }
                if (target) {
                    window.TowerUtils.Combat.resolveHit(target, payload, gameState);
                }
            }

            if (payload.spawnZone) {
                gameState.groundEffects.push({
                    x: x, y: y,
                    duration: payload.spawnZone.duration,
                    maxDuration: payload.spawnZone.duration,
                    radius: payload.spawnZone.radius * 64,
                    color: payload.spawnZone.color,
                    tickEffect: payload.spawnZone.tickEffect,
                    damage: payload.spawnZone.damage 
                });
            }
            if (gameState.particles) {
                gameState.particles.push({
                    x:x, y:y, vx:0, vy:0, life:15, 
                    color: payload.color || '#fff' 
                });
            }
        }
    },

    // --- 6. MAIN TOWER UPDATE LOOP ---
    updateTower: function(tower, gameState) {
        // --- NEW: BURST SEQUENTIAL LOGIC ---
        if (tower.burstActive) {
            tower.burstTimer--;
            if (tower.burstTimer <= 0) {
                const stats = window.TowerUtils.getTowerStats(tower);
                const def = tower.type;
                const rangePx = stats.range * 64; 
                
                // Fire in order: Top, Right, Bottom, Left
                let tx = tower.x, ty = tower.y;
                if (tower.burstIndex === 0) ty -= rangePx;
                else if (tower.burstIndex === 1) tx += rangePx;
                else if (tower.burstIndex === 2) ty += rangePx;
                else if (tower.burstIndex === 3) tx -= rangePx;

                tower.recoil = 3; 

                window.TowerUtils.Projectiles.spawn(gameState, {
                    startX: tower.x, startY: tower.y,
                    targetX: tx, targetY: ty,
                    moveType: 'LINEAR',
                    speed: def.projectileSpeed || 4,
                    checkCollisions: def.checkCollisions,
                    color: def.projectileColor,
                    sourceDef: def,
                    payload: {
                        sourceX: tower.x, sourceY: tower.y,
                        damage: stats.damage,
                        aoeRadius: def.aoeRadius,
                        applyEffect: def.onHitEffect,
                        spawnZone: def.onHitZone,
                        chain: def.chainConfig,
                        color: def.projectileColor
                    }
                });

                tower.burstIndex++;
                if (tower.burstIndex >= 4) {
                    tower.burstActive = false;
                } else {
                    tower.burstTimer = def.sequentialDelay || 10;
                }
            }
        }
        // -----------------------------------

        if (tower.recoil > 0) tower.recoil--;

        if (tower.cooldown > 0) return;
        
        if (tower.type.maxAmmo && tower.ammo <= 0) {
            tower.reloadTimer = (tower.reloadTimer || 0) + 1;
            if (tower.reloadTimer >= (tower.type.reloadTime || 120)) { tower.ammo = tower.type.maxAmmo; tower.reloadTimer = 0; }
            return; 
        }

        const stats = window.TowerUtils.getTowerStats(tower);
        const def = tower.type;
        const target = window.TowerUtils.Targeting.findTarget(tower, gameState.enemies, gameState);

        // --- CONE ATTACK ---
        if (def.attackType === 'CONE') {
            if (!target && def.fireMode !== 'ALWAYS') return;
            tower.recoil = 2; 
            tower.cooldown = stats.fireRate;
            if (target) window.TowerUtils.updateRotation(tower, target);
            
            const count = 10; 
            for(let i=0; i<count; i++) { 
                const spread = (Math.random() - 0.5) * (def.coneAngle || 0.5);
                const angle = tower.angle + spread;
                const speed = 6 + Math.random() * 8; 
                
                const isSmoke = Math.random() > 0.8; 
                const color = isSmoke ? '#4a5568' : (Math.random() > 0.6 ? '#ed8936' : (Math.random() > 0.5 ? '#f6ad55' : '#ecc94b')); 

                gameState.particles.push({
                    x: tower.x + Math.cos(angle)*25,
                    y: tower.y + Math.sin(angle)*25,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 20 + Math.random() * 15,
                    maxLife: 35, 
                    color: color,
                    radius: isSmoke ? 6 : (6 + Math.random() * 4), 
                    isFire: true 
                });
            }

            const rangePx = stats.range * 64;
            const coneHalf = (def.coneAngle || 0.5) / 2;
            const type = def.targetType || 'BOTH';

            gameState.enemies.forEach(e => {
                if (type === 'GROUND' && e.isFlying) return;
                if (type === 'AIR' && !e.isFlying) return;

                const dx = e.x - tower.x; const dy = e.y - tower.y;
                const dist = Math.hypot(dx, dy);
                if (dist > rangePx) return;
                const angleToEnemy = Math.atan2(dy, dx);
                let angleDiff = angleToEnemy - tower.angle;
                while (angleDiff <= -Math.PI) angleDiff += Math.PI*2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI*2;
                if (Math.abs(angleDiff) < coneHalf) {
                     window.TowerUtils.Combat.resolveHit(e, {
                         damage: stats.damage,
                         sourceDef: def,
                         applyEffect: def.onHitEffect
                     }, gameState);
                }
            });
            return;
        }

        // --- BEAM (LASER) ATTACK ---
        if (def.attackType === 'BEAM') {
            if (target) {
                if (tower.laserTargetId !== target.id) {
                    tower.rampTimer = 0; 
                    tower.laserTargetId = target.id;
                }
                tower.rampTimer = (tower.rampTimer || 0) + 1;

                let currentDPS = stats.damage; 
                if (def.maxDamage && def.rampDuration) {
                    const maxDamageScaled = def.maxDamage * stats.multi; 
                    const rampProgress = Math.min(tower.rampTimer, def.rampDuration) / def.rampDuration;
                    const damageGrowth = maxDamageScaled - stats.damage;
                    currentDPS += damageGrowth * rampProgress;
                }
                
                if (def.maxDamage && tower.rampTimer >= def.rampDuration && Math.random() > 0.8) {
                     gameState.particles.push({
                        x: tower.x, y: tower.y, vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2,
                        life: 10, color: '#fff' 
                     });
                }

                const dmgInfo = window.TowerUtils.Combat.calculateDamage(currentDPS / 60, def);
                target.health -= dmgInfo.damage;
                if (!def.fixed) window.TowerUtils.updateRotation(tower, target);

            } else {
                tower.laserTargetId = -1;
                tower.rampTimer = 0;
            }
            return; 
        }

        // --- STANDARD ATTACKS ---
        if (target || def.fireMode === 'ALWAYS' || def.fireMode === 'BURST_CARDINAL') {
            
            // Trigger Burst Sequence
            if (def.fireMode === 'BURST_CARDINAL') {
                tower.cooldown = stats.fireRate;
                tower.burstActive = true;
                tower.burstIndex = 0;
                tower.burstTimer = 0;
                return; 
            }

            tower.cooldown = tower.overclockTimer > 0 ? stats.fireRate / 2 : stats.fireRate;
            tower.recoil = 4;

            if (def.maxAmmo) { if (tower.ammo === undefined) tower.ammo = def.maxAmmo; tower.ammo--; }

            let targets = [target];
            
            targets.forEach(t => {
                if(!t) return;
                let step = 0;
                if(def.projectileType === 'ARC') {
                    const dist = Math.hypot(t.x - tower.x, t.y - tower.y);
                    step = 1 / (dist / def.projectileSpeed);
                }

                window.TowerUtils.Projectiles.spawn(gameState, {
                    startX: tower.x, startY: tower.y,
                    targetId: t.id, targetX: t.x, targetY: t.y,
                    moveType: def.projectileType || 'LINEAR',
                    speed: def.projectileSpeed || 8,
                    currentSpeed: def.projectileSpeed || 8,
                    step: step, arcHeight: 200, checkCollisions: def.checkCollisions,
                    progress: 0, 
                    color: def.projectileColor,
                    sourceDef: def,
                    payload: {
                        sourceX: tower.x, sourceY: tower.y,
                        damage: stats.damage,
                        aoeRadius: def.aoeRadius,
                        applyEffect: def.onHitEffect,
                        spawnZone: def.onHitZone,
                        chain: def.chainConfig,
                        color: def.projectileColor
                    }
                });
            });

            if (target && !def.fixed) window.TowerUtils.updateRotation(tower, target);
        } else {
            if (def.attackType === 'BEAM') tower.laserTargetId = -1;
        }
    }
};

window.TowerEngine = window.TowerUtils;