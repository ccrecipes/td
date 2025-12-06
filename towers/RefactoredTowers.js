window.GameTowers = window.GameTowers || {};

// Shared Generic Update Wrapper
const genericUpdate = window.TowerEngine.updateTower;

// --- 1. HONEY (Refactored) ---
window.GameTowers.HONEY = { 
    id: 'HONEY', name: 'Honey', rarity: "COMMON", cost: 4, range: 4.5, damage: 10, fireRate: 90, 
    icon: '🍯', color: '#d69e2e',
    
    // CONFIGURATION
    update: genericUpdate, // Use the engine
    attackType: 'PROJECTILE',
    projectileType: 'ARC',
    projectileSpeed: 4,
    projectileColor: '#b7791f',
    projectileIcon: '🍯',
    
    // Defines what happens when it hits
    aoeRadius: 1.5,
    onHitZone: {
        radius: 1.5,
        duration: 240,
        color: 'rgba(214, 158, 46, 0.5)',
        tickEffect: { type: 'SLOW', factor: 0.5, duration: 10 } // Applied to enemies in zone
    }
};

// --- 2. INFERNO (Refactored - Reuses Honey's Logic!) ---
window.GameTowers.INFERNO = { 
    id: 'INFERNO', name: 'Inferno', rarity: "MYTHIC", cost: 10, range: 6.5, damage: 80, fireRate: 240, 
    icon: '🌋', color: '#c2410c',
    
    // CONFIGURATION
    update: genericUpdate,
    attackType: 'PROJECTILE',
    projectileType: 'ARC',
    projectileSpeed: 3,
    projectileColor: '#f97316',
    
    aoeRadius: 1.0,
    onHitZone: {
        radius: 1.0,
        duration: 600,
        color: 'rgba(234, 88, 12, 0.5)',
        // Different effect than Honey, but same system
        tickEffect: { 
            type: 'DOT', 
            name: 'magma_burn', 
            damage: 5, 
            tickRate: 20, 
            duration: 20 
        } 
    }
};

// --- 3. MORTAR (Refactored - Simpler version of Inferno) ---
window.GameTowers.MORTAR = { 
    id: 'MORTAR', name: 'Bomber', rarity: "RARE", cost: 6, range: 6.0, damage: 80, fireRate: 180,
    icon: '💣', color: '#2d3748',
    
    update: genericUpdate,
    attackType: 'PROJECTILE',
    projectileType: 'ARC',
    projectileSpeed: 3,
    aoeRadius: 2.5 // Just AOE damage, no zone spawned
};

// --- 4. SEEKER (Refactored) ---
window.GameTowers.SEEKER = { 
    id: 'SEEKER', name: 'Seeker', rarity: "LEGENDARY", cost: 9, range: 8.0, damage: 30, fireRate: 120, 
    icon: '🚀', color: '#1e3a8a',
    
    update: genericUpdate,
    attackType: 'PROJECTILE',
    projectileType: 'HOMING', // Changed from Arc to Homing
    projectileSpeed: 2, // Start speed
    
    // Special Homing params could be passed via payload if needed
    aoeRadius: 2.0
};

// --- 5. VENOM (Refactored - Standard Bullet + Effect) ---
window.GameTowers.VENOM = { 
    id: 'VENOM', name: 'Venom', rarity: "RARE", cost: 5, range: 4.5, damage: 15, fireRate: 60, 
    icon: '🧪', color: '#48bb78',
    
    update: genericUpdate,
    attackType: 'PROJECTILE',
    projectileType: 'LINEAR',
    projectileSpeed: 8,
    projectileColor: '#68d391',
    
    onHitEffect: { 
        type: 'DOT', 
        name: 'poison', 
        damage: 2, 
        duration: 600, 
        tickRate: 40,
        color: '#48bb78'
    }
};

// --- 6. CROSSFIRE (Refactored - The Burst Logic) ---
window.GameTowers.CROSSFIRE = { 
    id: 'CROSSFIRE', name: 'Crossfire', rarity: "EPIC", cost: 7, range: 7.5, damage: 60, fireRate: 300, 
    icon: '✚', color: '#be185d', fixed: true,
    
    update: genericUpdate,
    attackType: 'PROJECTILE',
    fireMode: 'BURST_CARDINAL', // New tag handled by engine
    projectileType: 'LINEAR',
    projectileSpeed: 4,
    aoeRadius: 1.5
};