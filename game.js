// 游戏状态
const gameState = {
    inventory: [],
    debugMode: false,
    searchCount: 0,
    penFallen: false,
    clickedObjects: new Set(), // 追踪已点击过的可交互对象
    flags: {
        foundCat: false,
        wasBitten: false,
        shownHelpless: false,
        foundBump: false,
        hasBox: false,
        solvedPassword: false,
        lookedAtClock: false,
        exploringAfterBite: false,
        exploreClickCount: 0,
        shownSofaCornerHint: false, // 是否已触发过沙发角落提示
        lookAroundCount: 0,
        hasNote: false,
        hasDiary: false,
        drawerOpened: false,
        seenWindowClue: false,
        photoWallSeen: false,
        sofaScratchSeen: false,
        toyCountSeen: false
    }
};

// 对话框继续回调
let dialogContinueCallback = null;

// 切换调试模式
window.toggleDebugMode = function() {
    gameState.debugMode = !gameState.debugMode;
    document.body.classList.toggle('debug-mode');
    const btn = document.getElementById('debug-toggle');
    btn.textContent = gameState.debugMode ? '🔧 关闭调试' : '🔧 调试模式';
};

// 房间中的可交互对象
const roomObjects = [
    { id: 'door',       x: '3%',  y: '45%', width: '10%', height: '30%', label: '门',   onClick: interactDoor },
    { id: 'window',     x: '35%', y: '20%', width: '25%', height: '35%', label: '窗户', onClick: interactWindow },
    { id: 'sofa',       x: '15%', y: '65%', width: '30%', height: '20%', label: '沙发', onClick: interactSofa },
    { id: 'table',      x: '55%', y: '68%', width: '25%', height: '18%', label: '桌子', onClick: interactTable },
    { id: 'clock',      x: '88%', y: '25%', width: '10%', height: '15%', label: '时钟', onClick: interactClock },
    { id: 'drawer',     x: '52%', y: '50%', width: '8%',  height: '10%', label: '抽屉', onClick: interactDrawer },
    { id: 'photo-wall', x: '14%', y: '20%', width: '18%', height: '30%', label: '照片墙', onClick: interactPhotoWall },
    { id: 'toys',       x: '60%', y: '82%', width: '15%', height: '10%', label: '猫玩具', onClick: interactToys }
];

// 打字机效果变量
let typewriterTimeout = null;
let currentFullText = '';

// 检测是否是移动端
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

