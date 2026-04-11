// ===================== 沙发角落场景 =====================

import { gameState, saveGame } from '../state.js';
import { sceneManager } from '../scene-manager.js';
import { showDialog, showChoices, updateInventory } from '../ui.js';
import { setTapHandler } from '../utils.js';
import { createRoomHotspots } from '../interactions.js';
import { collectStickyNote } from '../notes.js';

export function openSofaCornerScene() {
    sceneManager.open('sofa-corner-scene', () => {
        closeCornerUI();
        const catImg = document.getElementById('sofa-corner-cat');
        const bump = document.getElementById('sofa-corner-bump');
        const scratch = document.getElementById('sofa-corner-scratch');

        scratch.classList.remove('hidden');
        setTapHandler(scratch, function() {
            showDialog('坏朵朵，又挠沙发！');
        });

        if (!gameState.flags.foundCat) {
            catImg.classList.remove('hidden');
            bump.onclick = null;
            catImg.onclick = null;
            showDialog('你走近沙发角落，发现朵朵正蜷缩在那里，她懒洋洋地翻了个身，露出了肚皮……', () => {
                setTapHandler(catImg, function() {
                    catImg.onclick = null;
                    gameState.flags.foundCat = true;
                    gameState.flags.wasBitten = true;
                    saveGame();
                    catImg.classList.add('hidden');
                    showDialog(
                        '你蹲下来想摸摸朵朵，没想到朵朵突然抱住你的手，对你又咬又挠！你赶紧把手抽了回来，看了看手上的爪子印以及牙印，再看向沙发时，朵朵早已不见踪影。',
                        () => setupBumpInteraction()
                    );
                }, true);
            });
        } else {
            catImg.classList.add('hidden');
            setupBumpInteraction();
        }
    });
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
            saveGame();
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
                        saveGame();
                        updateInventory();
                        setTapHandler(bump, function() {
                            showDialog('沙发角落已经被你打开过了，没有什么新的发现了。');
                        });
                        showDialog(
                            '你用钢笔把沙发划开一个洞，露出藏在里面的铁盒。你很奇怪怎么会有一个铁盒在沙发里，但也想不了这么多了。\n\n铁盒旁边，沙发内衬上有4道深深的抓痕，那是朵朵的杰作——她把这里当成了自己的秘密基地。',
                            () => {
                                gameState.flags.sofaScratchSeen = true;
                                saveGame();
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

export function closeSofaCornerScene() {
    closeCornerUI();
    document.getElementById('sofa-corner-cat').onclick = null;
    document.getElementById('sofa-corner-scratch').classList.add('hidden');
    sceneManager.closeToRoom();
}
