/**
 * gesture-lock.js
 * 禁用移动端系统级手势，不影响游戏内触摸交互和 AudioContext 解锁。
 *
 * 长按 callout / 文字选中 / -webkit-touch-callout 已在 CSS 全局 * 规则里处理，
 * 这里只处理 JS 层面必须拦截的手势。
 */

export function installGestureLock() {
    // ── 1. 右键菜单 ──────────────────────────────────────────────────
    document.addEventListener('contextmenu', e => e.preventDefault(), { passive: false });

    // ── 2. 多指捏合缩放 ──────────────────────────────────────────────
    // 注意：不对单指 touchstart 调用 preventDefault，否则会阻止
    // AudioContext 的用户手势解锁（浏览器安全策略）
    document.addEventListener('touchstart', e => {
        if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });

    // ── 3. 双击缩放 ──────────────────────────────────────────────────
    let _lastTap = 0;
    document.addEventListener('touchend', e => {
        const now = Date.now();
        if (now - _lastTap < 350) e.preventDefault();
        _lastTap = now;
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
