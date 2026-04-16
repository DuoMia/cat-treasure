// ===================== UI 组件 =====================

import { gameState, saveGame } from './state.js';
import { STICKY_NOTE_TEXTS, MEMORY_FRAGMENT_TEXTS, ROOM_HOTSPOTS, ENDING_ACTS, PUZZLES } from './data.js';
import { sceneManager } from './scene-manager.js';
import { clearHotspots, createHotspot } from './hotspots.js';
import { collectStickyNote, collectMemoryFragment, allFragmentsCollected } from './notes.js';

// 打字机效果变量
let typewriterTimeout = null;
let currentFullText = '';
let dialogContinueCallback = null;

// ===================== 对话框 =====================

export function resetDialog() {
    if (typewriterTimeout) { clearTimeout(typewriterTimeout); typewriterTimeout = null; }
    dialogContinueCallback = null;
    currentFullText = '';
    document.getElementById('dialog-box').classList.add('hidden');
    const overlay = document.getElementById('choice-overlay');
    if (overlay) overlay.style.display = 'none';
    document.getElementById('choice-box').classList.add('hidden');
}

export function handleDialogClick() {
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

export function showDialog(text, callback = null) {
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
            dialogText.textContent = text.substring(0, i + 1);
            i++;
            typewriterTimeout = setTimeout(typeWriter, 30);
        } else {
            typewriterTimeout = null;
        }
    }
    typeWriter();
}

// ===================== 选项框 =====================

export function showChoices(choices) {
    if (typewriterTimeout) {
        clearTimeout(typewriterTimeout);
        typewriterTimeout = null;
    }

    document.getElementById('dialog-box').classList.add('hidden');
    const choiceBox = document.getElementById('choice-box');
    const choiceButtons = document.getElementById('choice-buttons');

    // 遮罩
    let overlay = document.getElementById('choice-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'choice-overlay';
        document.getElementById('game-container').appendChild(overlay);
    }
    overlay.style.display = 'block';

    choiceButtons.innerHTML = '';
    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice.text;
        btn.onclick = () => {
            choiceBox.classList.add('hidden');
            overlay.style.display = 'none';
            choice.callback();
        };
        choiceButtons.appendChild(btn);
    });

    choiceBox.classList.remove('hidden');
}

// ===================== 物品栏 =====================

export function updateInventory() {
    const inventoryItems = document.getElementById('inventory-items');
    inventoryItems.innerHTML = '';

    const noteCount = gameState.flags.stickyNotes.length;
    if (noteCount > 0) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'inventory-item';
        const noteText = gameState.flags.albumUnlocked
            ? '记忆相册 ✨'
            : (window.innerWidth <= 768 ? `便利贴${noteCount}/5` : `便利贴 ${noteCount}/5`);
        noteDiv.innerHTML = `${noteText}`;
        noteDiv.style.cursor = 'pointer';
        noteDiv.onclick = () => {
            document.getElementById('inventory-panel').classList.add('hidden');
            const mask = document.getElementById('inventory-mask');
            if (mask) mask.style.display = 'none';
            if (gameState.flags.albumUnlocked) {
                openAlbumScene();
            } else {
                const collected = gameState.flags.stickyNotes;
                const lines = collected.map((id, n) => `【${n + 1}】${STICKY_NOTE_TEXTS[id]}`).join('\n\n');
                showDialog(`便利贴（${noteCount}/5）\n\n${lines}\n\n集齐5张可以解锁记忆相册。`);
            }
        };
        inventoryItems.appendChild(noteDiv);
    }

    const fragCount = gameState.flags.memoryFragments.length;
    if (fragCount > 0) {
        const fragDiv = document.createElement('div');
        fragDiv.className = 'inventory-item';
        fragDiv.innerHTML = `记忆碎片 ${fragCount}/5`;
        fragDiv.style.cursor = 'pointer';
        fragDiv.onclick = () => handleItemClick('记忆碎片');
        inventoryItems.appendChild(fragDiv);
    }

    gameState.inventory.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        if (item === '阳台纸条') {
            const count = (gameState.flags.balconyClue1 ? 1 : 0) + (gameState.flags.balconyClue2 ? 1 : 0);
            itemDiv.innerHTML = `阳台纸条 ${count}/2`;
        } else {
            itemDiv.innerHTML = `${item}`;
        }
        itemDiv.style.cursor = 'pointer';
        itemDiv.onclick = () => handleItemClick(item);
        inventoryItems.appendChild(itemDiv);
    });

    saveGame();
}

