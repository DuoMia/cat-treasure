// ===================== 玩具箱场景 — 华容道谜题 =====================
//
// 棋盘：4列 × 5行
// 目标：把「信」(2×2) 从顶部滑到底部出口（row=3, col=1）
//
// 初始布局（简化版，BFS验证15步可解）：
//   [0]: fish  letter letter bell
//   [1]: fish  letter letter bell
//   [2]: paw   hbar   hbar   ---
//   [3]: ---   ---    ---    ball
//   [4]: ---   ---    ---    ---
//
// 解法（15步）：
//   hbar↓, letter↓, hbar↓, letter↓,
//   fish→, bell←, hbar←, paw↑, ball↑, ball↑,
//   letter→, letter↓, hbar↑, hbar↑, letter←

import { gameState, saveGame } from '../state.js';
import { sceneManager } from '../scene-manager.js';
import { showDialog, updateInventory } from '../ui.js';
import { collectStickyNote, collectMemoryFragment } from '../notes.js';

const ROWS = 5, COLS = 4;

const INITIAL_BLOCKS = [
    { id:'letter', label:'📜', row:0, col:1, rs:2, cs:2, isLetter:true },
    { id:'fish',   label:'🐟', row:0, col:0, rs:2, cs:1 },
    { id:'bell',   label:'🔔', row:0, col:3, rs:2, cs:1 },
    { id:'hbar',   label:'🎀', row:2, col:1, rs:1, cs:2 },
    { id:'paw',    label:'🐾', row:2, col:0, rs:1, cs:1 },
    { id:'ball',   label:'⚽', row:3, col:3, rs:1, cs:1 },
];

// 胜利条件：letter 到达 row=3, col=1
const WIN_ROW = 3, WIN_COL = 1;

let blocks = [];
let grid = [];
let selectedId = null;
let moveCount = 0;

// ── 引擎 ──────────────────────────────────────────────────────────
function initPuzzle() {
    blocks = INITIAL_BLOCKS.map(b => ({ ...b }));
    rebuildGrid();
    selectedId = null;
    moveCount = 0;
}

function rebuildGrid() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    blocks.forEach(b => {
        for (let r = b.row; r < b.row + b.rs; r++)
            for (let c = b.col; c < b.col + b.cs; c++)
                if (r < ROWS && c < COLS) grid[r][c] = b.id;
    });
}

function canMove(b, dir) {
    if (dir === 'up') {
        if (b.row === 0) return false;
        for (let c = b.col; c < b.col + b.cs; c++)
            if (grid[b.row - 1][c] !== null) return false;
        return true;
    }
    if (dir === 'down') {
        if (b.row + b.rs >= ROWS) return false;
        for (let c = b.col; c < b.col + b.cs; c++)
            if (grid[b.row + b.rs][c] !== null) return false;
        return true;
    }
    if (dir === 'left') {
        if (b.col === 0) return false;
        for (let r = b.row; r < b.row + b.rs; r++)
            if (grid[r][b.col - 1] !== null) return false;
        return true;
    }
    if (dir === 'right') {
        if (b.col + b.cs >= COLS) return false;
        for (let r = b.row; r < b.row + b.rs; r++)
            if (grid[r][b.col + b.cs] !== null) return false;
        return true;
    }
    return false;
}

function doMove(b, dir) {
    if (!canMove(b, dir)) return false;
    if (dir === 'up')    b.row--;
    if (dir === 'down')  b.row++;
    if (dir === 'left')  b.col--;
    if (dir === 'right') b.col++;
    rebuildGrid();
    moveCount++;
    return true;
}

function checkWin() {
    const letter = blocks.find(b => b.id === 'letter');
    return letter && letter.row === WIN_ROW && letter.col === WIN_COL;
}

