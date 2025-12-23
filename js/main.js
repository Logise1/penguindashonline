import { AssetLoader } from './assets.js';
import { Game } from './game.js';
import { Multiplayer } from './multiplayer.js';
import { Progress, SKINS } from './progress.js';

const canvas = document.getElementById('gameCanvas');
const assetLoader = new AssetLoader();
const multiplayer = new Multiplayer();

let game;

// Setup Shop UI
function setupShop() {
    const shopBtn = document.getElementById('shop-btn');
    const shopScreen = document.getElementById('shop-screen');
    const shopCloseBtn = document.getElementById('shop-close-btn');
    const shopItemsContainer = document.getElementById('shop-items');
    const currencyDisplay = document.getElementById('shop-currency');

    // Open Shop
    shopBtn.addEventListener('click', () => {
        shopScreen.classList.remove('hidden');
        document.getElementById('start-screen').classList.add('hidden');
        renderShopItems();
    });

    // Close Shop
    shopCloseBtn.addEventListener('click', () => {
        shopScreen.classList.add('hidden');
        // If game is running, show HUD, else Start Screen
        if (game && (game.state === 'PLAYING' || game.state === 'TRANSITION' || game.state === 'DYING')) {
            document.getElementById('hud').classList.remove('hidden');
        } else {
            document.getElementById('start-screen').classList.remove('hidden');
        }
    });

    // Update Currency Display
    const updateCurrency = () => {
        currencyDisplay.innerText = Progress.getPresents();
    };
    updateCurrency();
    window.addEventListener('presents-updated', updateCurrency);

    function renderShopItems() {
        shopItemsContainer.innerHTML = '';
        shopItemsContainer.style.display = 'grid';
        shopItemsContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
        shopItemsContainer.style.gap = '15px';
        shopItemsContainer.style.padding = '20px';

        const currentSkin = Progress.getSelectedSkin();

        SKINS.forEach(skin => {
            const item = document.createElement('div');
            item.className = 'shop-item';
            item.style.background = 'rgba(255,255,255,0.1)';
            item.style.padding = '10px';
            item.style.borderRadius = '10px';
            item.style.textAlign = 'center';
            item.style.border = '2px solid transparent';

            // Highlight selected
            if (currentSkin.id === skin.id) {
                item.style.borderColor = '#00ff00';
                item.style.boxShadow = '0 0 10px #00ff00';
            }

            // Preview - Using Mask for perfect tinting
            const img = document.createElement('div');
            img.style.width = '64px';
            img.style.height = '64px';
            img.style.margin = '0 auto 10px auto';
            img.style.backgroundColor = skin.tint;

            // Mask setup to show only the penguin shape
            const spriteUrl = 'url(img/sprite-penguin.png)';
            img.style.webkitMaskImage = spriteUrl;
            img.style.maskImage = spriteUrl;
            img.style.webkitMaskSize = '100% auto'; // Width fits, height proportional
            img.style.maskSize = '100% auto';
            img.style.webkitMaskPosition = '0 0'; // First frame
            img.style.maskPosition = '0 0';

            // Fallback for no-mask support or just nice border
            img.style.border = `2px solid ${skin.tint}`;
            img.style.borderRadius = '10px';


            const name = document.createElement('h3');
            name.innerText = skin.name;
            name.style.margin = '5px 0';
            name.style.fontSize = '1rem';

            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.style.fontSize = '0.8rem';
            btn.style.padding = '5px 10px';
            btn.style.width = '100%';
            btn.style.marginTop = 'auto';

            const owned = Progress.hasSkin(skin.id);
            if (owned) {
                if (currentSkin.id === skin.id) {
                    btn.innerText = "EQUIPPED";
                    btn.disabled = true;
                    btn.style.background = "#555";
                    btn.style.color = "#aaa";
                    btn.style.cursor = "default";
                } else {
                    btn.innerText = "SELECT";
                    btn.style.background = "#00ccff";
                    btn.onclick = () => {
                        Progress.equipSkin(skin.id);
                        renderShopItems(); // Re-render to update state
                    };
                }
            } else {
                btn.innerText = `${skin.price} 🎁`;
                btn.style.background = "#ffcc00";
                btn.onclick = () => {
                    if (Progress.buySkin(skin.id)) {
                        renderShopItems();
                    } else {
                        // Flash red
                        btn.style.background = '#ff4444';
                        setTimeout(() => btn.style.background = '#ffcc00', 200);
                    }
                };
            }

            item.appendChild(img);
            item.appendChild(name);
            item.appendChild(btn);
            shopItemsContainer.appendChild(item);
        });
    }
}

