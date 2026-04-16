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
import { collectStickyNote, collectMemoryFragment, createStickyNoteEl } from '../notes.js';
import { PUZZLES } from '../data.js';
import { imgCoordsToContainer, parsePct } from '../scene-hotspot.js';
import { showPickupToast } from '../utils.js';

const TOY_LOCK_ORDER = PUZZLES.toyLockOrder;

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
// 缓存格子尺寸，供手势模块复用
let _cellW = 0, _cellH = 0;

function renderBoard() {
    const board = document.getElementById('klotski-board');
    if (!board) return;
    board.innerHTML = '';

    const bw = board.clientWidth || board.offsetWidth;
    const bh = board.clientHeight || board.offsetHeight;
    _cellW = bw / COLS;
    _cellH = bh / ROWS;

    // 出口指示：贴在棋盘底边外侧
    const wrapper = board.closest('#klotski-wrapper');
    let exitMark = wrapper?.querySelector('.klotski-exit-mark');
    if (!exitMark && wrapper) {
        exitMark = document.createElement('div');
        exitMark.className = 'klotski-exit-mark';
        wrapper.appendChild(exitMark);
    }
    if (exitMark) {
        // 计算出口在 wrapper 坐标系中的位置
        const boardOffsetLeft = board.offsetLeft;
        const boardOffsetTop  = board.offsetTop;
        const exitLeft = boardOffsetLeft + WIN_COL * _cellW;
        const exitWidth = 2 * _cellW;
        const exitTop = boardOffsetTop + board.offsetHeight;
        exitMark.style.cssText = `left:${exitLeft}px;top:${exitTop}px;width:${exitWidth}px;`;
    }
    // 棋盘底边缺口遮罩（盖住边框线，制造开口效果）
    let gapMask = board.querySelector('.klotski-gap-mask');
    if (!gapMask) {
        gapMask = document.createElement('div');
        gapMask.className = 'klotski-gap-mask';
        board.appendChild(gapMask);
    }
    gapMask.style.cssText = `left:${WIN_COL * _cellW + 1}px;width:${2 * _cellW - 2}px;`;

    blocks.forEach(b => {
        const el = document.createElement('div');
        el.className = 'klotski-block' + (b.isLetter ? ' klotski-letter' : '');
        if (b.id === selectedId) el.classList.add('klotski-selected');
        el.dataset.id = b.id;
        el.style.left   = (b.col * _cellW + 3) + 'px';
        el.style.top    = (b.row * _cellH + 3) + 'px';
        el.style.width  = (b.cs * _cellW - 6) + 'px';
        el.style.height = (b.rs * _cellH - 6) + 'px';
        el.innerHTML = `<span class="klotski-icon">${b.label}</span>`;
        // PC 点击
        el.addEventListener('click', () => onBlockClick(b.id));
        board.appendChild(el);
    });

    const counter = document.getElementById('klotski-counter');
    if (counter) counter.textContent = `步数：${moveCount}`;
}

// 只更新方块位置和选中态，不重建 DOM
function updateBlockEl(b) {
    const el = document.querySelector(`#klotski-board .klotski-block[data-id="${b.id}"]`);
    if (!el) return;
    el.style.left   = (b.col * _cellW + 3) + 'px';
    el.style.top    = (b.row * _cellH + 3) + 'px';
    el.classList.toggle('klotski-selected', b.id === selectedId);
}

function updateCounter() {
    const counter = document.getElementById('klotski-counter');
    if (counter) counter.textContent = `步数：${moveCount}`;
}

