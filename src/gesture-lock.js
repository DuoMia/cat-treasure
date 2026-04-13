/**
 * gesture-lock.js
 * 彻底禁用移动端系统级手势，不影响游戏内触摸交互。
 */

export function installGestureLock() {
    // ── 1. 右键 / 长按系统菜单 ──────────────────────────────────────
    document.addEventListener('contextmenu', e => e.preventDefault(), { passive: false });

    // ── 2. 多指捏合缩放 ──────────────────────────────────────────────
    document.addEventListener('touchstart', e => {
        if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });

    // ── 3. 双击缩放 + 长按图片/文字系统菜单 ─────────────────────────
    //   在游戏容器内，touchend 时阻止双击；同时对所有非输入元素
    //   在 touchstart 里 preventDefault 以阻止长按 callout。
    //   注意：这里只针对 #game-container 内部，避免影响页面其他滚动。
    let _lastTap = 0;
    const gameEl = () => document.getElementById('game-container') || document.body;

    gameEl().addEventListener('touchend', e => {
        const now = Date.now();
        if (now - _lastTap < 350) e.preventDefault();
        _lastTap = now;
    }, { passive: false });

    // 长按 callout：对游戏容器内的 img / canvas / button / div 阻止
    document.addEventListener('touchstart', e => {
        const tag = e.target.tagName;
        if (['IMG', 'CANVAS', 'BUTTON', 'DIV', 'SPAN'].includes(tag)) {
            // 只在游戏容器内阻止
            if (e.target.closest('#game-container')) {
                e.preventDefault();
            }
        }
    }, { passive: false });

    // ── 4. 长按拖动图片 ──────────────────────────────────────────────
    document.addEventListener('dragstart', e => {
        if (!e.target.closest('[draggable="true"]')) e.preventDefault();
    }, { passive: false });

    // ── 5. 文字选中 ──────────────────────────────────────────────────
    document.addEventListener('selectstart', e => e.preventDefault(), { passive: false });

    // ── 6. iOS Safari 原生手势 ───────────────────────────────────────
    document.addEventListener('gesturestart',  e => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false });
    document.addEventListener('gestureend',    e => e.preventDefault(), { passive: false });

    // ── 7. PC 触控板 Ctrl+滚轮缩放 ──────────────────────────────────
    document.addEventListener('wheel', e => {
        if (e.ctrlKey) e.preventDefault();
    }, { passive: false });
}
