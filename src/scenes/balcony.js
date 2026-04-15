// ===================== 阳台场景（含砖块谜题） =====================

import { gameState, saveGame } from '../state.js';
import { sceneManager } from '../scene-manager.js';
import { showDialog, updateInventory } from '../ui.js';
import { collectMemoryFragment } from '../notes.js';
import { PUZZLES, BRICK_POSITIONS } from '../data.js';
import { imgCoordsToContainer, parsePct } from '../scene-hotspot.js';

const IMG_W = 1200, IMG_H = 800;

function bPos(scene, left, top, width, height) {
    return imgCoordsToContainer(scene, IMG_W, IMG_H, parsePct(left), parsePct(top), parsePct(width), parsePct(height), 'contain');
}

const BRICK_ORDER = PUZZLES.brickOrder;

export function openBalconyScene() {
    sceneManager.open('balcony-scene', () => {
        const balconyImg = document.getElementById('balcony-image');
        const ct = gameState.flags.clockTime;
        if (ct === '10') {
            balconyImg.src = 'assets/balcony_10.jpg';
        } else if (ct === '15') {
            balconyImg.src = 'assets/balcony_15.jpg';
        } else {
            balconyImg.src = 'assets/balcony.jpg';
        }

        const isFirstVisit = !gameState.flags.balconySeen;
        const clockTime = gameState.flags.clockTime;
        const seenKey = clockTime ? `balconySeenAt_${clockTime}` : 'balconySeenNoTime';
        const isFirstAtThisTime = !gameState.flags[seenKey];
        gameState.flags.balconySeen = true;
        gameState.flags[seenKey] = true;
        saveGame();

        if (gameState.flags.hasLetter) {
            showDialog('阳台上静悄悄的，信已经拿走了。');
            setupBalconyHotspots();
            return;
        }

        if (!clockTime) {
            if (isFirstVisit) {
                const intro = gameState.flags.musicBoxSolved
                    ? '你踏上阳台。\n\n地板上有一串细小的爪印，还有几块刻着奇怪符号的砖。\n\n你想起了那张纸片——她当时就是从这扇窗跳出来的吧，然后坐在这里，望着外面。\n\n阳光平淡，什么都看不出来。也许光线的角度很重要……'
                    : '你踏上阳台。\n\n地板上有一串细小的爪印，还有几块刻着奇怪符号的砖。\n\n阳光平淡，什么都看不出来。也许光线的角度很重要……';
                showDialog(intro, () => {
                    showDialog('地板上有四块刻着符号的砖，顺序似乎很重要……', () => setupBalconyHotspots());
                });
            } else {
                setupBalconyHotspots();
            }
        } else if (clockTime === '10') {
            if (isFirstAtThisTime) {
                showDialog('上午的阳光从左侧斜射进来，光线柔和。\n\n仙人掌的影子被拉得很长，影子末端压着地板上的一条砖缝……就像信里写的那样。', () => {
                    setupBalconyHotspots();
                });
            } else {
                setupBalconyHotspots();
            }
        } else if (clockTime === '15') {
            if (isFirstAtThisTime) {
                showDialog('下午的阳光从右侧低低地照进来，光线橙红。\n\n绿植的影子斜斜地落在地板上，影子末端也压着一条砖缝……就像信里写的那样。', () => {
                    setupBalconyHotspots();
                });
            } else {
                setupBalconyHotspots();
            }
        } else {
            if (isFirstVisit) {
                showDialog('你踏上阳台。\n\n地板上有一串细小的爪印，还有几块刻着奇怪符号的砖。\n\n阳光平淡，什么都看不出来。', () => {
                    setupBalconyHotspots();
                });
            } else {
                setupBalconyHotspots();
            }
        }
    });
}

