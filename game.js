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
        shownDrawerLockHint: false,
        memoryFragments: [],   // 记忆碎片，集齐5块触发真结局
        photoWallSeen: false,
        sofaScratchSeen: false,
        toyCountSeen: false,
        // 书架谜题
        bookshelfSeen: false,
        bookPuzzleSolved: false,   // 5本书谜题完成
        bookPuzzleStep: 0,         // 当前点击步骤
        hasCollar: false,
        // 音乐盒（书架第二阶段）
        musicBoxSolved: false,
        musicBoxStep: 0,
        // 食盆/画框谜题
        foodBowlSeen: false,
        paintingPuzzleSolved: false,
        paintingStep: 0,
        hasOwnerLetter: false,
        hasBowl: false,
        bowlZone: 0,        // 当前食盆对准的区域索引(0=未对准)
        paintingSymbolsFound: [],  // 已收集的符号
        // 玩具箱谜题
        toyBoxSeen: false,
        toyBoxSolved: false,
        toyBoxStep: 0,
        hasCatLetter: false,
        // 阳台
        balconySeen: false,
        hasLetter: false,
        // 阳台影子谜题
        clockTime: null,
        balconyClue1: false,
        balconyClue2: false,
        balconyBrickStep: 0,
        balconyBrickSolved: false,
        // 便利贴
        stickyNotes: [],
        albumUnlocked: false
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
    { id: 'photo-wall',  x: '14%', y: '20%', width: '18%', height: '30%', label: '照片墙',  onClick: interactPhotoWall },
    { id: 'toys',        x: '60%', y: '82%', width: '15%', height: '10%', label: '猫玩具',  onClick: interactToys },
    { id: 'bookshelf',   x: '75%', y: '35%', width: '12%', height: '30%', label: '书架',    onClick: interactBookshelf },
    { id: 'food-bowl',   x: '3%',  y: '78%', width: '8%',  height: '8%',  label: '食盆',    onClick: interactFoodBowl },
    { id: 'painting',    x: '60%', y: '18%', width: '8%',  height: '20%', label: '画',      onClick: interactPainting },
    { id: 'toy-box',     x: '82%', y: '76%', width: '10%', height: '8%',  label: '玩具箱',  onClick: interactToyBox }
];

// 打字机效果变量
let typewriterTimeout = null;
let currentFullText = '';

// 检测是否是移动端
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

// 移动端触摸点击绑定：手指抬起且未滑动才触发，阻止冒泡到 game-play
// el: 元素，handler: 回调，once: 是否只触发一次（默认 false）
function setTapHandler(el, handler, once) {
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
        if (Math.sqrt(dx * dx + dy * dy) > 8) return;
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
        if (!document.getElementById('dialog-box').classList.contains('hidden')) { active = false; return; } // 对话框开着时禁止拖动
        if (!document.getElementById('choice-box').classList.contains('hidden')) { active = false; return; } // 选项框开着时禁止拖动
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
}

