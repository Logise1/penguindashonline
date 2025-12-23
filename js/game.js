import { LEVELS, TILE_TYPES, TILE_SIZE } from './levels.js';
import { Progress, SKINS } from './progress.js';

export class Game {
    constructor(canvas, assets, multiplayer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.assets = assets;
        this.multiplayer = multiplayer;

        this.state = 'MENU';
        this.score = 0;

        this.currentLevelIndex = 0;
        this.loadLevel(this.currentLevelIndex);

        // Player setup
        this.player = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: TILE_SIZE * 0.3,
            state: 'IDLE',
            angle: 0,
            animTimer: 0,
            frame: 0
        };

        this.camera = { x: 0, y: 0 };
        this.zoom = 1.0;

        // this.findStartPos(); // Called in loadLevel/start

        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };

        this.lastTime = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Start Menu Music
        this.assets.play('bg_menu', true, 0.5);
    }

    loadLevel(index) {
        if (index >= LEVELS.length) {
            this.victory();
            return;
        }
        this.currentLevelIndex = index;
        // Deep copy level
        this.level = JSON.parse(JSON.stringify(LEVELS[index]));
        this.rows = this.level.length;
        this.cols = this.level[0].length;

        // Filter collected presents if < Level 25
        if (Progress.getMaxLevel() < 25) {
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.level[r][c] === TILE_TYPES.PRESENT) {
                        if (Progress.isPresentCollected(index, r, c)) {
                            this.level[r][c] = TILE_TYPES.ICE; // Removed
                        }
                    }
                }
            }
        }
    }

    loadCustomLevel(grid) {
        this.currentLevelIndex = -1; // Indicator for custom
        this.customLevelData = grid; // Save for restart
        this.level = JSON.parse(JSON.stringify(grid));
        this.rows = this.level.length;
        this.cols = this.level[0].length;

        // Reset player pos
        this.findStartPos();
        if (this.player.x === 0 && this.player.y === 0) {
            // If no start found, default to center first tile
            this.player.x = 128;
            this.player.y = 128;
        }

        this.state = 'PLAYING';
        this.score = 0;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.state = 'IDLE';
        this.player.angle = 0;
        this.player.frame = 0;
        this.lastTime = 0;

        // Music
        this.assets.stop('bg_menu');
        this.assets.play('bg_game', true, 0.4);

        if (!this.rafId) this.loop(0);
    }


    findStartPos() {
        if (!this.level) return;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.level[r][c] === TILE_TYPES.START) {
                    this.player.x = c * TILE_SIZE + TILE_SIZE / 2;
                    this.player.y = r * TILE_SIZE + TILE_SIZE / 2;
                    return;
                }
            }
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        if (this.rafId) cancelAnimationFrame(this.rafId);

        // Audio Management
        this.assets.stop('bg_menu');
        this.assets.stop('bg_over');
        this.assets.stop('win');
        // Restart game music if not already playing or just always restart
        this.assets.play('bg_game', true, 0.4, false);

        // If restarting after victory, reset to 0
        if (this.state === 'WIN') {
            this.currentLevelIndex = 0;
            this.score = 0;
        }
        // If state was MENU, we start at 0
        if (this.state === 'MENU') {
            this.currentLevelIndex = 0;
            this.score = 0;
        }

        if (this.currentLevelIndex === -1 && this.customLevelData) {
            // Reload custom level without full init overhead if confusing
            // Actually just re-parse is fine, loadCustomLevel does that.
            // But loadCustomLevel calls loop(0) again, we might want to avoid double loop check or just trust it.
            // Let's call internal helper or just re-run loadCustomLevel logic manually?
            // loadCustomLevel resets everything. 
            // We should just load the map data here.

            this.level = JSON.parse(JSON.stringify(this.customLevelData));
            this.rows = this.level.length;
            this.cols = this.level[0].length;
        } else {
            this.loadLevel(this.currentLevelIndex);
        }

        this.state = 'PLAYING';
        // this.score = 0; // Dont reset score on restart level
        this.findStartPos();
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.state = 'IDLE';
        this.player.angle = 0;
        this.player.frame = 0;
        this.lastTime = 0;

        this.loop(0);
    }


    nextLevel() {
        if (this.state === 'TRANSITION') return;
        this.state = 'TRANSITION';
        this.transitionTimer = 0;
        this.transitionDuration = 1.0; // Total 1 second
        this.switchedLevel = false;
    }


    _advanceLevelLogic() {
        this.currentLevelIndex++;
        if (this.currentLevelIndex >= LEVELS.length) {
            this.victory();
        } else {
            this.start();
        }
    }

    handleInput(key, pressed) {
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = pressed;
        }
    }


    handleJoystick(x, y) {
        this.joystickInput = { x, y };
    }

    updateScoreUI() {
        const el = document.getElementById('score');
        if (el) {
            // Show "Current Session (+Total Wallet)"
            const wallet = Progress.getPresents();
            // Often games show just wallet if score == wallet gain.
            // But here score is manual session score.
            // User requested "que salga los regalos que tienes en numero".
            // Maybe simply: 5 (Total: 120) ?
            // Or simply the wallet? "120"
            // I will show "Wallet"
            el.innerText = wallet;
        }
    }

    triggerBomb() {
        if (!this.multiplayer) return false;

        // Place a networked bomb at current position
        this.multiplayer.placeBomb(this.player.x, this.player.y, this.currentLevelIndex);

        return true;
    }

    update(dt) {
        // Update Shake
        if (this.shake > 0) {
            this.shake -= dt;
            if (this.shake < 0) this.shake = 0;
        }

        // Update Particles
        if (this.particles) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.life -= dt;
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 500 * dt; // Gravity
            }
        }
        // Check Bombs
        if (this.multiplayer && this.multiplayer.bombs) {
            const now = Date.now();
            Object.keys(this.multiplayer.bombs).forEach(key => {
                const bomb = this.multiplayer.bombs[key];
                if (bomb.level !== this.currentLevelIndex) return;

                const elapsed = now - bomb.placedAt;

                // Owner cleanup
                if (elapsed > 5500 && bomb.ownerId === this.multiplayer.id) {
                    this.multiplayer.removeBomb(key);
                }

                // Explosion Logic (Once per bomb per client)
                if (elapsed >= 5000) {
                    if (!this.explodedBombs) this.explodedBombs = new Set();

                    if (!this.explodedBombs.has(key)) {
                        this.explodedBombs.add(key);

                        this.createExplosion(bomb.x, bomb.y);

                        // Damage Check
                        const dx = this.player.x - bomb.x;
                        const dy = this.player.y - bomb.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < 256) {
                            this.die();
                        }
                    }
                }
            });
        }

        // Handle Transition State
        if (this.state === 'TRANSITION') {
            this.transitionTimer += dt;
            const t = this.transitionTimer / this.transitionDuration; // 0 to 1

            // Middle point (0.5) - Switch Level
            if (t >= 0.5 && !this.switchedLevel) {
                this.switchedLevel = true;
                this._advanceLevelLogic();
            }

            // End Transition
            if (t >= 1.0) {
                this.state = 'PLAYING';
                this.transitionTimer = 0;
            }
            return;
        }
    }

    if(this.state !== 'PLAYING' && this.state !== 'DYING') return;