// 竖屏拖动支持：让玩家拖动 game-container 查看画面两侧
function setupPortraitDrag() {
    const container = document.getElementById('game-container');
    let startX = 0, startLeft = 0, moved = false, active = false;
    const DRAG_THRESHOLD = 8;

    function getLeft() {
        return parseFloat(container.style.left) || 0;
    }

    function clampLeft(val) {
        const containerW = window.innerHeight * 14 / 9;
        const screenW = window.innerWidth;
        const minOffset = -(containerW - screenW);
        return Math.min(0, Math.max(minOffset, val));
    }

    container.addEventListener('touchstart', function(e) {
        if (window.innerWidth >= window.innerHeight) return;
        startX = e.touches[0].clientX;
        startLeft = getLeft();
        moved = false;
        active = true;
    }, { passive: true });

    container.addEventListener('touchmove', function(e) {
        if (!active || window.innerWidth >= window.innerHeight) return;
        if (isHolding) { active = false; return; } // 笔筒拖动中，放弃本次页面拖动
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

// 竖屏时将容器滚动到水平居中位置
function centerViewport() {
    if (window.innerWidth >= window.innerHeight) return;
    const container = document.getElementById('game-container');
    const containerW = window.innerHeight * 14 / 9;
    const screenW = window.innerWidth;
    container.style.left = -((containerW - screenW) / 2) + 'px';
}

// 显示拖动提示（竖屏时）
function showDragHint() {
    if (window.innerWidth >= window.innerHeight) return;
    const existing = document.getElementById('drag-hint');
    if (existing) existing.remove();
    const hint = document.createElement('div');
    hint.id = 'drag-hint';
    hint.textContent = '← 左右滑动查看完整画面 →';
    document.body.appendChild(hint);
    setTimeout(() => hint.remove(), 3000);
}

function startGame() {
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('game-play').classList.remove('hidden');

    if (isMobileDevice()) {
        setupPortraitDrag();
        centerViewport();
        showDragHint();
    }

    // 显示桌子上的笔筒和热点
    const penHolderImage = document.getElementById('pen-holder-image');
    const penHolderHotspot = document.getElementById('pen-holder-hotspot');

    penHolderImage.classList.remove('hidden');
    penHolderHotspot.classList.remove('hidden');

    console.log('笔筒图片元素:', penHolderImage);
    console.log('笔筒热点元素:', penHolderHotspot);
    console.log('热点位置:', penHolderHotspot.style.cssText);

    // 笔筒长按摇晃交互
    setupPenHolderInteraction();

    document.getElementById('inventory-toggle').onclick = toggleInventory;

    document.getElementById('game-play').addEventListener('click', function(e) {
        // 如果对话框正在显示，优先处理对话框点击
        const dialogBox = document.getElementById('dialog-box');
        if (!dialogBox.classList.contains('hidden')) {
            handleDialogClick();
            return;
        }

        // 如果选项框正在显示，不处理其他点击
        const choiceBox = document.getElementById('choice-box');
        if (!choiceBox.classList.contains('hidden')) {
            return;
        }

        // 排除物品栏和密码框的点击
        if (e.target.closest('#inventory-toggle') ||
            e.target.closest('#inventory-panel') ||
            e.target.closest('#password-modal') ||
            e.target.closest('#drawer-modal')) {
            return;
        }

        // 调试：显示点击位置（考虑滚动偏移）
        const roomScene = document.getElementById('room-scene');
        const rect = roomScene.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const x = ((e.clientX - rect.left + scrollLeft) / rect.width * 100).toFixed(0) + '%';
        const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(0) + '%';
        console.log('点击位置:', x, y, '滚动偏移:', scrollLeft);
    });
    
    // 移动端触摸事件处理
    document.getElementById('game-play').addEventListener('touchend', function(e) {
        // 如果触摸起源于笔筒热点，忽略（防止误关对话框）
        if (e.target.closest('#pen-holder-hotspot')) {
            return;
        }

        // 如果对话框正在显示，优先处理对话框点击
        const dialogBox = document.getElementById('dialog-box');
        if (!dialogBox.classList.contains('hidden')) {
            e.preventDefault();
            handleDialogClick();
            return;
        }

        // 如果选项框正在显示，不处理其他点击
        const choiceBox = document.getElementById('choice-box');
        if (!choiceBox.classList.contains('hidden')) {
            return;
        }

        // 排除物品栏和密码框的点击
        if (e.target.closest('#inventory-toggle') ||
            e.target.closest('#inventory-panel') ||
            e.target.closest('#password-modal') ||
            e.target.closest('#drawer-modal') ||
            e.target.closest('.hotspot')) {
            return;
        }

        // 选择"继续探索房间"后，非沙发点击计数3次后给提示
        if (gameState.flags.exploringAfterBite) {
            gameState.flags.exploreClickCount++;
            if (gameState.flags.exploreClickCount >= 3) {
                gameState.flags.exploringAfterBite = false;
                showDialog('你在房间里转了一圈，却始终心神不宁，脑海中一直浮现着朵朵躲进沙发角落的画面……', () => {
                    showChoices([
                        {
                            text: '🛋️ 回到沙发角落查看',
                            callback: () => openSofaCornerScene()
                        },
                        {
                            text: '🔎 再探索一会儿',
                            callback: () => {
                                gameState.flags.exploringAfterBite = true;
                                gameState.flags.exploreClickCount = 0;
                                createRoomHotspots();
                            }
                        }
                    ]);
                });
            }
        }
    });

    showDialog(
        '你醒来时，发现自己身处国权路333弄，也就是自己的家中。\n\n四周是熟悉的环境，但是却又有些说不出的违和感，好像有什么东西原本不属于这里。\n\n你的头有点晕，你只记得梦中的朵朵会说话，一直在说"猫咪神藏"这四个字，你刚想问个究竟，就醒了。',
        () => showDialog(
            '你晃了晃头，准备先出去看看，却发现门被锁住了。口袋里的手机也不知所踪，大声呼喊也无人应答。\n\n你决定先在房间里调查一下，看看有没有钥匙或者有没有出去的方法。',
            () => createRoomHotspots()
        )
    );
}

// 对话框点击处理
function handleDialogClick() {
    if (typewriterTimeout) {
        clearTimeout(typewriterTimeout);
        typewriterTimeout = null;
        document.getElementById('dialog-text').textContent = currentFullText;
    } else if (dialogContinueCallback) {
        const callback = dialogContinueCallback;
        dialogContinueCallback = null;
        document.getElementById('dialog-box').classList.add('hidden');
        callback();
    } else {
        document.getElementById('dialog-box').classList.add('hidden');
    }
}

// 显示对话框
function showDialog(text, callback = null) {
    if (typewriterTimeout) {
        clearTimeout(typewriterTimeout);
        typewriterTimeout = null;
    }
    const dialogBox = document.getElementById('dialog-box');
    const dialogText = document.getElementById('dialog-text');

    dialogBox.classList.remove('hidden');
    currentFullText = text;
    dialogContinueCallback = callback;

    dialogText.textContent = '';
    let i = 0;

    function typeWriter() {
        if (i < text.length) {
            dialogText.textContent += text.charAt(i);
            i++;
            typewriterTimeout = setTimeout(typeWriter, 30);
        } else {
            typewriterTimeout = null;
        }
    }
    typeWriter();
}

// 笔筒摇晃交互状态
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

// 竖屏旋转模式检测（iOS 移动端在竖屏下使用 CSS 旋转）
function isPortraitRotated() {
    const html = document.documentElement;
    return html.classList.contains('ios-device') &&
           html.classList.contains('mobile-device') &&
           window.matchMedia('(orientation: portrait)').matches;
}

// 获取摇晃检测轴的值：竖屏旋转时用Y轴，横屏用X轴
function getShakeAxisVal(clientX, clientY) {
    return isPortraitRotated() ? clientY : clientX;
}

// 将屏幕位移转换为容器坐标系位移（用于视觉跟随）
// 容器旋转90度时：容器X = 屏幕Y，容器Y = -屏幕X
function getContainerDelta(screenDX, screenDY) {
    if (isPortraitRotated()) {
        return { x: screenDY, y: -screenDX };
    }
    return { x: screenDX, y: screenDY };
}

function setupPenHolderInteraction() {
    if (penHolderInteractionSetup) return;
    penHolderInteractionSetup = true;

    const penHolderImage = document.getElementById('pen-holder-image');
    const penHolderHotspot = document.getElementById('pen-holder-hotspot');

    if (!penHolderHotspot || !penHolderImage) {
        console.error('❌ 找不到笔筒元素！');
        return;
    }

    const MIN_DRAG = 20;   // 最小累计移动距离，低于此视为点击不计数
    const SHAKE_DIST = 35; // 每次方向移动超过此距离才算一次摇晃

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
            showDialog('松手了，钢笔还在笔筒里。再试一次吧！');
        }
    }

    // 鼠标事件
    penHolderHotspot.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        onDragStart(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', function(e) {
        if (!isHolding) return;
        onDragMove(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', function() {
        onDragEnd();
    });

    // 触摸事件（passive: false 确保 preventDefault 生效）
    penHolderHotspot.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const t = e.touches[0];
        onDragStart(t.clientX, t.clientY);
        // 标记本次触摸起源于笔筒，防止 touchend 冒泡到 game-play 时误关对话框
        e.currentTarget._penHolderTouch = true;
    }, { passive: false });

    penHolderHotspot.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
    }, { passive: false });

    const gameContainer = document.getElementById('game-container');
    gameContainer.addEventListener('touchmove', function(e) {
        if (!isHolding) return;
        e.preventDefault();
        const t = e.touches[0];
        onDragMove(t.clientX, t.clientY);
    }, { passive: false });

    gameContainer.addEventListener('touchend', function() {
        onDragEnd();
    });

    document.addEventListener('touchend', function() {
        onDragEnd();
    });

    console.log('✅ 笔筒拖动事件已绑定');
}

