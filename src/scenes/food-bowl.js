// ===================== 食盆场景 + 画框谜题场景 =====================

import { gameState, saveGame } from '../state.js';
import { sceneManager } from '../scene-manager.js';
import { showDialog, updateInventory } from '../ui.js';
import { collectMemoryFragment } from '../notes.js';
import { PUZZLES, BOWL_ZONES, PAINTING_HINTS } from '../data.js';
import { isMobileDevice, showPickupToast } from '../utils.js';
import { imgCoordsToContainer, parsePct } from '../scene-hotspot.js';

const BOWL_ORDER = PUZZLES.bowlOrder;

export function openFoodBowlScene() {
    sceneManager.open('food-bowl-scene', () => {
        gameState.flags.foodBowlSeen = true;
        saveGame();

        const scene = document.getElementById('food-bowl-scene');

        // 记录卡热区（修复 id 使 CSS 样式生效）
        if (!scene.querySelector('#food-bowl-record-hotspot')) {
            const card = document.createElement('div');
            card.id = 'food-bowl-record-hotspot';
            const cardPos = imgCoordsToContainer(scene, 1200, 800, parsePct('56.5%'), parsePct('43%'), parsePct('30%'), parsePct('37%'));
            card.style.cssText = `position:absolute;left:${cardPos.left};top:${cardPos.top};width:${cardPos.width};height:${cardPos.height};cursor:pointer;z-index:210;touch-action:manipulation;-webkit-tap-highlight-color:transparent;`;
            const onCardActivate = () => {
                showDialog('你凑近看那张泛黄的记录卡……\n\n"她吃早饭的时候，总喜欢待在毯子上，并且要离柜子最近。\n\n中午的阳光最烈，她会找最亮的地方，正对着光吃。\n\n傍晚她有点困，歪在离门最近的角落，有时候吃到一半就打盹。\n\n夜里安静，她会躲到最暗的地方，专心吃完再出来。"');
            };
            let _touchFired = false;
            let _tx = 0, _ty = 0;
            card.addEventListener('touchstart', (e) => {
                _tx = e.touches[0].clientX; _ty = e.touches[0].clientY;
            }, { passive: true });
            card.addEventListener('touchend', (e) => {
                const dx = e.changedTouches[0].clientX - _tx;
                const dy = e.changedTouches[0].clientY - _ty;
                if (dx * dx + dy * dy > 64) return;
                e.preventDefault();
                e.stopPropagation();
                _touchFired = true;
                onCardActivate();
            }, { passive: false });
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                if (_touchFired) { _touchFired = false; return; }
                onCardActivate();
            });
            scene.appendChild(card);
        }

        // 食盆拾取热区（有视觉提示）
        if (!gameState.flags.hasBowl) {
            if (!scene.querySelector('#food-bowl-pickup')) {
                const bowl = document.createElement('div');
                bowl.id = 'food-bowl-pickup';
                const pos = imgCoordsToContainer(scene, 1200, 800, parsePct('25%'), parsePct('45%'), parsePct('20%'), parsePct('25%'));
                bowl.style.cssText = `left:${pos.left};top:${pos.top};width:${pos.width};height:${pos.height};`;
                const onBowlTap = () => {
                    gameState.flags.hasBowl = true;
                    saveGame();
                    bowl.remove();
                    if (!gameState.inventory.includes('食盆')) {
                        gameState.inventory.push('食盆');
                        updateInventory();
                    }
                    // 拾取浮动提示
                    showPickupToast('✓ 获得食盆');

                    showDialog('你拿起食盆，翻过来看了看盆底——上面有一个浅浅的镂空花纹，像是被反复摩擦留下的痕迹，你把食盆放进了背包。');
                };
                bowl.addEventListener('click', onBowlTap);
                bowl.addEventListener('touchend', (e) => { e.preventDefault(); onBowlTap(); }, { passive: false });
                scene.appendChild(bowl);
            }
        }
    });
}

export function closeFoodBowlScene() {
    const scene = document.getElementById('food-bowl-scene');
    if (scene?._cleanupOverlay) { scene._cleanupOverlay(); scene._cleanupOverlay = null; }
    sceneManager.closeToRoom();
}

