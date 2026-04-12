// ===================== 抽屉特写场景 =====================

import { gameState, saveGame } from '../state.js';
import { sceneManager } from '../scene-manager.js';
import { showDialog, updateInventory } from '../ui.js';

export function openDrawerScene() {
    sceneManager.open('drawer-scene', () => {
        const hotspot = document.getElementById('drawer-diary-hotspot');
        if (!gameState.flags.hasDiary) {
            hotspot.onclick = function() {
                showDialog('2021年8月29日\n\n朵朵来了。她很小，一直躲在沙发角落不出来。我把她的第一个项圈和一个小音乐盒一起放进了书架最里面的格子，5本书按厚薄排好就能打开。等她长大了，也许有人会找到。', () => {
                showDialog('她有自己的规律。早7点、午12点、晚6点、夜10点，从不迟到。我把这些记在食盆旁边的卡片上，怕自己忘。', () => {
                showDialog('她最后一次玩玩具是离开前的那个傍晚。先闻了闻小鱼，用爪子确认了铃铛，然后把球推给我。我把那个顺序锁进了玩具箱的图案锁里。', () => {
                showDialog('我把最重要的东西藏在了她每天下午都会凝视的地方。那里，时间从不停歇。', () => {
                    gameState.flags.hasDiary = true;
                    saveGame();
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
    });
}

export function closeDrawerScene() {
    sceneManager.closeToRoom();
}
