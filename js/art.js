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
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.stroke(); }
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
  if (opts.dead) { ctx.rotate(Math.PI / 2 * face); ctx.globalAlpha = 0.8; }
  const bob = air ? -1 : Math.abs(Math.sin(walk)) * -1.5;
  const ol = c.dark;

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
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#d9c6ee'; ctx.lineWidth = 1.5;
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
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#e6c8ff';
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

Art.background = function (ctx, W, H, t, seed) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#ffd3ea'); g.addColorStop(0.5, '#e9dcff'); g.addColorStop(1, '#cfeaff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // arc-en-ciel
  ctx.save(); ctx.globalAlpha = 0.22;
  const rb = ['#ff7fb0', '#ffb38a', '#ffe08a', '#a8ecb0', '#8fd3ff', '#c8a8ff'];
  rb.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(W * 0.7, H * 0.95, 360 - i * 14, Math.PI, Math.PI * 2); ctx.stroke(); });
  ctx.restore();
  // étoiles scintillantes
  for (let i = 0; i < 28; i++) {
    const sx = (i * 137.5 + (seed || 0) * 50) % W, sy = (i * 71.3) % (H * 0.7);
    const a = 0.3 + 0.5 * Math.max(0, Math.sin(t * 2 + i));
    ctx.globalAlpha = a; Art.sparkle(ctx, sx, sy, 3 + (i % 3), '#fff');
  }
  ctx.globalAlpha = 1;
  // nuages
  for (let i = 0; i < 7; i++) {
    const sp = 6 + (i % 3) * 5;
    const cx = ((i * 190 + t * sp) % (W + 200)) - 100;
    Art.cloud(ctx, cx, 60 + (i * 83) % (H * 0.75), 0.8 + (i % 3) * 0.35, 0.55);
  }
  // licornes qui volent au loin
  for (let i = 0; i < 2; i++) {
    const per = 26 + i * 9;
    const p = ((t + i * 13) % per) / per;
    const ux = -150 + p * (W + 300);
    const uy = 90 + i * 170 + Math.sin(t * 1.5 + i) * 18;
    Art.unicorn(ctx, ux, uy, 60, t + i, 1, 0.45);
  }
};

