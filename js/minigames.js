// Mini-jeux duels (un tous les deux niveaux)
const MG_INFO = [
  { id: 'duel', name: 'Duel de cowboys', rules: 'Attendez le signal « FEU ! » puis appuyez sur ESPACE (ou cliquez) le plus vite possible. Trop tôt = perdu ! Premier à 2 manches.' },
  { id: 'yams', name: 'Yams express', rules: '3 tours chacun. Jusqu\'à 3 lancers par tour, cliquez sur les dés pour les garder. Le meilleur combo compte (Yams = 50 !). Le plus gros total gagne.' },
  { id: 'palet', name: 'Palet sur nuage', rules: '3 palets chacun. Cliquez sur votre palet, tirez en arrière comme un lance-pierre et relâchez. Le palet le plus proche du cœur gagne !' },
  { id: 'quiestce', name: 'Qui est-ce ?', rules: 'Chacun a un personnage secret. À votre tour, posez une question (les cartes s\'éliminent toutes seules) ou tentez de deviner. Mauvaise réponse = défaite !' },
  { id: 'hockey', name: 'Air hockey', rules: 'Déplacez votre palet avec la souris (moitié du bas). Premier à 5 buts !' },
];

function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

class MiniGame {
  constructor(o) { Object.assign(this, o); this.result = null; this.t = 0; this.started = false; this.info = MG_INFO[o.index]; }
  send(d) { Net.send('mg', d); }
  roleName(r) { return this.names[r]; }
  end(w) { if (!Net.isHost || this.result) return; this.send({ t: 'end', w }); this.showEnd(w); }
  showEnd(w) { if (this.result) return; this.result = w; Sfx.play(w === this.myRole ? 'win' : (w === 'tie' ? 'click' : 'lose')); this.onResult(w); }
  netBase(d) {
    if (d.t === 'end') { this.showEnd(d.w); return true; }
    if (d.t === 'start') { this.started = true; this.onStart && this.onStart(d); return true; }
    return false;
  }
  hostStart(extra) { const d = Object.assign({ t: 'start' }, extra || {}); this.send(d); this.started = true; this.onStart && this.onStart(d); }
  // écran d'intro commun
  drawIntro(ctx, W, H) {
    UI.panel(ctx, 170, 150, 620, 340);
    UI.title(ctx, this.info.name, W / 2, 200, 38);
    UI.wrap(ctx, this.info.rules, W / 2, 260, 540, 26, 18, '#7a3f8e');
    Art.teddy(ctx, 260, 470, 'blue', { scale: 2, outfit: this.outfits.blue, t: this.t, face: 1 });
    Art.teddy(ctx, 700, 470, 'pink', { scale: 2, outfit: this.outfits.pink, t: this.t, face: -1 });
    if (Net.isHost) UI.btn(ctx, W / 2 - 110, 410, 220, 52, 'C\'est parti !', () => this.hostStart(this.startData && this.startData()));
    else UI.text(ctx, 'En attente de ' + this.names[this.otherRole] + '…', W / 2, 436, 18, '#a070b0');
  }
  bg(ctx, W, H) { Art.background(ctx, W, H, this.t, 3 + this.index); }
  scoreBar(ctx, W, sb, sp, label) {
    UI.panel(ctx, 20, 12, 230, 54, 0.85); UI.panel(ctx, W - 250, 12, 230, 54, 0.85);
    Art.teddy(ctx, 52, 60, 'blue', { scale: 1, outfit: this.outfits.blue, t: this.t });
    Art.teddy(ctx, W - 52, 60, 'pink', { scale: 1, outfit: this.outfits.pink, t: this.t, face: -1 });
    UI.text(ctx, this.names.blue, 150, 30, 15, COLORS.blue.dark); UI.text(ctx, String(sb), 150, 52, 20, COLORS.blue.dark);
    UI.text(ctx, this.names.pink, W - 150, 30, 15, COLORS.pink.dark); UI.text(ctx, String(sp), W - 150, 52, 20, COLORS.pink.dark);
    if (label) UI.text(ctx, label, W / 2, 38, 18, '#7a3f8e');
  }
}

