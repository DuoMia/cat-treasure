// ===================== 窗户特写场景 =====================

import { gameState } from '../state.js';
import { sceneManager } from '../scene-manager.js';
import { showDialog, showChoices } from '../ui.js';
import { collectStickyNote } from '../notes.js';
import { openBalconyScene } from './balcony.js';

export function openWindowScene() {
    sceneManager.open('window-scene', () => {
        const noteCollected = gameState.flags.stickyNotes.includes('note2');

        // 便利贴已拾取：直接跳阳台
        if (noteCollected) {
            const windowDesc = gameState.flags.musicBoxSolved
                ? '窗台上还留着她的爪印。\n\n你想起了那张纸片——她第一次跳上来的时候，就是这样坐着，望着外面，一动不动。'
                : '窗台上有朵朵留下的毛发和爪印。窗户虚掩着，外面是阳台……';
            showDialog(windowDesc, () => {
                closeWindowScene();
                openBalconyScene();
            });
            return;
        }

        // 便利贴未拾取：放置便利贴，停留在窗户场景
        const scene = document.getElementById('window-scene');

        if (!scene.querySelector('.sticky-note-hotspot')) {
            const note = document.createElement('div');
            note.className = 'sticky-note-hotspot';
            note.style.cssText = 'position:absolute;left:30%;top:8%;font-size:28px;cursor:pointer;z-index:210;';
            note.textContent = '📝';
            note.addEventListener('click', (e) => {
                e.stopPropagation();
                note.remove();
                collectStickyNote('note2');
            });
            scene.appendChild(note);
        }

        // 透明点击捕获层：覆盖整个场景，z-index 低于便利贴(210)和对话框
        if (!scene.querySelector('.window-click-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'window-click-overlay';
            overlay.style.cssText = 'position:absolute;inset:0;z-index:200;cursor:pointer;';
            overlay.addEventListener('click', () => {
                closeWindowScene();
                openBalconyScene();
            });
            scene.appendChild(overlay);
        }

        showDialog('窗台上有朵朵留下的毛发和爪印。窗户虚掩着，外面是阳台……', () => {
            showChoices([
                {
                    text: '🌿 推开窗户去阳台',
                    callback: () => {
                        closeWindowScene();
                        openBalconyScene();
                    }
                },
                {
                    text: '🔍 窗户上好像有什么东西',
                    callback: () => {}
                }
            ]);
        });
    });
}

export function closeWindowScene() {
    const scene = document.getElementById('window-scene');
    if (scene) {
        const overlay = scene.querySelector('.window-click-overlay');
        if (overlay) overlay.remove();
    }
    sceneManager.closeToRoom();
}