function shakePenHolder() {
    if (shakeCount >= 3) return;

    const penHolder = document.getElementById('pen-holder-image');
    const penImage = document.getElementById('pen-image');

    shakeCount++;
    console.log('摇晃触发, 次数:', shakeCount);

    // 摇晃动画（基于当前偏移位置）
    penHolder.style.setProperty('--tx', currentOffsetX + 'px');
    penHolder.style.setProperty('--ty', currentOffsetY + 'px');
    penHolder.classList.add('shaking');
    setTimeout(() => penHolder.classList.remove('shaking'), 500);

    // 摇晃3次后钢笔掉落
    if (shakeCount >= 3) {
        isHolding = false;
        setTimeout(() => {
            gameState.penFallen = true;
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

// 显示选项
function showChoices(choices) {
    if (typewriterTimeout) {
        clearTimeout(typewriterTimeout);
        typewriterTimeout = null;
    }

    document.getElementById('dialog-box').classList.add('hidden');
    const choiceBox = document.getElementById('choice-box');
    const choiceButtons = document.getElementById('choice-buttons');

    choiceButtons.innerHTML = '';
    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice.text;
        btn.onclick = () => {
            choiceBox.classList.add('hidden');
            choice.callback();
        };
        choiceButtons.appendChild(btn);
    });

    choiceBox.classList.remove('hidden');
}

// 清除热点
function clearHotspots() {
    document.getElementById('hotspots').innerHTML = '';
}

// 创建热点
function createHotspot(id, label, x, y, width, height, onClick) {
    const hotspot = document.createElement('div');
    hotspot.className = 'hotspot';
    hotspot.style.cssText = `left:${x};top:${y};width:${width};height:${height};z-index:100;`;
    hotspot.dataset.id = id;
    hotspot.dataset.label = label;
    hotspot.title = label;

    const handler = function(e) {
        if (!document.getElementById('dialog-box').classList.contains('hidden')) return;
        e.stopPropagation();
        e.preventDefault();
        onClick();
    };
    hotspot.addEventListener('click', handler, true);

    // 移动端：touchstart 记录起点，touchend 判断是否为点击（未滑动）
    let _touchStartX = 0, _touchStartY = 0;
    hotspot.addEventListener('touchstart', function(e) {
        _touchStartX = e.touches[0].clientX;
        _touchStartY = e.touches[0].clientY;
    }, { passive: true });
    hotspot.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].clientX - _touchStartX;
        const dy = e.changedTouches[0].clientY - _touchStartY;
        if (Math.sqrt(dx * dx + dy * dy) > 8) return; // 滑动，忽略
        handler(e);
    }, true);
    document.getElementById('hotspots').appendChild(hotspot);
}

// 创建房间热点区域
function createRoomHotspots() {
    clearHotspots();
    roomObjects.forEach(obj => {
        createHotspot(obj.id, obj.label, obj.x, obj.y, obj.width, obj.height, obj.onClick);
    });
}

