// ===================== 主房间交互函数 =====================

import { gameState, saveGame } from './state.js';
import { showDialog, showChoices, openPasswordModal, openDrawerModal, showEnding, updateInventory } from './ui.js';
import { trackObjectClick, tickExploreAfterBite, clearHotspots, createHotspot } from './hotspots.js';
import { collectStickyNote, createStickyNoteEl } from './notes.js';
import { ROOM_HOTSPOTS } from './data.js';
import {
    openSofaCornerScene,
    openPhotoWallScene, setPendingPhotoWallHint,
    openBookshelfScene,
    openFoodBowlScene,
    openPaintingPuzzle,
    openToyBoxScene,
    openBalconyScene,
    openClockScene,
    openDrawerScene,
    openWindowScene
} from './scenes/index.js';

export function createRoomHotspots() {
    clearHotspots();
    ROOM_HOTSPOTS.forEach(obj => {
        createHotspot(obj.id, obj.label, obj.x, obj.y, obj.width, obj.height, () => INTERACT_MAP[obj.id]?.());
    });

    // 便利贴1：桌子旁
    if (!gameState.flags.stickyNotes.includes('note1')) {
        const hotspots = document.getElementById('hotspots');
        const note = createStickyNoteEl('note1', 'position:absolute;left:53%;top:65%;font-size:24px;z-index:15;user-select:none;', () => collectStickyNote('note1'));
        note.id = 'sticky-note-1';
        hotspots.appendChild(note);
    }

    // 两封信同时在背包时弹一次提示
    if (
        !gameState.flags.bothLettersHint &&
        gameState.inventory.includes('朵朵的信') &&
        gameState.inventory.includes('主人的信')
    ) {
        gameState.flags.bothLettersHint = true;
        saveGame();
        setTimeout(() => showDialog('两封信中的时间……会不会和时钟有关？'), 100);
    }
}

const INTERACT_MAP = {
    door:       () => interactDoor(),
    window:     () => interactWindow(),
    sofa:       () => interactSofa(),
    table:      () => interactTable(),
    clock:      () => interactClock(),
    drawer:     () => interactDrawer(),
    'photo-wall': () => interactPhotoWall(),
    toys:       () => interactToys(),
    bookshelf:  () => interactBookshelf(),
    'food-bowl': () => interactFoodBowl(),
    painting:   () => interactPainting(),
    'toy-box':  () => interactToyBox(),
};

export function interactDoor() {
    if (tickExploreAfterBite()) return;
    if (gameState.inventory.includes('钥匙') || gameState.inventory.includes('备用钥匙')) {
        showChoices([
            {
                text: '🚪 开门出去',
                callback: () => {
                    showDialog(
                        '你拿着钥匙，赶紧到门口试了试，果然是房门钥匙，你按耐不住兴奋的心情，赶紧走出大门，却只觉得一阵头晕目眩，昏了过去。\n\n昏迷时，你做了一个梦，梦里朵朵一直在说"猫咪神藏"，你不知道什么时候才能醒来。',
                        () => showEnding('cycle')
                    );
                }
            },
            {
                text: '🔍 再看看',
                callback: () => {
                    showDialog('你把钥匙收好，转身回到房间。\n\n答案就在这里，你能感觉到。', () => createRoomHotspots());
                }
            }
        ]);
    } else {
        trackObjectClick('door', (next) => {
            showDialog('你尝试打开门，但是门被锁住了。需要找到钥匙才能打开。', next);
        });
    }
}

export function interactWindow() {
    if (tickExploreAfterBite()) return;
    if (gameState.flags.hasDiary) {
        if (gameState.flags.stickyNotes.includes('note2')) {
            openBalconyScene();
        } else {
            openWindowScene();
        }
    } else if (gameState.flags.hasNote && !gameState.flags.drawerOpened) {
        trackObjectClick('window', (next) => {
            showDialog('窗户是锁死的……但你现在满脑子都是抽屉上的密码锁。\n\n先去解开抽屉吧。', next);
        });
    } else {
        trackObjectClick('window', (next) => {
            showDialog('你尝试打开窗户，但是窗户是锁死的，怎么也打不开。', next);
        });
    }
}

export function interactDrawer() {
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
        trackObjectClick('drawer', (next) => {
            showDialog('抽屉是锁住的，怎么也打不开。', next);
        });
    }
}

export function interactPhotoWall() {
    if (tickExploreAfterBite()) return;
    trackObjectClick('photo-wall', (next) => {
        setPendingPhotoWallHint(next || null);
        openPhotoWallScene();
    });
}

export function interactToys() {
    if (tickExploreAfterBite()) return;
    trackObjectClick('toys', (next) => {
        gameState.flags.toyCountSeen = true;
        if (gameState.flags.photoWallSeen && !gameState.flags.toyBoxSeen) {
            showDialog('地板上散落着朵朵的玩具：一个毛线球、一个铃铛球、还有一条小鱼。\n\n等等……桌子下面好像还有个小木箱？', next);
        } else {
            showDialog('地板上散落着朵朵的玩具：一个毛线球、一个铃铛球、还有一条小鱼。主人把她最爱的3个玩具都留在这里了。', next);
        }
    });
}

