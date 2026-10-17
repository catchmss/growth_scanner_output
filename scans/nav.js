// Injected into every published report by scan_index.py: renders an
// "all scans / same-day tabs / previous-next day" bar from manifest.json.
(function () {
  var m = location.pathname.match(/\/([^\/]+)\/(scan|volume|ttm)\.html$/);
  if (!m || document.querySelector('.gs-nav')) return;
  var folder = m[1], kind = m[2];
  var NAMES = {scan: 'Growth', volume: 'Volume', ttm: 'TTM Squeeze'};
  var ORDER = ['scan', 'volume', 'ttm'];

  var css = document.createElement('style');
  css.textContent = [
    '.gs-nav{position:sticky;top:0;z-index:40;display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px;',
    'margin:-32px -32px 24px;padding:10px 32px;background:color-mix(in srgb,var(--page-plane,#f9f9f7) 88%,transparent);',
    'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-bottom:1px solid var(--border,rgba(0,0,0,.1));font-size:12px}',
    '.gs-nav a{color:var(--ink-primary,#0b0b0b);text-decoration:none}',
    '.gs-home{font-weight:700}.gs-home:hover{color:var(--delta-up,#006300)}',
    '.gs-tabs{display:flex;gap:4px;padding:3px;border-radius:999px;background:var(--track,#ece9e2)}',
    '.gs-tab{padding:4px 12px;border-radius:999px;font-weight:650;color:var(--ink-secondary,#52514e)!important}',
    '.gs-tab:hover{color:var(--ink-primary,#0b0b0b)!important}',
    '.gs-tab.on{background:var(--surface-1,#fff);color:var(--ink-primary,#0b0b0b)!important;box-shadow:0 1px 3px rgba(0,0,0,.12)}',
    '.gs-tab.off{opacity:.4;pointer-events:none}',
    '.gs-days{display:flex;align-items:center;gap:6px;margin-left:auto;font-variant-numeric:tabular-nums}',
    '.gs-step{padding:4px 10px;border-radius:999px;border:1px solid var(--border,rgba(0,0,0,.1));background:var(--surface-1,#fff);font-weight:600}',
    '.gs-step:hover{border-color:var(--ink-muted,#898781)}',
    '.gs-step.off{opacity:.35;pointer-events:none}',
    '.gs-cur{font-weight:700;padding:0 4px}',
    '.gs-latest{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--delta-up,#006300);margin-left:4px}',
    '@media (max-width:640px){.gs-nav{margin:-32px -32px 18px;padding:10px 16px}.gs-days{margin-left:0}}'
  ].join('');
  document.head.appendChild(css);

  function fmt(d, withDow) {
    var dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('en-US', withDow ? {weekday: 'short', month: 'short', day: 'numeric'}
                                                  : {month: 'short', day: 'numeric'});
  }
  function el(tag, cls, text, href) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    if (href) e.href = href;
    return e;
  }
  function render(man) {
    var nav = el('nav', 'gs-nav');
    nav.appendChild(el('a', 'gs-home', '← All scans', '../scans/'));
    if (!man || !man.dates || !man.dates.length) { document.body.insertBefore(nav, document.body.firstChild); return; }

    var dates = man.dates, latest = dates[dates.length - 1].date;
    var date = folder === 'latest' ? latest : folder;
    var idx = -1;
    for (var i = 0; i < dates.length; i++) if (dates[i].date === date) idx = i;
    var reports = idx >= 0 ? dates[idx].reports : {};

    var tabs = el('div', 'gs-tabs');
    ORDER.forEach(function (k) {
      var href = reports[k] ? '../' + date + '/' + reports[k] : null;
      tabs.appendChild(el('a', 'gs-tab' + (k === kind ? ' on' : '') + (href ? '' : ' off'), NAMES[k], href || undefined));
    });
    nav.appendChild(tabs);

    // previous/next day: same scan type when that day has it, else that day's growth scan
    function dayHref(j) {
      if (j < 0 || j >= dates.length) return null;
      var r = dates[j].reports;
      var f = r[kind] || r.scan || r[ORDER.filter(function (k) { return r[k]; })[0]];
      return f ? '../' + dates[j].date + '/' + f : null;
    }
    var prev = idx >= 0 ? dayHref(idx - 1) : null, next = idx >= 0 ? dayHref(idx + 1) : null;
    var days = el('div', 'gs-days');
    var p = el('a', 'gs-step' + (prev ? '' : ' off'), '‹ ' + (idx > 0 ? fmt(dates[idx - 1].date) : 'Prev'), prev || undefined);
    p.title = 'Previous day (←)';
    var n = el('a', 'gs-step' + (next ? '' : ' off'), (idx >= 0 && idx < dates.length - 1 ? fmt(dates[idx + 1].date) : 'Next') + ' ›', next || undefined);
    n.title = 'Next day (→)';
    var cur = el('span', 'gs-cur', fmt(date, true));
    if (date === latest) cur.appendChild(el('span', 'gs-latest', 'Latest'));
    days.appendChild(p); days.appendChild(cur); days.appendChild(n);
    nav.appendChild(days);
    document.body.insertBefore(nav, document.body.firstChild);

    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowLeft' && prev) location.href = prev;
      if (e.key === 'ArrowRight' && next) location.href = next;
    });
  }
  fetch('../scans/manifest.json', {cache: 'no-cache'})
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(render);
})();
