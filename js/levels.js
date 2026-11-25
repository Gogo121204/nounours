// Niveaux : grille 30 x 20 tuiles de 32 px.
// Tuiles : '#' bloc, 'f' sirop de fraise (tue Bleu), 'g' barbe à papa bleue (tue Rose), 'c' chocolat (tue les deux),
// 'J' nuage rebondissant, '1'/'2' départs Bleu/Rose, 'D'/'E' portes Bleu/Rose,
// 'b' objet Bleu (PC), 'p' objet Rose (maquillage/doudou), 'a' avion (rare Bleu), 'r' bague (rare Rose)
// Mécanismes (coordonnées en tuiles) : levers, buttons (y = rangée où l'on se tient),
// platforms {x,y,w,h,dx,dy,on:[ids]}, unicorns {x,y,w,dx,dy,period}
const LW = 30, LH = 20;

function makeGrid(build) {
  const g = [];
  for (let y = 0; y < LH; y++) {
    const row = [];
    for (let x = 0; x < LW; x++) row.push((x === 0 || x === LW - 1 || y === 0 || y >= LH - 2) ? '#' : '.');
    g.push(row);
  }
  const api = {
    s: (x, y, ch) => { g[y][x] = ch; },
    h: (x1, x2, y, ch) => { for (let x = x1; x <= x2; x++) g[y][x] = ch; },
    v: (x, y1, y2, ch) => { for (let y = y1; y <= y2; y++) g[y][x] = ch; },
    r: (x1, y1, x2, y2, ch) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) g[y][x] = ch; },
  };
  build(api);
  return g.map((r) => r.join(''));
}

