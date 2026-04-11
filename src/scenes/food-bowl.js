// ===================== 食盆场景 + 画框谜题场景 =====================

import { gameState, saveGame } from '../state.js';
import { sceneManager } from '../scene-manager.js';
import { showDialog, updateInventory } from '../ui.js';
import { collectMemoryFragment } from '../notes.js';
import { PUZZLES, BOWL_ZONES, PAINTING_HINTS } from '../data.js';
import { isMobileDevice, scrollToZone } from '../utils.js';

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
            card.addEventListener('click', () => {
                showDialog('你凑近看那张泛黄的记录卡……\n\n"她吃早饭的时候，总喜欢待在毯子上，并且要离柜子最近。\n\n中午的阳光最烈，她会找最亮的地方，正对着光吃。\n\n傍晚她有点困，歪在离门最近的角落，有时候吃到一半就打盹。\n\n夜里安静，她会躲到最暗的地方，专心吃完再出来。"');
            });
            scene.appendChild(card);
        }

        // 食盆拾取热区（有视觉提示）
        if (!gameState.flags.hasBowl) {
            if (!scene.querySelector('#food-bowl-pickup')) {
                const bowl = document.createElement('div');
                bowl.id = 'food-bowl-pickup';
                bowl.style.cssText = 'left:15%;top:45%;width:35%;height:40%;';
                bowl.textContent = '🍜';
                bowl.addEventListener('click', () => {
                    gameState.flags.hasBowl = true;
                    saveGame();
                    bowl.remove();
                    if (!gameState.inventory.includes('食盆')) {
                        gameState.inventory.push('食盆');
                        updateInventory();
                    }
                    // 拾取浮动提示
                    const toast = document.createElement('div');
                    toast.className = 'pickup-toast';
                    toast.style.top = '42%';
                    toast.textContent = '✓ 获得食盆';
                    scene.appendChild(toast);
                    setTimeout(() => toast.remove(), 1300);

                    showDialog('你拿起食盆，翻过来看了看盆底——上面有一个浅浅的镂空花纹，像是被反复摩擦留下的痕迹。');
                });
                scene.appendChild(bowl);
            }
        }
    });
}

export function closeFoodBowlScene() {
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

        // 墙缝纸条线索
        if (!gameState.flags.balconyClue1) {
            const noteA = document.createElement('div');
            noteA.id = 'balcony-note-a';
            noteA.style.cssText = 'position:absolute;right:4%;top:12%;width:6%;height:8%;cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;z-index:210;';
            noteA.title = '墙缝里的纸条';
            noteA.textContent = '📄';
            noteA.addEventListener('click', () => {
                gameState.flags.balconyClue1 = true;
                saveGame();
                noteA.remove();
                showDialog('你从画框旁边的墙缝里抽出一张折叠的纸条。\n\n"朵朵最爱上午的阳光。那时候她会坐在阳台左边，一动不动，直到影子把什么东西盖住。"', () => {
                    showDialog('上午的阳光……影子……\n\n你想起了墙上的那个时钟。');
                });
            });
            scene.appendChild(noteA);
        }

        setupPaintingOverlay();
    });
}

