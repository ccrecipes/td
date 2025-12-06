// --- GLOBAL CONSTANTS ---
const CELL_SIZE = 64; 
const FPS = 60;
const MAX_LOADOUT_TOWERS = 6; 
const MAX_LOADOUT_SPELLS = 2;

// --- RARITY DEFINITIONS ---
const RARITY = {
    COMMON: { name: 'Common', color: '#63b3ed', border: 'border-blue-400', bg: 'bg-blue-900/50' },
    RARE: { name: 'Rare', color: '#3182ce', border: 'border-blue-600', bg: 'bg-blue-800/50' },
    EPIC: { name: 'Epic', color: '#9f7aea', border: 'border-purple-500', bg: 'bg-purple-900/50' },
    LEGENDARY: { name: 'Legendary', color: '#f6e05e', border: 'border-yellow-400', bg: 'bg-yellow-900/50' },
    MYTHIC: { name: 'Mythic', color: '#ef4444', border: 'border-red-500', bg: 'bg-red-900/50' }
};

// --- GAME DATA ---
let TOWERS = {}; // Populated on init
const SPELLS = {
    BARRAGE: { id: 'BARRAGE', name: 'Meteor', icon: '☄️', color: '#ef4444', cooldown: 1800, radius: 2.5, desc: 'Calls down a massive meteor dealing high area damage.' }, 
    FREEZE: { id: 'FREEZE', name: 'Blizzard', icon: '🥶', color: '#38bdf8', cooldown: 1500, radius: 3.5, duration: 180, desc: 'Freezes enemies in a large area.' }, 
    POISON: { id: 'POISON', name: 'Toxic Cloud', icon: '☠️', color: '#4ade80', cooldown: 1200, radius: 3.0, desc: 'Creates a cloud that poisons enemies over time.' }, 
    SHRINK: { id: 'SHRINK', name: 'Shrink', icon: '🤏', color: '#a78bfa', cooldown: 1800, radius: 2.5, desc: 'Permanently reduces enemy size and health by 50%.' }, 
    OVERCLOCK: { id: 'OVERCLOCK', name: 'Rage', icon: '⚡', color: '#facc15', cooldown: 1800, radius: 3.0, duration: 600, desc: 'Supercharges nearby towers.' } 
};

// --- STATE MANAGEMENT ---
let userLoadout = {
    towers: new Set(['TESLA', 'AIR', 'MORTAR', 'RAPID', 'LASER', 'INFERNO']),
    spells: new Set(['BARRAGE', 'FREEZE'])
};

let view = { scale: 1, x: 0, y: 0, minScale: 0.5, maxScale: 3, dragging: false, dragStartX: 0, dragStartY: 0, dragStartViewX: 0, dragStartViewY: 0 };
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let grassPattern = null;

let gameState = {
    running: false,
    money: 6, lives: 20, wave: 1, waveActive: false, 
    autoStart: false, autoStartTimer: 0,
    enemies: [], towers: [], projectiles: [], particles: [], groundEffects: [],
    grid: [], path: [], start: { x: 0, y: 0 }, end: { x: 0, y: 0 }, 
    upcomingWaves: [], interactionMode: 'NONE', 
    selectedTowerType: null, selectedPlacedTower: null, selectedSpell: null,
    spellCooldowns: {}, spawnQueue: [], spawnTimer: 0,
    mapWidth: 0, mapHeight: 0, terrainVisuals: [], features: [],
    swapMode: null, currentWaveConfig: null
};

const mouse = { x: 0, y: 0, gridX: 0, gridY: 0, valid: false };

// --- INITIALIZATION ---
function init() {
    if (window.GameTowers) {
        TOWERS = window.GameTowers;
    } else {
        console.error("Tower scripts not loaded! Make sure scripts are ordered correctly in HTML.");
    }

    enforceLoadoutLimits();
    renderLoadoutUI();
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    createGrassPattern();

    // Input Listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel); 
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    // Drag Handling
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);
    
    // UI Buttons
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('menuBtn').addEventListener('click', showLoadoutScreen);
    document.getElementById('nextWaveBtn').addEventListener('click', activateWave);
    document.getElementById('autoStartToggle').addEventListener('change', (e) => { gameState.autoStart = e.target.checked; });
    document.getElementById('btnUpgrade').addEventListener('click', () => upgradeSelectedTower());
    document.getElementById('btnSell').addEventListener('click', () => sellSelectedTower());
    document.getElementById('btnCloseUpg').addEventListener('click', () => closeUpgradeMenu());
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('modalActionBtn').addEventListener('click', handleModalAction);

    // Map Controls
    document.getElementById('zoomInBtn').onclick = () => zoom(0.1);
    document.getElementById('zoomOutBtn').onclick = () => zoom(-0.1);
    document.getElementById('resetViewBtn').onclick = resetView;
    document.getElementById('panUpBtn').onclick = () => pan(0, 100);
    document.getElementById('panDownBtn').onclick = () => pan(0, -100);
    document.getElementById('panLeftBtn').onclick = () => pan(100, 0);
    document.getElementById('panRightBtn').onclick = () => pan(-100, 0);

    requestAnimationFrame(loop);
}

function enforceLoadoutLimits() {
    while(userLoadout.towers.size > MAX_LOADOUT_TOWERS) {
        const it = userLoadout.towers.values();
        userLoadout.towers.delete(it.next().value);
    }
}

// --- ARSENAL / LOADOUT LOGIC ---

function renderLoadoutUI() {
    renderDeckSection();
    renderCollectionSection();
    validateDeck();
}

function renderDeckSection() {
    const deckTowers = document.getElementById('deckTowers');
    const deckSpells = document.getElementById('deckSpells');
    
    deckTowers.innerHTML = '';
    deckSpells.innerHTML = '';
    
    const towerArr = Array.from(userLoadout.towers);
    const spellArr = Array.from(userLoadout.spells);

    for (let i = 0; i < MAX_LOADOUT_TOWERS; i++) {
        const slot = document.createElement('div');
        const isFilled = i < towerArr.length;
        const id = isFilled ? towerArr[i] : null;
        const data = id ? TOWERS[id] : null;

        slot.className = `deck-slot ${isFilled ? 'filled' : 'empty'}`;
        
        if (id && data) {
            const rarity = RARITY[data.rarity] || RARITY.COMMON;
            slot.style.borderColor = rarity.color;
            slot.draggable = true;
            slot.innerHTML = `
                <div class="text-4xl drop-shadow-md mb-1">${data.icon}</div>
                <div class="text-[9px] text-center leading-tight px-1 text-white">${data.name}</div>
                <div class="absolute top-1 right-1 text-[8px] bg-black/60 px-1 rounded text-yellow-300">⚙️${data.cost}</div>
            `;
            slot.ondragstart = (e) => {
                e.dataTransfer.setData('type', 'deck-tower');
                e.dataTransfer.setData('id', id);
            };
            slot.onclick = () => handleDeckSlotClick('tower', id);
        } else {
            slot.innerHTML = `<div class="text-2xl opacity-20">🛡️</div>`;
        }

        slot.ondragover = (e) => e.preventDefault();
        slot.ondrop = (e) => handleDropOnDeck(e, 'tower', id);
        deckTowers.appendChild(slot);
    }

    for (let i = 0; i < MAX_LOADOUT_SPELLS; i++) {
        const slot = document.createElement('div');
        const isFilled = i < spellArr.length;
        const id = isFilled ? spellArr[i] : null;
        const data = id ? SPELLS[id] : null;

        slot.className = `deck-slot ${isFilled ? 'filled' : 'empty'}`;
        if (isFilled && data) {
            slot.style.borderColor = data.color;
            slot.draggable = true;
            slot.innerHTML = `
                <div class="text-4xl drop-shadow-md mb-1">${data.icon}</div>
                <div class="text-[9px] text-center leading-tight px-1" style="color:${data.color}">${data.name}</div>
            `;
            slot.ondragstart = (e) => {
                e.dataTransfer.setData('type', 'deck-spell');
                e.dataTransfer.setData('id', id);
            };
            slot.onclick = () => handleDeckSlotClick('spell', id);
        } else {
            slot.innerHTML = `<div class="text-2xl opacity-20">✨</div>`;
        }
        
        slot.ondragover = (e) => e.preventDefault();
        slot.ondrop = (e) => handleDropOnDeck(e, 'spell', id);
        deckSpells.appendChild(slot);
    }
}

