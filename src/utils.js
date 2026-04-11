// ===================== 工具函数 =====================

/** 检测是否是移动端 */
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

/** 获取真实可视视口高度（排除微信/浏览器地址栏） */
function getVH() {
    return window.visualViewport?.height ?? window.innerHeight;
}

/** 竖屏时将容器滚动到水平居中位置 */
export function centerViewport() {
    const vh = getVH();
    if (window.innerWidth >= vh) return;
    const container = document.getElementById('game-container');
    const containerW = vh * 14 / 9;
    const screenW = window.innerWidth;
    container.style.left = -((containerW - screenW) / 2) + 'px';
}

/** 显示拖动提示（竖屏时） */
export function showDragHint() {
    if (window.innerWidth >= window.innerHeight) return;
    const existing = document.getElementById('drag-hint');
    if (existing) existing.remove();
    const hint = document.createElement('div');
    hint.id = 'drag-hint';
    hint.textContent = '← 左右滑动查看完整画面 →';
    document.body.appendChild(hint);
}

/** 移动端触摸点击绑定：手指抬起且未滑动才触发，阻止冒泡到 game-play */
export function setTapHandler(el, handler, once) {
    let _tx = 0, _ty = 0;
    const opts = once ? { passive: true, once: true } : { passive: true };
    el.addEventListener('touchstart', function(e) {
        _tx = e.touches[0].clientX;
        _ty = e.touches[0].clientY;
    }, opts);
    el.addEventListener('touchend', function(e) {
        e.stopPropagation();
        const dx = e.changedTouches[0].clientX - _tx;
        const dy = e.changedTouches[0].clientY - _ty;
        if (dx * dx + dy * dy > 64) return;
        handler(e);
    }, once ? { once: true } : {});
    if (once) {
        el.addEventListener('click', function fn(e) {
            el.removeEventListener('click', fn);
            handler(e);
        });
    } else {
        el.onclick = handler;
    }
}

/** 竖屏拖动支持：让玩家拖动 game-container 查看画面两侧 */
export function setupPortraitDrag(isHoldingGetter) {
    const container = document.getElementById('game-container');
    let startX = 0, startLeft = 0, moved = false, active = false;
    const DRAG_THRESHOLD = 8;

    function getLeft() {
        return parseFloat(container.style.left) || 0;
    }

    function clampLeft(val) {
        const containerW = getVH() * 14 / 9;
        const screenW = window.innerWidth;
        const minOffset = -(containerW - screenW);
        return Math.min(0, Math.max(minOffset, val));
    }

    container.addEventListener('touchstart', function(e) {
        if (window.innerWidth >= getVH()) return;
        startX = e.touches[0].clientX;
        startLeft = getLeft();
        moved = false;
        active = true;
    }, { passive: true });

    container.addEventListener('touchmove', function(e) {
        if (!active || window.innerWidth >= getVH()) return;
        if (isHoldingGetter()) { active = false; return; }
        if (!document.getElementById('dialog-box').classList.contains('hidden')) { active = false; return; }
        if (!document.getElementById('choice-box').classList.contains('hidden')) { active = false; return; }
        const dx = e.touches[0].clientX - startX;
        if (!moved && Math.abs(dx) < DRAG_THRESHOLD) return;
        moved = true;
        container.style.left = clampLeft(startLeft + dx) + 'px';
    }, { passive: true });

    container.addEventListener('touchend', function() {
        if (moved) {
            container.addEventListener('click', stopClick, { capture: true, once: true });
        }
        moved = false;
        active = false;
    }, { passive: true });

    function stopClick(e) {
        e.stopPropagation();
        e.preventDefault();
    }
}
