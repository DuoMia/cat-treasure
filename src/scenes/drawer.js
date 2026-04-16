// ===================== 抽屉特写场景 =====================

import { gameState, saveGame } from '../state.js';
import { sceneManager } from '../scene-manager.js';
import { showDialog, updateInventory } from '../ui.js';
import { imgCoordsToContainer } from '../scene-hotspot.js';
import { showPickupToast } from '../utils.js';

export function openDrawerScene() {
    sceneManager.open('drawer-scene', () => {
        const scene = document.getElementById('drawer-scene');
        const hotspot = document.getElementById('drawer-diary-hotspot');
        const pos = imgCoordsToContainer(scene, 800, 600, 0.32, 0.26, 0.26, 0.43);
        hotspot.style.left = pos.left; hotspot.style.top = pos.top;
        hotspot.style.width = pos.width; hotspot.style.height = pos.height;
        if (!gameState.flags.hasDiary) {
            hotspot.onclick = function() {
                showDialog('2021年8月29日\n\n朵朵来了。她很小，一直躲在沙发角落不出来。我把她的第一个项圈和一个小音乐盒一起放进了书架最里面的格子，我最喜欢将5本书按朵朵的样子摆放。', () => {
                showDialog('她有自己的规律。早7点、午12点、晚6点、夜10点，从不迟到，她还有自己的吃饭习惯。我把这些记在食盆旁边的卡片上，怕自己忘。', () => {
                showDialog('她最后一次玩玩具是离开前的那个傍晚。先把球滚到我脚边，再去闻了闻小鱼，然后用爪子拨了拨铃铛。我把那个顺序锁进了玩具箱的图案锁里。', () => {
                showDialog('朵朵没事干最喜欢在阳台发呆了，不同时间会待在不同的地方。', () => {
                    gameState.flags.hasDiary = true;
                    saveGame();
                    if (!gameState.inventory.includes('日记')) {
                        gameState.inventory.push('日记');
                        updateInventory();
                        showPickupToast('✓ 获得日记');
                    }
                    showDialog('日记已拾取，可以在背包里随时查看。', () => {
                        showDialog('房间好像有了些变化，再去探索一下。');
                    });
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
    });
}

export function closeDrawerScene() {
    sceneManager.closeToRoom();
}
