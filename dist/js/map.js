/* VOLTA — noćna mapa Srbije: rute se crtaju dok se skroluje (prave geo-koordinate) */
(function () {
  const A = window.VOLTA_APP, C = window.VOLTA_CONFIG, sec = document.getElementById('atlas');
  if (!sec) return;
  const NS = 'http://www.w3.org/2000/svg', B = { lon0: 18.2, lon1: 23.3, lat0: 41.9, lat1: 46.35 }, W = 1000, K = Math.cos(44 * Math.PI / 180);
  const H = Math.round(W * (B.lat1 - B.lat0) / ((B.lon1 - B.lon0) * K));
  const P = (lon, lat) => [((lon - B.lon0) / (B.lon1 - B.lon0)) * W, ((B.lat1 - lat) / (B.lat1 - B.lat0)) * H];
  const SRB = [[19.66, 46.19], [20.26, 46.13], [20.76, 45.75], [21.01, 45.6], [21.48, 45.18], [21.36, 44.86], [22, 44.6], [22.47, 44.71], [22.68, 44.21], [22.37, 43.83], [22.53, 43.47], [23, 43.19], [22.48, 42.86], [22.37, 42.32], [21.56, 42.25], [20.6, 41.88], [20.26, 42.32], [20.07, 42.56], [19.6, 43.2], [19.24, 43.52], [19.5, 43.71], [19.23, 44], [19.6, 44.25], [19.1, 44.37], [19.37, 44.86], [19, 44.86], [19, 45.5], [18.82, 45.91], [19.4, 46.05], [19.66, 46.19]];
  const CITY = { ns: ['Novi Sad', 19.8335, 45.2671], beg: ['✈ BEG', 20.3091, 44.8184], bg: ['Beograd', 20.4612, 44.8125], ikea: ['IKEA', 20.56, 44.7], sub: ['Subotica', 19.6651, 46.1], palic: ['Palić', 19.768, 46.103], zr: ['Zrenjanin', 20.389, 45.381], kik: ['Kikinda', 20.4653, 45.8297], ind: ['Inđija', 20.081, 45.048], vrdnik: ['Fruške Terme', 19.79, 45.12], zl: ['Zlatibor', 19.7, 43.73], vb: ['Vrnjačka Banja', 20.8936, 43.6233], nis: ['Niš', 21.8958, 43.3209], gol: ['Golubac', 21.6317, 44.6531], rac: ['BiH', 19.33, 44.89], bij: ['Bijeljina', 19.2144, 44.7569], me: ['Crna Gora →', 19.1, 42.6] };
  const PRICE = { beg: 'beg', bg: 'bg', ikea: 'ikea', ind: 'outlet', sub: 'sub', palic: 'palic', zr: 'zr', kik: 'kik', vrdnik: 'terme', zl: 'zl', vb: 'vb', nis: 'nis', gol: 'gol', rac: 'ba1', bij: 'ba4', me: 'me' };
  const LEFT = ['beg', 'rac', 'bij', 'zl', 'me', 'vrdnik'];
  const SCN = [
    { r: [['ns', 'beg']], c: ['beg'], id: 'beg', t: { ru: ['Аэропорт', '95 км по A1 — и вы у терминала. Ночью столько же, сколько днём.'], sr: ['Aerodrom', '95 km autoputem — i ispred ste terminala. Noću isto kao danju.'], en: ['The airport', '95 km on the A1 to the terminal. Same price at night.'] } },
    { r: [['ns', 'bg'], ['bg', 'ikea'], ['ns', 'ind']], c: ['bg', 'ikea', 'ind'], id: 'bg', t: { ru: ['Белград и шопинг', 'IKEA, Outlet Inđija, концерты и посольство. Туда-обратно с ожиданием до 2 часов.'], sr: ['Beograd i šoping', 'IKEA, Outlet Inđija, koncerti, ambasada. Povratno sa čekanjem do 2 sata.'], en: ['Belgrade & shopping', 'IKEA, Inđija Outlet, concerts, embassy. Return trips with 2 h waiting.'] } },
    { r: [['ns', 'zr'], ['ns', 'sub'], ['sub', 'palic'], ['zr', 'kik'], ['ns', 'vrdnik']], c: ['sub', 'palic', 'zr', 'kik', 'vrdnik'], id: 'palic', t: { ru: ['Воеводина', 'Палич, Суботица, Зренянин, термы — выходные без руля.'], sr: ['Vojvodina', 'Palić, Subotica, Zrenjanin, Fruške Terme — vikend bez volana.'], en: ['Vojvodina', 'Palić, Subotica, Zrenjanin, spa — weekends without driving.'] } },
    { r: [['bg', 'gol'], ['bg', 'zl'], ['bg', 'vb'], ['vb', 'nis']], c: ['gol', 'zl', 'vb', 'nis'], id: 'zl', t: { ru: ['Вся Сербия', 'Златибор, Врнячка-Баня, Голубац, Ниш. Одна цена за машину.'], sr: ['Cela Srbija', 'Zlatibor, Vrnjačka Banja, Golubac, Niš. Jedna cena po vozilu.'], en: ['All of Serbia', 'Zlatibor, Vrnjačka Banja, Golubac, Niš. One price per car.'] } },
    { r: [['ns', 'rac'], ['rac', 'bij']], c: ['rac', 'bij'], id: 'ba4', t: { ru: ['Босния', 'Визаран до границы или шопинг в Биелине — ждём до 3 часов.'], sr: ['Bosna', 'Vizaran do granice ili šoping u Bijeljini — čekamo do 3 sata.'], en: ['Bosnia', 'Visa run to the border or shopping in Bijeljina — up to 3 h waiting.'] } },
    { r: [['zl', 'me']], c: ['me'], id: 'me', t: { ru: ['И дальше', 'Черногория от 400 €, страны ЕС — по запросу.'], sr: ['I dalje', 'Crna Gora od 400 €, EU na upit.'], en: ['And beyond', 'Montenegro from €400, EU on request.'] } }];
  const svg = sec.querySelector('svg'); svg.innerHTML = ''; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const el = (n, a, p = svg) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  el('defs', {}).innerHTML = `<linearGradient id="agl" x1="0" x2="1"><stop offset="0" stop-color="#f0d79b"/><stop offset="1" stop-color="#b8904b"/></linearGradient><radialGradient id="aglow"><stop offset="0" stop-color="#f0d79b" stop-opacity=".55"/><stop offset="1" stop-color="#f0d79b" stop-opacity="0"/></radialGradient><filter id="ablur"><feGaussianBlur stdDeviation="6"/></filter><pattern id="agrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,.035)"/></pattern>`;
  el('rect', { width: W, height: H, fill: 'url(#agrid)' });
  const DUNAV = [[18.85, 45.9], [19.05, 45.55], [19.4, 45.25], [19.84, 45.25], [20.3, 45.12], [20.47, 44.83], [21, 44.73], [21.5, 44.62], [22.1, 44.5], [22.6, 44.4]];
  el('path', { d: 'M' + DUNAV.map(p => P(...p).join(' ')).join(' L'), fill: 'none', stroke: 'rgba(110,150,210,.28)', 'stroke-width': 6, 'stroke-linecap': 'round' });
  el('path', { d: 'M' + SRB.map(p => P(...p).join(' ')).join(' L') + 'Z', fill: 'rgba(255,255,255,.025)', stroke: 'rgba(240,215,155,.35)', 'stroke-width': 1.5, 'stroke-dasharray': '2 6' });
  const dots = {};
  for (const k in CITY) {
    const [n, lon, lat] = CITY[k], [x, y] = P(lon, lat), left = LEFT.includes(k), tx = left ? x - 14 : x + 14, anc = left ? 'end' : 'start';
    const g = el('g', { class: 'ac', opacity: k === 'ns' ? 1 : .25 });
    el('circle', { cx: x, cy: y, r: k === 'ns' ? 34 : 22, fill: 'url(#aglow)' }, g);
    el('circle', { cx: x, cy: y, r: k === 'ns' ? 7 : 4.5, fill: k === 'ns' ? '#f0d79b' : '#fff' }, g);
    el('text', { x: tx, y: y - 8, 'text-anchor': anc, fill: '#fff', 'font-size': k === 'ns' ? 30 : 21, 'font-family': 'Manrope', 'font-weight': 700 }, g).textContent = n;
    const pr = el('text', { x: tx, y: y + 18, 'text-anchor': anc, fill: '#f0d79b', 'font-size': 19, 'font-family': 'Manrope', 'font-weight': 800 }, g);
    dots[k] = { g, pr, x, y };
  }
  const curve = (a, b) => { const x1 = dots[a].x, y1 = dots[a].y, x2 = dots[b].x, y2 = dots[b].y, mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1; return `M${x1} ${y1} Q${mx - dy * .18} ${my + dx * .18} ${x2} ${y2}`; };
  SCN.forEach(s => s.paths = s.r.map(([a, b]) => {
    el('path', { d: curve(a, b), fill: 'none', stroke: 'rgba(255,255,255,.07)', 'stroke-width': 2 });
    const glow = el('path', { d: curve(a, b), fill: 'none', stroke: '#f0d79b', 'stroke-width': 8, opacity: .35, filter: 'url(#ablur)', 'stroke-linecap': 'round' });
    const p = el('path', { d: curve(a, b), fill: 'none', stroke: 'url(#agl)', 'stroke-width': 3, 'stroke-linecap': 'round' });
    const L = p.getTotalLength(); [p, glow].forEach(x => { x.style.strokeDasharray = L; x.style.strokeDashoffset = L; }); return { p, glow, L };
  }));
  const car = el('g', {}); el('circle', { r: 16, fill: 'url(#aglow)' }, car); el('circle', { r: 6, fill: '#fff' }, car);
  svg.appendChild(dots.ns.g);
  const q = s => sec.querySelector(s), nEl = q('.at-n'), tEl = q('.at-t'), dEl = q('.at-d'), pEl = q('.at-p'), bEl = q('.at-b'), stEl = q('.at-steps');
  stEl.innerHTML = SCN.map(() => '<i></i>').join('');
  const lang = () => A.lang();
  const pr = id => { const r = A.item(id); return A.priceLabel(r); };
  let lastI = -1, lastLang = '';
  function setText(i) {
    const L = lang(), s = SCN[i];
    nEl.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(SCN.length).padStart(2, '0');
    tEl.textContent = s.t[L][0]; dEl.textContent = s.t[L][1]; pEl.textContent = pr(s.id);
    bEl.textContent = A.t('book') + ' →'; bEl.onclick = () => A.set({ to: s.id, dir: 'out' }, 'atlas');
    [tEl, dEl, pEl].forEach(e => { e.classList.remove('anim'); void e.offsetWidth; e.classList.add('anim'); });
    [...stEl.children].forEach((x, k) => x.classList.toggle('on', k <= i));
    for (const k in dots) dots[k].pr.textContent = '';
    SCN.slice(0, i + 1).forEach(sc => sc.c.forEach(k => { dots[k].pr.textContent = pr(PRICE[k]); }));
  }
  function frame() {
    const r = sec.getBoundingClientRect(), k = Math.max(0, Math.min(.9999, -r.top / (r.height - innerHeight))), seg = 1 / SCN.length, i = Math.floor(k / seg), local = (k - i * seg) / seg;
    SCN.forEach((s, si) => {
      const f = si < i ? 1 : si > i ? 0 : Math.min(1, local * 1.6), n = s.paths.length;
      s.paths.forEach((pp, pj) => { const g = Math.max(0, Math.min(1, f * n - pj)), off = pp.L * (1 - g); pp.p.style.strokeDashoffset = off; pp.glow.style.strokeDashoffset = off; });
      s.c.forEach(c => dots[c].g.setAttribute('opacity', si < i || (si === i && f > .9) ? 1 : .25));
    });
    const lf = Math.min(1, local * 1.6), n = SCN[i].paths.length, ji = Math.min(n - 1, Math.floor(lf * n)), fr = lf >= 1 ? 1 : lf * n - ji, cur = SCN[i].paths[ji], pt = cur.p.getPointAtLength(cur.L * fr);
    car.setAttribute('transform', `translate(${pt.x},${pt.y})`);
    svg.style.transform = `scale(${1.06 - k * .08})`;
    if (i !== lastI || lang() !== lastLang) { lastI = i; lastLang = lang(); setText(i); }
  }
  addEventListener('scroll', () => requestAnimationFrame(frame), { passive: true });
  A.on((S, info) => { if (info.lang) { lastLang = ''; frame(); } });
  frame();
})();
