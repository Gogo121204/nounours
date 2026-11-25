// Tous les dessins du jeu (faits main en canvas, aucun asset externe)
const COLORS = {
  blue: { main: '#7fb6f0', light: '#d4e9ff', dark: '#4d86c7', name: 'Nounours Bleu' },
  pink: { main: '#f5a3c7', light: '#ffe2ef', dark: '#d76f9f', name: 'Nounours Rose' },
};
const TRIGGER_COLORS = ['#ff9fd0', '#8fd3ff', '#a8ecb0', '#ffd98a', '#c8a8ff', '#ffb38a'];

const Art = {};

Art.roundRect = function (ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

function ell(ctx, x, y, rx, ry, fill, stroke, lw) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
}

// ---------- NOUNOURS ----------
// (cx, by) = centre bas. face = 1 droite / -1 gauche
Art.teddy = function (ctx, cx, by, role, opts = {}) {
  const c = COLORS[role];
  const s = opts.scale || 1;
  const face = opts.face || 1;
  const walk = opts.walk || 0;
  const air = opts.air || false;
  const outfit = opts.outfit || {};
  const t = opts.t || 0;
  ctx.save();
  ctx.translate(cx, by);
  ctx.scale(s, s);
  if (opts.glow !== false) { // halo lumineux autour du personnage
    const g = ctx.createRadialGradient(0, -20, 4, 0, -20, 32);
    g.addColorStop(0, role === 'pink' ? 'rgba(255,140,200,0.45)' : 'rgba(120,190,255,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -20, 32, 0, Math.PI * 2); ctx.fill();
  }
  if (opts.dead) { ctx.rotate(Math.PI / 2 * face); ctx.globalAlpha = 0.8; }
  const bob = air ? -1 : Math.abs(Math.sin(walk)) * -1.5;
  const ol = OUT;

  // cape (dos)
  if (outfit.back === 'cape') {
    const g = ctx.createLinearGradient(-12, -28, 12, 0);
    ['#ff9fd0', '#ffd98a', '#a8ecb0', '#8fd3ff', '#c8a8ff'].forEach((col, i) => g.addColorStop(i / 4, col));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-8 * face, -26 + bob); ctx.quadraticCurveTo(-20 * face, -12 + Math.sin(t * 6) * 2, -14 * face, -2);
    ctx.lineTo(4 * face, -4); ctx.closePath(); ctx.fill();
  }
  if (outfit.back === 'ailes') {
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.strokeStyle = '#e6c8ff'; ctx.lineWidth = 1.5;
    const fl = Math.sin(t * 10) * 3;
    for (const sd of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(sd * 4, -22 + bob);
      ctx.quadraticCurveTo(sd * 20, -36 + fl, sd * 22, -22 + fl);
      ctx.quadraticCurveTo(sd * 16, -16, sd * 4, -16 + bob); ctx.fill(); ctx.stroke();
    }
  }
  // jambes
  const lg = air ? 2 : Math.sin(walk) * 3;
  ell(ctx, -5 + lg, -3, 4.5, 3.5, c.main, ol);
  ell(ctx, 5 - lg, -3, 4.5, 3.5, c.main, ol);
  // corps
  ell(ctx, 0, -12 + bob, 10, 9.5, c.main, ol);
  ell(ctx, 0, -11 + bob, 6, 6, c.light);
  // bras
  const ar = air ? -4 : Math.sin(walk + 1.5) * 2;
  ell(ctx, -9, -14 + bob + ar, 3.5, 5, c.main, ol);
  ell(ctx, 9, -14 + bob - ar, 3.5, 5, c.main, ol);
  // tête
  const hy = -28 + bob;
  ell(ctx, -8, hy - 8, 4.5, 4.5, c.main, ol); ell(ctx, -8, hy - 8, 2.4, 2.4, c.light);
  ell(ctx, 8, hy - 8, 4.5, 4.5, c.main, ol); ell(ctx, 8, hy - 8, 2.4, 2.4, c.light);
  ell(ctx, 0, hy, 11.5, 10.5, c.main, ol);
  const fx = face * 1.8;
  ell(ctx, fx, hy + 3.5, 5, 3.8, c.light);
  ell(ctx, fx, hy + 2.2, 1.8, 1.3, '#3a2a35');
  // yeux
  if (opts.dead) {
    ctx.strokeStyle = '#3a2a35'; ctx.lineWidth = 1.4;
    for (const ex of [-4.5, 4.5]) { ctx.beginPath(); ctx.moveTo(fx + ex - 1.8, hy - 3.5); ctx.lineTo(fx + ex + 1.8, hy - 0.5); ctx.moveTo(fx + ex + 1.8, hy - 3.5); ctx.lineTo(fx + ex - 1.8, hy - 0.5); ctx.stroke(); }
  } else {
    const blink = (Math.sin(t * 1.3 + (role === 'pink' ? 2 : 0)) > 0.985);
    for (const ex of [-4.5, 4.5]) {
      if (blink) { ctx.fillStyle = '#3a2a35'; ctx.fillRect(fx + ex - 1.8, hy - 2, 3.6, 1.2); }
      else { ell(ctx, fx + ex, hy - 2, 1.9, 2.2, '#3a2a35'); ell(ctx, fx + ex + 0.6, hy - 2.8, 0.7, 0.7, '#fff'); }
    }
  }
  // joues
  ell(ctx, fx - 7, hy + 2.5, 2.4, 1.5, 'rgba(255,120,160,0.55)');
  ell(ctx, fx + 7, hy + 2.5, 2.4, 1.5, 'rgba(255,120,160,0.55)');
  // bouche
  ctx.strokeStyle = '#3a2a35'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(fx, hy + 4.3, 1.6, 0.2, Math.PI - 0.2); ctx.stroke();

  // accessoires visage
  if (outfit.face === 'lunettes') {
    ctx.fillStyle = '#2b2b3a';
    Art.roundRect(ctx, fx - 8.5, hy - 4.5, 7, 4.5, 1.5); ctx.fill();
    Art.roundRect(ctx, fx + 1.5, hy - 4.5, 7, 4.5, 1.5); ctx.fill();
    ctx.fillRect(fx - 1.5, hy - 3.5, 3, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(fx - 7.5, hy - 4, 2, 1.2); ctx.fillRect(fx + 2.5, hy - 4, 2, 1.2);
  }
  if (outfit.face === 'coeurs') {
    for (const ex of [-4.5, 4.5]) Art.heart(ctx, fx + ex, hy - 2.2, 4.2, '#ff4f8b');
    ctx.fillStyle = '#ff4f8b'; ctx.fillRect(fx - 1.5, hy - 3, 3, 1);
  }
  if (outfit.face === 'moustache') {
    ctx.fillStyle = '#5a3a2a';
    ctx.beginPath(); ctx.ellipse(fx - 3, hy + 3.6, 3.2, 1.4, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(fx + 3, hy + 3.6, 3.2, 1.4, -0.3, 0, Math.PI * 2); ctx.fill();
  }
  // accessoires tête
  const top = hy - 10;
  if (outfit.head === 'noeud') {
    ctx.fillStyle = '#ff4f8b';
    ctx.beginPath(); ctx.moveTo(4, top); ctx.lineTo(-2, top - 5); ctx.lineTo(-2, top + 4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, top); ctx.lineTo(10, top - 5); ctx.lineTo(10, top + 4); ctx.closePath(); ctx.fill();
    ell(ctx, 4, top, 2, 2, '#ff7fb0');
  }
  if (outfit.head === 'couronne') {
    ctx.fillStyle = '#ffd34d'; ctx.strokeStyle = '#d9a400'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-7, top + 2); ctx.lineTo(-7, top - 5); ctx.lineTo(-3.5, top - 1); ctx.lineTo(0, top - 7);
    ctx.lineTo(3.5, top - 1); ctx.lineTo(7, top - 5); ctx.lineTo(7, top + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ell(ctx, 0, top - 1, 1.3, 1.3, '#ff4f8b'); ell(ctx, -4.5, top, 1, 1, '#4fb3ff'); ell(ctx, 4.5, top, 1, 1, '#4fb3ff');
  }
  if (outfit.head === 'casquette') {
    ctx.fillStyle = '#5a6cff';
    ctx.beginPath(); ctx.arc(0, top + 3, 10, Math.PI, 0); ctx.fill();
    ctx.fillRect(face > 0 ? 2 : -16, top + 1.5, 14, 3);
    ell(ctx, 0, top - 6.5, 1.6, 1.6, '#fff');
  }
  if (outfit.head === 'casque') {
    ctx.strokeStyle = '#2b2b3a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, hy - 1, 12.5, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    const rgb = `hsl(${(t * 120) % 360},90%,65%)`;
    Art.roundRect(ctx, -15, hy - 5, 5, 9, 2); ctx.fillStyle = '#2b2b3a'; ctx.fill(); ctx.fillStyle = rgb; ctx.fillRect(-14, hy - 3, 1.5, 5);
    Art.roundRect(ctx, 10, hy - 5, 5, 9, 2); ctx.fillStyle = '#2b2b3a'; ctx.fill(); ctx.fillStyle = rgb; ctx.fillRect(12.5, hy - 3, 1.5, 5);
  }
  if (outfit.head === 'fleurs') {
    const cols = ['#ff7fb0', '#ffd34d', '#c8a8ff', '#8fd3ff', '#a8ecb0'];
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + (i + 0.5) * Math.PI / 5;
      const px = Math.cos(a) * 10, py = hy + Math.sin(a) * 9.5;
      for (let k = 0; k < 5; k++) ell(ctx, px + Math.cos(k * 1.256) * 1.8, py + Math.sin(k * 1.256) * 1.8, 1.5, 1.5, cols[i]);
      ell(ctx, px, py, 1, 1, '#fff6b0');
    }
  }
  if (outfit.head === 'cowboy') {
    ctx.fillStyle = '#c98a4b'; ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 1;
    ell(ctx, 0, top + 2, 15, 3, '#c98a4b', '#8a5a2b');
    Art.roundRect(ctx, -7, top - 8, 14, 10, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff7fb0'; ctx.fillRect(-7, top - 1, 14, 2);
  }
  if (outfit.head === 'corne') {
    const g = ctx.createLinearGradient(0, top - 12, 0, top + 2);
    g.addColorStop(0, '#fff6b0'); g.addColorStop(1, '#ffc2e2');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-3, top + 2); ctx.lineTo(0, top - 12); ctx.lineTo(3, top + 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e8a6c8'; ctx.lineWidth = 0.8; ctx.stroke();
  }
  ctx.restore();
};

Art.heart = function (ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 10, s / 10);
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(0, 3);
  ctx.bezierCurveTo(-6, -2, -4, -7, 0, -4);
  ctx.bezierCurveTo(4, -7, 6, -2, 0, 3);
  ctx.fill(); ctx.restore();
};

Art.sparkle = function (ctx, x, y, r, col) {
  ctx.save(); ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill(); ctx.restore();
};

// ---------- OBJETS ----------
const BLUE_ITEMS = ['gpu', 'ram', 'cpu', 'ssd', 'fan'];
const PINK_ITEMS = ['lipstick', 'mascara', 'gloss', 'palette', 'doudou', 'vernis'];
const ITEM_NAMES = {
  gpu: 'Carte graphique', ram: 'Barrette de RAM', cpu: 'Processeur', ssd: 'SSD', fan: 'Ventilo RGB',
  lipstick: 'Rouge à lèvres', mascara: 'Mascara', gloss: 'Gloss', palette: 'Palette', doudou: 'Doudou', vernis: 'Vernis',
  ring: 'Bague', plane: 'Avion',
};

Art.item = function (ctx, kind, cx, cy, t, size) {
  const s = (size || 22) / 22;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  switch (kind) {
    case 'gpu': {
      Art.roundRect(ctx, -11, -6, 22, 12, 2); ctx.fillStyle = '#3b3f52'; ctx.fill();
      ctx.fillStyle = '#ffd34d'; ctx.fillRect(-9, 6, 12, 2);
      for (const fx of [-5, 5]) {
        ell(ctx, fx, 0, 4.5, 4.5, '#22242f');
        ctx.save(); ctx.translate(fx, 0); ctx.rotate(t * 8);
        ctx.fillStyle = '#9aa3c7'; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-0.8, -4, 1.6, 4); }
        ctx.restore();
      }
      const g = ctx.createLinearGradient(-11, 0, 11, 0);
      g.addColorStop(0, '#ff7fb0'); g.addColorStop(0.5, '#8fd3ff'); g.addColorStop(1, '#a8ecb0');
      ctx.fillStyle = g; ctx.fillRect(-11, -7, 22, 1.8);
      break;
    }
    case 'ram': {
      ctx.fillStyle = '#2f8f5a'; ctx.fillRect(-11, -4, 22, 8);
      ctx.fillStyle = '#1b1d26'; for (let i = 0; i < 4; i++) ctx.fillRect(-9 + i * 5, -2.5, 3.5, 5);
      ctx.fillStyle = '#ffd34d'; for (let i = 0; i < 10; i++) ctx.fillRect(-10 + i * 2.1, 4, 1.2, 2);
      ctx.fillStyle = `hsl(${(t * 150) % 360},90%,70%)`; ctx.fillRect(-11, -6, 22, 2);
      break;
    }
    case 'cpu': {
      ctx.fillStyle = '#ffd34d'; for (let i = 0; i < 5; i++) { ctx.fillRect(-7 + i * 3.2, -11, 1.4, 3); ctx.fillRect(-7 + i * 3.2, 8, 1.4, 3); ctx.fillRect(-11, -7 + i * 3.2, 3, 1.4); ctx.fillRect(8, -7 + i * 3.2, 3, 1.4); }
      Art.roundRect(ctx, -8, -8, 16, 16, 2); ctx.fillStyle = '#c9cede'; ctx.fill();
      Art.roundRect(ctx, -5, -5, 10, 10, 1); ctx.fillStyle = '#9aa3c7'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('CPU', 0, 2);
      break;
    }
    case 'ssd': {
      Art.roundRect(ctx, -11, -6, 22, 12, 2); ctx.fillStyle = '#2b2b3a'; ctx.fill();
      Art.roundRect(ctx, -8, -3.5, 13, 7, 1); ctx.fillStyle = '#8fd3ff'; ctx.fill();
      ctx.fillStyle = '#2b2b3a'; ctx.font = 'bold 5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('SSD', -1.5, 2);
      ctx.fillStyle = '#ffd34d'; ctx.fillRect(7, -3, 3, 6);
      break;
    }
    case 'fan': {
      Art.roundRect(ctx, -10, -10, 20, 20, 3); ctx.fillStyle = '#2b2b3a'; ctx.fill();
      ctx.lineWidth = 2.2; ctx.strokeStyle = `hsl(${(t * 200) % 360},90%,65%)`;
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.save(); ctx.rotate(t * 10); ctx.fillStyle = '#dfe3f5';
      for (let i = 0; i < 5; i++) { ctx.rotate(Math.PI * 2 / 5); ctx.beginPath(); ctx.ellipse(0, -4, 2, 4, 0.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore(); ell(ctx, 0, 0, 2, 2, '#9aa3c7');
      break;
    }
    case 'lipstick': {
      ctx.rotate(0.3);
      Art.roundRect(ctx, -4, -1, 8, 11, 1.5); ctx.fillStyle = '#ffd34d'; ctx.fill();
      ctx.fillStyle = '#e8b400'; ctx.fillRect(-4, 3, 8, 1.5);
      ctx.fillStyle = '#e8336f'; ctx.beginPath(); ctx.moveTo(-3, -1); ctx.lineTo(-3, -8); ctx.lineTo(3, -11); ctx.lineTo(3, -1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-2, -7, 1, 5);
      break;
    }
    case 'mascara': {
      ctx.rotate(-0.4);
      Art.roundRect(ctx, -3, -2, 6, 13, 2); ctx.fillStyle = '#ff7fb0'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(-3, 3, 6, 1.2);
      ctx.fillStyle = '#c0c4d6'; ctx.fillRect(-0.6, -8, 1.2, 6);
      ctx.fillStyle = '#1b1d26'; Art.roundRect(ctx, -1.8, -12, 3.6, 5, 1.5); ctx.fill();
      ctx.strokeStyle = '#1b1d26'; ctx.lineWidth = 0.6; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-3, -11.5 + i); ctx.lineTo(3, -11.5 + i); ctx.stroke(); }
      break;
    }
    case 'gloss': {
      Art.roundRect(ctx, -5, -3, 10, 13, 3); ctx.fillStyle = 'rgba(255,170,210,0.9)'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#ff4f8b'; Art.roundRect(ctx, -4, 2, 8, 7, 2); ctx.fill();
      ctx.fillStyle = '#c8a8ff'; Art.roundRect(ctx, -3, -11, 6, 8, 2); ctx.fill();
      Art.sparkle(ctx, 2, 4, 2.2, '#fff');
      break;
    }
    case 'palette': {
      Art.roundRect(ctx, -11, -8, 22, 16, 4); ctx.fillStyle = '#ffe2ef'; ctx.fill(); ctx.strokeStyle = '#d76f9f'; ctx.lineWidth = 1.2; ctx.stroke();
      const cols = ['#ff7fb0', '#c8a8ff', '#ffd34d', '#8fd3ff', '#e8336f', '#a8ecb0'];
      for (let i = 0; i < 6; i++) ell(ctx, -6.5 + (i % 3) * 6.5, -3 + Math.floor(i / 3) * 6.5, 2.6, 2.6, cols[i]);
      break;
    }
    case 'doudou': {
      ell(ctx, -3.5, -8, 2, 5.5, '#fff', '#d7b0c8', 1); ell(ctx, 3.5, -8, 2, 5.5, '#fff', '#d7b0c8', 1);
      ell(ctx, -3.5, -8, 1, 3.5, '#ffc2e2'); ell(ctx, 3.5, -8, 1, 3.5, '#ffc2e2');
      ell(ctx, 0, 2, 8.5, 7.5, '#fff', '#d7b0c8', 1);
      ell(ctx, -3, 1, 1.1, 1.3, '#3a2a35'); ell(ctx, 3, 1, 1.1, 1.3, '#3a2a35');
      ell(ctx, 0, 3.5, 1.2, 0.8, '#ff7fb0'); ell(ctx, -5, 4, 1.6, 1, 'rgba(255,120,160,0.6)'); ell(ctx, 5, 4, 1.6, 1, 'rgba(255,120,160,0.6)');
      break;
    }
    case 'vernis': {
      Art.roundRect(ctx, -6, -2, 12, 12, 3); ctx.fillStyle = '#c8337a'; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-4, 0, 2, 7);
      ctx.fillStyle = '#2b2b3a'; Art.roundRect(ctx, -3, -11, 6, 9, 1.5); ctx.fill();
      break;
    }
    case 'ring': {
      ctx.strokeStyle = '#ffcf33'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 4, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 4, 7, Math.PI * 1.1, Math.PI * 1.5); ctx.stroke();
      ctx.fillStyle = '#bff0ff'; ctx.strokeStyle = '#6cc7e8'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(5, -5); ctx.lineTo(7, -2); ctx.lineTo(0, 5); ctx.lineTo(-7, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-7, -2); ctx.lineTo(7, -2); ctx.stroke();
      Art.sparkle(ctx, 6, -9, 3 + Math.sin(t * 6) * 1, '#fff');
      break;
    }
    case 'star': {
      ctx.rotate(Math.sin(t * 2) * 0.2);
      ctx.fillStyle = '#ffd84d'; ctx.strokeStyle = '#1f141f'; ctx.lineWidth = 2;
      ctx.beginPath(); for (let k = 0; k < 10; k++) { const an = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 4.5 : 11; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke();
      ell(ctx, -3, -3, 2, 1.2, 'rgba(255,255,255,0.8)');
      break;
    }
    case 'plane': {
      ctx.rotate(-0.15);
      ctx.fillStyle = '#f4f7ff'; ctx.strokeStyle = '#8aa0d6'; ctx.lineWidth = 1;
      Art.roundRect(ctx, -12, -3, 24, 6, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-7, 10); ctx.lineTo(-3, 10); ctx.lineTo(4, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-7, -9); ctx.lineTo(-3, -9); ctx.lineTo(4, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-13, -8); ctx.lineTo(-10, -8); ctx.lineTo(-7, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7fb6f0'; ctx.fillRect(-11, -0.5, 20, 1.5);
      ctx.fillStyle = '#4d86c7'; for (let i = 0; i < 4; i++) ctx.fillRect(-4 + i * 3, -2, 1.5, 1.3);
      ctx.fillStyle = '#4d86c7'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(8, -2.5); ctx.lineTo(8, 0); ctx.closePath(); ctx.fill();
      break;
    }
  }
  ctx.restore();
};