// ---------------- 1. DUEL DE COWBOYS ----------------
class DuelGame extends MiniGame {
  constructor(o) { super(o); this.wins = { blue: 0, pink: 0 }; this.phase = 'intro'; this.shots = {}; this.msg = ''; this.loser = null; this.round = 0; }
  onStart() { if (Net.isHost) this.newRound(); }
  newRound() {
    this.round++;
    const delay = 1.6 + Math.random() * 3;
    this.send({ t: 'round', delay }); this.applyRound(delay);
  }
  applyRound(delay) { this.phase = 'ready'; this.timer = delay; this.myShot = null; this.shots = {}; this.loser = null; this.msg = ''; this.fireT = 0; }
  update(dt, input) {
    this.t += dt;
    const press = input.actionPressed;
    if (this.phase === 'ready') {
      this.timer -= dt;
      if (press && !this.myShot) { this.myShot = { early: true }; this.send({ t: 'shot', role: this.myRole, early: true }); this.onShot(this.myRole, { early: true }); }
      if (this.timer <= 0 && this.phase === 'ready') { this.phase = 'fire'; this.fireAt = performance.now(); this.fireT = 0; Sfx.play('bang'); }
    } else if (this.phase === 'fire') {
      this.fireT += dt;
      if (press && !this.myShot) { const ms = performance.now() - this.fireAt; this.myShot = { ms }; this.send({ t: 'shot', role: this.myRole, ms }); this.onShot(this.myRole, { ms }); }
      if (Net.isHost && this.fireT > 4 && !this.decided) this.decide(true);
    }
  }
  onShot(role, s) { if (!Net.isHost) return; this.shots[role] = s; this.decide(false); }
  decide(timeout) {
    if (this.phase === 'roundEnd' || this.decidedRound === this.round) return;
    const b = this.shots.blue, p = this.shots.pink;
    let w = null;
    if (b && b.early && !(p && p.early)) w = 'pink';
    else if (p && p.early && !(b && b.early)) w = 'blue';
    else if (b && p && b.early && p.early) w = 'redo';
    else if (b && p) w = b.ms <= p.ms ? 'blue' : 'pink';
    else if (timeout) w = b ? 'blue' : p ? 'pink' : 'redo';
    if (!w) return;
    this.decidedRound = this.round;
    this.send({ t: 'rres', w, shots: this.shots }); this.applyRes(w, this.shots);
    setTimeout(() => {
      if (this.wins.blue >= 2) this.end('blue'); else if (this.wins.pink >= 2) this.end('pink'); else this.newRound();
    }, 2600);
  }
  applyRes(w, shots) {
    this.phase = 'roundEnd';
    if (w === 'redo') { this.msg = 'Égalité, on recommence la manche !'; return; }
    this.wins[w]++;
    this.loser = w === 'blue' ? 'pink' : 'blue';
    const s = shots[w];
    const ls = shots[this.loser];
    this.msg = `${this.names[w]} dégaine en premier ! ` + (s && s.ms != null ? `(${Math.round(s.ms)} ms)` : '') + (ls && ls.early ? ' — faux départ de ' + this.names[this.loser] + ' !' : '');
    Sfx.play('bang');
  }
  onNet(d) {
    if (this.netBase(d)) return;
    if (d.t === 'round') this.applyRound(d.delay);
    if (d.t === 'shot') this.onShot(d.role, d);
    if (d.t === 'rres') this.applyRes(d.w, d.shots);
  }
  draw(ctx, W, H) {
    // désert pastel
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffc6dd'); g.addColorStop(0.55, '#ffe2c4'); g.addColorStop(1, '#ffd29e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(W / 2, 250, 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f7c08a'; ctx.beginPath(); ctx.moveTo(0, 420); ctx.quadraticCurveTo(240, 360, 480, 420); ctx.quadraticCurveTo(720, 470, 960, 400); ctx.lineTo(960, 640); ctx.lineTo(0, 640); ctx.fill();
    for (const [cx, s] of [[120, 1], [820, 1.2], [500, 0.7]]) { // cactus barbe à papa
      ctx.fillStyle = '#ff9fd0'; Art.roundRect(ctx, cx - 12 * s, 330 + (1 - s) * 60, 24 * s, 110 * s, 12 * s); ctx.fill();
      Art.roundRect(ctx, cx - 40 * s, 360 + (1 - s) * 60, 18 * s, 40 * s, 9 * s); ctx.fill(); Art.roundRect(ctx, cx + 22 * s, 350 + (1 - s) * 60, 18 * s, 45 * s, 9 * s); ctx.fill();
    }
    const fallB = this.loser === 'blue', fallP = this.loser === 'pink';
    Art.teddy(ctx, 240, 500, 'blue', { scale: 3.4, face: 1, outfit: Object.assign({}, this.outfits.blue, { head: 'cowboy' }), t: this.t, dead: fallB });
    Art.teddy(ctx, 720, 500, 'pink', { scale: 3.4, face: -1, outfit: Object.assign({}, this.outfits.pink, { head: 'cowboy' }), t: this.t, dead: fallP });
    this.scoreBar(ctx, W, this.wins.blue, this.wins.pink, 'Premier à 2 manches');
    if (this.phase === 'intro') { this.drawIntro(ctx, W, H); return; }
    if (this.phase === 'ready') UI.title(ctx, this.myShot && this.myShot.early ? 'Oups… trop tôt !' : 'Prêts…', W / 2, 160, 54);
    if (this.phase === 'fire') {
      UI.title(ctx, 'FEU !', W / 2, 160, 90 + Math.sin(this.t * 30) * 4);
      if (this.myShot) UI.text(ctx, `${Math.round(this.myShot.ms)} ms`, W / 2, 230, 26, '#7a3f8e');
    }
    if (this.phase === 'roundEnd') { UI.panel(ctx, 140, 120, 680, 70); UI.text(ctx, this.msg, W / 2, 155, 20, '#7a3f8e'); }
    UI.text(ctx, 'ESPACE ou clic pour tirer', W / 2, 610, 16, '#a0603a');
  }
}

