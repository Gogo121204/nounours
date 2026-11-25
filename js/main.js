// Chef d'orchestre : menus, carte, boutique, enchaînement niveaux / mini-jeux
const W = 960, H = 640;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const SHOP = [
  { id: 'noeud', slot: 'head', name: 'Nœud', price: 6 },
  { id: 'moustache', slot: 'face', name: 'Moustache', price: 5 },
  { id: 'lunettes', slot: 'face', name: 'Lunettes de soleil', price: 8 },
  { id: 'coeurs', slot: 'face', name: 'Lunettes cœurs', price: 10 },
  { id: 'casquette', slot: 'head', name: 'Casquette', price: 10 },
  { id: 'fleurs', slot: 'head', name: 'Couronne de fleurs', price: 12 },
  { id: 'cowboy', slot: 'head', name: 'Chapeau de cowboy', price: 14 },
  { id: 'casque', slot: 'head', name: 'Casque gamer RGB', price: 16 },
  { id: 'corne', slot: 'head', name: 'Corne de licorne', price: 20 },
  { id: 'cape', slot: 'back', name: 'Cape arc-en-ciel', price: 22 },
  { id: 'ailes', slot: 'back', name: 'Ailes d\'ange', price: 25 },
  { id: 'couronne', slot: 'head', name: 'Couronne royale', price: 30 },
];

// ---------- sauvegarde ----------
const SAVE_KEY = 'nounours-licornes-save';
let save = (() => {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) return s; } catch (e) {}
  return { name: '', wallet: 0, owned: [], outfit: {}, collection: {}, host: { unlocked: 1, best: {}, rivalry: { blue: 0, pink: 0 }, mgDone: {} } };
})();
save.host = save.host || { unlocked: 1, best: {}, rivalry: { blue: 0, pink: 0 }, mgDone: {} };
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }

// ---------- état ----------
const G = {
  screen: 'menu', myRole: 'blue', otherRole: 'pink',
  names: { blue: 'Nounours Bleu', pink: 'Nounours Rose' },
  outfits: { blue: {}, pink: {} },
  host: save.host, // données de progression (celles de l'hôte font foi)
  level: null, levelIdx: 0, result: null, mg: null, mgIdx: 0, mgResult: null,
  t: 0, disconnected: false, gains: 0,
};