// Multiplayer sync (only if playing)
if (this.multiplayer && this.state === 'PLAYING') {
    this.multiplayer.interpolate(dt);
    this.multiplayer.update(this.player.x, this.player.y, this.currentLevelIndex, this.player.angle);
}

// Physics constants tuned for 240Hz-like tightness
// Physics constants tuned for control
const ACCEL = 2500;

// Time-based Friction
// Slightly relaxed from 0.15 to allow movement with lower Accel
const FRICTION_FACTOR = 0.25;

const MAX_SPEED = 20000;

// Input - only if PLAYING
// Can't control if falling
if (this.state === 'PLAYING' && this.player.state !== 'FALL' && this.player.state !== 'CRASH') {
    let ax = 0;
    let ay = 0;
    if (this.keys.ArrowUp) ay -= ACCEL;
    if (this.keys.ArrowDown) ay += ACCEL;
    if (this.keys.ArrowLeft) ax -= ACCEL;
    if (this.keys.ArrowRight) ax += ACCEL;

    // Joystick override/addition
    if (this.joystickInput && (this.joystickInput.x !== 0 || this.joystickInput.y !== 0)) {
        ax = this.joystickInput.x * ACCEL;
        ay = this.joystickInput.y * ACCEL;
    }

    this.player.vx += ax * dt;
    this.player.vy += ay * dt;
}

// Time-based Friction
const friction = Math.pow(FRICTION_FACTOR, dt);
this.player.vx *= friction;
this.player.vy *= friction;

// Cap speed
const speed = Math.sqrt(this.player.vx ** 2 + this.player.vy ** 2);
if (speed > MAX_SPEED) {
    const ratio = MAX_SPEED / speed;
    this.player.vx *= ratio;
    this.player.vy *= ratio;
}

