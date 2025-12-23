export const TILE_TYPES = {
    EMPTY: 0,
    ICE: 1,      // Suelo normal resbaladizo (punto .)
    START: 2,    // Inicio (S)
    FINISH: 3,   // Meta (F)
    OBSTACLE: 4, // Obstáculos como árboles o postes (#)
    PRESENT: 5,  // Regalos (P)
    COAL: 6,     // Carbón que frena (C) - VISUALLY A TREE
    SNOW: 7,     // Nieve profunda/lenta o decoración (=)
    ICEBERG: 8,  // Iceberg decoration (kill) (I)
    ICE_BLOCK: 9 // Small Iceberg (kill) (B)
};

// Size of one tile in World Units (pixels)
export const TILE_SIZE = 256;

// Helper to convert ASCII map to Level Array
const CHAR_MAP = {
    ' ': TILE_TYPES.EMPTY,
    '.': TILE_TYPES.ICE,     // El camino principal
    '=': TILE_TYPES.SNOW,    // Zonas lentas/decoración
    'S': TILE_TYPES.START,
    'F': TILE_TYPES.FINISH,
    '#': TILE_TYPES.OBSTACLE,
    'P': TILE_TYPES.PRESENT,
    'C': TILE_TYPES.COAL,
    'I': TILE_TYPES.ICEBERG,
    'B': TILE_TYPES.ICE_BLOCK
};

function parseMap(ascii) {
    // Trim empty lines from start/end and find max width
    const lines = ascii.split('\n').filter(l => l.trim().length > 0);
    const width = Math.max(...lines.map(l => l.length));

    return lines.map(line => {
        // Pad line to width
        const padded = line.padEnd(width, ' ');
        return padded.split('').map(char => {
            const type = CHAR_MAP[char];
            return type !== undefined ? type : TILE_TYPES.ICE;
        });
    });
}

// --- NIVELES 1-10 (Básicos Hardcore) ---

// LEVEL 1: Narrow Focus
const L1 = parseMap(`
   IIII
   IS.I
   I.PI
   I..I
   I#.I
   IP.I
   I..I
   IC.I
   I.PI
   IF.I
   IIII
`);

// LEVEL 2: Sharp Turns
const L2 = parseMap(`
    IIIII
   I..S.I
   I.P..I
  I..=..I
  I.PI.PI
  I..I..I
  I..=..I
   IP...I
   I.F..I
   IIIIII
`);

// LEVEL 3: The Fork
const L3 = parseMap(`
    IIIIII
   I..S...I
   I.P.P..I
   II#..#II
   I.I.PI.I
   I.I..I.I
   I=I.PI=I
   I.IP.I.I
   II....II
    I.F..I
    IIIIII
`);

// LEVEL 4: Slalom Tech
const L4 = parseMap(`
  IIIII
 I.S..I
 I.#=.I
 I.PC.I
 I....I
 IP#..I
 I=..PI
 I..C.I
 I.P..I
 I.F..I
 IIIIII
`);

// LEVEL 5: The Corridor
const L5 = parseMap(`
      IIIII
      I.S.I
     I...I
    I.P.I
   I=..I
  IP..I
  I#..I
 I.P.I
 I=..I
I...I
I#P.I
I.F.I
IIIII
`);

// LEVEL 6: Lane Merge
const L6 = parseMap(`
    IIIIII
    I.S..I
    I.P..I
   II#..#II
   I..P...I
   I..I.P.I
   I=.I..=I
   IP.I...I
   II....II
    I.F..I
    IIIIII
`);

// LEVEL 7: Precision Braking
const L7 = parseMap(`
 IIIII
 I.S.I
 I.P.I
 I.C.I
 I.#.I
 I.P.I
 I.C.I
 I.#.I
 IP..I
 I.C.I
 I.F.I
 IIIII
`);

// LEVEL 8: Hourglass
const L8 = parseMap(`
    IIIIII
   I..S..I
   I.P...I
    I...I
    I=I=I
    I.P.I
    I...I
    ICPCI
    I...I
   I..F..I
   IIIIIII
`);

// LEVEL 9: Zig Zag Pro
const L9 = parseMap(`
    IIIII
    I.S.I
    I.P.I
   I...I
   I=I
  I.P.I
  I=I
 IP..I
 I=I
I.F.I
IIIII
`);

// LEVEL 10: The Gauntlet
const L10 = parseMap(`
    IIIIII
    I.S..I
    I#=.CI
    II.PII
    I....I
   I.PI..I
   I=.I.=I
   I..I.PI
    I.P..I
    II..II
    I.F..I
    IIIIII
`);

// --- NIVELES 11-25 (Nuevos Retos) ---

// LEVEL 11: The Bridge
const L11 = parseMap(`
   IIIII
   IISII
   I...I
   I...I
   I...I
   I.I.I
   I.P.I
   I.I.I
   I.I.I
   I.P.I
   IIFII
   IIIII
`);

// LEVEL 12: Checkerboard
const L12 = parseMap(`
  IIIIII
  I.S..I
  I.P..I
  I.#.#I
  I.C.CI
  I#P..I
  I....I
  I.#.#I
  I.C.CI
  I.P..I
  I.F..I
  IIIIII
`);