function setupPaintingOverlay() {
    const scene = document.getElementById('painting-scene');
    // 清理旧元素
    scene.querySelectorAll('.painting-zone, .painting-symbol-reveal, .painting-bowl-indicator, .painting-progress-hud, .painting-guide-tip').forEach(el => el.remove());
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

    // 进度 HUD（常驻，不弹 dialog）
    updateProgressHud(scene, step);

    // 恢复已确认的符号
    gameState.flags.paintingSymbolsFound.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = 'painting-symbol-reveal';
        el.style.cssText = `position:absolute;bottom:18%;left:${20 + i * 15}%;font-size:28px;z-index:220;pointer-events:none;`;
        el.textContent = s;
        scene.appendChild(el);
    });

    // 目标区域微弱提示框
    BOWL_ZONES.forEach(zone => {
        const el = document.createElement('div');
        el.className = 'painting-zone';
        el.dataset.zoneId = zone.id;
        el.style.cssText = `left:${zone.left};top:${zone.top};width:${zone.width};height:${zone.height};`;
        scene.appendChild(el);
    });

    // 碗指示器（跟随鼠标/触摸）
    const bowl = document.createElement('div');
    bowl.className = 'painting-bowl-indicator';
    bowl.textContent = '🍜';
    bowl.style.cssText = 'left:-20%;top:-20%;'; // 初始隐藏在画面外
    scene.appendChild(bowl);

    // 初始引导提示（首次进入时显示）
    if (step === 0 && gameState.flags.paintingSymbolsFound.length === 0) {
        const tip = document.createElement('div');
        tip.className = 'painting-guide-tip';
        tip.textContent = isMobileDevice() ? '点击画面放置食盆' : '移动食盆，找到朵朵吃饭的位置';
        scene.appendChild(tip);
        setTimeout(() => tip.remove(), 3500);
    }

    // 竖屏移动端：自动将当前目标区域滚动到屏幕中央
    if (isMobileDevice()) {
        const targetZone = BOWL_ZONES.find(z => z.id === BOWL_ORDER[step]);
        if (targetZone) {
            const zoneCenterLeft = parseFloat(targetZone.left) + parseFloat(targetZone.width) / 2;
            scrollToZone(zoneCenterLeft);
        }
    }

    // 鼠标跟随（PC）
    bowlMoveHandler = (e) => {
        const rect = scene.getBoundingClientRect();
        const bx = (e.clientX - rect.left) / rect.width * 100;
        const by = (e.clientY - rect.top) / rect.height * 100;
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
        const rect = scene.getBoundingClientRect();
        const bx = (t.clientX - rect.left) / rect.width * 100;
        const by = (t.clientY - rect.top) / rect.height * 100;
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
    const expectedZone = BOWL_ZONES.find(z => z.id === expectedId);
    const ezCx = parseFloat(expectedZone.left) + parseFloat(expectedZone.width) / 2;
    const ezCy = parseFloat(expectedZone.top) + parseFloat(expectedZone.height) / 2;
    const dist = Math.sqrt((bx - ezCx) ** 2 + (by - ezCy) ** 2);

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
                confirmSymbol(expectedZone.symbol, scene);
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

    const step = gameState.flags.paintingStep;
    gameState.flags.paintingSymbolsFound.push(symbol);
    gameState.flags.paintingStep++;
    saveGame();

    // 显示已确认符号
    scene.querySelectorAll('.painting-symbol-reveal').forEach(el => el.remove());
    gameState.flags.paintingSymbolsFound.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = 'painting-symbol-reveal';
        el.style.cssText = `position:absolute;bottom:18%;left:${20 + i * 15}%;font-size:28px;z-index:220;pointer-events:none;`;
        el.textContent = s;
        scene.appendChild(el);
    });

    if (gameState.flags.paintingStep >= 4) {
        setTimeout(() => {
            gameState.flags.paintingPuzzleSolved = true;
            saveGame();
            showDialog('咔哒——画框从墙上弹开了一条缝，里面夹着一封信！', () => {
                gameState.flags.hasOwnerLetter = true;
                gameState.inventory.push('主人的信');
                saveGame();
                updateInventory();
                showDialog('你获得了主人写给朵朵的信。\n\n"朵朵，\n\n你总是在下午三点坐到时钟下面，一动不动地盯着那根指针。我问你在看什么，你只是眯起眼睛。\n\n后来我明白了——你是在替我数时间。\n\n我把最重要的东西藏在了那里，就像你每天守着它一样。\n\n——主人"', () => {
                    showDialog('先闻味道（鱼）→爪子确认（爪印）→铃铛→球……\n\n这个顺序……好像可以用在什么地方。', () => {
                        collectMemoryFragment(2);
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