// ===================== 画框谜题场景 =====================

// 模块级变量，跨函数共享
let bowlMoveHandler = null;
let bowlTouchHandler = null;
let autoConfirmTimer = null;

export function openPaintingPuzzle() {
    sceneManager.open('painting-scene', () => {
        // 不重置进度，只在首次进入时初始化
        if (!Array.isArray(gameState.flags.paintingSymbolsFound)) {
            gameState.flags.paintingSymbolsFound = [];
        }

        const scene = document.getElementById('painting-scene');

        // 调试模式：点击任意位置显示坐标
        if (!scene._debugClickBound) {
            scene._debugClickBound = (e) => {
                if (!gameState.debugMode) return;
                const rect = scene.getBoundingClientRect();
                const bx = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
                const by = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
                let tip = scene.querySelector('.debug-coord-tip');
                if (!tip) {
                    tip = document.createElement('div');
                    tip.className = 'debug-coord-tip';
                    tip.style.cssText = 'position:absolute;background:rgba(0,0,0,0.85);color:#0f0;font-size:12px;padding:4px 10px;border-radius:4px;pointer-events:none;z-index:9999;font-family:monospace;';
                    scene.appendChild(tip);
                }
                tip.textContent = `left:${bx}% top:${by}%`;
                tip.style.left = (parseFloat(bx) + 1) + '%';
                tip.style.top = (parseFloat(by) + 1) + '%';
            };
            scene.addEventListener('click', scene._debugClickBound, true);
        }

        setupPaintingOverlay();
    });
}

