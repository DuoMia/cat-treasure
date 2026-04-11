// ===================== 场景管理器 =====================

import { centerViewport, showDragHint } from './utils.js';
import { clearHotspots } from './hotspots.js';
import { createRoomHotspots } from './interactions.js';

class SceneManager {
    constructor() {
        this.currentSceneId = null;
        this.history = [];
    }

    open(sceneId, setupFn, options = {}) {
        document.getElementById('dialog-box').classList.add('hidden');
        document.getElementById('choice-box').classList.add('hidden');
        const overlay = document.getElementById('choice-overlay');
        if (overlay) overlay.style.display = 'none';

        if (!options.skipClearHotspots) {
            clearHotspots();
        }

        if (this.currentSceneId && this.currentSceneId !== sceneId) {
            this.history.push(this.currentSceneId);
        }

        if (this.currentSceneId && this.currentSceneId !== sceneId) {
            document.getElementById(this.currentSceneId).classList.add('hidden');
        }

        this.currentSceneId = sceneId;
        document.getElementById(sceneId).classList.remove('hidden');

        if (!options.skipCenterViewport) {
            centerViewport();
            showDragHint();
        }

        if (setupFn) {
            setupFn();
        }
    }

    closeToRoom(beforeReturnFn) {
        if (this.currentSceneId) {
            document.getElementById(this.currentSceneId).classList.add('hidden');
        }
        this.currentSceneId = null;
        this.history = [];
        const overlay = document.getElementById('choice-overlay');
        if (overlay) overlay.style.display = 'none';
        document.getElementById('choice-box').classList.add('hidden');

        if (beforeReturnFn) beforeReturnFn();

        centerViewport();
        createRoomHotspots();
    }

    back() {
        if (this.currentSceneId) {
            document.getElementById(this.currentSceneId).classList.add('hidden');
        }

        if (this.history.length > 0) {
            this.currentSceneId = this.history.pop();
            document.getElementById(this.currentSceneId).classList.remove('hidden');
            centerViewport();
            showDragHint();
        } else {
            this.currentSceneId = null;
            centerViewport();
            createRoomHotspots();
        }
    }

    getCurrentSceneId() {
        return this.currentSceneId;
    }

    isInScene(sceneId) {
        return this.currentSceneId === sceneId;
    }
}

export const sceneManager = new SceneManager();
