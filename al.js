// Arcade Lab: player nickname, return code, leaderboard and play counter.
// Paste your Google Apps Script web app URL (ends with /exec) between the quotes.
// Leave it empty to switch these features off (the site still works).
window.AL_API = window.AL_API || '';

(function () {
  var GAMES = ['neonrunner', 'skyhop', 'neonblaster', 'neonstack', 'neonmaze', 'fistnight', 'neondash', 'neonrail'];
  var NL = 16, KEY = 'al_player';
  function api() { return window.AL_API || ''; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function player() { try { return JSON.parse(ls(KEY) || 'null'); } catch (e) { return null; } }
  function setPlayer(p) { ls(KEY, p ? JSON.stringify({nick: p.nick, code: p.code}) : null); }
  function save(id) { try { return JSON.parse(ls(id + '_story') || 'null') || {u: 0, s: [], best: 0, done: false}; } catch (e) { return {u: 0, s: [], best: 0, done: false}; } }
  function localProg() {
    var out = {};
    GAMES.forEach(function (g) {
      var sv = save(g), s = [];
      for (var i = 0; i < NL; i++) s.push(Math.max(0, Math.min(3, (sv.s && sv.s[i]) | 0)));
      if (s.some(function (x) { return x > 0; })) out[g] = {s: s, d: !!sv.done};
    });
    return out;
  }
  function applyProg(prog) {
    if (!prog) return;
    GAMES.forEach(function (g) {
      var v = prog[g]; if (!v || !v.s) return;
      var sv = save(g), s = sv.s || [], last = -1;
      for (var i = 0; i < NL; i++) { s[i] = Math.max(s[i] | 0, v.s[i] | 0); if (s[i] > 0) last = i; }
      sv.s = s; sv.u = Math.min(NL - 1, Math.max(sv.u | 0, last + 1)); sv.done = !!(sv.done || v.d);
      ls(g + '_story', JSON.stringify(sv));
    });
  }
  function call(params, post) {
    var url = api();
    if (!url || !window.fetch) return Promise.reject(new Error('off'));
    var req = post
      ? fetch(url, {method: 'POST', body: JSON.stringify(params)})
      : fetch(url + '?' + Object.keys(params).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&'));
    return req.then(function (r) { return r.json(); });
  }
  var lastPlay = 0, syncing = null;
  window.AL = {
    GAMES: GAMES,
    enabled: function () { return !!api(); },
    player: player,
    fmtCode: function (c) { c = String(c || ''); return c.slice(0, 4) + '-' + c.slice(4); },
    register: function (nick) {
      return call({action: 'register', nick: nick, prog: localProg()}, true).then(function (r) { if (r.ok) { setPlayer(r); applyProg(r.prog); } return r; });
    },
    restore: function (code) {
      return call({action: 'restore', code: code}).then(function (r) {
        if (!r.ok) return r;
        setPlayer(r); applyProg(r.prog);
        return window.AL.sync();
      });
    },
    sync: function () {
      var p = player(); if (!p || !api()) return Promise.resolve({ok: false, err: 'off'});
      if (syncing) return syncing;
      syncing = call({action: 'sync', code: p.code, prog: localProg()}, true).then(function (r) {
        syncing = null;
        if (r.ok) { applyProg(r.prog); setPlayer(r); } else if (r.err === 'code') setPlayer(null);
        return r;
      }, function (e) { syncing = null; throw e; });
      return syncing;
    },
    logout: function () { setPlayer(null); },
    board: function (game) { var p = player(), q = {action: 'board', game: game || 'all'}; if (p) q.code = p.code; return call(q); },
    stats: function () { return call({action: 'stats'}); },
    play: function (game) {
      var now = Date.now(); if (now - lastPlay < 15000 || !api()) return;
      lastPlay = now;
      call({action: 'play', game: game}, true).catch(function () {});
    }
  };
})();
