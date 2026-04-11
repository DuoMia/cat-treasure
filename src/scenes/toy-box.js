// ===================== 玩具箱场景 =====================

import { gameState, saveGame } from '../state.js';
import { sceneManager } from '../scene-manager.js';
import { showDialog, updateInventory } from '../ui.js';
import { collectStickyNote, collectMemoryFragment } from '../notes.js';
import { PUZZLES, TOY_BOX_POSITIONS } from '../data.js';

const TOY_BOX_ORDER = PUZZLES.toyBoxOrder;

export function openToyBoxScene() {
    sceneManager.open('toy-box-scene', () => {
        gameState.flags.toyBoxSeen = true;
        saveGame();
        gameState.flags.toyBoxStep = 0;
        setupToyBoxHotspots();

        const scene = document.getElementById('toy-box-scene');
        if (!gameState.flags.balconyClue2) {
            const noteB = document.createElement('div');
            noteB.id = 'balcony-note-b';
            noteB.style.cssText = 'position:absolute;left:4%;bottom:8%;width:6%;height:8%;cursor:pointer;';
            noteB.title = '玩具箱底部的纸条';
            noteB.addEventListener('click', () => {
                gameState.flags.balconyClue2 = true;
                saveGame();
                noteB.remove();
                showDialog('你在玩具箱底部发现了一张夹着的纸条。\n\n"下午三点，她会挪到阳台右边，把脸埋进那盆绿植里，等影子爬过来。"', () => {
                    showDialog('下午三点……影子……\n\n你想起了墙上的那个时钟。');
                });
            });
            scene.appendChild(noteB);
        }
    });
}

function setupToyBoxHotspots() {
    const scene = document.getElementById('toy-box-scene');
    scene.querySelectorAll('.toy-btn').forEach(el => el.remove());

    TOY_BOX_POSITIONS.forEach(p => {
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
        saveGame();
        const btn = document.querySelector(`.toy-btn[data-toy-id="${toyId}"]`);
        if (btn) btn.classList.add('toy-selected');

        if (gameState.flags.toyBoxStep >= 4) {
            gameState.flags.toyBoxSolved = true;
            saveGame();
            showDialog('咔哒——木箱的锁弹开了！\n\n里面有一封信，信纸上印满了小小的爪印……', () => {
                gameState.flags.hasCatLetter = true;
                gameState.inventory.push('朵朵的信');
                saveGame();
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

export function closeToyBoxScene() {
    sceneManager.closeToRoom();
}