// ---------- LICORNE ----------
Art.unicorn = function (ctx, x, y, w, t, dir, alpha) {
  // x,y = coin haut-gauche du dos (surface sur laquelle on se tient), w = largeur
  ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
  const s = w / 96;
  ctx.translate(x + w / 2, y); ctx.scale(s * (dir || 1), s);
  const fl = Math.sin(t * 7);
  // aile arrière
  ctx.fillStyle = '#f3e8ff';
  ctx.beginPath(); ctx.moveTo(-6, 2); ctx.quadraticCurveTo(-20, -26 - fl * 8, 6, -22 - fl * 10); ctx.quadraticCurveTo(4, -6, 6, 2); ctx.fill();
  // queue arc-en-ciel
  const rb = ['#ff9fd0', '#ffd98a', '#a8ecb0', '#8fd3ff', '#c8a8ff'];
  rb.forEach((c, i) => {
    ctx.strokeStyle = c; ctx.lineWidth = 3.5; ctx.beginPath();
    ctx.moveTo(-40, 6 + i * 2.2); ctx.quadraticCurveTo(-56, 2 + i * 3 + Math.sin(t * 5) * 3, -58, 18 + i * 2.5); ctx.stroke();
  });
  // pattes
  ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
  for (const lx of [-30, -18, 18, 30]) { Art.roundRect(ctx, lx - 3, 12, 6, 12 + Math.sin(t * 5 + lx) * 2, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffd98a'; ctx.fillRect(lx - 3, 21 + Math.sin(t * 5 + lx) * 2, 6, 3); ctx.fillStyle = '#fff'; }
  // corps
  ctx.beginPath(); ctx.ellipse(0, 9, 44, 12, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
  // cou + tête
  ctx.beginPath(); ctx.moveTo(30, 4); ctx.quadraticCurveTo(40, -14, 46, -16); ctx.lineTo(52, -4); ctx.quadraticCurveTo(46, 6, 40, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(52, -14, 11, 8, 0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ell(ctx, 59, -10, 3.5, 3, '#ffd6ea');
  ell(ctx, 52, -17, 1.8, 2, '#3a2a35'); ell(ctx, 52.6, -17.8, 0.6, 0.6, '#fff');
  ell(ctx, 55, -12, 2.2, 1.3, 'rgba(255,120,160,0.6)');
  // corne
  const g = ctx.createLinearGradient(46, -40, 50, -22);
  g.addColorStop(0, '#fff6b0'); g.addColorStop(1, '#ffc2e2');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(45, -22); ctx.lineTo(52, -42); ctx.lineTo(51, -21); ctx.closePath(); ctx.fill();
  // crinière
  rb.forEach((c, i) => { ell(ctx, 40 - i * 3.5, -18 + i * 5, 4.5, 4, c); });
  // aile avant
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT;
  ctx.beginPath(); ctx.moveTo(-10, 4); ctx.quadraticCurveTo(-16, -30 - fl * 10, 14, -26 - fl * 12); ctx.quadraticCurveTo(14, -6, 12, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#efdcff'; ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-4 + i * 5, 2); ctx.lineTo(-6 + i * 7, -18 - fl * 8); ctx.stroke(); }
  ctx.restore();
};

// ---------- DÉCOR ----------
Art.cloud = function (ctx, x, y, s, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, 18 * s, 0, Math.PI * 2); ctx.arc(x + 20 * s, y - 10 * s, 22 * s, 0, Math.PI * 2);
  ctx.arc(x + 44 * s, y, 18 * s, 0, Math.PI * 2); ctx.arc(x + 22 * s, y + 6 * s, 18 * s, 0, Math.PI * 2);
  ctx.fill(); ctx.restore();
};

const OUT = '#1f141f'; // contour cartoon (comme le jeu d'origine)
const STONE = '#fff3f8', STONE_D = '#f2c6dc', STONE_L = '#ffffff';

// Fond « mur de nuages » (pré-rendu une fois) : même rôle que le mur de briques de l'original
let _wall = null;
Art.wall = function (W, H) {
  if (_wall && _wall.width === W) return _wall;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const g0 = c.createLinearGradient(0, 0, 0, H);
  g0.addColorStop(0, '#a99bdf'); g0.addColorStop(0.55, '#c7a6e0'); g0.addColorStop(1, '#eeb1d2');
  c.fillStyle = g0; c.fillRect(0, 0, W, H);
  // grand arc-en-ciel cartoon
  const rb = ['#ff9fc4', '#ffc49a', '#ffe79a', '#b5ecb0', '#a5d8ff', '#c9b2ff'];
  c.save(); c.globalAlpha = 0.55;
  rb.forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 16; c.beginPath(); c.arc(W * 0.68, H * 1.05, 400 - i * 16, Math.PI, Math.PI * 2); c.stroke(); });
  c.strokeStyle = 'rgba(60,30,70,0.35)'; c.lineWidth = 2.5;
  c.beginPath(); c.arc(W * 0.68, H * 1.05, 408, Math.PI, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(W * 0.68, H * 1.05, 400 - 5 * 16 - 8, Math.PI, Math.PI * 2); c.stroke();
  c.restore();
  // rangées de nuages dessinés au trait (texture de fond, comme les briques)
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const puff = (x, y, s, fill) => {
    c.beginPath();
    c.arc(x, y, 14 * s, Math.PI * 0.5, Math.PI * 1.5);
    c.arc(x + 16 * s, y - 9 * s, 15 * s, Math.PI, Math.PI * 1.85);
    c.arc(x + 36 * s, y - 6 * s, 13 * s, Math.PI * 1.2, Math.PI * 1.95);
    c.arc(x + 50 * s, y, 13 * s, Math.PI * 1.5, Math.PI * 0.5);
    c.closePath();
    c.fillStyle = fill; c.fill();
    c.strokeStyle = 'rgba(70,40,90,0.35)'; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(x + 14 * s, y - 12 * s, 7 * s, 3 * s, -0.2, 0, Math.PI * 2); c.fill();
  };
  for (let row = 0; row < 9; row++) {
    const y = 40 + row * 74;
    for (let x = -40 + (row % 2) * 60; x < W + 40; x += 120 + rnd() * 40) {
      const k = rnd();
      puff(x, y + rnd() * 10, 0.8 + rnd() * 0.5, k < 0.5 ? 'rgba(255,255,255,0.22)' : k < 0.8 ? 'rgba(255,230,245,0.18)' : 'rgba(225,215,255,0.22)');
    }
  }
  // étoiles cartoon
  for (let i = 0; i < 14; i++) {
    const x = rnd() * W, y = rnd() * H * 0.7, r = 4 + rnd() * 4;
    c.fillStyle = '#fff4b8'; c.strokeStyle = 'rgba(70,40,90,0.45)'; c.lineWidth = 1.5;
    c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke();
  }
  const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(70,30,90,0.25)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  _wall = cv; return cv;
};

Art.background = function (ctx, W, H, t, seed) {
  ctx.drawImage(Art.wall(W, H), 0, 0);
  // licornes fantômes qui passent au loin
  const per = 34, p = ((t + (seed || 0) * 7) % per) / per;
  Art.unicorn(ctx, -160 + p * (W + 320), 110 + Math.sin(t * 1.3) * 16, 70, t, 1, 0.13);
  // poussières de paillettes (comme les particules du jeu d'origine)
  for (let i = 0; i < 26; i++) {
    const sx = (i * 137.5 + Math.sin(t * 0.3 + i) * 30 + (seed || 0) * 40) % W;
    const sy = (H - ((t * (8 + (i % 5) * 4) + i * 71) % (H + 20)));
    const a = 0.25 + 0.45 * Math.max(0, Math.sin(t * 2 + i * 1.7));
    ctx.globalAlpha = a;
    if (i % 4 === 0) Art.sparkle(ctx, sx, sy, 3.5, '#ffd6ef'); else { ctx.fillStyle = i % 2 ? '#ffe9a8' : '#ffc2e2'; ctx.beginPath(); ctx.arc(sx, sy, 1.6, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
};

// Pré-rendu des tuiles d'un niveau : pierre beige-rose à gros contour noir, flaques creusées
Art.tileLayer = function (grid, T) {
  const H = grid.length, W = grid[0].length;
  const cv = document.createElement('canvas'); cv.width = W * T; cv.height = H * T;
  const ctx = cv.getContext('2d');
  const at = (x, y) => (y >= 0 && y < H && x >= 0 && x < W ? grid[y][x] : '#');
  const solid = (x, y) => '#fgcJw/\\'.includes(at(x, y));
  const pool = (x, y) => 'fgc'.includes(at(x, y));
  const fill = (x, y) => '#fgc'.includes(at(x, y));
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const D = 12; // profondeur des bassins
  // 1) remplissage
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ch = at(x, y);
    if (!fill(x, y)) continue;
    const px = x * T, py = y * T;
    ctx.fillStyle = STONE; ctx.fillRect(px, py, T, T);
    // joints de pierre
    ctx.strokeStyle = 'rgba(200,140,180,0.35)'; ctx.lineWidth = 1.5;
    if (solid(x - 1, y) && (x + y) % 2 === 0) { ctx.beginPath(); ctx.moveTo(px, py + 4); ctx.lineTo(px, py + T - 4); ctx.stroke(); }
    if (rnd() < 0.25) { ctx.fillStyle = STONE_D; ctx.beginPath(); ctx.arc(px + 6 + rnd() * 20, py + 10 + rnd() * 16, 1.6, 0, Math.PI * 2); ctx.fill(); }
    if (!solid(x, y - 1)) { ctx.fillStyle = STONE_L; ctx.fillRect(px, py + 2, T, 5); }
    if (!solid(x, y + 1)) { ctx.fillStyle = STONE_D; ctx.fillRect(px, py + T - 6, T, 6); }
    if (pool(x, y)) { // creuser le bassin
      ctx.fillStyle = '#5a3a3a';
      const l = !pool(x - 1, y), r = !pool(x + 1, y);
      ctx.beginPath(); ctx.moveTo(px - (l ? 0 : 1), py);
      ctx.lineTo(px + (l ? 9 : -1), py + D); ctx.lineTo(px + T - (r ? 9 : -1), py + D); ctx.lineTo(px + T + (r ? 0 : 1), py); ctx.closePath();
      ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(); ctx.restore();
    }
  }
  // 2) contours noirs sur les bords exposés
  ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!fill(x, y)) continue;
    const px = x * T, py = y * T;
    const P = pool(x, y);
    ctx.beginPath();
    if (!solid(x, y - 1) && !P && at(x, y - 1) !== 'J') {
      // dessus en bosses de nuage
      ctx.stroke(); ctx.beginPath();
      ctx.fillStyle = STONE;
      for (let k = 0; k < 4; k++) { ctx.moveTo(px + k * 8 + 8, py + 3); ctx.arc(px + k * 8 + 4, py + 3, 4.5, 0, Math.PI, true); }
      ctx.fill(); ctx.beginPath();
      for (let k = 0; k < 4; k++) { ctx.moveTo(px + k * 8 + 8.5, py + 3); ctx.arc(px + k * 8 + 4, py + 3, 4.5, 0, Math.PI, true); }
    }
    if (P) {
      const l = !pool(x - 1, y), r = !pool(x + 1, y);
      ctx.moveTo(px, py + (l ? 1.5 : D)); if (l) ctx.lineTo(px + 9, py + D); ctx.lineTo(px + T - (r ? 9 : 0), py + D); if (r) ctx.lineTo(px + T, py + 1.5);
    }
    const sideL = !solid(x - 1, y) || at(x - 1, y) === 'J' || at(x - 1, y) === '\\', sideR = !solid(x + 1, y) || at(x + 1, y) === 'J' || at(x + 1, y) === '/';
    if (sideL) { ctx.moveTo(px + 1.5, py); ctx.lineTo(px + 1.5, py + T); }
    if (sideR) { ctx.moveTo(px + T - 1.5, py); ctx.lineTo(px + T - 1.5, py + T); }
    if (!solid(x, y + 1)) { ctx.moveTo(px, py + T - 1.5); ctx.lineTo(px + T, py + T - 1.5); }
    ctx.stroke();
  }
  // 2b) pentes (triangles de nuage-guimauve au gros contour)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ch = at(x, y);
    if (ch !== '/' && ch !== '\\') continue;
    const px = x * T, py = y * T, up = ch === '/';
    if (!solid(x, y + 1)) { // passerelle en diagonale (sans remplissage dessous)
      const th = 11;
      ctx.fillStyle = STONE; ctx.beginPath();
      if (up) { ctx.moveTo(px, py + T); ctx.lineTo(px + T, py); ctx.lineTo(px + T, py + th); ctx.lineTo(px, py + T + th); }
      else { ctx.moveTo(px, py); ctx.lineTo(px + T, py + T); ctx.lineTo(px + T, py + T + th); ctx.lineTo(px, py + th); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = STONE_L; ctx.lineWidth = 4; ctx.beginPath();
      if (up) { ctx.moveTo(px, py + T - 3); ctx.lineTo(px + T, py - 3 + 6); } else { ctx.moveTo(px, py + 3); ctx.lineTo(px + T, py + T + 3); }
      ctx.stroke();
      ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath();
      if (up) { ctx.moveTo(px - 1, py + T + 1); ctx.lineTo(px + T + 1, py - 1); ctx.moveTo(px - 1, py + T + th + 1); ctx.lineTo(px + T + 1, py + th - 1); }
      else { ctx.moveTo(px - 1, py - 1); ctx.lineTo(px + T + 1, py + T + 1); ctx.moveTo(px - 1, py + th - 1); ctx.lineTo(px + T + 1, py + T + th + 1); }
      ctx.stroke();
      continue;
    }
    ctx.fillStyle = STONE; ctx.beginPath();
    if (up) { ctx.moveTo(px, py + T); ctx.lineTo(px + T, py); ctx.lineTo(px + T, py + T); }
    else { ctx.moveTo(px, py); ctx.lineTo(px + T, py + T); ctx.lineTo(px, py + T); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = STONE_L; ctx.lineWidth = 5; ctx.beginPath();
    if (up) { ctx.moveTo(px + 2, py + T - 3); ctx.lineTo(px + T - 1, py + 4); } else { ctx.moveTo(px + 1, py + 4); ctx.lineTo(px + T - 2, py + T - 3); }
    ctx.stroke();
    ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath();
    if (up) { ctx.moveTo(px, py + T); ctx.lineTo(px + T, py); if (!solid(x + 1, y)) { ctx.lineTo(px + T, py + T); } }
    else { ctx.moveTo(px + T, py + T); ctx.lineTo(px, py); if (!solid(x - 1, y)) { ctx.lineTo(px, py + T); } }
    if (!solid(x, y + 1)) { ctx.moveTo(px, py + T - 1.5); ctx.lineTo(px + T, py + T - 1.5); }
    ctx.stroke();
  }
  // 3) petites touffes : fleurs, cœurs et bonbons sur les plateformes (à la place de l'herbe)
  for (let y = 1; y < H; y++) for (let x = 1; x < W - 1; x++) {
    if (at(x, y) !== '#' || solid(x, y - 1) || '12DEbpar'.includes(at(x, y - 1))) continue;
    const r = rnd();
    if (r > 0.22) continue;
    const px = x * T + 6 + rnd() * 18, py = y * T + 1;
    if (r < 0.08) { // fleur
      ctx.strokeStyle = '#3f7a3f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 7); ctx.stroke();
      const col = ['#ff8fc6', '#ffd34d', '#c8a8ff', '#8fd3ff'][Math.floor(rnd() * 4)];
      for (let k = 0; k < 5; k++) ell(ctx, px + Math.cos(k * 1.26) * 2.6, py - 9 + Math.sin(k * 1.26) * 2.6, 2, 2, col, OUT, 0.8);
      ell(ctx, px, py - 9, 1.3, 1.3, '#fff6b0');
    } else if (r < 0.15) { // herbe rose
      ctx.strokeStyle = '#6aa85a'; ctx.lineWidth = 1.6;
      for (const dx of [-3, 0, 3]) { ctx.beginPath(); ctx.moveTo(px + dx, py); ctx.quadraticCurveTo(px + dx * 1.5, py - 4, px + dx * 2, py - 7); ctx.stroke(); }
    } else { // petit cœur
      Art.heart(ctx, px, py - 4, 8, '#ff7fb0');
    }
  }
  return cv;
};

// Liquides animés dans les bassins
Art.pool = function (ctx, kind, px, py, T, t, x, l, r) {
  const D = 12;
  const cols = { f: ['#ff86b8', '#e0306c', '#ffd0e4'], g: ['#9fd8ff', '#3f97e8', '#e2f4ff'], c: ['#a0623f', '#5a321f', '#d9a27c'] }[kind];
  const surf = (i) => py + 3 + Math.sin(t * 3 + (x * 8 + i) * 0.8) * 1.6;
  const x0 = px + (l ? 6 : 0), x1 = px + T - (r ? 6 : 0);
  ctx.save();
  if (kind !== 'c') { ctx.shadowColor = cols[0]; ctx.shadowBlur = 14; }
  const g = ctx.createLinearGradient(0, py, 0, py + D); g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(px + (l ? 9 : 0), py + D - 1);
  ctx.lineTo(x0, surf(0));
  for (let i = 1; i <= 8; i++) ctx.lineTo(x0 + (x1 - x0) * i / 8, surf(i));
  ctx.lineTo(px + T - (r ? 9 : 0), py + D - 1); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  // reflets / bulles / nuages de barbe à papa
  ctx.strokeStyle = cols[2]; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.8;
  ctx.beginPath(); for (let i = 0; i <= 8; i++) { const xx = x0 + (x1 - x0) * i / 8; i ? ctx.lineTo(xx, surf(i) + 1.5) : ctx.moveTo(xx, surf(i) + 1.5); } ctx.stroke();
  ctx.globalAlpha = 1;
  if (kind === 'g') for (let k = 0; k < 2; k++) ell(ctx, px + 9 + k * 13, surf(2 + k * 4) + 2, 4.5, 3, 'rgba(235,248,255,0.9)');
  if (kind === 'f') { const b = (t * 0.7 + x * 0.37) % 1; ell(ctx, px + 10 + (x * 13) % 12, py + D - 2 - b * 9, 1.5, 1.5, 'rgba(255,230,240,' + (1 - b) + ')'); }
  ctx.restore();
};

Art.bounce = function (ctx, px, py, T, t, squash) {
  const sq = squash || 0;
  // socle de pierre
  ctx.fillStyle = STONE; ctx.fillRect(px, py + 18, T, T - 18);
  ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.strokeRect(px + 1.5, py + 19.5, T - 3, T - 3 - 18);
  // ressort
  ctx.strokeStyle = '#ff5fa2'; ctx.lineWidth = 3;
  ctx.beginPath(); for (let i = 0; i < 5; i++) ctx.lineTo(px + T / 2 + (i % 2 ? 6 : -6), py + 18 - i * (2.6 - sq)); ctx.stroke();
  const cy = py + 6 + sq * 5;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(px + 7, cy + 2, 6.5, Math.PI * 0.5, Math.PI * 1.6); ctx.arc(px + 16, cy - 2, 8.5, Math.PI * 1.1, Math.PI * 1.9); ctx.arc(px + 25, cy + 2, 6.5, Math.PI * 1.4, Math.PI * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ell(ctx, px + 12, cy - 3, 3, 1.5, 'rgba(255,190,220,0.8)');
};

Art.door = function (ctx, px, py, role, glow, t) {
  const c = COLORS[role];
  ctx.save();
  // cadre de pierre
  ctx.fillStyle = STONE; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(px - 6, py + 64); ctx.lineTo(px - 6, py + 12); ctx.arc(px + 16, py + 12, 22, Math.PI, 0); ctx.lineTo(px + 38, py + 64); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (glow) { ctx.shadowColor = c.main; ctx.shadowBlur = 22 + Math.sin(t * 6) * 6; }
  ctx.fillStyle = glow ? c.light : '#2a1b2c';
  ctx.beginPath(); ctx.moveTo(px + 1, py + 64); ctx.lineTo(px + 1, py + 14); ctx.arc(px + 16, py + 14, 15, Math.PI, 0); ctx.lineTo(px + 31, py + 64); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0; ctx.stroke();
  // symbole lumineux
  ctx.shadowColor = c.main; ctx.shadowBlur = 12;
  if (role === 'pink') Art.heart(ctx, px + 16, py + 30, 18, glow ? '#ff4f8b' : c.main);
  else { const col = glow ? '#2f6fc0' : c.main; ell(ctx, px + 16, py + 32, 5.5, 5, col); for (const [dx, dy] of [[-7, -6], [-2.5, -9.5], [2.5, -9.5], [7, -6]]) ell(ctx, px + 16 + dx, py + 32 + dy, 2, 2.3, col); }
  ctx.restore();
};

Art.lever = function (ctx, px, py, on, col) {
  ctx.save();
  ctx.translate(px + 16, py + 27); ctx.rotate(on ? 0.65 : -0.65);
  ctx.fillStyle = '#d8d0e0'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.fillRect(-2, -20, 4, 20); ctx.strokeRect(-2, -20, 4, 20);
  ell(ctx, 0, -21, 5, 5, col, OUT, 2.5);
  ctx.restore();
  ctx.fillStyle = STONE; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(px + 4, py + 32); ctx.lineTo(px + 9, py + 22); ctx.lineTo(px + 23, py + 22); ctx.lineTo(px + 28, py + 32); ctx.closePath(); ctx.fill(); ctx.stroke();
};

Art.button = function (ctx, px, py, pressed, col) {
  const h = pressed ? 2 : 6;
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  if (!pressed) { ctx.shadowColor = col; ctx.shadowBlur = 10; }
  ctx.fillStyle = col; Art.roundRect(ctx, px + 7, py + 30 - h, 18, h + 2, 3); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
  ctx.fillStyle = '#e8e2ee'; Art.roundRect(ctx, px + 2, py + 28, 28, 5, 2); ctx.fill(); ctx.stroke();
  ctx.restore();
};

// Plateformes mobiles : pierre à contour noir + bande colorée (comme les ascenseurs de l'original)
Art.platform = function (ctx, x, y, w, h, col) {
  ctx.save();
  ctx.fillStyle = '#e9e3ee'; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  Art.roundRect(ctx, x + 1.5, y + 1.5, w - 3, h - 3, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8;
  if (w >= h) Art.roundRect(ctx, x + 8, y + h / 2 - 4, w - 16, 8, 3); else Art.roundRect(ctx, x + w / 2 - 4, y + 8, 8, h - 16, 3);
  ctx.fill(); ctx.shadowBlur = 0; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
};

// Nuage fragile (tremble, disparaît, revient)
Art.fragile = function (ctx, px, py, state, timer, t) {
  ctx.save();
  let dx = 0, a = 1;
  if (state === 'shake') dx = Math.sin(t * 60) * 2;
  if (state === 'gone') a = timer < 0.6 ? 0.35 : 0.12;
  ctx.globalAlpha = a; ctx.translate(px + dx, py);
  ctx.fillStyle = state === 'shake' ? '#ffe0ee' : '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(3, 24); ctx.arc(8, 16, 7, Math.PI * 0.6, Math.PI * 1.45); ctx.arc(16, 9, 8, Math.PI * 1.15, Math.PI * 1.85); ctx.arc(24, 16, 7, Math.PI * 1.55, Math.PI * 0.4);
  ctx.closePath(); ctx.fill();
  if (state === 'gone') ctx.setLineDash([4, 4]);
  ctx.stroke();
  if (state !== 'gone') { ctx.strokeStyle = 'rgba(200,120,170,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(12, 14); ctx.lineTo(15, 18); ctx.lineTo(13, 22); ctx.stroke(); }
  ctx.restore();
};


// Faux mur (passage secret) : identique à un bloc… avec une petite paillette de temps en temps
Art.fakeWall = function (ctx, px, py, seen, grid, x, y) {
  const at = (xx, yy) => (yy >= 0 && yy < grid.length && xx >= 0 && xx < grid[0].length ? grid[yy][xx] : '#');
  const sol = (xx, yy) => '#fgcJw/\\'.includes(at(xx, yy));
  ctx.save();
  ctx.globalAlpha = seen ? 0.3 : 1;
  ctx.fillStyle = STONE; ctx.fillRect(px, py, T, T);
  if (!sol(x, y - 1)) { ctx.fillStyle = STONE_L; ctx.fillRect(px, py + 2, T, 5); }
  if (!sol(x, y + 1)) { ctx.fillStyle = STONE_D; ctx.fillRect(px, py + T - 6, T, 6); }
  ctx.strokeStyle = OUT; ctx.lineWidth = 3; if (seen) ctx.setLineDash([5, 5]);
  ctx.beginPath();
  if (!sol(x, y - 1)) { ctx.moveTo(px, py + 1.5); ctx.lineTo(px + T, py + 1.5); }
  if (!sol(x, y + 1)) { ctx.moveTo(px, py + T - 1.5); ctx.lineTo(px + T, py + T - 1.5); }
  if (!sol(x - 1, y)) { ctx.moveTo(px + 1.5, py); ctx.lineTo(px + 1.5, py + T); }
  if (!sol(x + 1, y)) { ctx.moveTo(px + T - 1.5, py); ctx.lineTo(px + T - 1.5, py + T); }
  ctx.stroke(); ctx.restore();
  const tw = (performance.now() / 1000 + x * 1.7 + y * 2.3) % 6;
  if (!seen && tw < 0.35) { ctx.save(); ctx.globalAlpha = 0.9 * Math.sin(tw / 0.35 * Math.PI); Art.sparkle(ctx, px + 22, py + 10, 4, '#fff'); ctx.restore(); }
};

// Nuage grognon (tourelle) qui crache des boules d'orage
Art.turret = function (ctx, px, py, dir, t, phase) {
  ctx.save(); ctx.translate(px + 16, py + 16);
  const warn = phase > 0.8;
  const sc = 1 + (warn ? Math.sin(t * 40) * 0.05 : 0);
  ctx.scale(sc, sc);
  const a = { r: 0, d: Math.PI / 2, l: Math.PI, u: -Math.PI / 2 }[dir];
  // canon
  ctx.save(); ctx.rotate(a); ctx.fillStyle = '#4a3a5a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  Art.roundRect(ctx, 8, -6, 14, 12, 3); ctx.fill(); ctx.stroke(); ctx.restore();
  // nuage
  ctx.fillStyle = warn ? '#8a6aa8' : '#6d5a86'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(-8, 3, 9, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(0, -6, 11, Math.PI, Math.PI * 2); ctx.arc(9, 3, 9, Math.PI * 1.5, Math.PI * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  // yeux fâchés
  ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-2, -3); ctx.moveTo(8, -6); ctx.lineTo(2, -3); ctx.stroke();
  ell(ctx, -5, 0, 2, 2.4, '#fff3a0'); ell(ctx, 5, 0, 2, 2.4, '#fff3a0');
  ctx.beginPath(); ctx.arc(0, 8, 3, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  ctx.restore();
};

Art.shot = function (ctx, x, y, t) {
  ctx.save(); ctx.shadowColor = '#ffe066'; ctx.shadowBlur = 10;
  ell(ctx, x, y, 6, 6, '#ffd84d', OUT, 2);
  ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x - 2, y - 3); ctx.lineTo(x + 1, y); ctx.lineTo(x - 1, y + 1); ctx.lineTo(x + 2, y + 4); ctx.stroke();
  ctx.restore();
};

// Gelée de réglisse grincheuse qui patrouille
Art.gelee = function (ctx, px, py, t, dir) {
  const sq = Math.sin(t * 8) * 2;
  ctx.save(); ctx.translate(px + 16, py + 32);
  ctx.fillStyle = 'rgba(70,30,80,0.92)'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-13 - sq / 2, 0); ctx.quadraticCurveTo(-14, -20 - sq, 0, -22 - sq); ctx.quadraticCurveTo(14, -20 - sq, 13 + sq / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ell(ctx, -5, -15 - sq, 3, 2, 'rgba(255,255,255,0.35)');
  const ex = dir > 0 ? 2 : -2;
  ell(ctx, -4 + ex, -11 - sq / 2, 2.6, 3, '#fff'); ell(ctx, 4 + ex, -11 - sq / 2, 2.6, 3, '#fff');
  ell(ctx, -4 + ex * 1.4, -10 - sq / 2, 1.2, 1.5, OUT); ell(ctx, 4 + ex * 1.4, -10 - sq / 2, 1.2, 1.5, OUT);
  ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-7 + ex, -16 - sq / 2); ctx.lineTo(-2 + ex, -14 - sq / 2); ctx.moveTo(7 + ex, -16 - sq / 2); ctx.lineTo(2 + ex, -14 - sq / 2); ctx.stroke();
  ctx.restore();
};

// Bulle d'émote
Art.bubble = function (ctx, x, y, text) {
  ctx.save();
  const emojiOnly = /^\p{Extended_Pictographic}/u.test(text) && text.length <= 3;
  ctx.font = emojiOnly ? '24px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif' : 'bold 13px "Fredoka", "Trebuchet MS", sans-serif';
  const w = Math.max(34, ctx.measureText(text).width + 16), h = emojiOnly ? 34 : 24;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#d7a6e8'; ctx.lineWidth = 2;
  Art.roundRect(ctx, x - w / 2, y - h, w, h, 10); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 5, y - 1); ctx.lineTo(x, y + 6); ctx.lineTo(x + 5, y - 1); ctx.fill();
  ctx.fillStyle = '#5a3a6a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - h / 2 + 1);
  ctx.restore();
};