// ---------------- 2. YAMS EXPRESS ----------------
const YAMS_TURNS = 3;
function yamsScore(d) {
  const c = [0, 0, 0, 0, 0, 0, 0]; d.forEach((v) => c[v]++);
  const sum = d.reduce((a, b) => a + b, 0);
  const counts = c.slice(1).sort((a, b) => b - a);
  const has = (arr) => arr.every((v) => c[v] > 0);
  const opts = [{ n: 'Chance', s: sum }];
  if (counts[0] === 5) opts.push({ n: 'YAMS !!', s: 50 });
  if (has([1, 2, 3, 4, 5]) || has([2, 3, 4, 5, 6])) opts.push({ n: 'Grande suite', s: 40 });
  if (has([1, 2, 3, 4]) || has([2, 3, 4, 5]) || has([3, 4, 5, 6])) opts.push({ n: 'Petite suite', s: 30 });
  if (counts[0] === 3 && counts[1] === 2) opts.push({ n: 'Full', s: 25 });
  if (counts[0] >= 4) { const v = c.findIndex((x, i) => i > 0 && x >= 4); opts.push({ n: 'Carré', s: 20 + v * 4 }); }
  if (counts[0] >= 3) { const v = c.findIndex((x, i) => i > 0 && x >= 3); opts.push({ n: 'Brelan', s: 10 + v * 3 }); }
  return opts.reduce((a, b) => (b.s > a.s ? b : a));
}
class YamsGame extends MiniGame {
  constructor(o) { super(o); this.scores = { blue: [], pink: [] }; this.turn = 'blue'; this.turnN = 0; this.resetDice(); this.log = ''; this.anim = 0; }
  resetDice() { this.dice = [1, 2, 3, 4, 5]; this.held = [false, false, false, false, false]; this.rolls = 0; }
  get myTurn() { return this.started && !this.result && this.turn === this.myRole; }
  roll() { const d = this.dice.map((v, i) => (this.held[i] ? v : 1 + Math.floor(Math.random() * 6))); this.send({ t: 'roll', d }); this.applyRoll(d); }
  applyRoll(d) { this.dice = d; this.rolls++; this.anim = 0.5; Sfx.play('dice'); }
  hold(i) { if (this.rolls === 0) return; this.send({ t: 'hold', i }); this.held[i] = !this.held[i]; }
  bank() { this.send({ t: 'bank' }); this.applyBank(); }
  applyBank() {
    const sc = yamsScore(this.dice);
    this.scores[this.turn].push(sc.s);
    this.log = `${this.names[this.turn]} : ${sc.n} → ${sc.s} pts`;
    if (sc.s >= 40) Sfx.play('rare');
    this.turnN++;
    this.turn = this.turn === 'blue' ? 'pink' : 'blue';
    this.resetDice();
    if (this.turnN >= YAMS_TURNS * 2 && Net.isHost) {
      const tb = this.total('blue'), tp = this.total('pink');
      setTimeout(() => this.end(tb > tp ? 'blue' : tp > tb ? 'pink' : 'tie'), 1500);
    }
  }
  total(r) { return this.scores[r].reduce((a, b) => a + b, 0); }
  update(dt) { this.t += dt; this.anim = Math.max(0, this.anim - dt); }
  onNet(d) {
    if (this.netBase(d)) return;
    if (d.t === 'roll') this.applyRoll(d.d);
    if (d.t === 'hold') this.held[d.i] = !this.held[d.i];
    if (d.t === 'bank') this.applyBank();
  }
  drawDie(ctx, x, y, v, held, s) {
    ctx.save();
    if (this.anim > 0 && !held) { ctx.translate(x + s / 2, y + s / 2); ctx.rotate(Math.sin(this.anim * 30) * 0.3); ctx.translate(-x - s / 2, -y - s / 2); }
    ctx.shadowColor = 'rgba(120,60,140,0.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    Art.roundRect(ctx, x, y - (held ? 18 : 0), s, s, 16); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = held ? 5 : 2; ctx.strokeStyle = held ? '#ff6fae' : '#e2c6f0'; ctx.stroke();
    const pip = { 1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]], 5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]] }[v];
    for (const [px, py] of pip) Art.heart(ctx, x + px * s / 4, y - (held ? 18 : 0) + py * s / 4 + 2, s / 5, v === 1 ? '#ff4f8b' : '#b07cf0');
    if (held) UI.text(ctx, 'gardé', x + s / 2, y + s - 4, 13, '#ff6fae');
    ctx.restore();
  }
  draw(ctx, W, H) {
    this.bg(ctx, W, H);
    this.scoreBar(ctx, W, this.total('blue'), this.total('pink'), `Tour ${Math.min(YAMS_TURNS, Math.floor(this.turnN / 2) + 1)} / ${YAMS_TURNS}`);
    if (!this.started) { this.drawIntro(ctx, W, H); return; }
    UI.panel(ctx, 120, 100, 720, 470);
    const who = this.turn;
    UI.text(ctx, this.result ? 'Partie terminée !' : (this.myTurn ? 'À toi de jouer !' : `Au tour de ${this.names[who]}…`), W / 2, 135, 24, COLORS[who].dark);
    const s = 96, gap = 24, x0 = W / 2 - (5 * s + 4 * gap) / 2;
    for (let i = 0; i < 5; i++) {
      const x = x0 + i * (s + gap), y = 220;
      this.drawDie(ctx, x, y, this.dice[i], this.held[i], s);
      if (this.myTurn && this.rolls > 0 && this.rolls < 3) UI.hits.push({ x, y: y - 18, w: s, h: s + 18, cb: () => this.hold(i) });
    }
    if (this.rolls > 0) { const sc = yamsScore(this.dice); UI.text(ctx, `Combo actuel : ${sc.n} (${sc.s} pts)`, W / 2, 370, 20, '#7a3f8e'); }
    if (this.myTurn) {
      UI.btn(ctx, W / 2 - 230, 410, 210, 54, `Lancer (${3 - this.rolls})`, () => this.roll(), { disabled: this.rolls >= 3 });
      UI.btn(ctx, W / 2 + 20, 410, 210, 54, 'Garder ce score', () => this.bank(), { disabled: this.rolls === 0, color: '#9b7cf0' });
    }
    if (this.log) UI.text(ctx, this.log, W / 2, 500, 18, '#a070b0');
    // historique
    UI.text(ctx, this.scores.blue.join(' · ') || '—', 230, 540, 16, COLORS.blue.dark);
    UI.text(ctx, this.scores.pink.join(' · ') || '—', W - 230, 540, 16, COLORS.pink.dark);
  }
}

