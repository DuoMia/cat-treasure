// 游戏状态
const gameState = {
    inventory: [],
    debugMode: false,
    searchCount: 0,
    penFallen: false,
    flags: {
        foundCat: false,
        wasBitten: false,
        shownHelpless: false,
        foundBump: false,
        hasBox: false,
        solvedPassword: false,
        lookedAtClock: false
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
    { id: 'door',   x: '3%',  y: '45%', width: '10%', height: '30%', label: '门',   onClick: interactDoor },
    { id: 'window', x: '35%', y: '20%', width: '25%', height: '35%', label: '窗户', onClick: interactWindow },
    { id: 'sofa',   x: '15%', y: '65%', width: '30%', height: '20%', label: '沙发', onClick: interactSofa },
    { id: 'table',  x: '55%', y: '75%', width: '25%', height: '11%', label: '桌子', onClick: interactTable },
    { id: 'clock',  x: '88%', y: '25%', width: '10%', height: '15%', label: '时钟', onClick: interactClock },
    { id: 'drawer', x: '52%', y: '50%', width: '8%',  height: '10%', label: '抽屉', onClick: interactDrawer }
];

// 打字机效果变量
let typewriterTimeout = null;
let currentFullText = '';

// 开始游戏
// 检测是否是移动端
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

// 请求全屏并锁定横屏方向（仅在移动端调用）
function requestLandscape() {
    if (!isMobileDevice()) return;

    function lockOrientation() {
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(e => console.log('锁定横屏失败:', e));
        }
    }

    const el = document.documentElement;
    const requestFS = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;

    if (requestFS) {
        // 先尝试全屏，然后锁屏
        try {
            const promise = requestFS.call(el);
            if (promise) {
                promise.then(lockOrientation).catch(e => {
                    console.log('全屏失败:', e);
                    lockOrientation();
                });
            } else {
                // 有些老浏览器 requestFullscreen 不返回 promise
                setTimeout(lockOrientation, 100);
            }
        } catch(e) {
            console.log('全屏报错:', e);
            lockOrientation();
        }
    } else {
        lockOrientation();
    }
}

function startGame() {
    // 立即切换界面，不要被全屏逻辑阻塞
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('game-play').classList.remove('hidden');

    // 尝试在移动端全屏并锁定横屏
    requestLandscape();

    // 移动端适配
    document.body.style.width = '100%';
    document.body.style.height = '100%';

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
            e.target.closest('#password-modal')) {
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
            e.target.closest('.hotspot')) {
            return;
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

    document.addEventListener('touchmove', function(e) {
        if (!isHolding) return;
        e.preventDefault();
        const t = e.touches[0];
        onDragMove(t.clientX, t.clientY);
    }, { passive: false });

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
    hotspot.addEventListener('touchstart', handler, true);
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

// 交互函数
function interactDoor() {
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
        showHelpless();
    } else {
        countSearch();
        showDialog('你尝试打开门，但是门被锁住了。需要找到钥匙才能打开。');
    }
}

function interactWindow() {
    if (gameState.flags.wasBitten && !gameState.flags.shownHelpless) {
        countSearch();
        showHelpless();
    } else {
        countSearch();
        showDialog('你尝试打开窗户，但是窗户是锁死的，怎么也打不开。');
    }
}

function interactDrawer() {
    if (gameState.flags.wasBitten && !gameState.flags.shownHelpless) {
        countSearch();
        showHelpless();
    } else {
        countSearch();
        showDialog('抽屉是锁住的，怎么也打不开。');
    }
}

function interactTable() {
    if (gameState.flags.wasBitten && !gameState.flags.shownHelpless) {
        countSearch();
        showHelpless();
        return;
    }

    // 如果钢笔还没掉落，提示玩家查看笔筒
    if (!gameState.penFallen && !gameState.inventory.includes('钢笔')) {
        countSearch();
        showDialog('桌子上放着一些书本、一个杯子，还有一个笔筒。笔筒里似乎有支钢笔。');
        return;
    }

    // 钢笔已经掉落，可以拾取
    if (gameState.penFallen && !gameState.inventory.includes('钢笔')) {
        showDialog('你从地上捡起了钢笔。这应该可以作为工具使用。');
        document.getElementById('pen-image').classList.add('hidden');
        gameState.inventory.push('钢笔');
        updateInventory();
    } else if (gameState.inventory.includes('钢笔')) {
        showDialog('桌子上已经没有什么有用的东西了。');
    } else {
        showDialog('桌子上放着一些书本和杯子，没有什么特别的。');
    }
}

