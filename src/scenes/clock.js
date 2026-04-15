// ===================== 时钟场景 =====================

import { gameState, saveGame } from '../state.js';
import { sceneManager } from '../scene-manager.js';
import { showDialog, showEnding } from '../ui.js';

export function openClockScene() {
    sceneManager.open('clock-scene', () => {
        initClockFace();
    });
}

function initClockFace() {
    const cx = 100, cy = 100;

    document.getElementById('clock-ticks').innerHTML = '';
    document.getElementById('clock-numbers').innerHTML = '';
    document.getElementById('clock-hotspots').innerHTML = '';

    const numLabels = ['12','1','2','3','4','5','6','7','8','9','10','11'];

    for (let h = 0; h < 12; h++) {
        const angle = (h / 12) * 2 * Math.PI - Math.PI / 2;
        const tx = cx + Math.cos(angle) * 72;
        const ty = cy + Math.sin(angle) * 72;
        const ix = cx + Math.cos(angle) * 88;
        const iy = cy + Math.sin(angle) * 88;
        const ox = cx + Math.cos(angle) * 94;
        const oy = cy + Math.sin(angle) * 94;

        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', ix); tick.setAttribute('y1', iy);
        tick.setAttribute('x2', ox); tick.setAttribute('y2', oy);
        tick.setAttribute('stroke', '#8b6f47'); tick.setAttribute('stroke-width', '2');
        document.getElementById('clock-ticks').appendChild(tick);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', tx); text.setAttribute('y', ty);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('font-size', '13');
        text.setAttribute('fill', '#5a3e1b');
        text.setAttribute('font-family', 'serif');
        text.textContent = numLabels[h];
        document.getElementById('clock-numbers').appendChild(text);

        const hotspot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hotspot.setAttribute('cx', tx); hotspot.setAttribute('cy', ty);
        hotspot.setAttribute('r', '12');
        hotspot.setAttribute('fill', 'transparent');
        hotspot.setAttribute('cursor', 'pointer');
        hotspot.dataset = {};
        hotspot.setAttribute('data-hour', h === 0 ? 12 : h);
        const hourVal = h === 0 ? 12 : h;
        let _touchFired = false;
        let _tx = 0, _ty = 0;
        hotspot.addEventListener('touchstart', (e) => {
            _tx = e.touches[0].clientX; _ty = e.touches[0].clientY;
        }, { passive: true });
        hotspot.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - _tx;
            const dy = e.changedTouches[0].clientY - _ty;
            if (dx * dx + dy * dy > 64) return;
            e.preventDefault();
            _touchFired = true;
            onClockHourClick(hourVal);
        }, { passive: false });
        hotspot.addEventListener('click', () => {
            if (_touchFired) { _touchFired = false; return; }
            onClockHourClick(hourVal);
        });
        document.getElementById('clock-hotspots').appendChild(hotspot);
    }

    updateClockHands();

    // 真结局解锁后，显示翻转时钟的热区
    const wrapper = document.getElementById('clock-face-wrapper');
    const existingFlip = wrapper.querySelector('#clock-flip-btn');
    if (existingFlip) existingFlip.remove();

    if (gameState.flags.trueEndingUnlocked) {
        const flipBtn = document.createElement('div');
        flipBtn.id = 'clock-flip-btn';
        flipBtn.textContent = '时钟背面好像有什么东西';
        flipBtn.style.cssText = 'margin-top:16px;color:#c8a96e;font-size:14px;cursor:pointer;text-align:center;text-decoration:underline;';
        const onFlip = () => showEnding('treasure');
        flipBtn.addEventListener('click', onFlip);
        flipBtn.addEventListener('touchend', (e) => { e.preventDefault(); onFlip(); }, { passive: false });
        wrapper.appendChild(flipBtn);
    }
}

function updateClockHands() {
    const time = gameState.flags.clockTime;
    let hour = 0;
    if (time === '10') hour = 10;
    else if (time === '15') hour = 3;

    const angle = (hour / 12) * 2 * Math.PI - Math.PI / 2;
    const len = 38;
    const x2 = 100 + Math.cos(angle) * len;
    const y2 = 100 + Math.sin(angle) * len;
    document.getElementById('clock-hour-hand').setAttribute('x2', x2);
    document.getElementById('clock-hour-hand').setAttribute('y2', y2);

    const label = time === '10' ? '10 : 00' : time === '15' ? '03 : 00' : '-- : --';
    document.getElementById('clock-time-label').textContent = label;
}

function onClockHourClick(hour) {
    if (hour === 10) {
        gameState.flags.clockTime = '10';
        saveGame();
        updateClockHands();
        showDialog('指针停在了上午10点。\n\n窗外的光线好像也跟着变了……去阳台看看？');
    } else if (hour === 3) {
        gameState.flags.clockTime = '15';
        saveGame();
        updateClockHands();
        showDialog('指针停在了下午3点。\n\n窗外的光线好像也跟着变了……去阳台看看？');
    } else {
        const angle = (hour / 12) * 2 * Math.PI - Math.PI / 2;
        const len = 38;
        const x2 = 100 + Math.cos(angle) * len;
        const y2 = 100 + Math.sin(angle) * len;
        document.getElementById('clock-hour-hand').setAttribute('x2', x2);
        document.getElementById('clock-hour-hand').setAttribute('y2', y2);
        document.getElementById('clock-time-label').textContent = `${String(hour).padStart(2,'0')} : 00`;
        setTimeout(() => {
            gameState.flags.clockTime = String(hour);
        }, 300);
    }
}

export function closeClockScene() {
    sceneManager.closeToRoom();
}