const LEVELS = [
  { // 1
    name: 'Premiers câlins', par: 40,
    hint: 'Bleu ne supporte pas le sirop de fraise, Rose fond dans la barbe à papa bleue !',
    build(g) {
      g.h(8, 10, 18, 'f'); g.h(14, 16, 18, 'g');
      g.h(19, 23, 15, '#'); g.h(24, 28, 12, '#');
      g.s(2, 17, '1'); g.s(4, 17, '2');
      g.s(9, 16, 'b'); g.s(15, 16, 'p'); g.s(21, 14, 'b'); g.s(22, 14, 'p');
      g.s(6, 17, 'p'); g.s(12, 17, 'b');
      g.s(25, 11, 'D'); g.s(27, 11, 'E');
    },
  },
  { // 2
    name: 'L\'ascenseur à câlins', par: 60,
    hint: 'Rose grimpe jusqu\'au bouton, Bleu attend sur l\'ascenseur. Le levier (↓) aide à redescendre.',
    build(g) {
      g.h(4, 6, 18, '.');
      g.h(7, 14, 11, '#');
      g.h(17, 19, 15, 'f');
      g.h(21, 28, 12, '#');
      g.s(1, 17, '1'); g.s(2, 17, '2');
      g.s(5, 14, 'b'); g.s(10, 17, 'b'); g.s(18, 14, 'p'); g.s(26, 11, 'p'); g.s(9, 10, 'b'); g.s(14, 17, 'p');
      g.s(11, 10, 'D'); g.s(13, 10, 'E');
    },
    levers: [{ x: 8, y: 10, id: 0 }],
    buttons: [{ x: 24, y: 11, id: 1 }],
    platforms: [{ x: 4, y: 18, w: 3, h: 1, dx: 0, dy: -7, on: [0, 1] }],
  },
  { // 3
    name: 'Licornes au-dessus du chocolat', par: 50,
    hint: 'Sautez sur le dos des licornes ! Le chocolat fondu ne pardonne à personne.',
    build(g) {
      g.h(7, 22, 18, 'c');
      g.s(24, 18, 'f'); g.s(25, 18, 'g');
      g.s(2, 17, '1'); g.s(4, 17, '2');
      g.s(12, 12, 'b'); g.s(18, 10, 'p'); g.s(9, 13, 'p'); g.s(21, 11, 'b');
      g.s(16, 9, 'a'); g.s(19, 8, 'r');
      g.s(26, 17, 'D'); g.s(28, 17, 'E');
    },
    unicorns: [
      { x: 8, y: 15, w: 3, dx: 5, dy: 0, period: 5 },
      { x: 15, y: 13, w: 3, dx: 5, dy: 0, period: 6 },
    ],
  },
  { // 4
    name: 'Le pont arc-en-ciel', par: 75,
    hint: 'Le levier fait glisser le pont. Ensuite : un bouton chacun pour les deux ascenseurs.',
    build(g) {
      g.h(10, 18, 18, 'c');
      g.h(20, 23, 18, '.');
      g.h(13, 19, 10, '#');
      g.s(2, 17, '1'); g.s(3, 17, '2');
      g.s(12, 13, 'b'); g.s(16, 13, 'p'); g.s(26, 16, 'b'); g.s(28, 17, 'p'); g.s(21, 12, 'b'); g.s(22, 13, 'p');
      g.s(17, 9, 'D'); g.s(18, 9, 'E');
    },
    levers: [{ x: 6, y: 17, id: 0 }],
    buttons: [{ x: 26, y: 17, id: 1 }, { x: 14, y: 9, id: 2 }],
    platforms: [
      { x: 1, y: 15, w: 9, h: 1, dx: 9, dy: 0, on: [0] },
      { x: 20, y: 18, w: 2, h: 1, dx: 0, dy: -8, on: [1] },
      { x: 22, y: 18, w: 2, h: 1, dx: 0, dy: -8, on: [2] },
    ],
  },
  { // 5
    name: 'Nuages rebondissants', par: 55,
    hint: 'Chacun son côté ! Les nuages font rebondir très haut.',
    build(g) {
      g.r(14, 4, 15, 17, '#');
      g.h(3, 10, 18, 'g'); g.h(19, 26, 18, 'f');
      g.s(13, 18, 'J'); g.s(16, 18, 'J');
      g.h(6, 9, 12, '#'); g.s(6, 12, 'J');
      g.h(20, 23, 12, '#'); g.s(23, 12, 'J');
      g.h(8, 11, 6, '#'); g.h(18, 21, 6, '#');
      g.h(13, 16, 3, '#');
      g.s(1, 17, '1'); g.s(28, 17, '2');
      g.s(6, 16, 'b'); g.s(9, 11, 'b'); g.s(11, 5, 'b'); g.s(13, 10, 'b');
      g.s(23, 16, 'p'); g.s(20, 11, 'p'); g.s(18, 5, 'p'); g.s(16, 10, 'p');
      g.s(13, 2, 'D'); g.s(16, 2, 'E');
    },
  },
  { // 6
    name: 'Le grand huit des licornes', par: 70,
    hint: 'Le levier sur l\'île ouvre la grille des portes. Attention aux flaques de l\'île !',
    build(g) {
      g.h(7, 28, 18, 'c');
      g.h(16, 19, 13, '#'); g.s(18, 13, 'f'); g.s(19, 13, 'g');
      g.h(24, 28, 8, '#');
      g.s(2, 17, '1'); g.s(4, 17, '2');
      g.s(9, 12, 'b'); g.s(14, 12, 'p'); g.s(16, 12, 'p'); g.s(22, 11, 'b'); g.s(28, 7, 'p'); g.s(13, 14, 'b');
      g.s(11, 11, 'a'); g.s(22, 6, 'r');
      g.s(26, 7, 'D'); g.s(27, 7, 'E');
    },
    levers: [{ x: 17, y: 12, id: 0 }],
    platforms: [{ x: 24, y: 4, w: 1, h: 4, dx: 0, dy: -3, on: [0] }],
    unicorns: [
      { x: 7, y: 15, w: 3, dx: 6, dy: 0, period: 4.5 },
      { x: 21, y: 14, w: 3, dx: 0, dy: -6, period: 5 },
    ],
  },
  { // 7
    name: 'Le labyrinthe des doudous', par: 80,
    hint: 'Un bouton en bas, un bouton derrière la grille : il faut s\'entraider !',
    build(g) {
      g.h(8, 9, 18, 'f'); g.h(12, 13, 18, 'g');
      g.h(20, 28, 15, '#'); g.h(23, 24, 15, 'f'); g.h(26, 27, 15, 'g');
      g.h(10, 19, 12, '#'); g.h(14, 15, 12, 'c');
      g.h(1, 8, 9, '#');
      g.h(10, 20, 6, '#');
      g.s(2, 17, '1'); g.s(4, 17, '2');
      g.s(10, 17, 'b'); g.s(14, 17, 'p'); g.s(25, 14, 'b'); g.s(28, 14, 'p'); g.s(12, 11, 'b'); g.s(17, 11, 'p');
      g.s(6, 8, 'b'); g.s(5, 8, 'p');
      g.s(18, 5, 'D'); g.s(19, 5, 'E');
    },
    buttons: [{ x: 3, y: 8, id: 0 }, { x: 16, y: 5, id: 1 }],
    platforms: [{ x: 13, y: 3, w: 1, h: 3, dx: 0, dy: -2, on: [0, 1] }],
  },
  { // 8
    name: 'Tempête de licornes', par: 70,
    hint: 'Trois licornes, une île et un levier pour ouvrir la grande grille.',
    build(g) {
      g.h(5, 24, 18, 'c');
      g.h(8, 11, 10, '#');
      g.s(1, 17, '1'); g.s(3, 17, '2');
      g.s(8, 13, 'b'); g.s(10, 9, 'p'); g.s(15, 11, 'p'); g.s(18, 11, 'b'); g.s(21, 13, 'p'); g.s(23, 13, 'b');
      g.s(27, 17, 'D'); g.s(28, 17, 'E');
    },
    levers: [{ x: 9, y: 9, id: 0 }],
    platforms: [{ x: 25, y: 6, w: 1, h: 12, dx: 0, dy: -6, on: [0] }],
    unicorns: [
      { x: 5, y: 15, w: 3, dx: 4, dy: 0, period: 3.5 },
      { x: 13, y: 13, w: 3, dx: 4, dy: 0, period: 4 },
      { x: 20, y: 15, w: 3, dx: 2, dy: 0, period: 3 },
    ],
  },
  { // 9
    name: 'Deux étages, deux chemins', par: 80,
    hint: 'Rose en haut, Bleu en bas. Le bouton de Rose ouvre la voie de Bleu, le levier de Bleu ouvre celle de Rose.',
    build(g) {
      g.r(2, 15, 3, 17, '#');
      g.h(5, 28, 12, '#');
      g.h(8, 19, 18, 'g');
      g.h(9, 15, 12, 'f');
      g.s(6, 17, '1'); g.s(5, 17, '2');
      g.s(10, 17, 'b'); g.s(16, 17, 'b'); g.s(23, 17, 'b'); g.s(11, 11, 'p'); g.s(19, 11, 'p'); g.s(25, 11, 'p');
      g.s(12, 15, 'a'); g.s(13, 6, 'r');
      g.s(27, 17, 'D'); g.s(26, 11, 'E');
    },
    levers: [{ x: 24, y: 17, id: 1 }],
    buttons: [{ x: 18, y: 11, id: 0 }],
    platforms: [
      { x: 20, y: 13, w: 1, h: 5, dx: 0, dy: 5, on: [0] },
      { x: 22, y: 7, w: 1, h: 5, dx: 0, dy: -6, on: [1] },
    ],
    unicorns: [{ x: 9, y: 9, w: 3, dx: 5, dy: 0, period: 4 }],
  },
  { // 10
    name: 'Le château des licornes', par: 100,
    hint: 'Dernier niveau ! Le levier de droite ouvre la grille du sommet.',
    build(g) {
      g.h(7, 22, 18, 'c');
      g.h(15, 17, 15, '#'); g.s(16, 15, 'J');
      g.h(10, 14, 9, '#');
      g.h(6, 8, 6, '#');
      g.h(11, 17, 4, '#');
      g.s(24, 18, 'f'); g.s(25, 18, 'g');
      g.s(2, 17, '1'); g.s(4, 17, '2');
      g.s(10, 12, 'b'); g.s(13, 12, 'p'); g.s(12, 8, 'b'); g.s(7, 5, 'p'); g.s(20, 13, 'b'); g.s(27, 16, 'p');
      g.s(16, 11, 'a'); g.s(16, 9, 'r');
      g.s(15, 3, 'D'); g.s(16, 3, 'E');
    },
    levers: [{ x: 27, y: 17, id: 0 }],
    platforms: [{ x: 13, y: 1, w: 1, h: 3, dx: 0, dy: 0, on: [0], vanish: true }],
    unicorns: [
      { x: 7, y: 15, w: 3, dx: 5, dy: 0, period: 4 },
      { x: 18, y: 16, w: 3, dx: 3, dy: 0, period: 3 },
    ],
  },
];

LEVELS.forEach((L, i) => { L.grid = makeGrid(L.build); L.index = i; });
