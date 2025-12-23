
import { TILE_TYPES } from './levels.js';

// Map Types to Images for the Editor
const TILE_IMAGES = {
    [TILE_TYPES.EMPTY]: '',
    [TILE_TYPES.ICE]: 'img/element-ice1.png',
    [TILE_TYPES.SNOW]: 'img/element-snow1.png',
    [TILE_TYPES.ICEBERG]: 'img/element-iceberg.png',
    [TILE_TYPES.ICE_BLOCK]: 'img/element-sm_iceberg.png',
    [TILE_TYPES.OBSTACLE]: 'img/element-snowman.png', // Snowman
    [TILE_TYPES.COAL]: 'img/element-tree1.png',       // Tree
    [TILE_TYPES.PRESENT]: 'img/element-present1.png',
    [TILE_TYPES.START]: 'img/element-start.png',
    [TILE_TYPES.FINISH]: 'img/element-finish.png'
};

const PALETTE_ORDER = [
    TILE_TYPES.ICE,
    TILE_TYPES.SNOW,
    TILE_TYPES.ICEBERG,
    TILE_TYPES.ICE_BLOCK,
    TILE_TYPES.OBSTACLE,
    TILE_TYPES.COAL,
    TILE_TYPES.PRESENT,
    TILE_TYPES.START,
    TILE_TYPES.FINISH,
    TILE_TYPES.EMPTY
];

class Editor {
    constructor() {
        this.width = 8;
        this.height = 20;
        this.grid = [];
        this.selectedTile = TILE_TYPES.ICE;
        this.isDrawing = false;

        this.gridEl = document.getElementById('grid');
        this.paletteEl = document.getElementById('palette');

        this.init();
    }

    init() {
        this.buildPalette();
        this.loadFromStorage(); // Try to restore previous work
        this.renderGrid();
        this.attachEvents();
    }

    buildPalette() {
        PALETTE_ORDER.forEach(type => {
            const btn = document.createElement('div');
            btn.className = 'tile-btn';

            if (TILE_IMAGES[type]) {
                btn.style.backgroundImage = `url(${TILE_IMAGES[type]})`;
            } else {
                btn.innerText = 'X'; // Empty
                btn.style.display = 'flex';
                btn.style.alignItems = 'center';
                btn.style.justifyContent = 'center';
                btn.style.color = '#555';
            }

            if (type === this.selectedTile) btn.classList.add('active');

            btn.onclick = () => {
                this.selectedTile = type;
                document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };

            this.paletteEl.appendChild(btn);
        });
    }

    createEmptyGrid(w, h) {
        this.grid = [];
        for (let r = 0; r < h; r++) {
            const row = [];
            for (let c = 0; c < w; c++) {
                // Default to empty, unless it's a border? No, just empty.
                // Or maybe default to ICE for convenience?
                // Let's default to EMPTY.
                row.push(TILE_TYPES.EMPTY);
            }
            this.grid.push(row);
        }

        // Fill edges with Iceberg for convenience
        // for(let r=0; r<h; r++) {
        //     this.grid[r][0] = TILE_TYPES.ICEBERG;
        //     this.grid[r][w-1] = TILE_TYPES.ICEBERG;
        // }
    }

    renderGrid() {
        this.gridEl.style.gridTemplateColumns = `repeat(${this.width}, 50px)`;
        this.gridEl.innerHTML = '';

        this.grid.forEach((row, r) => {
            row.forEach((tile, c) => {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                this.updateCellVisual(cell, tile);

                cell.onmousedown = (e) => {
                    this.isDrawing = true;
                    this.setTile(r, c);
                };
                cell.onmouseenter = (e) => {
                    if (this.isDrawing) this.setTile(r, c);
                };

                this.gridEl.appendChild(cell);
            });
        });
    }

    updateCellVisual(cell, type) {
        if (TILE_IMAGES[type]) {
            cell.style.backgroundImage = `url(${TILE_IMAGES[type]})`;
            cell.style.backgroundColor = '#111';
        } else {
            cell.style.backgroundImage = 'none';
            cell.style.backgroundColor = '#000';
        }
    }

    setTile(r, c) {
        this.grid[r][c] = this.selectedTile;
        const index = r * this.width + c;
        const cell = this.gridEl.children[index];
        this.updateCellVisual(cell, this.selectedTile);
        this.saveToStorage();
    }

    attachEvents() {
        document.body.onmouseup = () => this.isDrawing = false;
        document.body.onmouseleave = () => this.isDrawing = false;

        document.getElementById('resize-btn').onclick = () => {
            const newW = parseInt(document.getElementById('w-input').value);
            const newH = parseInt(document.getElementById('h-input').value);
            if (confirm("Resizing involves creating a new grid. Clear current work?")) {
                this.width = newW;
                this.height = newH;
                this.createEmptyGrid(newW, newH);
                this.renderGrid();
                this.saveToStorage();
            }
        };

        document.getElementById('clear-btn').onclick = () => {
            if (confirm("Clear grid?")) {
                this.createEmptyGrid(this.width, this.height);
                this.renderGrid();
                this.saveToStorage();
            }
        };

        document.getElementById('test-btn').onclick = () => {
            this.saveToStorage(); // Save current state
            // Also save specifically for Game to pick up
            const levelData = clone(this.grid);
            localStorage.setItem('penguin_test_level', JSON.stringify(levelData));
            window.location.href = 'index.html?test=true';
        };

        document.getElementById('copy-btn').onclick = () => {
            const json = JSON.stringify(this.grid);
            navigator.clipboard.writeText(json).then(() => alert("Level JSON copied to clipboard!"));
        };

        // Fix mouse dragging behavior
        this.gridEl.ondragstart = () => false;
    }

    saveToStorage() {
        const state = {
            width: this.width,
            height: this.height,
            grid: this.grid
        };
        localStorage.setItem('penguin_editor_state', JSON.stringify(state));
    }

    loadFromStorage() {
        const raw = localStorage.getItem('penguin_editor_state');
        if (raw) {
            try {
                const state = JSON.parse(raw);
                this.width = state.width;
                this.height = state.height;
                this.grid = state.grid;

                document.getElementById('w-input').value = this.width;
                document.getElementById('h-input').value = this.height;
            } catch (e) {
                console.error("Failed to load editor state", e);
                this.createEmptyGrid(this.width, this.height);
            }
        } else {
            this.createEmptyGrid(this.width, this.height);
        }
    }
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

new Editor();
