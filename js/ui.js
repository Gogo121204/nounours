// Mini-système de boutons dessinés dans le canvas (immédiat)
const UI = {
  hits: [], mx: -1, my: -1,
  begin() { this.hits = []; },
  btn(ctx, x, y, w, h, label, cb, opts = {}) {
    const hover = this.mx >= x && this.mx <= x + w && this.my >= y && this.my <= y + h && !opts.disabled;
    ctx.save();
    const col = opts.disabled ? '#d9d2e3' : (opts.color || '#ff8fc6');
    ctx.shadowColor = 'rgba(150,80,160,0.25)'; ctx.shadowBlur = hover ? 12 : 6; ctx.shadowOffsetY = 3;
    Art.roundRect(ctx, x, y - (hover ? 2 : 0), w, h, Math.min(16, h / 2));
    ctx.fillStyle = col; ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = opts.disabled ? '#9a8fa8' : (opts.textColor || '#fff');
    ctx.font = `bold ${opts.size || 17}px "Fredoka","Trebuchet MS",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (!opts.disabled && !opts.textColor) { ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(160,60,120,0.35)'; ctx.strokeText(label, x + w / 2, y + h / 2 - (hover ? 2 : 0) + 1); }
    ctx.fillText(label, x + w / 2, y + h / 2 - (hover ? 2 : 0) + 1);
    ctx.restore();
    if (!opts.disabled && cb) this.hits.push({ x, y, w, h, cb });
    return hover;
  },
  click(x, y) {
    const list = this.hits.slice().reverse();
    for (const h of list) if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) { Sfx.play('click'); h.cb(); return true; }
    return false;
  },
  panel(ctx, x, y, w, h, alpha) {
    ctx.save(); ctx.fillStyle = `rgba(255,255,255,${alpha == null ? 0.88 : alpha})`;
    ctx.shadowColor = 'rgba(150,80,160,0.25)'; ctx.shadowBlur = 16;
    Art.roundRect(ctx, x, y, w, h, 22); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = '#f0c6ea'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
  },
  text(ctx, s, x, y, size, col, align, bold = true) {
    ctx.save(); ctx.font = `${bold ? 'bold ' : ''}${size}px "Fredoka","Trebuchet MS",sans-serif`;
    ctx.fillStyle = col || '#7a3f8e'; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  },
  title(ctx, s, x, y, size) {
    ctx.save(); ctx.font = `bold ${size || 40}px "Fredoka","Trebuchet MS",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.strokeText(s, x, y);
    const g = ctx.createLinearGradient(x - 200, 0, x + 200, 0);
    g.addColorStop(0, '#ff6fae'); g.addColorStop(0.5, '#b07cf0'); g.addColorStop(1, '#5aa8f0');
    ctx.fillStyle = g; ctx.fillText(s, x, y); ctx.restore();
  },
  wrap(ctx, s, x, y, maxW, lh, size, col) {
    ctx.save(); ctx.font = `bold ${size}px "Fredoka","Trebuchet MS",sans-serif`;
    const words = s.split(' '); let line = ''; const lines = [];
    for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line); ctx.restore();
    lines.forEach((l, i) => UI.text(ctx, l, x, y + i * lh, size, col));
    return lines.length;
  },
};