// 非沙发对象的通用搜索计数（用于触发情节片段一）
function countSearch() {
    if (!gameState.flags.foundCat) {
        gameState.searchCount++;
    }
}

// 被咬后继续探索时，非沙发点击计数，超过3次给提示
// 返回 true 表示已触发提示，调用方应 return
function tickExploreAfterBite() {
    if (!gameState.flags.exploringAfterBite) return false;
    gameState.flags.exploreClickCount++;
    if (gameState.flags.exploreClickCount >= 3) {
        gameState.flags.exploringAfterBite = false;
        showDialog('你在房间里转了一圈，却始终心神不宁，脑海中一直浮现着朵朵躲进沙发角落的画面……那里好像有什么东西。', () => createRoomHotspots());
        return true;
    }
    return false;
}

// 记录对象被点击，检查是否所有对象都被点击过（用于触发沙发角落提示）
// 只计入初始探索阶段的6个对象，照片墙和玩具不参与
const ALL_INTERACTIVE_OBJECTS = ['door', 'window', 'sofa', 'table', 'clock', 'drawer', 'photo-wall', 'toys'];
const INITIAL_EXPLORE_OBJECTS = ['door', 'window', 'sofa', 'table', 'clock', 'drawer'];

function trackObjectClick(id, afterCallback) {
    // 只在游戏初始阶段（未发现猫咪前）追踪
    if (gameState.flags.foundCat) {
        if (afterCallback) afterCallback();
        return;
    }

    // 已触发过提示后，进入 lookAround 模式
    if (gameState.flags.shownSofaCornerHint) {
        // 点沙发：由 interactSofa 单独处理，这里不计数
        if (id === 'sofa') {
            if (afterCallback) afterCallback();
            return;
        }
        // 点其他地方：计数，满3次触发提示
        gameState.flags.lookAroundCount = (gameState.flags.lookAroundCount || 0) + 1;
        if (gameState.flags.lookAroundCount >= 3) {
            gameState.flags.lookAroundCount = 0;
            if (afterCallback) {
                afterCallback(() => triggerSofaCornerHint());
            } else {
                triggerSofaCornerHint();
            }
        } else {
            if (afterCallback) afterCallback();
        }
        return;
    }

    gameState.clickedObjects.add(id);
    const allClicked = INITIAL_EXPLORE_OBJECTS.every(obj => gameState.clickedObjects.has(obj));
    if (allClicked) {
        gameState.flags.shownSofaCornerHint = true;
        gameState.flags.lookAroundCount = 0;
        if (afterCallback) {
            afterCallback(() => triggerSofaCornerHint());
        } else {
            triggerSofaCornerHint();
        }
    } else {
        if (afterCallback) afterCallback();
    }
}

function triggerSofaCornerHint() {
    showDialog('你把房间里能看的地方都看了一遍，却始终没有头绪……忽然，你注意到沙发的角落似乎有什么东西，要不要去看看？', () => {
        showChoices([
            {
                text: '🛋️ 去沙发角落看看',
                callback: () => openSofaCornerScene()
            },
            {
                text: '🔎 再仔细找找',
                callback: () => {
                    gameState.flags.lookAroundCount = 0;
                    createRoomHotspots();
                }
            }
        ]);
    });
}

// 打开沙发角落场景
function openSofaCornerScene() {
    clearHotspots();
    document.getElementById('dialog-box').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
    closeCornerUI();
    document.getElementById('sofa-corner-scene').classList.remove('hidden');
    centerViewport();
    showDragHint();

    const catImg = document.getElementById('sofa-corner-cat');
    const bump = document.getElementById('sofa-corner-bump');

    // 根据状态决定场景内可交互元素
    if (!gameState.flags.foundCat) {
        // 猫咪还在，先展示发现文案，再设置点击
        catImg.classList.remove('hidden');
        bump.onclick = null;
        catImg.onclick = null;
        showDialog('你走近沙发角落，发现朵朵正蜷缩在那里，她懒洋洋地翻了个身，露出了肚皮……', () => {
            catImg.onclick = function() {
                catImg.onclick = null;
                gameState.flags.foundCat = true;
                gameState.flags.wasBitten = true;
                catImg.classList.add('hidden');
                showDialog(
                    '你蹲下来想摸摸朵朵，没想到朵朵突然抱住你的手，对你又咬又挠！你赶紧把手抽了回来，看了看手上的爪子印以及牙印，再看向沙发时，朵朵早已不见踪影。',
                    () => setupBumpInteraction()
                );
            };
        });
    } else {
        // 猫咪已离开，直接显示凸起
        catImg.classList.add('hidden');
        setupBumpInteraction();
    }
}