function handleItemClick(item) {
    document.getElementById('inventory-panel').classList.add('hidden');
    const mask = document.getElementById('inventory-mask');
    if (mask) mask.style.display = 'none';

    if (item === '铁盒' && !gameState.flags.solvedPassword) {
        showDialog(
            '突然你注意到了盒子底部有一个猫咪抱着手又咬又踢的图案，有点眼熟，你看向被朵朵咬过的左手，不看不知道，五排数量不规则的圆孔牙印和五排断断续续的抓痕出现在你的眼前，这朵朵，也太野蛮了！\n\n等等，正好5排？你看向朵朵留下的痕迹，又看向铁盒上的五位密码，突然有一个念头闪过，不会吧？这痕迹越看越像某种密码，要不试试？\n\n（五排痕迹分别为：-.-.；.-..；---；-.-.；-.-）',
            () => {
                openPasswordModal();
            }
        );
    } else if (item === '记忆碎片') {
        const frags = gameState.flags.memoryFragments;
        const texts = MEMORY_FRAGMENT_TEXTS;
        const lines = frags.map((i, n) => `【${n + 1}】${texts[i]}`).join('\n\n');
        showDialog(`记忆碎片（${frags.length}/5）\n\n${lines}`);
    } else if (item === '钥匙') {
        showDialog('你有一把钥匙，可以用来开门。');
    } else if (item === '铁盒') {
        showDialog('盒子已经打开了，里面的东西已经取出来了。');
    } else if (item === '地图') {
        openMapModal();
    } else if (item === '铁盒纸条') {
        showDialog('纸条上写着：\n"抽屉里藏着朵朵的秘密\n\n她陪我走过的岁月，是第一个数字。\n她留在这里的印记，是第二个数字。\n她最爱的那些小东西，是第三个数字。\n\n三把钥匙，从大到小。"');
    } else if (item === '音乐盒纸条') {
        showDialog('"那天下午，她第一次跳上窗台，坐在那里望了很久。我没有打扰她。"');
    } else if (item === '日记') {
        showDialog('日记封面上写着"献给朵朵"。\n\n── 2021年8月29日 ──\n\n朵朵来了。她很小，一直躲在沙发角落不出来。我把她的第一个项圈和一个小音乐盒一起放进了书架最里面的格子，我最喜欢将5本书按朵朵的样子摆放。\n\n── 关于吃饭 ──\n\n她有自己的规律。早7点、午12点、晚6点、夜10点，从不迟到，她还有自己的吃饭习惯。我把这些记在食盆旁边的卡片上，怕自己忘。\n\n── 关于玩具 ──\n\n她最后一次玩玩具是离开前的那个傍晚。先把球滚到我脚边，再去闻了闻小鱼，然后用爪子拨了拨铃铛。我把那个顺序锁进了玩具箱。\n\n── 关于阳台 ──\n\n朵朵没事干最喜欢在阳台发呆了，不同时间会待在不同的地方。');
    } else if (item === '项圈') {
        showDialog('朵朵的项圈，上面刻着她的名字。\n\n项圈上刻着 2021.08.29，那是朵朵来家的日子。');
    } else if (item === '主人的信') {
        showDialog('"朵朵，\n\n每天上午十点，我把她的早饭端到阳台，她总是先不吃，坐在仙人掌旁边，等那道光爬过来，才低头吃第一口。\n\n我不知道她在等什么。也许是影子，也许是什么只有她看得见的东西。\n\n我把一些东西藏在了那道影子的尽头。\n\n——主人"');
    } else if (item === '朵朵的信') {
        showDialog('"喵——\n\n你找到这里了。我知道你会来的。\n\n每天下午三点，我会跑到阳台，把玩具推到绿植旁边，等那道橙色的光把影子拉得很长很长。\n\n那是我最喜欢的时候。主人总是站在门口看着我，不说话。\n\n我把宝贝埋在了影子的尽头，去那里看看吧。\n\n——朵朵 🐾"');
    } else if (item === '备用钥匙') {
        showDialog('主人藏在阳台底座里的备用钥匙，可以开家门。');
    } else if (item === '阳台的信') {
        showDialog('"备用钥匙放在这里，防止哪天钥匙丢了进不了门。这把钥匙能开家门。\n\n——主人"');
    } else if (item === '阳台纸条') {
        const lines = [];
        if (gameState.flags.balconyClue1) lines.push('【纸条一】"她总是身披银色，蜷在星光落下的地方睡着。"');
        if (gameState.flags.balconyClue2) lines.push('【纸条二】"阳光跑得比她快，一头扎进了海里。"');
        showDialog(`阳台纸条（${lines.length}/2）\n\n${lines.join('\n\n')}`);
    } else if (item === '食盆') {
        showDialog('底部有猫爪样式的镂空花纹，应该可以用在哪里。');
    } else if (item === '阳台的信') {
        showDialog('"如果你找到了这里，说明你已经理解了朵朵的心意。\n\n她陪了我四年，是我最好的朋友。我离开的时候，她一定很难过，所以我把最重要的东西留给了她，也留给了你。\n\n时钟里藏着我们的秘密，那是朵朵神藏的最后一块拼图。\n\n——主人"');
    } else if (item.startsWith('便利贴')) {
        const count = gameState.flags.stickyNotes.length;
        if (gameState.flags.albumUnlocked) {
            openAlbumScene();
        } else {
            showDialog(`你已收集 ${count}/5 张便利贴。\n\n集齐5张可以解锁记忆相册。`);
        }
    } else {
        showDialog(`这是${item}。`);
    }
}

