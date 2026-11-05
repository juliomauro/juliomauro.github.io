/*
 * Theme and language pickers for the nav (same look as Stacklog).
 *
 * Turns the #theme-btn and #lang-btn cycle buttons into buttons that open a
 * list to pick from. It reuses each page's own code to apply the choice:
 * applyLang(lang) on the home, projects and writing index pages, setLang(lang)
 * on the posts. Load it with `defer` so it runs after the page's scripts.
 */
(function () {
  'use strict';

  var THEMES = ['blue', 'green', 'amber', 'light'];
  var NAMES = {
    en: { blue: 'Blue', green: 'Green', amber: 'Amber', light: 'Light', en: 'English', pt: 'Português', theme: 'Theme', lang: 'Language' },
    pt: { blue: 'Azul', green: 'Verde', amber: 'Âmbar', light: 'Claro', en: 'English', pt: 'Português', theme: 'Tema', lang: 'Idioma' }
  };
  // background color with the text color in the corner, as each theme shows it
  var SWATCH = {
    blue: 'linear-gradient(135deg, #000308 58%, #00b4ff 58%)',
    green: 'linear-gradient(135deg, #000300 58%, #00ff41 58%)',
    amber: 'linear-gradient(135deg, #020100 58%, #ff8c00 58%)',
    light: 'linear-gradient(135deg, #f5f2eb 58%, #1a5c3a 58%)'
  };

  var themeBtn = document.getElementById('theme-btn');
  var langBtn = document.getElementById('lang-btn');
  if (!themeBtn || !langBtn) return;

  var css = '' +
    '.nav-controls { gap: 10px; }' +
    '.nav-controls .theme-toggle { font-size: 12px; padding: 8px 16px; border-radius: 6px;' +
    '  color: var(--green); border-color: var(--green-mid); transition: background-color 0.2s; }' +
    '.pk-wrap { position: relative; display: inline-flex; }' +
    '.pk-menu { position: absolute; top: calc(100% + 6px); right: 0; z-index: 1000; min-width: 200px;' +
    '  background: var(--surface); border: 1px solid var(--green-mid); border-radius: 8px; padding: 6px;' +
    '  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45); display: flex; flex-direction: column; gap: 2px; }' +
    '.pk-menu[hidden] { display: none; }' +
    '.pk-menu button { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left;' +
    '  background: none; border: none; color: var(--text); padding: 8px 10px; border-radius: 6px;' +
    '  font-family: "Share Tech Mono", monospace; font-size: 13px; letter-spacing: 1px; cursor: pointer; }' +
    '.pk-menu button:hover, .pk-menu button:focus-visible { background: var(--green-dim); color: var(--green); outline: none; }' +
    '.pk-menu button[aria-checked="true"] { color: var(--green); }' +
    '.pk-menu .pk-check { margin-left: auto; }' +
    '.pk-menu .pk-sw { width: 16px; height: 16px; border-radius: 4px; border: 1px solid var(--border); flex: none; }' +
    '@media (max-width: 640px) {' +
    '  .nav-controls .theme-toggle { padding: 8px 12px; }' +
    '  .pk-key { display: none; }' +
    '}' +
    '@media (pointer: coarse) { .nav-controls .theme-toggle, .pk-menu button { min-height: 44px; } }';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function lang() {
    if (typeof window.currentLang === 'function') return window.currentLang();
    return localStorage.getItem('lang') === 'pt' ? 'pt' : 'en';
  }
  function theme() {
    var t = document.documentElement.dataset.theme;
    return THEMES.indexOf(t) >= 0 ? t : 'blue';
  }

  function setLabel(btn, key, value) {
    var n = NAMES[lang()];
    btn.textContent = '';
    btn.appendChild(document.createTextNode('◈ '));
    var k = document.createElement('span');
    k.className = 'pk-key';
    k.textContent = n[key] + ': ';
    btn.appendChild(k);
    btn.appendChild(document.createTextNode(n[value]));
  }
  function labels() {
    setLabel(themeBtn, 'theme', theme());
    setLabel(langBtn, 'lang', lang());
  }
  // the pages call updateThemeBtn() and rewrite #lang-btn when the language
  // changes; route those through here so the buttons keep the new labels
  window.updateThemeBtn = function () { labels(); };

  function pickTheme(v) {
    document.documentElement.dataset.theme = v === 'blue' ? '' : v;
    localStorage.setItem('theme', v);
    labels();
  }
  function pickLang(v) {
    // a ?lang= in the address would win over the choice on the posts; drop it
    var url = new URL(window.location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.delete('lang');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
    if (typeof window.applyLang === 'function') window.applyLang(v);
    else if (typeof window.setLang === 'function') window.setLang(v);
    labels();
  }

  var open = null;
  function close() {
    if (!open) return;
    open.menu.hidden = true;
    open.btn.setAttribute('aria-expanded', 'false');
    open = null;
  }
  function build(btn, items, current, onPick) {
    var wrap = document.createElement('span');
    wrap.className = 'pk-wrap';
    btn.parentNode.insertBefore(wrap, btn);
    wrap.appendChild(btn);
    var menu = document.createElement('div');
    menu.className = 'pk-menu';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;
    wrap.appendChild(menu);
    btn.removeAttribute('onclick');
    btn.setAttribute('aria-haspopup', 'menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (open && open.menu === menu) { close(); return; }
      close();
      menu.innerHTML = '';
      var n = NAMES[lang()];
      var cur = current();
      items.forEach(function (v) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'menuitemradio');
        b.setAttribute('aria-checked', String(v === cur));
        if (SWATCH[v] && items === THEMES) {
          var sw = document.createElement('span');
          sw.className = 'pk-sw';
          sw.style.background = SWATCH[v];
          b.appendChild(sw);
        }
        var label = document.createElement('span');
        label.textContent = n[v];
        b.appendChild(label);
        if (v === cur) {
          var ck = document.createElement('span');
          ck.className = 'pk-check';
          ck.textContent = '✓';
          b.appendChild(ck);
        }
        b.addEventListener('click', function () { close(); onPick(v); btn.focus(); });
        menu.appendChild(b);
      });
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      open = { btn: btn, menu: menu };
      // opens to the left of the button, or to the right when that would leave the screen
      menu.style.left = ''; menu.style.right = '0';
      if (menu.getBoundingClientRect().left < 8) { menu.style.right = 'auto'; menu.style.left = '0'; }
      (menu.querySelector('[aria-checked="true"]') || menu.querySelector('button')).focus();
    });
  }

  build(themeBtn, THEMES, theme, pickTheme);
  build(langBtn, ['en', 'pt'], lang, pickLang);
  labels();

  document.addEventListener('click', function (e) {
    if (open && !e.target.closest('.pk-wrap')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!open) return;
    if (e.key === 'Escape') { var b = open.btn; close(); b.focus(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      var items = Array.prototype.slice.call(open.menu.querySelectorAll('button'));
      var i = items.indexOf(document.activeElement);
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    }
  });
})();