function renderCollectionSection() {
    const colTowers = document.getElementById('collectionTowers');
    const colSpells = document.getElementById('collectionSpells');
    
    colTowers.innerHTML = '';
    colSpells.innerHTML = '';
    
    Object.values(TOWERS).forEach(t => {
        const div = document.createElement('div');
        const isEquipped = userLoadout.towers.has(t.id);
        const rarity = RARITY[t.rarity] || RARITY.COMMON;
        
        div.className = `collection-card ${isEquipped ? 'equipped' : ''}`;
        div.style.borderColor = rarity.color;
        
        if (!isEquipped) {
            div.draggable = true;
            div.ondragstart = (e) => {
                e.dataTransfer.setData('type', 'collection-tower');
                e.dataTransfer.setData('id', t.id);
            };
        }

        div.onclick = () => openCardModal(t.id, 'tower');
        div.innerHTML = `
            <div class="text-4xl mb-1">${t.icon}</div>
            <div class="text-[10px] text-gray-300 leading-none">${t.name}</div>
            <div class="text-[9px] text-yellow-500 mt-1 font-mono">⚙️${t.cost}</div>
        `;
        colTowers.appendChild(div);
    });

    Object.values(SPELLS).forEach(s => {
        const div = document.createElement('div');
        const isEquipped = userLoadout.spells.has(s.id);
        div.className = `collection-card ${isEquipped ? 'equipped' : ''}`;
        
        if(!isEquipped) {
            div.draggable = true;
            div.ondragstart = (e) => {
                e.dataTransfer.setData('type', 'collection-spell');
                e.dataTransfer.setData('id', s.id);
            };
        }

        div.onclick = () => openCardModal(s.id, 'spell');
        div.innerHTML = `
            <div class="text-4xl mb-1">${s.icon}</div>
            <div class="text-[10px] leading-none" style="color:${s.color}">${s.name}</div>
        `;
        colSpells.appendChild(div);
    });
    
    const collectionContainer = document.getElementById('collectionSection');
    collectionContainer.ondragover = (e) => e.preventDefault();
    collectionContainer.ondrop = (e) => {
        const type = e.dataTransfer.getData('type');
        const id = e.dataTransfer.getData('id');
        if (type === 'deck-tower') removeLoadoutItem('tower', id);
        if (type === 'deck-spell') removeLoadoutItem('spell', id);
    };
}

function handleDropOnDeck(e, targetType, occupiedId) {
    e.preventDefault();
    e.stopPropagation();
    const sourceType = e.dataTransfer.getData('type');
    const sourceId = e.dataTransfer.getData('id');

    if (targetType === 'tower' && sourceType.includes('tower')) {
        if (userLoadout.towers.has(sourceId)) return;
        if (occupiedId) {
            userLoadout.towers.delete(occupiedId);
            userLoadout.towers.add(sourceId);
        } else {
             if (userLoadout.towers.size < MAX_LOADOUT_TOWERS) userLoadout.towers.add(sourceId);
        }
        renderLoadoutUI();
    }
    
    if (targetType === 'spell' && sourceType.includes('spell')) {
        if (userLoadout.spells.has(sourceId)) return;
        if (occupiedId) {
            userLoadout.spells.delete(occupiedId);
            userLoadout.spells.add(sourceId);
        } else {
            if (userLoadout.spells.size < MAX_LOADOUT_SPELLS) userLoadout.spells.add(sourceId);
        }
        renderLoadoutUI();
    }
}

// --- MODAL & ACTION HANDLERS ---
let currentModalData = null;

