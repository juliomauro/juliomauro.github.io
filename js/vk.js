/*
 * Voight-Kampff easter egg. Type KAMPFF on the home page.
 * Self-contained: injects its own CSS + overlay, runs an interactive empathy
 * test, closes on Esc or the terminate button. Noir palette. Load with defer.
 */
(function () {
  'use strict';

  var active = false, built = false, timers = [], keyHandler = null, state = null, analyzeT = null;

  var QUESTIONS = [
    { q: "You're in a desert. You see a tortoise on its back, baking in the sun. You're not helping it. Why?",
      a: ["I'd flip it over — no creature dies on my watch.", "It isn't my tortoise. Not my problem."], good: 0 },
    { q: "It's your birthday. Someone gives you a wallet made of calfskin.",
      a: ["I'd thank them, but the calf stays with me.", "A fine gift. Real leather lasts."], good: 0 },
    { q: "An old photograph: a mother holding her child. Tell me what you feel.",
      a: ["Something tightens in my chest. Memory does that.", "It's grain and silver. Just an image."], good: 0 }
  ];

  function T(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function IV(fn, ms) { var id = setInterval(fn, ms); timers.push(id); return id; }
  function clearAll() { timers.forEach(function (t) { clearTimeout(t); clearInterval(t); }); timers = []; }
  function el(id) { return document.getElementById(id); }

  var CSS = `
  #vk-overlay{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(120% 120% at 50% 35%, #0a1512 0%, #050b0a 70%, #020504 100%);
    opacity:0;pointer-events:none;transition:opacity .45s;padding:max(16px,env(safe-area-inset-left,0px));
    font-family:"Share Tech Mono",ui-monospace,monospace;color:#cfe3e4}
  #vk-overlay.active{opacity:1;pointer-events:auto}
  #vk-overlay.closing{opacity:0}
  #vk-overlay .vk-scan{position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;
    background:repeating-linear-gradient(0deg, rgba(0,0,0,.22) 0 1px, transparent 1px 3px)}
  #vk-overlay::after{content:"";position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(130% 120% at 50% 40%, transparent 58%, rgba(0,0,0,.6))}
  #vk-overlay.flash .vk-panel{animation:vkflash .5s steps(1) 3}
  @keyframes vkflash{50%{box-shadow:0 0 0 1px #ff3b30, 0 0 60px rgba(255,59,48,.45) inset}}
  .vk-panel{position:relative;z-index:2;width:min(880px,100%);max-height:92vh;overflow:auto;
    background:rgba(7,17,15,.88);border:1px solid rgba(55,205,212,.35);
    box-shadow:0 0 0 1px rgba(255,140,58,.12), 0 20px 80px rgba(0,0,0,.6);
    clip-path:polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))}
  .vk-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;
    border-bottom:1px solid rgba(55,205,212,.22);letter-spacing:.18em;font-size:12px;color:#37cdd4}
  .vk-head b{color:#6f8f91;font-weight:400}
  .vk-x{background:transparent;border:1px solid rgba(255,140,58,.35);color:#ff8c3a;font:inherit;font-size:11px;
    letter-spacing:.12em;padding:5px 10px;cursor:pointer;border-radius:2px;transition:.15s}
  .vk-x:hover{background:rgba(255,140,58,.14)}
  .vk-grid{display:grid;grid-template-columns:230px 1fr;gap:18px;padding:18px 16px}
  @media(max-width:620px){.vk-grid{grid-template-columns:1fr;justify-items:center}.vk-ro{width:100%}}

  .vk-eye{position:relative;width:200px;height:200px;border-radius:50%;flex:none;align-self:start;
    background:radial-gradient(circle at 50% 45%, #0b0805 0%, #050302 70%);
    box-shadow:0 0 0 1px rgba(255,140,58,.25), 0 0 40px rgba(255,140,58,.12), inset 0 0 40px #000;overflow:hidden}
  .vk-iris{position:absolute;inset:14%;border-radius:50%;display:flex;align-items:center;justify-content:center;
    background:
      radial-gradient(circle, rgba(0,0,0,0) 30%, rgba(10,6,3,.85) 72%),
      repeating-conic-gradient(from 0deg, #ff8c3a 0deg 2.5deg, #7a4210 2.5deg 5deg),
      radial-gradient(circle, #ffb866 0%, #b25e13 55%, #3a1e05 100%);
    box-shadow:inset 0 0 26px rgba(0,0,0,.85), 0 0 22px rgba(255,140,58,.35);
    animation:vkspin 22s linear infinite}
  @keyframes vkspin{to{transform:rotate(360deg)}}
  .vk-pupil{width:34%;height:34%;border-radius:50%;background:#000;
    box-shadow:0 0 18px rgba(255,140,58,.4), inset 0 0 8px #000;transition:width .5s ease,height .5s ease}
  .vk-sweep{position:absolute;left:0;right:0;height:2px;top:0;
    background:linear-gradient(90deg,transparent,rgba(56,205,212,.85),transparent);box-shadow:0 0 8px rgba(56,205,212,.7);
    animation:vksweep 2.6s linear infinite}
  @keyframes vksweep{0%{top:4%}100%{top:96%}}
  .vk-focus{position:absolute;left:50%;top:45%;width:5px;height:5px;margin:-3px 0 0 -3px;border-radius:50%;
    background:#ff3b30;box-shadow:0 0 10px #ff3b30;animation:vkblink 1.1s steps(1) infinite}
  @keyframes vkblink{50%{opacity:.25}}
  .vk-t{position:absolute;width:12px;height:12px;border:2px solid rgba(255,140,58,.7)}
  .vk-t.t1{top:8px;left:8px;border-right:0;border-bottom:0}.vk-t.t2{top:8px;right:8px;border-left:0;border-bottom:0}
  .vk-t.t3{bottom:8px;left:8px;border-right:0;border-top:0}.vk-t.t4{bottom:8px;right:8px;border-left:0;border-top:0}

  .vk-stats{display:flex;gap:18px;flex-wrap:wrap;font-size:11px;letter-spacing:.14em;color:#6f8f91;margin-bottom:10px}
  .vk-stats b{color:#ff8c3a;font-weight:400}
  .vk-stats .vk-prog{margin-left:auto;color:#37cdd4}
  .vk-log{min-height:66px;max-height:110px;overflow:auto;font-size:11.5px;line-height:1.5;color:#6f8f91;
    border-left:1px solid rgba(55,205,212,.2);padding-left:10px;margin-bottom:14px}
  .vk-ln.amb{color:#ffb866}.vk-ln.cy{color:#37cdd4}
  .vk-q{min-height:52px;font-size:15px;line-height:1.55;color:#eafff9;letter-spacing:.01em;margin-bottom:14px}
  .vk-ans{display:flex;flex-direction:column;gap:8px}
  .vk-opt{display:flex;align-items:center;gap:10px;text-align:left;width:100%;cursor:pointer;
    background:rgba(56,205,212,.04);border:1px solid rgba(55,205,212,.22);color:#cfe3e4;
    font:inherit;font-size:13px;letter-spacing:.02em;padding:10px 12px;border-radius:2px;transition:.15s}
  .vk-opt:hover,.vk-opt:focus-visible{border-color:#37cdd4;color:#fff;background:rgba(56,205,212,.1);outline:none}
  .vk-opt .k{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;flex:none;
    border:1px solid rgba(255,140,58,.4);color:#ff8c3a;font-size:11px;border-radius:2px}
  .vk-again{justify-content:center;margin-top:6px;border-color:rgba(255,140,58,.4);color:#ff8c3a}

  .vk-verdict{padding:14px 0 4px}
  .vk-vt{font-family:"Share Tech Mono",monospace;font-size:26px;letter-spacing:.06em}
  .vk-vs{font-size:12px;letter-spacing:.2em;color:#6f8f91;margin-top:4px}
  .vk-vq{margin-top:12px;font-size:13px;color:#ffb866;font-style:italic;max-width:48ch}
  .vk-verdict.human .vk-vt{color:#37cdd4;text-shadow:0 0 18px rgba(56,205,212,.5)}
  .vk-verdict.rep .vk-vt{color:#ff3b30;text-shadow:0 0 18px rgba(255,59,48,.5)}
  @media(prefers-reduced-motion:reduce){.vk-sweep,.vk-iris,.vk-focus{animation:none}}
  `;

  function build() {
    if (built) return;
    var st = document.createElement('style'); st.id = 'vk-style'; st.textContent = CSS; document.head.appendChild(st);
    var o = document.createElement('div'); o.id = 'vk-overlay';
    o.innerHTML =
      '<div class="vk-scan"></div>' +
      '<div class="vk-panel">' +
        '<div class="vk-head"><span>VOIGHT-KAMPFF <b>// TYRELL CORP-7</b></span><button class="vk-x" type="button">[ TERMINATE ]</button></div>' +
        '<div class="vk-grid">' +
          '<div class="vk-eye"><div class="vk-iris"><div class="vk-pupil"></div></div><div class="vk-sweep"></div><div class="vk-focus"></div><i class="vk-t t1"></i><i class="vk-t t2"></i><i class="vk-t t3"></i><i class="vk-t t4"></i></div>' +
          '<div class="vk-ro">' +
            '<div class="vk-stats"><span>BPM <b id="vk-bpm">64</b></span><span>FLUX <b id="vk-flux">0.00</b></span><span class="vk-prog" id="vk-prog">STANDBY</span></div>' +
            '<div class="vk-log" id="vk-log"></div>' +
            '<div class="vk-q" id="vk-q"></div>' +
            '<div class="vk-ans" id="vk-ans"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(o);
    o.querySelector('.vk-x').addEventListener('click', close);
    built = true;
  }

  function log(line, cls) { var L = el('vk-log'); if (!L) return; var d = document.createElement('div'); d.className = 'vk-ln' + (cls ? ' ' + cls : ''); d.textContent = line; L.appendChild(d); L.scrollTop = L.scrollHeight; }
  function type(node, text, cb) { node.textContent = ''; var i = 0; (function step() { if (i < text.length) { node.textContent += text.charAt(i++); T(step, 16); } else if (cb) cb(); })(); }
  function setPupil(p) { var e = document.querySelector('.vk-pupil'); if (e) { var s = Math.max(20, Math.min(64, p)); e.style.width = s + '%'; e.style.height = s + '%'; } }
  function beep(freq, dur) { try { var C = window.AudioContext || window.webkitAudioContext; if (!C) return; var ac = state.ac || (state.ac = new C()); var o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = freq; g.gain.value = 0.04; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur); o.stop(ac.currentTime + dur); } catch (e) {} }

  function start() {
    state = { score: 0, qi: 0, bpm: 64, pupil: 34, ac: null, answering: false };
    el('vk-log').innerHTML = ''; el('vk-q').textContent = ''; el('vk-ans').innerHTML = '';
    el('vk-prog').textContent = 'STANDBY'; el('vk-bpm').textContent = '64'; el('vk-flux').textContent = '0.00'; setPupil(34);
    IV(function () { state.bpm += (Math.random() * 4 - 2); state.bpm = Math.max(52, Math.min(140, state.bpm)); el('vk-bpm').textContent = Math.round(state.bpm); }, 700);
    IV(function () { if (!state.answering) setPupil(state.pupil + (Math.random() * 6 - 3)); }, 1200);
    T(function () { log('> CALIBRATING RETINAL SENSOR...'); beep(440, .08); }, 300);
    T(function () { log('> FOCUS ON THE RED DOT.', 'amb'); beep(520, .08); }, 1200);
    T(function () { ask(0); }, 2200);
  }

  function ask(i) {
    if (i >= QUESTIONS.length) return verdict();
    state.qi = i; state.answering = true;
    el('vk-prog').textContent = 'Q' + (i + 1) + '/' + QUESTIONS.length;
    var Q = QUESTIONS[i]; el('vk-ans').innerHTML = '';
    type(el('vk-q'), Q.q, function () {
      Q.a.forEach(function (txt, idx) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'vk-opt';
        b.innerHTML = '<span class="k">' + (idx + 1) + '</span><span>' + txt.replace(/</g, '&lt;') + '</span>';
        b.addEventListener('click', function () { answer(idx); });
        el('vk-ans').appendChild(b);
      });
    });
  }

  function answer(idx) {
    if (!state.answering) return; state.answering = false;
    var Q = QUESTIONS[state.qi]; el('vk-ans').innerHTML = '';
    if (idx === Q.good) {
      state.score++; state.pupil = Math.min(58, state.pupil + 10); setPupil(state.pupil); state.bpm += 6;
      log('  capillary dilation +0.' + (3 + (Math.random() * 4 | 0)) + ' — empathic response', 'cy'); beep(640, .09);
    } else {
      state.pupil = Math.max(22, state.pupil - 8); setPupil(state.pupil); state.bpm = Math.max(52, state.bpm - 2);
      log('  pupillary response: flat — no affect detected', 'amb'); beep(300, .12);
    }
    el('vk-flux').textContent = (Math.abs(state.score - (state.qi + 1) / 2) + Math.random()).toFixed(2);
    T(function () { ask(state.qi + 1); }, 900);
  }

  function verdict() {
    el('vk-q').textContent = ''; el('vk-ans').innerHTML = ''; el('vk-prog').textContent = 'ANALYZING';
    log('> ANALYZING RESPONSES...', 'amb');
    var seq = ['> cross-referencing baseline', '> blush response', '> fluctuation of the pupil', '> involuntary dilation of the iris'];
    var k = 0; analyzeT = IV(function () { if (k < seq.length) { log(seq[k++]); beep(500 + k * 40, .05); } }, 450);
    T(function () {
      clearInterval(analyzeT);
      var human = state.score >= 2;
      var box = document.createElement('div'); box.className = 'vk-verdict ' + (human ? 'human' : 'rep');
      if (human) {
        box.innerHTML = '<div class="vk-vt">BASELINE: HUMAN</div><div class="vk-vs">NO REPLICANT ANOMALIES DETECTED</div>';
        setPupil(34); beep(660, .2);
      } else {
        box.innerHTML = '<div class="vk-vt">ANOMALY DETECTED</div><div class="vk-vs">REPLICANT TRAITS PRESENT</div>' +
          '<div class="vk-vq">"All those moments will be lost in time, like tears in rain."</div>';
        el('vk-overlay').classList.add('flash'); setPupil(62); beep(120, .5);
      }
      el('vk-q').appendChild(box);
      var again = document.createElement('button'); again.type = 'button'; again.className = 'vk-opt vk-again'; again.textContent = '[ RUN AGAIN ]';
      again.addEventListener('click', function () { el('vk-overlay').classList.remove('flash'); clearAll(); start(); });
      el('vk-ans').appendChild(again);
    }, 2300);
  }

  function open() {
    if (active) return; active = true; build();
    if (window.goatcounter && window.goatcounter.count) { try { window.goatcounter.count({ path: 'egg-vk', title: 'Easter egg: Voight-Kampff', event: true }); } catch (e) {} }
    var o = el('vk-overlay'); o.classList.add('active');
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
    keyHandler = function (e) {
      if (e.key === 'Escape') { close(); return; }
      if (state && state.answering && (e.key === '1' || e.key === '2')) {
        var i = +e.key - 1, Q = QUESTIONS[state.qi]; if (i < Q.a.length) answer(i);
      }
    };
    document.addEventListener('keydown', keyHandler);
    start();
  }

  function close() {
    if (!active) return;
    var o = el('vk-overlay');
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
    clearAll();
    o.classList.add('closing');
    setTimeout(function () {
      o.classList.remove('active', 'closing', 'flash');
      active = false;
      try { document.body.style.overflow = ''; } catch (e) {}
      if (state && state.ac) { try { state.ac.close(); } catch (e) {} }
      state = null;
    }, 440);
  }

  // trigger: type KAMPFF
  var BUF = '';
  document.addEventListener('keydown', function (e) {
    if (active || !e.key || e.key.length !== 1) return;
    BUF = (BUF + e.key.toUpperCase()).slice(-6);
    if (BUF === 'KAMPFF') { BUF = ''; open(); }
  });
})();