function setupPaintingOverlay() {
    const scene = document.getElementById('painting-scene');
    // 清理旧元素
    scene.querySelectorAll('.painting-zone, .painting-symbol-reveal, .painting-bowl-indicator, .painting-progress-hud, .painting-guide-tip, #painting-img-overlay').forEach(el => el.remove());
    cleanupBowlListeners(scene);

    if (gameState.flags.paintingPuzzleSolved) {
        showDialog('画框已经打开过了。');
        return;
    }

    if (!gameState.inventory.includes('食盆')) {
        showDialog('这幅画描绘了朵朵在不同时间吃饭的场景……\n\n也许需要什么东西才能解开它的秘密。');
        return;
    }

    const step = gameState.flags.paintingStep || 0;

    // 创建与图片渲染区域对齐的覆盖层
    const overlay = document.createElement('div');
    overlay.id = 'painting-img-overlay';
    overlay.style.cssText = 'position:absolute;pointer-events:none;z-index:211;';
    scene.appendChild(overlay);

    // 等图片加载完成后定位 overlay
    function positionOverlay() {
        const img = scene.querySelector('.scene-image');
        if (!img || !img.naturalWidth) return;
        const rect = scene.getBoundingClientRect();
        const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
        const rendW = img.naturalWidth * scale;
        const rendH = img.naturalHeight * scale;
        const offX = (rect.width - rendW) / 2;
        const offY = (rect.height - rendH) / 2;
        overlay.style.left = offX + 'px';
        overlay.style.top = offY + 'px';
        overlay.style.width = rendW + 'px';
        overlay.style.height = rendH + 'px';
    }
    const img = scene.querySelector('.scene-image');
    if (img && img.complete && img.naturalWidth) {
        positionOverlay();
    } else if (img) {
        img.addEventListener('load', positionOverlay, { once: true });
    }
    window.addEventListener('resize', positionOverlay);
    scene._cleanupOverlay = () => window.removeEventListener('resize', positionOverlay);

    // 进度 HUD（常驻，不弹 dialog）
    updateProgressHud(scene, step);

    // 目标区域微弱提示框（放入 overlay）
    BOWL_ZONES.forEach(zone => {
        const el = document.createElement('div');
        el.className = 'painting-zone';
        el.dataset.zoneId = zone.id;
        el.style.cssText = `left:${zone.left};top:${zone.top};width:${zone.width};height:${zone.height};`;
        overlay.appendChild(el);
    });

    // 碗指示器（放入 overlay）
    const bowl = document.createElement('div');
    bowl.className = 'painting-bowl-indicator';
    bowl.textContent = '🥣';
    bowl.style.cssText = 'left:-20%;top:-20%;'; // 初始隐藏在画面外
    overlay.appendChild(bowl);

    // 初始引导提示（首次进入时显示）
    if (step === 0 && gameState.flags.paintingSymbolsFound.length === 0) {
        const tip = document.createElement('div');
        tip.className = 'painting-guide-tip';
        tip.textContent = isMobileDevice() ? '点击画面放置食盆' : '移动食盆，找到朵朵吃饭的位置';
        scene.appendChild(tip);
        setTimeout(() => tip.remove(), 3500);
    }

    // 竖屏移动端：contain 模式下整幅画已可见，无需自动滚动

    // 计算触点在图片实际渲染区域内的百分比坐标（contain 模式下图片可能有黑边）
    function clientToPercent(clientX, clientY) {
        const rect = scene.getBoundingClientRect();
        const img = scene.querySelector('.scene-image');
        if (!img) return { bx: 0, by: 0 };
        const natW = img.naturalWidth || rect.width;
        const natH = img.naturalHeight || rect.height;
        const scale = Math.min(rect.width / natW, rect.height / natH);
        const rendW = natW * scale;
        const rendH = natH * scale;
        const offX = (rect.width - rendW) / 2;
        const offY = (rect.height - rendH) / 2;
        return {
            bx: (clientX - rect.left - offX) / rendW * 100,
            by: (clientY - rect.top  - offY) / rendH * 100
        };
    }

    // 鼠标跟随（PC）
    bowlMoveHandler = (e) => {
        const { bx, by } = clientToPercent(e.clientX, e.clientY);
        moveBowl(bx, by, bowl, scene);
    };

    // 移动端：touchmove 实时标记"已滑动"，touchend 时未滑动才放置碗
    let _touchStartX = 0, _touchStartY = 0, _touchMoved = false;

    const _onTouchStart = (e) => {
        _touchStartX = e.touches[0].clientX;
        _touchStartY = e.touches[0].clientY;
        _touchMoved = false;
    };
    const _onTouchMove = (e) => {
        const dx = e.touches[0].clientX - _touchStartX;
        const dy = e.touches[0].clientY - _touchStartY;
        if (dx * dx + dy * dy > 64) _touchMoved = true; // 超过 8px 标记为滑动
    };
    const _onTouchEnd = (e) => {
        if (_touchMoved) return; // 滑动过 → 是平移，不放置碗
        const t = e.changedTouches[0];
        const { bx, by } = clientToPercent(t.clientX, t.clientY);
        moveBowl(bx, by, bowl, scene);
    };

    bowlTouchHandler = { start: _onTouchStart, move: _onTouchMove, end: _onTouchEnd };

    scene.addEventListener('mousemove', bowlMoveHandler);
    scene.addEventListener('touchstart', _onTouchStart, { passive: true });
    scene.addEventListener('touchmove', _onTouchMove, { passive: true });
    scene.addEventListener('touchend', _onTouchEnd, { passive: true });
}

function moveBowl(bx, by, bowl, scene) {
    bowl.style.left = (bx - 4) + '%';
    bowl.style.top = (by - 5) + '%';

    const step = gameState.flags.paintingStep || 0;
    if (step >= 4) return;

    const expectedId = BOWL_ORDER[step];
    // 夜里支持两个热区（night / night2），任一匹配即可
    const expectedZones = BOWL_ZONES.filter(z => z.id === expectedId || (expectedId === 'night' && z.id === 'night2'));
    const dists = expectedZones.map(z => {
        const cx = parseFloat(z.left) + parseFloat(z.width) / 2;
        const cy = parseFloat(z.top) + parseFloat(z.height) / 2;
        return Math.sqrt((bx - cx) ** 2 + (by - cy) ** 2);
    });
    const dist = Math.min(...dists);
    const matchedZone = expectedZones[dists.indexOf(dist)];

    // 更新所有区域的 near 状态
    scene.querySelectorAll('.painting-zone').forEach(el => {
        const zone = BOWL_ZONES.find(z => z.id === el.dataset.zoneId);
        if (!zone) return;
        const cx = parseFloat(zone.left) + parseFloat(zone.width) / 2;
        const cy = parseFloat(zone.top) + parseFloat(zone.height) / 2;
        const d = Math.sqrt((bx - cx) ** 2 + (by - cy) ** 2);
        el.classList.toggle('near', d < 14);
    });

    if (dist < 10) {
        bowl.classList.add('correct');
        if (!autoConfirmTimer) {
            autoConfirmTimer = setTimeout(() => {
                autoConfirmTimer = null;
                confirmSymbol(matchedZone.symbol, scene);
            }, isMobileDevice() ? 300 : 700);
        }
    } else {
        bowl.classList.remove('correct');
        if (autoConfirmTimer) {
            clearTimeout(autoConfirmTimer);
            autoConfirmTimer = null;
        }
    }
}

