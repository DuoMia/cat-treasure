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
        // 玩具箱谜题
        toyBoxSeen: false,
        toyBoxSolved: false,
        toyBoxStep: 0,
        hasCatLetter: false,
        // 阳台
        balconySeen: false,
        hasLetter: false,
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
    setTimeout(() => hint.remove(), 3000);
}

function startGame() {
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('game-play').classList.remove('hidden');
    document.getElementById('inventory-toggle').classList.remove('hidden');

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
// 兼容旧调用，searchCount 计数已合并进 trackObjectClick
function countSearch() {
    if (!gameState.flags.foundCat) gameState.searchCount++;
}

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

    gameState.clickedObjects.add(id);
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
    showDialog('你把房间里能看的地方都看了一遍，却始终没有头绪……忽然，你注意到沙发的角落似乎有什么东西，要不要去看看？', () => {
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
            showDialog(
                '你来到朵朵刚刚躲藏的沙发角落，突然发现有一个凸起，不仔细看还真看不出来。\n\n你充满疑惑，得想办法把它打开看看里面是什么，但是你没有工具，得在桌子上找找有没有可以用的东西。',
                () => setupBumpInteraction()
            );
        });
        return;
    }

    if (gameState.inventory.includes('钢笔')) {
        setTapHandler(bump, function() {
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

    bindPhotoClick(photo1, '2022年，朵朵刚来，还是个小猫咪。');
    bindPhotoClick(photo2, '2024年，朵朵2岁了，越来越懒了。');
    bindPhotoClick(photo3, '2026年，朵朵4岁了，还是那么爱赖在沙发角落。');

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
    if (gameState.flags.wasBitten && !gameState.flags.shownHelpless) {
        countSearch();
        trackObjectClick('bookshelf');
        showHelpless();
        return;
    }
    countSearch();
    trackObjectClick('bookshelf', (next) => {
        if (!gameState.flags.hasNote) {
            showDialog('书架上摆满了书，还有一些小摆件。角落里有个精致的音乐盒，盒盖上落了一层薄薄的灰尘，好像很久没人碰过了。', next);
        } else if (!gameState.flags.bookPuzzleSolved) {
            showDialog('纸条上说"她陪我走过的岁月，是第一把钥匙"……书架上这5本书，厚薄各不相同。也许要按照某种顺序？', () => {
                openBookshelfScene();
            });
        } else if (!gameState.flags.toyBoxSolved) {
            showDialog('书架上的隐藏格子已经打开了，项圈已经拿走了。\n\n音乐盒还在那里，但现在还不是时候……', next);
        } else if (!gameState.flags.musicBoxSolved) {
            showDialog('你想起日记里的话：朵朵来的那天、她两岁的时候、她四岁的时候……\n\n音乐盒上有三个按钮，分别刻着不同的年份。也许要按照朵朵成长的顺序来？', () => {
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
        document.getElementById('music-box-display').classList.add('hidden');
        gameState.flags.bookPuzzleStep = 0;
        setupBookPuzzleHotspots();
    } else if (!gameState.flags.musicBoxSolved) {
        // 第二阶段：音乐盒
        document.getElementById('bookshelf-puzzle-ui').classList.add('hidden');
        document.getElementById('music-box-display').classList.remove('hidden');
        gameState.flags.musicBoxStep = 0;
        showDialog('音乐盒上有三个按钮，分别刻着不同的年份。按照朵朵成长的顺序来……', () => {
            setupMusicBoxHotspots();
        });
    } else {
        document.getElementById('bookshelf-puzzle-ui').classList.add('hidden');
        document.getElementById('music-box-display').classList.remove('hidden');
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

    const books = [
        { id: 'book1', label: '厚书①', width: '10%', left: '10%', color: '#c0392b' },
        { id: 'book2', label: '厚书②', width: '8.5%', left: '22%', color: '#2980b9' },
        { id: 'book3', label: '中书',   width: '7%',   left: '33%', color: '#27ae60' },
        { id: 'book4', label: '薄书①', width: '5.5%', left: '43%', color: '#f39c12' },
        { id: 'book5', label: '薄书②', width: '4%',   left: '51%', color: '#8e44ad' },
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

    // 便利贴4（书架谜题完成后出现，但先注册热点占位）
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
        if (btn) btn.classList.add('book-selected');
        updateBookPuzzleHint();

        if (gameState.flags.bookPuzzleStep >= 5) {
            gameState.flags.bookPuzzleSolved = true;
            showDialog('咔哒——书架背板弹开了一个小格子！\n\n格子里静静躺着一条猫咪项圈，项圈上刻着"朵朵"，旁边还有一行小字：2022.03.15。', () => {
                if (!gameState.inventory.includes('项圈')) {
                    gameState.flags.hasCollar = true;
                    gameState.inventory.push('项圈');
                    updateInventory();
                }
                showDialog('你获得了朵朵的项圈。\n\n2022.03.15……那是朵朵来家的日子。照片墙上第一张照片的年份，和这个日期对上了。', () => {
                    collectStickyNote('note4');
                });
            });
        } else {
            const remaining = 5 - gameState.flags.bookPuzzleStep;
            showDialog(`书本被轻轻抽出，发出沙沙的声音……还差${remaining}本。`);
        }
    } else {
        gameState.flags.bookPuzzleStep = 0;
        document.querySelectorAll('.book-btn').forEach(b => b.classList.remove('book-selected'));
        updateBookPuzzleHint();
        showDialog('书本滑回了原位，发出轻微的碰撞声。\n\n也许顺序不对……纸条上说"从大到小"。');
    }
}

function setupMusicBoxHotspots() {
    const scene = document.getElementById('bookshelf-scene');
    // 清除旧热点
    scene.querySelectorAll('.bookshelf-hotspot').forEach(el => el.remove());

    const years = [
        { id: 'btn-2022', label: '2022', x: '28%', y: '62%' },
        { id: 'btn-2024', label: '2024', x: '48%', y: '62%' },
        { id: 'btn-2026', label: '2026', x: '68%', y: '62%' }
    ];

    years.forEach(y => {
        const btn = document.createElement('div');
        btn.className = 'bookshelf-hotspot music-btn';
        btn.id = y.id;
        btn.dataset.year = y.label;
        btn.style.cssText = `left:${y.x};top:${y.y};`;
        btn.textContent = y.label;
        btn.addEventListener('click', () => handleMusicBoxBtn(y.label));
        scene.appendChild(btn);
    });
}

const MUSIC_BOX_ORDER = ['2022', '2024', '2026'];

function handleMusicBoxBtn(year) {
    if (gameState.flags.musicBoxSolved) {
        showDialog('音乐盒已经打开过了。');
        return;
    }

    const expected = MUSIC_BOX_ORDER[gameState.flags.musicBoxStep];
    if (year === expected) {
        gameState.flags.musicBoxStep++;
        const btn = document.querySelector(`[data-year="${year}"]`);
        if (btn) btn.classList.add('pressed');

        if (gameState.flags.musicBoxStep >= 3) {
            // 全部按对，音乐盒打开
            gameState.flags.musicBoxSolved = true;
            showDialog('叮——音乐盒发出一声清脆的响声，缓缓打开了。\n\n里面躺着一张小纸片，上面写着：\n"朵朵最爱的时刻是下午三点，那时候阳光从窗户斜射进来，她会从沙发角落走到窗台，然后回头看我一眼，再看向那个方向。\n\n我把最重要的东西，藏在了她目光的终点。那里，时间从不停歇。"\n\n——这正是日记里的那段话，但这里还多了一句：\n"抽屉里的密码，是她陪我的年数。"', () => {
                showDialog('朵朵陪了主人4年（2022-2026），加上她最爱的3个玩具……443？\n\n你记下了这个数字。');
            });
        } else {
            showDialog(`按钮亮起，发出轻柔的音符……还差${3 - gameState.flags.musicBoxStep}个。`);
        }
    } else {
        // 按错，重置
        gameState.flags.musicBoxStep = 0;
        document.querySelectorAll('.music-btn').forEach(b => b.classList.remove('pressed'));
        showDialog('音乐盒发出一声沉闷的声响，按钮全部熄灭了。\n\n也许顺序不对……想想朵朵的故事。');
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
    if (gameState.flags.wasBitten && !gameState.flags.shownHelpless) {
        countSearch();
        trackObjectClick('food-bowl');
        showHelpless();
        return;
    }
    countSearch();
    trackObjectClick('food-bowl', (next) => {
        if (!gameState.flags.bookPuzzleSolved) {
            showDialog('沙发旁边放着朵朵的食盆，盆边贴着一张喂食记录卡。', next);
        } else if (!gameState.flags.foodBowlSeen) {
            showDialog('朵朵的食盆……盆边贴着一张喂食记录卡，上面写着每天的喂食时间。', () => {
                openFoodBowlScene();
            });
        } else if (!gameState.flags.paintingPuzzleSolved) {
            showDialog('喂食记录上写着四个时间。对照墙上的时钟，时针方向就是顺序……', next);
        } else {
            showDialog('食盆已经看过了，喂食记录的秘密已经解开了。', next);
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

    showDialog('你蹲下来仔细看食盆旁边的记录卡……', () => {
        const hotspot = document.getElementById('food-bowl-record-hotspot');
        hotspot.onclick = function() {
            showDialog('喂食记录：\n\n早 7点 / 午 12点 / 晚 6点 / 夜 10点\n\n对照墙上的时钟，时针方向就是顺序。\n\n（7点时针朝上，12点时针朝右，6点时针朝左，10点时针朝下）', () => {
                showDialog('上→右→左→下……这个顺序好像可以用在什么地方。\n\n墙上那幅画……');
            });
        };
    });
}

function closeFoodBowlScene() {
    document.getElementById('food-bowl-scene').classList.add('hidden');
    centerViewport();
    createRoomHotspots();
}

// ===================== 画框谜题 =====================

function interactPainting() {
    if (tickExploreAfterBite()) return;
    if (gameState.flags.wasBitten && !gameState.flags.shownHelpless) {
        countSearch();
        trackObjectClick('painting');
        showHelpless();
        return;
    }
    countSearch();
    trackObjectClick('painting', (next) => {
        if (gameState.flags.paintingPuzzleSolved) {
            showDialog('画框已经打开过了，里面的信已经取走了。', next);
        } else if (!gameState.flags.foodBowlSeen) {
            showDialog('墙上挂着一幅画，画里是一片草地，朵朵最喜欢趴在这里晒太阳。\n\n画框四周有四个小小的方向标记……', next);
        } else {
            showDialog('喂食时间对应的时针方向：上→右→左→下。\n\n按这个顺序点击画框四周的方向标记……', () => {
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
    setupPaintingHotspots();
}

const PAINTING_ORDER = ['up', 'right', 'left', 'down'];
const PAINTING_LABELS = { up: '↑ 上', right: '→ 右', left: '← 左', down: '↓ 下' };
const PAINTING_POSITIONS = {
    up:    { left: '45%', top: '8%',  width: '10%', height: '12%' },
    right: { left: '82%', top: '40%', width: '12%', height: '12%' },
    left:  { left: '6%',  top: '40%', width: '12%', height: '12%' },
    down:  { left: '45%', top: '80%', width: '10%', height: '12%' }
};

function setupPaintingHotspots() {
    const scene = document.getElementById('painting-scene');
    scene.querySelectorAll('.painting-btn').forEach(el => el.remove());

    Object.entries(PAINTING_POSITIONS).forEach(([dir, pos]) => {
        const btn = document.createElement('div');
        btn.className = 'painting-btn';
        btn.dataset.dir = dir;
        btn.style.cssText = `left:${pos.left};top:${pos.top};width:${pos.width};height:${pos.height};`;
        btn.textContent = PAINTING_LABELS[dir];
        btn.addEventListener('click', () => handlePaintingClick(dir));
        scene.appendChild(btn);
    });
}

function handlePaintingClick(dir) {
    if (gameState.flags.paintingPuzzleSolved) {
        showDialog('画框已经打开了。');
        return;
    }
    const expected = PAINTING_ORDER[gameState.flags.paintingStep];
    if (dir === expected) {
        gameState.flags.paintingStep++;
        const btn = document.querySelector(`.painting-btn[data-dir="${dir}"]`);
        if (btn) btn.classList.add('painting-pressed');

        if (gameState.flags.paintingStep >= 4) {
            gameState.flags.paintingPuzzleSolved = true;
            showDialog('咔哒——画框从墙上弹开了一条缝，里面夹着一封信！', () => {
                gameState.flags.hasOwnerLetter = true;
                gameState.inventory.push('主人的信');
                updateInventory();
                showDialog('你获得了主人写给朵朵的信。\n\n"朵朵，\n\n你最爱的顺序，永远是先闻味道，再用爪子确认，最后才肯吃。\n\n鱼的香气→爪子轻触→铃铛一响→球滚过来。\n\n这是你的仪式，也是我最爱看的画面。\n\n——主人"', () => {
                    showDialog('先闻味道（鱼）→爪子确认（爪印）→铃铛→球……\n\n这个顺序……好像可以用在什么地方。');
                });
            });
        } else {
            const remaining = 4 - gameState.flags.paintingStep;
            showDialog(`画框轻轻颤动了一下……还差${remaining}步。`);
        }
    } else {
        gameState.flags.paintingStep = 0;
        document.querySelectorAll('.painting-btn').forEach(b => b.classList.remove('painting-pressed'));
        showDialog('画框没有反应。\n\n也许顺序不对……回想一下喂食记录上的时间。');
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
    if (gameState.flags.wasBitten && !gameState.flags.shownHelpless) {
        countSearch();
        trackObjectClick('toy-box');
        showHelpless();
        return;
    }
    countSearch();
    trackObjectClick('toy-box', (next) => {
        if (!gameState.flags.hasOwnerLetter || !gameState.flags.photoWallSeen) {
            showDialog('桌子下面好像有个小木箱，但上面有个图案锁，暂时打不开。', next);
        } else if (gameState.flags.toyBoxSolved) {
            showDialog('玩具箱已经打开了，朵朵的信已经取走了。', next);
        } else {
            showDialog('小木箱上有四个图案按钮：🐟 🐾 🔔 ⚽\n\n主人的信里说：先闻味道，再用爪子确认，最后才肯吃……', () => {
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
}

const TOY_BOX_ORDER = ['fish', 'paw', 'bell', 'ball'];
const TOY_BOX_ICONS = { fish: '🐟', paw: '🐾', bell: '🔔', ball: '⚽' };

function setupToyBoxHotspots() {
    const scene = document.getElementById('toy-box-scene');
    scene.querySelectorAll('.toy-btn').forEach(el => el.remove());

    const positions = [
        { id: 'fish', left: '20%', top: '55%' },
        { id: 'paw',  left: '36%', top: '55%' },
        { id: 'bell', left: '52%', top: '55%' },
        { id: 'ball', left: '68%', top: '55%' },
    ];

    positions.forEach(p => {
        const btn = document.createElement('div');
        btn.className = 'toy-btn';
        btn.dataset.toyId = p.id;
        btn.style.cssText = `left:${p.left};top:${p.top};`;
        btn.textContent = TOY_BOX_ICONS[p.id];
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
                    showDialog('你握着这封信，眼眶有些湿润。\n\n时钟……一切线索都指向那里。');
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
    if (!gameState.flags.musicBoxSolved) {
        showDialog('窗户虽然能打开，但外面是阳台，你有些犹豫……也许先把房间里的东西都弄清楚再说？');
        return;
    }
    openBalconyScene();
}

function openBalconyScene() {
    clearHotspots();
    document.getElementById('dialog-box').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
    document.getElementById('balcony-scene').classList.remove('hidden');
    centerViewport();
    showDragHint();

    gameState.flags.balconySeen = true;

    if (!gameState.flags.hasLetter) {
        showDialog('你推开窗户，踏上阳台。\n\n阳台上摆着几盆绿植，地板上有一串细小的爪印，从窗边一直延伸到角落的花盆旁。\n\n朵朵曾经在这里留下了她的痕迹。', () => {
            setupBalconyHotspots();
        });
    } else {
        showDialog('阳台上静悄悄的，信已经拿走了。');
        setupBalconyHotspots();
    }
}

function setupBalconyHotspots() {
    const scene = document.getElementById('balcony-scene');
    scene.querySelectorAll('.balcony-hotspot').forEach(el => el.remove());

    // 爪印热点
    const pawprint = document.createElement('div');
    pawprint.className = 'balcony-hotspot paw-trail';
    pawprint.style.cssText = 'left:20%;top:55%;width:55%;height:15%;';
    pawprint.title = '爪印';
    pawprint.addEventListener('click', () => {
        showDialog('一串小小的爪印，从窗边一直通向那个最大的花盆……朵朵好像在指引你。');
    });
    scene.appendChild(pawprint);

    // 花盆热点
    const pot = document.createElement('div');
    pot.className = 'balcony-hotspot flower-pot';
    pot.style.cssText = 'left:65%;top:60%;width:20%;height:25%;';
    pot.title = '花盆';
    pot.addEventListener('click', () => {
        if (!gameState.flags.hasLetter) {
            showDialog('你蹲下来，轻轻移开花盆……花盆下面压着一个防水袋，里面有一封信。', () => {
                gameState.flags.hasLetter = true;
                gameState.inventory.push('信');
                updateInventory();
                showDialog('你获得了一封信。\n\n信封上写着：\n"如果你找到了这里，说明你已经理解了朵朵的心意。\n\n她陪了我四年，是我最好的朋友。我离开的时候，她一定很难过，所以我把最重要的东西留给了她，也留给了你。\n\n时钟里藏着我们的秘密，那是朵朵神藏的最后一块拼图。\n\n——主人"', () => {
                    showDialog('你握着这封信，心里涌起一股说不清的情绪。\n\n时钟……一切线索都指向那里。');
                });
            });
        } else {
            showDialog('花盆下面已经空了，信已经拿走了。');
        }
    });
    scene.appendChild(pot);
}

function closeBalconyScene() {
    document.getElementById('balcony-scene').classList.add('hidden');
    centerViewport();
    createRoomHotspots();
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
        '手背上还有点发疼。',
        () => showDialog(
            '朵朵平时不是这样的——她从来不咬人。你盯着她躲进去的那个角落，忽然意识到，她好像不是在逃跑，而是在……引导你去看什么东西？',
            () => createRoomHotspots()
        )
    );
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
                showDialog('日记封面上写着"献给朵朵"。\n\n"朵朵来的那天，我买了一个新时钟挂在墙上，想着以后每天看着时间流逝，也有她陪着。\n\n她最喜欢的时刻是下午三点，那时候阳光从窗户斜射进来，她会从沙发角落走到窗台，然后回头看我一眼，再看向那个方向。\n\n我把最重要的东西，藏在了她目光的终点。那里，时间从不停歇。"');
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

    // 获得项圈后，窗户可以通往阳台
    if (gameState.flags.musicBoxSolved) {
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
                    text: '🕐 顺着朵朵的视线看',
                    callback: () => {
                        if (!gameState.flags.seenWindowClue) {
                            gameState.flags.seenWindowClue = true;
                            showDialog('对了！朵朵每天下午都从这里凝视着那个时钟……', () => closeWindowScene());
                        } else {
                            showDialog('朵朵的视线终点是那个时钟，你已经知道了。', () => closeWindowScene());
                        }
                    }
                }
            ]);
        });
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
        return;
    }

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
        toyBoxSeen: false,
        toyBoxSolved: false,
        toyBoxStep: 0,
        hasCatLetter: false,
        balconySeen: false,
        hasLetter: false,
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
