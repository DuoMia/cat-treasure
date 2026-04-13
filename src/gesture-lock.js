/**
 * gesture-lock.js
 * 禁用移动端系统级手势，不影响游戏内触摸交互和 AudioContext 解锁。
 */

// 供外部（bookshelf.js）注册 AudioContext，以便在手势内 resume
let _registeredAudioCtx = null;
export function registerAudioCtx(ctx) { _registeredAudioCtx = ctx; }

export function installGestureLock() {
    // ── 1. 右键菜单 ──────────────────────────────────────────────────
    document.addEventListener('contextmenu', e => e.preventDefault(), { passive: false });

    // ── 2. 单指 / 多指 touchstart ────────────────────────────────────
    // 在游戏容器内：先 resume AudioContext（保证手势可信），再 preventDefault
    // 阻止长按 callout / 放大镜 / 翻译气泡。
    document.addEventListener('touchstart', e => {
        if (e.touches.length > 1) {
            e.preventDefault();
            return;
        }
        if (e.target.closest('#game-container')) {
            // 先 resume，再 preventDefault，顺序不能反
            if (_registeredAudioCtx && _registeredAudioCtx.state === 'suspended') {
                _registeredAudioCtx.resume();
            }
            e.preventDefault();
        }
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