// ---------------- 3. PALET SUR NUAGE ----------------
const PAL = { x: 300, y: 70, w: 360, h: 540, tx: 480, ty: 170, r: 15, start: { x: 480, y: 545 } };
class PaletGame extends MiniGame {
  constructor(o) { super(o); this.pucks = []; this.shot = 0; this.turn = 'blue'; this.moving = false; this.drag = null; this.waitSettle = false; this.final = null; }
  get myTurn() { return this.started && !this.result && !this.moving && !this.waitSettle && this.turn === this.myRole && this.shot < 6; }
  onMouseDown(x, y) {
    if (!this.myTurn) return;
    if (Math.hypot(x - PAL.start.x, y - PAL.start.y) < 40) this.drag = { x, y };
  }
  onMouseUp(x, y) {
    if (!this.drag) return;
    let vx = (PAL.start.x - x) * 4.2, vy = (PAL.start.y - y) * 4.2;
    const sp = Math.hypot(vx, vy); if (sp > 1050) { vx *= 1050 / sp; vy *= 1050 / sp; }
    this.drag = null;
    if (sp < 60) return;
    this.send({ t: 'shot', vx, vy }); this.applyShot(vx, vy, true);
  }
  applyShot(vx, vy, mine) {
    this.pucks.push({ x: PAL.start.x, y: PAL.start.y, vx, vy, role: this.turn });
    this.moving = true; this.mineShot = mine; Sfx.play('hit');
    if (!mine) this.waitSettle = true;
  }
  step(dt) {
    const P = this.pucks, r = PAL.r;
    for (const p of P) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > 0) { const ns = Math.max(0, sp - (55 + sp * 0.9) * dt); p.vx *= ns / sp; p.vy *= ns / sp; }
      if (p.x < PAL.x + r) { p.x = PAL.x + r; p.vx = Math.abs(p.vx) * 0.7; }
      if (p.x > PAL.x + PAL.w - r) { p.x = PAL.x + PAL.w - r; p.vx = -Math.abs(p.vx) * 0.7; }
      if (p.y < PAL.y + r) { p.y = PAL.y + r; p.vy = Math.abs(p.vy) * 0.7; }
      if (p.y > PAL.y + PAL.h - r) { p.y = PAL.y + PAL.h - r; p.vy = -Math.abs(p.vy) * 0.7; }
    }
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const a = P[i], b = P[j]; const dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy);
      if (d > 0 && d < 2 * r) {
        const nx = dx / d, ny = dy / d, ov = 2 * r - d;
        a.x -= nx * ov / 2; a.y -= ny * ov / 2; b.x += nx * ov / 2; b.y += ny * ov / 2;
        const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (rel > 0) { a.vx -= rel * nx * 0.95; a.vy -= rel * ny * 0.95; b.vx += rel * nx * 0.95; b.vy += rel * ny * 0.95; Sfx.play('hit'); }
      }
    }
  }
  update(dt) {
    this.t += dt;
    if (this.moving) {
      for (let k = 0; k < 4; k++) this.step(dt / 4);
      if (this.pucks.every((p) => Math.hypot(p.vx, p.vy) < 4)) {
        this.moving = false;
        this.pucks.forEach((p) => { p.vx = 0; p.vy = 0; });
        if (this.mineShot) { this.send({ t: 'settle', pucks: this.pucks.map((p) => [p.x, p.y, p.role]) }); this.nextTurn(); }
      }
    }
  }
  nextTurn() {
    this.shot++; this.waitSettle = false;
    this.turn = this.turn === 'blue' ? 'pink' : 'blue';
    if (this.shot >= 6) {
      const d = this.pucks.map((p) => ({ role: p.role, d: Math.hypot(p.x - PAL.tx, p.y - PAL.ty) })).sort((a, b) => a.d - b.d);
      const w = d[0].role, other = d.find((x) => x.role !== w);
      const pts = d.filter((x) => x.role === w && (!other || x.d < other.d)).length;
      this.final = { w, pts };
      if (Net.isHost) setTimeout(() => this.end(w), 1800);
    }
  }
  onNet(d) {
    if (this.netBase(d)) return;
    if (d.t === 'shot') this.applyShot(d.vx, d.vy, false);
    if (d.t === 'settle') { this.pucks = d.pucks.map(([x, y, role]) => ({ x, y, vx: 0, vy: 0, role })); this.moving = false; this.nextTurn(); }
  }
  draw(ctx, W, H) {
    this.bg(ctx, W, H);
    const left = { blue: 3 - Math.ceil(this.pucks.filter((p) => p.role === 'blue').length), pink: 3 - this.pucks.filter((p) => p.role === 'pink').length };
    this.scoreBar(ctx, W, `${left.blue} palet(s)`, `${left.pink} palet(s)`, '');
    // piste nuage
    ctx.save();
    ctx.shadowColor = 'rgba(150,80,160,0.3)'; ctx.shadowBlur = 20;
    Art.roundRect(ctx, PAL.x, PAL.y, PAL.w, PAL.h, 40); ctx.fillStyle = '#f4f9ff'; ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = '#d6c4f5'; ctx.lineWidth = 6; ctx.stroke();
    for (const [rr, col] of [[95, '#d9ecff'], [70, '#ffd1e6'], [45, '#e6d4ff'], [20, '#ff8fc6']]) { ctx.beginPath(); ctx.arc(PAL.tx, PAL.ty, rr, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); }
    Art.heart(ctx, PAL.tx, PAL.ty + 2, 22, '#fff');
    ctx.setLineDash([8, 8]); ctx.strokeStyle = '#e2c6f0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(PAL.x + 20, 480); ctx.lineTo(PAL.x + PAL.w - 20, 480); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    for (const p of this.pucks) this.drawPuck(ctx, p.x, p.y, p.role);
    if (!this.started) { this.drawIntro(ctx, W, H); return; }
    if (this.shot < 6 && !this.moving && !this.waitSettle) {
      this.drawPuck(ctx, PAL.start.x, PAL.start.y, this.turn, 0.85);
      if (this.drag && UI.mx >= 0) {
        ctx.save(); ctx.strokeStyle = COLORS[this.turn].dark; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
        const ex = PAL.start.x + (PAL.start.x - UI.mx) * 0.6, ey = PAL.start.y + (PAL.start.y - UI.my) * 0.6;
        ctx.beginPath(); ctx.moveTo(PAL.start.x, PAL.start.y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.restore();
      }
    }
    let txt = this.final ? `${this.names[this.final.w]} gagne avec ${this.final.pts} palet(s) au plus près !` : this.myTurn ? 'À toi ! Clique sur ton palet et tire en arrière' : this.moving ? 'Ça glisse…' : `Au tour de ${this.names[this.turn]}…`;
    UI.panel(ctx, 680, 260, 260, 120, 0.85); UI.wrap(ctx, txt, 810, 300, 230, 24, 17, '#7a3f8e');
  }
  drawPuck(ctx, x, y, role, a) {
    ctx.save(); ctx.globalAlpha = a || 1;
    ctx.beginPath(); ctx.arc(x, y + 3, PAL.r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(80,40,100,0.2)'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, PAL.r, 0, Math.PI * 2); ctx.fillStyle = COLORS[role].main; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = COLORS[role].light; ctx.fill();
    ctx.restore();
  }
}

// ---------------- 4. QUI EST-CE ? ----------------
const QE_NAMES = ['Mimi', 'Pompom', 'Caramel', 'Guimauve', 'Biscotte', 'Choupette', 'Nuage', 'Praline', 'Câlin', 'Paillette', 'Moka', 'Bonbon', 'Cookie', 'Vanille', 'Myrtille', 'Chamallow'];
const QE_ANIMALS = ['nounours', 'licorne', 'chat', 'lapin'];
const QE_COLORS = [['rose', '#ffb3d4'], ['bleu', '#a9d4ff'], ['menthe', '#b4f0c8'], ['lilas', '#d8c2ff']];
const QE_QUESTIONS = [
  ['C\'est un nounours ?', (c) => c.animal === 'nounours'], ['C\'est une licorne ?', (c) => c.animal === 'licorne'],
  ['C\'est un chat ?', (c) => c.animal === 'chat'], ['C\'est un lapin ?', (c) => c.animal === 'lapin'],
  ['Il est rose ?', (c) => c.color === 0], ['Il est bleu ?', (c) => c.color === 1], ['Il est menthe ?', (c) => c.color === 2], ['Il est lilas ?', (c) => c.color === 3],
  ['Il a un chapeau ?', (c) => c.hat], ['Il a des lunettes ?', (c) => c.glasses], ['Il a un nœud ?', (c) => c.bow],
];
class QuiEstCeGame extends MiniGame {
  constructor(o) { super(o); this.turn = 'blue'; this.elim = []; this.guessMode = false; this.log = []; this.chars = []; }
  startData() {
    const seed = Math.floor(Math.random() * 1e9);
    const sb = Math.floor(Math.random() * 16); let sp = Math.floor(Math.random() * 16); if (sp === sb) sp = (sp + 5) % 16;
    return { seed, secret: { blue: sb, pink: sp } };
  }
  onStart(d) {
    const R = rng(d.seed);
    const names = QE_NAMES.slice().sort(() => R() - 0.5);
    this.chars = [];
    for (let i = 0; i < 16; i++) this.chars.push({ name: names[i], animal: QE_ANIMALS[i % 4], color: Math.floor(R() * 4), hat: R() < 0.4, glasses: R() < 0.4, bow: R() < 0.4 });
    for (let i = 15; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [this.chars[i], this.chars[j]] = [this.chars[j], this.chars[i]]; }
    this.secret = d.secret; this.elim = new Array(16).fill(false);
  }
  get myTurn() { return this.started && !this.result && this.turn === this.myRole; }
  ask(qi) {
    const target = this.chars[this.secret[this.otherRole]];
    const ans = QE_QUESTIONS[qi][1](target);
    this.chars.forEach((c, i) => { if (QE_QUESTIONS[qi][1](c) !== ans) this.elim[i] = true; });
    this.send({ t: 'ask', qi, ans }); this.addLog(this.myRole, qi, ans);
    this.turn = this.otherRole;
  }
  addLog(role, qi, ans) { this.log.unshift({ role, txt: `${QE_QUESTIONS[qi][0]} → ${ans ? 'OUI' : 'NON'}` }); this.log = this.log.slice(0, 4); }
  guess(i) {
    const ok = i === this.secret[this.otherRole];
    this.guessMode = false;
    this.send({ t: 'guess', i, ok, role: this.myRole }); this.onGuess(this.myRole, i, ok);
  }
  onGuess(role, i, ok) {
    this.log.unshift({ role, txt: `Devine : ${this.chars[i].name} → ${ok ? 'GAGNÉ !' : 'raté…'}` });
    this.reveal = true;
    if (Net.isHost) setTimeout(() => this.end(ok ? role : (role === 'blue' ? 'pink' : 'blue')), 2200);
  }
  update(dt) { this.t += dt; }
  onNet(d) {
    if (this.netBase(d)) return;
    if (d.t === 'ask') { this.addLog(this.otherRole, d.qi, d.ans); this.turn = this.myRole; }
    if (d.t === 'guess') this.onGuess(d.role, d.i, d.ok);
  }
  drawChar(ctx, c, x, y, s) {
    const col = QE_COLORS[c.color][1], dark = 'rgba(90,60,110,0.6)';
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineWidth = 1.5; ctx.strokeStyle = dark; ctx.fillStyle = col;
    const E = (ex, ey, rx, ry, f) => { ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = f || col; ctx.fill(); ctx.stroke(); };
    if (c.animal === 'nounours') { E(-13, -14, 7, 7); E(13, -14, 7, 7); }
    if (c.animal === 'chat') { for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 6, -14); ctx.lineTo(sd * 16, -26); ctx.lineTo(sd * 18, -8); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
    if (c.animal === 'lapin') { E(-7, -26, 5, 14); E(7, -26, 5, 14); }
    E(0, 0, 20, 18);
    if (c.animal === 'licorne') {
      ctx.beginPath(); ctx.moveTo(-4, -16); ctx.lineTo(0, -36); ctx.lineTo(4, -16); ctx.closePath(); ctx.fillStyle = '#ffe98a'; ctx.fill(); ctx.stroke();
      ['#ff9fd0', '#ffd98a', '#a8ecb0', '#8fd3ff'].forEach((m, i) => { ctx.beginPath(); ctx.arc(-16 + i * 2, -10 + i * 6, 5, 0, Math.PI * 2); ctx.fillStyle = m; ctx.fill(); });
    }
    if (c.animal === 'chat') { ctx.strokeStyle = dark; ctx.lineWidth = 1; for (const sd of [-1, 1]) for (const k of [-2, 2]) { ctx.beginPath(); ctx.moveTo(sd * 8, 5); ctx.lineTo(sd * 22, 5 + k * 2); ctx.stroke(); } }
    ctx.fillStyle = '#3a2a35';
    ctx.beginPath(); ctx.arc(-7, -2, 2.5, 0, Math.PI * 2); ctx.arc(7, -2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 5, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,120,160,0.5)'; ctx.beginPath(); ctx.ellipse(-12, 6, 3.5, 2, 0, 0, Math.PI * 2); ctx.ellipse(12, 6, 3.5, 2, 0, 0, Math.PI * 2); ctx.fill();
    if (c.glasses) { ctx.strokeStyle = '#2b2b3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-7, -2, 6, 0, Math.PI * 2); ctx.moveTo(13, -2); ctx.arc(7, -2, 6, 0, Math.PI * 2); ctx.moveTo(-1, -2); ctx.lineTo(1, -2); ctx.stroke(); }
    if (c.bow) { ctx.fillStyle = '#ff4f8b'; ctx.beginPath(); ctx.moveTo(10, 14); ctx.lineTo(3, 9); ctx.lineTo(3, 19); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(10, 14); ctx.lineTo(17, 9); ctx.lineTo(17, 19); ctx.closePath(); ctx.fill(); }
    if (c.hat) { ctx.fillStyle = '#6b5bd6'; ctx.fillRect(-14, -24, 28, 4); Art.roundRect(ctx, -9, -38, 18, 15, 3); ctx.fill(); ctx.fillStyle = '#ff9fd0'; ctx.fillRect(-9, -27, 18, 3); }
    ctx.restore();
  }
  draw(ctx, W, H) {
    this.bg(ctx, W, H);
    if (!this.started) { this.scoreBar(ctx, W, '', '', ''); this.drawIntro(ctx, W, H); return; }
    // plateau
    const cw = 118, chh = 134, x0 = 24, y0 = 24;
    this.chars.forEach((c, i) => {
      const x = x0 + (i % 4) * (cw + 10), y = y0 + Math.floor(i / 4) * (chh + 14);
      ctx.save();
      Art.roundRect(ctx, x, y, cw, chh, 14); ctx.fillStyle = this.elim[i] ? '#e6dff0' : '#fff'; ctx.fill();
      ctx.strokeStyle = this.guessMode && !this.elim[i] ? '#ff6fae' : '#e2c6f0'; ctx.lineWidth = this.guessMode && !this.elim[i] ? 4 : 2; ctx.stroke();
      ctx.globalAlpha = this.elim[i] ? 0.25 : 1;
      this.drawChar(ctx, c, x + cw / 2, y + 66, 1.6);
      UI.text(ctx, c.name, x + cw / 2, y + chh - 14, 15, '#7a3f8e');
      ctx.restore();
      if (this.elim[i]) { ctx.save(); ctx.strokeStyle = 'rgba(200,80,140,0.5)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 15, y + 15); ctx.lineTo(x + cw - 15, y + chh - 15); ctx.stroke(); ctx.restore(); }
      if (this.myTurn && this.guessMode && !this.elim[i]) UI.hits.push({ x, y, w: cw, h: chh, cb: () => this.guess(i) });
    });
    // panneau droit
    const px = 552;
    UI.panel(ctx, px, 16, 392, 608, 0.9);
    UI.text(ctx, 'Ton personnage secret', px + 110, 44, 16, COLORS[this.myRole].dark);
    const me = this.chars[this.secret[this.myRole]];
    Art.roundRect(ctx, px + 50, 60, 120, 120, 14); ctx.fillStyle = '#fff6fb'; ctx.fill();
    this.drawChar(ctx, me, px + 110, 125, 1.5); UI.text(ctx, me.name, px + 110, 168, 15, '#7a3f8e');
    UI.text(ctx, this.result ? 'Fin !' : this.myTurn ? 'À toi !' : `Tour de ${this.names[this.turn]}`, px + 290, 80, 20, COLORS[this.turn].dark);
    if (this.reveal) { const ot = this.chars[this.secret[this.otherRole]]; UI.text(ctx, `Son perso : ${ot.name}`, px + 290, 130, 15, '#7a3f8e'); }
    if (this.myTurn) {
      QE_QUESTIONS.forEach((q, i) => {
        const bx = px + 14 + (i % 2) * 186, by = 196 + Math.floor(i / 2) * 44;
        UI.btn(ctx, bx, by, 178, 36, q[0], () => this.ask(i), { size: 14, color: '#b9a0f5', disabled: this.guessMode });
      });
      UI.btn(ctx, px + 70, 466, 250, 44, this.guessMode ? 'Annuler' : 'Je devine ! (clique une carte)', () => { this.guessMode = !this.guessMode; }, { size: 15, color: this.guessMode ? '#c0a0d0' : '#ff6fae' });
    }
    this.log.forEach((l, i) => UI.text(ctx, `${this.names[l.role]} : ${l.txt}`, px + 196, 534 + i * 22, 14, COLORS[l.role].dark));
  }
}

// ---------------- 5. AIR HOCKEY ----------------
const HK = { x: 300, y: 78, w: 360, h: 545, goal: 130, pr: 14, kr: 26 };
class HockeyGame extends MiniGame {
  constructor(o) {
    super(o);
    const cx = HK.x + HK.w / 2;
    this.puck = { x: cx, y: HK.y + HK.h / 2, vx: 0, vy: 0 };
    this.hp = { x: cx, y: HK.y + HK.h - 70, px: cx, py: HK.y + HK.h - 70 };
    this.cp = { x: cx, y: HK.y + 70, px: cx, py: HK.y + 70 };
    this.score = [0, 0]; this.sendAcc = 0; this.pause = 1; this.flash = '';
    this.hostRole = Net.isHost ? this.myRole : this.otherRole;
  }
  flip(x, y) { return { x: 2 * (HK.x + HK.w / 2) - x, y: 2 * (HK.y + HK.h / 2) - y }; }
  clampPad(p, top) {
    p.x = Math.max(HK.x + HK.kr, Math.min(HK.x + HK.w - HK.kr, p.x));
    const mid = HK.y + HK.h / 2;
    if (top) p.y = Math.max(HK.y + HK.kr, Math.min(mid - HK.kr, p.y));
    else p.y = Math.max(mid + HK.kr, Math.min(HK.y + HK.h - HK.kr, p.y));
  }
  update(dt) {
    this.t += dt;
    if (!this.started || this.result) return;
    if (UI.mx >= 0) {
      if (Net.isHost) { this.hp.x = UI.mx; this.hp.y = UI.my; this.clampPad(this.hp, false); }
      else { const f = this.flip(UI.mx, UI.my); this.cp.x = f.x; this.cp.y = f.y; this.clampPad(this.cp, true); }
    }
    this.sendAcc += dt;
    if (!Net.isHost) { if (this.sendAcc > 1 / 40) { this.sendAcc = 0; this.send({ t: 'pad', x: this.cp.x, y: this.cp.y }); } return; }
    // simulation (hôte)
    if (this.pause > 0 || Math.max(this.score[0], this.score[1]) >= 5) { this.pause -= dt; }
    else {
      const n = 6, h = dt / n, P = this.puck;
      for (let k = 0; k < n; k++) {
        P.x += P.vx * h; P.y += P.vy * h;
        P.vx *= 1 - 0.25 * h; P.vy *= 1 - 0.25 * h;
        if (P.x < HK.x + HK.pr) { P.x = HK.x + HK.pr; P.vx = Math.abs(P.vx) * 0.9; Sfx.play('hit'); }
        if (P.x > HK.x + HK.w - HK.pr) { P.x = HK.x + HK.w - HK.pr; P.vx = -Math.abs(P.vx) * 0.9; Sfx.play('hit'); }
        const inGoal = Math.abs(P.x - (HK.x + HK.w / 2)) < HK.goal / 2;
        if (P.y < HK.y + HK.pr) { if (inGoal) { this.goal(0); break; } P.y = HK.y + HK.pr; P.vy = Math.abs(P.vy) * 0.9; Sfx.play('hit'); }
        if (P.y > HK.y + HK.h - HK.pr) { if (inGoal) { this.goal(1); break; } P.y = HK.y + HK.h - HK.pr; P.vy = -Math.abs(P.vy) * 0.9; Sfx.play('hit'); }
        for (const pd of [this.hp, this.cp]) {
          const dx = P.x - pd.x, dy = P.y - pd.y, d = Math.hypot(dx, dy), min = HK.pr + HK.kr;
          if (d < min && d > 0) {
            const nx = dx / d, ny = dy / d;
            P.x = pd.x + nx * min; P.y = pd.y + ny * min;
            const pvx = (pd.x - pd.px) / dt, pvy = (pd.y - pd.py) / dt;
            const rel = (P.vx - pvx) * nx + (P.vy - pvy) * ny;
            if (rel < 0) { P.vx -= 1.9 * rel * nx; P.vy -= 1.9 * rel * ny; Sfx.play('hit'); }
            P.vx += pvx * 0.15; P.vy += pvy * 0.15;
          }
        }
        const sp = Math.hypot(P.vx, P.vy); if (sp > 1100) { P.vx *= 1100 / sp; P.vy *= 1100 / sp; }
      }
    }
    this.hp.px = this.hp.x; this.hp.py = this.hp.y; this.cp.px = this.cp.x; this.cp.py = this.cp.y;
    if (this.sendAcc > 1 / 40) { this.sendAcc = 0; this.send({ t: 'st', p: [this.puck.x, this.puck.y], h: [this.hp.x, this.hp.y], s: this.score }); }
  }
  goal(side) {
    // side 0 : but en haut (camp de l'invité) → point pour l'hôte
    if (side === 0) this.score[0]++; else this.score[1]++;
    const scorer = side === 0 ? this.hostRole : (this.hostRole === 'blue' ? 'pink' : 'blue');
    this.send({ t: 'goal', who: scorer }); this.onGoal(scorer);
    const cx = HK.x + HK.w / 2;
    this.puck = { x: cx, y: HK.y + HK.h / 2 + (side === 0 ? -60 : 60), vx: 0, vy: 0 };
    this.pause = 1.2;
    if (this.score[0] >= 5) setTimeout(() => this.end(this.hostRole), 800);
    if (this.score[1] >= 5) setTimeout(() => this.end(this.hostRole === 'blue' ? 'pink' : 'blue'), 800);
  }
  onGoal(who) { this.flash = `BUUUT de ${this.names[who]} !`; this.flashT = 1.5; Sfx.play(who === this.myRole ? 'rare' : 'lose'); }
  onNet(d) {
    if (this.netBase(d)) return;
    if (d.t === 'pad' && Net.isHost) { this.cp.x = d.x; this.cp.y = d.y; this.clampPad(this.cp, true); }
    if (d.t === 'st' && !Net.isHost) { this.puck.x = d.p[0]; this.puck.y = d.p[1]; this.hp.x = d.h[0]; this.hp.y = d.h[1]; this.score = d.s; }
    if (d.t === 'goal') this.onGoal(d.who);
  }
  draw(ctx, W, H) {
    this.bg(ctx, W, H);
    const sc = {}; sc[this.hostRole] = this.score[0]; sc[this.hostRole === 'blue' ? 'pink' : 'blue'] = this.score[1];
    this.scoreBar(ctx, W, sc.blue, sc.pink, 'Premier à 5');
    ctx.save();
    ctx.shadowColor = 'rgba(150,80,160,0.3)'; ctx.shadowBlur = 20;
    Art.roundRect(ctx, HK.x, HK.y, HK.w, HK.h, 30); ctx.fillStyle = '#f7fbff'; ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = '#d6c4f5'; ctx.lineWidth = 8; ctx.stroke();
    ctx.strokeStyle = '#ffc2e2'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(HK.x, HK.y + HK.h / 2); ctx.lineTo(HK.x + HK.w, HK.y + HK.h / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(HK.x + HK.w / 2, HK.y + HK.h / 2, 50, 0, Math.PI * 2); ctx.stroke();
    Art.heart(ctx, HK.x + HK.w / 2, HK.y + HK.h / 2 + 2, 30, 'rgba(255,150,200,0.5)');
    // buts (en bas = le mien)
    const myCol = COLORS[this.myRole].main, otCol = COLORS[this.otherRole].main;
    ctx.fillStyle = otCol; ctx.fillRect(HK.x + HK.w / 2 - HK.goal / 2, HK.y - 4, HK.goal, 8);
    ctx.fillStyle = myCol; ctx.fillRect(HK.x + HK.w / 2 - HK.goal / 2, HK.y + HK.h - 4, HK.goal, 8);
    ctx.restore();
    const view = (x, y) => (Net.isHost ? { x, y } : this.flip(x, y));
    const mine = Net.isHost ? this.hp : this.cp, theirs = Net.isHost ? this.cp : this.hp;
    const pk = view(this.puck.x, this.puck.y), m = view(mine.x, mine.y), o = view(theirs.x, theirs.y);
    const pad = (p, role) => {
      ctx.beginPath(); ctx.arc(p.x, p.y + 4, HK.kr, 0, Math.PI * 2); ctx.fillStyle = 'rgba(80,40,100,0.2)'; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, HK.kr, 0, Math.PI * 2); ctx.fillStyle = COLORS[role].main; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fillStyle = COLORS[role].dark; ctx.fill();
    };
    pad(o, this.otherRole); pad(m, this.myRole);
    ctx.beginPath(); ctx.arc(pk.x, pk.y, HK.pr, 0, Math.PI * 2); ctx.fillStyle = '#ffd34d'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    Art.sparkle(ctx, pk.x, pk.y, 7, '#fff');
    if (this.flashT > 0) { this.flashT -= 1 / 60; UI.title(ctx, this.flash, W / 2, H / 2, 40); }
    if (!this.started) this.drawIntro(ctx, W, H);
  }
}

const MG_CLASSES = [DuelGame, YamsGame, PaletGame, QuiEstCeGame, HockeyGame];