// Update Position
this.player.x += this.player.vx * dt;
this.player.y += this.player.vy * dt;

// Angle logic (smooth rotation)
// Keep updating angle if moving fast, unless falling/crashing heavily
if (speed > 20 && this.state === 'PLAYING') {
    const targetAngle = Math.atan2(this.player.vy, this.player.vx);
    // Simple approach: stick to target
    this.player.angle = targetAngle;
}

// Animation State
this.player.animTimer += dt;
if (this.player.state === 'FALL') {
    // Handled in other logic
} else if (speed > 50) {
    this.player.state = 'MOVE';
    if (this.player.animTimer > 0.1) {
        this.player.frame = (this.player.frame + 1) % 6; // Assume first 6 frames are run
        this.player.animTimer = 0;
    }
} else {
    this.player.state = 'IDLE';
    this.player.frame = 0;
}


// Calc Grid Pos
const centerCol = Math.floor(this.player.x / TILE_SIZE);
const centerRow = Math.floor(this.player.y / TILE_SIZE);


const safeCol = Math.max(0, Math.min(this.cols - 1, centerCol));
const safeRow = Math.max(0, Math.min(this.rows - 1, centerRow));

// Interaction Checks - Only if PLAYING
if (this.state === 'PLAYING') {

    // Check Bounds/Fall
    if (centerRow < 0 || centerRow >= this.rows ||
        centerCol < 0 || centerCol >= this.cols ||
        this.level[safeRow][safeCol] === TILE_TYPES.EMPTY) {

        if (this.player.state !== 'FALL') {
            this.player.state = 'FALL';
            this.player.frame = 12; // Start of fall/drown anim (guestimate)
            this.assets.play('crash'); // Fall sound
            this.die(800);
        }
        // Update fall anim
        if (this.player.animTimer > 0.15) {
            this.player.frame++;
            if (this.player.frame > 16) this.player.frame = 16;
            this.player.animTimer = 0;
        }
        return;
    }

    // Check Obstacles
    const tile = this.level[safeRow][safeCol];
    if (tile === TILE_TYPES.OBSTACLE || tile === TILE_TYPES.ICE_BLOCK || tile === TILE_TYPES.ICEBERG) {
        // Bounce or crash? Let's crash.
        if (this.player.state !== 'CRASH') {
            this.player.state = 'CRASH';
            this.player.frame = 18; // Crash start
            this.assets.play('crash');
            this.die(500);
        }
        return;
    }

    if (tile === TILE_TYPES.COAL) {
        // Bounce off "Tree"
        // Reverse velocity (BOUNCE!)
        // Add some randomness or energy loss? nah, clear bounce using 0.8
        this.player.vx *= -0.8;
        this.player.vy *= -0.8;

        // Push player out of the tile to prevent getting stuck
        // We move them 2 steps worth of distance "forward" in the NEW direction (which is backward relative to entry)
        this.player.x += this.player.vx * dt * 2;
        this.player.y += this.player.vy * dt * 2;

        // Play soft crash or bump sound
        // Reuse crash but with lower volume? Or 'die' sound but not dying?
        // Let's reuse crash but controlled
        this.assets.play('crash', false, 0.4);
    }

    // Check Win
    if (tile === TILE_TYPES.FINISH) {
        this.assets.play('level_complete');
        this.nextLevel();
        return;
    }

    // Collectibles
    if (tile === TILE_TYPES.PRESENT) {
        this.score += 1; // Changed from 100 to 1 as requested
        this.level[safeRow][safeCol] = TILE_TYPES.ICE; // Remove present
        this.assets.play('collect');

        // Add currency permanently
        if (Progress.getMaxLevel() < 25) {
            Progress.collectPresent(this.currentLevelIndex, safeRow, safeCol);
        } else {
            // After level 25, farmable
            Progress.addPresents(1);
        }

        // Update UI
        this.updateScoreUI();
    }
}
else if (this.state === 'DYING') {
    // Continue fall animation even if 'DYING' state set
    if (this.player.state === 'FALL') {
        if (this.player.animTimer > 0.15) {
            this.player.frame++;
            if (this.player.frame > 16) this.player.frame = 16;
            this.player.animTimer = 0;
        }
    }
}

// Camera follow (Smooth)
const targetCamX = this.player.x - this.canvas.width / 2;
const targetCamY = this.player.y - this.canvas.height / 2;
this.camera.x += (targetCamX - this.camera.x) * 0.1;
this.camera.y += (targetCamY - this.camera.y) * 0.1;
    }

