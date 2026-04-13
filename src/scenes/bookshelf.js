// ===================== 书架场景（含音乐盒谜题） =====================

import { gameState, saveGame } from '../state.js';
import { sceneManager } from '../scene-manager.js';
import { showDialog, updateInventory } from '../ui.js';
import { collectStickyNote, collectMemoryFragment } from '../notes.js';
import { PUZZLES, MUSIC_BOX_PHASES } from '../data.js';
import { lockPortraitDrag, unlockPortraitDrag } from '../utils.js';

/** 竖屏时将视口水平对准目标百分比位置 */
function scrollToX(pct) {
    const vh = window.visualViewport?.height ?? window.innerHeight;
    if (window.innerWidth >= vh) return; // 横屏/PC 不处理
    const container = document.getElementById('game-container');
    const containerW = vh * 14 / 9;
    const screenW = window.innerWidth;
    // 目标点在容器内的像素位置，减去半屏宽使其居中
    const targetLeft = -(containerW * pct - screenW / 2);
    const minLeft = -(containerW - screenW);
    container.style.left = Math.min(0, Math.max(minLeft, targetLeft)) + 'px';
}

// ── 书脊拼图 ────────────────────────────────────────────────
// cat.jpg (960×1280) 取中间 4:3 横向区域 (960×720, y从280开始)
// 缩放到 260×200 后纵向分5份，每份宽52px
// background-size: 260px 200px
// background-position-y: -76px (对应原图 y=280 的缩放偏移)
// 正确顺序：seg1(最左) → seg5(最右)
const JIGSAW_SEGMENTS = [
    { id: 'seg1', bgX:   0 },
    { id: 'seg2', bgX:  52 },
    { id: 'seg3', bgX: 104 },
    { id: 'seg4', bgX: 156 },
    { id: 'seg5', bgX: 208 },
];

const CORRECT_ORDER = ['seg1', 'seg2', 'seg3', 'seg4', 'seg5'];

let dragSrcId = null;
let jigsawSlots = [null, null, null, null, null];

// 鼠标拖拽状态
let mouseDragSeg = null;
let mouseDragClone = null;

function startMouseDrag(seg, clientX, clientY) {
    mouseDragSeg = seg;
    dragSrcId = seg.id;
    mouseDragClone = document.createElement('div');
    mouseDragClone.className = 'jigsaw-piece jigsaw-drag-clone';
    mouseDragClone.style.cssText = `
        background-image: url('cat.jpg');
        background-size: 260px 200px;
        background-position: -${seg.bgX}px -76px;
        background-repeat: no-repeat;
        position: fixed; z-index: 9999; pointer-events: none;
        width: 52px; height: 200px;
        opacity: 0.85; cursor: grabbing;
        transform: rotate(-2deg) scale(1.05);
        box-shadow: 4px 8px 24px rgba(0,0,0,0.7);
        left: ${clientX - 26}px; top: ${clientY - 100}px;
    `;
    document.body.appendChild(mouseDragClone);
}

function onMouseMove(e) {
    if (!mouseDragClone) return;
    mouseDragClone.style.left = `${e.clientX - 26}px`;
    mouseDragClone.style.top = `${e.clientY - 100}px`;
    // 高亮悬停的 slot
    document.querySelectorAll('.jigsaw-slot').forEach(s => s.classList.remove('drag-over'));
    const el = document.elementFromPoint(e.clientX, e.clientY);
    el?.closest('.jigsaw-slot')?.classList.add('drag-over');
}