function interactClock() {
    if (gameState.flags.solvedPassword && !gameState.flags.lookedAtClock) {
        gameState.flags.lookedAtClock = true;
        showDialog(
            '你看着钥匙陷入沉思，刚刚的密码总觉得有点奇怪，watch不就是表的意思吗？你环顾四周，目光停留在墙上挂的时钟上，家里与表有关的也就只有它了。\n\n你把时钟从墙上拿了下来，时钟奇怪的重量让你觉得肯定有东西，你把时钟打开，一道金光顿时把你包围……',
            () => showEnding('treasure')
        );
    } else if (gameState.flags.wasBitten && !gameState.flags.shownHelpless) {
        countSearch();
        showHelpless();
    } else {
        countSearch();
        showDialog('墙上挂着一个时钟，指针正在走动……');
    }
}

function interactSofa() {
    // 情节片段一：搜索足够多地方后，沙发传出声音
    if (!gameState.flags.foundCat && gameState.searchCount < 3) {
        showDialog('你调查了一下沙发，没有发现什么特别的东西。');
        gameState.searchCount++;
        return;
    }

    if (!gameState.flags.foundCat) {
        // 情节片段一：犹豫是否去查看
        showDialog(
            '你调查了好几个地方，但是都一无所获，你一头雾水，不知道下一步该怎么办，突然沙发的角落传出了悉悉索索的声音，你一下子紧张起来，什么东西？你犹豫到底要不要去沙发一探究竟。',
            () => showChoices([
                {
                    text: '🔍 鼓起勇气，去查看沙发角落',
                    callback: () => {
                        gameState.flags.foundCat = true;
                        document.getElementById('cat-image').classList.remove('hidden');
                        // 情节片段二：发现猫咪，直接显示对话并创建抚摸热点
                        showDialog(
                            '你慢慢靠近沙发，才发现在沙发的角落的沙发垫后面，一个小猫咪正惬意地睡着觉，看到你过来，她摆出招牌动作，翻出肚皮。\n\n你满脸问号，朵朵？就你一只猫在家里吗？',
                            () => {
                                // 恢复所有房间热点，并添加猫咪热点
                                createRoomHotspots();
                                // 创建独立的猫咪热点（不与沙发重叠）
                                createHotspot('pet_cat', '抚摸猫咪', '18%', '70%', '15%', '15%', () => {
                                    gameState.flags.wasBitten = true;
                                    document.getElementById('cat-image').classList.add('hidden');
                                    clearHotspots();
                                    // 情节片段三：被咬后的抉择
                                    showDialog(
                                        '你坐在沙发上摸着朵朵的肚子，突然，朵朵抱住你的手，对你又咬又挠！你赶紧把手抽了回来，看了看手上的爪子印以及牙印，再看向沙发时，朵朵早已不见踪影。\n\n你摇了摇头，在犹豫接下去该怎么办。',
                                        () => showChoices([
                                            {
                                                text: '🛋️ 回到沙发角落查看',
                                                callback: () => {
                                                    gameState.flags.foundBump = true;
                                                    showDialog('你来到朵朵刚刚躲藏的沙发角落，突然发现有一个凸起，不仔细看还真看不出来。\n\n你充满疑惑，得想办法把它打开看看里面是什么，但是你没有工具，得在桌子上找找有没有可以用的东西。',
                                                        () => createRoomHotspots());
                                                }
                                            },
                                            {
                                                text: '🔎 先继续探索房间',
                                                callback: () => createRoomHotspots()
                                            }
                                        ])
                                    );
                                });
                            }
                        );
                    }
                },
                {
                    text: '😨 太危险了，先去别处看看',
                    callback: () => {
                        showDialog('你犹豫再三，决定先去别处看看，或许还有其他线索。', () => createRoomHotspots());
                        gameState.searchCount = 2; // 下次点击沙发就会触发
                    }
                }
            ])
        );
        return;
    }

    if (gameState.flags.foundCat && !gameState.flags.wasBitten) {
        showDialog('沙发上空空如也，朵朵正在角落里睡觉。');
        return;
    }

    // 情节片段五：被咬后回到沙发，发现凸起
    if (gameState.flags.wasBitten && !gameState.flags.foundBump) {
        gameState.flags.foundBump = true;
        showDialog('你决定去朵朵刚刚睡觉的地方再看看，你来到朵朵刚刚躲藏的沙发角落，突然发现有一个凸起，不仔细看还真看不出来。\n\n你充满疑惑，得想办法把它打开看看里面是什么，但是你没有工具，得在桌子上找找有没有可以用的东西。');
        return;
    }

    // 情节片段六：有钢笔，撬开沙发取出铁盒
    if (gameState.flags.foundBump && gameState.inventory.includes('钢笔') && !gameState.flags.hasBox) {
        showDialog(
            '你来到沙发角落，看着这个凸起，手中的钢笔似乎可以派上用场……',
            () => showChoices([
                {
                    text: '✂️ 用钢笔划开沙发',
                    callback: () => {
                        showDialog(
                            '你在桌上找到了钢笔，把沙发弄出来一个洞，露出藏在里面的铁盒，你很奇怪怎么会有一个铁盒在沙发里，但是也想不了这么多了。\n\n你把铁盒拿了出来，发现铁盒被一个五位字母密码的锁锁住了，你觉得出去的钥匙可能就在这个盒子里面，于是便开始调查盒子的四周，看看有什么线索。'
                        );
                        gameState.inventory.push('铁盒');
                        gameState.flags.hasBox = true;
                        updateInventory();
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
        return;
    }

    if (gameState.flags.hasBox) {
        showDialog('沙发角落已经被你打开过了，没有什么新的发现了。');
        return;
    }

    if (gameState.flags.foundBump && !gameState.inventory.includes('钢笔')) {
        showDialog('沙发角落有一个凸起，但是你还没有找到合适的工具，去桌子上找找看。');
        return;
    }

    showDialog('沙发很舒适，你可以坐下来休息。');
}

// 情节片段四：无助
function showHelpless() {
    gameState.flags.shownHelpless = true;
    showDialog(
        '你决定继续翻找逃出去的线索，但是两个小时过去了，没一个抽屉能打开的，能翻的地方都翻过了，什么线索也没有，窗户也打不开，也找不到任何可以用的工具，空无一人的密闭房间让你紧张起来，这可怎么办？\n\n你下意识地把手伸进口袋想找手机，但是口袋里也什么都没有。你在想接下来该怎么办。',
        () => showChoices([
            {
                text: '🛋️ 回到沙发附近再仔细看看',
                callback: () => {
                    gameState.flags.foundBump = true;
                    showDialog('你决定去朵朵刚刚睡觉的地方再看看，你来到朵朵刚刚躲藏的沙发角落，突然发现有一个凸起，不仔细看还真看不出来。\n\n你充满疑惑，得想办法把它打开看看里面是什么，但是你没有工具，得在桌子上找找有没有可以用的东西。',
                        () => createRoomHotspots());
                }
            },
            {
                text: '🔎 继续检查其他地方',
                callback: () => {
                    showDialog('你深吸一口气，决定再仔细检查一遍，也许遗漏了什么……', () => createRoomHotspots());
                }
            }
        ])
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
        // 情节片段八：钥匙
        showDialog('你在密码锁上输入了正确密码：watch。噶哒一声，盒子打开了，里面有一把钥匙。');
        if (!gameState.inventory.includes('钥匙')) {
            gameState.inventory.push('钥匙');
            updateInventory();
        }
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
    gameState.flags = {
        foundCat: false,
        wasBitten: false,
        shownHelpless: false,
        foundBump: false,
        hasBox: false,
        solvedPassword: false,
        lookedAtClock: false
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
    updateInventory();
}
