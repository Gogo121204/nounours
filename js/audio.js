// Sons et musiques synthétisés (aucun fichier audio)
const Sfx = (() => {
  let ac = null, sfxGain = null, musGain = null, musicOn = true, timer = null, track = 'calm', step = 0, nextT = 0;
  function init() {
    if (ac) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
      sfxGain = ac.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(master);
      musGain = ac.createGain(); musGain.gain.value = 0.55; musGain.connect(master);
    } catch (e) { ac = null; }
  }
  function tone(freq, dur, type, vol, slideTo, delay, out, attack) {
    if (!ac) return;
    const t0 = out === musGain ? delay : ac.currentTime + (delay || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    const a = attack || 0.01;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(out || sfxGain); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(dur, vol, freq, delay) {
    if (!ac) return;
    const t0 = ac.currentTime + (delay || 0);
    const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(freq || 1200, t0); f.frequency.exponentialRampToValueAtTime((freq || 1200) * 3, t0 + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(vol || 0.2, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain); src.start(t0);
  }
  const chime = (notes, gap, vol, type) => notes.forEach((f, i) => { tone(f, 0.35, type || 'sine', vol, null, i * gap); tone(f * 2, 0.2, 'sine', vol * 0.3, null, i * gap); });

  // --- musiques ---
  const TRACKS = {
    // calme, lent, notes au hasard dans une gamme douce : pas de boucle qui reste en tête
    calm: { tempo: 0.52, chords: [[262, 330, 392, 494], [220, 262, 330, 392], [175, 220, 262, 330], [196, 247, 294, 349], [165, 196, 247, 294], [175, 220, 262, 349]], bar: 8,
      play(s, t, ch) {
        if (s % this.bar === 0) for (const f of ch.slice(0, 3)) tone(f / 2, this.tempo * this.bar * 0.95, 'sine', 0.035, null, t, musGain, 0.8);
        if (Math.random() < 0.55) { const f = ch[Math.floor(Math.random() * ch.length)] * (Math.random() < 0.3 ? 2 : 1); tone(f, 1.4, 'triangle', 0.028, null, t, musGain, 0.04); }
        if (Math.random() < 0.08) tone(ch[0] * 4, 1.6, 'sine', 0.012, null, t, musGain, 0.02);
      } },
    // mini-jeux : plus rythmé et joueur
    mini: { tempo: 0.19, chords: [[392, 494, 587], [440, 523, 659], [349, 440, 523], [392, 494, 587], [330, 392, 494], [349, 440, 523], [294, 370, 440], [392, 494, 587]], bar: 8,
      play(s, t, ch) {
        const pat = [0, 2, 1, 2, 0, 2, 1, 2];
        if (s % 2 === 0) tone(ch[pat[s % 8]] , 0.16, 'square', 0.018, null, t, musGain);
        if (s % 4 === 0) tone(ch[0] / 2, 0.3, 'triangle', 0.05, null, t, musGain);
        if (s % 4 === 2) tone(ch[0] / 4 * 3, 0.15, 'triangle', 0.03, null, t, musGain);
        if (s % 16 === 14) tone(ch[2] * 2, 0.2, 'sine', 0.02, null, t, musGain);
      } },
    // grand final : fanfare douce
    final: { tempo: 0.3, chords: [[523, 659, 784], [440, 554, 659], [587, 740, 880], [523, 659, 784]], bar: 8,
      play(s, t, ch) {
        tone(ch[s % 3], 0.5, 'triangle', 0.03, null, t, musGain);
        if (s % 8 === 0) for (const f of ch) tone(f / 2, 2.2, 'sine', 0.025, null, t, musGain, 0.2);
      } },
  };
  function scheduler() {
    if (!ac) return;
    const tr = TRACKS[track];
    while (nextT < ac.currentTime + 0.25) {
      const ch = tr.chords[Math.floor(step / tr.bar) % tr.chords.length];
      tr.play(step, nextT, ch);
      nextT += tr.tempo; step++;
    }
  }

  const S = {
    init,
    play(name) {
      if (!ac) return;
      switch (name) {
        case 'jump': tone(300, 0.14, 'triangle', 0.13, 560); noise(0.08, 0.05, 2500); break;
        case 'land': noise(0.07, 0.08, 400); break;
        case 'bounce': tone(220, 0.35, 'sine', 0.25, 880); tone(440, 0.3, 'triangle', 0.08, 1320, 0.05); break;
        case 'collect': chime([1047, 1319, 1568], 0.06, 0.16); break;
        case 'rare': chime([784, 988, 1175, 1568, 1976], 0.08, 0.17); noise(0.6, 0.05, 5000, 0.1); break;
        case 'die': tone(520, 0.45, 'triangle', 0.15, 130); tone(390, 0.5, 'sine', 0.1, 100, 0.08); break;
        case 'lever': tone(180, 0.05, 'square', 0.1); tone(360, 0.08, 'square', 0.08, null, 0.05); noise(0.05, 0.06, 3000); break;
        case 'press': tone(260, 0.08, 'sine', 0.15, 200); break;
        case 'door': chime([659, 880], 0.08, 0.12, 'triangle'); break;
        case 'win': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i === 6 ? 0.7 : 0.22, 'triangle', 0.17, null, i * 0.1)); break;
        case 'fanfare': [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => { tone(f, 0.3, 'square', 0.06, null, i * 0.12); tone(f, 0.3, 'triangle', 0.12, null, i * 0.12); }); break;
        case 'rank': chime([1319, 1568, 2093], 0.09, 0.15); break;
        case 'coin': tone(1568, 0.08, 'sine', 0.1); tone(2093, 0.12, 'sine', 0.1, null, 0.05); break;
        case 'buy': chime([784, 1047, 1319, 1568], 0.06, 0.15); break;
        case 'click': tone(700, 0.05, 'sine', 0.12); break;
        case 'emote': tone(880, 0.08, 'sine', 0.1, 1200); break;
        case 'whoosh': noise(0.55, 0.12, 300); break;
        case 'bang': noise(0.3, 0.35, 200); tone(120, 0.25, 'sawtooth', 0.15, 40); break;
        case 'tick': tone(1000, 0.04, 'sine', 0.1); break;
        case 'dice': for (let i = 0; i < 6; i++) { noise(0.03, 0.08, 1500, i * 0.05); tone(300 + Math.random() * 400, 0.03, 'square', 0.04, null, i * 0.05); } break;
        case 'hit': tone(420, 0.06, 'square', 0.08); noise(0.04, 0.06, 2000); break;
        case 'goal': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'square', 0.07, null, i * 0.07)); break;
        case 'lose': tone(440, 0.3, 'triangle', 0.14, 330); tone(330, 0.5, 'triangle', 0.14, 220, 0.28); break;
      }
    },
    setTrack(name) {
      if (!TRACKS[name] || name === track) return;
      track = name; step = 0; if (ac) nextT = ac.currentTime + 0.3;
    },
    toggleMusic() { musicOn = !musicOn; if (!musicOn) S.stopMusic(); else S.startMusic(); return musicOn; },
    get musicOn() { return musicOn; },
    startMusic() {
      if (!ac || !musicOn || timer) return;
      nextT = ac.currentTime + 0.1;
      timer = setInterval(scheduler, 80);
    },
    stopMusic() { clearInterval(timer); timer = null; },
  };
  return S;
})();
