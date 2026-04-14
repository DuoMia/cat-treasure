// ===================== 入口：接线 + startGame =====================

import { gameState, loadGame, deleteSave, resetGameState, hasSave } from './state.js';
import { isMobileDevice, centerViewport, showDragHint, setupPortraitDrag } from './utils.js';
import { showDialog, showChoices, handleDialogClick, resetDialog, updateInventory, toggleInventory, showHelp, showEnding, toggleDebugMode, openPasswordModal, closePasswordModal, submitPassword, openDrawerModal, closeDrawerModal, submitDrawerPassword } from './ui.js';
import { initHotspotCallbacks } from './hotspots.js';
import { setupPenHolderInteraction, isHoldingPen, resetPenHolder } from './pen-holder.js';
import { collectStickyNote, collectMemoryFragment } from './notes.js';
import { sceneManager } from './scene-manager.js';
import { installGestureLock } from './gesture-lock.js';
import {
    openSofaCornerScene, closeSofaCornerScene,
    openPhotoWallScene, closePhotoWallScene,
    openBookshelfScene, closeBookshelfScene,
    openFoodBowlScene, closeFoodBowlScene,
    openPaintingPuzzle, closePaintingScene,
    openToyBoxScene, closeToyBoxScene,
    openBalconyScene, closeBalconyScene,
    openClockScene, closeClockScene,
    openDrawerScene, closeDrawerScene,
    openWindowScene, closeWindowScene
} from './scenes/index.js';
import {
    interactDoor, interactWindow, interactSofa, interactTable,
    interactClock, interactDrawer, interactPhotoWall, interactToys,
    interactBookshelf, interactFoodBowl, interactPainting, interactToyBox,
    createRoomHotspots
} from './interactions.js';

// ===================== 注入 hotspot 回调（消除循环依赖） =====================

initHotspotCallbacks(createRoomHotspots, interactSofa);

// 页面加载时立即锁定所有系统级手势
installGestureLock();

// 移动端：给所有返回按钮绑定 touchend，消除 300ms 延迟，滑动不触发
function isUIOpen() {
    return !document.getElementById('dialog-box').classList.contains('hidden') ||
           !document.getElementById('choice-box').classList.contains('hidden');
}

document.querySelectorAll('.scene-back-btn').forEach(btn => {
    let _tx = 0, _ty = 0;
    btn.addEventListener('touchstart', (e) => {
        _tx = e.touches[0].clientX;
        _ty = e.touches[0].clientY;
    }, { passive: true });
    btn.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - _tx;
        const dy = e.changedTouches[0].clientY - _ty;
        if (dx * dx + dy * dy > 64) return;
        if (isUIOpen()) { e.preventDefault(); e.stopPropagation(); return; }
        e.preventDefault();
        e.stopPropagation();
        if (typeof btn.onclick === 'function') btn.onclick(e);
    }, { passive: false });
    btn.addEventListener('click', (e) => {
        if (isUIOpen()) { e.preventDefault(); e.stopPropagation(); }
    }, true);
});

let _listenersSetup = false;

// 页面加载时：有存档则显示"重新开始"按钮
if (hasSave()) {
    document.getElementById('restart-btn').classList.remove('hidden');
}

// ===================== startGame =====================

