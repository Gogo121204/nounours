// Petits sons synthétisés (aucun fichier audio)
const Sfx = (() => {
  let ac = null, master = null, musicOn = true, musicTimer = null, step = 0;
  function init() {
    if (ac) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0.35; master.connect(ac.destination);
    } catch (e) { ac = null; }
  }
  function tone(freq, dur, type, vol, slideTo, delay) {
    if (!ac) return;
    const t0 = ac.currentTime + (delay || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  const S = {
    init,
    play(name) {
      if (!ac) return;
      switch (name) {
        case 'jump': tone(330, 0.15, 'triangle', 0.18, 620); break;
        case 'bounce': tone(260, 0.3, 'sine', 0.25, 900); break;
        case 'collect': tone(988, 0.1, 'sine', 0.2); tone(1319, 0.18, 'sine', 0.2, null, 0.08); break;
        case 'rare': [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.2, 'sine', 0.2, null, i * 0.08)); break;
        case 'die': tone(500, 0.5, 'sawtooth', 0.12, 90); break;
        case 'lever': tone(220, 0.06, 'square', 0.12); tone(330, 0.06, 'square', 0.1, null, 0.05); break;
        case 'win': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, 'triangle', 0.2, null, i * 0.11)); break;
        case 'click': tone(700, 0.05, 'sine', 0.15); break;
        case 'emote': tone(880, 0.08, 'sine', 0.12, 1200); break;
        case 'bang': tone(150, 0.25, 'sawtooth', 0.3, 40); break;
        case 'dice': for (let i = 0; i < 5; i++) tone(300 + Math.random() * 400, 0.04, 'square', 0.06, null, i * 0.05); break;
        case 'hit': tone(420, 0.06, 'square', 0.12); break;
        case 'lose': tone(400, 0.25, 'triangle', 0.15, 200); tone(300, 0.35, 'triangle', 0.15, 150, 0.2); break;
      }
    },
    toggleMusic() { musicOn = !musicOn; if (!musicOn) S.stopMusic(); else S.startMusic(); return musicOn; },
    get musicOn() { return musicOn; },
    startMusic() {
      if (!ac || !musicOn || musicTimer) return;
      const chords = [[523, 659, 784], [440, 523, 659], [349, 440, 523], [392, 494, 587]];
      musicTimer = setInterval(() => {
        const ch = chords[Math.floor(step / 8) % 4];
        const n = ch[[0, 1, 2, 1, 2, 1, 0, 2][step % 8]];
        tone(n, 0.35, 'triangle', 0.045);
        if (step % 8 === 0) tone(ch[0] / 2, 1.2, 'sine', 0.05);
        if (step % 4 === 2) tone(n * 2, 0.15, 'sine', 0.02);
        step++;
      }, 220);
    },
    stopMusic() { clearInterval(musicTimer); musicTimer = null; },
  };
  return S;
})();
