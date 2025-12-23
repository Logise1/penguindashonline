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

// LEVEL 1: The Wide Path (Intro)
// Mucho más ancho para aprender los controles
const L1 = parseMap(`
IIIIII
I..S.I
I....I
I=...I
I....I
I#=..I
I....I
IC...I
I....I
I..F.I
IIIIII
`);

// LEVEL 2: Gentle Curves
// Curvas más suaves, sin esquinas de 90 grados cerradas
const L2 = parseMap(`
  IIIIII
 I...S..I
I......I
I=....I
I.....I
I.#=..I
I.....I
 I=....I
 I.....I
  I..F..I
  IIIIIII
`);

// LEVEL 3: The Fork (Split Choice)
// Caminos divididos pero con espacio suficiente (2 tiles min)
const L3 = parseMap(`
   IIIIIII
  I...S...I
  IC.....CI
  II#...#II
  I..I.I..I
  I..I.I..I
  I=.I.I=.I
  I..I.I..I
  II.....II
   I..F..I
   IIIIIII
`);

// LEVEL 4: The Forest
// Árboles como obstáculos, pero con rutas claras alrededor
const L4 = parseMap(`
 IIIIII
I..S...I
I..#=..I
I...C..I
I......I
IC....#I
I=.....I
I#=...CI
I......I
I..F...I
IIIIIIII
`);

// LEVEL 5: The Snake
// Zig-zag rítmico pero ancho
const L5 = parseMap(`
      IIIIII
      I..S.I
     I.....I
    I.....I
   I=....I
  I.....I
  I=....I
 I.....I
 I=....I
I.....I
I=....I
I..F.I
IIIIII
`);

// LEVEL 6: Dual Highway
// Dos carriles anchos separados por islas
const L6 = parseMap(`
   IIIIIII
   I..S..I
   I.....I
  II#...#II
  I...I...I
  I...I...I
  I=..I..=I
  I...I...I
  II.....II
   I..F..I
   IIIIIII
`);

// LEVEL 7: Slalom Rhythm
// Obstáculos centrales para forzar movimiento lateral, pero con espacio
const L7 = parseMap(`
 IIIIII
 I.S..I
 I=...I
 I.C..I
 I...#I
 I#...I
 I.C..I
 I...=I
 I=...I
 I.C..I
 I.F..I
 IIIIII
`);

// LEVEL 8: The Hourglass
// Se estrecha y se ensancha, pero el cuello de botella es pasable
const L8 = parseMap(`
   IIIIIII
  I...S...I
  I.......I
   I.....I
   I=...=I
   I..I..I
   I.....I
   IC...CI
   I.....I
  I...F...I
  IIIIIIIII
`);

// LEVEL 9: Hard Zig Zag
// Curvas fuertes pero más anchas que antes
const L9 = parseMap(`
    IIIIII
    I..S.I
    I....I
   I....I
   I=..I
  I....I
  I=..I
 I....I
 I=..I
I..F.I
IIIIII
`);

// LEVEL 10: The Gauntlet (Final Challenge)
// Difícil, pero justo. Sin muertes instantáneas injustas.
const L10 = parseMap(`
   IIIIIII
   I..S..I
   I#=..CI
   II...II
   I.....I
  I...I...I
  I=..I..=I
  I...I...I
   I.....I
   II...II
   I..F..I
   IIIIIII
`);


export const LEVELS = [
    L1, L2, L3, L4, L5, L6, L7, L8, L9, L10
];