function startGame() {
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('game-play').classList.remove('hidden');
    document.getElementById('inventory-toggle').classList.remove('hidden');
    document.getElementById('help-toggle').classList.remove('hidden');

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

    // 全局拦截：对话框或选项框开着时，阻止所有其他元素的点击/触摸
    function blockWhenOverlay(e) {
        const dialogBox = document.getElementById('dialog-box');
        const choiceBox = document.getElementById('choice-box');
        const dialogOpen = !dialogBox.classList.contains('hidden');
        const choiceOpen = !choiceBox.classList.contains('hidden');
        if (dialogOpen && !e.target.closest('#dialog-box')) {
            e.stopPropagation();
            e.preventDefault();
            handleDialogClick();
            return;
        }
        if (choiceOpen && !e.target.closest('#choice-box')) {
            e.stopPropagation();
            e.preventDefault();
        }
    }
    document.addEventListener('click', blockWhenOverlay, true);
    document.addEventListener('touchend', blockWhenOverlay, { capture: true, passive: false });

    // 对话框本身绑定点击/触摸，确保热点 stopPropagation 后仍能关闭
    const dialogBox = document.getElementById('dialog-box');
    dialogBox.addEventListener('click', function(e) {
        e.stopPropagation();
        handleDialogClick();
    });
    dialogBox.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleDialogClick();
    }, { passive: false });

    document.getElementById('game-play').addEventListener('click', function(e) {
        // 如果对话框正在显示，无论点哪里都关闭（子场景内也生效）
        const dialogBox = document.getElementById('dialog-box');
        if (!dialogBox.classList.contains('hidden')) {
            handleDialogClick();
            return;
        }
        // 如果点击起源于子场景内部（非主房间），忽略
        if (!e.target.closest('#room-scene') && !e.target.closest('#dialog-box') && !e.target.closest('#choice-box') && !e.target.closest('#inventory-toggle') && !e.target.closest('#inventory-panel')) {
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

        // 如果对话框正在显示，无论点哪里都关闭（子场景内也生效）
        const dialogBox = document.getElementById('dialog-box');
        if (!dialogBox.classList.contains('hidden')) {
            e.preventDefault();
            handleDialogClick();
            return;
        }

        // 如果触摸起源于子场景内部（非主房间），忽略
        if (!e.target.closest('#room-scene') && !e.target.closest('#dialog-box') && !e.target.closest('#choice-box') && !e.target.closest('#inventory-toggle') && !e.target.closest('#inventory-panel')) {
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

// 获取摇晃检测轴的值（水平轴）
function getShakeAxisVal(clientX, clientY) {
    return clientX;
}

// 屏幕位移直接映射到容器坐标系（无旋转）
function getContainerDelta(screenDX, screenDY) {
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
            showDialog('还差一点，再用力摇一摇！');
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

    // 遮罩：阻止选项框以外的所有交互
    let overlay = document.getElementById('choice-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'choice-overlay';
        document.getElementById('game-container').appendChild(overlay);
    }
    overlay.style.display = 'block';

    choiceButtons.innerHTML = '';
    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice.text;
        btn.onclick = () => {
            choiceBox.classList.add('hidden');
            overlay.style.display = 'none';
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
        if (!document.getElementById('choice-box').classList.contains('hidden')) return;
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

    // 便利贴1：桌子旁，游戏开始即可见
    if (!gameState.flags.stickyNotes.includes('note1')) {
        const hotspots = document.getElementById('hotspots');
        const note = document.createElement('div');
        note.id = 'sticky-note-1';
        note.style.cssText = 'position:absolute;left:53%;top:65%;font-size:24px;cursor:pointer;z-index:15;user-select:none;';
        note.textContent = '📝';
        note.title = '便利贴';
        note.addEventListener('click', (e) => {
            e.stopPropagation();
            note.remove();
            collectStickyNote('note1');
        });
        hotspots.appendChild(note);
    }
}

// 任意对象点击计数，双轨触发沙发角落引导
// countSearch 已废弃，计数统一在 trackObjectClick 里处理
function countSearch() {}

function trackObjectClick(id, afterCallback) {
    if (gameState.flags.foundCat) {
        if (afterCallback) afterCallback();
        return;
    }

    // 已触发过提示后，点沙发由 interactSofa 单独处理，其他地方每3次再提示一次
    if (gameState.flags.shownSofaCornerHint) {
        if (id === 'sofa') {
            if (afterCallback) afterCallback();
            return;
        }
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

    gameState.searchCount++;
    if (gameState.searchCount >= 6) {
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
    showDialog('你把房间里能看的地方都看了一遍，却始终没有头绪……忽然，你注意到沙发的角落似乎有什么东西。', () => {
        showChoices([
            { text: '🛋️ 去沙发角落看看', callback: () => openSofaCornerScene() },
            { text: '🔎 再仔细找找', callback: () => {
                gameState.flags.lookAroundCount = 0;
                createRoomHotspots();
            }}
        ]);
    });
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
    const scratch = document.getElementById('sofa-corner-scratch');

    scratch.classList.remove('hidden');
    setTapHandler(scratch, function() {
        showDialog('坏朵朵，又挠沙发！');
    });

    // 根据状态决定场景内可交互元素
    if (!gameState.flags.foundCat) {
        // 猫咪还在，先展示发现文案，再设置点击
        catImg.classList.remove('hidden');
        bump.onclick = null;
        catImg.onclick = null;
        showDialog('你走近沙发角落，发现朵朵正蜷缩在那里，她懒洋洋地翻了个身，露出了肚皮……', () => {
            setTapHandler(catImg, function() {
                catImg.onclick = null;
                gameState.flags.foundCat = true;
                gameState.flags.wasBitten = true;
                catImg.classList.add('hidden');
                showDialog(
                    '你蹲下来想摸摸朵朵，没想到朵朵突然抱住你的手，对你又咬又挠！你赶紧把手抽了回来，看了看手上的爪子印以及牙印，再看向沙发时，朵朵早已不见踪影。',
                    () => setupBumpInteraction()
                );
            }, true);
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
        setTapHandler(bump, function() {
            showDialog('沙发角落已经被你打开过了，没有什么新的发现了。');
        });
        return;
    }

    if (!gameState.flags.foundBump) {
        setTapHandler(bump, function() {
            gameState.flags.foundBump = true;
            if (gameState.inventory.includes('钢笔')) {
                showDialog(
                    '沙发角落有一个凸起，不仔细看还真看不出来。\n\n手里正好有钢笔，要试一下吗？',
                    () => setupBumpInteraction()
                );
            } else {
                showDialog(
                    '你来到朵朵刚刚躲藏的沙发角落，突然发现有一个凸起，不仔细看还真看不出来。\n\n你充满疑惑，得想办法把它打开看看里面是什么，但是你没有工具，得在桌子上找找有没有可以用的东西。',
                    () => setupBumpInteraction()
                );
            }
        });
        return;
    }

    if (gameState.inventory.includes('钢笔')) {
        setTapHandler(bump, function() {
            showChoices([
                {
                    text: '✂️ 用钢笔划开沙发',
                        callback: () => {
                            gameState.inventory.push('铁盒');
                            gameState.flags.hasBox = true;
                            updateInventory();
                            // 立即重绑定，防止重复拾取
                            setTapHandler(bump, function() {
                                showDialog('沙发角落已经被你打开过了，没有什么新的发现了。');
                            });
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
                ]);
        });
    } else {
        setTapHandler(bump, function() {
            showDialog('这里有个奇怪的凸起……得找个工具才能打开它。');
        });
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
    document.getElementById('sofa-corner-scratch').classList.add('hidden');
    centerViewport();
    createRoomHotspots();
}

// 交互函数
function interactDoor() {
    if (tickExploreAfterBite()) return;
    if (gameState.inventory.includes('钥匙')) {
        showDialog(
            '你手握钥匙站在门前。\n\n但你停下来了——这个房间里，还有很多东西没搞清楚。朵朵为什么躲在沙发角落？那张纸条说的三把钥匙是什么意思？主人去哪里了？\n\n要就这样离开，还是把一切都弄明白？',
            () => showChoices([
                {
                    text: '🚪 直接开门出去',
                    callback: () => {
                        showDialog(
                            '你拿着钥匙，赶紧到门口试了试，果然是房门钥匙，你按耐不住兴奋的心情，赶紧走出大门，却只觉得一阵头晕目眩，昏了过去。\n\n昏迷时，你做了一个梦，梦里朵朵一直在说"猫咪神藏"，你不知道什么时候才能醒来。',
                            () => showEnding('cycle')
                        );
                    }
                },
                {
                    text: '🔍 还有些事没搞清楚，再看看',
                    callback: () => {
                        showDialog('你把钥匙收好，转身回到房间。\n\n答案就在这里，你能感觉到。', () => createRoomHotspots());
                    }
                }
            ])
        );
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
    } else {
        countSearch();
        trackObjectClick('window', (next) => {
            showDialog('你尝试打开窗户，但是窗户是锁死的，怎么也打不开。', next);
        });
    }
}

function interactDrawer() {
    if (tickExploreAfterBite()) return;
    if (gameState.flags.hasNote && !gameState.flags.drawerOpened) {
        openDrawerModal();
    } else if (gameState.flags.drawerOpened) {
        openDrawerScene();
    } else if (gameState.flags.hasBox) {
        if (!gameState.flags.shownDrawerLockHint) {
            gameState.flags.shownDrawerLockHint = true;
            showDialog('抽屉不知什么时候多了一把密码锁。');
        } else {
            openDrawerModal();
        }
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
    countSearch();
    trackObjectClick('photo-wall', (next) => {
        _pendingPhotoWallHint = next || null;
        openPhotoWallScene();
    });
}

function interactToys() {
    if (tickExploreAfterBite()) return;
    countSearch();
    trackObjectClick('toys', (next) => {
        gameState.flags.toyCountSeen = true;
        if (gameState.flags.photoWallSeen && !gameState.flags.toyBoxSeen) {
            showDialog('地板上散落着朵朵的玩具：一个毛线球、一个铃铛球、还有一条小鱼。\n\n等等……桌子下面好像还有个小木箱？', next);
        } else {
            showDialog('地板上散落着朵朵的玩具：一个毛线球、一个铃铛球、还有一条小鱼。主人把她最爱的3个玩具都留在这里了。', next);
        }
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
        setTapHandler(el, function() { showDialog(text); });
    }

    bindPhotoClick(photo1, '2022年，朵朵刚来，还是个小猫咪，躲在沙发角落不肯出来。\n\n照片背面写着："初来乍到"。');
    bindPhotoClick(photo2, '2024年，朵朵2岁了，越来越懒，整天趴着不动。\n\n照片背面写着："慵懒少女"。');
    bindPhotoClick(photo3, '2026年，朵朵4岁了，最爱在下午趴在阳台那盆开黄花的植物旁边打盹。\n\n照片背面写着："老猫时光"。');

    // 便利贴3：照片墙背面
    const scene = document.getElementById('photo-wall-scene');
    if (!gameState.flags.stickyNotes.includes('note3')) {
        const note = document.createElement('div');
        note.className = 'sticky-note-hotspot';
        note.style.cssText = 'position:absolute;right:5%;bottom:10%;width:12%;height:10%;cursor:pointer;';
        note.title = '便利贴';
        note.textContent = '📝';
        note.style.fontSize = '28px';
        note.style.display = 'flex';
        note.style.alignItems = 'center';
        note.style.justifyContent = 'center';
        note.addEventListener('click', () => {
            note.remove();
            collectStickyNote('note3');
        });
        scene.appendChild(note);
    }
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

// ===================== 书架场景 =====================

function interactBookshelf() {
    if (tickExploreAfterBite()) return;
    countSearch();
    trackObjectClick('bookshelf', (next) => {
        if (!gameState.flags.hasDiary) {
            showDialog('书架上摆满了书，还有一些小摆件。角落里有个精致的音乐盒，盒盖上落了一层薄薄的灰尘，好像很久没人碰过了。', next);
        } else if (!gameState.flags.bookPuzzleSolved) {
            showDialog('日记里提到过书架……5本书，按厚薄排好。', () => {
                openBookshelfScene();
            });
        } else if (!gameState.flags.musicBoxSolved) {
            showDialog('隐藏格子还开着，音乐盒还没解开。', () => {
                openBookshelfScene();
            });
        } else {
            showDialog('书架上的一切都已经探索过了。', next);
        }
    });
}

function openBookshelfScene() {
    clearHotspots();
    document.getElementById('dialog-box').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
    document.getElementById('bookshelf-scene').classList.remove('hidden');
    centerViewport();
    showDragHint();

    gameState.flags.bookshelfSeen = true;

    if (!gameState.flags.bookPuzzleSolved) {
        // 第一阶段：5本书谜题
        document.getElementById('bookshelf-puzzle-ui').classList.remove('hidden');

        gameState.flags.bookPuzzleStep = 0;
        setupBookPuzzleHotspots();
    } else if (!gameState.flags.musicBoxSolved) {
        // 第二阶段：音乐盒
        document.getElementById('bookshelf-puzzle-ui').classList.add('hidden');

        gameState.flags.musicBoxStep = 0;
        showDialog('音乐盒上有三个按钮，分别刻着不同的年份。按照朵朵成长的顺序来……', () => {
            setupMusicBoxHotspots();
        });
    } else {
        document.getElementById('bookshelf-puzzle-ui').classList.add('hidden');

        showDialog('音乐盒已经打开过了，里面空空如也。');
        setupMusicBoxHotspots();
    }
}

// ===================== 书本谜题 =====================
// 5本书按厚度从大到小：book1(最厚120px) > book2(100) > book3(80) > book4(60) > book5(最薄40)
const BOOK_ORDER = ['book1', 'book2', 'book3', 'book4', 'book5'];

function setupBookPuzzleHotspots() {
    const scene = document.getElementById('bookshelf-scene');
    scene.querySelectorAll('.book-btn').forEach(el => el.remove());

    // 书本按打乱后的位置排列（正确顺序是 book1>2>3>4>5，这里打乱显示位置）
    const books = [
        { id: 'book3', label: '中书',   width: '7%',   left: '10%', color: '#27ae60' },
        { id: 'book5', label: '薄书②', width: '4%',   left: '20%', color: '#8e44ad' },
        { id: 'book1', label: '厚书①', width: '10%',  left: '28%', color: '#c0392b' },
        { id: 'book4', label: '薄书①', width: '5.5%', left: '41%', color: '#f39c12' },
        { id: 'book2', label: '厚书②', width: '8.5%', left: '50%', color: '#2980b9' },
    ];

    books.forEach(b => {
        const btn = document.createElement('div');
        btn.className = 'book-btn';
        btn.id = b.id;
        btn.dataset.bookId = b.id;
        btn.style.cssText = `left:${b.left};top:28%;width:${b.width};height:38%;background:${b.color};`;
        btn.title = b.label;
        btn.addEventListener('click', () => handleBookClick(b.id));
        scene.appendChild(btn);
    });

    updateBookPuzzleHint();
}

function updateBookPuzzleHint() {
    const hint = document.getElementById('book-puzzle-hint');
    if (hint) {
        hint.textContent = `已按顺序抽出：${gameState.flags.bookPuzzleStep}/5`;
    }
}

function handleBookClick(bookId) {
    if (gameState.flags.bookPuzzleSolved) {
        showDialog('书架上的隐藏格子已经打开了。');
        return;
    }
    const expected = BOOK_ORDER[gameState.flags.bookPuzzleStep];
    if (bookId === expected) {
        gameState.flags.bookPuzzleStep++;
        const btn = document.getElementById(bookId);
        if (btn) btn.remove();
        updateBookPuzzleHint();

        if (gameState.flags.bookPuzzleStep >= 5) {
            gameState.flags.bookPuzzleSolved = true;
            showDialog('咔哒——书架背板弹开了一个小格子！\n\n格子里静静躺着一条猫咪项圈，项圈上刻着"朵朵"，旁边还有一行小字：2022.03.15。\n\n项圈旁边，还有一个小小的音乐盒。', () => {
                if (!gameState.inventory.includes('项圈')) {
                    gameState.flags.hasCollar = true;
                    gameState.inventory.push('项圈');
                    updateInventory();
                }
                showDialog('你获得了朵朵的项圈。\n\n2022.03.15……那是朵朵来家的日子。', () => {
                    collectStickyNote('note4');
                    collectMemoryFragment(0);
                    // 直接切换到音乐盒阶段
                    document.getElementById('bookshelf-puzzle-ui').classList.add('hidden');

                    scene.querySelectorAll('.book-btn').forEach(el => el.remove());
                    gameState.flags.musicBoxStep = 0;
                    showDialog('音乐盒盖子上刻着三个年份。日记里说过朵朵的故事……也许要按照她成长的顺序来？', () => {
                        setupMusicBoxHotspots();
                    });
                });
            });
        } else {
            const remaining = 5 - gameState.flags.bookPuzzleStep;
            showDialog(`书本被轻轻抽出，发出沙沙的声音……还差${remaining}本。`);
        }
    } else {
        gameState.flags.bookPuzzleStep = 0;
        setupBookPuzzleHotspots();
        showDialog('书本滑回了原位，发出轻微的碰撞声。\n\n也许顺序不对……日记里说"5本书按厚薄排好"。');
    }
}

function setupMusicBoxHotspots() {
    const scene = document.getElementById('bookshelf-scene');
    // 清除旧热点
    scene.querySelectorAll('.bookshelf-hotspot').forEach(el => el.remove());

    // 音乐盒盖上刻着3个词，顺序打乱，玩家需对照照片墙判断朵朵的成长顺序
    const phases = [
        { id: 'btn-phase-b', label: '慵懒少女', key: 'B', x: '28%', y: '62%' },
        { id: 'btn-phase-c', label: '老猫时光', key: 'C', x: '48%', y: '62%' },
        { id: 'btn-phase-a', label: '初来乍到', key: 'A', x: '68%', y: '62%' },
    ];

    phases.forEach(p => {
        const btn = document.createElement('div');
        btn.className = 'bookshelf-hotspot music-btn';
        btn.id = p.id;
        btn.dataset.phase = p.key;
        btn.style.cssText = `left:${p.x};top:${p.y};`;
        btn.addEventListener('click', () => handleMusicBoxBtn(p.key));
        scene.appendChild(btn);
    });
}

// 正确顺序：初来乍到(A) → 慵懒少女(B) → 老猫时光(C)
const MUSIC_BOX_ORDER = ['A', 'B', 'C'];

function handleMusicBoxBtn(key) {
    if (gameState.flags.musicBoxSolved) {
        showDialog('音乐盒已经打开过了。');
        return;
    }

    const expected = MUSIC_BOX_ORDER[gameState.flags.musicBoxStep];
    if (key === expected) {
        gameState.flags.musicBoxStep++;
        const btn = document.querySelector(`[data-phase="${key}"]`);
        if (btn) btn.classList.add('pressed');

        if (gameState.flags.musicBoxStep >= 3) {
            gameState.flags.musicBoxSolved = true;
            showDialog('叮——音乐盒发出一声清脆的响声，缓缓打开了。\n\n里面躺着一张小纸片，上面写着：\n"抽屉里的密码，是她陪我的年数。"', () => {
                showDialog('朵朵2022年来，2026年……她陪了主人4年。\n\n你记下了这个数字。', () => {
                    collectMemoryFragment(1);
                });
            });
        } else {
            showDialog(`轻柔的音符响起……还差${3 - gameState.flags.musicBoxStep}个。`);
        }
    } else {
        gameState.flags.musicBoxStep = 0;
        document.querySelectorAll('.music-btn').forEach(b => b.classList.remove('pressed'));
        showDialog('音乐盒发出一声沉闷的声响，按钮全部熄灭了。\n\n也许顺序不对……照片墙上记录了朵朵的每个阶段。');
    }
}

function closeBookshelfScene() {
    document.getElementById('bookshelf-scene').classList.add('hidden');
    centerViewport();
    createRoomHotspots();
}

// ===================== 食盆谜题 =====================

function interactFoodBowl() {
    if (tickExploreAfterBite()) return;
    countSearch();
    trackObjectClick('food-bowl', (next) => {
        if (!gameState.flags.hasDiary) {
            showDialog('沙发旁边放着朵朵的食盆，盆边贴着一张喂食记录卡。', next);
        } else {
            openFoodBowlScene();
        }
    });
}

function openFoodBowlScene() {
    clearHotspots();
    document.getElementById('dialog-box').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
    document.getElementById('food-bowl-scene').classList.remove('hidden');
    centerViewport();
    showDragHint();

    gameState.flags.foodBowlSeen = true;

    const scene = document.getElementById('food-bowl-scene');

    // 记录卡热点
    if (!scene.querySelector('#food-card-hotspot')) {
        const card = document.createElement('div');
        card.id = 'food-card-hotspot';
        card.style.cssText = 'position:absolute;left:55%;top:60%;width:30%;height:28%;cursor:pointer;';
        card.addEventListener('click', () => {
            showDialog('你凑近看那张泛黄的记录卡……\n\n"她吃早饭的时候，总喜欢背对着窗户，靠着那面墙坐着。\n\n中午的阳光最烈，她会找最亮的地方，正对着光吃。\n\n傍晚她有点困，歪在离门最近的角落，有时候吃到一半就打盹。\n\n夜里安静，她会躲到最暗的地方，专心吃完再出来。"');
        });
        scene.appendChild(card);
    }

    // 食盆拾取热点
    if (!gameState.flags.hasBowl) {
        if (!scene.querySelector('#food-bowl-pickup')) {
            const bowl = document.createElement('div');
            bowl.id = 'food-bowl-pickup';
            bowl.style.cssText = 'position:absolute;left:15%;top:45%;width:35%;height:40%;cursor:pointer;';
            bowl.addEventListener('click', () => {
                gameState.flags.hasBowl = true;
                bowl.remove();
                if (!gameState.inventory.includes('食盆')) {
                    gameState.inventory.push('食盆');
                    updateInventory();
                }
                showDialog('你拿起食盆，翻过来看了看盆底——上面有一个浅浅的镂空花纹，像是被反复摩擦留下的痕迹。');
            });
            scene.appendChild(bowl);
        }
    }
}

function closeFoodBowlScene() {
    document.getElementById('food-bowl-scene').classList.add('hidden');
    centerViewport();
    createRoomHotspots();
}

// ===================== 画框谜题 =====================
// 4个区域对应卡片描述：
// 早(背对窗靠墙) → 左上  中(正对光) → 右上  晚(离门最近) → 右下  夜(最暗处) → 左下
// 每个区域藏一个符号，食盆叠上去才能看见
// 正确顺序：早→午→晚→夜 = 左上→右上→右下→左下

const BOWL_ZONES = [
    { id: 'morning', left: '25%', top: '15%',  width: '22%', height: '30%', symbol: '🌸', label: '窗边' },
    { id: 'noon',    left: '58%', top: '15%',  width: '22%', height: '30%', symbol: '☀️', label: '阳光处' },
    { id: 'evening', left: '58%', top: '52%',  width: '22%', height: '30%', symbol: '🌿', label: '门边' },
    { id: 'night',   left: '25%', top: '52%',  width: '22%', height: '30%', symbol: '🌙', label: '树荫下' },
];
const BOWL_ORDER = ['morning', 'noon', 'evening', 'night'];

function interactPainting() {
    if (tickExploreAfterBite()) return;
    countSearch();
    trackObjectClick('painting', (next) => {
        if (gameState.flags.paintingPuzzleSolved) {
            showDialog('画框已经打开过了，里面的信已经取走了。', next);
        } else if (!gameState.flags.hasDiary) {
            showDialog('墙上挂着一幅画，画里是一片草地，朵朵最喜欢趴在这里晒太阳。', next);
        } else if (!gameState.flags.hasBowl) {
            showDialog('墙上挂着一幅画，草地上的光影很复杂……\n\n你总觉得画里藏着什么，但什么都看不出来。', next);
        } else {
            showDialog('你拿着食盆靠近画框，盆底的花纹在画面上投下奇怪的光影……', () => {
                openPaintingPuzzle();
            });
        }
    });
}

function openPaintingPuzzle() {
    clearHotspots();
    document.getElementById('dialog-box').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
    document.getElementById('painting-scene').classList.remove('hidden');
    centerViewport();
    showDragHint();

    gameState.flags.paintingStep = 0;
    gameState.flags.paintingSymbolsFound = [];
    setupPaintingOverlay();

    // 便条A：藏在画框旁边的墙缝里
    const scene = document.getElementById('painting-scene');
    if (!gameState.flags.balconyClue1) {
        const noteA = document.createElement('div');
        noteA.id = 'balcony-note-a';
        noteA.style.cssText = 'position:absolute;right:4%;top:12%;width:6%;height:8%;cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;';
        noteA.title = '墙缝里的纸条';
        noteA.textContent = '📄';
        noteA.addEventListener('click', () => {
            gameState.flags.balconyClue1 = true;
            noteA.remove();
            showDialog('你从画框旁边的墙缝里抽出一张折叠的纸条。\n\n"朵朵最爱上午的阳光。那时候她会坐在阳台左边，一动不动，直到影子把什么东西盖住。"', () => {
                showDialog('上午的阳光……影子……\n\n你想起了墙上的那个时钟。');
            });
        });
        scene.appendChild(noteA);
    }
}

function setupPaintingOverlay() {
    const scene = document.getElementById('painting-scene');
    scene.querySelectorAll('.painting-zone,.painting-bowl-overlay,.painting-progress').forEach(el => el.remove());

    // 进度提示
    const progress = document.createElement('div');
    progress.className = 'painting-progress';
    const step = gameState.flags.paintingStep;
    const hints = ['把食盆对准画里朵朵早饭的位置……', '对准她中午吃饭的地方……', '对准傍晚她打盹的角落……', '最后，找到她夜里躲着吃饭的暗处……'];
    progress.textContent = step < 4 ? `(${step}/4) ${hints[step]}` : '';
    progress.style.cssText = 'position:absolute;bottom:12%;left:50%;transform:translateX(-50%);color:#fff8e0;font-size:14px;text-shadow:0 1px 4px #000;pointer-events:none;z-index:220;';
    scene.appendChild(progress);

    // 食盆叠加层（可拖动）
    const bowl = document.createElement('div');
    bowl.className = 'painting-bowl-overlay';
    bowl.style.cssText = 'position:absolute;left:35%;top:35%;width:30%;height:30%;cursor:grab;z-index:215;border-radius:50%;border:3px dashed rgba(255,220,100,0.7);background:rgba(255,220,100,0.08);display:flex;align-items:center;justify-content:center;font-size:28px;user-select:none;';
    bowl.textContent = '🥣';
    bowl.title = '拖动食盆，对准画里的位置';
    scene.appendChild(bowl);

    // 拖动逻辑
    let dragging = false, ox = 0, oy = 0;
    bowl.addEventListener('mousedown', e => {
        dragging = true;
        const r = bowl.getBoundingClientRect();
        ox = e.clientX - r.left;
        oy = e.clientY - r.top;
        bowl.style.cursor = 'grabbing';
        e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const sr = scene.getBoundingClientRect();
        const x = (e.clientX - sr.left - ox) / sr.width * 100;
        const y = (e.clientY - sr.top - oy) / sr.height * 100;
        bowl.style.left = Math.max(0, Math.min(70, x)) + '%';
        bowl.style.top  = Math.max(0, Math.min(70, y)) + '%';
        checkBowlZone(bowl, scene);
    });
    document.addEventListener('mouseup', () => {
        if (dragging) { dragging = false; bowl.style.cursor = 'grab'; }
    });

    // 触摸支持
    bowl.addEventListener('touchstart', e => {
        dragging = true;
        const r = bowl.getBoundingClientRect();
        ox = e.touches[0].clientX - r.left;
        oy = e.touches[0].clientY - r.top;
        e.preventDefault();
    }, { passive: false });
    bowl.addEventListener('touchmove', e => {
        if (!dragging) return;
        const sr = scene.getBoundingClientRect();
        const x = (e.touches[0].clientX - sr.left - ox) / sr.width * 100;
        const y = (e.touches[0].clientY - sr.top - oy) / sr.height * 100;
        bowl.style.left = Math.max(0, Math.min(70, x)) + '%';
        bowl.style.top  = Math.max(0, Math.min(70, y)) + '%';
        checkBowlZone(bowl, scene);
        e.preventDefault();
    }, { passive: false });
    bowl.addEventListener('touchend', () => { dragging = false; });
}

function checkBowlZone(bowl, scene) {
    const step = gameState.flags.paintingStep;
    if (step >= 4) return;

    const expectedZone = BOWL_ZONES[BOWL_ORDER.indexOf(BOWL_ORDER[step])];
    const br = bowl.getBoundingClientRect();
    const sr = scene.getBoundingClientRect();

    // 食盆中心坐标（百分比）
    const bx = (br.left + br.width / 2 - sr.left) / sr.width * 100;
    const by = (br.top + br.height / 2 - sr.top) / sr.height * 100;

    // 目标区域中心
    const zx = parseFloat(expectedZone.left) + parseFloat(expectedZone.width) / 2;
    const zy = parseFloat(expectedZone.top) + parseFloat(expectedZone.height) / 2;

    const dist = Math.sqrt((bx - zx) ** 2 + (by - zy) ** 2);

    // 移除旧符号提示
    scene.querySelectorAll('.painting-symbol-reveal').forEach(el => el.remove());

    if (dist < 12) {
        // 对准了，显示符号
        const sym = document.createElement('div');
        sym.className = 'painting-symbol-reveal';
        sym.style.cssText = `position:absolute;left:${expectedZone.left};top:${expectedZone.top};width:${expectedZone.width};height:${expectedZone.height};display:flex;align-items:center;justify-content:center;font-size:36px;z-index:216;cursor:pointer;animation:fadeIn 0.3s ease;`;
        sym.textContent = expectedZone.symbol;
        sym.title = '点击确认';
        sym.addEventListener('click', () => confirmSymbol(expectedZone.symbol, scene));
        scene.appendChild(sym);
        bowl.style.borderColor = 'rgba(100,255,100,0.9)';
    } else {
        bowl.style.borderColor = 'rgba(255,220,100,0.7)';
    }
}

function confirmSymbol(symbol, scene) {
    const step = gameState.flags.paintingStep;
    gameState.flags.paintingSymbolsFound.push(symbol);
    gameState.flags.paintingStep++;

    scene.querySelectorAll('.painting-symbol-reveal').forEach(el => el.remove());

    // 已确认的符号显示在底部
    const confirmed = document.createElement('div');
    confirmed.className = 'painting-symbol-reveal';
    confirmed.style.cssText = `position:absolute;bottom:18%;left:${20 + step * 15}%;font-size:28px;z-index:220;pointer-events:none;`;
    confirmed.textContent = symbol;
    scene.appendChild(confirmed);

    if (gameState.flags.paintingStep >= 4) {
        // 全部找到
        setTimeout(() => {
            gameState.flags.paintingPuzzleSolved = true;
            showDialog('咔哒——画框从墙上弹开了一条缝，里面夹着一封信！', () => {
                gameState.flags.hasOwnerLetter = true;
                gameState.inventory.push('主人的信');
                updateInventory();
                showDialog('你获得了主人写给朵朵的信。\n\n"朵朵，\n\n你最爱的顺序，永远是先闻味道，再用爪子确认，最后才肯吃。\n\n鱼的香气→爪子轻触→铃铛一响→球滚过来。\n\n这是你的仪式，也是我最爱看的画面。\n\n——主人"', () => {
                    showDialog('先闻味道（鱼）→爪子确认（爪印）→铃铛→球……\n\n这个顺序……好像可以用在什么地方。', () => {
                        collectMemoryFragment(2);
                    });
                });
            });
        }, 600);
    } else {
        // 刷新进度提示
        setupPaintingOverlay();
        // 保留已确认符号
        gameState.flags.paintingSymbolsFound.forEach((s, i) => {
            const el = document.createElement('div');
            el.className = 'painting-symbol-reveal';
            el.style.cssText = `position:absolute;bottom:18%;left:${20 + i * 15}%;font-size:28px;z-index:220;pointer-events:none;`;
            el.textContent = s;
            scene.appendChild(el);
        });
    }
}

function closePaintingScene() {
    document.getElementById('painting-scene').classList.add('hidden');
    centerViewport();
    createRoomHotspots();
}

// ===================== 玩具箱谜题 =====================

function interactToyBox() {
    if (tickExploreAfterBite()) return;
    countSearch();
    trackObjectClick('toy-box', (next) => {
        if (!gameState.flags.hasDiary) {
            showDialog('桌子下面好像有个小木箱，但上面有个图案锁，暂时打不开。', next);
        } else if (gameState.flags.toyBoxSolved) {
            showDialog('玩具箱已经打开了，朵朵的信已经取走了。', next);
        } else {
            showDialog('小木箱上有四个图案按钮：🐟 🐾 🔔 ⚽\n\n日记里写过：先闻了闻小鱼，用爪子确认了铃铛，然后把球推给我……', () => {
                openToyBoxScene();
            });
        }
    });
}

function openToyBoxScene() {
    clearHotspots();
    document.getElementById('dialog-box').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
    document.getElementById('toy-box-scene').classList.remove('hidden');
    centerViewport();
    showDragHint();

    gameState.flags.toyBoxSeen = true;
    gameState.flags.toyBoxStep = 0;
    setupToyBoxHotspots();

    // 便条B：藏在玩具箱底部，给阳台谜题的第二条线索
    const scene = document.getElementById('toy-box-scene');
    if (!gameState.flags.balconyClue2) {
        const noteB = document.createElement('div');
        noteB.id = 'balcony-note-b';
        noteB.style.cssText = 'position:absolute;left:4%;bottom:8%;width:6%;height:8%;cursor:pointer;';
        noteB.title = '玩具箱底部的纸条';
        noteB.addEventListener('click', () => {
            gameState.flags.balconyClue2 = true;
            noteB.remove();
            showDialog('你在玩具箱底部发现了一张夹着的纸条。\n\n"下午三点，她会挪到阳台右边，把脸埋进那盆绿植里，等影子爬过来。"', () => {
                showDialog('下午三点……影子……\n\n你想起了墙上的那个时钟。');
            });
        });
        scene.appendChild(noteB);
    }
}

const TOY_BOX_ORDER = ['fish', 'paw', 'bell', 'ball'];
const TOY_BOX_ICONS = { fish: '🐟', paw: '🐾', bell: '🔔', ball: '⚽' };

function setupToyBoxHotspots() {
    const scene = document.getElementById('toy-box-scene');
    scene.querySelectorAll('.toy-btn').forEach(el => el.remove());

    const positions = [
        { id: 'fish', left: '20%', top: '55%' },
        { id: 'paw',  left: '30%', top: '55%' },
        { id: 'bell', left: '40%', top: '55%' },
        { id: 'ball', left: '50%', top: '55%' },
    ];

    positions.forEach(p => {
        const btn = document.createElement('div');
        btn.className = 'toy-btn';
        btn.dataset.toyId = p.id;
        btn.style.cssText = `left:${p.left};top:${p.top};`;
        btn.addEventListener('click', () => handleToyBoxClick(p.id));
        scene.appendChild(btn);
    });
}

function handleToyBoxClick(toyId) {
    if (gameState.flags.toyBoxSolved) {
        showDialog('玩具箱已经打开了。');
        return;
    }
    const expected = TOY_BOX_ORDER[gameState.flags.toyBoxStep];
    if (toyId === expected) {
        gameState.flags.toyBoxStep++;
        const btn = document.querySelector(`.toy-btn[data-toy-id="${toyId}"]`);
        if (btn) btn.classList.add('toy-selected');

        if (gameState.flags.toyBoxStep >= 4) {
            gameState.flags.toyBoxSolved = true;
            showDialog('咔哒——木箱的锁弹开了！\n\n里面有一封信，信纸上印满了小小的爪印……', () => {
                gameState.flags.hasCatLetter = true;
                gameState.inventory.push('朵朵的信');
                updateInventory();
                showDialog('你获得了朵朵的信。\n\n爪印排列成文字：\n\n"喵——\n\n你找到这里了。我知道你会来的。\n\n主人把最重要的东西藏在了时钟里，那是我们在一起的每一天。\n\n猫咪神藏，不是宝贝，是时光。\n\n——朵朵 🐾"', () => {
                    collectStickyNote('note5');
                    showDialog('你握着这封信，眼眶有些湿润。\n\n时钟……一切线索都指向那里。', () => {
                        collectMemoryFragment(3);
                    });
                });
            });
        } else {
            const remaining = 4 - gameState.flags.toyBoxStep;
            showDialog(`图案亮起，发出轻柔的声响……还差${remaining}个。`);
        }
    } else {
        gameState.flags.toyBoxStep = 0;
        document.querySelectorAll('.toy-btn').forEach(b => b.classList.remove('toy-selected'));
        showDialog('木箱发出一声沉闷的响声，图案全部熄灭了。\n\n再想想主人信里的顺序……');
    }
}

function closeToyBoxScene() {
    document.getElementById('toy-box-scene').classList.add('hidden');
    centerViewport();
    createRoomHotspots();
}

// ===================== 便利贴系统 =====================

const STICKY_NOTE_TEXTS = {
    note1: '朵朵，你知道吗，第一次见到你的时候，我就知道你会是我最好的朋友。',
    note2: '你总是在这里等我回家，每次开门都能看到你的小脑袋。',
    note3: '2022年，你来了。2024年，你长大了。2026年，你还是那么爱赖着我。',
    note4: '你的项圈我一直留着，那是你来的第一天戴上的。',
    note5: '如果有一天你找到了这里，希望你知道，我永远爱你。'
};

// ===================== 记忆碎片系统 =====================

const MEMORY_FRAGMENT_TEXTS = [
    '2022年3月15日，朵朵第一次来家。她躲在角落里，用那双琥珀色的眼睛打量着这个陌生的地方。我把项圈轻轻套上，她没有挣扎，只是回头看了我一眼。',
    '有一个下午，阳光从窗户斜射进来，朵朵第一次跳上窗台。她坐在那里，望着远处，尾巴轻轻摇摆。我没有打扰她，只是静静地看着。',
    '每天喂食的时候，她都有自己的仪式。先闻一闻，再用爪子轻轻碰一下，铃铛响了，才肯低头吃。我不知道这是从哪里学来的，但我每次都会等她完成。',
    '最后一次玩玩具是一个傍晚。她把毛线球、铃铛球和小鱼都推到了我脚边，然后坐下来看着我。我想，也许她知道我要离开了。',
    '我离开的那天，朵朵坐在窗台上，一直看着我。我没有回头，但我知道她在。这个房间里的每一件东西，都是我们在一起的证明。'
];

function collectMemoryFragment(index) {
    if (gameState.flags.memoryFragments.includes(index)) return;
    gameState.flags.memoryFragments.push(index);
    const count = gameState.flags.memoryFragments.length;
    showDialog(`✨ 记忆碎片（${count}/5）：\n\n"${MEMORY_FRAGMENT_TEXTS[index]}"`, () => {
        if (count >= 5) {
            showDialog('五块记忆碎片全部拼合……\n\n你感到房间里有什么东西悄悄变了。\n\n墙上的时钟，指针停了。', () => {
                closeBalconyScene();
            });
        }
    });
}

function allFragmentsCollected() {
    return gameState.flags.memoryFragments.length >= 5;
}

function collectStickyNote(id) {
    if (gameState.flags.stickyNotes.includes(id)) return;
    gameState.flags.stickyNotes.push(id);
    updateInventory();
    const count = gameState.flags.stickyNotes.length;
    if (count >= 5) {
        gameState.flags.albumUnlocked = true;
        showDialog(`你收集了所有5张便利贴！\n\n"${STICKY_NOTE_TEXTS[id]}"\n\n记忆相册已解锁，可以在物品栏中查看。`);
    } else {
        showDialog(`你发现了一张便利贴（${count}/5）：\n\n"${STICKY_NOTE_TEXTS[id]}"`);
    }
}

// ===================== 记忆相册 =====================

function openAlbumScene() {
    document.getElementById('dialog-box').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
    document.getElementById('album-scene').classList.remove('hidden');
    centerViewport();

    const content = document.getElementById('album-content');
    content.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'album-title';
    title.textContent = '📖 朵朵的记忆相册';
    content.appendChild(title);

    const noteOrder = ['note1', 'note2', 'note3', 'note4', 'note5'];
    const noteLabels = ['初遇', '等待', '成长', '项圈', '永远'];
    noteOrder.forEach((id, i) => {
        const page = document.createElement('div');
        page.className = 'album-page';
        page.innerHTML = `<div class="album-page-label">${noteLabels[i]}</div><div class="album-page-text">"${STICKY_NOTE_TEXTS[id]}"</div>`;
        content.appendChild(page);
    });

    const footer = document.createElement('div');
    footer.className = 'album-footer';
    footer.textContent = '🐾 朵朵 2022—2026 🐾';
    content.appendChild(footer);
}

function closeAlbumScene() {
    document.getElementById('album-scene').classList.add('hidden');
    centerViewport();
    createRoomHotspots();
}

// ===================== 阳台场景 =====================

function tryOpenBalcony() {
    openBalconyScene();
}

function openBalconyScene() {
    clearHotspots();
    document.getElementById('dialog-box').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
    document.getElementById('balcony-scene').classList.remove('hidden');
    centerViewport();
    showDragHint();

    // 根据时钟切换阳台图片
    const balconyImg = document.getElementById('balcony-image');
    const ct = gameState.flags.clockTime;
    if (ct === '10') {
        balconyImg.src = 'balcony_10.jpg';
    } else if (ct === '15') {
        balconyImg.src = 'balcony_15.jpg';
    } else {
        balconyImg.src = 'balcony.jpg';
    }

    const isFirstVisit = !gameState.flags.balconySeen;
    gameState.flags.balconySeen = true;

    if (gameState.flags.hasLetter) {
        showDialog('阳台上静悄悄的，信已经拿走了。');
        setupBalconyHotspots();
        return;
    }

    const clockTime = gameState.flags.clockTime;
    if (!clockTime) {
        showDialog('你踏上阳台。\n\n地板上有一串细小的爪印，还有几块刻着奇怪符号的砖。\n\n阳光平淡，什么都看不出来。也许光线的角度很重要……', () => {
            if (isFirstVisit) {
                showDialog('地板上有四块刻着符号的砖，顺序似乎很重要……', () => setupBalconyHotspots());
            } else {
                setupBalconyHotspots();
            }
        });
    } else if (clockTime === '10') {
        showDialog('上午的阳光从左侧斜射进来，光线柔和。\n\n仙人掌的影子被拉得很长，影子末端压着地板上的一条砖缝……', () => {
            setupBalconyHotspots();
        });
    } else if (clockTime === '15') {
        showDialog('下午的阳光从右侧低低地照进来，光线橙红。\n\n绿植的影子斜斜地落在地板上，影子末端也压着一条砖缝……', () => {
            setupBalconyHotspots();
        });
    } else {
        showDialog('你踏上阳台。\n\n地板上有一串细小的爪印，还有几块刻着奇怪符号的砖。\n\n阳光平淡，什么都看不出来。', () => {
            setupBalconyHotspots();
        });
    }
}

function setupBalconyHotspots() {
    const scene = document.getElementById('balcony-scene');
    scene.querySelectorAll('.balcony-hotspot').forEach(el => el.remove());

    const clockTime = gameState.flags.clockTime;

    // 爪印
    const pawprint = document.createElement('div');
    pawprint.className = 'balcony-hotspot paw-trail';
    pawprint.style.cssText = 'left:20%;top:55%;width:55%;height:12%;';
    pawprint.title = '爪印';
    pawprint.addEventListener('click', () => {
        showDialog('一串小小的爪印，从窗边延伸出去，好像去过好几个地方……');
    });
    scene.appendChild(pawprint);

    // 砖缝（有对应时钟时间才出现）
    if (clockTime === '10') {
        const crack1 = document.createElement('div');
        crack1.className = 'balcony-hotspot';
        crack1.style.cssText = 'left:8%;top:78%;width:18%;height:8%;cursor:pointer;';
        crack1.title = '仙人掌影子末端的砖缝';
        crack1.addEventListener('click', () => {
            gameState.flags.balconyClue1 = true;
            showDialog('你蹲下来，从砖缝里抽出一张卷起的纸条。\n\n"她总是等黑暗散尽，才去追那道光，最后蜷在星星落下的地方睡着。"');
        });
        scene.appendChild(crack1);
    }

    if (clockTime === '15') {
        const crack2 = document.createElement('div');
        crack2.className = 'balcony-hotspot';
        crack2.style.cssText = 'left:74%;top:78%;width:18%;height:8%;cursor:pointer;';
        crack2.title = '绿植影子末端的砖缝';
        crack2.addEventListener('click', () => {
            gameState.flags.balconyClue2 = true;
            showDialog('你蹲下来，从砖缝里抽出一张卷起的纸条。\n\n"光跑得比她快，一头扎进了海里。"');
        });
        scene.appendChild(crack2);
    }

    // 砖块谜题：始终显示，不依赖线索数量
    if (!gameState.flags.balconyBrickSolved) {
        showBalconyBricks(scene);
    } else if (!gameState.flags.hasLetter) {
        // 砖块已解，向日葵花盆底座可以打开
        const base = document.createElement('div');
        base.className = 'balcony-hotspot';
        base.style.cssText = 'left:48%;top:68%;width:14%;height:8%;cursor:pointer;';
        base.title = '地板上弹开的底座';
        base.addEventListener('click', () => {
            showDialog('地板上有一道弹开的缝隙，里面压着一个防水袋，里面有一封信。', () => {
                gameState.flags.hasLetter = true;
                gameState.inventory.push('信');
                updateInventory();
                showDialog('你获得了一封信。\n\n"如果你找到了这里，说明你已经理解了朵朵的心意。\n\n她陪了我四年，是我最好的朋友。我离开的时候，她一定很难过，所以我把最重要的东西留给了她，也留给了你。\n\n时钟里藏着我们的秘密，那是朵朵神藏的最后一块拼图。\n\n——主人"', () => {
                    showDialog('你握着这封信，心里涌起一股说不清的情绪。\n\n时钟……一切线索都指向那里。', () => {
                        collectMemoryFragment(4);
                    });
                });
            });
        });
        scene.appendChild(base);
    }
}

// 4块砖谜题：正确顺序 🌙→☀️→🌊→⭐
const BRICK_ORDER = ['moon', 'sun', 'wave', 'star'];
const BRICK_LABELS = { moon: '🌙', sun: '☀️', wave: '🌊', star: '⭐' };

function showBalconyBricks(scene) {
    scene.querySelectorAll('.balcony-brick').forEach(el => el.remove());

    const bricks = [
        { key: 'star',  left: '18%', top: '76%' },
        { key: 'sun',   left: '34%', top: '76%' },
        { key: 'moon',  left: '50%', top: '76%' },
        { key: 'wave',  left: '66%', top: '76%' },
    ];

    bricks.forEach(b => {
        const brick = document.createElement('div');
        brick.className = 'balcony-brick balcony-hotspot';
        brick.dataset.brickKey = b.key;
        brick.style.cssText = `left:${b.left};top:${b.top};width:6%;height:6%;cursor:pointer;`;
        brick.addEventListener('click', () => handleBrickClick(b.key));
        scene.appendChild(brick);
    });
}

function handleBrickClick(key) {
    if (gameState.flags.balconyBrickSolved) return;

    const expected = BRICK_ORDER[gameState.flags.balconyBrickStep];
    if (key === expected) {
        gameState.flags.balconyBrickStep++;
        const brick = document.querySelector(`.balcony-brick[data-brick-key="${key}"]`);
        if (brick) brick.style.boxShadow = '0 0 12px 4px rgba(255,220,80,0.85)';

        if (gameState.flags.balconyBrickStep >= 4) {
            gameState.flags.balconyBrickSolved = true;
            // 全部高亮后短暂停留再清除
            setTimeout(() => {
                const scene = document.getElementById('balcony-scene');
                scene.querySelectorAll('.balcony-brick').forEach(el => el.remove());
                showDialog('四块砖依次亮起，地板发出轻微的震动声……\n\n向日葵花盆的底座弹开了一道缝。', () => {
                    setupBalconyHotspots();
                });
            }, 600);
        } else {
            showDialog(`砖块亮起……还差${4 - gameState.flags.balconyBrickStep}块。`);
        }
    } else {
        gameState.flags.balconyBrickStep = 0;
        document.querySelectorAll('.balcony-brick').forEach(b => {
            b.style.boxShadow = '';
        });
        const clue1 = gameState.flags.balconyClue1;
        const clue2 = gameState.flags.balconyClue2;
        let hint;
        if (!clue1 && !clue2) {
            hint = '地板发出一声沉闷的响声，砖块全部熄灭了。\n\n也许需要先找到一些线索……';
        } else if (clue1 && !clue2) {
            hint = '地板发出一声沉闷的响声，砖块全部熄灭了。\n\n你只有一张纸条，也许还有另一条线索藏在某处……';
        } else if (!clue1 && clue2) {
            hint = '地板发出一声沉闷的响声，砖块全部熄灭了。\n\n你只有一张纸条，也许还有另一条线索藏在某处……';
        } else {
            hint = '地板发出一声沉闷的响声，砖块全部熄灭了。\n\n再想想那两张纸条说的顺序……';
        }
        showDialog(hint);
    }
}

function closeBalconyScene() {
    document.getElementById('balcony-scene').classList.add('hidden');
    centerViewport();
    createRoomHotspots();
}


function interactTable() {
    if (tickExploreAfterBite()) return;

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
    if (allFragmentsCollected() && !gameState.flags.lookedAtClock) {
        gameState.flags.lookedAtClock = true;
        showDialog(
            '时钟的指针停了。\n\n你把它从墙上取下来，它比想象中重得多……',
            () => showEnding('treasure')
        );
    } else if (!gameState.flags.hasDiary) {
        countSearch();
        trackObjectClick('clock', (next) => {
            showDialog('墙上挂着一个时钟，指针正在走动……', next);
        });
    } else {
        openClockScene();
    }
}

function openClockScene() {
    clearHotspots();
    document.getElementById('dialog-box').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
    document.getElementById('clock-scene').classList.remove('hidden');
    centerViewport();
    initClockFace();
}

function closeClockScene() {
    document.getElementById('clock-scene').classList.add('hidden');
    centerViewport();
    createRoomHotspots();
}

function initClockFace() {
    const svg = document.getElementById('clock-svg');
    const cx = 100, cy = 100, r = 80;

    // 清理旧热区
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

        // 刻度线
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', ix); tick.setAttribute('y1', iy);
        tick.setAttribute('x2', ox); tick.setAttribute('y2', oy);
        tick.setAttribute('stroke', '#8b6f47'); tick.setAttribute('stroke-width', '2');
        document.getElementById('clock-ticks').appendChild(tick);

        // 数字
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', tx); text.setAttribute('y', ty);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('font-size', '13');
        text.setAttribute('fill', '#5a3e1b');
        text.setAttribute('font-family', 'serif');
        text.textContent = numLabels[h];
        document.getElementById('clock-numbers').appendChild(text);

        // 热区圆
        const hotspot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hotspot.setAttribute('cx', tx); hotspot.setAttribute('cy', ty);
        hotspot.setAttribute('r', '12');
        hotspot.setAttribute('fill', 'transparent');
        hotspot.setAttribute('cursor', 'pointer');
        hotspot.dataset = {};
        hotspot.setAttribute('data-hour', h === 0 ? 12 : h);
        hotspot.addEventListener('click', () => onClockHourClick(h === 0 ? 12 : h));
        document.getElementById('clock-hotspots').appendChild(hotspot);
    }

    updateClockHands();
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
        updateClockHands();
        showDialog('指针停在了上午10点。\n\n窗外的光线好像也跟着变了……去阳台看看？');
    } else if (hour === 3) {
        gameState.flags.clockTime = '15';
        updateClockHands();
        showDialog('指针停在了下午3点。\n\n窗外的光线好像也跟着变了……去阳台看看？');
    } else {
        // 拨到其他时间，时针移动但不触发特殊效果
        const prev = gameState.flags.clockTime;
        // 临时显示这个时间的指针位置（不改变 clockTime）
        const angle = (hour / 12) * 2 * Math.PI - Math.PI / 2;
        const len = 38;
        const x2 = 100 + Math.cos(angle) * len;
        const y2 = 100 + Math.sin(angle) * len;
        document.getElementById('clock-hour-hand').setAttribute('x2', x2);
        document.getElementById('clock-hour-hand').setAttribute('y2', y2);
        document.getElementById('clock-time-label').textContent = `${String(hour).padStart(2,'0')} : 00`;
        // 短暂停留后恢复（让玩家感受到"拨动"但没有效果）
        setTimeout(() => {
            gameState.flags.clockTime = String(hour);
            // 不触发特殊对话，只是记录位置
        }, 300);
    }
}

function interactSofa() {
    // 被咬后或已知凸起，点沙发直接进角落场景
    if (gameState.flags.wasBitten || gameState.flags.foundBump) {
        openSofaCornerScene();
        return;
    }

    // 已触发提示后，点沙发直接弹出选项
    if (gameState.flags.shownSofaCornerHint) {
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
        return;
    }

    // 普通交互，追踪点击
    trackObjectClick('sofa', (next) => {
        showDialog('你调查了一下沙发，没有发现什么特别的东西。', next);
    });
}

// 更新物品栏
function updateInventory() {
    const inventoryItems = document.getElementById('inventory-items');
    inventoryItems.innerHTML = '';

    // 便利贴作为单独条目显示
    const noteCount = gameState.flags.stickyNotes.length;
    if (noteCount > 0) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'inventory-item';
        noteDiv.innerHTML = `<span class="item-icon">📝</span>便利贴 ${noteCount}/5${gameState.flags.albumUnlocked ? ' ✨' : ''}`;
        noteDiv.style.cursor = 'pointer';
        noteDiv.onclick = () => {
            if (gameState.flags.albumUnlocked) {
                document.getElementById('inventory-panel').classList.add('hidden');
                openAlbumScene();
            } else {
                showDialog(`你已收集 ${noteCount}/5 张便利贴。集齐5张可以解锁记忆相册。`);
            }
        };
        inventoryItems.appendChild(noteDiv);
    }

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
                showDialog('日记封面上写着"献给朵朵"。\n\n── 2022年3月15日 ──\n\n朵朵来了。她很小，一直躲在沙发角落不出来。我把她的第一个项圈和一个小音乐盒一起放进了书架最里面的格子，5本书按厚薄排好就能打开。\n\n── 关于吃饭 ──\n\n她有自己的规律。早7点、午12点、晚6点、夜10点，从不迟到。我把这些记在食盆旁边的卡片上，怕自己忘。\n\n── 关于玩具 ──\n\n她最后一次玩玩具是离开前的那个傍晚。先闻了闻小鱼，用爪子确认了铃铛，然后把球推给我。我把那个顺序锁进了玩具箱。\n\n── 关于秘密 ──\n\n我把最重要的东西藏在了她每天下午都会凝视的地方。那里，时间从不停歇。');
            } else if (item === '项圈') {
                showDialog('朵朵的项圈，上面刻着她的名字。\n\n项圈上刻着 2022.03.15，那是朵朵来家的日子。\n\n项圈内侧还刻着一串数字：4-4-3。\n\n这串数字……好像在哪里用得上。');
            } else if (item === '主人的信') {
                showDialog('"朵朵，\n\n你最爱的顺序，永远是先闻味道，再用爪子确认，最后才肯吃。\n\n鱼的香气→爪子轻触→铃铛一响→球滚过来。\n\n这是你的仪式，也是我最爱看的画面。\n\n——主人"');
            } else if (item === '朵朵的信') {
                showDialog('"喵——\n\n你找到这里了。我知道你会来的。\n\n主人把最重要的东西藏在了时钟里，那是我们在一起的每一天。\n\n猫咪神藏，不是宝贝，是时光。\n\n——朵朵 🐾"');
            } else if (item === '信') {
                showDialog('"如果你找到了这里，说明你已经理解了朵朵的心意。\n\n她陪了我四年，是我最好的朋友。我离开的时候，她一定很难过，所以我把最重要的东西留给了她，也留给了你。\n\n时钟里藏着我们的秘密，那是朵朵神藏的最后一块拼图。\n\n——主人"');
            } else if (item.startsWith('便利贴')) {
                const count = gameState.flags.stickyNotes.length;
                if (gameState.flags.albumUnlocked) {
                    document.getElementById('inventory-panel').classList.add('hidden');
                    openAlbumScene();
                } else {
                    showDialog(`你已收集 ${count}/5 张便利贴。\n\n集齐5张可以解锁记忆相册。`);
                }
            } else {
                showDialog(`这是${item}。`);
            }
        };
        inventoryItems.appendChild(itemDiv);
    });
}

// 切换物品栏
function toggleInventory() {
    const panel = document.getElementById('inventory-panel');
    const isHidden = panel.classList.toggle('hidden');
    if (!isHidden) {
        // 打开时，注册一次性外部点击监听，点击物品栏外自动收起
        setTimeout(() => {
            function onOutsideClick(e) {
                if (!e.target.closest('#inventory-panel') && !e.target.closest('#inventory-toggle')) {
                    panel.classList.add('hidden');
                    document.removeEventListener('click', onOutsideClick, true);
                    document.removeEventListener('touchend', onOutsideClick, true);
                }
            }
            document.addEventListener('click', onOutsideClick, true);
            document.addEventListener('touchend', onOutsideClick, true);
        }, 0);
    }
}

// 动态提示系统
window.showHelp = function() {
    const f = gameState.flags;
    const inv = gameState.inventory;
    let hint = '';

    if (!f.wasBitten) {
        hint = '试着四处看看，房间里有什么不寻常的地方？沙发那边好像有动静……';
    } else if (!f.hasBox) {
        if (!inv.includes('钢笔')) {
            hint = '朵朵刚才从桌子那边跑过来——桌上的笔筒好像被碰歪了，仔细看看？';
        } else {
            hint = '你有了钢笔。沙发下面好像有什么东西，试着去沙发那边看看。';
        }
    } else if (!f.solvedPassword) {
        hint = '你找到了一个铁盒，五位字母密码锁。看看铁盒底部的图案，再对照一下手上朵朵留下的咬痕和抓痕——那些断断续续的点和线，像不像某种密码？';
    } else if (!f.bookPuzzleSolved) {
        if (!f.hasNote) {
            hint = '铁盒打开了，里面有钥匙和一张纸条，先把纸条拿出来看看。';
        } else {
            hint = '纸条上说"三把钥匙，从大到小"。书架上的书厚度不一样，试着按从厚到薄的顺序依次抽出来？';
        }
    } else if (!f.foodBowlSeen) {
        hint = '书架格子打开了，你找到了项圈和音乐盒。先别急着弄音乐盒——沙发旁边有个食盆，去看看。';
    } else if (!f.hasBowl) {
        hint = '食盆旁边有张记录卡，仔细读读。食盆本身好像也可以拿起来……';
    } else if (!f.paintingPuzzleSolved) {
        hint = '拿着食盆去画框那里，把食盆对准画里朵朵吃饭的位置，看看会发生什么。';
    } else if (!f.hasOwnerLetter) {
        hint = '画框已经弹开了，里面应该有什么东西。';
    } else if (!f.toyBoxSolved) {
        hint = '主人的信里写了朵朵吃饭的仪式顺序。桌子下面有个玩具箱，按那个顺序试试？';
    } else if (!f.hasCatLetter) {
        hint = '玩具箱打开了！里面应该有朵朵留下的东西，看看里面。';
    } else if (!f.musicBoxSolved) {
        hint = '书架上还有个音乐盒没解开，三个按钮刻着年份。照片墙上记录了朵朵每个阶段，按她成长的顺序来？';
    } else if (!f.hasDiary) {
        if (!f.drawerOpened) {
            hint = '音乐盒解开了，里面有抽屉密码的线索。数数房间里的玩具数量，再看看照片墙上的年份，算算朵朵的年龄……';
        } else {
            hint = '抽屉打开了，里面有朵朵的日记，拿起来看看。';
        }
    } else if (!f.balconySeen) {
        hint = '你看了日记。日记里提到朵朵每天都凝视着某个方向——去窗户那边看看。';
    } else if (!f.balconyClue1 || !f.balconyClue2) {
        const got = (f.balconyClue1 ? 1 : 0) + (f.balconyClue2 ? 1 : 0);
        hint = `阳台上有两张纸条藏在影子里（已找到 ${got}/2）。试着在时钟上拨到上午10点或下午3点，阳台的影子位置会不一样。`;
    } else if (!f.balconyBrickSolved) {
        hint = '两张纸条都找到了！地板上四块刻着符号的砖，按两张纸条描述的顺序踩下去。';
    } else if (!f.hasLetter) {
        hint = '砖块谜题解开了！地板上弹出了一个暗格，看看里面有什么。';
    } else if (!f.lookedAtClock) {
        hint = '你拿到了主人的信，信里说时钟藏着秘密。去看看那个时钟吧。';
    } else {
        hint = '所有线索都指向时钟。试着打开它——猫咪神藏就在里面。';
    }

    showDialog('💡 ' + hint);
};

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
            showDialog('2022年3月15日\n\n朵朵来了。她很小，一直躲在沙发角落不出来。我把她的第一个项圈和一个小音乐盒一起放进了书架最里面的格子，5本书按厚薄排好就能打开。等她长大了，也许有人会找到。', () => {
            showDialog('她有自己的规律。早7点、午12点、晚6点、夜10点，从不迟到。我把这些记在食盆旁边的卡片上，怕自己忘。', () => {
            showDialog('她最后一次玩玩具是离开前的那个傍晚。先闻了闻小鱼，用爪子确认了铃铛，然后把球推给我。我把那个顺序锁进了玩具箱。', () => {
            showDialog('我把最重要的东西藏在了她每天下午都会凝视的地方。那里，时间从不停歇。', () => {
                gameState.flags.hasDiary = true;
                if (!gameState.inventory.includes('日记')) {
                    gameState.inventory.push('日记');
                    updateInventory();
                }
                showDialog('日记已拾取，可以在背包里随时查看。');
                hotspot.onclick = function() {
                    showDialog('日记已经拿了，可以在背包看看。');
                };
            });});});});
        };
    } else {
        hotspot.onclick = function() {
            showDialog('日记已经拿了，可以在背包看看。');
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

    // 便利贴2：窗台
    if (!gameState.flags.stickyNotes.includes('note2')) {
        const scene = document.getElementById('window-scene');
        const note = document.createElement('div');
        note.className = 'sticky-note-hotspot';
        note.style.cssText = 'position:absolute;left:30%;top:8%;font-size:28px;cursor:pointer;z-index:210;';
        note.textContent = '📝';
        note.addEventListener('click', () => {
            note.remove();
            collectStickyNote('note2');
        });
        scene.appendChild(note);
    }

    showDialog('窗台上有朵朵留下的毛发和爪印。窗户虚掩着，外面是阳台……', () => {
        showChoices([
            {
                text: '🌿 推开窗户去阳台',
                callback: () => {
                    closeWindowScene();
                    openBalconyScene();
                }
            },
            {
                text: '↩ 先回去看看',
                callback: () => closeWindowScene()
            }
        ]);
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
    if (type === 'cycle') {
        document.getElementById('game-play').classList.add('hidden');
        document.getElementById('ending-screen').classList.remove('hidden');
        document.getElementById('ending-title').innerHTML = '结局：轮回';
        document.getElementById('ending-text').innerHTML = '你拿着钥匙，赶紧到门口试了试，果然是房门钥匙，你按耐不住兴奋的心情，赶紧走出大门，却只觉得一阵头晕目眩，昏了过去。<br><br>昏迷时，你做了一个梦，梦里朵朵一直在说"猫咪神藏"，你不知道什么时候才能醒来。';
        return;
    }

    // 真结局：5幕叙事序列
    const acts = [
        {
            title: '第一幕',
            text: '时钟的背面有一道细缝。\n\n你用指甲轻轻撬开，里面是一个小小的夹层——一张折叠的纸，和一张照片。'
        },
        {
            title: '第二幕',
            text: '照片里，一个人坐在沙发上，朵朵趴在他的腿上，两个人都在看向窗外的阳光。\n\n照片背面用钢笔写着：\n\n"谢谢你陪我走过这些年。\n\n2022—2026"'
        },
        {
            title: '第三幕',
            text: '你展开那张折叠的纸。\n\n"如果你走到了这里，说明你已经重新经历了我们在一起的每一段时光。\n\n书架上的项圈，是她来的第一天。\n音乐盒里的年份，是她陪我走过的岁月。\n食盆旁的记录，是她每天的仪式。\n玩具箱里的顺序，是她最后一次玩耍。\n阳台花盆下的信，是我离开前的道别。\n\n这些不是谜题，是记忆。\n\n——主人"'
        },
        {
            title: '第四幕',
            text: '你放下纸，抬起头。\n\n朵朵不知道什么时候从沙发角落走了出来，她蹭了蹭你的腿，然后跳上窗台，坐在那里，望向远处。\n\n尾巴轻轻摇摆，像是在等什么，又像是什么都不在等。'
        },
        {
            title: '第五幕',
            text: '你把时钟轻轻放回墙上。\n\n指针重新开始走动。\n\n你走向门口，回头看了一眼——朵朵还坐在窗台上，没有回头。\n\n你轻轻关上门。\n\n不是逃离，是带着这份记忆，离开。'
        }
    ];

    let actIndex = 0;

    function showAct() {
        if (actIndex >= acts.length) {
            document.getElementById('game-play').classList.add('hidden');
            document.getElementById('ending-screen').classList.remove('hidden');
            document.getElementById('ending-title').innerHTML = '✨ 猫咪神藏';
            document.getElementById('ending-text').innerHTML = '猫咪神藏，不是宝贝，是时光。<br><br>朵朵和主人在一起的每一天，都藏在这个房间里，等待着被人重新发现。<br><br>你找到了。';
            return;
        }
        const act = acts[actIndex];
        actIndex++;
        showDialog(`【${act.title}】\n\n${act.text}`, showAct);
    }

    showAct();
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
        shownDrawerLockHint: false,
        memoryFragments: [],   // 记忆碎片，集齐5块触发真结局
        photoWallSeen: false,
        sofaScratchSeen: false,
        toyCountSeen: false,
        bookshelfSeen: false,
        bookPuzzleSolved: false,
        bookPuzzleStep: 0,
        hasCollar: false,
        musicBoxSolved: false,
        musicBoxStep: 0,
        foodBowlSeen: false,
        paintingPuzzleSolved: false,
        paintingStep: 0,
        hasOwnerLetter: false,
        hasBowl: false,
        bowlZone: 0,
        paintingSymbolsFound: [],
        toyBoxSeen: false,
        toyBoxSolved: false,
        toyBoxStep: 0,
        hasCatLetter: false,
        balconySeen: false,
        hasLetter: false,
        clockTime: null,
        balconyClue1: false,
        balconyClue2: false,
        balconyBrickStep: 0,
        balconyBrickSolved: false,
        stickyNotes: [],
        albumUnlocked: false
    };

    document.getElementById('cat-image').classList.add('hidden');
    document.getElementById('pen-image').classList.add('hidden');
    document.getElementById('pen-holder-image').classList.add('hidden');
    document.getElementById('pen-holder-hotspot').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
    document.getElementById('ending-screen').classList.add('hidden');
    document.getElementById('title-screen').classList.remove('hidden');
    document.getElementById('game-play').classList.add('hidden');
    document.getElementById('inventory-toggle').classList.add('hidden');
    document.getElementById('help-toggle').classList.add('hidden');
    document.getElementById('inventory-panel').classList.add('hidden');
    document.getElementById('sofa-corner-scene').classList.add('hidden');
    document.getElementById('drawer-scene').classList.add('hidden');
    document.getElementById('window-scene').classList.add('hidden');
    document.getElementById('photo-wall-scene').classList.add('hidden');
    document.getElementById('bookshelf-scene').classList.add('hidden');
    document.getElementById('balcony-scene').classList.add('hidden');
    document.getElementById('food-bowl-scene').classList.add('hidden');
    document.getElementById('painting-scene').classList.add('hidden');
    document.getElementById('toy-box-scene').classList.add('hidden');
    document.getElementById('album-scene').classList.add('hidden');
    updateInventory();
}