function setupBumpInteraction() {
    closeCornerUI();
    const bump = document.getElementById('sofa-corner-bump');

    if (gameState.flags.hasBox) {
        bump.onclick = function() {
            showDialog('沙发角落已经被你打开过了，没有什么新的发现了。');
        };
        return;
    }

    if (!gameState.flags.foundBump) {
        bump.onclick = function() {
            gameState.flags.foundBump = true;
            showDialog(
                '你来到朵朵刚刚躲藏的沙发角落，突然发现有一个凸起，不仔细看还真看不出来。\n\n你充满疑惑，得想办法把它打开看看里面是什么，但是你没有工具，得在桌子上找找有没有可以用的东西。',
                () => setupBumpInteraction()
            );
        };
        return;
    }

    if (gameState.inventory.includes('钢笔')) {
        bump.onclick = function() {
            showDialog(
                '你看着这个凸起，手中的钢笔似乎可以派上用场……',
                () => showChoices([
                    {
                        text: '✂️ 用钢笔划开沙发',
                        callback: () => {
                            gameState.inventory.push('铁盒');
                            gameState.flags.hasBox = true;
                            updateInventory();
                            showDialog(
                                '你用钢笔把沙发划开一个洞，露出藏在里面的铁盒。你很奇怪怎么会有一个铁盒在沙发里，但也想不了这么多了。\n\n铁盒旁边，沙发内衬上有4道深深的抓痕，那是朵朵的杰作——她把这里当成了自己的秘密基地。',
                                () => {
                                    gameState.flags.sofaScratchSeen = true;
                                    showDialog(
                                        '你把铁盒拿了出来，发现铁盒被一个五位字母密码的锁锁住了，你觉得出去的钥匙可能就在这个盒子里面，于是便开始调查盒子的四周，看看有什么线索。',
                                        () => {
                                            bump.onclick = null;
                                            showDialog('就在这时，你听到抽屉那边好像有动静……', () => createRoomHotspots());
                                        }
                                    );
                                }
                            );
                        }
                    },
                    {
                        text: '🤔 再想想其他办法',
                        callback: () => {
                            showDialog('你犹豫了一下，决定先不破坏沙发，也许还有其他办法。');
                        }
                    }
                ])
            );
        };
    } else {
        bump.onclick = function() {
            showDialog('这里有个奇怪的凸起……得找个工具才能打开它。');
        };
    }
}

function closeCornerUI() {
    document.getElementById('dialog-box').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
}

// 关闭沙发角落场景，返回主场景
function closeSofaCornerScene() {
    closeCornerUI();
    document.getElementById('sofa-corner-scene').classList.add('hidden');
    document.getElementById('sofa-corner-cat').onclick = null;
    centerViewport();
    createRoomHotspots();
}

// 交互函数
function interactDoor() {
    if (tickExploreAfterBite()) return;
    if (gameState.inventory.includes('钥匙')) {
        showDialog(
            '你手握钥匙站在门前，这把钥匙来之不易。你回想起整个过程，脑海中"watch"这个词又浮现出来……要直接出去，还是再查看一下那个时钟？',
            () => showChoices([
                {
                    text: '🚪 直接开门出去！',
                    callback: () => {
                        showDialog(
                            '你拿着钥匙，赶紧到门口试了试，果然是房门钥匙，你按耐不住兴奋的心情，赶紧走出大门，却只觉得一阵头晕目眩，昏了过去。\n\n昏迷时，你做了一个梦，梦里朵朵一直在说"猫咪神藏"，你不知道什么时候才能醒来。',
                            () => showEnding('cycle')
                        );
                    }
                },
                {
                    text: '🕐 先去查看一下那个时钟',
                    callback: () => {
                        showDialog('你决定先查看时钟，感觉还有什么没搞清楚……', () => createRoomHotspots());
                    }
                }
            ])
        );
    } else if (gameState.flags.wasBitten && !gameState.flags.shownHelpless) {
        countSearch();
        trackObjectClick('door');
        showHelpless();
    } else {
        countSearch();
        trackObjectClick('door', (next) => {
            showDialog('你尝试打开门，但是门被锁住了。需要找到钥匙才能打开。', next);
        });
    }
}

function interactWindow() {
    if (tickExploreAfterBite()) return;
    if (gameState.flags.hasDiary) {
        openWindowScene();
    } else if (gameState.flags.wasBitten && !gameState.flags.shownHelpless) {
        countSearch();
        trackObjectClick('window');
        showHelpless();
    } else {
        countSearch();
        trackObjectClick('window', (next) => {
            showDialog('你尝试打开窗户，但是窗户是锁死的，怎么也打不开。', next);
        });
    }
}

function interactDrawer() {
    if (tickExploreAfterBite()) return;
    if (gameState.flags.wasBitten && !gameState.flags.shownHelpless) {
        countSearch();
        trackObjectClick('drawer');
        showHelpless();
    } else if (gameState.flags.hasNote && !gameState.flags.drawerOpened) {
        openDrawerModal();
    } else if (gameState.flags.drawerOpened) {
        openDrawerScene();
    } else if (gameState.flags.hasBox) {
        showDialog('抽屉不知什么时候多了一把密码锁。');
    } else {
        countSearch();
        trackObjectClick('drawer', (next) => {
            showDialog('抽屉是锁住的，怎么也打不开。', next);
        });
    }
}

let _pendingPhotoWallHint = null;

function interactPhotoWall() {
    if (tickExploreAfterBite()) return;
    if (gameState.flags.wasBitten && !gameState.flags.shownHelpless) {
        countSearch();
        trackObjectClick('photo-wall');
        showHelpless();
        return;
    }
    countSearch();
    trackObjectClick('photo-wall', (next) => {
        _pendingPhotoWallHint = next || null;
        openPhotoWallScene();
    });
}

