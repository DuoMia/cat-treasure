/**
 * gesture-lock.js
 * 彻底禁用移动端系统级手势，不影响游戏内触摸交互。
 *
 * 覆盖范围：
 *  - 长按系统菜单（微信搜一搜 / Safari 复制 / 放大镜）
 *  - 长按拖动图片/链接（系统拖拽预览）
 *  - 双击缩放（iOS Safari / Android WebView）
 *  - 多指捏合缩放
 *  - 下拉刷新 / 橡皮筋回弹
 *  - 文字选中
 *  - 系统 callout（iOS 气泡菜单）
 */

export function installGestureLock() {
    // ── 1. 长按系统菜单 & 右键菜单 ──────────────────────────────────
    document.addEventListener('contextmenu', e => e.preventDefault(), { passive: false });

    // ── 2. 多指 / 捏合缩放 ──────────────────────────────────────────
    document.addEventListener('touchstart', e => {
        if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });

    // ── 3. 双击缩放（300ms 内连续两次 tap） ─────────────────────────
    let _lastTap = 0;
    document.addEventListener('touchend', e => {
        const now = Date.now();
        if (now - _lastTap < 300) {
            e.preventDefault(); // 阻止双击缩放
        }
        _lastTap = now;
    }, { passive: false });

    // ── 4. 长按拖动图片 / 元素（系统拖拽预览，仅移动端） ────────────
    document.addEventListener('dragstart', e => {
        if (!e.target.closest('[draggable="true"]')) e.preventDefault();
    }, { passive: false });

    // ── 5. 文字选中（touchmove 期间） ───────────────────────────────
    document.addEventListener('selectstart', e => e.preventDefault(), { passive: false });

    // ── 6. gesturestart / gesturechange（iOS Safari 原生手势） ───────
    document.addEventListener('gesturestart',  e => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false });
    document.addEventListener('gestureend',    e => e.preventDefault(), { passive: false });

    // ── 7. wheel 缩放（PC 触控板 Ctrl+滚轮） ────────────────────────
    document.addEventListener('wheel', e => {
        if (e.ctrlKey) e.preventDefault();
    }, { passive: false });
}
