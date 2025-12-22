
export const TILE_TYPES = {
    EMPTY: 0,
    ICE: 1,
    START: 2,
    FINISH: 3,
    OBSTACLE: 4,
    PRESENT: 5,
    COAL: 6,
    SNOW: 7
};

// Size of one tile in World Units (pixels)
export const TILE_SIZE = 256;

// Helper to easy create lines
const _ = TILE_TYPES.EMPTY;
const I = TILE_TYPES.ICE;
const S = TILE_TYPES.START;
const F = TILE_TYPES.FINISH;
const O = TILE_TYPES.OBSTACLE;
const P = TILE_TYPES.PRESENT;
const C = TILE_TYPES.COAL;
const W = TILE_TYPES.SNOW;

const L1 = [
    [_, _, _, _, _, _, _],
    [S, I, W, I, W, I, F],
    [_, _, _, _, _, _, _]
];

// Winding path
const L2 = [
    [S, I, I, _, _, _],
    [_, _, I, _, _, _],
    [_, _, I, I, I, _],
    [_, _, _, _, I, _],
    [_, _, _, _, I, F]
];

const L3 = [
    [_, _, I, I, I, _],
    [S, I, I, _, I, _],
    [_, _, _, _, I, F],
    [_, _, _, _, _, _]
];

// Split path
const L4 = [
    [_, I, I, I, _, _],
    [S, I, O, I, I, F],
    [_, I, I, I, _, _]
];

const L5 = [
    [_, S, _, _, _, _],
    [_, I, _, _, _, _],
    [_, I, I, I, I, _],
    [_, _, _, _, I, _],
    [_, F, I, I, I, _],
    [_, _, _, _, _, _]
];

const L6 = [
    [S, I, I, _, _, I, F],
    [_, _, I, I, I, I, _],
    [_, _, _, O, _, _, _]
];

// More complex winding
const L7 = [
    [S, I, _, _, _, _],
    [_, I, I, I, _, _],
    [_, _, _, I, _, _],
    [_, I, I, I, _, _],
    [_, I, _, _, _, _],
    [_, I, I, I, I, F]
];

const L8 = [
    [_, _, _, I, I, F],
    [_, S, I, I, _, _],
    [_, _, _, O, _, _],
    [_, _, _, I, _, _]
];

const L9 = [
    [S, I, O, I, O, I, F],
    [_, I, _, I, _, I, _],
    [_, I, I, I, I, I, _]
];

const L10 = [
    [_, _, I, F, _],
    [S, I, I, _, _],
    [_, I, O, I, _],
    [_, I, _, I, _],
    [_, I, I, I, _]
];

// ... fill others with more generic but valid paths to reach 20
// Using a helper to generate simple snake lines for brevity but maintain playability
function createSnake(length) {
    let arr = [];
    for (let i = 0; i < length; i++) {
        let row = new Array(length).fill(_);
        // Fill diagonal-ish path first
        row[i] = I;
        if (i < length - 1) row[i + 1] = I;

        // Then set S and F so they are not overwritten
        if (i === 0) row[0] = S;
        else if (i === length - 1) row[length - 1] = F;

        arr.push(row);
    }
    return arr;
}

const L11 = createSnake(7);
const L12 = createSnake(8);
const L13 = createSnake(9);
const L14 = [
    [S, I, I, I, _, _],
    [_, _, _, I, _, _],
    [_, I, I, I, _, _],
    [_, I, _, _, _, _],
    [_, I, I, I, I, F]
];
const L15 = [
    [F, I, I, I, S],
    [_, O, _, O, _],
    [_, I, I, I, _]
];
const L16 = [[S, I, I, I], [_, O, O, I], [_, _, _, I], [F, I, I, I]];
const L17 = [[S, I, I, I, I], [_, _, P, _, _], [_, I, I, I, I], [_, I, _, _, _], [_, F, _, _, _]];
const L18 = [[S, I], [I, I], [I, I], [I, F]];
const L19 = [[S, I, O, P, O, I, F]];
const L20 = [
    [_, _, _, F, _],
    [_, _, I, I, _],
    [_, I, I, O, _],
    [S, I, _, _, _]
];

export const LEVELS = [
    L1, L2, L3, L4, L5, L6, L7, L8, L9, L10,
    L11, L12, L13, L14, L15, L16, L17, L18, L19, L20
];