// ---------- entrées ----------
const keys = new Set(), pressed = new Set();
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', Space: 'up', ArrowDown: 'down', KeyS: 'down' };
window.addEventListener('keydown', (e) => {
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  Sfx.init();
  if (KEYMAP[e.code] || e.code.startsWith('Digit') || e.code.startsWith('Numpad')) e.preventDefault();
  if (!keys.has(e.code)) pressed.add(e.code);
  keys.add(e.code);
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());
const has = (act) => [...keys].some((k) => KEYMAP[k] === act);
const hit = (act) => [...pressed].some((k) => KEYMAP[k] === act);

function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
let mouseClicked = false;
canvas.addEventListener('mousemove', (e) => { const p = toCanvas(e); UI.mx = p.x; UI.my = p.y; });
canvas.addEventListener('mouseleave', () => { UI.mx = -1; UI.my = -1; });
canvas.addEventListener('mousedown', (e) => {
  Sfx.init(); Sfx.startMusic();
  const p = toCanvas(e); UI.mx = p.x; UI.my = p.y;
  mouseClicked = true;
  if (!UI.click(p.x, p.y) && G.mg && G.mg.onMouseDown) G.mg.onMouseDown(p.x, p.y);
});
window.addEventListener('mouseup', (e) => { const p = toCanvas(e); if (G.mg && G.mg.onMouseUp) G.mg.onMouseUp(p.x, p.y); });

// ---------- DOM (menu) ----------
const $ = (id) => document.getElementById(id);
const overlay = $('overlay');
$('name').value = save.name || '';
let chosenRole = 'pink';
document.querySelectorAll('.role').forEach((b) => b.addEventListener('click', () => {
  chosenRole = b.dataset.role;
  document.querySelectorAll('.role').forEach((x) => x.classList.toggle('sel', x === b));
}));
function myName(role) { const n = $('name').value.trim(); save.name = n; persist(); return n || COLORS[role].name; }
function status(msg) { $('status').textContent = msg; }

$('btnHost').addEventListener('click', () => {
  Sfx.init();
  const code = Net.makeCode();
  G.myRole = chosenRole; G.otherRole = chosenRole === 'blue' ? 'pink' : 'blue';
  G.names[G.myRole] = myName(G.myRole);
  status('Création de la partie…');
  Net.host(code, (r) => {
    if (!r.ok) { status('Erreur : ' + r.err + ' — réessaie.'); return; }
    $('menuMain').style.display = 'none'; $('lobby').style.display = 'block';
    $('code').textContent = code;
  });
});
$('btnJoin').addEventListener('click', () => {
  Sfx.init();
  const code = $('joinCode').value.trim().toUpperCase();
  if (code.length !== 4) { status('Le code fait 4 lettres 😉'); return; }
  status('Connexion à la partie ' + code + '…');
  Net.join(code, (r) => {
    if (!r.ok) status(r.err === 'peer-unavailable' ? 'Aucune partie avec ce code… vérifie les lettres !' : 'Erreur : ' + r.err);
  });
});
$('copyCode').addEventListener('click', () => { navigator.clipboard && navigator.clipboard.writeText($('code').textContent); $('copyCode').textContent = 'Copié !'; });

Net.onConnect = () => {
  if (!Net.isHost) Net.send('hello', { name: $('name').value.trim(), outfit: save.outfit });
};
Net.onDisconnect = () => { G.disconnected = true; };

Net.on('hello', (d) => {
  if (!Net.isHost) return;
  G.names[G.otherRole] = d.name || COLORS[G.otherRole].name;
  G.outfits[G.otherRole] = d.outfit || {};
  G.outfits[G.myRole] = save.outfit;
  Net.send('setup', { hostRole: G.myRole, hostName: G.names[G.myRole], hostOutfit: save.outfit, host: G.host });
  overlay.style.display = 'none';
  Sfx.startMusic();
  go('map');
});
Net.on('setup', (d) => {
  G.otherRole = d.hostRole; G.myRole = d.hostRole === 'blue' ? 'pink' : 'blue';
  G.names[G.otherRole] = d.hostName; G.names[G.myRole] = $('name').value.trim() || COLORS[G.myRole].name;
  G.outfits[G.otherRole] = d.hostOutfit || {}; G.outfits[G.myRole] = save.outfit;
  G.host = d.host;
  overlay.style.display = 'none';
  Sfx.startMusic();
});
Net.on('outfit', (d) => { G.outfits[G.otherRole] = d.outfit || {}; });
Net.on('goto', (d) => { if (d.host) G.host = d.host; applyGo(d.screen, d.idx); });
Net.on('reqmap', () => { if (Net.isHost) go('map'); });
for (const t of ['st', 'collect', 'lever', 'die', 'complete', 'emote', 'tsync']) Net.on(t, (d) => { if (G.level && G.screen === 'level') G.level.onNet(t, d); });
Net.on('mg', (d) => { if (G.mg) G.mg.onNet(d); });

// ---------- navigation (l'hôte décide) ----------
function go(screen, idx) {
  if (!Net.isHost) return;
  if (screen === 'map' || screen === 'final') persistHost();
  Net.send('goto', { screen, idx, host: G.host });
  applyGo(screen, idx);
}
function persistHost() { if (Net.isHost) { save.host = G.host; persist(); } }

function startTransition(title, sub, kind) {
  G.trans = { t: 0, title, sub, kind: kind || 'level' };
  Sfx.play('whoosh');
}

function applyGo(screen, idx) {
  G.screen = screen; G.mg = null; G.mgResult = null; G.result = null;
  if (screen === 'level') { Sfx.setTrack('calm'); startTransition(`Niveau ${idx + 1}`, LEVELS[idx].name, 'level'); }
  else if (screen === 'minigame') { Sfx.setTrack('mini'); startTransition('Mini-jeu duel !', MG_INFO[idx].name, 'mg'); }
  else if (screen === 'final') { Sfx.setTrack('final'); startTransition('Le grand final', 'Bravo les nounours !', 'final'); }
  else { Sfx.setTrack('calm'); if (screen === 'map') startTransition('', '', 'quick'); }
  if (screen === 'level') {
    G.levelIdx = idx;
    G.level = new Level(LEVELS[idx], { myRole: G.myRole, names: G.names, outfits: G.outfits, onEvent: onLevelEvent });
  } else G.level = screen === 'result' ? G.level : null;
  if (screen === 'minigame') {
    G.mgIdx = idx;
    G.mg = new MG_CLASSES[idx]({ index: idx, myRole: G.myRole, otherRole: G.otherRole, names: G.names, outfits: G.outfits, onResult: onMgResult });
  }
  if (screen === 'final') { G.finalT = 0; Sfx.play('win'); }
}

function onLevelEvent(type, res) {
  if (type !== 'complete') return;
  G.result = res; G.screen = 'result'; G.resT = 0; G.coinShown = 0;
  Sfx.play('fanfare'); setTimeout(() => Sfx.play('rank'), 900);
  // gains personnels
  const mine = res[G.myRole];
  G.gains = mine.got + (mine.rare ? 10 : 0);
  save.wallet += G.gains;
  for (const s of mine.subs) save.collection[s] = (save.collection[s] || 0) + 1;
  if (mine.rare) save.collection[mine.rareSub] = (save.collection[mine.rareSub] || 0) + 1;
  persist();
  if (Net.isHost) {
    const h = G.host, i = G.levelIdx;
    h.unlocked = Math.max(h.unlocked, Math.min(10, i + 2));
    const order = 'CBAS';
    if (!h.best[i] || order.indexOf(res.rank) > order.indexOf(h.best[i])) h.best[i] = res.rank;
    persistHost();
  }
}

function onMgResult(w) {
  G.mgResult = w;
  if (w === G.myRole) { save.wallet += 5; persist(); }
  if (Net.isHost && w !== 'tie') { G.host.rivalry[w] = (G.host.rivalry[w] || 0) + 1; G.host.mgDone[G.mgIdx] = true; persistHost(); }
}

function afterLevel() {
  const i = G.levelIdx;
  if ((i + 1) % 2 === 0) go('minigame', (i + 1) / 2 - 1);
  else go('level', Math.min(9, i + 1));
}
function afterMg() {
  if (G.mgIdx >= 4) go('final');
  else go('level', (G.mgIdx + 1) * 2);
}

// ---------- écrans ----------
const MAP_NODES = [[110, 520], [230, 430], [130, 320], [270, 230], [420, 300], [540, 420], [680, 470], [800, 370], [700, 250], [830, 140]];

function drawMap() {
  Art.background(ctx, W, H, G.t, 1);
  UI.title(ctx, 'Nounours & Licornes', W / 2, 46, 44);
  // chemin
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 10; ctx.setLineDash([2, 16]); ctx.lineCap = 'round';
  ctx.beginPath(); MAP_NODES.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore();
  const h = G.host;
  // mini-jeux entre les niveaux
  for (let m = 0; m < 5; m++) {
    const a = MAP_NODES[m * 2 + 1], b = MAP_NODES[Math.min(9, m * 2 + 2)];
    const x = m === 4 ? a[0] + 70 : (a[0] + b[0]) / 2 + 30, y = m === 4 ? a[1] + 70 : (a[1] + b[1]) / 2;
    const open = !!h.best[m * 2 + 1];
    ctx.save(); ctx.globalAlpha = open ? 1 : 0.7;
    Art.sparkle(ctx, x, y, 20 + Math.sin(G.t * 3 + m) * 2, open ? '#ffd34d' : '#ccc');
    UI.text(ctx, MG_INFO[m].name, x, y + 30, 13, '#8a4f9e');
    if (h.mgDone && h.mgDone[m]) UI.text(ctx, '✓', x, y + 1, 14, '#fff');
    ctx.restore();
    if (open && Net.isHost) UI.hits.push({ x: x - 24, y: y - 24, w: 48, h: 48, cb: () => go('minigame', m) });
  }
  MAP_NODES.forEach(([x, y], i) => {
    const open = i < h.unlocked;
    ctx.save();
    ctx.shadowColor = 'rgba(150,80,160,0.35)'; ctx.shadowBlur = 12;
    Art.cloud(ctx, x - 26, y + 4, 0.8, open ? 1 : 0.55);
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fillStyle = open ? (i % 2 ? '#ff9fd0' : '#8fd3ff') : '#d9d2e3'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    UI.text(ctx, open ? String(i + 1) : '🔒', x, y + 1, open ? 20 : 16, '#fff');
    if (h.best[i]) UI.text(ctx, h.best[i], x + 24, y - 20, 16, h.best[i] === 'S' ? '#ff4f8b' : '#8a4f9e');
    if (open && Net.isHost) UI.hits.push({ x: x - 26, y: y - 26, w: 52, h: 52, cb: () => go('level', i) });
    if (open && Math.hypot(UI.mx - x, UI.my - y) < 26) { UI.panel(ctx, x - 110, y - 74, 220, 40, 0.95); UI.text(ctx, LEVELS[i].name, x, y - 54, 14, '#7a3f8e'); }
  });
  // licorne qui vole sur la carte
  Art.unicorn(ctx, 420 + Math.sin(G.t * 0.6) * 60, 120 + Math.sin(G.t * 1.2) * 12, 90, G.t, Math.cos(G.t * 0.6) > 0 ? 1 : -1);
  // joueurs + rivalité
  UI.panel(ctx, 20, 560, 300, 70, 0.9);
  Art.teddy(ctx, 50, 620, 'blue', { scale: 1.3, outfit: G.outfits.blue, t: G.t });
  Art.teddy(ctx, 290, 620, 'pink', { scale: 1.3, outfit: G.outfits.pink, t: G.t, face: -1 });
  UI.text(ctx, 'Rivalité mini-jeux', 170, 578, 13, '#a070b0');
  UI.text(ctx, `${G.names.blue}  ${G.host.rivalry.blue} – ${G.host.rivalry.pink}  ${G.names.pink}`, 170, 604, 15, '#7a3f8e');
  UI.btn(ctx, W - 210, 572, 190, 50, '🛍️ Boutique', () => { G.screen = 'shop'; });
  UI.btn(ctx, W - 330, 580, 110, 36, Sfx.musicOn ? '🎵 On' : '🎵 Off', () => { Sfx.toggleMusic(); }, { size: 14, color: '#b9a0f5' });
  UI.text(ctx, Net.isHost ? 'Clique sur un niveau ou une étoile ⭐' : `C'est ${G.names[G.otherRole]} qui choisit le niveau 💕`, W / 2 + 40, 600, 15, '#8a4f9e');
}

function drawResult() {
  if (G.level) G.level.draw(ctx, W, H);
  const r = G.result;
  ctx.fillStyle = 'rgba(255,230,245,0.55)'; ctx.fillRect(0, 0, W, H);
  UI.panel(ctx, 180, 80, 600, 480);
  UI.title(ctx, 'Niveau réussi !', W / 2, 130, 40);
  UI.text(ctx, `Temps : ${Math.floor(r.time / 60)}:${String(Math.floor(r.time % 60)).padStart(2, '0')}  (objectif ${r.par}s)`, W / 2, 180, 18, '#7a3f8e');
  ctx.save(); ctx.font = 'bold 90px "Fredoka","Trebuchet MS",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.strokeText(r.rank, W / 2, 255);
  ctx.fillStyle = { S: '#ff4f8b', A: '#b07cf0', B: '#5aa8f0', C: '#9a8fa8' }[r.rank]; ctx.fillText(r.rank, W / 2, 255); ctx.restore();
  for (const [role, x] of [['blue', 320], ['pink', 640]]) {
    const d = r[role];
    Art.teddy(ctx, x, 380, role, { scale: 2, outfit: G.outfits[role], t: G.t });
    UI.text(ctx, G.names[role], x, 400, 16, COLORS[role].dark);
    UI.text(ctx, `${d.got} / ${d.total} objets`, x, 424, 16, COLORS[role].dark);
    d.subs.slice(0, 7).forEach((s, k) => Art.item(ctx, s, x - (Math.min(7, d.subs.length) - 1) * 13 + k * 26, 452, G.t, 20));
    if (d.rare != null) UI.text(ctx, d.rare ? `★ ${ITEM_NAMES[d.rareSub]} trouvé(e) !` : `★ ${ITEM_NAMES[d.rareSub]} raté(e)…`, x, 482, 14, d.rare ? '#ff4f8b' : '#a090b0');
  }
  G.resT += 1 / 60;
  if (G.resT > 1.2 && G.coinShown < G.gains && Math.floor(G.resT * 12) !== G.lastCoinTick) { G.lastCoinTick = Math.floor(G.resT * 12); G.coinShown++; Sfx.play('coin'); }
  UI.text(ctx, `+${G.coinShown} pour ta boutique 🛍️`, W / 2, 330, 16, '#a070b0');
  if (Net.isHost) {
    const next = (G.levelIdx + 1) % 2 === 0 ? `Mini-jeu : ${MG_INFO[(G.levelIdx + 1) / 2 - 1].name}` : 'Niveau suivant';
    UI.btn(ctx, W / 2 + 10, 500, 250, 46, next + ' ➜', afterLevel, { size: 15 });
    UI.btn(ctx, W / 2 - 260, 500, 120, 46, 'Rejouer', () => go('level', G.levelIdx), { size: 15, color: '#b9a0f5' });
    UI.btn(ctx, W / 2 - 130, 500, 120, 46, 'Carte', () => go('map'), { size: 15, color: '#b9a0f5' });
  } else UI.text(ctx, `${G.names[G.otherRole]} choisit la suite…`, W / 2, 522, 16, '#a070b0');
}

function drawMgOverlay() {
  const w = G.mgResult;
  ctx.fillStyle = 'rgba(255,230,245,0.6)'; ctx.fillRect(0, 0, W, H);
  UI.panel(ctx, 230, 170, 500, 300);
  if (w === 'tie') UI.title(ctx, 'Égalité parfaite !', W / 2, 230, 38);
  else {
    UI.title(ctx, `${G.names[w]} gagne !`, W / 2, 225, 38);
    Art.teddy(ctx, W / 2, 360, w, { scale: 3, outfit: G.outfits[w], t: G.t });
    for (let i = 0; i < 6; i++) Art.heart(ctx, W / 2 + Math.cos(G.t * 2 + i) * 110, 300 + Math.sin(G.t * 2 + i) * 40, 16, i % 2 ? '#ff6fae' : '#b07cf0');
    UI.text(ctx, w === G.myRole ? '+5 pour ta boutique 🛍️' : 'La revanche au prochain mini-jeu 😈', W / 2, 390, 16, '#a070b0');
  }
  if (Net.isHost) {
    UI.btn(ctx, W / 2 - 10, 410, 220, 46, G.mgIdx >= 4 ? 'Le grand final ➜' : 'Niveau suivant ➜', afterMg, { size: 15 });
    UI.btn(ctx, W / 2 - 210, 410, 180, 46, 'Revanche', () => go('minigame', G.mgIdx), { size: 15, color: '#b9a0f5' });
  } else UI.text(ctx, `${G.names[G.otherRole]} choisit la suite…`, W / 2, 432, 16, '#a070b0');
}

function setOutfit(slot, id) {
  save.outfit = Object.assign({}, save.outfit); save.outfit[slot] = id; if (!id) delete save.outfit[slot];
  G.outfits[G.myRole] = save.outfit; persist(); Net.send('outfit', { outfit: save.outfit });
}

function drawShop() {
  Art.background(ctx, W, H, G.t, 2);
  UI.title(ctx, 'La boutique des nounours', W / 2, 40, 36);
  UI.panel(ctx, 20, 70, 300, 550);
  Art.teddy(ctx, 170, 360, G.myRole, { scale: 5, outfit: save.outfit, t: G.t });
  UI.text(ctx, G.names[G.myRole], 170, 390, 20, COLORS[G.myRole].dark);
  Art.item(ctx, G.myRole === 'blue' ? 'gpu' : 'lipstick', 120, 430, G.t, 26);
  UI.text(ctx, `${save.wallet}`, 170, 430, 26, COLORS[G.myRole].dark);
  UI.text(ctx, 'Ta collection', 170, 470, 15, '#a070b0');
  const coll = Object.entries(save.collection).filter(([s]) => (G.myRole === 'blue' ? [...BLUE_ITEMS, 'plane'] : [...PINK_ITEMS, 'ring']).includes(s));
  if (!coll.length) UI.text(ctx, 'Ramasse des objets dans les niveaux !', 170, 500, 13, '#a090b0');
  coll.forEach(([s, n], k) => {
    const x = 50 + (k % 4) * 66, y = 505 + Math.floor(k / 4) * 50;
    Art.item(ctx, s, x, y, G.t, 22); UI.text(ctx, '×' + n, x + 26, y + 4, 13, '#7a3f8e');
  });
  SHOP.forEach((it, k) => {
    const x = 340 + (k % 4) * 152, y = 70 + Math.floor(k / 4) * 170;
    UI.panel(ctx, x, y, 140, 160, 0.9);
    const o = {}; o[it.slot] = it.id;
    Art.teddy(ctx, x + 70, y + 92, G.myRole, { scale: 1.9, outfit: o, t: G.t });
    UI.text(ctx, it.name, x + 70, y + 108, 13, '#7a3f8e');
    const owned = save.owned.includes(it.id), worn = save.outfit[it.slot] === it.id;
    if (!owned) UI.btn(ctx, x + 14, y + 120, 112, 30, `Acheter · ${it.price}`, () => { if (save.wallet >= it.price) { save.wallet -= it.price; save.owned.push(it.id); setOutfit(it.slot, it.id); Sfx.play('buy'); } }, { size: 13, disabled: save.wallet < it.price });
    else UI.btn(ctx, x + 14, y + 120, 112, 30, worn ? 'Retirer' : 'Porter', () => setOutfit(it.slot, worn ? null : it.id), { size: 13, color: worn ? '#c0a0d0' : '#9b7cf0' });
  });
  UI.btn(ctx, W - 200, 590, 180, 40, '← Retour', () => { G.screen = 'map'; }, { size: 15, color: '#b9a0f5' });
}

function drawFinal() {
  G.finalT += 1 / 60;
  Art.background(ctx, W, H, G.t, 9);
  for (let i = 0; i < 40; i++) {
    const x = (i * 97 + G.t * 40 * (1 + (i % 3))) % W, y = (i * 53 + G.t * 60 * (1 + (i % 2))) % H;
    Art.heart(ctx, x, H - y, 10 + (i % 4) * 4, ['#ff6fae', '#b07cf0', '#5aa8f0', '#ffd34d'][i % 4]);
  }
  for (let i = 0; i < 3; i++) Art.unicorn(ctx, ((G.t * 60 + i * 340) % (W + 200)) - 150, 90 + i * 60 + Math.sin(G.t + i) * 15, 80, G.t + i, 1, 0.8);
  UI.panel(ctx, 160, 150, 640, 420);
  UI.title(ctx, 'Vous avez fini le jeu !', W / 2, 200, 40);
  const r = G.host.rivalry, champ = r.blue > r.pink ? 'blue' : r.pink > r.blue ? 'pink' : null;
  UI.text(ctx, `Mini-jeux : ${G.names.blue} ${r.blue} – ${r.pink} ${G.names.pink}`, W / 2, 250, 20, '#7a3f8e');
  UI.text(ctx, champ ? `👑 Champion·ne du couple : ${G.names[champ]} 👑` : '👑 Égalité parfaite, vous êtes tous les deux champions 👑', W / 2, 285, 20, champ ? COLORS[champ].dark : '#7a3f8e');
  Art.teddy(ctx, 360, 450, 'blue', { scale: 3.2, outfit: Object.assign({}, G.outfits.blue, champ === 'blue' ? { head: 'couronne' } : {}), t: G.t, face: 1 });
  Art.teddy(ctx, 600, 450, 'pink', { scale: 3.2, outfit: Object.assign({}, G.outfits.pink, champ === 'pink' ? { head: 'couronne' } : {}), t: G.t, face: -1 });
  Art.heart(ctx, W / 2, 380 + Math.sin(G.t * 4) * 5, 40, '#ff4f8b');
  const a = Math.min(1, Math.max(0, G.finalT - 1));
  ctx.save(); ctx.globalAlpha = a; UI.title(ctx, 'Bêtise réussie 😈', W / 2, 515, 46 + Math.sin(G.t * 3) * 2); ctx.restore();
  if (Net.isHost) UI.btn(ctx, W / 2 - 110, 590, 220, 40, 'Retour à la carte', () => go('map'), { size: 15, color: '#b9a0f5' });
}

// ---------- boucle ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now;
  G.t += dt;
  UI.begin();
  const emoteKey = [...pressed].find((k) => /^(Digit|Numpad)[1-7]$/.test(k));
  const input = {
    left: has('left'), right: has('right'), jump: has('up'), jumpPressed: hit('up'), downPressed: hit('down'),
    emote: emoteKey ? parseInt(emoteKey.slice(-1), 10) - 1 : null,
    actionPressed: pressed.has('Space') || pressed.has('Enter') || mouseClicked,
  };
  if (pressed.has('Escape')) {
    if (G.screen === 'level') { if (Net.isHost) go('map'); else Net.send('reqmap', {}); }
    else if (G.screen === 'shop') G.screen = 'map';
  }
  if (pressed.has('KeyM')) Sfx.toggleMusic();
  ctx.clearRect(0, 0, W, H);
  switch (G.screen) {
    case 'menu': Art.background(ctx, W, H, G.t, 0); Art.unicorn(ctx, 380 + Math.sin(G.t) * 40, 470, 200, G.t, 1); break;
    case 'map': drawMap(); break;
    case 'level': if (!G.trans || G.trans.t > 1.1) G.level.update(dt, input); G.level.draw(ctx, W, H); drawEmoteBar(); break;
    case 'result': if (G.level) G.level.update(dt, {}); drawResult(); break;
    case 'minigame':
      if (G.mg) {
        if (!G.mgResult && (!G.trans || G.trans.t > 1.1)) G.mg.update(dt, input); else G.mg.t += dt;
        G.mg.draw(ctx, W, H);
        if (input.emote != null) { G.mgBubble = { role: G.myRole, text: EMOTES[input.emote], until: G.t + 2.5 }; Net.send('mgemote', { i: input.emote }); Sfx.play('emote'); }
        if (G.mgBubble && G.mgBubble.until > G.t) Art.bubble(ctx, G.mgBubble.role === 'blue' ? 140 : W - 140, 110, G.mgBubble.text);
        if (G.mgResult) drawMgOverlay();
      }
      break;
    case 'shop': drawShop(); break;
    case 'final': drawFinal(); break;
  }
  if (G.trans) drawTransition(dt);
  if (G.disconnected) {
    ctx.fillStyle = 'rgba(80,40,90,0.6)'; ctx.fillRect(0, 0, W, H);
    UI.panel(ctx, 230, 240, 500, 140);
    UI.text(ctx, 'Connexion perdue 😢', W / 2, 285, 28, '#7a3f8e');
    UI.text(ctx, 'Rechargez la page tous les deux pour relancer une partie.', W / 2, 330, 16, '#a070b0');
  }
  pressed.clear(); mouseClicked = false;
  requestAnimationFrame(frame);
}
Net.on('mgemote', (d) => { G.mgBubble = { role: G.otherRole, text: EMOTES[d.i], until: G.t + 2.5 }; Sfx.play('emote'); });