function interactToys() {
    if (tickExploreAfterBite()) return;
    if (gameState.flags.wasBitten && !gameState.flags.shownHelpless) {
        countSearch();
        trackObjectClick('toys');
        showHelpless();
        return;
    }
    countSearch();
    trackObjectClick('toys', (next) => {
        gameState.flags.toyCountSeen = true;
        showDialog('地板上散落着朵朵的玩具：一个毛线球、一个铃铛球、还有一条小鱼。主人把她最爱的3个玩具都留在这里了。', next);
    });
}

function openPhotoWallScene() {
    clearHotspots();
    document.getElementById('dialog-box').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
    document.getElementById('photo-wall-scene').classList.remove('hidden');
    centerViewport();
    showDragHint();

    gameState.flags.photoWallSeen = true;

    const photo1 = document.getElementById('photo-wall-photo1');
    const photo2 = document.getElementById('photo-wall-photo2');
    const photo3 = document.getElementById('photo-wall-photo3');

    function bindPhotoClick(el, text) {
        let _tx = 0, _ty = 0;
        el.addEventListener('touchstart', function(e) {
            _tx = e.touches[0].clientX;
            _ty = e.touches[0].clientY;
        }, { passive: true });
        el.addEventListener('touchend', function(e) {
            e.stopPropagation();
            const dx = e.changedTouches[0].clientX - _tx;
            const dy = e.changedTouches[0].clientY - _ty;
            if (Math.sqrt(dx * dx + dy * dy) > 8) return;
            showDialog(text);
        });
        el.onclick = function() { showDialog(text); };
    }

    bindPhotoClick(photo1, '2022年，朵朵刚来，还是个小猫咪。');
    bindPhotoClick(photo2, '2024年，朵朵2岁了，越来越懒了。');
    bindPhotoClick(photo3, '2026年，朵朵4岁了，还是那么爱赖在沙发角落。');
}

function closePhotoWallScene() {
    document.getElementById('photo-wall-scene').classList.add('hidden');
    centerViewport();
    const hint = _pendingPhotoWallHint;
    _pendingPhotoWallHint = null;
    if (hint) {
        hint();
    } else {
        createRoomHotspots();
    }
}

function interactTable() {
    if (tickExploreAfterBite()) return;
    if (gameState.flags.wasBitten && !gameState.flags.shownHelpless) {
        countSearch();
        trackObjectClick('table');
        showHelpless();
        return;
    }

    // 如果钢笔还没掉落，提示玩家查看笔筒
    if (!gameState.penFallen && !gameState.inventory.includes('钢笔')) {
        countSearch();
        trackObjectClick('table', (next) => {
            showDialog('桌子上放着一些书本、一个杯子，还有一个笔筒。笔筒里似乎有支钢笔。', next);
        });
        return;
    }

    // 钢笔已经掉落，可以拾取
    if (gameState.penFallen && !gameState.inventory.includes('钢笔')) {
        trackObjectClick('table');
        showDialog('你从地上捡起了钢笔。这应该可以作为工具使用。');
        document.getElementById('pen-image').classList.add('hidden');
        gameState.inventory.push('钢笔');
        updateInventory();
    } else if (gameState.inventory.includes('钢笔')) {
        trackObjectClick('table');
        showDialog('桌子上已经没有什么有用的东西了。');
    } else {
        trackObjectClick('table', (next) => {
            showDialog('桌子上放着一些书本和杯子，没有什么特别的。', next);
        });
    }
}

function interactClock() {
    if (tickExploreAfterBite()) return;
    if (gameState.flags.solvedPassword && gameState.flags.seenWindowClue && !gameState.flags.lookedAtClock) {
        gameState.flags.lookedAtClock = true;
        showDialog(
            '朵朵的目光终点……你把时钟从墙上拿了下来，时钟奇怪的重量让你觉得肯定有东西，你把时钟打开，一道金光顿时把你包围……',
            () => showEnding('treasure')
        );
    } else if (gameState.flags.solvedPassword && !gameState.flags.seenWindowClue) {
        trackObjectClick('clock');
        showDialog('墙上挂着一个时钟，指针正在走动……你总觉得它和什么有关，但还没想清楚。');
    } else if (gameState.flags.wasBitten && !gameState.flags.shownHelpless) {
        countSearch();
        trackObjectClick('clock');
        showHelpless();
    } else {
        countSearch();
        trackObjectClick('clock', (next) => {
            showDialog('墙上挂着一个时钟，指针正在走动……', next);
        });
    }
}

function interactSofa() {
    // 被咬后或已知凸起，点沙发直接进角落场景
    if (gameState.flags.wasBitten || gameState.flags.foundBump) {
        openSofaCornerScene();
        return;
    }

    // 已触发提示后，点沙发再次弹出选项
    if (gameState.flags.shownSofaCornerHint) {
        showDialog('你又看了看沙发，总觉得角落那里有什么东西……要不还是去看看？', () => {
            showChoices([
                {
                    text: '🛋️ 去沙发角落看看',
                    callback: () => openSofaCornerScene()
                },
                {
                    text: '🔎 再找找其他地方',
                    callback: () => {
                        gameState.flags.lookAroundCount = 0;
                        createRoomHotspots();
                    }
                }
            ]);
        });
        return;
    }

    // 普通交互，追踪点击
    trackObjectClick('sofa', (next) => {
        showDialog('你调查了一下沙发，没有发现什么特别的东西。', next);
    });
}