function onMouseUp(e) {
    if (!mouseDragClone) return;
    mouseDragClone.remove();
    mouseDragClone = null;
    document.querySelectorAll('.jigsaw-slot').forEach(s => s.classList.remove('drag-over'));
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const slot = el?.closest('.jigsaw-slot');
    if (slot) {
        handleDropOnSlot(slot);
    } else if (el?.closest('.jigsaw-tray')) {
        // 拖回托盘
        const srcSlotIdx = jigsawSlots.indexOf(dragSrcId);
        if (srcSlotIdx >= 0) {
            jigsawSlots[srcSlotIdx] = null;
            renderJigsawSlots();
        }
        dragSrcId = null;
    } else {
        dragSrcId = null;
    }
    mouseDragSeg = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
}

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function makePieceEl(seg) {
    const el = document.createElement('div');
    el.className = 'jigsaw-piece';
    el.dataset.segId = seg.id;
    el.style.cssText = `
        background-image: url('cat.jpg');
        background-size: 260px 200px;
        background-position: -${seg.bgX}px -76px;
        background-repeat: no-repeat;
    `;

    // 鼠标拖拽由 scene 层事件委托处理（见 setupBookPuzzleHotspots）

    // 触摸拖拽（移动端）
    let touchClone;
    el.addEventListener('touchstart', e => {
        lockPortraitDrag();
        dragSrcId = seg.id;
        const t = e.touches[0];
        touchClone = el.cloneNode(true);
        touchClone.style.cssText += `
            position:fixed;opacity:0.85;pointer-events:none;z-index:9999;
            width:52px;height:200px;left:${t.clientX - 26}px;top:${t.clientY - 100}px;
            transform:rotate(-4deg) scale(1.05);
            box-shadow:4px 8px 24px rgba(0,0,0,0.7);border-radius:2px;`;
        document.body.appendChild(touchClone);
        el.style.opacity = '0.3';
        e.preventDefault();
    }, { passive: false });
    el.addEventListener('touchmove', e => {
        const t = e.touches[0];
        if (touchClone) {
            touchClone.style.left = `${t.clientX - 26}px`;
            touchClone.style.top = `${t.clientY - 100}px`;
        }
        e.preventDefault();
    }, { passive: false });
    el.addEventListener('touchend', e => {
        unlockPortraitDrag();
        if (touchClone) { touchClone.remove(); touchClone = null; }
        el.style.opacity = '';
        const t = e.changedTouches[0];
        const target = document.elementFromPoint(t.clientX, t.clientY);
        const slot = target?.closest('.jigsaw-slot');
        if (slot) handleDropOnSlot(slot);
        e.preventDefault();
    }, { passive: false });

    return el;
}

function makeSlotEl(idx) {
    const el = document.createElement('div');
    el.className = 'jigsaw-slot';
    el.dataset.slotIdx = idx;
    el.dataset.num = idx + 1;
    return el;
}

function handleDropOnSlot(slotEl) {
    if (!dragSrcId) return;
    const slotIdx = parseInt(slotEl.dataset.slotIdx);
    const srcSlotIdx = jigsawSlots.indexOf(dragSrcId);
    const displaced = jigsawSlots[slotIdx];
    jigsawSlots[slotIdx] = dragSrcId;
    if (srcSlotIdx >= 0) jigsawSlots[srcSlotIdx] = displaced;
    dragSrcId = null;
    renderJigsawSlots();
    checkJigsawSolution();
}

function renderJigsawSlots() {
    const scene = document.getElementById('bookshelf-scene');
    scene.querySelectorAll('.jigsaw-slot').forEach((slotEl, idx) => {
        slotEl.innerHTML = '';
        const segId = jigsawSlots[idx];
        if (segId) {
            const seg = JIGSAW_SEGMENTS.find(s => s.id === segId);
            if (seg) slotEl.appendChild(makePieceEl(seg));
        }
        slotEl.classList.toggle('filled', !!segId);
        slotEl.classList.toggle('correct', segId === CORRECT_ORDER[idx]);
    });
    const trayEl = scene.querySelector('.jigsaw-tray');
    if (trayEl) {
        trayEl.innerHTML = '';
        JIGSAW_SEGMENTS.forEach(seg => {
            if (!jigsawSlots.includes(seg.id)) trayEl.appendChild(makePieceEl(seg));
        });
    }
}

