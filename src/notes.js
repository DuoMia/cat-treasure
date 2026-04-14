// ===================== 便利贴 + 记忆碎片 =====================

import { gameState, saveGame } from './state.js';
import { STICKY_NOTE_TEXTS, MEMORY_FRAGMENT_TEXTS } from './data.js';
import { showDialog, showEnding } from './ui.js';
import { updateInventory } from './ui.js';

/** 创建可点击便利贴元素，移动端 touchend + click 双绑定 */
export function createStickyNoteEl(noteId, cssText, onCollect) {
    const note = document.createElement('div');
    note.textContent = '📝';
    note.style.cssText = cssText + ';cursor:pointer;';
    let _tx = 0, _ty = 0;
    note.addEventListener('touchstart', (e) => {
        _tx = e.touches[0].clientX; _ty = e.touches[0].clientY;
    }, { passive: true });
    note.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - _tx;
        const dy = e.changedTouches[0].clientY - _ty;
        if (dx * dx + dy * dy > 64) return;
        e.preventDefault();
        e.stopPropagation();
        note.remove();
        onCollect();
    }, { passive: false });
    note.addEventListener('click', (e) => {
        e.stopPropagation();
        note.remove();
        onCollect();
    });
    return note;
}

function checkTrueEnding() {
    if (gameState.flags.memoryFragments.length >= 5 && gameState.flags.stickyNotes.length >= 5) {
        showEnding('treasure');
    }
}

export function collectMemoryFragment(index, onDone) {
    if (gameState.flags.memoryFragments.includes(index)) { onDone?.(); return; }
    gameState.flags.memoryFragments.push(index);
    saveGame();
    updateInventory();
    const count = gameState.flags.memoryFragments.length;
    showDialog(`✨ 记忆碎片（${count}/5）：\n\n"${MEMORY_FRAGMENT_TEXTS[index]}"`, () => {
        if (count >= 5) {
            if (!gameState.inventory.includes('钥匙')) {
                gameState.inventory.push('钥匙');
                updateInventory();
            }
            showDialog('五块记忆碎片全部拼合……\n\n你感到房间里有什么东西悄悄变了。\n\n一把钥匙从某处滑落到你手中——那是离开这里的钥匙。', () => {
                const balconyScene = document.getElementById('balcony-scene');
                if (balconyScene && !balconyScene.classList.contains('hidden')) {
                    balconyScene.classList.add('hidden');
                }
                onDone?.();
                checkTrueEnding();
            });
        } else {
            onDone?.();
        }
    });
}

export function allFragmentsCollected() {
    return gameState.flags.memoryFragments.length >= 5;
}

export function collectStickyNote(id) {
    if (gameState.flags.stickyNotes.includes(id)) return;
    gameState.flags.stickyNotes.push(id);
    saveGame();
    updateInventory();
    const count = gameState.flags.stickyNotes.length;
    if (count >= 5) {
        gameState.flags.albumUnlocked = true;
        showDialog(`你收集了所有5张便利贴！\n\n"${STICKY_NOTE_TEXTS[id]}"\n\n记忆相册已解锁，可以在物品栏中查看。`, () => {
            checkTrueEnding();
        });
    } else {
        showDialog(`你发现了一张便利贴（${count}/5）：\n\n"${STICKY_NOTE_TEXTS[id]}"`);
    }
}