export function toggleInventory() {
    const panel = document.getElementById('inventory-panel');
    const isHidden = panel.classList.toggle('hidden');

    if (!isHidden) {
        // 插入遮罩
        let mask = document.getElementById('inventory-mask');
        if (!mask) {
            mask = document.createElement('div');
            mask.id = 'inventory-mask';
            document.body.appendChild(mask);
        }
        mask.style.display = 'block';

        setTimeout(() => {
            function onOutsideClick(e) {
                if (!e.target.closest('#inventory-panel') && !e.target.closest('#inventory-toggle')) {
                    panel.classList.add('hidden');
                    if (mask) mask.style.display = 'none';
                    document.removeEventListener('click', onOutsideClick, true);
                    document.removeEventListener('touchend', onOutsideClick, true);
                }
            }
            document.addEventListener('click', onOutsideClick, true);
            document.addEventListener('touchend', onOutsideClick, true);
        }, 0);
    } else {
        const mask = document.getElementById('inventory-mask');
        if (mask) mask.style.display = 'none';
    }
}

// ===================== 密码弹窗 =====================

export function openPasswordModal() {
    document.getElementById('password-modal').classList.remove('hidden');
    document.getElementById('password-input').value = '';
    document.getElementById('password-input').focus();
    // 重置密码字母为隐藏状态
    document.querySelectorAll('#morse-hint-rows .morse-letter').forEach(el => el.classList.add('hidden'));
    const btn = document.getElementById('morse-answer-btn');
    if (btn) btn.textContent = '点击展开密码';
}

export function toggleMorseHint() {
    const rows = document.getElementById('morse-hint-rows');
    const arrow = document.getElementById('morse-hint-arrow');
    const hidden = rows.classList.toggle('hidden');
    arrow.textContent = hidden ? '▶ 点击查看' : '▼ 收起';
}

export function toggleMorseAnswer() {
    const letters = document.querySelectorAll('#morse-hint-rows .morse-letter');
    const btn = document.getElementById('morse-answer-btn');
    const isHidden = letters[0]?.classList.contains('hidden');
    letters.forEach(el => el.classList.toggle('hidden', !isHidden));
    btn.textContent = isHidden ? '隐藏密码' : '点击展开密码';
}

export function closePasswordModal() {
    document.getElementById('password-modal').classList.add('hidden');
}