function checkJigsawSolution() {
    if (!CORRECT_ORDER.every((id, i) => jigsawSlots[i] === id)) return;

    const scene = document.getElementById('bookshelf-scene');
    // 闪烁动画
    scene.querySelectorAll('.jigsaw-slot').forEach(s => s.classList.add('solving'));

    setTimeout(() => {
        scene.querySelectorAll('.jigsaw-overlay, .jigsaw-slots, .jigsaw-tray, .jigsaw-label').forEach(el => {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.6s';
        });

        setTimeout(() => {
            gameState.flags.bookPuzzleSolved = true;
            saveGame();
            showDialog('咔哒——书架背板弹开了一个小格子！\n\n格子里静静躺着一条猫咪项圈，项圈上刻着"朵朵"，旁边还有一行小字：2021.08.29。\n\n项圈旁边，还有一个小小的音乐盒。', () => {
                if (!gameState.inventory.includes('项圈')) {
                    gameState.flags.hasCollar = true;
                    gameState.inventory.push('项圈');
                    saveGame();
                    updateInventory();
                    const sceneEl = document.getElementById('bookshelf-scene');
                    if (sceneEl) { const t = document.createElement('div'); t.className = 'pickup-toast'; t.textContent = '✓ 获得项圈'; sceneEl.appendChild(t); setTimeout(() => t.remove(), 1300); }
                }
                showDialog('你获得了朵朵的项圈。\n\n2021.08.29……那是朵朵来家的日子。', () => {
                    // 在书架场景生成可点击便利贴
                    if (!gameState.flags.stickyNotes.includes('note4') && !scene.querySelector('#sticky-note4')) {
                        const note = document.createElement('div');
                        note.id = 'sticky-note4';
                        note.textContent = '📝';
                        note.style.cssText = 'position:absolute;left:6%;top:12%;font-size:28px;cursor:pointer;z-index:210;';
                        note.addEventListener('click', () => { note.remove(); collectStickyNote('note4'); });
                        scene.appendChild(note);
                    }
                    scene.querySelectorAll('.jigsaw-overlay, .jigsaw-slots, .jigsaw-tray, .jigsaw-label').forEach(el => el.remove());
                    document.getElementById('bookshelf-puzzle-ui').classList.add('hidden');
                    simonRound = 0;
                    simonLitButtons = 0;
                    simonPlaying = false;
                    collectMemoryFragment(0, () => {
                        showDialog('音乐盒上有三个按钮，各代表一个音阶。\n\n它会先播放一段旋律，你来复现——主人常哼给朵朵听的那几个音。', () => {
                            setupMusicBoxHotspots();
                            startSimonRound();
                        });
                    });
                });
            });
        }, 700);
    }, 200);
}

