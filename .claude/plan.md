# 画框谜题移动端交互优化方案

## 问题根因

1. **竖屏下 `night` 区域（left:85%）超出屏幕** — game-container 宽度为 `100dvh*14/9`，竖屏时远宽于屏幕，右侧区域不可见
2. **拖拽冲突** — `bowlTouchHandler` 对 `touchmove` 调用 `e.preventDefault()`，完全阻断了 `setupPortraitDrag` 的横向平移；反之平移时碗也无法移动
3. **操作模式不清晰** — 移动端无法同时"平移场景"和"移动食盆"

## 解决方案

### 1. 移动端改为「点击放置」模式（核心改动）

**PC（鼠标）**：保持现有 mousemove 跟随方式不变  
**移动端（触摸）**：改为 `touchend` 点击放置——手指抬起时，将碗放到该位置并判断是否命中区域

- 移除 `touchmove` 上的 `e.preventDefault()`，改用 `touchend`
- `touchend` 时判断是否发生了滑动（dx/dy > 8px）：
  - 若是滑动 → 不放置碗（让 setupPortraitDrag 正常处理平移）
  - 若是点击 → 放置碗到该位置，立即判断命中（无需 700ms 等待，改为 300ms）

### 2. 进入场景时自动定位到当前目标区域

在 `setupPaintingOverlay()` 中，移动端竖屏时：
- 根据当前 step 的目标区域 left% 计算对应的 game-container 偏移
- 调用 `centerViewport()` 的变体，将目标区域滚动到屏幕中央
- 同时更新引导提示为「点击画面放置食盆」

### 3. 新增 `scrollToZone(zoneLeft%)` 工具函数（utils.js）

```js
export function scrollToZone(leftPercent) {
    if (window.innerWidth >= getVH()) return; // 非竖屏不处理
    const container = document.getElementById('game-container');
    const containerW = getVH() * 14 / 9;
    const screenW = window.innerWidth;
    // 目标区域中心在容器中的像素位置
    const zoneCenterPx = containerW * leftPercent / 100;
    // 让该位置出现在屏幕中央
    const targetLeft = -(zoneCenterPx - screenW / 2);
    const minOffset = -(containerW - screenW);
    container.style.left = Math.min(0, Math.max(minOffset, targetLeft)) + 'px';
}
```

## 改动文件

### `src/scenes/food-bowl.js`
- `setupPaintingOverlay()`：移动端竖屏时调用 `scrollToZone`，引导提示改为「点击放置」
- `bowlTouchHandler`：改为 `touchstart` 记录起点 + `touchend` 判断点击/滑动，点击时调用 `moveBowl` 并立即判断
- `moveBowl()`：命中后 autoConfirmTimer 延迟从 700ms 改为 300ms（点击模式更快响应）

### `src/utils.js`
- 新增 `scrollToZone(leftPercent)` 函数并 export

### `style.css`
- 无需改动（现有样式已足够）

## 不改动的内容
- PC 鼠标跟随逻辑不变
- `setupPortraitDrag` 不变（touchend 点击不会触发它的 8px 阈值）
- 区域坐标、谜题逻辑、进度 HUD 不变
