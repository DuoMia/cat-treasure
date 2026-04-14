// ===================== 热区创建 + 点击追踪 =====================

import { gameState, saveGame } from './state.js';
import { showDialog, showChoices } from './ui.js';

// 由 interactions.js 在初始化时注入，避免循环依赖
let _createRoomHotspots = () => {};
let _interactSofa = () => {};

export function initHotspotCallbacks(createRoomHotspotsFn, interactSofaFn) {
    _createRoomHotspots = createRoomHotspotsFn;
    _interactSofa = interactSofaFn;
}

export function clearHotspots() {
    document.getElementById('hotspots').innerHTML = '';
}

// room.jpg 原始尺寸 1200×800（比例 3:2）
const IMG_W = 1200, IMG_H = 800;

/**
 * 将图片内容坐标系（相对于图片本身的百分比）转换为容器坐标系百分比。
 * 图片以 object-fit:cover / object-position:center 渲染，
 * 根据容器与图片的宽高比决定裁剪方向。
 */
function imgToContainerPct(ix, iy, iw, ih) {
    const container = document.getElementById('hotspots');
    const cw = container.offsetWidth  || window.innerWidth;
    const ch = container.offsetHeight || window.innerHeight;

    const scaleX = cw / IMG_W;
    const scaleY = ch / IMG_H;
    const scale  = Math.max(scaleX, scaleY); // cover 取较大缩放

    const renderedW = IMG_W * scale;
    const renderedH = IMG_H * scale;
    const offsetX   = (cw - renderedW) / 2; // 负值 = 图片超出容器
    const offsetY   = (ch - renderedH) / 2;

    // 图片内百分比 → 像素 → 容器百分比
    const toContainerX = (pct) => (offsetX + pct * renderedW) / cw * 100 + '%';
    const toContainerY = (pct) => (offsetY + pct * renderedH) / ch * 100 + '%';
    const toContainerW = (pct) => (pct * renderedW / cw * 100) + '%';
    const toContainerH = (pct) => (pct * renderedH / ch * 100) + '%';

    return {
        left:   toContainerX(ix),
        top:    toContainerY(iy),
        width:  toContainerW(iw),
        height: toContainerH(ih),
    };
}

/** 解析百分比字符串为 0~1 小数 */
function parsePct(s) { return parseFloat(s) / 100; }

export function createHotspot(id, label, x, y, width, height, onClick) {
    const hotspot = document.createElement('div');
    hotspot.className = 'hotspot';
    hotspot.dataset.id = id;
    hotspot.dataset.label = label;
    hotspot.title = label;

    // 将图片坐标系百分比转换为容器坐标系百分比
    const pos = imgToContainerPct(parsePct(x), parsePct(y), parsePct(width), parsePct(height));
    hotspot.style.cssText = `left:${pos.left};top:${pos.top};width:${pos.width};height:${pos.height};z-index:100;`;

    const handler = function(e) {
        if (!document.getElementById('dialog-box').classList.contains('hidden')) return;
        if (!document.getElementById('choice-box').classList.contains('hidden')) return;
        e.stopPropagation();
        e.preventDefault();
        onClick();
    };
    hotspot.addEventListener('click', handler, true);

    let _touchStartX = 0, _touchStartY = 0;
    hotspot.addEventListener('touchstart', function(e) {
        _touchStartX = e.touches[0].clientX;
        _touchStartY = e.touches[0].clientY;
    }, { passive: true });
    hotspot.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].clientX - _touchStartX;
        const dy = e.changedTouches[0].clientY - _touchStartY;
        if (dx * dx + dy * dy > 64) return;
        handler(e);
    }, true);
    document.getElementById('hotspots').appendChild(hotspot);
}

// ===================== 点击追踪 =====================

export function trackObjectClick(id, afterCallback) {
    if (gameState.flags.foundCat) {
        if (afterCallback) afterCallback();
        return;
    }

    if (gameState.flags.shownSofaCornerHint) {
        if (id === 'sofa') {
            if (afterCallback) afterCallback();
            return;
        }
        gameState.flags.lookAroundCount = (gameState.flags.lookAroundCount || 0) + 1;
        saveGame();
        if (gameState.flags.lookAroundCount >= 3) {
            gameState.flags.lookAroundCount = 0;
            if (afterCallback) {
                afterCallback(() => triggerSofaCornerHint());
            } else {
                triggerSofaCornerHint();
            }
        } else {
            if (afterCallback) afterCallback();
        }
        return;
    }

    gameState.searchCount++;
    saveGame();
    if (gameState.searchCount >= 6) {
        gameState.flags.shownSofaCornerHint = true;
        gameState.flags.lookAroundCount = 0;
        saveGame();
        if (afterCallback) {
            afterCallback(() => triggerSofaCornerHint());
        } else {
            triggerSofaCornerHint();
        }
    } else {
        if (afterCallback) afterCallback();
    }
}

export function triggerSofaCornerHint() {
    showDialog('你把房间里能看的地方都看了一遍，却始终没有头绪……忽然，你注意到沙发的角落似乎有什么东西。', () => {
        showChoices([
            { text: '🛋️ 去沙发角落看看', callback: () => _interactSofa() },
            { text: '🔎 再仔细找找', callback: () => {
                gameState.flags.lookAroundCount = 0;
                _createRoomHotspots();
            }}
        ]);
    });
}

/** 被咬后继续探索时，非沙发点击计数 */
export function tickExploreAfterBite() {
    if (!gameState.flags.exploringAfterBite) return false;
    gameState.flags.exploreClickCount++;
    if (gameState.flags.exploreClickCount >= 3) {
        gameState.flags.exploringAfterBite = false;
        showDialog('你在房间里转了一圈，却始终心神不宁，脑海中一直浮现着朵朵躲进沙发角落的画面……那里好像有什么东西。', () => _createRoomHotspots());
        return true;
    }
    return false;
}