// ── 渲染 ──────────────────────────────────────────────────────────
function renderBoard() {
    const board = document.getElementById('klotski-board');
    if (!board) return;
    board.innerHTML = '';

    const bw = board.clientWidth || board.offsetWidth;
    const bh = board.clientHeight || board.offsetHeight;
    const cellW = bw / COLS;
    const cellH = bh / ROWS;

    // 出口指示（底部 col=1-2 之间）
    const exitMark = document.createElement('div');
    exitMark.className = 'klotski-exit-mark';
    exitMark.style.cssText = `left:${1 * cellW}px;top:${WIN_ROW * cellH}px;width:${2 * cellW}px;height:${cellH}px;`;
    board.appendChild(exitMark);

    blocks.forEach(b => {
        const el = document.createElement('div');
        el.className = 'klotski-block' + (b.isLetter ? ' klotski-letter' : '');
        if (b.id === selectedId) el.classList.add('klotski-selected');
        el.dataset.id = b.id;

        el.style.left   = (b.col * cellW + 3) + 'px';
        el.style.top    = (b.row * cellH + 3) + 'px';
        el.style.width  = (b.cs * cellW - 6) + 'px';
        el.style.height = (b.rs * cellH - 6) + 'px';

        el.innerHTML = `<span class="klotski-icon">${b.label}</span>`;

        // PC：点击选中 + 点击移动
        el.addEventListener('click', () => onBlockClick(b.id));

        // 移动端：手指滑动移动方块
        bindSwipe(el, b.id);

        board.appendChild(el);
    });

    const counter = document.getElementById('klotski-counter');
    if (counter) counter.textContent = `步数：${moveCount}`;
}

// ── 滑动手势 ──────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 8; // px，超过此距离才算滑动

function bindSwipe(el, id) {
    let tx0 = 0, ty0 = 0, swiped = false;

    el.addEventListener('touchstart', e => {
        e.stopPropagation();
        tx0 = e.touches[0].clientX;
        ty0 = e.touches[0].clientY;
        swiped = false;
        // 选中高亮
        if (selectedId !== id) {
            selectedId = id;
            renderBoard();
        }
    }, { passive: true });

    el.addEventListener('touchmove', e => {
        e.preventDefault();
        e.stopPropagation();
        if (swiped || gameState.flags.toyBoxSolved) return;
        const dx = e.touches[0].clientX - tx0;
        const dy = e.touches[0].clientY - ty0;
        if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

        const dir = Math.abs(dx) >= Math.abs(dy)
            ? (dx > 0 ? 'right' : 'left')
            : (dy > 0 ? 'down' : 'up');

        swiped = true;
        const b = blocks.find(b => b.id === id);
        if (b && doMove(b, dir)) {
            selectedId = null;
            renderBoard();
            if (checkWin()) onWin();
        }
    }, { passive: false });

    el.addEventListener('touchend', e => {
        e.stopPropagation();
        // 没有滑动 → 视为点击（取消选中）
        if (!swiped) {
            if (selectedId === id) {
                selectedId = null;
                renderBoard();
            }
        }
    }, { passive: true });
}

// ── 交互 ──────────────────────────────────────────────────────────
function onBlockClick(id) {
    if (gameState.flags.toyBoxSolved) return;

    if (selectedId === null) {
        selectedId = id;
        renderBoard();
        return;
    }
    if (selectedId === id) {
        selectedId = null;
        renderBoard();
        return;
    }

    // 尝试把选中块朝目标块方向移动一格
    const src = blocks.find(b => b.id === selectedId);
    const dst = blocks.find(b => b.id === id);
    if (!src || !dst) { selectedId = null; renderBoard(); return; }

    const dr = (dst.row + dst.rs / 2) - (src.row + src.rs / 2);
    const dc = (dst.col + dst.cs / 2) - (src.col + src.cs / 2);
    const dir = Math.abs(dr) >= Math.abs(dc)
        ? (dr > 0 ? 'down' : 'up')
        : (dc > 0 ? 'right' : 'left');

    if (doMove(src, dir)) {
        selectedId = null;
        renderBoard();
        if (checkWin()) onWin();
    } else {
        selectedId = id;
        renderBoard();
    }
}