export function submitPassword() {
    const input = document.getElementById('password-input');
    const password = input.value.toLowerCase();

    if (password === 'clock') {
        closePasswordModal();
        gameState.flags.solvedPassword = true;
        saveGame();
        showDialog('你在密码锁上输入了正确密码：clock。噶哒一声，盒子打开了，里面有一张折叠的纸条，还有一张手绘的房间地图。', () => {
            showDialog('纸条上写着：\n"抽屉里藏着朵朵的秘密\n\n她陪我走过的岁月，是第一个数字。\n她留在这里的印记，是第二个数字。\n她最爱的那些小东西，是第三个数字。\n\n三把钥匙，从大到小。"', () => {
                showDialog('地图上用细细的笔迹标注了五个位置，每个位置旁边画着一个小小的便利贴图案。\n\n主人把什么东西藏在了这五个地方……');
            });
        });
        if (!gameState.inventory.includes('铁盒纸条')) {
            gameState.flags.hasNote = true;
            gameState.inventory.push('铁盒纸条');
        }
        if (!gameState.inventory.includes('地图')) {
            gameState.flags.hasMap = true;
            gameState.inventory.push('地图');
        }
        updateInventory();
    } else {
        showDialog('密码错误，请再试一次');
        input.value = '';
        input.focus();
    }
}

// ===================== 抽屉密码弹窗 =====================

export function openDrawerModal() {
    document.getElementById('drawer-modal').classList.remove('hidden');
    document.getElementById('drawer-input').value = '';
    document.getElementById('drawer-input').focus();
}

export function closeDrawerModal() {
    document.getElementById('drawer-modal').classList.add('hidden');
}

export function submitDrawerPassword() {
    const input = document.getElementById('drawer-input');
    const password = input.value.trim();
    if (password === PUZZLES.drawer.answer) {
        closeDrawerModal();
        gameState.flags.drawerOpened = true;
        saveGame();
        showDialog(`你输入了密码${PUZZLES.drawer.answer}，抽屉缓缓打开了……`, () => openDrawerScene());
    } else {
        showDialog('密码错误，请再试一次');
        input.value = '';
        input.focus();
    }
}

// ===================== 调试模式 =====================

export function toggleDebugMode() {
    gameState.debugMode = !gameState.debugMode;
    document.body.classList.toggle('debug-mode');
    const btn = document.getElementById('debug-toggle');
    btn.textContent = gameState.debugMode ? '🔧 关闭调试' : '🔧 调试模式';
}

// ===================== 提示系统 =====================

export function showHelp() {
    const f = gameState.flags;
    const inv = gameState.inventory;
    let hint = '';

    if (!f.wasBitten) {
        hint = '试着四处看看，房间里有什么不寻常的地方？';
    } else if (!f.hasBox) {
        if (!inv.includes('钢笔')) {
            hint = '朵朵刚才从桌子那边跑过来——桌上的笔筒好像被碰歪了，仔细看看？';
        } else {
            hint = '你有了钢笔。沙发角落好像有什么东西，试着去沙发那边看看。';
        }
    } else if (!f.solvedPassword) {
        hint = '你找到了一个铁盒，五位字母密码锁。看看铁盒底部的图案，再对照一下手上朵朵留下的咬痕和抓痕——那些断断续续的点和线，像不像某种密码？答案是一个和时间有关的单词。';
    } else if (!f.drawerOpened) {
        if (!f.hasNote) {
            hint = '铁盒打开了，里面有钥匙和一张纸条，先把纸条拿出来看看。';
        } else {
            hint = '纸条上写着三条线索，对照房间里的东西仔细想想……抽屉上有把数字密码锁，试着算出那个三位数。';
        }
    } else if (!f.hasDiary) {
        hint = '抽屉打开了，里面有朵朵的日记，拿起来看看。';
    } else if (!f.bookPuzzleSolved) {
        hint = '书架上摆着5本书，日记里提到过按朵朵的样子排好——试着把书按正确顺序摆放。';
    } else if (!f.foodBowlSeen) {
        hint = '书架格子打开了，你找到了项圈和音乐盒。先别急着弄音乐盒——沙发旁边有个食盆，去看看。';
    } else if (!f.hasBowl) {
        hint = '食盆旁边有张记录卡，仔细读读。食盆本身好像也可以拿起来……';
    } else if (!f.paintingPuzzleSolved) {
        hint = '拿着食盆去画框那里，把食盆对准画里朵朵吃饭的位置，看看会发生什么。';
    } else if (!f.hasOwnerLetter) {
        hint = '画框已经弹开了，里面应该有什么东西。';
    } else if (!f.toyBoxSolved) {
        hint = '日记里写了朵朵最后一次玩玩具的顺序。桌子下面有个玩具箱，按那个顺序试试图案锁？';
    } else if (!f.hasCatLetter) {
        hint = '玩具箱打开了！里面应该有朵朵留下的东西，看看里面。';
    } else if (!f.musicBoxSolved) {
        hint = '书架上还有个音乐盒没解开，它会先播放一段旋律，你来复现——仔细听，再按相同的顺序敲击按钮。';
    } else if (!f.balconySeen) {
        hint = '你看了日记。日记里提到朵朵每天都凝视着某个方向——去窗户那边看看。';
    } else if (!f.balconyNote1 || !f.balconyNote2) {
        const got = (f.balconyNote1 ? 1 : 0) + (f.balconyNote2 ? 1 : 0);
        hint = `阳台上有两张纸条藏在影子里（已找到 ${got}/2）。试着在时钟上拨到上午10点或下午3点，阳台的影子位置会不一样。`;
    } else if (!f.balconyBrickSolved) {
        hint = '两张纸条都找到了！地板上四块刻着符号的砖，按两张纸条描述的顺序踩下去。';
    } else if (!f.hasLetter) {
        hint = '砖块谜题解开了！地板上弹出了一个暗格，看看里面有什么。';
    } else {
        const fragments = f.memoryFragments.length;
        const notes = f.stickyNotes.length;
        if (fragments < 5 && notes < 5) {
            hint = `还差 ${5 - fragments} 块记忆碎片和 ${5 - notes} 张便利贴。把房间里的每个角落都找一找。`;
        } else if (fragments < 5) {
            hint = `还差 ${5 - fragments} 块记忆碎片，继续解开剩余的谜题。`;
        } else if (notes < 5) {
            hint = `还差 ${5 - notes} 张便利贴，地图上标注了5个位置，再找找看。`;
        } else {
            hint = '所有记忆碎片和便利贴都集齐了……猫咪神藏就要揭晓了。';
        }
    }

    showDialog('💡 ' + hint);
}

