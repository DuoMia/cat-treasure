// ===================== 游戏状态 + 存档系统 =====================

const INITIAL_FLAGS = {
    foundCat: false,
    wasBitten: false,
    foundBump: false,
    hasBox: false,
    solvedPassword: false,
    lookedAtClock: false,
    exploringAfterBite: false,
    exploreClickCount: 0,
    shownSofaCornerHint: false,
    lookAroundCount: 0,
    hasNote: false,
    hasDiary: false,
    drawerOpened: false,
    shownDrawerLockHint: false,
    memoryFragments: [],
    photoWallSeen: false,
    sofaScratchSeen: false,
    toyCountSeen: false,
    bookshelfSeen: false,
    bookPuzzleSolved: false,
    bookPuzzleStep: 0,
    hasCollar: false,
    musicBoxSolved: false,
    musicBoxStep: 0,
    foodBowlSeen: false,
    paintingPuzzleSolved: false,
    paintingStep: 0,
    hasOwnerLetter: false,
    hasBowl: false,
    bowlZone: 0,
    paintingSymbolsFound: [],
    toyBoxSeen: false,
    toyLockSolved: false,
    toyBoxSolved: false,
    toyBoxStep: 0,
    hasCatLetter: false,
    balconySeen: false,
    hasLetter: false,
    clockTime: null,
    balconyClue1: false,
    balconyClue2: false,
    balconyBrickStep: 0,
    balconyBrickSolved: false,
    stickyNotes: [],
    albumUnlocked: false
};

export const gameState = {
    inventory: [],
    debugMode: false,
    searchCount: 0,
    penFallen: false,
    clickedObjects: new Set(),
    flags: { ...INITIAL_FLAGS, memoryFragments: [], paintingSymbolsFound: [], stickyNotes: [] }
};

// ===================== 存档系统 =====================

const SAVE_KEY = 'catTreasure_save';

let _saveTimer = null;

export function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}

export function saveGame() {
    if (_saveTimer) return;
    _saveTimer = setTimeout(() => {
        _saveTimer = null;
        _doSave();
    }, 500);
}

function _doSave() {
    try {
        const data = {
            ...gameState,
            clickedObjects: [...gameState.clickedObjects],
            flags: {
                ...gameState.flags,
                memoryFragments: [...gameState.flags.memoryFragments],
                paintingSymbolsFound: [...gameState.flags.paintingSymbolsFound],
                stickyNotes: [...gameState.flags.stickyNotes]
            }
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('存档失败:', e);
    }
}

export function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        gameState.inventory = data.inventory || [];
        gameState.searchCount = data.searchCount || 0;
        gameState.penFallen = data.penFallen || false;
        gameState.clickedObjects = new Set(data.clickedObjects || []);
        gameState.debugMode = data.debugMode || false;
        gameState.flags = { ...gameState.flags, ...data.flags };
        if (!Array.isArray(gameState.flags.memoryFragments)) gameState.flags.memoryFragments = [];
        if (!Array.isArray(gameState.flags.paintingSymbolsFound)) gameState.flags.paintingSymbolsFound = [];
        if (!Array.isArray(gameState.flags.stickyNotes)) gameState.flags.stickyNotes = [];
        return true;
    } catch (e) {
        console.warn('读档失败:', e);
        return false;
    }
}

export function deleteSave() {
    if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (e) {
        console.warn('删除存档失败:', e);
    }
}

/** 重置 gameState 到初始值 */
export function resetGameState() {
    gameState.inventory = [];
    gameState.searchCount = 0;
    gameState.penFallen = false;
    gameState.clickedObjects = new Set();
    gameState.flags = { ...INITIAL_FLAGS, memoryFragments: [], paintingSymbolsFound: [], stickyNotes: [] };
}