async function init() {
    const assets = await assetLoader.loadAll();
    game = new Game(canvas, assetLoader, multiplayer);

    setupShop();


    // Global Progress Bar
    const maxLevel = 25; // Goal
    const currentProgress = Progress.getMaxLevel();
    const percent = Math.min(100, (currentProgress / maxLevel) * 100);

    const progressBarContainer = document.createElement('div');
    progressBarContainer.style.width = '80%';
    progressBarContainer.style.maxWidth = '400px';
    progressBarContainer.style.background = 'rgba(255,255,255,0.2)';
    progressBarContainer.style.borderRadius = '10px';
    progressBarContainer.style.height = '20px';
    progressBarContainer.style.margin = '10px auto';
    progressBarContainer.style.overflow = 'hidden';
    progressBarContainer.style.position = 'relative';

    const bar = document.createElement('div');
    bar.style.width = `${percent}%`;
    bar.style.height = '100%';
    bar.style.background = '#00ff00';
    bar.style.transition = 'width 0.5s';

    const text = document.createElement('span');
    text.innerText = `${currentProgress} / ${maxLevel}`;
    text.style.position = 'absolute';
    text.style.width = '100%';
    text.style.textAlign = 'center';
    text.style.top = '0';
    text.style.lineHeight = '20px';
    text.style.fontSize = '12px';
    text.style.color = '#000';
    text.style.fontWeight = 'bold';

    progressBarContainer.appendChild(bar);
    progressBarContainer.appendChild(text);

    // Insert before name input
    const startScreen = document.getElementById('start-screen');
    const nameInput = document.getElementById('name-input');
    startScreen.insertBefore(progressBarContainer, nameInput);





    // Update Online Count logic
    // Mock list for now
    const onlineCountEl = document.getElementById('online-count');
    const onlineContainer = document.querySelector('.online-container'); // Parent

    const onlineList = document.querySelector('.online-list') || document.createElement('div');
    onlineList.className = 'online-list';
    onlineList.style.fontSize = '1rem'; // Bigger font
    onlineList.style.textAlign = 'right';
    onlineList.style.marginTop = '5px';
    onlineList.style.color = 'rgba(255,255,255,0.8)';

    if (!onlineContainer.contains(onlineList)) {
        onlineContainer.appendChild(onlineList);
    }

    // UI Event Listeners
    document.getElementById('start-btn').addEventListener('click', () => {
        const nameInp = document.getElementById('name-input');
        const name = nameInp.value.trim() || 'Merry';
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

    // HUD Button Events
    document.getElementById('hud-menu-btn').addEventListener('click', () => {
        // Show shop
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('shop-screen').classList.remove('hidden');
        // Trigger shop render via existing button logic
        document.getElementById('shop-btn').click();
    });

    document.getElementById('hud-bomb-btn').addEventListener('click', () => {
        // Cost: 5
        const cost = 5;
        if (Progress.spendPresents(cost)) {
            if (game.triggerBomb()) {
                // Success
            } else {
                // Refund if nothing hit?
                // Progress.addPresents(cost); 
            }
            game.updateScoreUI();
        } else {
            const btn = document.getElementById('hud-bomb-btn');
            const original = btn.style.background;
            btn.style.background = '#555';
            setTimeout(() => btn.style.background = '#ff4444', 200);
        }
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