function openCardModal(id, type) {
    if (gameState.swapMode) exitSwapMode();

    const data = type === 'tower' ? TOWERS[id] : SPELLS[id];
    if(!data) return;
    
    currentModalData = { id, type };

    const modal = document.getElementById('cardInfoModal');
    document.getElementById('modalIcon').innerHTML = data.icon;
    document.getElementById('modalTitle').innerText = data.name;
    document.getElementById('modalDesc').innerText = data.desc || "No description available.";
    
    const typeLabel = document.getElementById('modalType');
    const rarityBadge = document.getElementById('modalRarityBadge');
    
    if (type === 'tower') {
        const rarity = RARITY[data.rarity] || RARITY.COMMON;
        typeLabel.innerText = "Defense Tower";
        typeLabel.className = "text-xs font-mono uppercase text-gray-400 tracking-widest mb-2";
        
        rarityBadge.innerText = rarity.name;
        rarityBadge.className = `inline-block px-3 py-1 rounded text-xs uppercase mb-2 shadow-sm text-white ${rarity.bg} border ${rarity.border}`;
        rarityBadge.style.color = rarity.color === '#f6e05e' ? '#000' : '#fff';
        rarityBadge.style.borderColor = rarity.color;
        rarityBadge.classList.remove('hidden');
    } else {
        typeLabel.innerText = "Magical Spell";
        typeLabel.className = "text-xs font-mono uppercase text-purple-400 tracking-widest mb-2";
        rarityBadge.classList.add('hidden');
    }

    const statsContainer = document.getElementById('modalStats');
    statsContainer.innerHTML = '';
    const addStat = (l, v) => {
        const div = document.createElement('div');
        div.innerHTML = `<div class="text-xs text-gray-400 uppercase">${l}</div><div class="text-white">${v}</div>`;
        statsContainer.appendChild(div);
    };

    if (type === 'tower') {
        addStat('Damage', data.damage);
        addStat('Range', data.range);
        addStat('Speed', data.fireRate > 0 ? (60/data.fireRate).toFixed(1)+'/s' : '-');
        addStat('Cost', data.cost + ' ⚙️');
    } else {
        addStat('Cooldown', (data.cooldown/60).toFixed(0) + 's');
        addStat('Radius', data.radius);
    }

    const btn = document.getElementById('modalActionBtn');
    const hint = document.getElementById('modalHint');
    const set = type === 'tower' ? userLoadout.towers : userLoadout.spells;
    
    if (set.has(id)) {
        btn.innerText = "REMOVE FROM DECK";
        btn.className = "fantasy-btn secondary flex-1 py-3 text-lg";
        hint.classList.add('hidden');
    } else {
        btn.innerText = "USE IN BATTLE";
        btn.className = "fantasy-btn flex-1 py-3 text-lg";
        const limit = type === 'tower' ? MAX_LOADOUT_TOWERS : MAX_LOADOUT_SPELLS;
        if (set.size >= limit) hint.classList.remove('hidden');
        else hint.classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('cardInfoModal').classList.add('hidden');
    currentModalData = null;
}

function handleModalAction() {
    if (!currentModalData) return;
    const { id, type } = currentModalData;
    const set = type === 'tower' ? userLoadout.towers : userLoadout.spells;
    const limit = type === 'tower' ? MAX_LOADOUT_TOWERS : MAX_LOADOUT_SPELLS;

    if (set.has(id)) {
        set.delete(id);
        renderLoadoutUI();
        closeModal();
    } else {
        if (set.size < limit) {
            set.add(id);
            renderLoadoutUI();
            closeModal();
        } else {
            enterSwapMode(type, id);
            closeModal();
        }
    }
}

function enterSwapMode(type, pendingId) {
    gameState.swapMode = { type, pendingId };
    document.getElementById('deckSection').classList.add('swap-active');
    document.getElementById('swapInstruction').classList.remove('hidden');
    document.getElementById('overlay').classList.add('cursor-alias');
}

function exitSwapMode() {
    gameState.swapMode = null;
    document.getElementById('deckSection').classList.remove('swap-active');
    document.getElementById('swapInstruction').classList.add('hidden');
    document.getElementById('overlay').classList.remove('cursor-alias');
}

function handleDeckSlotClick(slotType, slotId) {
    if (gameState.swapMode) {
        if (gameState.swapMode.type !== slotType) return;
        const set = slotType === 'tower' ? userLoadout.towers : userLoadout.spells;
        set.delete(slotId);
        set.add(gameState.swapMode.pendingId);
        exitSwapMode();
        renderLoadoutUI();
    } else {
        openCardModal(slotId, slotType);
    }
}

function removeLoadoutItem(type, id) {
    const set = type === 'tower' ? userLoadout.towers : userLoadout.spells;
    if (set.has(id)) {
        set.delete(id);
        renderLoadoutUI();
    }
}

function validateDeck() {
    const isValid = userLoadout.towers.size > 0;
    const btn = document.getElementById('startBtn');
    if (isValid) {
        btn.disabled = false;
        btn.innerText = "BATTLE!";
        btn.classList.remove('opacity-50', 'cursor-not-allowed', 'filter', 'grayscale');
    } else {
        btn.disabled = true;
        btn.innerText = "PICK TOWERS";
        btn.classList.add('opacity-50', 'cursor-not-allowed', 'filter', 'grayscale');
    }
}

// --- GAME LOGIC INTEGRATION ---

function buildGameHUD() {
    const towerContainer = document.getElementById('hudTowers');
    towerContainer.innerHTML = '';
    const sortedTowers = Array.from(userLoadout.towers).map(id => TOWERS[id]).filter(Boolean).sort((a,b) => a.cost - b.cost);
    
    sortedTowers.forEach((tower) => {
        const btn = document.createElement('div');
        const rarity = RARITY[tower.rarity] || RARITY.COMMON;
        btn.className = `slot-card cursor-grab interactive`;
        btn.id = `hud-tower-${tower.id}`;
        btn.style.borderColor = rarity.color; 
        
        btn.setAttribute('draggable', 'true');
        btn.addEventListener('dragstart', (e) => handleHudDragStart(e, tower.id));
        btn.addEventListener('dragend', handleDragEnd);
        btn.onclick = () => selectTowerType(tower.id);
        btn.onmouseenter = (e) => showTowerTooltip(tower.id, e.clientX, e.clientY - 250);
        btn.onmouseleave = hideTowerTooltip;
        btn.innerHTML = `
            <div class="text-3xl mb-1 filter drop-shadow-md pointer-events-none">${tower.icon}</div>
            <div class="absolute top-1 right-1 bg-black/60 text-yellow-400 text-[10px] px-1 rounded font-mono pointer-events-none">⚙️${tower.cost}</div>
        `;
        towerContainer.appendChild(btn);
    });

    const spellContainer = document.getElementById('hudSpells');
    spellContainer.innerHTML = '';
    const sortedSpells = Array.from(userLoadout.spells).map(id => SPELLS[id]).filter(Boolean);
    sortedSpells.forEach(spell => {
        const btn = document.createElement('div');
        btn.className = `slot-card cursor-pointer interactive`;
        btn.id = `hud-spell-${spell.id}`;
        btn.onclick = () => selectSpell(spell.id);
        btn.innerHTML = `
            <div class="text-3xl pointer-events-none mb-1 shadow-black drop-shadow-md">${spell.icon}</div>
            <div class="text-[9px] text-gray-300 pointer-events-none">${spell.name}</div>
            <div id="cd-spell-${spell.id}" class="cooldown-overlay"></div>
        `;
        spellContainer.appendChild(btn);
    });
}

function handleHudDragStart(e, towerId) {
    if (!gameState.running) { e.preventDefault(); return; }
    e.dataTransfer.setData("text/plain", towerId);
    e.dataTransfer.effectAllowed = "copy";
    gameState.interactionMode = 'DRAG';
    gameState.selectedTowerType = towerId;
    const emptyImg = new Image(); 
    emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(emptyImg, 0, 0);
    e.target.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
    if (gameState.interactionMode === 'DRAG') {
        gameState.interactionMode = 'NONE';
        gameState.selectedTowerType = null;
    }
    updateSelectionUI();
}

function handleDragOver(e) {
    e.preventDefault(); e.dataTransfer.dropEffect = "copy";
    const rect = canvas.getBoundingClientRect();
    const worldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    mouse.x = worldPos.x; mouse.y = worldPos.y;
    mouse.gridX = Math.floor(mouse.x / CELL_SIZE); mouse.gridY = Math.floor(mouse.y / CELL_SIZE);
    mouse.valid = (mouse.gridX >= 0 && mouse.gridX < gameState.mapWidth && mouse.gridY >= 0 && mouse.gridY < gameState.mapHeight);
}

function handleDrop(e) {
    e.preventDefault();
    const towerId = e.dataTransfer.getData("text/plain");
    if (mouse.valid && towerId && TOWERS[towerId]) {
        gameState.selectedTowerType = towerId;
        attemptPlaceTower(mouse.gridX, mouse.gridY);
    }
    gameState.interactionMode = 'NONE';
    gameState.selectedTowerType = null;
    updateSelectionUI();
}

// --- MAIN GAME LOOP FUNCTIONS ---

function showLoadoutScreen() {
    gameState.running = false;
    document.getElementById('overlay').classList.remove('hidden');
    document.getElementById('menuBtn').classList.add('hidden');
    renderLoadoutUI();
}

function startGame() {
    buildGameHUD();
    resetGame();
    gameState.running = true;
    document.getElementById('overlay').classList.add('hidden');
}

function resetGame() {
    gameState.money = 6;
    gameState.lives = 20; gameState.wave = 1;
    gameState.waveActive = false; gameState.enemies = []; gameState.towers = [];
    gameState.projectiles = []; gameState.particles = []; gameState.groundEffects = [];
    gameState.autoStartTimer = 0;
    
    if (window.MapLoader) {
        window.MapLoader.load(gameState);
        view.x = (window.innerWidth - gameState.mapWidth * CELL_SIZE) / 2;
        view.y = (window.innerHeight - gameState.mapHeight * CELL_SIZE) / 2;
        view.scale = 1;
    } else {
        const w = Math.ceil(window.innerWidth / CELL_SIZE);
        const h = Math.ceil(window.innerHeight / CELL_SIZE);
        gameState.mapWidth = w; gameState.mapHeight = h;
        gameState.grid = Array(h).fill().map(() => Array(w).fill(0));
        gameState.start = { x: 0, y: Math.floor(h/2) };
        gameState.end = { x: w-1, y: Math.floor(h/2) };
    }
    
    gameState.spawnQueue = [];
    gameState.spellCooldowns = {};
    userLoadout.spells.forEach(id => { gameState.spellCooldowns[id] = 0; });
    if(gameState.grid[gameState.start.y]) gameState.grid[gameState.start.y][gameState.start.x] = 0;
    if(gameState.grid[gameState.end.y]) gameState.grid[gameState.end.y][gameState.end.x] = 0;
    gameState.upcomingWaves = [];
    for(let i=0; i<6; i++) { gameState.upcomingWaves.push(generateWaveConfig(i + 1)); }
    recalculatePath();
    updateUI();
    updateWaveControlUI();
}

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
function createGrassPattern() {
    const pCanvas = document.createElement('canvas'); pCanvas.width = 128; pCanvas.height = 128; const pCtx = pCanvas.getContext('2d');
    pCtx.fillStyle = '#76b041'; pCtx.fillRect(0,0,128,128);
    for(let i=0; i<400; i++) { pCtx.fillStyle = Math.random() > 0.5 ? '#6aa339' : '#82bd4b'; pCtx.fillRect(Math.random()*128,Math.random()*128,3,3); }
    grassPattern = ctx.createPattern(pCanvas, 'repeat');
}
function screenToWorld(sx, sy) { return { x: (sx - view.x) / view.scale, y: (sy - view.y) / view.scale }; }
function zoom(delta) {
    let newScale = view.scale + delta; if(newScale < view.minScale) newScale = view.minScale; if(newScale > view.maxScale) newScale = view.maxScale;
    const cx = canvas.width/2; const cy = canvas.height/2; const wp = screenToWorld(cx,cy);
    view.scale = newScale; view.x = cx - wp.x * newScale; view.y = cy - wp.y * newScale;
}
function pan(dx, dy) { view.x += dx; view.y += dy; }
function resetView() { view.scale = 1; view.x = 0; view.y = 0; }
function handleWheel(e) {
    e.preventDefault(); const factor = (e.deltaY < 0 ? 1 : -1) * 0.1;
    let newScale = view.scale + factor; if(newScale < view.minScale) newScale = view.minScale; if(newScale > view.maxScale) newScale = view.maxScale;
    const rect = canvas.getBoundingClientRect(); const wp = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    view.scale = newScale; view.x = (e.clientX - rect.left) - wp.x * newScale; view.y = (e.clientY - rect.top) - wp.y * newScale;
}
function handleMouseDown(e) {
    if (!gameState.running) return;
    if (e.button === 2 || e.button === 1) { view.dragging = true; view.dragStartX = e.clientX; view.dragStartY = e.clientY; view.dragStartViewX = view.x; view.dragStartViewY = view.y; canvas.style.cursor = 'grabbing'; return; }
    handleClick(e);
}
function handleMouseUp(e) { if(view.dragging) { view.dragging = false; canvas.style.cursor = 'default'; } }
function handleMouseMove(e) {
    if (!gameState.running) return;
    if (view.dragging) { view.x = view.dragStartViewX + (e.clientX - view.dragStartX); view.y = view.dragStartViewY + (e.clientY - view.dragStartY); }
    const rect = canvas.getBoundingClientRect(); const wp = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    mouse.x = wp.x; mouse.y = wp.y; mouse.gridX = Math.floor(mouse.x / CELL_SIZE); mouse.gridY = Math.floor(mouse.y / CELL_SIZE);
    mouse.valid = (mouse.gridX >= 0 && mouse.gridX < gameState.mapWidth && mouse.gridY >= 0 && mouse.gridY < gameState.mapHeight);
}
function handleClick(e) {
    if (!gameState.running || !mouse.valid || view.dragging) return;
    if (gameState.interactionMode === 'SPELL' && gameState.selectedSpell) { castSpell(gameState.selectedSpell, mouse.x, mouse.y); gameState.interactionMode = 'NONE'; gameState.selectedSpell = null; updateSelectionUI(); showBuildMenu(); return; }
    const existingTower = gameState.towers.find(t => t.gridX === mouse.gridX && t.gridY === mouse.gridY);
    if (existingTower) { if(gameState.selectedPlacedTower === existingTower) { closeUpgradeMenu(); return; } gameState.interactionMode = 'UPGRADE'; gameState.selectedPlacedTower = existingTower; showUpgradeMenu(existingTower); return; }
    if (gameState.interactionMode === 'UPGRADE') { closeUpgradeMenu(); return; }
    if (gameState.interactionMode === 'BUILD' && gameState.selectedTowerType) { attemptPlaceTower(mouse.gridX, mouse.gridY); }
    else if (gameState.interactionMode !== 'NONE') { gameState.interactionMode = 'NONE'; gameState.selectedTowerType = null; gameState.selectedSpell = null; updateSelectionUI(); }
}

function generateWaveConfig(n) { const isBoss=n%10===0; const hasAir=n>=3&&(Math.random()>0.4||isBoss); let type=isBoss?(hasAir?'MIXED':'GROUND'):(hasAir?(Math.random()>0.5?'AIR':'MIXED'):'GROUND'); return {waveNum:n,isBoss,type,hasAir}; }
function selectTowerType(id) { if(!userLoadout.towers.has(id)) return; if(gameState.interactionMode==='BUILD'&&gameState.selectedTowerType===id){gameState.interactionMode='NONE';gameState.selectedTowerType=null;}else{gameState.interactionMode='BUILD';gameState.selectedTowerType=id;gameState.selectedPlacedTower=null;gameState.selectedSpell=null;} showBuildMenu(); updateSelectionUI(); }
function selectSpell(id) { if(!userLoadout.spells.has(id)||gameState.spellCooldowns[id]>0)return; if(gameState.interactionMode==='SPELL'&&gameState.selectedSpell===id){gameState.interactionMode='NONE';gameState.selectedSpell=null;}else{gameState.interactionMode='SPELL';gameState.selectedSpell=id;gameState.selectedPlacedTower=null;} showBuildMenu(); updateSelectionUI(); }
function showBuildMenu() { document.getElementById('buildHud').classList.replace('hidden','flex'); document.getElementById('upgradeHud').classList.replace('flex','hidden'); }
function showUpgradeMenu(t) { document.getElementById('buildHud').classList.replace('flex','hidden'); document.getElementById('upgradeHud').classList.replace('hidden','flex'); document.getElementById('upgName').innerText=t.type.name; document.getElementById('upgLevel').innerText=`Level ${t.level}`; const s=window.TowerUtils.getTowerStats(t); document.getElementById('statDmg').innerText=Math.round(s.damage); document.getElementById('statRng').innerText=s.range.toFixed(1); document.getElementById('statSpd').innerText=t.type.fireRate>0?(60/s.fireRate).toFixed(1)+'/s':'-'; document.getElementById('sellPrice').innerText=Math.floor(t.type.cost*0.5*t.level); const btn=document.getElementById('btnUpgrade'); if(t.level>=3){btn.disabled=true;btn.querySelector('span:last-child').innerText='MAX';}else{btn.disabled=false;const c=t.type.cost*(t.level+1);btn.querySelector('span:last-child').innerText=`💰 ${c}`;if(gameState.money<c)btn.classList.add('opacity-50');else btn.classList.remove('opacity-50');} }
function closeUpgradeMenu() { gameState.selectedPlacedTower=null; gameState.interactionMode='NONE'; showBuildMenu(); updateSelectionUI(); }
function updateSelectionUI() { document.querySelectorAll('.slot-card').forEach(e=>e.classList.remove('selected-tower','selected-spell')); if(gameState.interactionMode==='BUILD'&&gameState.selectedTowerType)document.getElementById(`hud-tower-${gameState.selectedTowerType}`)?.classList.add('selected-tower'); else if(gameState.interactionMode==='SPELL'&&gameState.selectedSpell)document.getElementById(`hud-spell-${gameState.selectedSpell}`)?.classList.add('selected-spell'); }
function upgradeSelectedTower() { const t=gameState.selectedPlacedTower; if(!t||t.level>=3)return; const c=t.type.cost*(t.level+1); if(gameState.money>=c){gameState.money-=c;t.level++;addParticle(t.x,t.y,'#fbbf24',15);showUpgradeMenu(t);updateUI();} }
function sellSelectedTower() { const t=gameState.selectedPlacedTower; if(!t)return; gameState.money+=Math.floor(t.type.cost*0.5*t.level); gameState.grid[t.gridY][t.gridX]=0; gameState.towers=gameState.towers.filter(x=>x!==t); addParticle(t.x,t.y,'#fff',10); recalculatePath(); closeUpgradeMenu(); updateUI(); }
function getBFSPath(s,e,g) { const q=[s],v=new Set([`${s.x},${s.y}`]),c={}; const dirs=[[0,1],[0,-1],[1,0],[-1,0]]; const H=g.length; const W=g[0].length; while(q.length){const cur=q.shift();if(cur.x===e.x&&cur.y===e.y){const p=[];let t=cur;while(t){p.push(t);t=c[`${t.x},${t.y}`];}return p.reverse();}for(let[dx,dy]of dirs){const nx=cur.x+dx,ny=cur.y+dy;if(nx>=0&&nx<W&&ny>=0&&ny<H){const k=`${nx},${ny}`;if(!v.has(k)&&g[ny][nx]===0){v.add(k);c[k]=cur;q.push({x:nx,y:ny});}}}} return null; }
function recalculatePath() { const p=getBFSPath(gameState.start,gameState.end,gameState.grid); if(p)gameState.path=p; return p; }
function attemptPlaceTower(gx,gy) { 
    if(gameState.grid[gy][gx]!==0)return false; 
    if(Math.abs(gx-gameState.start.x)<2&&gy===gameState.start.y)return false; 
    if(Math.abs(gx-gameState.end.x)<2&&gy===gameState.end.y)return false; 
    const tt=TOWERS[gameState.selectedTowerType]; 
    if(gameState.money<tt.cost){addParticle(mouse.x,mouse.y,'#f00',5);return false;} 
    gameState.grid[gy][gx]=1; 
    if(getBFSPath(gameState.start,gameState.end,gameState.grid)){
        gameState.money-=tt.cost;
        gameState.towers.push({
            gridX:gx, gridY:gy,
            x:gx*CELL_SIZE+CELL_SIZE/2, y:gy*CELL_SIZE+CELL_SIZE/2,
            type:tt, level:1, cooldown:0, angle:0,
            laserDamage:0, laserTargetId:-1, overclockTimer:0,
            recoil: 0, rampTimer: 0
        });
        recalculatePath();
        addParticle(gx*CELL_SIZE+CELL_SIZE/2,gy*CELL_SIZE+CELL_SIZE/2,tt.color,10);
        gameState.interactionMode='NONE';gameState.selectedTowerType=null;
        updateSelectionUI();updateUI();return true;
    } else {
        gameState.grid[gy][gx]=0;
        addParticle(gx*CELL_SIZE+CELL_SIZE/2,gy*CELL_SIZE+CELL_SIZE/2,'#f00',5);
        return false;
    } 
}
function castSpell(id, x, y) {
    const s = SPELLS[id];
    gameState.spellCooldowns[id] = s.cooldown;
    const r = s.radius * CELL_SIZE;
    
    for(let i=0; i<30; i++) {
        const a = Math.random() * 6.28, d = Math.random() * r;
        addParticle(x + Math.cos(a)*d, y + Math.sin(a)*d, s.color, 1);
    }

    if (id === 'OVERCLOCK') {
        gameState.towers.forEach(t => {
            if (Math.hypot(t.x - x, t.y - y) <= r) t.overclockTimer = s.duration;
        });
    } else {
        gameState.enemies.forEach(e => {
            if (Math.hypot(e.x - x, e.y - y) <= r) {
                if (id === 'BARRAGE') e.health -= 150;
                else if (id === 'FREEZE') { e.slowTimer = s.duration; e.frozenSpeed = 0; }
                else if (id === 'POISON') {
                    e.poisonStacks.push({ damage: 3, duration: 600, tick: 0, tickRate: 40 });
                }
                else if (id === 'SHRINK') { e.radius *= 0.5; e.health *= 0.5; }
            }
        });
    }
}
function showTowerTooltip(id,x,y) { const t=TOWERS[id]; if(!t)return; const el=document.getElementById('towerTooltip'); el.innerHTML=`<div class="flex items-center gap-2 mb-2 border-b border-gray-600 pb-1"><span class="text-2xl">${t.icon}</span><div><div class=" text-yellow-400 text-lg leading-none">${t.name}</div><div class="text-xs text-gray-400">${t.desc}</div></div></div><div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs"><div>💥 Damage: <span class=" text-white">${t.damage}</span></div><div>🎯 Range: <span class=" text-white">${t.range}</span></div></div>`; el.classList.remove('hidden'); let l=x+10,tp=y+10; if(l+220>window.innerWidth)l=x-230; if(tp+100>window.innerHeight)tp=y-110; el.style.left=l+'px'; el.style.top=tp+'px'; }
function hideTowerTooltip() { document.getElementById('towerTooltip').classList.add('hidden'); }

// Loop & Update
let lastTime=0, acc=0; const TS=1000/60;
function loop(ts) { if(!lastTime)lastTime=ts; const dt=ts-lastTime; lastTime=ts; if(gameState.running){acc+=dt;if(acc>1000)acc=1000;while(acc>=TS){update();acc-=TS;}draw();} requestAnimationFrame(loop); }

function update() {
    for(let id in gameState.spellCooldowns){if(gameState.spellCooldowns[id]>0){gameState.spellCooldowns[id]--;const pct=(gameState.spellCooldowns[id]/SPELLS[id].cooldown)*100;const el=document.getElementById(`cd-spell-${id}`);if(el)el.style.height=`${pct}%`;const btn=document.getElementById(`hud-spell-${id}`);if(gameState.spellCooldowns[id]===0)btn?.classList.remove('disabled');else btn?.classList.add('disabled');}}
    if(!gameState.waveActive&&gameState.autoStart&&gameState.enemies.length===0){if(gameState.autoStartTimer>0){gameState.autoStartTimer--;document.getElementById('autoTimer').innerText=`AUTO START: ${(gameState.autoStartTimer/60).toFixed(1)}s`;}else activateWave();}
    
    if(gameState.waveActive){
        if(gameState.spawnQueue.length>0){
            gameState.spawnTimer--;
            if(gameState.spawnTimer<=0){ const d=gameState.spawnQueue.pop(); if(d)spawnEnemy(d.isBoss,d.flying); gameState.spawnTimer=40; }
        }else if(gameState.enemies.length===0){
            let reward = 4;
            if (gameState.currentWaveConfig) {
                if (gameState.currentWaveConfig.type === 'AIR' || gameState.currentWaveConfig.type === 'MIXED') reward += 2;
                if (gameState.currentWaveConfig.isBoss) reward += 10;
            }
            gameState.money += reward;
            gameState.waveActive=false;
            prepareNextWave();
        }
    }

    for(let i=gameState.enemies.length-1;i>=0;i--){const e=gameState.enemies[i]; 
        let sm = 1.0;
        if(e.slowTimer > 0) sm *= e.frozenSpeed;
        if(e.honeySlowed) sm *= e.honeyFactor;
        e.honeySlowed = false;
        
        if(e.slowTimer>0)e.slowTimer--; 
        for (let k = e.poisonStacks.length - 1; k >= 0; k--) {
            let p = e.poisonStacks[k];
            p.tick--;
            if (p.tick <= 0) { e.health -= p.damage; p.tick = p.tickRate; if (Math.random() > 0.7) addParticle(e.x, e.y, '#4ade80', 1); }
            p.duration--;
            if (p.duration <= 0) e.poisonStacks.splice(k, 1);
        }
        if (e.isBurned) {
            e.burnTick--;
            if (e.burnTick <= 0) { e.health -= e.burnDamage; e.burnTick = 10; addParticle(e.x, e.y, '#f97316', 1); }
            e.burnDuration--;
            if (e.burnDuration <= 0) e.isBurned = false;
        } 
        if(e.health<=0){ gameState.enemies.splice(i,1);addParticle(e.x,e.y,'#fff',8);updateUI();if(gameState.interactionMode==='UPGRADE'&&gameState.selectedPlacedTower)showUpgradeMenu(gameState.selectedPlacedTower);continue;} 
        const ms=e.baseSpeed*sm; 
        if(e.isFlying){const dx=(gameState.end.x*CELL_SIZE+CELL_SIZE/2)-e.x,dy=(gameState.end.y*CELL_SIZE+CELL_SIZE/2)-e.y,d=Math.hypot(dx,dy);if(d<ms){e.x+=dx;e.y+=dy;}else{e.x+=(dx/d)*ms;e.y+=(dy/d)*ms;}}
        else{if(e.path&&e.pathIndex<e.path.length){const t=e.path[e.pathIndex],tx=t.x*CELL_SIZE+CELL_SIZE/2,ty=t.y*CELL_SIZE+CELL_SIZE/2,dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy);if(d<ms){e.pathIndex++;e.x=tx;e.y=ty;}else{e.x+=(dx/d)*ms;e.y+=(dy/d)*ms;}}} 
        if(Math.hypot(e.x-(gameState.end.x*CELL_SIZE+CELL_SIZE/2),e.y-(gameState.end.y*CELL_SIZE+CELL_SIZE/2))<5){gameState.lives-=e.isBoss?5:1;gameState.enemies.splice(i,1);updateUI();if(gameState.lives<=0)endGame();continue;}
    }
    
    gameState.towers.forEach(t=>{if(t.overclockTimer>0)t.overclockTimer--;if(t.cooldown>0)t.cooldown--;if(t.type.update)t.type.update(t,gameState);});
    
    for(let i=gameState.groundEffects.length-1;i>=0;i--){
        const z=gameState.groundEffects[i];
        z.duration--;
        if(z.duration<=0){gameState.groundEffects.splice(i,1);continue;}
        if(Math.random()>0.8){ const a=Math.random()*6.28,r=Math.random()*z.radius; addParticle(z.x+Math.cos(a)*r,z.y+Math.sin(a)*r, z.color || '#f97316', 1); }
        gameState.enemies.forEach(e=>{
            if(!e.isFlying && Math.hypot(e.x-z.x,e.y-z.y)<z.radius){
                if(z.type === 'honey') { e.honeySlowed = true; e.honeyFactor = z.slowFactor; } 
                else {
                    if(z.duration%10===0) { e.health-=z.damage; e.isBurned=true; e.burnDamage=z.burnDamage||2; e.burnDuration=180; e.burnTick=0; }
                }
            }
        });
    }

    for(let i=gameState.projectiles.length-1;i>=0;i--){ window.TowerUtils.Projectiles.update(gameState.projectiles[i], gameState, i); }
    gameState.particles.forEach(p=>{p.life--;p.x+=p.vx;p.y+=p.vy;if(p.life<=0)p.life=0;}); gameState.particles=gameState.particles.filter(p=>p.life>0);
}