// Pré-rendu des tuiles d'un niveau
Art.tileLayer = function (grid, T) {
  const H = grid.length, W = grid[0].length;
  const cv = document.createElement('canvas'); cv.width = W * T; cv.height = H * T;
  const ctx = cv.getContext('2d');
  const solid = (x, y) => y >= 0 && y < H && x >= 0 && x < W && '#fgcJ'.includes(grid[y][x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ch = grid[y][x];
    if (!solid(x, y) || ch === 'J') continue;
    const px = x * T, py = y * T;
    // bloc de base
    const border = x === 0 || y === 0 || x === W - 1 || y === H - 1;
    ctx.fillStyle = border ? '#cdb6f0' : '#d8c4f6';
    ctx.fillRect(px, py, T, T);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    if ((x + y) % 2 === 0) { ell(ctx, px + 9, py + 20, 2.5, 2.5, 'rgba(255,255,255,0.35)'); ell(ctx, px + 23, py + 12, 2, 2, 'rgba(255,255,255,0.35)'); }
    else ell(ctx, px + 16, py + 17, 2.5, 2.5, 'rgba(255,255,255,0.3)');
    ctx.strokeStyle = 'rgba(160,130,215,0.35)'; ctx.lineWidth = 1;
    if (!solid(x, y + 1)) { ctx.beginPath(); ctx.moveTo(px, py + T - 0.5); ctx.lineTo(px + T, py + T - 0.5); ctx.stroke(); }
    if (!solid(x - 1, y)) { ctx.beginPath(); ctx.moveTo(px + 0.5, py); ctx.lineTo(px + 0.5, py + T); ctx.stroke(); }
    if (!solid(x + 1, y)) { ctx.beginPath(); ctx.moveTo(px + T - 0.5, py); ctx.lineTo(px + T - 0.5, py + T); ctx.stroke(); }
    // glaçage nuage sur le dessus
    if (!solid(x, y - 1) && ch === '#') {
      ctx.fillStyle = '#fff7fc';
      ctx.fillRect(px, py, T, 6);
      for (let k = 0; k < 4; k++) ell(ctx, px + 4 + k * 8, py + 6, 4.2, 3.4, '#fff7fc');
      ell(ctx, px + 8, py + 2, 2, 1, ['#ff9fd0', '#8fd3ff', '#ffd98a', '#a8ecb0'][(x * 7 + y) % 4]);
    }
  }
  return cv;
};

// Liquides animés (dessinés par-dessus le pré-rendu)
Art.pool = function (ctx, kind, px, py, T, t, x) {
  const depth = 13;
  if (kind === 'f') { // sirop de fraise
    const g = ctx.createLinearGradient(0, py, 0, py + depth); g.addColorStop(0, '#ff7fb3'); g.addColorStop(1, '#e8336f');
    ctx.fillStyle = g;
  } else if (kind === 'g') { // barbe à papa bleue
    const g = ctx.createLinearGradient(0, py, 0, py + depth); g.addColorStop(0, '#a9ddff'); g.addColorStop(1, '#4fa8f0');
    ctx.fillStyle = g;
  } else { // chocolat fondu
    const g = ctx.createLinearGradient(0, py, 0, py + depth); g.addColorStop(0, '#9a5d3f'); g.addColorStop(1, '#5c3322');
    ctx.fillStyle = g;
  }
  ctx.beginPath(); ctx.moveTo(px, py + depth);
  for (let i = 0; i <= 8; i++) { const xx = px + i * T / 8; ctx.lineTo(xx, py + 3 + Math.sin(t * 3 + (x * 8 + i) * 0.8) * 2); }
  ctx.lineTo(px + T, py + depth); ctx.closePath(); ctx.fill();
  if (kind === 'g') { for (let k = 0; k < 3; k++) ell(ctx, px + 6 + k * 10, py + 4 + Math.sin(t * 2 + x + k) * 1.5, 5, 4, 'rgba(220,240,255,0.85)'); }
  if (kind === 'f') { const b = (t * 0.8 + x * 0.37) % 1; ell(ctx, px + 8 + (x * 13) % 16, py + 10 - b * 8, 1.6, 1.6, 'rgba(255,220,235,' + (1 - b) + ')'); ell(ctx, px + 4, py + 6, 3, 1, 'rgba(255,255,255,0.5)'); }
  if (kind === 'c') { ell(ctx, px + 10, py + 6, 4, 1.2, 'rgba(255,220,190,0.3)'); }
};

Art.bounce = function (ctx, px, py, T, t, squash) {
  const sq = squash || 0;
  ctx.save(); ctx.translate(px + T / 2, py + T);
  ctx.strokeStyle = '#ff7fb0'; ctx.lineWidth = 2.5;
  ctx.beginPath(); for (let i = 0; i < 5; i++) { ctx.lineTo((i % 2 ? 6 : -6), -4 - i * (3 - sq)); } ctx.stroke();
  ctx.restore();
  const cy = py + 10 + sq * 4;
  ctx.fillStyle = '#fff';
  for (const [dx, r] of [[-9, 7], [0, 9], [9, 7]]) { ctx.beginPath(); ctx.arc(px + T / 2 + dx, cy, r, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = '#ffc2e2'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px + T / 2, cy, 9, Math.PI, 0); ctx.stroke();
};

Art.door = function (ctx, px, py, role, glow, t) {
  // px,py = coin haut-gauche de la porte (32 x 64)
  const c = COLORS[role];
  ctx.save();
  if (glow) { ctx.shadowColor = c.main; ctx.shadowBlur = 18 + Math.sin(t * 6) * 6; }
  ctx.fillStyle = c.dark;
  ctx.beginPath(); ctx.moveTo(px - 2, py + 64); ctx.lineTo(px - 2, py + 14); ctx.arc(px + 16, py + 14, 18, Math.PI, 0); ctx.lineTo(px + 34, py + 64); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = glow ? c.light : c.main;
  ctx.beginPath(); ctx.moveTo(px + 3, py + 64); ctx.lineTo(px + 3, py + 15); ctx.arc(px + 16, py + 15, 13, Math.PI, 0); ctx.lineTo(px + 29, py + 64); ctx.closePath(); ctx.fill();
  if (role === 'pink') Art.heart(ctx, px + 16, py + 22, 14, '#ff4f8b');
  else { ell(ctx, px + 16, py + 24, 5, 4.5, '#2f5f9f'); for (const [dx, dy] of [[-6, -5], [-2, -8], [2, -8], [6, -5]]) ell(ctx, px + 16 + dx, py + 24 + dy, 1.8, 2, '#2f5f9f'); }
  ell(ctx, px + 24, py + 44, 2, 2, '#ffd34d');
  ctx.restore();
};

Art.lever = function (ctx, px, py, on, col) {
  // px,py = tuile où se trouve le levier (debout dessus)
  ctx.save();
  Art.roundRect(ctx, px + 6, py + 24, 20, 8, 3); ctx.fillStyle = '#9b86c9'; ctx.fill();
  ctx.translate(px + 16, py + 26); ctx.rotate(on ? 0.6 : -0.6);
  ctx.fillStyle = '#e8e0f5'; ctx.fillRect(-1.5, -18, 3, 18);
  ell(ctx, 0, -19, 4.5, 4.5, col, '#fff', 1.5);
  ctx.restore();
};

Art.button = function (ctx, px, py, pressed, col) {
  const h = pressed ? 2 : 5;
  ctx.fillStyle = '#9b86c9'; Art.roundRect(ctx, px + 3, py + 28, 26, 4, 2); ctx.fill();
  ctx.fillStyle = col; Art.roundRect(ctx, px + 6, py + 28 - h, 20, h + 1, 2); ctx.fill();
};

Art.platform = function (ctx, x, y, w, h, col) {
  ctx.save();
  Art.roundRect(ctx, x, y, w, h, 6); ctx.fillStyle = col; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = -h; i < w; i += 14) { ctx.beginPath(); ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + 7, y + h); ctx.lineTo(x + i + 7 + h, y); ctx.lineTo(x + i + h, y); ctx.fill(); }
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
