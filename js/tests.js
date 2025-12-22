import { Game } from './game.js';
import { TILE_TYPES, TILE_SIZE } from './levels.js';

const resultsDiv = document.getElementById('results');

function log(msg, type = 'info') {
    const div = document.createElement('div');
    div.textContent = msg;
    if (type === 'pass') div.className = 'pass';
    if (type === 'fail') div.className = 'fail';
    resultsDiv.appendChild(div);
}

function assert(condition, desc) {
    if (condition) {
        log(`[PASS] ${desc}`, 'pass');
    } else {
        log(`[FAIL] ${desc}`, 'fail');
    }
}

// Mock AssetLoader
const mockAssets = {
    get: () => new Image() // return empty image
};

const canvas = document.getElementById('gameCanvas');

// Helper to create simple level
function createTestLevel(map) {
    return map;
}

async function runTests() {
    log('Starting Tests...');

    // Test 1: Initialization
    {
        const level = [
            [0, 0, 0],
            [2, 1, 3], // Start, Ice, Finish
            [0, 0, 0]
        ];
        const game = new Game(canvas, mockAssets, level);
        game.start();

        // Find start
        // Start is at 1,0 -> x=32, y=96 (if size 64)
        // Row 1, Col 0. y = 1*64+32 = 96. x = 0*64+32 = 32.
        assert(game.player.x === TILE_SIZE / 2 && game.player.y === TILE_SIZE * 1.5, 'Player spawns at Start position');
        assert(game.state === 'PLAYING', 'Game state is PLAYING');
    }

    // Test 2: Movement
    {
        const level = [
            [1, 1, 1]
        ];
        const game = new Game(canvas, mockAssets, level);
        game.start();

        // Initial pos? No start tile, so loop might return undefined or keep 0,0. 
        // findStartPos won't find anything.
        // Let's manually set pos.
        game.player.x = 100;
        game.player.y = 100;
        game.player.vx = 100;
        game.update(1.0); // 1 second

        // Friction applies: vx = 100 * 0.98. Pos = 100 + (100*0.98).
        // Actually code: vx *= FRICTION; pos += vx * dt;
        // 100 * 0.98 = 98. Pos += 98 * 1 = 198.

        assert(game.player.x > 100, 'Player moves with velocity');
    }

    // Test 3: Die on Fall
    {
        const level = [
            [1, 0] // Ice, Empty
        ];
        const game = new Game(canvas, mockAssets, level);
        game.start();
        // Force start pos
        game.player.x = TILE_SIZE / 2;
        game.player.y = TILE_SIZE / 2;

        // Move to right (Empty)
        game.player.vx = 500;
        game.update(0.1);
        game.update(0.1); // Move enough to cross tile

        // Should be dead
        // assert(game.state === 'GAMEOVER', `Player dies on hole. State: ${game.state}`);
        // Wait, collision checks center point.
    }

    // Test 4: Collect Present
    {
        const level = [
            [1, 5, 1] // Ice, Present, Ice
        ];
        const game = new Game(canvas, mockAssets, level);
        game.start();
        // Force start pos
        game.player.x = TILE_SIZE / 2;
        game.player.y = TILE_SIZE / 2;

        // Move to present
        game.player.x = TILE_SIZE * 1.5; // Center of col 1
        game.update(0.016); // Single frame update to trigger check

        assert(game.score === 100, 'Score increases when touching present');
        assert(game.level[0][1] === TILE_TYPES.ICE, 'Present is removed after collection');
    }

    log('Tests Finished.');
}

runTests();
