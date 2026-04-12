// ===================== 照片墙场景 =====================

import { gameState, saveGame } from '../state.js';
import { sceneManager } from '../scene-manager.js';
import { showDialog } from '../ui.js';
import { setTapHandler } from '../utils.js';
import { collectStickyNote } from '../notes.js';

let _pendingPhotoWallHint = null;

export function setPendingPhotoWallHint(hint) {
    _pendingPhotoWallHint = hint;
}

export function openPhotoWallScene() {
    sceneManager.open('photo-wall-scene', () => {
        gameState.flags.photoWallSeen = true;
        saveGame();

        const photo1 = document.getElementById('photo-wall-photo1');
        const photo2 = document.getElementById('photo-wall-photo2');
        const photo3 = document.getElementById('photo-wall-photo3');

        function bindPhotoClick(el, text) {
            setTapHandler(el, function() { showDialog(text); });
        }

        bindPhotoClick(photo1, '2021年，朵朵刚来，还是个小猫咪，躲在沙发角落不肯出来。\n\n照片背面写着："初来乍到"。');
        bindPhotoClick(photo2, '2023年，朵朵2岁了，越来越懒，整天趴着不动。\n\n照片背面写着："慵懒少女"。');
        bindPhotoClick(photo3, '2026年，朵朵5岁了，最爱在下午趴在阳台那盆开黄花的植物旁边打盹。\n\n照片背面写着："老猫时光"。');

        const scene = document.getElementById('photo-wall-scene');
        if (!gameState.flags.stickyNotes.includes('note3')) {
            const note = document.createElement('div');
            note.className = 'sticky-note-hotspot';
            note.style.cssText = 'position:absolute;right:5%;bottom:10%;width:12%;height:10%;cursor:pointer;';
            note.title = '便利贴';
            note.textContent = '📝';
            note.style.fontSize = '28px';
            note.style.display = 'flex';
            note.style.alignItems = 'center';
            note.style.justifyContent = 'center';
            note.addEventListener('click', () => {
                note.remove();
                collectStickyNote('note3');
            });
            scene.appendChild(note);
        }
    });
}

export function closePhotoWallScene() {
    const hint = _pendingPhotoWallHint;
    _pendingPhotoWallHint = null;
    sceneManager.closeToRoom(() => {
        if (hint) {
            setTimeout(hint, 100);
        }
    });
}
