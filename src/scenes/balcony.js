// ===================== 阳台场景（含砖块谜题） =====================

import { gameState, saveGame } from '../state.js';
import { sceneManager } from '../scene-manager.js';
import { showDialog, updateInventory } from '../ui.js';
import { collectStickyNote, collectMemoryFragment } from '../notes.js';
import { PUZZLES, BRICK_POSITIONS } from '../data.js';
import { imgCoordsToContainer, parsePct } from '../scene-hotspot.js';

const IMG_W = 1200, IMG_H = 800;

function bPos(scene, left, top, width, height) {
    return imgCoordsToContainer(scene, IMG_W, IMG_H, parsePct(left), parsePct(top), parsePct(width), parsePct(height));
}

const BRICK_ORDER = PUZZLES.brickOrder;

export function openBalconyScene() {
    sceneManager.open('balcony-scene', () => {
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
        saveGame();

        if (gameState.flags.hasLetter) {
            showDialog('阳台上静悄悄的，信已经拿走了。');
            setupBalconyHotspots();
            return;
        }

        const clockTime = gameState.flags.clockTime;
        if (!clockTime) {
            const intro = gameState.flags.musicBoxSolved && isFirstVisit
                ? '你踏上阳台。\n\n地板上有一串细小的爪印，还有几块刻着奇怪符号的砖。\n\n你想起了那张纸片——她当时就是从这扇窗跳出来的吧，然后坐在这里，望着外面。\n\n阳光平淡，什么都看不出来。也许光线的角度很重要……'
                : '你踏上阳台。\n\n地板上有一串细小的爪印，还有几块刻着奇怪符号的砖。\n\n阳光平淡，什么都看不出来。也许光线的角度很重要……';
            showDialog(intro, () => {
                if (isFirstVisit) {
                    showDialog('地板上有四块刻着符号的砖，顺序似乎很重要……', () => setupBalconyHotspots());
                } else {
                    setupBalconyHotspots();
                }
            });
        } else if (clockTime === '10') {
            showDialog('上午的阳光从左侧斜射进来，光线柔和。\n\n仙人掌的影子被拉得很长，影子末端压着地板上的一条砖缝……就像信里写的那样。', () => {
                setupBalconyHotspots();
            });
        } else if (clockTime === '15') {
            showDialog('下午的阳光从右侧低低地照进来，光线橙红。\n\n绿植的影子斜斜地落在地板上，影子末端也压着一条砖缝……就像信里写的那样。', () => {
                setupBalconyHotspots();
            });
        } else {
            showDialog('你踏上阳台。\n\n地板上有一串细小的爪印，还有几块刻着奇怪符号的砖。\n\n阳光平淡，什么都看不出来。', () => {
                setupBalconyHotspots();
            });
        }
    });
}

function setupBalconyHotspots() {
    const scene = document.getElementById('balcony-scene');
    scene.querySelectorAll('.balcony-hotspot').forEach(el => el.remove());

    const clockTime = gameState.flags.clockTime;

    const pawprint = document.createElement('div');
    pawprint.className = 'balcony-hotspot paw-trail';
    const pawPos = bPos(scene, '20%', '55%', '55%', '12%');
    pawprint.style.cssText = `left:${pawPos.left};top:${pawPos.top};width:${pawPos.width};height:${pawPos.height};`;
    pawprint.title = '爪印';
    pawprint.addEventListener('click', () => {
        showDialog('一串小小的爪印，从窗边延伸出去，好像去过好几个地方……');
    });
    scene.appendChild(pawprint);

    if (clockTime === '10') {
        const crack1 = document.createElement('div');
        crack1.className = 'balcony-hotspot';
        const c1Pos = bPos(scene, '8%', '78%', '18%', '8%');
        crack1.style.cssText = `left:${c1Pos.left};top:${c1Pos.top};width:${c1Pos.width};height:${c1Pos.height};cursor:pointer;`;
        crack1.title = '仙人掌影子末端的砖缝';
        crack1.addEventListener('click', () => {
            gameState.flags.balconyClue1 = true;
            saveGame();
            showDialog('你蹲下来，从砖缝里抽出一张卷起的纸条。\n\n"她总是等黑暗散尽，才去追那道光，最后蜷在星星落下的地方睡着。"');
        });
        scene.appendChild(crack1);
    }

    if (clockTime === '15') {
        const crack2 = document.createElement('div');
        crack2.className = 'balcony-hotspot';
        const c2Pos = bPos(scene, '74%', '78%', '18%', '8%');
        crack2.style.cssText = `left:${c2Pos.left};top:${c2Pos.top};width:${c2Pos.width};height:${c2Pos.height};cursor:pointer;`;
        crack2.title = '绿植影子末端的砖缝';
        crack2.addEventListener('click', () => {
            gameState.flags.balconyClue2 = true;
            saveGame();
            showDialog('你蹲下来，从砖缝里抽出一张卷起的纸条。\n\n"光跑得比她快，一头扎进了海里。"');
        });
        scene.appendChild(crack2);
    }

    if (!gameState.flags.balconyBrickSolved) {
        showBalconyBricks(scene);
    } else if (!gameState.flags.hasLetter) {
        const base = document.createElement('div');
        base.className = 'balcony-hotspot';
        const basePos = bPos(scene, '48%', '68%', '14%', '8%');
        base.style.cssText = `left:${basePos.left};top:${basePos.top};width:${basePos.width};height:${basePos.height};cursor:pointer;`;
        base.title = '地板上弹开的底座';
        base.addEventListener('click', () => {
            showDialog('地板上有一道弹开的缝隙，里面压着一个防水袋，里面有一封信。', () => {
                gameState.flags.hasLetter = true;
                gameState.inventory.push('信');
                saveGame();
                updateInventory();
                const scene = document.getElementById('balcony-scene');
                if (scene) { const t = document.createElement('div'); t.className = 'pickup-toast'; t.textContent = '✓ 获得信'; scene.appendChild(t); setTimeout(() => t.remove(), 1300); }
                showDialog('你获得了一封信。\n\n"如果你找到了这里，说明你已经理解了朵朵的心意。\n\n她陪了我五年，是我最好的朋友。我离开的时候，她一定很难过，所以我把最重要的东西留给了她，也留给了你。\n\n时钟里藏着我们的秘密，那是朵朵神藏的最后一块拼图。\n\n——主人"', () => {
                    showDialog('你握着这封信，心里涌起一股说不清的情绪。\n\n时钟……一切线索都指向那里。', () => {
                        collectMemoryFragment(4);
                    });
                });
            });
        });
        scene.appendChild(base);
    }

    if (!gameState.flags.stickyNotes.includes('note5')) {
        const note = document.createElement('div');
        note.className = 'sticky-note-hotspot';
        note.style.cssText = 'position:absolute;right:6%;top:10%;font-size:28px;cursor:pointer;z-index:210;';
        note.textContent = '📝';
        note.addEventListener('click', () => {
            note.remove();
            collectStickyNote('note5');
        });
        scene.appendChild(note);
    }
}

function showBalconyBricks(scene) {
    scene.querySelectorAll('.balcony-brick').forEach(el => el.remove());

    BRICK_POSITIONS.forEach(b => {
        const brick = document.createElement('div');
        brick.className = 'balcony-brick balcony-hotspot';
        brick.dataset.brickKey = b.key;
        const brickPos = bPos(scene, b.left, b.top, '6%', '6%');
        brick.style.cssText = `left:${brickPos.left};top:${brickPos.top};width:${brickPos.width};height:${brickPos.height};cursor:pointer;`;
        brick.addEventListener('click', () => handleBrickClick(b.key));
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