// 情节片段四：无助
function showHelpless() {
    gameState.flags.shownHelpless = true;
    showDialog(
        '你决定继续翻找逃出去的线索，但是两个小时过去了，没一个抽屉能打开的，能翻的地方都翻过了，什么线索也没有，窗户也打不开，也找不到任何可以用的工具，空无一人的密闭房间让你紧张起来，这可怎么办？\n\n你下意识地把手伸进口袋想找手机，但是口袋里也什么都没有。',
        () => createRoomHotspots()
    );
}

// 更新物品栏
function updateInventory() {
    const inventoryItems = document.getElementById('inventory-items');
    inventoryItems.innerHTML = '';

    gameState.inventory.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        itemDiv.innerHTML = `<span class="item-icon">📦</span>${item}`;
        itemDiv.style.cursor = 'pointer';
        itemDiv.onclick = () => {
            if (item === '铁盒' && !gameState.flags.solvedPassword) {
                // 情节片段七：查看铁盒底部线索
                showDialog(
                    '突然你注意到了盒子底部有一个猫咪抱着手又咬又踢的图案，有点眼熟，你看向被朵朵咬过的左手，不看不知道，五排数量不规则的圆孔牙印和五排断断续续的爪子道道出现在你的眼前，这朵朵，也太野蛮了！\n\n等等，正好4排？你看向朵朵留下的痕迹，又看向铁盒上的四位密码，突然有一个念头闪过，不会吧？这痕迹越看越像某种密码，要不试试？\n\n（五排痕迹分别为：.--；.-；-；-.-.；....）',
                    () => {
                        document.getElementById('inventory-panel').classList.add('hidden');
                        openPasswordModal();
                    }
                );
            } else if (item === '钥匙') {
                showDialog('你有一把钥匙，可以用来开门。');
            } else if (item === '铁盒') {
                showDialog('盒子已经打开了，里面的钥匙已经取出来了。');
            } else if (item === '纸条') {
                showDialog('纸条上写着：\n"朵朵的秘密\n\n她陪我走过的岁月，是第一把钥匙。\n她留在这里的印记，是第二把钥匙。\n她最爱的那些小东西，是第三把钥匙。\n\n三把钥匙，从大到小。"');
            } else if (item === '日记') {
                showDialog('日记封面上写着"献给朵朵"。\n\n"朵朵来的那天，我买了一个新时钟挂在墙上，想着以后每天看着时间流逝，也有她陪着。\n\n她最喜欢的时刻是下午三点，那时候阳光从窗户斜射进来，她会从沙发角落走到窗台，然后回头看我一眼，再看向那个方向。\n\n我把最重要的东西，藏在了她目光的终点。那里，时间从不停歇。"');
            } else {
                showDialog(`这是${item}。`);
            }
        };
        inventoryItems.appendChild(itemDiv);
    });
}

// 切换物品栏
function toggleInventory() {
    document.getElementById('inventory-panel').classList.toggle('hidden');
}

// 抽屉密码弹窗
function openDrawerModal() {
    document.getElementById('drawer-modal').classList.remove('hidden');
    document.getElementById('drawer-input').value = '';
    document.getElementById('drawer-input').focus();
}

function closeDrawerModal() {
    document.getElementById('drawer-modal').classList.add('hidden');
}

function submitDrawerPassword() {
    const input = document.getElementById('drawer-input');
    const password = input.value.trim();
    if (password === '443') {
        closeDrawerModal();
        gameState.flags.drawerOpened = true;
        showDialog('你输入了密码443，抽屉缓缓打开了……', () => openDrawerScene());
    } else {
        alert('密码错误，请再试一次');
        input.value = '';
        input.focus();
    }
}

// 抽屉特写场景
function openDrawerScene() {
    clearHotspots();
    document.getElementById('dialog-box').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
    document.getElementById('drawer-scene').classList.remove('hidden');
    centerViewport();
    showDragHint();

    const hotspot = document.getElementById('drawer-diary-hotspot');
    if (!gameState.flags.hasDiary) {
        hotspot.onclick = function() {
                showDialog('这是一本旧日记，封面上写着"献给朵朵"……', () => {
                gameState.flags.hasDiary = true;
                if (!gameState.inventory.includes('日记')) {
                    gameState.inventory.push('日记');
                    updateInventory();
                }
                showDialog('你获得了日记。');
            });
        };
    } else {
        hotspot.onclick = function() {
            showDialog('日记已经拿走了。');
        };
    }
}

function closeDrawerScene() {
    document.getElementById('drawer-scene').classList.add('hidden');
    centerViewport();
    createRoomHotspots();
}