die(delay = 1000) {
    if (this.state === 'DYING' || this.state === 'GAMEOVER') return;
    this.state = 'DYING';

    this.assets.play('die');
    // this.assets.stop('bg_game'); // Keep playing

    // Auto retry after delay
    setTimeout(() => {
        if (this.state === 'DYING') { // Only reset if we are still efficiently waiting
            this.start();
        }
    }, delay);
}

victory() {
    // Track Progress
    Progress.completeLevel(this.currentLevelIndex);

    if (this.state === 'WIN') return;
    this.state = 'WIN';

    this.assets.stop('bg_game');
    this.assets.play('win');

    document.getElementById('game-over-screen').classList.remove('hidden');
    document.querySelector('#game-over-screen h1').innerText = "YOU WON!";
    // document.getElementById('final-score').innerText = this.score;
    document.getElementById('hud').classList.add('hidden');
}


draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();

    // Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.shake > 0) {
        shakeX = (Math.random() - 0.5) * 30 * (this.shake / 0.4);
        shakeY = (Math.random() - 0.5) * 30 * (this.shake / 0.4);
    }

    // Camera Logic
    const camX = Math.floor(this.camera.x + shakeX);
    const camY = Math.floor(this.camera.y + shakeY);

    this.ctx.translate(-camX, -camY);

    const viewX = camX;
    const viewY = camY;
    const viewW = this.canvas.width;
    const viewH = this.canvas.height;

    // Render Level
    // Expand render cull area slightly to avoid popping
    const startCol = Math.floor((viewX - TILE_SIZE) / TILE_SIZE);
    const endCol = Math.floor((viewX + viewW + TILE_SIZE) / TILE_SIZE);
    const startRow = Math.floor((viewY - TILE_SIZE) / TILE_SIZE);
    const endRow = Math.floor((viewY + viewH + TILE_SIZE) / TILE_SIZE);

    if (this.level) {
        for (let r = Math.max(0, startRow); r < Math.min(this.rows, endRow + 1); r++) {
            for (let c = Math.max(0, startCol); c < Math.min(this.cols, endCol + 1); c++) {
                const tile = this.level[r][c];
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;

                if (tile === TILE_TYPES.EMPTY) continue;

                // Draw Floor
                if (tile === TILE_TYPES.SNOW) {
                    this.ctx.drawImage(this.assets.get('snow'), x, y, TILE_SIZE, TILE_SIZE);
                } else if (tile === TILE_TYPES.ICEBERG) {
                    // Iceberg might be in "water" so we don't draw ice floor.
                    // But if we want it to look like it's floating, just draw the iceberg.
                    this.ctx.drawImage(this.assets.get('iceberg'), x, y, TILE_SIZE, TILE_SIZE);
                } else {
                    // All others have ICE floor
                    this.ctx.drawImage(this.assets.get('ice'), x, y, TILE_SIZE, TILE_SIZE);
                }

                // Draw Static Objects
                if (tile === TILE_TYPES.START) {
                    this.ctx.drawImage(this.assets.get('start'), x, y, TILE_SIZE, TILE_SIZE);
                } else if (tile === TILE_TYPES.FINISH) {
                    this.ctx.drawImage(this.assets.get('finish'), x, y, TILE_SIZE, TILE_SIZE);
                } else if (tile === TILE_TYPES.COAL) {
                    // COAL is now TREE visually (as per user request "cambia todo el coal por img/tree.png")
                    // assets.get('coal') returns tree image now.
                    // We draw it slightly smaller/centered like an object
                    this.ctx.drawImage(this.assets.get('coal'), x + 20, y - 40, TILE_SIZE - 40, TILE_SIZE);
                } else if (tile === TILE_TYPES.PRESENT) {
                    this.ctx.drawImage(this.assets.get('present'), x + 30, y + 30, TILE_SIZE - 60, TILE_SIZE - 60);
                } else if (tile === TILE_TYPES.ICE_BLOCK) {
                    // Draw Ice Block
                    this.ctx.drawImage(this.assets.get('iceblock'), x, y, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    // Draw Player
    this.drawPlayer(this.player, false);

    // Draw Other Players (Ghosts)
    // Draw Other Players (Ghosts)
    if (this.multiplayer) {
        const others = this.multiplayer.getRenderablePlayers(this.currentLevelIndex);
        others.forEach(p => {
            this.drawPlayer({
                x: p.x,
                y: p.y,
                angle: p.angle,
                frame: 0,
                name: p.name
            }, true);
        });
    }

    // Draw 'Tall' objects on top of player if y is greater (simple depth sort)
    // Actually, let's just draw them after player for now or do a 2nd pass
    // A simple loop for obstacles/tall items:
    if (this.level) {
        for (let r = Math.max(0, startRow); r < Math.min(this.rows, endRow + 1); r++) {
            for (let c = Math.max(0, startCol); c < Math.min(this.cols, endCol + 1); c++) {
                const tile = this.level[r][c];
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;

                // If object is "tall" and "belo" (y-wise) player, draw it? 
                // Simple approach: Just draw obstacles here. If player is 'behind', it might look wrong without Z-sort.
                // Ideally: List of renderables {y, drawFn}. Sort by y. Run.
                // For now, assume player is always roughly on top unless explicit Z-sort needed.

                if (tile === TILE_TYPES.OBSTACLE) {
                    // Draw Snowman Centered
                    // Width factor: make it slightly narrower than full tile to look better?
                    // Let's keep size but center it.
                    const drawW = TILE_SIZE;
                    const drawH = TILE_SIZE * 1.2;
                    const drawX = x + (TILE_SIZE - drawW) / 2; // (actually 0 offset if same width)
                    const drawY = y - TILE_SIZE * 0.25; // Shift up slightly more to look "grounded" on the shadow

                    this.ctx.drawImage(this.assets.get('snowman'), drawX, drawY, drawW, drawH);
                }
                // COAL (Tree) and ICE_BLOCK are also tallish, maybe draw here?
                // If we moved COAL drawing to "Floor" loop it acts as floor decal. But user wants Tree. Trees are tall. 
                // I moved COAL to the "Static Objects" loop in the replacement above, which draws BEFORE player.
                // The OBSTACLE loop draws AFTER player. 
                // If I want Trees to cover player, I should move COAL drawing here.
                // The user request was "change coal for tree.png". 
                // Let's duplicate the check for correct layering or just keep as is. Use common sense: trees should occlude player if player is behind.
                // But player is usually *on* the tile.
                // I'll stick to drawing them in the main loop for now to be safe, or if I want to match Snowman:

                if (tile === TILE_TYPES.COAL) {
                    // Draw Tree again on top? No, that would be double draw.
                    // I drew it in the previous loop.
                }
            }
        }
    }


    // Draw Particles
    if (this.particles) {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = Math.max(0, p.life); // Fade out
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;
    }

    // Draw Bombs
    if (this.multiplayer && this.multiplayer.bombs) {
        const now = Date.now();
        Object.keys(this.multiplayer.bombs).forEach(key => {
            const bomb = this.multiplayer.bombs[key];
            if (bomb.level !== this.currentLevelIndex) return;

            // Simple Bomb visual
            this.ctx.save();
            this.ctx.translate(bomb.x, bomb.y);

            // Pulsate/Color based on time left
            const elapsed = now - bomb.placedAt;
            const timeLeft = Math.max(0, 5000 - elapsed);
            const scale = 1 + Math.sin(now / 200) * 0.1;

            this.ctx.scale(scale, scale);

            this.ctx.fillStyle = (timeLeft < 1000 && Math.floor(now / 100) % 2 === 0) ? 'white' : 'black';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = 'red';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText("💣", 0, 0);

            this.ctx.restore();
        });
    }

    this.ctx.restore();

    // Draw Transition Overlay (Radial Red Curtain)
    if (this.state === 'TRANSITION') {
        const t = this.transitionTimer / this.transitionDuration; // 0 to 1
        const width = this.canvas.width;
        const height = this.canvas.height;
        const maxRadius = Math.hypot(width / 2, height / 2);

        // 3 Phases for 1 Second duration:
        // 0.0 - 0.35: Close (Snappy)
        // 0.35 - 0.65: Hold Closed (Show Number)
        // 0.65 - 1.0: Open (Snappy)

        let radius;
        if (t < 0.35) {
            // Closing
            const progress = t / 0.35;
            // Cubic ease out for snap
            radius = maxRadius * (1 - Math.pow(progress, 3));
        } else if (t > 0.65) {
            // Opening
            const progress = (t - 0.65) / 0.35;
            // Cubic ease in
            radius = maxRadius * Math.pow(progress, 3);
        } else {
            // Hold fully closed
            radius = 0;
        }

        // Draw Red Overlay with Hole
        this.ctx.save();
        this.ctx.fillStyle = '#ff0000';

        this.ctx.beginPath();
        this.ctx.rect(0, 0, width, height);
        this.ctx.arc(width / 2, height / 2, Math.max(0, radius), 0, Math.PI * 2, true);
        this.ctx.closePath();
        this.ctx.fill();

        // Draw Number in Center (during Hold phase)
        if (t >= 0.35 && t <= 0.65) {
            this.ctx.save();
            this.ctx.fillStyle = 'white';
            this.ctx.font = '900 150px "Outfit", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
            this.ctx.shadowBlur = 20;

            let text = (this.currentLevelIndex + 1).toString();
            if (this.currentLevelIndex === -1 && this.customLevelData) text = "C";

            // Scale effect for the number? Pop in?
            // Let's just draw it static or slight scale
            this.ctx.fillText(text, width / 2, height / 2);
            this.ctx.restore();
        }

        this.ctx.restore();
    }
}

drawPlayer(entity = this.player, isGhost = false) {
    const sprite = this.assets.get('penguin');
    if (!sprite) return;

    // Spritesheet is 1 column x 32 rows
    const frameW = sprite.width;
    const frameH = sprite.height / 32;

    // Safety check
    if (frameH === 0) return;

    const frameIndex = (entity.frame || 0) % 32; // Wrap safe
    const sx = 0;
    const sy = frameIndex * frameH;

    // Preserve aspect ratio
    const ratio = frameW / frameH;
    let renderW = TILE_SIZE * 0.9;
    let renderH = renderW / ratio;

    // If too tall, constrain height
    if (renderH > TILE_SIZE * 1.5) {
        renderH = TILE_SIZE * 1.5;
        renderW = renderH * ratio;
    }

    this.ctx.save(); // Save main context state
    this.ctx.translate(entity.x, entity.y);

    // -- ROTATION --
    // Always rotate
    this.ctx.rotate(entity.angle);

    // Skin Tinting Logic
    let tint = null;
    if (!isGhost) {
        const skin = Progress.getSelectedSkin();
        if (skin && skin.tint && skin.tint !== '#ffffff') tint = skin.tint;
    }

    // Draw Player with Tint
    if (!this.tempCanvas) {
        this.tempCanvas = document.createElement('canvas');
    }

    // Resize temp canvas if needed
    if (this.tempCanvas.width < frameW || this.tempCanvas.height < frameH) {
        this.tempCanvas.width = frameW;
        this.tempCanvas.height = frameH;
    }
    const tCtx = this.tempCanvas.getContext('2d');
    tCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);

    // Draw Sprite to temp (at 0,0)
    tCtx.drawImage(
        sprite,
        sx, sy, frameW, frameH,
        0, 0, frameW, frameH
    );

    // Apply Tint to temp
    if (tint) {
        tCtx.globalCompositeOperation = 'source-atop';
        tCtx.fillStyle = tint;
        tCtx.globalAlpha = 0.5; // 50% tint
        tCtx.fillRect(0, 0, frameW, frameH);

        // Reset composite
        tCtx.globalCompositeOperation = 'source-over';
        tCtx.globalAlpha = 1.0;
    }

    // Draw temp canvas to main (offset by render sizes)
    this.ctx.drawImage(
        this.tempCanvas,
        0, 0, frameW, frameH,
        -renderW / 2, -renderH / 2, renderW, renderH
    );

    if (isGhost) {
        // Restore rotation for text so it is always upright
        this.ctx.rotate(-entity.angle);

        // Ghost styles
        this.ctx.globalAlpha = 0.6;
        // Text
        this.ctx.font = "bold 24px Arial";
        this.ctx.fillStyle = "white";
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 3;
        this.ctx.textAlign = "center";
        this.ctx.strokeText(entity.name || "Anon", 0, -renderH / 2 - 20);
        this.ctx.fillText(entity.name || "Anon", 0, -renderH / 2 - 20);
    }

    this.ctx.restore(); // Restore main save
}



die(delay = 1000) {
    if (this.state === 'DYING' || this.state === 'GAMEOVER') return;
    this.state = 'DYING';

    // Auto retry after delay
    setTimeout(() => {
        if (this.state === 'DYING') { // Only reset if we are still efficiently waiting
            this.start();
        }
    }, delay);
}

loop(timestamp) {
    if (timestamp > 0 && !this.lastTime) this.lastTime = timestamp;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // Cap dt
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    this.rafId = requestAnimationFrame((t) => this.loop(t));
}
}