function drawEmoteBar() {
  ctx.save(); ctx.globalAlpha = 0.85;
  const txt = EMOTES.map((e, i) => `${i + 1} ${e}`).join('   ');
  ctx.font = '13px "Segoe UI Emoji","Trebuchet MS",sans-serif';
  const w = ctx.measureText(txt).width + 30;
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; Art.roundRect(ctx, (W - w) / 2, H - 26, w, 22, 11); ctx.fill();
  ctx.fillStyle = '#7a3f8e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, W / 2, H - 15);
  ctx.restore();
}

function resize() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = W * s + 'px'; canvas.style.height = H * s + 'px';
}
window.addEventListener('resize', resize); resize();
requestAnimationFrame(frame);

// Test local à deux onglets : ?net=bc&auto=host|join&code=ABCD&role=pink
(() => {
  const p = new URLSearchParams(location.search);
  if (p.get('auto') === 'host') { chosenRole = p.get('role') || 'pink'; $('name').value = p.get('name') || 'Hôte'; const c = p.get('code') || 'TEST'; Net.makeCode = () => c; $('btnHost').click(); }
  if (p.get('auto') === 'join') { $('name').value = p.get('name') || 'Invité'; $('joinCode').value = p.get('code') || 'TEST'; setTimeout(() => $('btnJoin').click(), 300); }
})();