// ── 手势（挂在 board 上，跟手拖动 + 超半格 snap）─────────────────
function bindBoardSwipe(board) {
    let activeId = null;
    let activeEl = null;
    let tx0 = 0, ty0 = 0;
    let axis = null;
    let moved = false;

    // ── 公共逻辑（touch 和 mouse 共用）────────────────────────────
    function onDragStart(clientX, clientY, blockEl) {
        const id = blockEl?.dataset.id;
        if (!id) { activeId = null; activeEl = null; return; }
        activeId = id;
        activeEl = blockEl;
        tx0 = clientX;
        ty0 = clientY;
        axis = null;
        moved = false;
        const prev = selectedId;
        selectedId = id;
        if (prev !== id) {
            if (prev) updateBlockEl(blocks.find(b => b.id === prev));
            updateBlockEl(blocks.find(b => b.id === id));
        }
        activeEl.style.transition = 'none';
    }

    function onDragMove(clientX, clientY) {
        if (!activeId || !activeEl || gameState.flags.toyBoxSolved) return;
        const rawDx = clientX - tx0;
        const rawDy = clientY - ty0;
        if (!axis) {
            if (Math.abs(rawDx) < 4 && Math.abs(rawDy) < 4) return;
            axis = Math.abs(rawDx) >= Math.abs(rawDy) ? 'h' : 'v';
        }
        const b = blocks.find(b => b.id === activeId);
        if (!b) return;
        let offset = axis === 'h' ? rawDx : rawDy;
        const cellSize = axis === 'h' ? _cellW : _cellH;
        const maxForward  = countFree(b, axis === 'h' ? 'right' : 'down');
        const maxBackward = countFree(b, axis === 'h' ? 'left'  : 'up');
        offset = Math.max(-maxBackward * cellSize, Math.min(maxForward * cellSize, offset));
        const baseLeft = b.col * _cellW + 3;
        const baseTop  = b.row * _cellH + 3;
        if (axis === 'h') activeEl.style.left = (baseLeft + offset) + 'px';
        else              activeEl.style.top  = (baseTop  + offset) + 'px';
        moved = true;
        const steps = offset / cellSize;
        if (Math.abs(steps) >= 0.5) {
            const dir = axis === 'h' ? (steps > 0 ? 'right' : 'left') : (steps > 0 ? 'down' : 'up');
            if (doMove(b, dir)) {
                tx0 = clientX;
                ty0 = clientY;
                activeEl.style.transition = 'none';
                activeEl.style.left = (b.col * _cellW + 3) + 'px';
                activeEl.style.top  = (b.row * _cellH + 3) + 'px';
                selectedId = null;
                updateBlockEl(b);
                updateCounter();
                if (checkWin()) { activeId = null; activeEl = null; onWin(); }
            }
        }
    }

    function onDragEnd() {
        if (activeEl) {
            activeEl.style.transition = '';
            const b = blocks.find(b => b.id === activeId);
            if (b) {
                activeEl.style.left = (b.col * _cellW + 3) + 'px';
                activeEl.style.top  = (b.row * _cellH + 3) + 'px';
            }
        }
        if (!moved && activeId) {
            if (selectedId === activeId) {
                selectedId = null;
                if (activeEl) updateBlockEl(blocks.find(b => b.id === activeId));
            }
        }
        activeId = null;
        activeEl = null;
        axis = null;
    }

    // ── Touch ──────────────────────────────────────────────────────
    board.addEventListener('touchstart', e => {
        if (gameState.flags.toyBoxSolved) return;
        e.stopPropagation();
        const t = e.touches[0];
        const target = document.elementFromPoint(t.clientX, t.clientY);
        onDragStart(t.clientX, t.clientY, target?.closest('.klotski-block'));
    }, { passive: true });

    board.addEventListener('touchmove', e => {
        e.preventDefault();
        e.stopPropagation();
        onDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    board.addEventListener('touchend', e => {
        e.stopPropagation();
        onDragEnd();
    }, { passive: true });

    // ── Mouse ──────────────────────────────────────────────────────
    board.addEventListener('mousedown', e => {
        if (gameState.flags.toyBoxSolved) return;
        e.preventDefault();
        const blockEl = e.target.closest('.klotski-block');
        onDragStart(e.clientX, e.clientY, blockEl);
    });

    window.addEventListener('mousemove', e => {
        if (!activeId) return;
        onDragMove(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
        if (!activeId) return;
        onDragEnd();
    });
}

// 计算某方块在某方向上连续空格数
function countFree(b, dir) {
    let count = 0;
    if (dir === 'right') {
        for (let c = b.col + b.cs; c < COLS; c++) {
            if (b.row < ROWS && grid[b.row][c] !== null) break;
            // 检查整列
            let ok = true;
            for (let r = b.row; r < b.row + b.rs; r++) if (grid[r][c] !== null) { ok = false; break; }
            if (!ok) break;
            count++;
        }
    } else if (dir === 'left') {
        for (let c = b.col - 1; c >= 0; c--) {
            let ok = true;
            for (let r = b.row; r < b.row + b.rs; r++) if (grid[r][c] !== null) { ok = false; break; }
            if (!ok) break;
            count++;
        }
    } else if (dir === 'down') {
        for (let r = b.row + b.rs; r < ROWS; r++) {
            let ok = true;
            for (let c = b.col; c < b.col + b.cs; c++) if (grid[r][c] !== null) { ok = false; break; }
            if (!ok) break;
            count++;
        }
    } else if (dir === 'up') {
        for (let r = b.row - 1; r >= 0; r--) {
            let ok = true;
            for (let c = b.col; c < b.col + b.cs; c++) if (grid[r][c] !== null) { ok = false; break; }
            if (!ok) break;
            count++;
        }
    }
    return count;
}

// ── 交互（PC 点击）────────────────────────────────────────────────
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
            showPickupToast('✓ 获得朵朵的信');
            showDialog('你获得了朵朵的信。\n\n爪印排列成文字：\n\n"喵——\n\n你找到这里了。我知道你会来的。\n\n每天下午三点，我会跑到阳台，把玩具推到绿植旁边，等那道橙色的光把影子拉得很长很长。\n\n那是我最喜欢的时候。主人总是站在门口看着我，不说话。\n\n我把宝贝埋在了影子的尽头，去那里看看吧。\n\n——朵朵 🐾"', () => {
                if (!gameState.flags.balconyClue2) {
                    gameState.flags.balconyClue2 = true;
                    saveGame();
                }
                // 在玩具箱场景生成可点击便利贴
                const scene = document.getElementById('toy-box-scene');
                if (!gameState.flags.stickyNotes.includes('note5') && scene && !scene.querySelector('#sticky-note5')) {
                    const note = createStickyNoteEl('note5', 'position:absolute;right:6%;top:12%;font-size:28px;z-index:220;', () => collectStickyNote('note5'));
                    note.id = 'sticky-note5';
                    scene.appendChild(note);
                }
                collectMemoryFragment(3);
            });
        });
    }, 700);
}

