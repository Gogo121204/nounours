// Moteur de plateforme coopératif
const T = 32, PW = 20, PH = 26;
const SPEED = 210, ACC = 1500, DEC = 1900, AIR_ACC = 1050, AIR_DEC = 350, JUMP = 545, HOLD_TIME = 0.16, HOLD_GRAV = 0.5, CUT_VY = 240, GRAV = 1800, MAXFALL = 820, BOUNCE = 930;
const DEADLY = { blue: 'fc', pink: 'gc' };
const ITEM_ROLE = { b: 'blue', a: 'blue', p: 'pink', r: 'pink', s: 'both' };
const SOLID_CH = '#fgcJ';
const isSlope = (ch) => ch === '/' || ch === '\\';

function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

class Level {
  constructor(def, opts) {
    this.def = def;
    this.myRole = opts.myRole;
    this.otherRole = opts.myRole === 'blue' ? 'pink' : 'blue';
    this.names = opts.names;
    this.outfits = opts.outfits;
    this.onEvent = opts.onEvent;
    this.grid = def.grid;
    this.GW = this.grid[0].length; this.GH = this.grid.length;
    this.tiles = Art.tileLayer(this.grid, T);
    this.pools = []; this.bounces = []; this.fakes = [];
    // caméra : dézoom automatique pour les grandes cartes
    this.scale = Math.min(1, 960 / (this.GW * T), 640 / (this.GH * T));
    this.ox = (960 - this.GW * T * this.scale) / 2; this.oy = (640 - this.GH * T * this.scale) / 2;
    if (this.scale < 1) this.oy = Math.max(this.oy, Math.min(30, 640 - this.GH * T * this.scale));
    for (let y = 0; y < this.GH; y++) for (let x = 0; x < this.GW; x++) {
      const ch = this.grid[y][x];
      if ('fgc'.includes(ch)) this.pools.push({ x, y, k: ch, l: !'fgc'.includes(this.grid[y][x - 1]), r: !'fgc'.includes(this.grid[y][x + 1]) });
      if (ch === 'J') this.bounces.push({ x, y, sq: 0 });
      if (ch === 'w') this.fakes.push({ x, y, seen: false });
    }
    // portée des tirs des tourelles (jusqu'au premier mur)
    this.turrets = (def.turrets || []).map((tu) => {
      const d = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] }[tu.dir];
      const mx = tu.x * T + 16 + d[0] * 18, my = tu.y * T + 16 + d[1] * 18;
      let dist = 0;
      while (dist < 2000) { const px = mx + d[0] * dist, py = my + d[1] * dist; const tx = Math.floor(px / T), ty = Math.floor(py / T); if (this.solidStatic(tx, ty)) break; dist += 4; }
      return { ...tu, d, mx, my, range: dist, speed: tu.speed || 170, period: tu.period || 2, offset: tu.offset || 0 };
    });
    this.gt = 0; // temps global (animations)
    this.sendAcc = 0; this.syncAcc = 0;
    this.particles = [];
    this.bubbles = { blue: null, pink: null };
    this.other = { x: 0, y: 0, tx: 0, ty: 0, face: 1, walk: 0, air: false, dead: false, seen: false };
    this.reset(true);
  }

  reset(first) {
    const d = this.def;
    this.t = 0; this.dying = 0; this.doneTimer = 0; this.done = false;
    this.items = []; this.doors = {}; this.spawns = {};
    let id = 0, bi = 0, pi = 0;
    for (let y = 0; y < this.GH; y++) for (let x = 0; x < this.GW; x++) {
      const ch = this.grid[y][x];
      if ('bpars'.includes(ch)) {
        let sub;
        if (ch === 'b') sub = BLUE_ITEMS[(bi++ + d.index) % BLUE_ITEMS.length];
        else if (ch === 'p') sub = PINK_ITEMS[(pi++ + d.index) % PINK_ITEMS.length];
        else if (ch === 's') sub = 'star';
        else sub = ch === 'a' ? 'plane' : 'ring';
        this.items.push({ id: id++, ch, role: ITEM_ROLE[ch], sub, rare: ch === 'a' || ch === 'r', star: ch === 's', cx: x * T + 16, cy: y * T + 16, taken: false });
      }
      if (ch === 'D') this.doors.blue = { x: x * T, y: (y - 1) * T, w: T, h: 2 * T };
      if (ch === 'E') this.doors.pink = { x: x * T, y: (y - 1) * T, w: T, h: 2 * T };
      if (ch === '1') this.spawns.blue = { x: x * T + (T - PW) / 2, y: (y + 1) * T - PH };
      if (ch === '2') this.spawns.pink = { x: x * T + (T - PW) / 2, y: (y + 1) * T - PH };
    }
    this.levers = (d.levers || []).map((l) => ({ ...l, on: false }));
    this.buttons = (d.buttons || []).map((b) => ({ ...b, pressed: false, until: -1 }));
    this.fragiles = [];
    for (let y = 0; y < this.GH; y++) for (let x = 0; x < this.GW; x++) if (this.grid[y][x] === 'x') this.fragiles.push({ x, y, state: 'ok', timer: 0 });
    this.fragMap = {}; for (const f of this.fragiles) this.fragMap[f.y * this.GW + f.x] = f;
    for (const f of this.fakes) f.seen = false;
    this.mobs = (d.mobs || []).map((m) => ({ ...m, px: m.x * T, py: m.y * T }));
    this.platforms = (d.platforms || []).map((p) => ({
      x0: p.x * T, y0: p.y * T, w: p.w * T, h: p.h * T, dx: p.dx * T, dy: p.dy * T, on: p.on, vanish: !!p.vanish, invert: !!p.invert,
      p: p.invert ? 1 : 0, x: p.x * T + (p.invert ? p.dx * T : 0), y: p.y * T + (p.invert ? p.dy * T : 0), prevx: p.x * T, prevy: p.y * T, color: TRIGGER_COLORS[p.on[0] % TRIGGER_COLORS.length], solid: true,
    }));
    this.unicorns = (d.unicorns || []).map((u) => ({
      x0: u.x * T, y0: u.y * T, w: u.w * T, dx: u.dx * T, dy: u.dy * T, period: u.period,
      x: u.x * T, y: u.y * T, prevx: u.x * T, prevy: u.y * T, dir: u.dx >= 0 ? 1 : -1,
    }));
    const sp = this.spawns[this.myRole];
    this.me = { x: sp.x, y: sp.y, vx: 0, vy: 0, onGround: false, ground: null, face: 1, walk: 0, coyote: 0, jumpBuf: 0, dead: false };
    const so = this.spawns[this.otherRole];
    Object.assign(this.other, { x: so.x, y: so.y, tx: so.x, ty: so.y, dead: false });
    this.hintTimer = first ? 6 : 0;
  }

  active(id) {
    return this.buttons.some((b) => b.id === id && (b.pressed || b.until > this.t)) || this.levers.some((l) => l.id === id && l.on);
  }

  solidTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.GW || ty >= this.GH) return true;
    const ch = this.grid[ty][tx];
    if (ch === 'x') return this.fragMap[ty * this.GW + tx].state !== 'gone';
    return SOLID_CH.includes(ch);
  }
  solidStatic(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.GW || ty >= this.GH) return true;
    const ch = this.grid[ty][tx];
    return SOLID_CH.includes(ch) || isSlope(ch);
  }
  tileAt(tx, ty) { return (ty >= 0 && ty < this.GH && tx >= 0 && tx < this.GW) ? this.grid[ty][tx] : '#'; }
  // hauteur du sol d'une pente à l'abscisse px
  slopeY(tx, ty, px) {
    const lx = Math.max(0, Math.min(T, px - tx * T));
    return this.grid[ty][tx] === '/' ? ty * T + (T - lx) : ty * T + lx;
  }
  mobPos(m) {
    const ph = ((this.t + (m.offset || 0)) / m.period) % 1, tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
    return { x: m.px + (m.dx || 0) * T * tri, y: m.py + (m.dy || 0) * T * tri, dir: ph < 0.5 ? 1 : -1 };
  }
  shots() {
    const out = [];
    for (const tu of this.turrets) {
      const life = tu.range / tu.speed;
      const kmax = Math.floor((this.t - tu.offset) / tu.period);
      for (let k = Math.max(0, Math.floor((this.t - tu.offset - life) / tu.period)); k <= kmax; k++) {
        const dist = (this.t - (tu.offset + k * tu.period)) * tu.speed;
        if (dist >= 0 && dist <= tu.range) out.push({ x: tu.mx + tu.d[0] * dist, y: tu.my + tu.d[1] * dist, tu });
      }
    }
    return out;
  }

  // Liste des rectangles solides qui touchent r
  solidsAt(r) {
    const out = [];
    const x1 = Math.floor(r.x / T), x2 = Math.floor((r.x + r.w - 0.01) / T);
    const y1 = Math.floor(r.y / T), y2 = Math.floor((r.y + r.h - 0.01) / T);
    for (let ty = y1; ty <= y2; ty++) for (let tx = x1; tx <= x2; tx++) {
      if (this.solidTile(tx, ty)) out.push({ x: tx * T, y: ty * T, w: T, h: T, tile: true, tx, ty });
    }
    for (const p of this.platforms) if (p.solid && overlap(r, p)) out.push(p);
    return out;
  }

  playerRect(o) { return { x: o.x, y: o.y, w: PW, h: PH }; }

  update(dt, input) {
    this.gt += dt;
    if (this.hintTimer > 0) this.hintTimer -= dt;
    this.updateParticles(dt);
    for (const b of this.bounces) b.sq = Math.max(0, b.sq - dt * 4);
    // autre joueur : interpolation
    const o = this.other;
    const k = Math.min(1, dt * 18);
    if (Math.abs(o.tx - o.x) > 120 || Math.abs(o.ty - o.y) > 120) { o.x = o.tx; o.y = o.ty; }
    o.x += (o.tx - o.x) * k; o.y += (o.ty - o.y) * k;

    if (this.done) return;
    if (this.dying > 0) {
      this.dying -= dt;
      if (this.dying <= 0) this.reset(false);
      return;
    }
    this.t += dt;
    const me = this.me;
    const mr = this.playerRect(me), or = this.playerRect(o);

    // boutons
    for (const b of this.buttons) {
      const br = { x: b.x * T + 3, y: b.y * T + 20, w: 26, h: 12 };
      const was = b.pressed;
      b.pressed = overlap(mr, br) || overlap(or, br);
      if (b.pressed && !was) { Sfx.play('press'); if (b.timer) b.until = this.t + b.timer; }
      if (b.timer && b.pressed) b.until = this.t + b.timer;
    }
    // nuages fragiles : tremblent quand quelqu'un est dessus, disparaissent, puis reviennent
    for (const f of this.fragiles) {
      const fr = { x: f.x * T, y: f.y * T - 3, w: T, h: 5 };
      const on = (r) => r.x + PW - 3 > fr.x && r.x + 3 < fr.x + T && Math.abs(r.y + PH - f.y * T) < 3;
      if (f.state === 'ok' && (on(mr) || on(or))) { f.state = 'shake'; f.timer = 0.65; Sfx.play('crack'); }
      else if (f.state === 'shake') { f.timer -= dt; if (f.timer <= 0) { f.state = 'gone'; f.timer = 2.6; Sfx.play('poof'); } }
      else if (f.state === 'gone') { f.timer -= dt; if (f.timer <= 0 && !overlap(mr, { x: f.x * T, y: f.y * T, w: T, h: T }) && !overlap(or, { x: f.x * T, y: f.y * T, w: T, h: T })) f.state = 'ok'; }
    }
    // plateformes mobiles
    for (const p of this.platforms) {
      p.prevx = p.x; p.prevy = p.y;
      const target = (p.on.some((id) => this.active(id)) !== p.invert) ? 1 : 0;
      const dist = Math.max(1, Math.hypot(p.dx, p.dy) / T);
      const sp = p.vanish ? 2.5 : 2.6 / dist;
      if (p.p < target) p.p = Math.min(target, p.p + sp * dt);
      if (p.p > target) p.p = Math.max(target, p.p - sp * dt);
      p.x = p.x0 + p.dx * p.p; p.y = p.y0 + p.dy * p.p;
      p.solid = !(p.vanish && p.p > 0.5);
    }
    // licornes
    for (const u of this.unicorns) {
      u.prevx = u.x; u.prevy = u.y;
      const f = 0.5 - 0.5 * Math.cos((2 * Math.PI * this.t) / u.period);
      u.x = u.x0 + u.dx * f; u.y = u.y0 + u.dy * f;
      if (u.dx) u.dir = Math.sin((2 * Math.PI * this.t) / u.period) >= 0 ? 1 : -1;
    }

    this.movePlayer(dt, input);
    if (this.dying > 0) return;
    // passages secrets : le faux mur devient transparent quand on passe dedans
    for (const f of this.fakes) if (!f.seen) {
      const fr = { x: f.x * T, y: f.y * T, w: T, h: T };
      if (overlap(this.playerRect(me), fr) || overlap(or, fr)) { f.seen = true; Sfx.play('secret'); }
    }
    // ennemis : un contact = on recommence
    const hit = { x: me.x + 3, y: me.y + 3, w: PW - 6, h: PH - 5 };
    for (const m of this.mobs) { const p = this.mobPos(m); if (overlap(hit, { x: p.x + 4, y: p.y + 10, w: 24, h: 22 })) { this.die(true); return; } }
    for (const s of this.shots()) if (overlap(hit, { x: s.x - 6, y: s.y - 6, w: 12, h: 12 })) { this.die(true); return; }

    // objets
    const mr2 = this.playerRect(me);
    for (const it of this.items) {
      if (it.taken || (it.role !== this.myRole && it.role !== 'both')) continue;
      if (overlap(mr2, { x: it.cx - 11, y: it.cy - 11, w: 22, h: 22 })) {
        this.takeItem(it.id); Net.send('collect', { id: it.id });
      }
    }
    // leviers
    if (input.downPressed) {
      for (const l of this.levers) {
        if (overlap(mr2, { x: l.x * T, y: l.y * T, w: T, h: T })) {
          const nv = !l.on; for (const l2 of this.levers) if (l2.id === l.id) l2.on = nv;
          Sfx.play('lever'); Net.send('lever', { id: l.id, on: nv });
        }
      }
    }
    // émotes
    if (input.emote != null) this.emote(this.myRole, input.emote, true);

    // portes (l'hôte arbitre)
    const myD = this.doors[this.myRole], cxm = mr2.x + PW / 2, cym = mr2.y + PH / 2;
    const inMine = cxm > myD.x && cxm < myD.x + myD.w && cym > myD.y && cym < myD.y + myD.h;
    if (inMine && !this.wasInDoor) Sfx.play('door');
    this.wasInDoor = inMine;
    if (Net.isHost) {
      const inDoor = (pr, role) => { const d = this.doors[role]; const cx = pr.x + PW / 2, cy = pr.y + PH / 2; return cx > d.x && cx < d.x + d.w && cy > d.y && cy < d.y + d.h; };
      if (inDoor(mr2, this.myRole) && inDoor(or, this.otherRole) && !o.dead) {
        this.doneTimer += dt;
        if (this.doneTimer > 0.5) {
          const info = { time: this.t, taken: this.items.filter((i) => i.taken).map((i) => i.id) };
          Net.send('complete', info); this.complete(info);
        }
      } else this.doneTimer = 0;
    }

    // envoi réseau
    this.sendAcc += dt;
    if (this.sendAcc > 1 / 30) {
      this.sendAcc = 0;
      Net.send('st', { x: Math.round(me.x * 10) / 10, y: Math.round(me.y * 10) / 10, f: me.face, w: Math.round(me.walk * 10) / 10, a: !me.onGround, d: me.dead });
    }
    if (Net.isHost) {
      this.syncAcc += dt;
      if (this.syncAcc > 1.5) { this.syncAcc = 0; Net.send('tsync', { t: this.t }); }
    }
  }

  movePlayer(dt, input) {
    const me = this.me;
    // transporté par une plateforme / licorne
    if (me.ground) { me.x += me.ground.x - me.ground.prevx; me.y += me.ground.y - me.ground.prevy; }
    // éjection si une plateforme nous chevauche
    for (const p of this.platforms) {
      if (!p.solid) continue;
      const r = this.playerRect(me);
      if (overlap(r, p)) {
        const pushUp = r.y + PH - p.y, pushDown = p.y + p.h - r.y, pushL = r.x + PW - p.x, pushR = p.x + p.w - r.x;
        const m = Math.min(pushUp, pushDown, pushL, pushR);
        if (m === pushUp) { me.y = p.y - PH; me.vy = Math.min(me.vy, 0); }
        else if (m === pushDown) { me.y = p.y + p.h; me.vy = Math.max(me.vy, 0); }
        else if (m === pushL) me.x = p.x - PW; else me.x = p.x + p.w;
      }
    }
    // horizontal
    let dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const acc = me.onGround ? ACC : AIR_ACC;
    if (dir) {
      // demi-tour plus franc au sol, inertie conservée en l'air
      const turning = Math.sign(me.vx) === -dir && me.vx !== 0;
      me.vx += dir * (turning ? (me.onGround ? DEC : DEC * 0.9) : acc) * dt; me.face = dir;
    } else { const dec = (me.onGround ? DEC : AIR_DEC) * dt; me.vx = Math.abs(me.vx) <= dec ? 0 : me.vx - Math.sign(me.vx) * dec; }
    me.vx = Math.max(-SPEED, Math.min(SPEED, me.vx));
    if (me.onGround && Math.abs(me.vx) > 10) me.walk += dt * 14; else if (me.onGround) me.walk = 0;
    // saut
    if (input.jumpPressed) me.jumpBuf = 0.13;
    me.jumpBuf -= dt;
    me.coyote = me.onGround ? 0.09 : me.coyote - dt;
    if (me.jumpBuf > 0 && me.coyote > 0) {
      me.vy = -JUMP; me.jumpBuf = 0; me.coyote = 0; me.onGround = false; me.ground = null; me.holdT = HOLD_TIME; me.jumping = true; Sfx.play('jump');
    }
    // saut progressif : plus on garde la touche, plus on monte (et donc plus on va loin)
    if (me.jumping && input.jump && me.holdT > 0 && me.vy < 0) { me.holdT -= dt; me.vy += GRAV * HOLD_GRAV * dt; }
    else {
      if (me.jumping && !input.jump && me.vy < -CUT_VY) me.vy = -CUT_VY;
      me.holdT = 0;
      me.vy += GRAV * dt;
    }
    if (me.vy >= 0) { me.bouncing = false; me.jumping = false; }
    me.vy = Math.min(me.vy, MAXFALL);

    me.x += me.vx * dt;
    for (const s of this.solidsAt(this.playerRect(me))) {
      // petite marche (haut d'une pente) : on monte au lieu d'être bloqué
      const step = me.y + PH - s.y;
      if (s.tile && me.onGround && step > 0 && step <= 14 && !this.solidsAt({ x: me.x, y: s.y - PH, w: PW, h: PH }).length) { me.y = s.y - PH; continue; }
      if (me.vx > 0 || (me.vx === 0 && me.x + PW / 2 < s.x + s.w / 2)) me.x = s.x - PW; else me.x = s.x + s.w;
      me.vx = 0;
    }
    const prevBottom = me.y + PH;
    me.y += me.vy * dt;
    const wasGround = me.onGround;
    me.onGround = false; me.ground = null;
    let landTiles = [];
    for (const s of this.solidsAt(this.playerRect(me))) {
      if (me.vy >= 0 && prevBottom <= s.y + 8) {
        me.y = s.y - PH; me.onGround = true; if (!s.tile) me.ground = s; else landTiles.push(s);
      } else if (me.vy < 0) { me.y = s.y + s.h; }
      else { me.y = s.y - PH; me.onGround = true; if (!s.tile) me.ground = s; else landTiles.push(s); }
    }
    if (me.vy < 0 && !me.onGround && this.solidsAt({ x: me.x, y: me.y - 0.5, w: PW, h: 1 }).length) me.vy = 0;
    // licornes (plateformes traversables par dessous)
    if (me.vy >= 0) {
      for (const u of this.unicorns) {
        const top = u.y;
        if (me.x + PW > u.x + 6 && me.x < u.x + u.w - 6 && prevBottom <= u.prevy + 6 && me.y + PH >= top) {
          me.y = top - PH; me.onGround = true; me.ground = u;
        }
      }
    }
    // pentes : on colle à la surface en diagonale
    if (me.vy >= 0 && !me.ground) {
      const fx = me.x + PW / 2, tx = Math.floor(fx / T), fyRow = Math.floor((me.y + PH - 1) / T);
      for (const ty of [fyRow - 1, fyRow, fyRow + 1]) {
        if (!isSlope(this.tileAt(tx, ty))) continue;
        const sy = this.slopeY(tx, ty, fx);
        if (me.onGround && sy > me.y + PH) continue; // déjà sur un sol plus haut
        const snap = (wasGround || me.onGround) && !me.jumping && !me.bouncing ? 16 : 0;
        if (me.y + PH >= sy - snap && me.y + PH <= sy + 18) { me.y = sy - PH; me.onGround = true; me.onSlope = true; break; }
      }
    }
    if (me.onGround) me.vy = 0;
    // sol : rebond / pièges
    if (me.onGround && !me.ground && !isSlope(this.tileAt(Math.floor((me.x + PW / 2) / T), Math.floor((me.y + PH + 1) / T)))) {
      const fy = Math.floor((me.y + PH + 1) / T);
      const xa = Math.floor((me.x + 4) / T), xb = Math.floor((me.x + PW - 4) / T);
      let bounce = null, deadly = false;
      for (let tx = xa; tx <= xb; tx++) {
        const ch = this.grid[fy] && this.grid[fy][tx];
        if (ch === 'J') bounce = this.bounces.find((b) => b.x === tx && b.y === fy);
        if (ch && DEADLY[this.myRole].includes(ch)) deadly = true;
      }
      if (deadly) { this.die(true); return; }
      if (bounce) { me.vy = -BOUNCE; me.bouncing = true; me.onGround = false; bounce.sq = 1; Sfx.play('bounce'); }
    }
    if (!wasGround && me.onGround) { this.puff(me.x + PW / 2, me.y + PH); if (this.lastFall > 250) Sfx.play('land'); }
    if (!me.onGround) this.lastFall = me.vy;
  }

  takeItem(id) {
    const it = this.items.find((i) => i.id === id);
    if (!it || it.taken) return;
    it.taken = true;
    Sfx.play(it.rare || it.star ? 'rare' : 'collect');
    for (let i = 0; i < (it.rare ? 18 : 9); i++) {
      const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 90;
      this.particles.push({ x: it.cx, y: it.cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.8, max: 0.8, kind: i % 2 ? 'heart' : 'spark', col: it.star ? '#ffd34d' : it.role === 'pink' ? '#ff6fa8' : '#5aa8f0' });
    }
  }

  die(local) {
    if (this.dying > 0 || this.done) return;
    this.dying = 1.4;
    Sfx.play('die');
    if (local) { this.me.dead = true; Net.send('die', {}); } else this.other.dead = true;
  }

  complete(info) {
    if (this.done) return;
    this.done = true;
    for (const it of this.items) it.taken = info.taken.includes(it.id);
    Sfx.play('win');
    const count = (role, rare) => this.items.filter((i) => i.role === role && i.rare === rare);
    const res = { time: info.time, par: this.def.par };
    for (const role of ['blue', 'pink']) {
      const n = count(role, false), r = count(role, true);
      res[role] = { got: n.filter((i) => i.taken).length, total: n.length, rare: r.length ? r[0].taken : null, rareSub: r.length ? r[0].sub : null, subs: n.filter((i) => i.taken).map((i) => i.sub) };
    }
    const st = this.items.filter((i) => i.star);
    res.stars = { got: st.filter((i) => i.taken).length, total: st.length };
    const all = res.blue.got + res.pink.got, tot = res.blue.total + res.pink.total;
    const ratio = tot ? all / tot : 1, fast = res.time <= res.par;
    res.rank = ratio === 1 && fast ? 'S' : (ratio === 1 || (fast && ratio >= 0.7)) ? 'A' : ratio >= 0.5 ? 'B' : 'C';
    if (res.time > res.par * 1.6 && res.rank !== 'C') res.rank = 'SABC'['SABC'.indexOf(res.rank) + 1]; // beaucoup trop lent : une note de moins
    setTimeout(() => this.onEvent('complete', res), 900);
  }

  emote(role, i, local) {
    this.bubbles[role] = { text: EMOTES[i], until: this.gt + 2.6 };
    Sfx.play('emote');
    if (local) Net.send('emote', { i });
  }

  onNet(type, d) {
    const o = this.other;
    switch (type) {
      case 'st': o.tx = d.x; o.ty = d.y; o.face = d.f; o.walk = d.w; o.air = d.a; if (!o.seen) { o.x = d.x; o.y = d.y; o.seen = true; } break;
      case 'collect': this.takeItem(d.id); break;
      case 'lever': { let any = false; for (const l of this.levers) if (l.id === d.id) { l.on = d.on; any = true; } if (any) Sfx.play('lever'); break; }
      case 'die': this.die(false); break;
      case 'complete': this.complete(d); break;
      case 'emote': this.emote(this.otherRole, d.i, false); break;
      case 'tsync': if (!this.dying && Math.abs(d.t + 0.04 - this.t) > 0.12) this.t = d.t + 0.04; break;
    }
  }

  puff(x, y) {
    for (let i = 0; i < 4; i++) this.particles.push({ x: x + (Math.random() - 0.5) * 14, y, vx: (Math.random() - 0.5) * 50, vy: -Math.random() * 30, life: 0.35, max: 0.35, kind: 'puff', col: '#fff' });
  }

  updateParticles(dt) {
    for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; p.life -= dt; }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  // ---------- RENDU ----------
  draw(ctx, W, H) {
    const t = this.gt;
    Art.background(ctx, W, H, t, this.def.index);
    ctx.save(); ctx.translate(this.ox, this.oy); ctx.scale(this.scale, this.scale);
    this.drawWorld(ctx, t);
    ctx.restore();
    this.drawHUD(ctx, W, H);
  }

  drawWorld(ctx, t) {
    for (const p of this.platforms) {
      if (p.vanish) { ctx.save(); ctx.globalAlpha = 1 - p.p * 0.85; Art.platform(ctx, p.x, p.y, p.w, p.h, p.color); ctx.restore(); }
      else Art.platform(ctx, p.x, p.y, p.w, p.h, p.color);
    }
    ctx.drawImage(this.tiles, 0, 0);
    for (const pl of this.pools) Art.pool(ctx, pl.k, pl.x * T, pl.y * T, T, t, pl.x, pl.l, pl.r);
    for (const b of this.bounces) Art.bounce(ctx, b.x * T, b.y * T, T, t, b.sq);
    for (const f of this.fakes) Art.fakeWall(ctx, f.x * T, f.y * T, f.seen, this.grid, f.x, f.y);
    for (const tu of this.turrets) Art.turret(ctx, tu.x * T, tu.y * T, tu.dir, t, ((this.t - tu.offset) % tu.period) / tu.period);
    const mr = this.playerRect(this.me), or = this.playerRect(this.other);
    const inD = (r, role) => { const d = this.doors[role]; return overlap(r, d); };
    Art.door(ctx, this.doors.blue.x, this.doors.blue.y, 'blue', inD(this.myRole === 'blue' ? mr : or, 'blue'), t);
    Art.door(ctx, this.doors.pink.x, this.doors.pink.y, 'pink', inD(this.myRole === 'pink' ? mr : or, 'pink'), t);
    for (const f of this.fragiles) Art.fragile(ctx, f.x * T, f.y * T, f.state, f.timer, t);
    for (const b of this.buttons) {
      const col = TRIGGER_COLORS[b.id % TRIGGER_COLORS.length];
      Art.button(ctx, b.x * T, b.y * T, b.pressed, col);
      if (b.timer) { // chrono du bouton-minuteur
        const left = Math.max(0, b.until - this.t) / b.timer;
        ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = '#1f141f'; ctx.beginPath(); ctx.arc(b.x * T + 16, b.y * T + 8, 9, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.fill();
        if (left > 0) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(b.x * T + 16, b.y * T + 8); ctx.arc(b.x * T + 16, b.y * T + 8, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left); ctx.fill(); }
        ctx.fillStyle = '#1f141f'; ctx.fillRect(b.x * T + 15, b.y * T + 2, 2, 7);
        ctx.restore();
      }
    }
    for (const l of this.levers) {
      Art.lever(ctx, l.x * T, l.y * T, l.on, TRIGGER_COLORS[l.id % TRIGGER_COLORS.length]);
      if (overlap(mr, { x: l.x * T, y: l.y * T, w: T, h: T }) && !this.done) Art.bubble(ctx, l.x * T + 16, l.y * T - 14, '↓ levier');
    }
    for (const it of this.items) {
      if (it.taken) continue;
      const bob = Math.sin(t * 3 + it.id) * 3;
      ctx.save();
      ctx.globalAlpha = 0.65 + 0.25 * Math.sin(t * 4 + it.id);
      const g = ctx.createRadialGradient(it.cx, it.cy + bob, 2, it.cx, it.cy + bob, it.rare ? 26 : 20);
      g.addColorStop(0, it.star ? 'rgba(255,215,80,0.95)' : it.role === 'pink' ? 'rgba(255,120,180,0.9)' : 'rgba(110,180,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(it.cx, it.cy + bob, it.rare ? 26 : 20, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      Art.item(ctx, it.sub, it.cx, it.cy + bob, t, it.rare || it.star ? 28 : 24);
    }
    for (const u of this.unicorns) Art.unicorn(ctx, u.x, u.y, u.w, t + u.x0, u.dir);
    for (const m of this.mobs) { const p = this.mobPos(m); Art.gelee(ctx, p.x, p.y, t, p.dir * Math.sign(m.dx || 1)); }
    for (const sh of this.shots()) Art.shot(ctx, sh.x, sh.y, t);
    // joueurs
    const drawP = (o, role, isMe) => {
      Art.teddy(ctx, o.x + PW / 2, o.y + PH, role, { face: o.face, walk: o.walk, air: isMe ? !o.onGround : o.air, outfit: this.outfits[role], t, scale: 0.95, dead: o.dead });
      ctx.save(); ctx.font = `bold ${Math.round(11 / this.scale)}px "Trebuchet MS", sans-serif`; ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.fillStyle = COLORS[role].dark;
      const ny = o.y - 18;
      ctx.strokeText(this.names[role], o.x + PW / 2, ny); ctx.fillText(this.names[role], o.x + PW / 2, ny);
      ctx.restore();
      const bb = this.bubbles[role];
      if (bb && bb.until > t) { ctx.save(); ctx.translate(o.x + PW / 2, o.y - 26); ctx.scale(1 / this.scale, 1 / this.scale); Art.bubble(ctx, 0, 0, bb.text); ctx.restore(); }
    };
    drawP(this.other, this.otherRole, false);
    drawP(this.me, this.myRole, true);
    for (const p of this.particles) {
      ctx.save(); ctx.globalAlpha = Math.max(0, p.life / p.max);
      if (p.kind === 'heart') Art.heart(ctx, p.x, p.y, 9, p.col);
      else if (p.kind === 'spark') Art.sparkle(ctx, p.x, p.y, 4, p.col);
      else { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  }

  drawHUD(ctx, W, H) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    Art.roundRect(ctx, 8, 4, W - 16, 26, 12); ctx.fill();
    ctx.font = 'bold 14px "Trebuchet MS", sans-serif'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#8a4f9e'; ctx.textAlign = 'left';
    ctx.fillText(`Niveau ${this.def.index + 1} · ${this.def.name}`, 20, 17);
    ctx.textAlign = 'center';
    const tt = this.t, par = this.def.par, fmt = (v) => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`;
    const over = tt > par;
    ctx.fillStyle = over ? '#e0306c' : (par - tt < 10 ? '#d9822b' : '#8a4f9e');
    ctx.fillText(`⏱ ${fmt(tt)} / ${fmt(par)}${over ? '  (temps dépassé)' : ''}`, W / 2 + 40, 17);
    ctx.textAlign = 'right';
    const cnt = (role) => { const n = this.items.filter((i) => i.role === role && !i.rare); return `${n.filter((i) => i.taken).length}/${n.length}`; };
    Art.item(ctx, 'gpu', W - 160, 17, this.gt, 16); ctx.fillStyle = COLORS.blue.dark; ctx.fillText(cnt('blue'), W - 112, 17);
    Art.item(ctx, 'lipstick', W - 90, 17, this.gt, 16); ctx.fillStyle = COLORS.pink.dark; ctx.fillText(cnt('pink'), W - 30, 17);
    const st = this.items.filter((i) => i.star);
    if (st.length) { Art.item(ctx, 'star', W - 236, 17, this.gt, 16); ctx.fillStyle = '#c9971a'; ctx.fillText(`${st.filter((i) => i.taken).length}/${st.length}`, W - 190, 17); }
    ctx.restore();
    if (this.hintTimer > 0 && this.def.hint) {
      ctx.save(); ctx.globalAlpha = Math.min(1, this.hintTimer);
      ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
      const w = Math.min(W - 40, ctx.measureText(this.def.hint).width + 40);
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; Art.roundRect(ctx, (W - w) / 2, 40, w, 34, 14); ctx.fill();
      ctx.strokeStyle = '#e7b6ef'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#7a3f8e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.def.hint, W / 2, 58);
      ctx.restore();
    }
    if (this.dying > 0) {
      ctx.save(); ctx.fillStyle = 'rgba(255,200,230,' + Math.min(0.5, (1.4 - this.dying)) + ')'; ctx.fillRect(0, 0, W, H);
      ctx.font = 'bold 44px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#c0408a';
      ctx.fillText('Oups ! On recommence 💕', W / 2, H / 2); ctx.restore();
    }
  }
}

const EMOTES = ['❤️', 'Attends-moi !', 'Vite !!', '😈', '🤪', '😡', '😞'];