function cleanupBowlListeners(scene) {
    if (bowlMoveHandler) { scene.removeEventListener('mousemove', bowlMoveHandler); bowlMoveHandler = null; }
    if (bowlTouchHandler) {
        scene.removeEventListener('touchstart', bowlTouchHandler.start);
        scene.removeEventListener('touchmove', bowlTouchHandler.move);
        scene.removeEventListener('touchend', bowlTouchHandler.end);
        bowlTouchHandler = null;
    }
    if (autoConfirmTimer) { clearTimeout(autoConfirmTimer); autoConfirmTimer = null; }
    if (scene._cleanupOverlay) { scene._cleanupOverlay(); scene._cleanupOverlay = null; }
}

function updateProgressHud(scene, step) {
    let hud = scene.querySelector('.painting-progress-hud');
    if (!hud) {
        hud = document.createElement('div');
        hud.className = 'painting-progress-hud';
        scene.appendChild(hud);
    }
    const dots = [0, 1, 2, 3].map(i => {
        let cls = '';
        if (i < step) cls = 'done';
        else if (i === step) cls = 'active';
        return `<span class="painting-dot ${cls}">${i < step ? '✓' : '●'}</span>`;
    }).join('');
    const hint = PAINTING_HINTS[step] || '';
    hud.innerHTML = `<div class="painting-step-hint">${hint}</div><div class="painting-dots">${dots}</div>`;
}

function confirmSymbol(symbol, scene) {
    cleanupBowlListeners(scene);

    gameState.flags.paintingSymbolsFound.push(symbol);
    gameState.flags.paintingStep++;
    saveGame();

    // 显示已确认符号
    scene.querySelectorAll('.painting-symbol-reveal').forEach(el => el.remove());

    if (gameState.flags.paintingStep >= 4) {
        scene.querySelectorAll('.painting-bowl-indicator, .painting-zone, .painting-progress-hud, .painting-guide-tip').forEach(el => el.remove());
        setTimeout(() => {
            gameState.flags.paintingPuzzleSolved = true;
            saveGame();
            showDialog('咔哒——画框从墙上弹开了一条缝，里面夹着一封信！', () => {
                gameState.flags.hasOwnerLetter = true;
                if (!gameState.inventory.includes('主人的信')) {
                    gameState.inventory.push('主人的信');
                }
                saveGame();
                updateInventory();
                showPickupToast('✓ 获得主人的信');
                showDialog('你获得了主人写给朵朵的信。\n\n"朵朵，\n\n每天上午十点，我把她的早饭端到阳台，她总是先不吃，坐在仙人掌旁边，等那道光爬过来，才低头吃第一口。\n\n我不知道她在等什么。也许是影子，也许是什么只有她看得见的东西。\n\n我把一些东西藏在了那道影子的尽头。\n\n——主人"', () => {
                        collectMemoryFragment(2, () => {
                            updateInventory();
                        });
                });
            });
        }, 600);
    } else {
        // 更新进度 HUD，重新绑定碗跟随
        updateProgressHud(scene, gameState.flags.paintingStep);
        setupPaintingOverlay();
    }
}

export function closePaintingScene() {
    const scene = document.getElementById('painting-scene');
    if (scene) cleanupBowlListeners(scene);
    sceneManager.closeToRoom();
}