export function interactBookshelf() {
    if (tickExploreAfterBite()) return;
    trackObjectClick('bookshelf', (next) => {
        if (gameState.flags.hasNote && !gameState.flags.drawerOpened) {
            showDialog('书架上有个精致的音乐盒……但你脑子里一直想着那张纸条上的数字。\n\n先去解开抽屉的密码锁吧。', next);
        } else if (!gameState.flags.hasDiary) {
            showDialog('书架上摆满了书，还有一些小摆件。角落里有个精致的音乐盒，盒盖上落了一层薄薄的灰尘，好像很久没人碰过了。', next);
        } else if (!gameState.flags.bookPuzzleSolved) {
            showDialog('日记里提到过书架……5本书，按朵朵样子排好。', () => {
                openBookshelfScene();
            });
        } else if (!gameState.flags.musicBoxSolved) {
            showDialog('隐藏格子还开着，音乐盒还没解开。', () => {
                openBookshelfScene();
            });
        } else {
            openBookshelfScene();
        }
    });
}

export function interactFoodBowl() {
    if (tickExploreAfterBite()) return;
    trackObjectClick('food-bowl', (next) => {
        if (gameState.flags.hasNote && !gameState.flags.drawerOpened) {
            showDialog('食盆旁边贴着一张喂食记录卡……但你现在满脑子都是抽屉上的密码锁。\n\n先去解开抽屉吧。', next);
        } else if (!gameState.flags.hasDiary) {
            showDialog('沙发旁边放着朵朵的食盆，盆边贴着一张喂食记录卡。', next);
        } else {
            openFoodBowlScene();
        }
    });
}

export function interactPainting() {
    if (tickExploreAfterBite()) return;
    trackObjectClick('painting', (next) => {
        if (gameState.flags.paintingPuzzleSolved) {
            openPaintingPuzzle();
        } else if (gameState.flags.hasNote && !gameState.flags.drawerOpened) {
            showDialog('墙上挂着一幅画，画中是一个温馨的房间……但你现在满脑子都是抽屉上的密码锁。\n\n先去解开抽屉吧。', next);
        } else if (!gameState.flags.hasDiary) {
            showDialog('墙上挂着一幅画，画中是一个温馨的房间，暂时还不知道有没有用处。', next);
        } else if (!gameState.flags.hasBowl) {
            showDialog('墙上挂着一幅画，画中是一个温馨的房间……\n\n你总觉得画里藏着什么，但什么都看不出来。', next);
        } else {
            showDialog('你拿着食盆靠近画框，盆底的花纹在画面上投下奇怪的光影……', () => {
                openPaintingPuzzle();
            });
        }
    });
}

export function interactToyBox() {
    if (tickExploreAfterBite()) return;
    trackObjectClick('toy-box', (next) => {
        if (gameState.flags.hasNote && !gameState.flags.drawerOpened) {
            showDialog('桌子下面有个小木箱，上面有个图案锁……但你现在满脑子都是抽屉上的密码锁。\n\n先去解开抽屉吧。', next);
        } else if (!gameState.flags.hasDiary) {
            showDialog('桌子下面好像有个小木箱，上面有个图案锁，暂时打不开。', next);
        } else if (gameState.flags.toyBoxSolved) {
            openToyBoxScene();
        } else {
            showDialog('小木箱上有四个图案按钮：🐟 🐾 🔔 ⚽\n\n日记里好像写过朵朵玩玩具的顺序……', () => {
                openToyBoxScene();
            });
        }
    });
}

export function interactTable() {
    if (tickExploreAfterBite()) return;

    if (!gameState.penFallen && !gameState.inventory.includes('钢笔')) {
        trackObjectClick('table', (next) => {
            showDialog('桌子上放着一些书本、一个杯子，还有一个笔筒。笔筒里似乎有支钢笔。', next);
        });
        return;
    }

    if (gameState.penFallen && !gameState.inventory.includes('钢笔')) {
        trackObjectClick('table');
        showDialog('你从地上捡起了钢笔。这应该可以作为工具使用。');
        document.getElementById('pen-image').classList.add('hidden');
        gameState.inventory.push('钢笔');
        saveGame();
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

export function interactClock() {
    if (tickExploreAfterBite()) return;
    if (!gameState.flags.hasDiary) {
        trackObjectClick('clock', (next) => {
            showDialog('墙上挂着一个时钟，指针正在走动……', next);
        });
    } else {
        openClockScene();
    }
}

export function interactSofa() {
    if (gameState.flags.wasBitten || gameState.flags.foundBump || gameState.flags.shownSofaCornerHint) {
        openSofaCornerScene();
        return;
    }

    trackObjectClick('sofa', (next) => {
        showDialog('你调查了一下沙发，没有发现什么特别的东西。', next);
    });
}