// LEVEL 13: Triple Threat
const L13 = parseMap(`
    IIIIIII
   I...S...I
   I...P...I
   II#.#.#II
   I.I.I.I.I
   I=IPI.I=I
   I.I.I.I.I
   II#.#.#II
   I...P...I
    I..F..I
    IIIIIII
`);

// LEVEL 14: Snowdrift
const L14 = parseMap(`
   IIIII
   I.S.I
   I===I
   I.P.I
   I=#=I
   I.P.I
   I===I
   ICPCI
   I.P.I
   I.F.I
   IIIII
`);

// LEVEL 15: The S-Bend
const L15 = parseMap(`
     IIIII
    I.S..I
    I.P..I
   I....I
   I=P.I
  I....I
  I.P.I
   I..=I
   I.P..I
    I....I
    I..F.I
    IIIIII
`);

// LEVEL 16: The Wall
const L16 = parseMap(`
  IIIIII
  I.S..I
  I.P..I
  I####I
  I.PC.I
  I....I
  I####I
  I.C.PI
  I....I
  I.F..I
  IIIIII
`);

// LEVEL 17: Speed Trap
const L17 = parseMap(`
   IIIII
   I.S.I
   I.P.I
   I...I
   I.P.I
   I.#.I
   I#.#I
   I.P.I
   I...I
   I.F.I
   IIIII
`);

// LEVEL 18: Twin Snakes
const L18 = parseMap(`
    IIIIIII
   I...S...I
   II..P..II
   I.I   I.I
   I.I   I.I
   I=I   I=I
   IPI   IPI
   II.....II
    I..F..I
    IIIIIII
`);

// LEVEL 19: The Box
const L19 = parseMap(`
  IIIIIII
  I..S..I
  I..P..I
  I.###.I
  I.#C#.I
  I.###.I
  IP...PI
  I..F..I
  IIIIIII
`);

// LEVEL 20: Coal Mine
const L20 = parseMap(`
  IIIII
  I.S.I
  I.C.I
  ICPCI
  I.C.I
  I.P.I
  IC.CI
  I.C.I
  ICPCI
  I.F.I
  IIIII
`);

// LEVEL 21: The Eye
const L21 = parseMap(`
   IIIIIII
  I...S...I
  I.IIIII.I
  I.I.P.I.I
  I.I.I.I.I
  I.I.P.I.I
  I.IIIII.I
  I...P...I
   I..F..I
   IIIIIII
`);

// LEVEL 22: Broken Road
const L22 = parseMap(`
   IIIII
   I.S.I
   I=P.I
   I..=I
   I.#.I
   I=P.I
   I..=I
   I.#.I
   I.P.I
   I.F.I
   IIIII
`);

// LEVEL 23: The Chicane
const L23 = parseMap(`
    IIII
    I.SI
    IP.I
   I..I
   IP.I
    I..I
    IP.I
   I..I
   IP.I
   IFI
   IIII
`);

// LEVEL 24: Deep Freeze
const L24 = parseMap(`
  III
  ISI
  IPI
  I=I
  IPI
  I#I
  IPI
  I.I
  I#I
  IPI
  IFI
  III
`);

// LEVEL 25: The Summit (Marathon Edition)
// El jefe final definitivo. Muy largo.
const L25 = parseMap(`
    IIIIIII
   I...S...I
   I...P...I
   II#...#II
   I.I...I.I
   I.I.P.I.I
   I.I...I.I
   II.....II
   I...P...I
   I.#####.I
   I.#C.C#.I
   I.#####.I
   I...P...I
   II#...#II
   I.I...I.I
   I.I.P.I.I
   I.I...I.I
   I.I...I.I
   II.....II
   I.PI.I..I
   I..I.I.PI
   I..I.I..I
   I..I.I..I
   II.....II
   I...P...I
   I.C...C.I
   I..C.C..I
   I.C...C.I
   I...P...I
   II#...#II
   I.I...I.I
   I=I.P.I=I
   I.I...I.I
   II.....II
   I...P...I
   I.#####.I
   I.#...#.I
   I.#.#.#.I
   I.#.P.#.I
   I.#####.I
   I.......I
   II#...#II
   I.I...I.I
   I.I.P.I.I
   I.I...I.I
   II.....II
   I.......I
   I...I...I
   I.PI.I..I
   I.I...I.I
   I..I.IP.I
   I...I...I
   I.......I
   I.C.C.C.I
   I...P...I
   I.C.C.C.I
   I...P...I
   I.C.C.C.I
   I.......I
   II#...#II
   I.I...I.I
   I.I.P.I.I
   I.I...I.I
   II.....II
   I.......I
   I..=P.=..I
   I..=..=..I
   I..=P.=..I
   II......II
   I........I
   I...F....I
   IIIIIIIIII
`);

export const LEVELS = [
    L1, L2, L3, L4, L5, L6, L7, L8, L9, L10,
    L11, L12, L13, L14, L15, L16, L17, L18, L19, L20,
    L21, L22, L23, L24, L25
];