// ── 图案锁谜题 ────────────────────────────────────────────────────
// 热区坐标（占位，调试模式下可见，按需调整）
const TOY_LOCK_ZONES = [
    { id: 'fish', left: '34.8%', top: '58.6%', width: '5.6%', height: '7.5%' },
    { id: 'paw',  left: '43%', top: '58.6%', width: '5.6%', height: '7.5%' },
    { id: 'bell', left: '51.5%', top: '58.6%', width: '5.6%', height: '7.5%' },
    { id: 'ball', left: '59.8%', top: '58.6%', width: '5.6%', height: '7.5%' },
];

function setupToyLock(scene, onUnlock) {
    scene.querySelectorAll('.toy-lock-zone').forEach(el => el.remove());

    let step = 0;

    TOY_LOCK_ZONES.forEach(z => {
        const zone = document.createElement('div');
        zone.className = 'toy-lock-zone';
        zone.dataset.id = z.id;

        const pos = imgCoordsToContainer(scene, 1200, 800, parsePct(z.left), parsePct(z.top), parsePct(z.width), parsePct(z.height));
        zone.style.cssText = `position:absolute;left:${pos.left};top:${pos.top};width:${pos.width};height:${pos.height};cursor:pointer;border-radius:8px;`;

        const handleTap = (e) => {
            e.preventDefault();
            if (z.id === TOY_LOCK_ORDER[step]) {
                zone.classList.add('toy-lock-zone-correct');
                step++;
                if (step >= TOY_LOCK_ORDER.length) {
                    setTimeout(() => {
                        scene.querySelectorAll('.toy-lock-zone').forEach(el => el.remove());
                        onUnlock();
                    }, 500);
                }
            } else {
                step = 0;
                scene.querySelectorAll('.toy-lock-zone').forEach(el => el.classList.remove('toy-lock-zone-correct'));
                showDialog('顺序不对，再想想……');
            }
        };
        zone.addEventListener('click', handleTap);
        zone.addEventListener('touchend', handleTap, { passive: false });

        scene.appendChild(zone);
    });
}

// ── 场景入口 ──────────────────────────────────────────────────────
export function openToyBoxScene() {
    sceneManager.open('toy-box-scene', () => {
        gameState.flags.toyBoxSeen = true;
        saveGame();

        const scene = document.getElementById('toy-box-scene');

        if (gameState.flags.toyBoxSolved) {
            scene.querySelector('#klotski-wrapper')?.remove();
            if (!gameState.flags.stickyNotes.includes('note5') && !scene.querySelector('#sticky-note5')) {
                const note = createStickyNoteEl('note5', 'position:absolute;right:6%;top:12%;font-size:28px;z-index:220;', () => collectStickyNote('note5'));
                note.id = 'sticky-note5';
                scene.appendChild(note);
            }
            return;
        }

        if (!gameState.flags.toyLockSolved) {
            setupToyLock(scene, () => {
                gameState.flags.toyLockSolved = true;
                saveGame();
                if (!scene.querySelector('#klotski-wrapper')) buildBoardDOM(scene);
                initPuzzle();
                requestAnimationFrame(() => renderBoard());
                showDialog('咔哒——图案锁弹开了！\n\n箱子里好像有封信，被玩具压住了，要不把它拿出来看看？\n\n合理移动方块，把信从底部出口滑出来。');
            });
            return;
        }

        // 便利贴未收集时重新显示（图案锁已解但华容道未解的状态）
        if (!gameState.flags.stickyNotes.includes('note5') && !scene.querySelector('#sticky-note5')) {
            const note = createStickyNoteEl('note5', 'position:absolute;right:6%;top:12%;font-size:28px;z-index:220;', () => collectStickyNote('note5'));
            note.id = 'sticky-note5';
            scene.appendChild(note);
        }
        if (!scene.querySelector('#klotski-wrapper')) buildBoardDOM(scene);
        initPuzzle();
        requestAnimationFrame(() => renderBoard());
        showDialog('箱子里好像有封信，被玩具压住了，要不把它拿出来看看？\n\n合理移动方块，把信从底部出口滑出来。');
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
    bindBoardSwipe(board);
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
    const onOrientationChange = () => setTimeout(onResize, 300);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onOrientationChange);
    // 保存引用供 close 时清理
    scene._toyBoxResizeCleanup = () => {
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onOrientationChange);
    };
}

export function closeToyBoxScene() {
    const scene = document.getElementById('toy-box-scene');
    if (scene?._toyBoxResizeCleanup) { scene._toyBoxResizeCleanup(); scene._toyBoxResizeCleanup = null; }
    sceneManager.closeToRoom();
}
