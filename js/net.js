// Réseau : PeerJS (en ligne, pair à pair) ou BroadcastChannel (?net=bc, pour tester dans 2 onglets)
const Net = (() => {
  const PREFIX = 'nounours-licornes-v1-';
  const handlers = {};
  let conn = null, peer = null, bc = null, role = null;
  const params = new URLSearchParams(location.search);
  const N = {
    isHost: false, connected: false,
    mode: params.get('net') === 'bc' ? 'bc' : 'peer',
    onConnect: null, onDisconnect: null,
  };
  const ICE = { iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ] };

  function deliver(msg) {
    if (!msg || !msg.type) return;
    if (msg.type === '__hello' && N.isHost && N.mode === 'bc') {
      if (!N.connected) { N.connected = true; N.send('__welcome', {}); N.onConnect && N.onConnect(); }
      return;
    }
    if (msg.type === '__welcome' && !N.isHost && N.mode === 'bc') {
      if (!N.connected) { N.connected = true; N.onConnect && N.onConnect(); }
      return;
    }
    if (msg.type === '__bye') { N.connected = false; N.onDisconnect && N.onDisconnect(); return; }
    const h = handlers[msg.type];
    if (h) h(msg.d || {});
  }

  N.on = (type, fn) => { handlers[type] = fn; };
  N.off = (type) => { delete handlers[type]; };
  N.send = (type, d) => {
    const msg = { type, d };
    if (N.mode === 'bc') { if (bc) bc.postMessage({ from: role, msg }); }
    else if (conn && conn.open) { try { conn.send(msg); } catch (e) { console.warn(e); } }
  };

  function setupConn() {
    conn.on('open', () => { N.connected = true; N.onConnect && N.onConnect(); });
    conn.on('data', deliver);
    conn.on('close', () => { N.connected = false; N.onDisconnect && N.onDisconnect(); });
    conn.on('error', (e) => console.warn('conn error', e));
  }

  function setupBC(code) {
    bc = new BroadcastChannel(PREFIX + code);
    bc.onmessage = (ev) => { if (ev.data && ev.data.from !== role) deliver(ev.data.msg); };
    window.addEventListener('beforeunload', () => N.send('__bye', {}));
  }

  N.makeCode = () => {
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let s = ''; for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
    return s;
  };

  N.host = (code, cb) => {
    N.isHost = true; role = 'host';
    if (N.mode === 'bc') { setupBC(code); cb({ ok: true }); return; }
    peer = new Peer(PREFIX + code, { debug: 1, config: ICE });
    peer.on('open', () => cb({ ok: true }));
    peer.on('connection', (c) => {
      if (conn && conn.open) { c.close(); return; }
      conn = c; setupConn();
    });
    peer.on('error', (e) => cb({ ok: false, err: e.type || String(e) }));
    peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) {} });
  };

  N.join = (code, cb) => {
    N.isHost = false; role = 'client';
    if (N.mode === 'bc') {
      setupBC(code); cb({ ok: true });
      const iv = setInterval(() => { if (N.connected) clearInterval(iv); else N.send('__hello', {}); }, 300);
      return;
    }
    peer = new Peer(undefined, { debug: 1, config: ICE });
    peer.on('open', () => { conn = peer.connect(PREFIX + code, { reliable: true }); setupConn(); cb({ ok: true }); });
    peer.on('error', (e) => cb({ ok: false, err: e.type || String(e) }));
  };

  return N;
})();
