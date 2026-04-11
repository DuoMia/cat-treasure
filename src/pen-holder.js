// ===================== 笔筒交互 =====================

import { gameState, saveGame } from './state.js';
import { showDialog } from './ui.js';

let isHolding = false;
let shakeCount = 0;
let currentOffsetX = 0;
let currentOffsetY = 0;
let touchStartScreenX = 0;
let touchStartScreenY = 0;
let lastShakeAxisVal = 0;
let lastAxisPos = 0;
let totalAxisMove = 0;
let hasDragged = false;
let penHolderInteractionSetup = false;
let _cleanupDocListeners = null;

export function isHoldingPen() { return isHolding; }

export function resetPenHolder() {
    penHolderInteractionSetup = false;
    shakeCount = 0;
    isHolding = false;
    hasDragged = false;
    _cleanupDocListeners?.();
    _cleanupDocListeners = null;
}

function getShakeAxisVal(clientX, clientY) {
    return clientX;
}

function getContainerDelta(screenDX, screenDY) {
    return { x: screenDX, y: screenDY };
}

export function setupPenHolderInteraction() {
    if (penHolderInteractionSetup) return;
    penHolderInteractionSetup = true;

    const penHolderImage = document.getElementById('pen-holder-image');
    const penHolderHotspot = document.getElementById('pen-holder-hotspot');

    if (!penHolderHotspot || !penHolderImage) {
        console.error('❌ 找不到笔筒元素！');
        return;
    }

    const MIN_DRAG = 20;
    const SHAKE_DIST = 35;

    function onDragStart(clientX, clientY) {
        if (gameState.penFallen || gameState.inventory.includes('钢笔')) return false;
        isHolding = true;
        hasDragged = false;
        totalAxisMove = 0;
        shakeCount = 0;
        touchStartScreenX = clientX;
        touchStartScreenY = clientY;
        lastShakeAxisVal = getShakeAxisVal(clientX, clientY);
        lastAxisPos = lastShakeAxisVal;
        currentOffsetX = 0;
        currentOffsetY = 0;
        return true;
    }

    let rafPending = false;
    let pendingDelta = null;

    function onDragMove(clientX, clientY) {
        if (!isHolding) return;
        const screenDX = clientX - touchStartScreenX;
        const screenDY = clientY - touchStartScreenY;
        const delta = getContainerDelta(screenDX, screenDY);
        currentOffsetX = delta.x;
        currentOffsetY = delta.y;
        pendingDelta = delta;

        const axisVal = getShakeAxisVal(clientX, clientY);
        totalAxisMove += Math.abs(axisVal - lastAxisPos);
        lastAxisPos = axisVal;

        if (totalAxisMove >= MIN_DRAG) hasDragged = true;

        const shakeAxisDelta = Math.abs(axisVal - lastShakeAxisVal);
        if (hasDragged && shakeAxisDelta >= SHAKE_DIST) {
            lastShakeAxisVal = axisVal;
            shakePenHolder();
        }

        if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(() => {
                if (pendingDelta) {
                    penHolderImage.style.transform = `translate(${pendingDelta.x}px, ${pendingDelta.y}px)`;
                    penHolderHotspot.style.transform = `translate(${pendingDelta.x}px, ${pendingDelta.y}px)`;
                }
                rafPending = false;
            });
        }
    }

    function onDragEnd() {
        if (!isHolding) return;
        const wasDragged = hasDragged;
        isHolding = false;
        hasDragged = false;
        currentOffsetX = 0;
        currentOffsetY = 0;
        penHolderImage.style.transition = 'transform 0.3s ease';
        penHolderHotspot.style.transition = 'transform 0.3s ease';
        penHolderImage.style.transform = 'translate(0, 0)';
        penHolderHotspot.style.transform = 'translate(0, 0)';
        setTimeout(() => {
            penHolderImage.style.transition = '';
            penHolderHotspot.style.transition = '';
        }, 300);
        if (!gameState.penFallen && shakeCount < 3 && wasDragged) {
            showDialog('还差一点，再用力摇一摇！');
        }
    }

    // 鼠标事件
    penHolderHotspot.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        onDragStart(e.clientX, e.clientY);
    });

    function onDocMouseMove(e) {
        if (!isHolding) return;
        onDragMove(e.clientX, e.clientY);
    }
    function onDocMouseUp() {
        onDragEnd();
    }

    document.addEventListener('mousemove', onDocMouseMove);
    document.addEventListener('mouseup', onDocMouseUp);

    // 触摸事件
    penHolderHotspot.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const t = e.touches[0];
        onDragStart(t.clientX, t.clientY);
        e.currentTarget._penHolderTouch = true;
    }, { passive: false });

    penHolderHotspot.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
    }, { passive: false });

    const gameContainer = document.getElementById('game-container');

    function onContainerTouchMove(e) {
        if (!isHolding) return;
        e.preventDefault();
        const t = e.touches[0];
        onDragMove(t.clientX, t.clientY);
    }

    function onContainerTouchEnd() {
        onDragEnd();
    }

    gameContainer.addEventListener('touchmove', onContainerTouchMove, { passive: false });
    gameContainer.addEventListener('touchend', onContainerTouchEnd);

    function onDocTouchEnd() {
        onDragEnd();
    }
    document.addEventListener('touchend', onDocTouchEnd);

    function cleanupDocListeners() {
        document.removeEventListener('mousemove', onDocMouseMove);
        document.removeEventListener('mouseup', onDocMouseUp);
        document.removeEventListener('touchend', onDocTouchEnd);
        gameContainer.removeEventListener('touchmove', onContainerTouchMove);
        gameContainer.removeEventListener('touchend', onContainerTouchEnd);
    }

    // 将清理函数注入 shakePenHolder
    _cleanupDocListeners = cleanupDocListeners;
}

function shakePenHolder() {
    if (shakeCount >= 3) return;

    const penHolder = document.getElementById('pen-holder-image');
    const penImage = document.getElementById('pen-image');

    shakeCount++;

    penHolder.style.setProperty('--tx', currentOffsetX + 'px');
    penHolder.style.setProperty('--ty', currentOffsetY + 'px');
    penHolder.classList.add('shaking');
    setTimeout(() => penHolder.classList.remove('shaking'), 500);

    if (shakeCount >= 3) {
        isHolding = false;
        setTimeout(() => {
            _cleanupDocListeners?.();
            gameState.penFallen = true;
            saveGame();
            penHolder.classList.add('hidden');
            document.getElementById('pen-holder-hotspot').classList.add('hidden');
            penImage.classList.remove('hidden');
            penImage.classList.add('fallen');
            showDialog('你用力摇晃笔筒，钢笔从里面掉了出来，落在了地上！');
        }, 600);
    } else {
        showDialog(`笔筒晃动了一下...`);
    }
}
