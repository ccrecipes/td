window.GameTowers = window.GameTowers || {};

window.GameTowers.CROSSFIRE = { 
    id: 'CROSSFIRE', name: 'Crossfire', rarity: "EPIC", cost: 7, range: 7.5, damage: 60, fireRate: 300, // Increased cooldown to account for 4s burst
    icon: '✚', color: '#be185d', desc: 'Fires slow bombs in sequence', projectileColor: '#000',
    targetType: 'GROUND', rotationOffset: 0, fixed: true,
    splashRadius: 1.5,

    // Custom Preview Logic used by index.html
    drawPreview: function(ctx, x, y, rangePx, cellSize) {
        // Use fill instead of stroke for a solid transparent look
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; 
        
        const beamWidth = cellSize * 0.4; // Width of the cross arms

        // Draw + Shape (Filled Rectangles)
        // Vertical
        ctx.fillRect(-beamWidth/2, -rangePx, beamWidth, rangePx * 2);
        // Horizontal
        ctx.fillRect(-rangePx, -beamWidth/2, rangePx * 2, beamWidth);
    },

    update: function(tower, gameState) {
        // --- Burst Logic ---
        // If we are currently firing a burst
        if (tower.burstCount > 0) {
            tower.burstTimer--;
            if (tower.burstTimer <= 0) {
                this.fireSingleShot(tower, gameState);
                tower.burstCount--;
                tower.burstTimer = 60; // 60 frames = 1.0s delay between shots
            }
            return;
        }

        // --- Cooldown Logic ---
        if (tower.cooldown > 0) return;

        const stats = window.TowerUtils.getTowerStats(tower);
        
        // Start firing sequence blindly
        // Reset Cooldown
        tower.cooldown = stats.fireRate;
        
        // Initialize Burst
        tower.burstCount = 4; // 4 shots
        tower.burstTimer = 0; // Fire first immediately
        tower.burstIndex = 0; // Direction index
    },

    fireSingleShot: function(tower, gameState) {
        const stats = window.TowerUtils.getTowerStats(tower);
        
        // Order: Up, Right, Down, Left (Clockwise)
        const dirs = [
            { x: 0, y: -1 }, // Up
            { x: 1, y: 0 },  // Right
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }  // Left
        ];

        // Get direction based on current progress (4 shots total)
        // If burstCount starts at 4, we want index 0 first.
        // 4 -> 0, 3 -> 1, 2 -> 2, 1 -> 3
        const dirIndex = 4 - tower.burstCount; 
        const dir = dirs[dirIndex];

        gameState.projectiles.push({
            type: 'linear_bomb', 
            x: tower.x, y: tower.y,
            vx: dir.x * 0.5, vy: dir.y * 0.5, // Speed 0.5 (Extremely Slow)
            damage: stats.damage, 
            color: '#be185d',
            splashRadius: this.splashRadius * 64, // 64 is CELL_SIZE
            distTraveled: 0,
            maxDist: stats.range * 64
        });
    }
};