// ── 胜利 ──────────────────────────────────────────────────────────
function onWin() {
    gameState.flags.toyBoxSolved = true;
    saveGame();

    const board = document.getElementById('klotski-board');
    const letterEl = board?.querySelector('.klotski-letter');
    if (letterEl) {
        letterEl.style.transition = 'top 0.5s ease, opacity 0.4s ease 0.2s';
        letterEl.style.top = '105%';
        letterEl.style.opacity = '0';
    }

    setTimeout(() => {
        showDialog(`咔哒——信从玩具箱里滑了出来！\n\n信纸上印满了小小的爪印……（共 ${moveCount} 步）`, () => {
            gameState.flags.hasCatLetter = true;
            gameState.inventory.push('朵朵的信');
            saveGame();
            updateInventory();
            showDialog('你获得了朵朵的信。\n\n爪印排列成文字：\n\n"喵——\n\n你找到这里了。我知道你会来的。\n\n主人把最重要的东西藏在了时钟里，那是我们在一起的每一天。\n\n猫咪神藏，不是宝贝，是时光。\n\n——朵朵 🐾"', () => {
                collectStickyNote('note5');
                showDialog('你握着这封信，眼眶有些湿润。\n\n时钟……一切线索都指向那里。', () => {
                    collectMemoryFragment(3);
                });
            });
        });
    }, 700);
}

// ── 场景入口 ──────────────────────────────────────────────────────
export function openToyBoxScene() {
    sceneManager.open('toy-box-scene', () => {
        gameState.flags.toyBoxSeen = true;
        saveGame();

        const scene = document.getElementById('toy-box-scene');

        // 阳台线索纸条
        if (!gameState.flags.balconyClue2 && !scene.querySelector('#balcony-note-b')) {
            const noteB = document.createElement('div');
            noteB.id = 'balcony-note-b';
            noteB.style.cssText = 'position:absolute;left:4%;bottom:8%;width:6%;height:8%;cursor:pointer;z-index:220;font-size:20px;display:flex;align-items:center;justify-content:center;';
            noteB.textContent = '📄';
            noteB.addEventListener('click', () => {
                gameState.flags.balconyClue2 = true;
                saveGame();
                noteB.remove();
                showDialog('你在玩具箱底部发现了一张夹着的纸条。\n\n"下午三点，她会挪到阳台右边，把脸埋进那盆绿植里，等影子爬过来。"', () => {
                    showDialog('下午三点……影子……\n\n你想起了墙上的那个时钟。');
                });
            });
            scene.appendChild(noteB);
        }

        if (!scene.querySelector('#klotski-wrapper')) {
            buildBoardDOM(scene);
        }

        if (gameState.flags.toyBoxSolved) {
            showDialog('玩具箱已经打开了，信已经取出来了。');
            return;
        }

        initPuzzle();
        requestAnimationFrame(() => renderBoard());

        showDialog('玩具箱里有一封信，被玩具压住了。\n\n选中一个方块，再点击旁边的方块来决定移动方向，把信从底部出口滑出来。');
    });
}

function buildBoardDOM(scene) {
    const wrapper = document.createElement('div');
    wrapper.id = 'klotski-wrapper';

    const header = document.createElement('div');
    header.id = 'klotski-header';
    header.innerHTML = '<span class="klotski-title">把信从出口滑出</span><span id="klotski-counter">步数：0</span>';
    wrapper.appendChild(header);

    const board = document.createElement('div');
    board.id = 'klotski-board';
    wrapper.appendChild(board);

    const footer = document.createElement('div');
    footer.id = 'klotski-footer';
    footer.innerHTML = '<button id="klotski-reset" title="重置">↺ 重置</button>';
    const resetBtn = footer.querySelector('#klotski-reset');
    const resetHandler = () => { initPuzzle(); requestAnimationFrame(() => renderBoard()); };
    resetBtn.addEventListener('click', resetHandler);
    resetBtn.addEventListener('touchend', e => { e.preventDefault(); resetHandler(); }, { passive: false });

    wrapper.appendChild(footer);
    scene.appendChild(wrapper);

    // 横竖屏切换时重新渲染方块位置
    const onResize = () => {
        if (!document.getElementById('toy-box-scene')?.classList.contains('hidden')) {
            requestAnimationFrame(() => renderBoard());
        }
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', () => setTimeout(onResize, 300));
}

export function closeToyBoxScene() {
    sceneManager.closeToRoom();
}
