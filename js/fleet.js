/* =====================================================================
   VOLTA — "Izaberi svoju Teslu": automobil se fizički odveze / doveze
   Jedna nepomična scena (img/plate.webp) + odvojeni slojevi vozila.
   Pozicije su u koordinatama fotografije (0–1), pa rade na svakom ekranu.
   ===================================================================== */
(function () {
  const A = window.VOLTA_APP, { C, H } = window.VOLTA;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const stage = $('#stage'), carsEl = $('#cars'), plate = stage.querySelector('.plate');
  const IW = 2000, IH = 700;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IMG = { m3: 'img/m3-front.webp', my: 'img/my-front.webp' }, RATIO = { m3: 691 / 1100, my: 718 / 1100 };
  /* tačke na fotografiji: x = centar, y = dno točkova, w = širina auta (udeo širine slike) */
  const P = {
    main: { x: .55, y: .965, w: .27 }, back: { x: .43, y: .80, w: .19 },
    vp: { x: .065, y: .565, w: .012 }, exit: { x: 1.22, y: 1.06, w: .36 }
  };
  let geo = null;
  function layout() {
    const W = stage.clientWidth, Hh = stage.clientHeight, mob = W < 820;
    const s = Math.max(W / IW, Hh / IH), iw = IW * s, ih = IH * s;
    const fx = mob ? .48 : .55, sx = mob ? .5 : .69;
    let ox = Math.min(0, Math.max(W - iw, sx * W - fx * iw)), oy = Math.min(0, Math.max(Hh - ih, (Hh - ih) * .7));
    plate.style.cssText = `width:${iw}px;height:${ih}px;left:${ox}px;top:${oy}px`;
    geo = { s, iw, ih, ox, oy, pt: p => ({ x: ox + p.x * iw, y: oy + p.y * ih, w: p.w * iw }) };
    cars.forEach(c => place(c, c.slot));
  }
  /* ---------- vozilo ---------- */
  const cars = [];
  function make(model) {
    const el = document.createElement('div'); el.className = 'car'; el.dataset.model = model;
    el.innerHTML = `<div class="shadow"></div><div class="tail"></div><img src="${IMG[model]}" alt="Tesla ${model === 'm3' ? 'Model 3' : 'Model Y'}" draggable="false"><div class="beam"></div><div class="flare"></div>`;
    carsEl.appendChild(el);
    const c = { el, model, slot: 'main' }; cars.push(c); return c;
  }
  function place(c, slot) {
    c.slot = slot; const p = geo.pt(P[slot]);
    Object.assign(c.el.style, { left: p.x + 'px', top: p.y + 'px', width: p.w + 'px', height: p.w * RATIO[c.model] + 'px', zIndex: slot === 'main' ? 3 : 2 });
  }
  const anim = (el, kf, o) => new Promise(r => { if (REDUCED) { r(); return; } const a = el.animate(kf, Object.assign({ fill: 'forwards' }, o)); a.onfinish = () => { a.commitStyles?.(); a.cancel(); r(); }; });
  const wait = ms => new Promise(r => setTimeout(r, REDUCED ? 0 : ms));

  async function arrive(model, slot, dur = 2100) {
    const c = make(model); place(c, slot);
    const to = geo.pt(P[slot]), from = geo.pt(P.vp), k = from.w / to.w, dx = from.x - to.x, dy = from.y - to.y;
    const lerp = (f, sc) => `translate(${dx * f}px,${dy * f}px) scale(${sc})`;
    c.el.classList.add('moving'); c.el.style.opacity = 0;
    const beam = c.el.querySelector('.beam');
    const body = anim(c.el, [
      { transform: lerp(1, k), opacity: 0, offset: 0 },
      { transform: lerp(.86, k * 3), opacity: 1, offset: .12 },
      { transform: lerp(.5, .42), offset: .45 },
      { transform: lerp(.18, .78), offset: .72 },
      { transform: lerp(.04, .95), offset: .9 },
      { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 1 }
    ], { duration: dur, easing: 'cubic-bezier(.3,.05,.35,1)' });
    anim(beam, [{ opacity: .25 }, { opacity: .5, offset: .6 }, { opacity: 1, offset: .9 }, { opacity: .55 }], { duration: dur + 500 });
    glow(dur);
    await body;
    c.el.style.opacity = 1; c.el.style.transform = 'none'; c.el.classList.remove('moving');
    await anim(c.el, [{ transform: 'translateY(0)' }, { transform: 'translateY(3px) scaleY(.994)' }, { transform: 'translateY(0)' }], { duration: 420, easing: 'ease-out' });
    c.el.style.transform = 'none'; c.el.classList.add('parked');
    return c;
  }
  async function leave(c, delay = 0) {
    await wait(delay);
    c.el.classList.add('braking'); c.el.classList.remove('parked');
    await wait(650);
    const to = geo.pt(P.exit), from = geo.pt(P[c.slot]), k = to.w / from.w;
    c.el.classList.add('moving');
    await anim(c.el, [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${(to.x - from.x) * .15}px,${(to.y - from.y) * .15}px) scale(${1 + (k - 1) * .15})`, opacity: 1, offset: .35 },
      { transform: `translate(${to.x - from.x}px,${to.y - from.y}px) scale(${k})`, opacity: .9 }
    ], { duration: 1150, easing: 'cubic-bezier(.55,0,.85,.35)' });
    c.el.remove(); cars.splice(cars.indexOf(c), 1);
  }
  function glow(dur) { const g = $('#roadGlow'); anim(g, [{ opacity: 0 }, { opacity: .2, offset: .4 }, { opacity: .85, offset: .88 }, { opacity: 0 }], { duration: dur + 700 }); }

  /* ---------- scenario: trenutno stanje → ciljno ---------- */
  let shown = null, target = null, busy = false;
  const layoutFor = id => id === 'm3' ? [['m3', 'main']] : id === 'my' ? [['my', 'main']] : [['my', 'main'], ['m3', 'back']];
  async function run() {
    if (busy) return; busy = true;
    while (target !== shown) {
      const goal = target; stage.classList.add('busy'); card(goal, true);
      const want = layoutFor(goal), have = cars.map(c => [c.model, c.slot]);
      const keep = (m, s) => want.some(w => w[0] === m && w[1] === s);
      const going = cars.filter(c => !keep(c.model, c.slot));
      await Promise.all(going.map((c, i) => leave(c, i * 260)));
      if (going.length) await wait(300);                       // prazan kadar ~0,3 s
      for (const [m, s] of want) if (!cars.some(c => c.model === m && c.slot === s)) { await arrive(m, s, s === 'back' ? 1700 : 2100); if (s === 'main' && want.length > 1) await wait(250); }
      shown = goal; stage.classList.remove('busy'); card(goal, false);
    }
    busy = false;
  }
  function go(id) { target = id; if (started) run(); }

  /* ---------- kartica i tekst uz auto ---------- */
  let lastNote = '';
  function card(id, pending) {
    const S = A.S, t = A.t, k = H.cls(id), r = A.item(S.to);
    $('#fcard').classList.toggle('pending', !!pending);
    $$('#fSeg button').forEach(b => b.classList.toggle('on', b.dataset.car === S.cls));
    $('#fPax').textContent = S.pax; $('#fBags').textContent = S.bags;
    if (pending) return;
    $('#fCap').textContent = k.pax; $('#fBag').textContent = k.bag; $('#fFeat').textContent = t('feat_' + id); $('#fFeatL').textContent = t('feat_l');
    const msg = id === '2c' && S.pax > 4 ? t('f_two', { n: S.pax }) : t('f_ready', { car: k.name.replace('2 × Tesla', '2 × Tesla') });
    $('#fMsg').innerHTML = (lastNote ? `<span class="warn">${lastNote}</span><br>` : '') + msg; lastNote = '';
    const p = A.price();
    $('#fPrice').textContent = p == null ? t('req') : (r.from ? t('from') + ' ' : '') + A.cur(p);
    $('#fRouteL').textContent = (A.lang() === 'ru' ? 'Нови-Сад' : 'Novi Sad') + ' → ' + A.N(r.n) + ' · ' + t('per_car');
    $('#fNum').textContent = ({ m3: '01', my: '02', '2c': '03' })[id] + ' · VOLTA FLEET'; $('#fName').textContent = k.name; $('#fLine').textContent = t('line_' + id);
    const fc = $('#fleetCopy'); fc.classList.remove('in'); void fc.offsetWidth; fc.classList.add('in');
    $('#fcard').classList.remove('flash'); void $('#fcard').offsetWidth; $('#fcard').classList.add('flash');
  }
  function syncControls() {
    const S = A.S; $('#fRoute').innerHTML = A.optList(S.to); $('#fPax').textContent = S.pax; $('#fBags').textContent = S.bags;
    $$('#fSeg button').forEach(b => b.classList.toggle('on', b.dataset.car === S.cls));
  }
  $('#fRoute').onchange = e => A.set({ to: e.target.value, dir: 'out' }, 'fleet');
  $$('[data-fc]').forEach(b => b.onclick = () => A.set({ [b.dataset.fc]: A.S[b.dataset.fc] + +b.dataset.v }, 'fleet'));
  $$('#fSeg button').forEach(b => b.onclick = () => A.set({ cls: b.dataset.car }, 'fleet'));
  $('#fGo').onclick = () => { A.goStep(1); $('#book').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => $('#addr').focus({ preventScroll: true }), 900); };

  A.on((S, info) => {
    syncControls();
    if (info.note) lastNote = info.note;
    if (S.cls !== target) go(S.cls); else if (!busy && shown === S.cls) card(S.cls, false);
    if (info.note && info.src !== 'fleet') A.toast(info.note);
  });

  /* ---------- start: prvi auto se doveze kad scena uđe u kadar ---------- */
  let started = false;
  addEventListener('resize', () => { layout(); });
  layout(); syncControls(); target = A.S.cls; card(target, true);
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { started = true; o.disconnect(); setTimeout(run, 250); } }), { threshold: .35 }).observe(stage);
})();