function setupBookPuzzleHotspots() {
    const scene = document.getElementById('bookshelf-scene');
    scene.querySelectorAll('.jigsaw-overlay, .jigsaw-slots, .jigsaw-tray, .jigsaw-label').forEach(el => el.remove());
    jigsawSlots = [null, null, null, null, null];

    // 遮罩层（遮住音乐盒按钮）
    const overlay = document.createElement('div');
    overlay.className = 'jigsaw-overlay';
    scene.appendChild(overlay);

    // 标题
    const label = document.createElement('div');
    label.className = 'jigsaw-label';
    label.textContent = '将书脊图案拼成朵朵的样子';
    scene.appendChild(label);

    // 目标槽位行
    const slotsContainer = document.createElement('div');
    slotsContainer.className = 'jigsaw-slots';
    for (let i = 0; i < 5; i++) slotsContainer.appendChild(makeSlotEl(i));
    scene.appendChild(slotsContainer);

    // 散件托盘
    const tray = document.createElement('div');
    tray.className = 'jigsaw-tray';
    shuffleArray(JIGSAW_SEGMENTS).forEach(seg => tray.appendChild(makePieceEl(seg)));
    scene.appendChild(tray);

    // 事件委托：在 scene 层用 capture 捕获 mousedown，确保不被子元素覆盖拦截
    if (scene._jigsawMouseDown) {
        scene.removeEventListener('mousedown', scene._jigsawMouseDown, true);
    }
    scene._jigsawMouseDown = (e) => {
        if (e.button !== 0) return;
        const piece = e.target.closest('.jigsaw-piece');
        if (!piece) return;
        const segId = piece.dataset.segId;
        const seg = JIGSAW_SEGMENTS.find(s => s.id === segId);
        if (!seg) return;
        e.preventDefault();
        e.stopPropagation();
        startMouseDrag(seg, e.clientX, e.clientY);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
    scene.addEventListener('mousedown', scene._jigsawMouseDown, true);

    // 临时调试：document 级别捕获所有 mousedown
    document._jigsawDebug = (e) => {
        console.log('[jigsaw-debug] mousedown target:', e.target, 'classes:', e.target.className, 'coords:', e.clientX, e.clientY);
    };
    document.addEventListener('mousedown', document._jigsawDebug, true);

    const hint = document.getElementById('book-puzzle-hint');
    if (hint) hint.textContent = '拖拽书脊图案，拼出朵朵走路的样子';
}

// ── Simon Says 音乐盒 ──────────────────────────────────────────
const NOTE_FREQS = { A: 330, B: 440, C: 550 };
const ROUND_LENGTHS = [2, 3, 4];

let simonSequence = [];
let simonRound = 0;
let simonPlayerIdx = 0;
let simonPlaying = false;
let simonLitButtons = 0;

// ── 音频：离线渲染为 Blob URL，用 <audio> 元素播放（绕过 iOS 静音开关）──
const _noteBlobs = {};
let _blobsReady = false;

function renderNoteToBlob(freq, duration = 0.5) {
    const sampleRate = 44100;
    const length = Math.ceil(sampleRate * duration);
    const offCtx = new OfflineAudioContext(1, length, sampleRate);
    const osc = offCtx.createOscillator();
    const gain = offCtx.createGain();
    osc.connect(gain);
    gain.connect(offCtx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(1.0, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, duration);
    osc.start(0);
    osc.stop(duration);
    return offCtx.startRendering().then(buf => {
        const numSamples = buf.length;
        const arrayBuf = new ArrayBuffer(44 + numSamples * 2);
        const view = new DataView(arrayBuf);
        const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
        writeStr(0, 'RIFF');
        view.setUint32(4, 36 + numSamples * 2, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeStr(36, 'data');
        view.setUint32(40, numSamples * 2, true);
        const samples = buf.getChannelData(0);
        for (let i = 0; i < numSamples; i++) {
            view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true);
        }
        return URL.createObjectURL(new Blob([arrayBuf], { type: 'audio/wav' }));
    });
}

async function initNoteBlobs() {
    if (_blobsReady) return;
    try {
        await Promise.all(Object.entries(NOTE_FREQS).map(async ([key, freq]) => {
            _noteBlobs[key] = await renderNoteToBlob(freq, 0.5);
        }));
        _blobsReady = true;
    } catch (e) {
        console.warn('Note blob init failed:', e);
    }
}

document.addEventListener('touchstart', initNoteBlobs, { capture: true, once: true, passive: true });
document.addEventListener('click',      initNoteBlobs, { capture: true, once: true, passive: true });

function generateSequence(length) {
    const keys = ['A', 'B', 'C'];
    const seq = [];
    for (let i = 0; i < length; i++) seq.push(keys[Math.floor(Math.random() * 3)]);
    return seq;
}

function playNote(key) {
    if (_blobsReady && _noteBlobs[key]) {
        const audio = new Audio(_noteBlobs[key]);
        audio.setAttribute('playsinline', '');
        audio.volume = 1.0;
        audio.play().catch(() => _playNoteFallback(key));
    } else {
        _playNoteFallback(key);
    }
}

function _playNoteFallback(key, duration = 400) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = NOTE_FREQS[key];
        osc.type = 'sine';
        gain.gain.setValueAtTime(1.0, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {}
}

function highlightBtn(key, duration = 400) {
    const btn = document.querySelector(`.music-btn[data-phase="${key}"]`);
    if (!btn) return;
    btn.classList.add('active');
    setTimeout(() => btn.classList.remove('active'), duration);
}

function updateSimonHud() {
    const hud = document.getElementById('simon-hud');
    if (!hud) return;
    const dots = [0, 1, 2].map(i => {
        let cls = '';
        if (i < simonLitButtons) cls = 'done';
        else if (i === simonRound) cls = 'active';
        const inner = i < simonLitButtons ? '✓' : '●';
        return `<span class="simon-dot ${cls}">${inner}</span>`;
    }).join('');
    hud.innerHTML = `<div class="simon-round-label">第 ${Math.min(simonRound + 1, 3)} / 3 轮</div><div class="simon-dots">${dots}</div>`;

    // 竖屏移动端：HUD 跟随视口中心
    const vh = window.visualViewport?.height ?? window.innerHeight;
    if (window.innerWidth < vh) {
        const container = document.getElementById('game-container');
        const containerLeft = parseFloat(container?.style.left) || 0;
        const centerInContainer = -containerLeft + window.innerWidth / 2;
        hud.style.left = centerInContainer + 'px';
        hud.style.transform = 'translateX(-50%)';
    } else {
        hud.style.left = '';
        hud.style.transform = '';
    }
}

function playSequence(seq, onDone) {
    simonPlaying = true;
    const scene = document.getElementById('bookshelf-scene');
    if (scene) scene.classList.add('simon-playing');
    let i = 0;
    function next() {
        if (i >= seq.length) {
            simonPlaying = false;
            if (scene) scene.classList.remove('simon-playing');
            if (onDone) onDone();
            return;
        }
        const key = seq[i++];
        playNote(key, 400);
        highlightBtn(key, 400);
        setTimeout(next, 550);
    }
    setTimeout(next, 400);
}

function startSimonRound() {
    simonSequence = generateSequence(ROUND_LENGTHS[simonRound]);
    simonPlayerIdx = 0;
    updateSimonHud();
    showDialog(`第${simonRound + 1}轮：仔细听……`, () => {
        playSequence(simonSequence, () => {});
    });
}

function handleMusicBoxBtn(key) {
    if (gameState.flags.musicBoxSolved) { showDialog('音乐盒已经打开过了。'); return; }
    if (simonPlaying) return;

    playNote(key, 300);
    highlightBtn(key, 300);

    if (key === simonSequence[simonPlayerIdx]) {
        simonPlayerIdx++;
        if (simonPlayerIdx >= simonSequence.length) {
            simonRound++;
            updateSimonHud();

            if (simonRound >= 3) {
                gameState.flags.musicBoxSolved = true;
                saveGame();
                showDialog('叮——三个按钮全部亮起，音乐盒缓缓打开了。\n\n里面躺着一张小纸片，上面写着：\n"那天下午，她第一次跳上窗台，坐在那里望了很久。我没有打扰她。"', () => {
                    if (!gameState.inventory.includes('音乐盒纸条')) {
                        gameState.inventory.push('音乐盒纸条');
                        saveGame();
                        updateInventory();
                        const sceneEl = document.getElementById('bookshelf-scene');
                        if (sceneEl) { const t = document.createElement('div'); t.className = 'pickup-toast'; t.textContent = '✓ 获得音乐盒纸条'; sceneEl.appendChild(t); setTimeout(() => t.remove(), 1300); }
                    }
                    showDialog('你轻轻合上音乐盒，心里有什么东西悄悄松动了。', () => {
                        collectMemoryFragment(1);
                    });
                });
            } else {
                showDialog(`✓ 第${simonRound}轮完成！`, () => { startSimonRound(); });
            }
        }
    } else {
        simonPlayerIdx = 0;
        updateSimonHud();
        showDialog('音符不对……重新听一遍。', () => {
            playSequence(simonSequence, () => {});
        });
    }
}

export function openBookshelfScene() {
    sceneManager.open('bookshelf-scene', () => {
        gameState.flags.bookshelfSeen = true;
        saveGame();

        // 竖屏时对准音乐盒水平中心（图片 46% 处）
        scrollToX(0.46);

        if (!gameState.flags.bookPuzzleSolved) {
            document.getElementById('bookshelf-puzzle-ui').classList.remove('hidden');
            setupBookPuzzleHotspots();
        } else if (!gameState.flags.musicBoxSolved) {
            document.getElementById('bookshelf-puzzle-ui').classList.add('hidden');
            simonRound = 0;
            simonLitButtons = 0;
            simonPlaying = false;
            showDialog('音乐盒上有三个按钮，各代表一个音阶。\n\n它会先播放一段旋律，你来复现——主人常哼给朵朵听的那几个音。', () => {
                setupMusicBoxHotspots();
                startSimonRound();
            });
        } else {
            document.getElementById('bookshelf-puzzle-ui').classList.add('hidden');
            showDialog('音乐盒已经打开过了，里面空空如也。');
            setupMusicBoxHotspots();
            // 便利贴未收集时重新显示
            const scene = document.getElementById('bookshelf-scene');
            if (!gameState.flags.stickyNotes.includes('note4') && !scene.querySelector('#sticky-note4')) {
                const note = document.createElement('div');
                note.id = 'sticky-note4';
                note.textContent = '📝';
                note.style.cssText = 'position:absolute;left:6%;top:12%;font-size:28px;cursor:pointer;z-index:210;';
                note.addEventListener('click', () => { note.remove(); collectStickyNote('note4'); });
                scene.appendChild(note);
            }
        }
    });
}

function setupMusicBoxHotspots() {
    const scene = document.getElementById('bookshelf-scene');
    scene.querySelectorAll('.bookshelf-hotspot, #simon-hud').forEach(el => el.remove());

    // Simon HUD
    const hud = document.createElement('div');
    hud.id = 'simon-hud';
    hud.className = 'simon-hud';
    scene.appendChild(hud);
    updateSimonHud();

    MUSIC_BOX_PHASES.forEach((p, idx) => {
        const btn = document.createElement('div');
        btn.className = 'bookshelf-hotspot music-btn';
        btn.id = p.id;
        btn.dataset.phase = p.key;
        btn.dataset.idx = idx;
        btn.style.cssText = `left:${p.x};top:${p.y};`;
        btn.innerHTML = `<span class="music-btn-label">${p.label}</span>`;
        let touchHandled = false;
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchHandled = true;
            if (navigator.vibrate) navigator.vibrate(30);
            handleMusicBoxBtn(p.key);
        }, { passive: false });
        btn.addEventListener('click', () => {
            if (touchHandled) { touchHandled = false; return; }
            handleMusicBoxBtn(p.key);
        });
        scene.appendChild(btn);
    });
}

export function closeBookshelfScene() {
    sceneManager.closeToRoom();
}
