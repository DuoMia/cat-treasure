// ===================== 照片墙场景 =====================

import { gameState, saveGame } from '../state.js';
import { sceneManager } from '../scene-manager.js';
import { showDialog } from '../ui.js';
import { setTapHandler } from '../utils.js';
import { collectStickyNote, createStickyNoteEl } from '../notes.js';
import { imgCoordsToContainer } from '../scene-hotspot.js';

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

        // 照片热区动态定位（photo_wall.jpg 800×600）
        const PHOTO_COORDS = [
            { el: photo1, ix: 0.08, iy: 0.15, iw: 0.22, ih: 0.55 },
            { el: photo2, ix: 0.39, iy: 0.15, iw: 0.22, ih: 0.55 },
            { el: photo3, ix: 0.70, iy: 0.15, iw: 0.22, ih: 0.55 },
        ];
        PHOTO_COORDS.forEach(({ el, ix, iy, iw, ih }) => {
            const p = imgCoordsToContainer(scene, 800, 600, ix, iy, iw, ih, 'contain');
            el.style.left = p.left; el.style.top = p.top;
            el.style.width = p.width; el.style.height = p.height;
            el.style.visibility = 'visible';
        });
        if (!gameState.flags.stickyNotes.includes('note3')) {
            const pos = imgCoordsToContainer(scene, 800, 600, 0.83, 0.80, 0, 0, 'contain');
            const note = createStickyNoteEl('note3', `position:absolute;left:${pos.left};top:${pos.top};font-size:28px;z-index:210;`, () => collectStickyNote('note3'));
            note.className = 'sticky-note-hotspot';
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