// 窗户特写场景
function openWindowScene() {
    clearHotspots();
    document.getElementById('dialog-box').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
    document.getElementById('window-scene').classList.remove('hidden');
    centerViewport();
    showDragHint();

    showDialog('窗台上有朵朵留下的毛发和爪印。你想起日记里写的：她总是从这里凝视着某个方向……顺着她的视线望去，那个方向是……', () => {
        function showWindowChoices() {
            showChoices([
                {
                    text: '🚪 门',
                    callback: () => showDialog('不对，朵朵的视线不在那里……', () => showWindowChoices())
                },
                {
                    text: '🕐 时钟',
                    callback: () => {
                        gameState.flags.seenWindowClue = true;
                        showDialog('对了！朵朵每天下午都从这里凝视着那个时钟……', () => closeWindowScene());
                    }
                },
                {
                    text: '🪑 桌子',
                    callback: () => showDialog('不对，朵朵的视线不在那里……', () => showWindowChoices())
                }
            ]);
        }
        showWindowChoices();
    });
}

function closeWindowScene() {
    document.getElementById('window-scene').classList.add('hidden');
    centerViewport();
    createRoomHotspots();
}

// 打开密码输入框
function openPasswordModal() {
    document.getElementById('password-modal').classList.remove('hidden');
    document.getElementById('password-input').value = '';
    document.getElementById('password-input').focus();
}

// 关闭密码输入框
function closePasswordModal() {
    document.getElementById('password-modal').classList.add('hidden');
}

// 提交密码
function submitPassword() {
    const input = document.getElementById('password-input');
    const password = input.value.toLowerCase();

    if (password === 'watch') {
        closePasswordModal();
        gameState.flags.solvedPassword = true;
        // 情节片段八：钥匙 + 纸条
        showDialog('你在密码锁上输入了正确密码：watch。噶哒一声，盒子打开了，里面有一把钥匙，还有一张折叠的纸条。');
        if (!gameState.inventory.includes('钥匙')) {
            gameState.inventory.push('钥匙');
        }
        if (!gameState.inventory.includes('纸条')) {
            gameState.flags.hasNote = true;
            gameState.inventory.push('纸条');
        }
        updateInventory();
    } else {
        alert('密码错误，请再试一次');
        input.value = '';
        input.focus();
    }
}

// 显示结局
function showEnding(type) {
    document.getElementById('game-play').classList.add('hidden');
    document.getElementById('ending-screen').classList.remove('hidden');

    const title = document.getElementById('ending-title');
    const text = document.getElementById('ending-text');

    if (type === 'cycle') {
        title.innerHTML = '❌ 结局一：轮回';
        text.innerHTML = '你拿着钥匙，赶紧到门口试了试，果然是房门钥匙，你按耐不住兴奋的心情，赶紧走出大门，却只觉得一阵头晕目眩，昏了过去。<br><br>昏迷时，你做了一个梦，梦里朵朵一直在说"猫咪神藏"，你不知道什么时候才能醒来。';
    } else {
        title.innerHTML = '✨ 结局二：猫咪神藏';
        text.innerHTML = '你看着钥匙陷入沉思，刚刚的密码总觉得有点奇怪，watch不就是表的意思吗？你环顾四周，目光停留在墙上挂的时钟上，家里与表有关的也就只有它了，你把时钟从墙上拿了下来，时钟奇怪的重量让你觉得肯定有东西，你把时钟打开，一道金光顿时把你包围，光芒散去，你发现自己已经躺在了沙发上，旁边朵朵正在呼呼大睡，你的手上也没有伤口，仿佛刚刚的都是一场梦。<br><br>但是手中抱着的时钟却又是那么真实，你将时钟翻了过来，原来这就是猫咪神藏，你笑了。';
    }
}

// 重新开始
function restartGame() {
    gameState.inventory = [];
    gameState.searchCount = 0;
    gameState.penFallen = false;
    gameState.clickedObjects = new Set();
    gameState.flags = {
        foundCat: false,
        wasBitten: false,
        shownHelpless: false,
        foundBump: false,
        hasBox: false,
        solvedPassword: false,
        lookedAtClock: false,
        exploringAfterBite: false,
        exploreClickCount: 0,
        shownSofaCornerHint: false,
        lookAroundCount: 0,
        hasNote: false,
        hasDiary: false,
        drawerOpened: false,
        seenWindowClue: false,
        photoWallSeen: false,
        sofaScratchSeen: false,
        toyCountSeen: false
    };

    document.getElementById('cat-image').classList.add('hidden');
    document.getElementById('pen-image').classList.add('hidden');
    document.getElementById('pen-holder-image').classList.add('hidden');
    document.getElementById('pen-holder-hotspot').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
    document.getElementById('ending-screen').classList.add('hidden');
    document.getElementById('title-screen').classList.remove('hidden');
    document.getElementById('game-play').classList.add('hidden');
    document.getElementById('inventory-panel').classList.add('hidden');
    document.getElementById('sofa-corner-scene').classList.add('hidden');
    document.getElementById('drawer-scene').classList.add('hidden');
    document.getElementById('window-scene').classList.add('hidden');
    document.getElementById('photo-wall-scene').classList.add('hidden');
    updateInventory();
}