function setupBalconyHotspots() {
    const scene = document.getElementById('balcony-scene');
    scene.querySelectorAll('.balcony-hotspot').forEach(el => el.remove());

    const clockTime = gameState.flags.clockTime;

    const pawprint = document.createElement('div');
    pawprint.className = 'balcony-hotspot paw-trail';
    const pawPos = bPos(scene, '22%', '68.5%', '21%', '6%');
    pawprint.style.cssText = `left:${pawPos.left};top:${pawPos.top};width:${pawPos.width};height:${pawPos.height};`;
    pawprint.title = '爪印';
    pawprint.addEventListener('click', () => {
        showDialog('一串小小的爪印，从窗边延伸出去，好像去过好几个地方……');
    });
    pawprint.addEventListener('touchend', (e) => { e.preventDefault(); showDialog('一串小小的爪印，从窗边延伸出去，好像去过好几个地方……'); }, { passive: false });
    scene.appendChild(pawprint);

    if (clockTime === '10') {
        const crack1 = document.createElement('div');
        crack1.className = 'balcony-hotspot';
        const c1Pos = bPos(scene, '2.5%', '77%', '7%', '6%');
        crack1.style.cssText = `left:${c1Pos.left};top:${c1Pos.top};width:${c1Pos.width};height:${c1Pos.height};cursor:pointer;`;
        crack1.title = '仙人掌影子末端的砖缝';
        const onCrack1 = () => {
            if (gameState.flags.balconyNote1) return;
            gameState.flags.balconyClue1 = true;
            gameState.flags.balconyNote1 = true;
            if (!gameState.inventory.includes('阳台纸条')) gameState.inventory.push('阳台纸条');
            saveGame();
            updateInventory();
            crack1.remove();
            showDialog('你蹲下来，从砖缝里抽出一张卷起的纸条。\n\n"她总是等黑暗散尽，才去追那颗最亮的星，蜷在星光落下的地方睡着。"');
        };
        crack1.addEventListener('click', onCrack1);
        crack1.addEventListener('touchend', (e) => { e.preventDefault(); onCrack1(); }, { passive: false });
        scene.appendChild(crack1);
    }

    if (clockTime === '15') {
        const crack2 = document.createElement('div');
        crack2.className = 'balcony-hotspot';
        const c2Pos = bPos(scene, '70%', '77%', '10%', '4%');
        crack2.style.cssText = `left:${c2Pos.left};top:${c2Pos.top};width:${c2Pos.width};height:${c2Pos.height};cursor:pointer;`;
        crack2.title = '绿植影子末端的砖缝';
        const onCrack2 = () => {
            if (gameState.flags.balconyNote2) return;
            gameState.flags.balconyClue2 = true;
            gameState.flags.balconyNote2 = true;
            if (!gameState.inventory.includes('阳台纸条')) gameState.inventory.push('阳台纸条');
            saveGame();
            updateInventory();
            crack2.remove();
            showDialog('你蹲下来，从砖缝里抽出一张卷起的纸条。\n\n"阳光跑得比她快，一头扎进了海里。"');
        };
        crack2.addEventListener('click', onCrack2);
        crack2.addEventListener('touchend', (e) => { e.preventDefault(); onCrack2(); }, { passive: false });
        scene.appendChild(crack2);
    }

    if (!gameState.flags.balconyBrickSolved) {
        showBalconyBricks(scene);
    } else if (!gameState.flags.hasLetter) {
        const base = document.createElement('div');
        base.className = 'balcony-hotspot';
        const basePos = bPos(scene, '46.5%', '65%', '3.5%', '5%');
        base.style.cssText = `left:${basePos.left};top:${basePos.top};width:${basePos.width};height:${basePos.height};cursor:pointer;`;
        base.title = '地板上弹开的底座';
        const onBase = () => {
            showDialog('地板上有一道弹开的缝隙，里面压着一个防水袋，里面有一封信和一把钥匙。', () => {
                gameState.flags.hasLetter = true;
                if (!gameState.inventory.includes('阳台的信')) gameState.inventory.push('阳台的信');
                if (!gameState.inventory.includes('备用钥匙')) gameState.inventory.push('备用钥匙');
                saveGame();
                updateInventory();
                const scene = document.getElementById('balcony-scene');
                if (scene) {
                    const t = document.createElement('div'); t.className = 'pickup-toast'; t.textContent = '✓ 获得阳台的信 + 备用钥匙'; scene.appendChild(t); setTimeout(() => t.remove(), 1600);
                }
                showDialog('你获得了一封信和一把备用钥匙。\n\n信上写着：\n"备用钥匙放在这里，防止哪天钥匙丢了进不了门。这把钥匙能开家门。\n\n——主人"', () => {
                    collectMemoryFragment(4);
                });
            });
        };
        base.addEventListener('click', onBase);
        base.addEventListener('touchend', (e) => { e.preventDefault(); onBase(); }, { passive: false });
        scene.appendChild(base);
    }
}

function showBalconyBricks(scene) {
    scene.querySelectorAll('.balcony-brick').forEach(el => el.remove());

    BRICK_POSITIONS.forEach(b => {
        const brick = document.createElement('div');
        brick.className = 'balcony-brick balcony-hotspot';
        brick.dataset.brickKey = b.key;
        const brickPos = bPos(scene, b.left, b.top, '7%', '9%');
        brick.style.cssText = `left:${brickPos.left};top:${brickPos.top};width:${brickPos.width};height:${brickPos.height};cursor:pointer;`;
        brick.addEventListener('click', () => handleBrickClick(b.key));
        brick.addEventListener('touchend', (e) => { e.preventDefault(); handleBrickClick(b.key); }, { passive: false });
        scene.appendChild(brick);
    });
}

function handleBrickClick(key) {
    if (gameState.flags.balconyBrickSolved) return;

    const expected = BRICK_ORDER[gameState.flags.balconyBrickStep];
    if (key === expected) {
        gameState.flags.balconyBrickStep++;
        saveGame();
        const brick = document.querySelector(`.balcony-brick[data-brick-key="${key}"]`);
        if (brick) brick.style.boxShadow = '0 0 12px 4px rgba(255,220,80,0.85)';

        if (gameState.flags.balconyBrickStep >= 4) {
            gameState.flags.balconyBrickSolved = true;
            saveGame();
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

export function closeBalconyScene() {
    sceneManager.closeToRoom();
}