function applyEffect(e, f) {
    if (f.type === 'poison') { e.poisonStacks.push({ damage: f.damage, duration: f.duration, tick: 0, tickRate: 40 }); } 
    else if (f.type === 'burn') { e.isBurned = true; e.burnDamage = f.damage; e.burnDuration = f.duration; e.burnTick = 0; } 
    else if (f.type === 'slow') { e.slowTimer = f.duration; e.frozenSpeed = f.factor; }
}

function activateWave() { if(gameState.waveActive)return; gameState.waveActive=true; gameState.autoStartTimer=0; updateWaveControlUI(); const c=gameState.upcomingWaves[0]; gameState.currentWaveConfig = c; if(c.isBoss){document.getElementById('bossSplash').classList.remove('hidden');setTimeout(()=>document.getElementById('bossSplash').classList.add('hidden'),3000);gameState.spawnQueue=[{isBoss:true,flying:c.type==='AIR'||(c.type==='MIXED'&&Math.random()>0.5)}];}else{const cnt=5+gameState.wave;gameState.spawnQueue=[];for(let i=0;i<cnt;i++)gameState.spawnQueue.push({isBoss:false,flying:c.type==='AIR'||(c.type==='MIXED'&&Math.random()>0.6)});} }
function prepareNextWave() { gameState.upcomingWaves.shift(); gameState.upcomingWaves.push(generateWaveConfig(gameState.wave+6)); gameState.wave++; updateWaveControlUI(); updateUI(); if(gameState.autoStart){gameState.autoStartTimer=180;document.getElementById('autoTimer').classList.remove('hidden');} }
function updateWaveControlUI() { const b=document.getElementById('nextWaveBtn'),s=document.getElementById('waveStatus'),a=document.getElementById('autoTimer'),c=document.getElementById('wavePreview'); if(gameState.waveActive){b.classList.add('hidden');s.classList.remove('hidden');a.classList.add('hidden');}else{if(!gameState.autoStart)b.classList.remove('hidden');else b.classList.add('hidden');s.classList.add('hidden');} c.innerHTML=''; for(let i=0;i<5;i++){const w=gameState.upcomingWaves[i],d=document.createElement('div');d.className='wave-pip';let sym='🛡️';if(w.isBoss)sym='💀';else if(w.type==='AIR')sym='🎈';else if(w.type==='MIXED')sym='⚡';d.innerHTML=sym;if(w.isBoss)d.style.borderColor='#ef4444';if(w.type==='AIR')d.style.color='#63b3ed';c.appendChild(d);} }
let eid=0;
function spawnEnemy(b, f) {
    const hp = b ? 3000 + (gameState.wave * 500) : 30 + (gameState.wave * 15);
    const sp = f ? (b ? 0.6 : 1.2) : (b ? 0.5 : 1.0 + (gameState.wave * 0.05));
    gameState.enemies.push({ id: eid++, x: gameState.start.x * CELL_SIZE + CELL_SIZE/2, y: gameState.start.y * CELL_SIZE + CELL_SIZE/2, health: hp, maxHealth: hp, baseSpeed: sp, reward: b ? 10 : 1, isBoss: b, isFlying: f, path: getBFSPath(gameState.start, gameState.end, gameState.grid), pathIndex: 0, radius: b ? 20 : 12, color: b ? '#ef4444' : (f ? '#3182ce' : '#fbbf24'), slowTimer: 0, poisonStacks: [], isBurned: false, burnDamage: 0, burnDuration: 0, burnTick: 0 });
}
function endGame() { gameState.running=false; document.getElementById('overlay').classList.remove('hidden'); document.querySelector('#overlay h1').innerText="DEFEAT"; document.getElementById('menuBtn').classList.remove('hidden'); document.getElementById('startBtn').innerText="TRY AGAIN"; }
function updateUI() { document.getElementById('moneyDisplay').innerText=Math.floor(gameState.money); document.getElementById('livesDisplay').innerText=gameState.lives; document.getElementById('waveDisplay').innerText=gameState.wave; userLoadout.towers.forEach(id=>{const b=document.getElementById(`hud-tower-${id}`);if(b){if(gameState.money<TOWERS[id].cost)b.classList.add('disabled');else b.classList.remove('disabled');}}); }
function addParticle(x,y,c,n) { for(let i=0;i<n;i++)gameState.particles.push({x,y,vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*4,life:20+Math.random()*10,color:c}); }

