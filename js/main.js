import { AssetLoader } from './assets.js';
import { Game } from './game.js';
import { Multiplayer } from './multiplayer.js';

const canvas = document.getElementById('gameCanvas');
const assetLoader = new AssetLoader();
const multiplayer = new Multiplayer();

let game;

async function init() {
    const assets = await assetLoader.loadAll();
    game = new Game(canvas, assetLoader, multiplayer);

    // UI Event Listeners
    document.getElementById('start-btn').addEventListener('click', () => {
        const nameInput = document.getElementById('name-input');
        const name = nameInput.value.trim() || 'Merry';

        multiplayer.setName(name);

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        game.start();
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        game.start();
    });

    // Handle Window Close to clean up player
    window.addEventListener('beforeunload', () => {
        multiplayer.leave();
    });

    // Inputs
    window.addEventListener('keydown', (e) => {
        game.handleInput(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
        game.handleInput(e.code, false);
    });

    // Initial Render call to clear/set bg
    game.draw();

    // Mobile Detection & Joystick
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const joystickZone = document.getElementById('joystick-zone');
    const joystickKnob = document.getElementById('joystick-knob');

    if (isMobile) {
        joystickZone.style.display = 'block';

        let startX, startY;
        let maxDist = 35; // Moved radius

        joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            startX = touch.clientX;
            startY = touch.clientY;

            // Center knob at touch? Or stick is fixed?
            // Let's assume Fixed Joystick center logic relative to zone
            const rect = joystickZone.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            startX = centerX;
            startY = centerY;
        }, { passive: false });

        joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;

            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            const force = Math.min(dist, maxDist);
            const moveX = Math.cos(angle) * force;
            const moveY = Math.sin(angle) * force;

            joystickKnob.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;

            // Normalized input (-1 to 1)
            const inputX = moveX / maxDist;
            const inputY = moveY / maxDist;

            game.handleJoystick(inputX, inputY);

        }, { passive: false });

        joystickZone.addEventListener('touchend', (e) => {
            e.preventDefault();
            joystickKnob.style.transform = `translate(-50%, -50%)`;
            game.handleJoystick(0, 0);
        });

        // Auto Fullscreen on Start
        const requestFullscreen = (element) => {
            if (element.requestFullscreen) element.requestFullscreen();
            else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
            else if (element.msRequestFullscreen) element.msRequestFullscreen();
        };

        const oldStart = document.getElementById('start-btn').onclick;
        document.getElementById('start-btn').addEventListener('click', () => {
            requestFullscreen(document.documentElement);
        });
    }

    // CHECK FOR EDITOR TEST MODE
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test')) {
        const rawLevel = localStorage.getItem('penguin_test_level');
        if (rawLevel) {
            try {
                const levelData = JSON.parse(rawLevel);
                console.log("Loading custom level from editor...");

                document.getElementById('start-screen').classList.add('hidden');
                document.getElementById('hud').classList.remove('hidden');

                // Add a "Back to Editor" button
                const backBtn = document.createElement('button');
                backBtn.innerText = "BACK TO EDITOR";
                backBtn.style.position = "absolute";
                backBtn.style.top = "10px";
                backBtn.style.left = "10px";
                backBtn.style.zIndex = "1000";
                backBtn.style.padding = "10px";
                backBtn.style.background = "#ffcc00";
                backBtn.style.border = "2px solid #fff";
                backBtn.style.borderRadius = "5px";
                backBtn.style.cursor = "pointer";
                backBtn.style.fontWeight = "bold";
                backBtn.onclick = () => window.location.href = 'editor.html';
                document.body.appendChild(backBtn);

                game.loadCustomLevel(levelData);

            } catch (e) {
                console.error("Failed to load custom level", e);
            }
        }
    }
}

init();

// Expose for testing
window.gameInstance = () => game;
