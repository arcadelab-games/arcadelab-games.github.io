// Arcade Lab: big-screen helpers for every game page.
// 1) the game canvas fills the whole height of the window (no integer-step shrinking)
// 2) the empty sides are filled with a soft, blurred copy of the game ("ambient" background)
// 3) a FULL SCREEN button next to the ARCADE LAB link (computers only; phones already go full screen on tap)
(function () {
  var cv = document.querySelector('canvas');
  if (!cv) return;
  var W = cv.width, H = cv.height, LAND = W > H;
  var TOUCH = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
  var stage = document.getElementById('stage'); // Fist of the Night keeps its own layout

  // ---------- 1. fill the window height ----------
  function fit() {
    if (stage) return;
    var s = Math.min(innerWidth / W, innerHeight / H);
    cv.style.width = Math.floor(W * s) + 'px';
    cv.style.height = Math.floor(H * s) + 'px';
  }
  addEventListener('resize', function () { setTimeout(fit, 0); });
  document.addEventListener('fullscreenchange', function () { setTimeout(fit, 120); });
  fit(); setTimeout(fit, 300);

  // ---------- 2. ambient background ----------
  var amb = document.createElement('canvas');
  amb.width = 64; amb.height = 36;
  amb.setAttribute('aria-hidden', 'true');
  amb.style.cssText = 'position:fixed;inset:-6%;width:112%;height:112%;z-index:-1;pointer-events:none;opacity:.45;image-rendering:auto;filter:blur(28px) saturate(1.4)';
  document.body.insertBefore(amb, document.body.firstChild);
  document.body.style.position = 'relative'; document.body.style.background = 'transparent';
  var actx = amb.getContext('2d');
  actx.imageSmoothingEnabled = true;
  function sizeAmb() {
    var ar = innerWidth / Math.max(1, innerHeight);
    amb.width = Math.max(16, Math.round(36 * ar)); amb.height = 36;
  }
  addEventListener('resize', sizeAmb); sizeAmb();
  var last = 0;
  (function loop(t) {
    if (t - last > 66 && !document.hidden) {
      last = t;
      try {
        // cover the small canvas with the game picture; the browser smooths it up => blur for free
        var aw = amb.width, ah = amb.height, s = Math.max(aw / W, ah / H);
        actx.drawImage(cv, (aw - W * s) / 2, (ah - H * s) / 2, W * s, H * s);
      } catch (e) {}
    }
    requestAnimationFrame(loop);
  })(0);

  // ---------- 3. full screen button (computers) ----------
  var el = document.documentElement;
  if (TOUCH || !el.requestFullscreen || !document.fullscreenEnabled) return;
  var b = document.createElement('button');
  b.id = 'al-full'; b.type = 'button';
  b.setAttribute('aria-label', 'Full screen');
  b.style.cssText = 'position:fixed;top:max(8px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left));z-index:9;font:bold 12px/1 monospace;letter-spacing:1px;color:#2de2e6;background:rgba(0,0,0,.6);border:2px solid #2de2e6;padding:9px 10px;cursor:pointer';
  function label() { b.textContent = document.fullscreenElement ? '✖ EXIT FULL SCREEN' : '⤢ FULL SCREEN'; }
  label();
  b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  b.addEventListener('click', function (e) {
    e.stopPropagation();
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    else el.requestFullscreen({navigationUI: 'hide'}).catch(function () {});
    b.blur();
  });
  document.addEventListener('fullscreenchange', label);
  document.body.appendChild(b);
  // show it only in menus, like the ARCADE LAB link
  setInterval(function () {
    var menu = true;
    if (window.KIT) menu = KIT.mode === 'title' || KIT.mode === 'map' || KIT.mode === 'pause';
    else if (window.GAME && GAME.S) menu = GAME.S.mode === 'title' || GAME.S.mode === 'levels';
    b.style.display = menu ? 'block' : 'none';
  }, 250);
})();