function draw() {
    if(grassPattern){ ctx.fillStyle = grassPattern; ctx.fillRect(0, 0, canvas.width, canvas.height); } else { ctx.fillStyle = '#76b041'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.save(); ctx.translate(view.x, view.y); ctx.scale(view.scale, view.scale);

    if(gameState.terrainVisuals && gameState.terrainVisuals.length > 0) {
        for(let y=0; y<gameState.mapHeight; y++) {
            for(let x=0; x<gameState.mapWidth; x++) {
                const t = gameState.terrainVisuals[y][x]; const px = x * CELL_SIZE, py = y * CELL_SIZE;
                if(t === 'path') { ctx.fillStyle = '#8d6e63'; ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE); }
                else if(t === 'stone_floor') { ctx.fillStyle = '#718096'; ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE); }
                else if(t === 'water') { ctx.fillStyle = '#4299e1'; ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE); if((Date.now()/500)%2 > 1) { ctx.font = '20px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillText('~', px+10, py+20); } }
                ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 1; ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
            }
        }
    } else {
        ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1; ctx.beginPath();
        const w = gameState.grid[0].length, h = gameState.grid.length;
        for(let x=0; x<=w; x++) { ctx.moveTo(x * CELL_SIZE, 0); ctx.lineTo(x * CELL_SIZE, h * CELL_SIZE); }
        for(let y=0; y<=h; y++) { ctx.moveTo(0, y * CELL_SIZE); ctx.lineTo(w * CELL_SIZE, y * CELL_SIZE); }
        ctx.stroke();
    }

    gameState.groundEffects.forEach(g => {
        const alpha = 0.2 + (g.duration / g.maxDuration) * 0.4;
        ctx.fillStyle = g.color || `rgba(234, 88, 12, ${alpha})`;
        ctx.beginPath(); ctx.arc(g.x, g.y, g.radius, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = g.color ? '#b7791f' : '#c2410c'; ctx.lineWidth = 2; ctx.stroke();
    });

    if(gameState.features) gameState.features.forEach(f => {
        const cx = f.x * CELL_SIZE, cy = f.y * CELL_SIZE, s = f.scale * CELL_SIZE * 0.8;
        ctx.save(); ctx.translate(cx, cy);
        ctx.font = `${s}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, s*0.4, s*0.4, s*0.15, 0, 0, Math.PI*2); ctx.fill();
        if(f.type === 'mountain') ctx.fillText('⛰️', 0, 0); else if(f.type === 'forest') ctx.fillText('🌲', 0, 0);
        ctx.restore();
    });

    if(gameState.path.length > 0) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = CELL_SIZE * 0.6;
        ctx.beginPath(); ctx.moveTo(gameState.start.x * CELL_SIZE + CELL_SIZE/2, gameState.start.y * CELL_SIZE + CELL_SIZE/2);
        for(let n of gameState.path) ctx.lineTo(n.x * CELL_SIZE + CELL_SIZE/2, n.y * CELL_SIZE + CELL_SIZE/2);
        ctx.stroke(); ctx.strokeStyle = '#a1887f'; ctx.lineWidth = CELL_SIZE * 0.4; ctx.stroke();
    }
    
    ctx.font = '30px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🏰', gameState.start.x * CELL_SIZE + CELL_SIZE/2, gameState.start.y * CELL_SIZE + CELL_SIZE/2);
    ctx.fillText('💀', gameState.end.x * CELL_SIZE + CELL_SIZE/2, gameState.end.y * CELL_SIZE + CELL_SIZE/2);

    gameState.towers.forEach(t => {
        ctx.save(); ctx.translate(t.x, t.y);
        ctx.shadowBlur = 5; ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.fillStyle = t.type.color; ctx.fillRect(-20, -20, 40, 40);
        ctx.strokeStyle = t === gameState.selectedPlacedTower ? '#fff' : '#2d3748';
        ctx.lineWidth = t === gameState.selectedPlacedTower ? 3 : 2;
        ctx.strokeRect(-20, -20, 40, 40);
        
        if(!t.type.fixed) {
            ctx.rotate(t.angle + (t.type.rotationOffset || 0));
            if(t.recoil > 0) ctx.translate(-t.recoil * 1.5, 0);
        }
        
        ctx.shadowBlur = 0; ctx.font = '32px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(t.type.icon, 0, 2);
        ctx.restore();
        
        if(t.level > 1) { ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.fillText('⭐'.repeat(t.level - 1), t.x, t.y - 25); }
        
        if(t.type.attackType === 'BEAM' && t.laserTargetId !== -1) {
            const tg = gameState.enemies.find(e => e.id === t.laserTargetId);
            if(tg) {
                const maxRamp = t.type.rampDuration || 180;
                const currentRamp = Math.min(t.rampTimer || 0, maxRamp);
                const progress = currentRamp / maxRamp;
                const baseWidth = 2 + (progress * 6);
                const amplitude = progress * 5;
                const frequency = 0.2;
                const time = Date.now() / 50;

                ctx.save();
                ctx.strokeStyle = t.type.projectileColor;
                ctx.lineWidth = baseWidth + Math.sin(time) * 2; 
                ctx.lineCap = 'round';
                ctx.shadowBlur = 10 + (progress * 20);
                ctx.shadowColor = t.type.projectileColor;
                
                ctx.beginPath();
                const dist = Math.hypot(tg.x - t.x, tg.y - t.y);
                const angle = Math.atan2(tg.y - t.y, tg.x - t.x);
                ctx.translate(t.x, t.y);
                ctx.rotate(angle);
                ctx.moveTo(0, 0);
                for(let i=0; i<=dist; i+=5) { const waveY = Math.sin(i * frequency - time) * amplitude; ctx.lineTo(i, waveY); }
                ctx.stroke();

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = Math.max(1, baseWidth / 3);
                ctx.shadowBlur = 5;
                ctx.shadowColor = '#fff';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                for(let i=0; i<=dist; i+=5) { const waveY = Math.sin(i * frequency - time) * (amplitude * 0.5); ctx.lineTo(i, waveY); }
                ctx.stroke();
                ctx.restore();
            }
        }
    });

    const sortedEnemies = [...gameState.enemies].sort((a,b) => (a.isFlying ? 1 : 0) - (b.isFlying ? 1 : 0));
    sortedEnemies.forEach(e => {
        ctx.save(); ctx.translate(e.x, e.y);
        const sy = e.isFlying ? 30 : 10, ss = e.isFlying ? 0.7 : 1.0;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, sy, e.radius*ss, (e.radius/2)*ss, 0, 0, Math.PI*2); ctx.fill();
        
        if(e.isFlying) {
            ctx.font = e.isBoss ? '40px Arial' : '24px Arial';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff';
            ctx.fillText('🎈', 0, 0);
        } else {
            ctx.fillStyle = e.poisonStacks.length > 0 ? '#4ade80' : (e.isBurned ? '#f97316' : (e.slowTimer > 0 ? '#38bdf8' : e.color));
            ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI*2); ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
            ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(-4, -4, 3, 0, Math.PI*2); ctx.arc(4, -4, 3, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(-4, -4, 1, 0, Math.PI*2); ctx.arc(4, -4, 1, 0, Math.PI*2); ctx.fill();
        }
        ctx.fillStyle = '#000'; ctx.fillRect(-10, -e.radius - 12, 20, 4);
        ctx.fillStyle = e.isBoss ? '#ef4444' : '#10b981'; ctx.fillRect(-10, -e.radius - 12, 20 * (e.health/e.maxHealth), 4);
        ctx.restore();
    });

    gameState.projectiles.forEach(p => {
        const height = p.height || 0;
        const scale = 1 + (height / 200); 
        if(p.icon) { 
             ctx.font = `${20 * scale}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
             ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillText(p.icon, p.x + 2, p.y - height + 2);
             ctx.fillStyle = '#fff'; ctx.fillText(p.icon, p.x, p.y - height);
        } else if(p.moveType === 'ARC') {
            const baseRadius = 4;
            const radius = baseRadius * scale; 
            ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, baseRadius, baseRadius/2, 0, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y - height, radius, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
        }
    });

    gameState.particles.forEach(p => {
        const lifeRatio = p.life / (p.maxLife || 20);
        ctx.save();
        ctx.globalAlpha = lifeRatio; 
        
        if (p.type === 'lightning') {
            // --- PROMINENT LIGHTNING DRAW LOGIC ---
            
            // 1. Outer Glow (Colored, Wide, Blurry)
            ctx.shadowBlur = 15; 
            ctx.shadowColor = p.color;
            ctx.strokeStyle = p.color; 
            ctx.lineWidth = 6 * lifeRatio; // Thicker line
            ctx.lineCap = 'round'; 
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            let curr = p.points[0];
            ctx.moveTo(curr.x, curr.y);
            
            for(let i=1; i<p.points.length; i++) {
                const next = p.points[i];
                const dist = Math.hypot(next.x - curr.x, next.y - curr.y);
                const steps = Math.floor(dist / 20); 
                
                for(let j=1; j<steps; j++) {
                    const t = j/steps;
                    const jitter = (Math.random() - 0.5) * 20; 
                    const lx = curr.x + (next.x - curr.x) * t + jitter;
                    const ly = curr.y + (next.y - curr.y) * t + jitter;
                    ctx.lineTo(lx, ly);
                }
                ctx.lineTo(next.x, next.y);
                curr = next;
            }
            ctx.stroke();

            // 2. Inner Core (White, Sharp)
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff'; 
            ctx.lineWidth = 2 * lifeRatio;
            ctx.stroke();
            // ----------------------------
        } else {
            // Standard Particles
            ctx.fillStyle = p.color;
            ctx.beginPath(); 
            ctx.arc(p.x, p.y, 3, 0, Math.PI*2); 
            ctx.fill();
        }
        ctx.restore();
    });

    if(gameState.running && mouse.valid) {
        if((gameState.interactionMode === 'BUILD' || gameState.interactionMode === 'DRAG') && gameState.selectedTowerType) {
            const gx = mouse.gridX * CELL_SIZE, gy = mouse.gridY * CELL_SIZE;
            const t = TOWERS[gameState.selectedTowerType];
            const v = gameState.grid[mouse.gridY][mouse.gridX] === 0;
            ctx.save(); ctx.translate(gx + CELL_SIZE/2, gy + CELL_SIZE/2);
            
            const rangePx = window.TowerUtils.getTowerStats({type:t, level:1}).range * 64;
            const minRangePx = (t.minRange || 0) * 64; 

            ctx.beginPath(); 
            ctx.fillStyle = v ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.2)';
            ctx.strokeStyle = v ? '#fff' : '#ef4444'; ctx.lineWidth = 1;
            
            ctx.arc(0, 0, rangePx, 0, Math.PI*2, false);
            if(minRangePx > 0) ctx.arc(0, 0, minRangePx, 0, Math.PI*2, true);
            
            ctx.fill(); 
            ctx.beginPath(); ctx.arc(0, 0, rangePx, 0, Math.PI*2); ctx.stroke();
            if(minRangePx > 0) { ctx.beginPath(); ctx.arc(0, 0, minRangePx, 0, Math.PI*2); ctx.stroke(); }

            ctx.globalAlpha = 0.7; ctx.fillStyle = t.color; ctx.fillRect(-20, -20, 40, 40);
            ctx.font = '32px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t.icon, 0, 2);
            ctx.restore();
        }

        if(gameState.interactionMode === 'UPGRADE' && gameState.selectedPlacedTower) {
            const t = gameState.selectedPlacedTower;
            const s = window.TowerUtils.getTowerStats(t);
            const minRangePx = (t.type.minRange || 0) * 64;

            ctx.save(); ctx.translate(t.x, t.y);
            ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
            ctx.arc(0, 0, s.range * CELL_SIZE, 0, Math.PI*2, false);
            if(minRangePx > 0) ctx.arc(0, 0, minRangePx, 0, Math.PI*2, true);
            ctx.fill(); 
            ctx.beginPath(); ctx.arc(0, 0, s.range * CELL_SIZE, 0, Math.PI*2); ctx.stroke();
            if(minRangePx > 0) { ctx.beginPath(); ctx.arc(0, 0, minRangePx, 0, Math.PI*2); ctx.stroke(); }
            ctx.restore();
        }
    }
    
    ctx.restore();
}

// Start Game
init();