// ===================== 记忆相册 =====================

function openAlbumScene() {
    sceneManager.open('album-scene', () => {
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
        footer.textContent = '🐾 朵朵 2021—2026 🐾';
        content.appendChild(footer);
    }, { skipCenterViewport: true });
}

function closeAlbumScene() {
    sceneManager.closeToRoom();
}

// ===================== 结局 =====================

export function showEnding(type) {
    if (type === 'cycle') {
        document.getElementById('game-play').classList.add('hidden');
        document.getElementById('ending-screen').classList.remove('hidden');
        document.getElementById('ending-title').innerHTML = '结局：轮回';
        document.getElementById('ending-text').innerHTML = '你拿着钥匙，赶紧到门口试了试，果然是房门钥匙，你按耐不住兴奋的心情，赶紧走出大门，却只觉得一阵头晕目眩，昏了过去。<br><br>昏迷时，你做了一个梦，梦里朵朵一直在说"猫咪神藏"，你不知道什么时候才能醒来。<br><br><span style="opacity:0.6;font-size:0.9em;">好像还有什么真相没有揭开……</span>';
        return;
    }

    const acts = ENDING_ACTS;
    let actIndex = 0;

    function showAct() {
        if (actIndex >= acts.length) {
            document.getElementById('game-play').classList.add('hidden');
            document.getElementById('ending-screen').classList.remove('hidden');
            document.getElementById('ending-title').innerHTML = '✨ 猫咪神藏';
            document.getElementById('ending-text').innerHTML = '猫咪神藏，不是宝贝，是时光。<br><br>朵朵和主人在一起的每一天，都藏在这个房间里，等待着被人重新发现。<br><br>你找到了。';
            return;
        }
        const act = acts[actIndex];
        actIndex++;
        showDialog(`【${act.title}】\n\n${act.text}`, showAct);
    }

    showAct();
}

// ===================== 地图弹窗 =====================

export function openMapModal() {
    let modal = document.getElementById('map-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'map-modal';
        modal.innerHTML = `
            <div class="map-modal-content">
                <div class="map-modal-title">📜 朵朵的房间地图</div>
                <img src="assets/map.jpg" alt="房间地图" class="map-modal-img">
                <button class="map-modal-close" onclick="document.getElementById('map-modal').classList.add('hidden')">关闭</button>
            </div>`;
        document.getElementById('game-container').appendChild(modal);
    }
    modal.classList.remove('hidden');
}