function startGame(isRestart = false) {
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('restart-btn').classList.add('hidden');
    document.getElementById('game-play').classList.remove('hidden');
    document.getElementById('inventory-toggle').classList.remove('hidden');
    document.getElementById('help-toggle').classList.remove('hidden');

    // 尝试恢复存档（重新开始时跳过）
    const hasSave = !isRestart && loadGame();
    if (hasSave) {
        updateInventory();
        if (gameState.penFallen) {
            document.getElementById('pen-holder-image').classList.add('hidden');
            document.getElementById('pen-holder-hotspot').classList.add('hidden');
            if (!gameState.inventory.includes('钢笔')) {
                document.getElementById('pen-image').classList.remove('hidden');
                document.getElementById('pen-image').classList.add('fallen');
            }
        }
    }

    // 同步调试按钮文案（存档可能保存了 debugMode 状态）
    const debugBtn = document.getElementById('debug-toggle');
    if (debugBtn) {
        if (gameState.debugMode) {
            document.body.classList.add('debug-mode');
            debugBtn.textContent = '🔧 关闭调试';
        } else {
            document.body.classList.remove('debug-mode');
            debugBtn.textContent = '🔧 调试模式';
        }
    }

    if (isMobileDevice()) {
        setupPortraitDrag(isHoldingPen);
        centerViewport();
        showDragHint();
    }

    // 显示笔筒（钢笔已落地则保持隐藏）
    if (!gameState.penFallen) {
        document.getElementById('pen-holder-image').classList.remove('hidden');
        document.getElementById('pen-holder-hotspot').classList.remove('hidden');
    }

    // 笔筒长按摇晃交互
    setupPenHolderInteraction();

    document.getElementById('inventory-toggle').onclick = toggleInventory;

    // 全局拦截：对话框或选项框开着时，阻止所有其他元素的点击/触摸
    function blockWhenOverlay(e) {
        if (e.target.closest('.scene-back-btn')) return;
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
    document.getElementById('inventory-toggle').onclick = toggleInventory;

    if (!_listenersSetup) {
        _listenersSetup = true;

        // 全局拦截：对话框或选项框开着时，阻止所有其他元素的点击/触摸
        function blockWhenOverlay(e) {
            // 返回按钮始终直通，不被对话框拦截
            if (e.target.closest('.scene-back-btn')) return;
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

        // 对话框本身绑定点击/触摸
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
            if (e.target.closest('.scene-back-btn')) return;
            const dialogBox = document.getElementById('dialog-box');
            if (!dialogBox.classList.contains('hidden')) {
                handleDialogClick();
                return;
            }
            if (!e.target.closest('#room-scene') && !e.target.closest('#dialog-box') && !e.target.closest('#choice-box') && !e.target.closest('#inventory-toggle') && !e.target.closest('#inventory-panel')) {
                return;
            }
            const choiceBox = document.getElementById('choice-box');
            if (!choiceBox.classList.contains('hidden')) {
                return;
            }
            if (e.target.closest('#inventory-toggle') ||
                e.target.closest('#inventory-panel') ||
                e.target.closest('#password-modal') ||
                e.target.closest('#drawer-modal')) {
                return;
            }
        });

        // 移动端触摸事件处理
        document.getElementById('game-play').addEventListener('touchend', function(e) {
            if (e.target.closest('.scene-back-btn')) return;
            if (e.target.closest('#pen-holder-hotspot')) {
                return;
            }

            const dialogBox = document.getElementById('dialog-box');
            if (!dialogBox.classList.contains('hidden')) {
                e.preventDefault();
                handleDialogClick();
                return;
            }

            if (!e.target.closest('#room-scene') && !e.target.closest('#dialog-box') && !e.target.closest('#choice-box') && !e.target.closest('#inventory-toggle') && !e.target.closest('#inventory-panel')) {
                return;
            }

            const choiceBox = document.getElementById('choice-box');
            if (!choiceBox.classList.contains('hidden')) {
                return;
            }

            if (e.target.closest('#inventory-toggle') ||
                e.target.closest('#inventory-panel') ||
                e.target.closest('#password-modal') ||
                e.target.closest('#drawer-modal') ||
                e.target.closest('.hotspot')) {
                return;
            }

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
    }

    if (hasSave) {
        createRoomHotspots();
    } else {
        showDialog(
            '你醒来时，发现自己身处国权路333弄，也就是自己的家中。\n\n四周是熟悉的环境，但是却又有些说不出的违和感，好像有什么东西原本不属于这里。\n\n你的头有点晕，你只记得梦中的朵朵会说话，一直在说"猫咪神藏"这四个字，你刚想问个究竟，就醒了。',
            () => showDialog(
                '你晃了晃头，准备先出去看看，却发现门被锁住了。口袋里的手机也不知所踪，大声呼喊也无人应答。\n\n你决定先在房间里调查一下，看看有没有钥匙或者有没有出去的方法。',
                () => createRoomHotspots()
            )
        );
    }

    // PC 端窗口 resize 时重建热区，保持坐标与图片对齐
    let _resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(_resizeTimer);
        _resizeTimer = setTimeout(() => {
            if (document.getElementById('hotspots').children.length > 0) {
                createRoomHotspots();
            }
        }, 150);
    });
}

// ===================== 重新开始 =====================

function restartGame() {
    deleteSave();
    resetGameState();
    resetDialog();
    resetPenHolder();
    document.getElementById('cat-image').classList.add('hidden');
    document.getElementById('pen-image').classList.add('hidden');
    document.getElementById('choice-box').classList.add('hidden');
    document.getElementById('ending-screen').classList.add('hidden');
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
    document.getElementById('inventory-panel').classList.add('hidden');
    startGame(true);
}

// ===================== 导出全局函数 (供 HTML onclick 调用) =====================

export {
    startGame,
    restartGame,
    toggleDebugMode,
    showHelp,
    toggleInventory,
    updateInventory,
    handleDialogClick,
    showDialog,
    showChoices,
    showEnding,
    openPasswordModal,
    closePasswordModal,
    submitPassword,
    openDrawerModal,
    closeDrawerModal,
    submitDrawerPassword,
    collectStickyNote,
    collectMemoryFragment,
    // 场景 close 函数供 onclick 调用
    closeSofaCornerScene,
    closePhotoWallScene,
    closeBookshelfScene,
    closeFoodBowlScene,
    closePaintingScene,
    closeToyBoxScene,
    closeBalconyScene,
    closeClockScene,
    closeDrawerScene,
    closeWindowScene
};

// 从 ui.js 中提取 closeAlbumScene 并导出（供 HTML onclick）
// 由于 closeAlbumScene 在 ui.js 中是模块内部函数，这里通过 sceneManager 重新实现
export function closeAlbumScene() {
    sceneManager.closeToRoom();
}

// fallback 场景中的交互函数
export {
    interactDoor,
    interactWindow,
    interactSofa,
    interactTable,
    interactClock,
    interactDrawer
};
