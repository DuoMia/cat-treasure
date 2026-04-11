// ===================== 窗户特写场景 =====================

import { gameState } from '../state.js';
import { sceneManager } from '../scene-manager.js';
import { showDialog, showChoices } from '../ui.js';
import { collectStickyNote } from '../notes.js';
import { openBalconyScene } from './balcony.js';

export function openWindowScene() {
    sceneManager.open('window-scene', () => {
        if (!gameState.flags.stickyNotes.includes('note2')) {
            const scene = document.getElementById('window-scene');
            const note = document.createElement('div');
            note.className = 'sticky-note-hotspot';
            note.style.cssText = 'position:absolute;left:30%;top:8%;font-size:28px;cursor:pointer;z-index:210;';
            note.textContent = '📝';
            note.addEventListener('click', () => {
                note.remove();
                collectStickyNote('note2');
            });
            scene.appendChild(note);
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
                    text: '↩ 先回去看看',
                    callback: () => closeWindowScene()
                }
            ]);
        });
    });
}

export function closeWindowScene() {
    sceneManager.closeToRoom();
}