// Écran de transition : rideau de nuages + titre
function drawTransition(dt) {
  const tr = G.trans; tr.t += dt;
  const dur = tr.kind === 'quick' ? 0.7 : 2.0;
  if (tr.t > dur) { G.trans = null; return; }
  const p = tr.t / dur;
  // couverture : 1 au début, s'ouvre sur la fin
  const open = tr.kind === 'quick' ? p : Math.max(0, (p - 0.6) / 0.4);
  const cover = 1 - open * open;
  ctx.save();
  const half = (W / 2 + 120) * cover;
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? half - (W / 2 + 120) : W - half;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ffd3ea'); g.addColorStop(1, '#d8c8ff');
    ctx.fillStyle = g; ctx.fillRect(x0, 0, W / 2 + 120, H);
    ctx.fillStyle = '#fff';
    const edge = side < 0 ? x0 + W / 2 + 120 : x0;
    if (cover < 0.97) for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(edge, i * 80 + 20, 60, 0, Math.PI * 2); ctx.fill(); }
  }
  if (tr.title && cover > 0.6) {
    ctx.globalAlpha = Math.min(1, (cover - 0.6) / 0.3);
    const pop = 1 + Math.max(0, 0.15 - tr.t * 0.4);
    ctx.translate(W / 2, H / 2); ctx.scale(pop, pop); ctx.translate(-W / 2, -H / 2);
    if (tr.kind === 'mg') { Art.teddy(ctx, W / 2 - 170, H / 2 + 70, 'blue', { scale: 2.6, outfit: G.outfits.blue, t: G.t, face: 1 }); Art.teddy(ctx, W / 2 + 170, H / 2 + 70, 'pink', { scale: 2.6, outfit: G.outfits.pink, t: G.t, face: -1 }); UI.title(ctx, 'VS', W / 2, H / 2 + 40, 50); }
    else if (tr.kind === 'level') Art.unicorn(ctx, W / 2 - 70 + Math.sin(G.t * 2) * 10, H / 2 + 50, 140, G.t, 1);
    else { for (let i = 0; i < 8; i++) Art.heart(ctx, W / 2 + Math.cos(i * 0.8 + G.t) * 200, H / 2 + 60 + Math.sin(i * 0.8 + G.t) * 40, 22, i % 2 ? '#ff6fae' : '#b07cf0'); }
    UI.title(ctx, tr.title, W / 2, H / 2 - 70, 54);
    UI.text(ctx, tr.sub, W / 2, H / 2 - 22, 24, '#8a4f9e');
  }
  ctx.restore();
}
