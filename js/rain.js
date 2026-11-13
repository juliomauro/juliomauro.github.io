/*
 * Noir rain background.
 *
 * Only active when the noir theme is on (data-theme="noir"). Draws teal + magenta
 * rain streaks (same look as the Blade Runner mockup) on its own fixed canvas,
 * while the CSS hides #matrix-canvas in noir. Reacts to theme changes via a
 * MutationObserver, so switching to/from noir starts/stops it. Load with `defer`.
 */
(function () {
  'use strict';

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var canvas = null, ctx = null, W = 0, H = 0, drops = [], raf = null;

  function isNoir() {
    return document.documentElement.getAttribute('data-theme') === 'noir';
  }

  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'noir-rain';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
  }

  function size() {
    var dpr = window.devicePixelRatio || 1;
    W = canvas.width = window.innerWidth * dpr;
    H = canvas.height = window.innerHeight * dpr;
    var n = Math.min(160, Math.floor(window.innerWidth / 9));
    drops = [];
    for (var i = 0; i < n; i++) {
      drops.push({
        x: Math.random() * W,
        y: Math.random() * H,
        len: (8 + Math.random() * 24) * dpr,
        v: (3 + Math.random() * 7) * dpr,
        a: 0.05 + Math.random() * 0.15,
        mag: Math.random() < 0.22
      });
    }
  }

  function frame() {
    var dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      ctx.strokeStyle = d.mag ? 'rgba(255,46,136,' + d.a + ')' : 'rgba(55,205,212,' + d.a + ')';
      ctx.lineWidth = dpr;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x, d.y + d.len);
      ctx.stroke();
      d.y += d.v;
      if (d.y > H) { d.y = -d.len; d.x = Math.random() * W; }
    }
    raf = window.requestAnimationFrame(frame);
  }

  function start() {
    ensureCanvas();
    canvas.style.display = 'block';
    size();
    if (!reduce && raf === null) raf = window.requestAnimationFrame(frame);
  }

  function stop() {
    if (raf !== null) { window.cancelAnimationFrame(raf); raf = null; }
    if (canvas) {
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
  }

  function update() { if (isNoir()) start(); else stop(); }

  window.addEventListener('resize', function () { if (isNoir() && canvas) size(); });

  try {
    new MutationObserver(update).observe(document.documentElement, {
      attributes: true, attributeFilter: ['data-theme']
    });
  } catch (e) {}

  update();
})();
