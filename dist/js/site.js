/* =====================================================================
   VOLTA — javni sajt (RU / SR / EN). Deljeno stanje: window.VOLTA_APP
   ===================================================================== */
(function () {
  const { C, H, LIVE, db, notify } = window.VOLTA, D = window.VOLTA_I18N;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = H.fmt;
  const LANGS = ['ru', 'sr', 'en'], Q = new URLSearchParams(location.search);
  const FORCED = document.documentElement.dataset.forceLang;
  const nl = (navigator.language || 'ru').toLowerCase();
  let lang = FORCED || Q.get('lang') || localStorage.getItem('volta_lang') || (/^(sr|hr|bs)/.test(nl) ? 'sr' : /^en/.test(nl) ? 'en' : 'ru');
  if (!LANGS.includes(lang)) lang = 'ru';
  const li = () => LANGS.indexOf(lang);
  const t = (k, v) => { let s = (D[k] || [k, k, k])[li()]; if (v) for (const x in v) s = s.replace('{' + x + '}', v[x]); return s; };
  const N = o => o ? (o[lang] || o.sr) : '';
  const cur = v => v == null ? '—' : fmt(v) + ' ' + t('rsd');
  const item = id => C.catalog.find(r => r.id === id) || C.catalog[0];
  const rtOnly = r => r && r.ow == null && r.rt != null;
  let tt; const toast = m => { const e = $('#toast'); e.textContent = m; e.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => e.classList.remove('on'), 3400); };

  /* ---------------- STATE ---------------- */
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  const S = { dir: Q.get('dir') === 'in' ? 'in' : 'out', to: C.catalog.some(r => r.id === Q.get('to')) ? Q.get('to') : 'beg', date: tomorrow, time: '10:00', ret: false, pax: 1, bags: 1, cls: 'm3', manual: false,
    extras: new Set(['sign']), channel: 'telegram', pay: 'cash', step: 1, ref: H.ref(), saved: null, paid: false };
  const subs = [];
  /* najmanje vozilo koje staje */
  const needed = (p, b) => (p <= 3 && b <= 2) ? 'm3' : (p <= 4 && b <= 4) ? 'my' : '2c';
  const rank = { m3: 0, my: 1, '2c': 2 };
  function set(patch, src) {
    const prev = S.cls; Object.assign(S, patch);
    S.pax = Math.max(1, Math.min(8, S.pax)); S.bags = Math.max(0, Math.min(8, S.bags));
    const need = needed(S.pax, S.bags);
    let note = '';
    if (patch.cls) { if (rank[patch.cls] < rank[need]) { note = t('f_nofit', { car: H.cls(patch.cls).name }); S.cls = need; } S.manual = true; }
    else if (patch.pax != null || patch.bags != null) { if (!S.manual || rank[S.cls] < rank[need]) S.cls = need; if (rank[S.cls] > rank[need] && !S.manual) S.cls = need; }
    if (patch.to) S.ret = false;
    renderAll(src);
    subs.forEach(f => f(S, { changedCar: prev !== S.cls, prev, note, src }));
  }
  function basePrice() {
    const r = item(S.to); if (r.req) return null;
    let p = r.from ? Math.round(r.oweur * C.eurRsd) : r.ow == null ? r.rt : (S.ret ? (r.rt ?? r.ow * 2) : r.ow);
    return p * H.cls(S.cls).mult;
  }
  function price(pay) {
    const b = basePrice(); if (b == null) return null;
    let p = b + [...S.extras].reduce((a, x) => a + ((C.extras.find(e => e[0] === x) || [0, 0])[1]), 0);
    if ((pay || S.pay) === 'online' && C.payments.onlineDiscount) p *= 1 - C.payments.onlineDiscount;
    return Math.round(p);
  }
  const routeName = () => { const r = item(S.to), nm = r.req && $('#custom').value.trim() ? $('#custom').value.trim() : N(r.n), ns = lang === 'ru' ? 'Нови-Сад' : 'Novi Sad'; return S.dir === 'out' ? ns + ' → ' + nm : nm + ' → ' + ns; };
  const priceLabel = r => r.req ? t('req') : r.from ? t('from') + ' €' + r.oweur : r.ow != null ? cur(r.ow) : cur(r.rt) + ' ↺';
  function optList(sel) {
    return ['ns', 'rs', 'ba', 'me'].map(c => `<optgroup label="${t('cat_' + c)}">${C.catalog.filter(r => r.cat === c).map(r => `<option value="${r.id}" ${r.id === sel ? 'selected' : ''}>${esc(N(r.n))} — ${esc(priceLabel(r))}</option>`).join('')}</optgroup>`).join('');
  }

  /* ---------------- I18N ---------------- */
  function applyI18n() {
    document.documentElement.lang = lang;
    $$('[data-i]').forEach(e => { const v = t(e.dataset.i); if (/[<]/.test(v)) e.innerHTML = v; else e.textContent = v; });
    $$('[data-ph]').forEach(e => e.placeholder = t(e.dataset.ph));
    $$('#langs button').forEach(b => b.classList.toggle('on', b.dataset.l === lang));
    const bl = lang === 'sr' ? 'blog/sr.html' : 'blog/index.html'; ['#blogLink', '#ftBlog'].forEach(s => $(s) && ($(s).href = bl));
  }

  /* ---------------- CHANNELS ---------------- */
  const SV = {
    whatsapp: '<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/>',
    telegram: '<path d="M21.9 4.3 18.7 19.6c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.3 13.3l-4.8-1.5c-1-.3-1-1 .2-1.5L20.6 3c.9-.3 1.6.2 1.3 1.3z"/>',
    viber: '<path d="M12 2C6.5 2 3 4.6 3 10.5c0 3.2 1 5.4 2.9 6.8V21l3-2c1 .2 2 .3 3.1.3 5.5 0 9-2.6 9-8.8S17.5 2 12 2zm4.1 12.7c-.4.6-1.3 1.2-1.9 1-2.9-1-5.4-3.4-6.5-6.4-.2-.7.4-1.5 1-1.9.4-.2.8-.1 1 .2l1 1.4c.2.3.2.8-.2 1l-.4.3c.6 1.3 1.6 2.3 2.9 2.9l.3-.4c.3-.4.7-.4 1-.2l1.4 1c.4.3.5.7.4 1.1z"/>',
    instagram: '<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM12 3.8c2.7 0 3 0 4 .1 2.7.1 4 1.4 4.1 4.1.1 1 .1 1.3.1 4s0 3-.1 4c-.1 2.7-1.4 4-4.1 4.1-1 .1-1.3.1-4 .1s-3 0-4-.1c-2.7-.1-4-1.4-4.1-4.1-.1-1-.1-1.3-.1-4s0-3 .1-4C3.9 5.3 5.3 4 8 3.9c1-.1 1.3-.1 4-.1z"/>',
    phone: '<path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/>',
    email: '<path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>'
  };
  const svg = (k, c = '#fff', s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}">${SV[k]}</svg>`;
  const APPLE = '<svg width="15" height="18" viewBox="0 0 384 470" fill="currentColor" style="vertical-align:-2px"><path d="M318 249c-1-55 45-81 47-83-26-37-65-42-79-43-34-3-66 20-83 20s-43-19-71-19C95 125 61 146 42 180c-39 67-10 167 28 222 18 27 40 57 69 56 28-1 38-18 72-18s43 18 72 17c30 0 49-27 67-54 21-31 30-61 30-63-1 0-58-22-60-91zM263 85c15-19 26-44 23-70-22 1-49 15-65 33-14 16-27 43-23 68 25 2 50-12 65-31z"/></svg>';
  const CH = () => ({
    telegram: { n: 'Telegram', c: '#229ED9', sub: '@' + C.telegram, h: 'https://t.me/' + C.telegram, d: t('ch_tg'), copy: 1 },
    whatsapp: { n: 'WhatsApp', c: '#25D366', sub: '+' + C.whatsapp, h: 'https://wa.me/' + C.whatsapp, d: t('ch_wa'), msg: x => 'https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(x) },
    viber: { n: 'Viber', c: '#7360F2', sub: '+' + C.viber, h: 'viber://chat?number=%2B' + C.viber, d: t('ch_vb'), copy: 1 },
    instagram: { n: 'Instagram', c: 'linear-gradient(45deg,#f09433,#dc2743,#bc1888)', sub: '@' + C.instagram, h: 'https://instagram.com/' + C.instagram, d: t('ch_ig'), copy: 1 },
    phone: { n: t('call'), c: '#2a2d33', sub: C.phone, h: 'tel:' + C.phone, d: '24/7' },
    email: { n: 'Email', c: '#a8834a', sub: C.email, h: 'mailto:' + C.email, d: '', msg: x => `mailto:${C.email}?subject=${encodeURIComponent('Booking ' + S.ref)}&body=${encodeURIComponent(x)}` }
  });

  function renderStatic() {
    $$('.brandT').forEach(e => e.textContent = C.brand); $('#yr').textContent = new Date().getFullYear();
    const mq = C.catalog.filter(r => !r.req).map(r => `<span>${esc(N(r.n))} <b>${esc(priceLabel(r))}</b></span>`).join(''); $('#mq').innerHTML = mq + mq;
    const ch = CH(), list = ['telegram', 'whatsapp', 'viber', 'instagram', 'phone', 'email'];
    $('#chgrid').innerHTML = list.map(k => `<a class="chc rv" href="${ch[k].h}" target="_blank" rel="noopener"><span class="ic" style="background:${ch[k].c}">${svg(k, '#fff', 26)}</span><div><b>${ch[k].n}</b><small>${esc(ch[k].sub)}${ch[k].d ? ' · ' + ch[k].d : ''}</small></div><span class="arr">→</span></a>`).join('');
    $('#ftCh').innerHTML = list.map(k => `<a href="${ch[k].h}" target="_blank" rel="noopener">${ch[k].n}</a>`).join('');
    $('#ftRoutes').innerHTML = ['beg', 'bg', 'ikea', 'ba4', 'me'].map(id => `<a href="#fleet" data-route="${id}">${esc(N(item(id).n))}</a>`).join('');
    $('#fabM').innerHTML = ['telegram', 'whatsapp', 'viber', 'instagram', 'phone'].map(k => `<a href="${ch[k].h}" target="_blank" rel="noopener"><span>${ch[k].n}</span><i style="background:${ch[k].c}">${svg(k)}</i></a>`).join('');
    $('#mmCh').innerHTML = ['telegram', 'whatsapp', 'viber', 'instagram'].map(k => `<a class="btn btn-sm btn-ghost" href="${ch[k].h}" target="_blank" rel="noopener">${ch[k].n}</a>`).join('');
    $('#mCall').href = 'tel:' + C.phone; $('#mTg').href = ch.telegram.h; $('#bdTg').href = ch.telegram.h; $('#bdWa').href = ch.whatsapp.h; $('#dpJoin').href = ch.telegram.h;
    $('#gReview').href = $('#gReview2').href = C.googleReviewUrl;
    if (!$('#gmap').getAttribute('src')) $('#gmap').src = 'https://www.google.com/maps?q=' + encodeURIComponent(C.googlePlaceQuery) + '&output=embed';
    $('#paygrid').innerHTML = [[APPLE.replace('15" height="18', '26" height="30'), 'Apple Pay', t('py1')], ['<b style="color:#4285f4">G</b>', 'Google Pay', t('py1')], ['💳', 'Visa · Mastercard · Dina', t('py2')], ['⚡', 'IPS QR', t('py3')], ['🤝', t('pay_cash'), t('py4')]]
      .map(p => `<div class="pg rv"><div class="pi">${p[0]}</div><b>${p[1]}</b><small>${p[2]}</small></div>`).join('');
    $('#faqL').innerHTML = window.VOLTA_FAQ[lang].map((f, i) => `<details ${i ? '' : 'open'}><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('');
    $$('[data-route]').forEach(a => a.onclick = () => set({ to: a.dataset.route, dir: 'out' }, 'link'));
  }

  /* ---------------- PRICES ---------------- */
  let pcat = 'ns';
  function renderPrices() {
    $('#ptabs').innerHTML = ['ns', 'rs', 'ba', 'me'].map(c => `<button class="${c === pcat ? 'on' : ''}" data-c="${c}">${t('cat_' + c)}</button>`).join('');
    $$('#ptabs button').forEach(b => b.onclick = () => { pcat = b.dataset.c; renderPrices(); });
    $('#pgrid').innerHTML = C.catalog.filter(r => r.cat === pcat).map((r, i) => {
      const big = r.img && i < 2, tags = [];
      if (rtOnly(r)) tags.push(t('rt')); if (r.wait) tags.push(t('wait', { h: r.wait })); if (r.rt && r.ow) tags.push(t('rt') + ' ' + cur(r.rt)); if (r.km) tags.push('~' + r.km + ' km');
      return `<div class="pc ${big ? 'img' : ''}" data-id="${r.id}">${big ? `<div class="ph" style="background-image:url(${r.img})"></div>` : ''}<h4>${esc(N(r.n))}</h4>${r.d ? `<div class="d">${esc(N(r.d))}</div>` : ''}
        <div class="tags">${tags.map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>
        <div class="pr"><div><small>${r.req ? '' : t('per_car')}</small><b>${r.req ? t('req') : r.from ? '€' + r.oweur + '+' : fmt(r.ow ?? r.rt)}</b><small>${r.req || r.from ? '' : t('rsd') + (r.eur ? ' · €' + r.eur : '')}</small></div><span class="go">→</span></div></div>`;
    }).join('');
    $$('#pgrid .pc').forEach(c => c.onclick = () => { set({ to: c.dataset.id, dir: 'out' }, 'prices'); $('#fleet').scrollIntoView({ behavior: 'smooth' }); });
  }

  /* ---------------- WIZARD ---------------- */
  const EX = ['sign', 'child', 'quiet', 'pet', 'stop', 'wait'];
  function renderBook() {
    const r = item(S.to);
    $('#bDir').innerHTML = ['out', 'in'].map(d => `<button data-d="${d}" class="${S.dir === d ? 'on' : ''}">${t(d === 'out' ? 'from_ns' : 'to_ns')}</button>`).join('');
    $$('#bDir button').forEach(b => b.onclick = () => set({ dir: b.dataset.d }, 'wiz'));
    $('#bTo').innerHTML = optList(S.to);
    $('#date').value = S.date; $('#date').min = new Date().toISOString().slice(0, 10); $('#time').value = S.time;
    $('#customF').hidden = !r.req; $('#flF').hidden = S.to !== 'beg';
    $('#addrL').textContent = S.dir === 'in' ? t('addr_in') : t('addr');
    const ro = rtOnly(r);
    $('#retW').style.display = r.req || r.from ? 'none' : 'flex'; $('#ret').checked = ro || S.ret; $('#ret').disabled = ro;
    $('#retL').innerHTML = (ro ? t('rt') + ' ✓' : t('rt') + ` <b>${r.rt ? cur(r.rt * H.cls(S.cls).mult) : cur(r.ow * 2 * H.cls(S.cls).mult)}</b>`) + (r.wait ? ' · ' + t('wait', { h: r.wait }) : '');
    $('#pax').textContent = S.pax; $('#bags').textContent = S.bags;
    $('#carsOpt').innerHTML = C.classes.map(k => `<button type="button" class="opt ${k.id === S.cls ? 'on' : ''} ${rank[k.id] < rank[needed(S.pax, S.bags)] ? 'dim' : ''}" data-k="${k.id}"><img src="${k.img}" alt=""><b>${k.name}</b><small>👤 ${k.pax} · 🧳 ${k.bag}${k.mult > 1 ? ' · ×2' : ''}</small></button>`).join('');
    $$('#carsOpt .opt').forEach(b => b.onclick = () => set({ cls: b.dataset.k }, 'wiz'));
    $('#xt').innerHTML = C.extras.map(e => `<button type="button" class="${S.extras.has(e[0]) ? 'on' : ''}" data-x="${e[0]}">${t('x_' + e[0])}${e[1] ? ' +' + fmt(e[1]) : ''}</button>`).join('');
    $$('#xt button').forEach(b => b.onclick = () => { const x = b.dataset.x; S.extras.has(x) ? S.extras.delete(x) : S.extras.add(x); renderAll('wiz'); });
    const ch = CH();
    $('#chg').innerHTML = ['telegram', 'whatsapp', 'viber', 'instagram', 'email'].map(k => `<button type="button" class="chb ${S.channel === k ? 'on' : ''}" data-ch="${k}"><i style="background:${ch[k].c}">${svg(k, '#fff', 18)}</i>${ch[k].n}</button>`).join('');
    $$('#chg .chb').forEach(b => b.onclick = () => { S.channel = b.dataset.ch; renderBook(); });
    renderPays(); renderSum();
  }
  $('#bTo').onchange = e => set({ to: e.target.value }, 'wiz');
  $('#date').onchange = e => { S.date = e.target.value; renderSum(); };
  $('#time').onchange = e => { S.time = e.target.value; renderSum(); };
  $('#ret').onchange = e => set({ ret: e.target.checked }, 'wiz');
  $('#flight').oninput = e => { const f = e.target.value.replace(/\s/g, ''); $('#flLink').style.display = f.length >= 3 ? 'inline-block' : 'none'; $('#flLink').href = 'https://www.flightradar24.com/data/flights/' + f.toLowerCase(); };
  $$('[data-bc]').forEach(b => b.onclick = () => set({ [b.dataset.bc]: S[b.dataset.bc] + +b.dataset.v }, 'wiz'));

  function renderPays() {
    const P = C.payments, o = [];
    if (P.online) o.push(['online', APPLE, t('pay_on'), t('pay_on_d'), `<span class="mk">${APPLE} Pay</span><span class="mk l">G Pay</span><span class="mk l">VISA</span><span class="mk l">MC</span><span class="mk l">Dina</span>`]);
    if (P.ips) o.push(['ips', '⚡', 'IPS QR', t('pay_ips_d'), '<span class="mk l">NBS IPS</span>']);
    if (P.cash) o.push(['cash', '🤝', t('pay_cash'), t('pay_cash_d'), '']);
    if (P.invoice) o.push(['invoice', '🧾', t('pay_inv'), t('pay_inv_d'), '']);
    $('#pays').innerHTML = o.map(x => `<button type="button" class="pay ${S.pay === x[0] ? 'on' : ''}" data-p="${x[0]}"><span class="pi">${x[1]}</span><span><b>${x[2]}</b><small>${x[3]}</small></span><span class="marks">${x[4]}</span></button>`).join('');
    $$('#pays .pay').forEach(b => b.onclick = () => { S.pay = b.dataset.p; renderPays(); renderSum(); });
    $('#walletBox').innerHTML = S.pay === 'online' ? `<div class="wallets"><button class="wbtn" data-w="apple">${APPLE} Pay</button><button class="wbtn g" data-w="google"><b style="color:#4285f4">G</b>&nbsp;Pay</button></div><button class="btn btn-sm wide" data-w="card">💳 ${t('card_btn')}</button>` : '';
    $$('[data-w]').forEach(b => b.onclick = () => startPay(b.dataset.w));
    $('#confirm').textContent = S.pay === 'online' && !S.paid && price() != null ? t('pay_btn', { p: cur(price()) }) : t('confirm');
  }
  function renderSum() {
    const r = item(S.to), p = price(), k = H.cls(S.cls);
    $('#sTop').style.backgroundImage = `url(${r.img || (r.cat === 'ba' ? 'img/mall.webp' : r.cat === 'me' ? 'img/montenegro.webp' : 'img/plate.webp')})`;
    $('#sCar').src = k.img; $('#sCat').textContent = t('cat_' + r.cat); $('#sRoute').textContent = routeName() + (S.ret || rtOnly(r) ? ' ↺' : '');
    const rows = [[t('date'), (S.date || '—') + ' · ' + S.time], [t('car'), k.name], [t('pax'), `👤 ${S.pax} · 🧳 ${S.bags}`], [t('pay_l'), { online: 'Apple / Google Pay', ips: 'IPS QR', cash: t('pay_cash'), invoice: t('pay_inv') }[S.pay]]];
    if (r.wait) rows.push([t('wait_l'), t('wait', { h: r.wait })]); if (r.km) rows.push([t('dur_l'), `~${r.min} min · ${r.km} km`]);
    $('#sDl').innerHTML = rows.map(x => `<dt>${x[0]}</dt><dd>${esc(x[1])}</dd>`).join('');
    $('#sPrice').textContent = p == null ? t('req') : (r.from ? t('from') + ' ' : '') + cur(p);
    $('#sEur').textContent = p == null ? '' : '≈ €' + Math.round(p / C.eurRsd);
  }
  function validate(step) {
    let ok = true; const bad = el => { const f = el.closest('.fld'); f.classList.add('err'); ok = false; setTimeout(() => f.classList.remove('err'), 1800); };
    if (step >= 2) { if (!$('#date').value) bad($('#date')); if (!$('#addr').value.trim()) bad($('#addr')); if (item(S.to).req && !$('#custom').value.trim()) bad($('#custom')); }
    if (step >= 4) { if ($('#name').value.trim().length < 2) bad($('#name')); if ($('#phone').value.replace(/\D/g, '').length < 8) bad($('#phone')); }
    if (!ok) toast(t('fill')); return ok;
  }
  function go(n, silent) {
    if (!silent && n > S.step && !validate(n)) return;
    S.step = n;
    $$('.pane').forEach(p => p.classList.toggle('on', +p.dataset.p === n));
    $$('#stp li').forEach((l, i) => { l.classList.toggle('on', i + 1 === n); l.classList.toggle('ok', i + 1 < n); });
    if (!silent) { const top = $('#book').getBoundingClientRect().top + scrollY - 70; if (Math.abs(scrollY - top) > 260) scrollTo({ top, behavior: 'smooth' }); }
    renderPays(); renderSum();
  }
  $$('[data-go]').forEach(b => b.onclick = () => go(+b.dataset.go));

  async function saveBooking() {
    const r = item(S.to), note = [r.req ? 'Odredište: ' + $('#custom').value.trim() : '', $('#note').value.trim()].filter(Boolean).join(' · ');
    const b = { ref: S.ref, from: S.dir === 'out' ? 'ns' : S.to, to: S.dir === 'out' ? S.to : 'ns', date: $('#date').value, time: $('#time').value, addr: $('#addr').value.trim(), flight: $('#flight').value.trim().toUpperCase(),
      pax: S.pax, bags: S.bags, class: S.cls, extras: [...S.extras], return_trip: S.ret || rtOnly(r), price: price(), name: $('#name').value.trim(), phone: $('#phone').value.trim(), email: $('#email').value.trim(), note,
      channel: S.channel, lang, pay_method: S.pay, pay_status: S.pay === 'online' ? 'pending' : 'unpaid', status: 'new', driver_id: null, history: [{ s: 'new', t: H.now() }], msg_log: {} };
    S.saved = await db.insert('bookings', b);
    notify(`🚘 Nova rezervacija ${b.ref}\n${routeName()}${b.return_trip ? ' ↺' : ''}\n${b.date} ${b.time} · ${b.addr}\n${H.cls(b.class).name} · ${b.pax}👤 ${b.bags}🧳${b.flight ? '\n✈ ' + b.flight : ''}\n${b.name} ${b.phone} (${b.channel})\n${b.price != null ? fmt(b.price) + ' RSD' : 'NA UPIT'} · ${H.PAY[b.pay_method]}${b.note ? '\n📝 ' + b.note : ''}`);
    return S.saved;
  }
  $('#confirm').onclick = async () => {
    if (!validate(4)) return; if (!$('#terms').checked) return toast(t('accept'));
    const btn = $('#confirm'); btn.disabled = true;
    try { if (!S.saved) await saveBooking(); if (S.pay === 'online' && !S.paid && price() != null) { btn.disabled = false; return startPay('apple'); } done(); }
    catch (e) { console.error(e); toast(t('err')); }
    btn.disabled = false;
  };

  /* ---------------- PAYMENT ---------------- */
  let afterPay = null;
  async function startPay(kind, amount) {
    if (!amount) { if (!validate(4)) return; if (!S.saved) await saveBooking(); }
    amount = amount || price();
    if (C.payments.provider !== 'demo' && location.protocol !== 'file:') {
      try { const r = await fetch('/api/pay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref: S.ref, method: kind }) }); const j = await r.json(); if (j.url) return (location.href = j.url); throw 0; }
      catch (e) { return toast(t('pay_na')); }
    }
    $('#shT').innerHTML = kind === 'google' ? '<b style="color:#4285f4">G</b> Pay' : kind === 'card' ? '💳 Card' : APPLE + ' Pay';
    $('#shA').textContent = cur(amount); $('#shM').textContent = C.brand + ' · ' + S.ref;
    $('#shS').textContent = kind === 'apple' ? t('pay_side') : t('pay_conf'); $('#shP').textContent = t('pay_btn', { p: cur(amount) }); $('#shP').disabled = false;
    $('#sheet').classList.add('open');
  }
  const closeSheet = () => $('#sheet').classList.remove('open');
  $('#shX').onclick = closeSheet; $('#sheet').onclick = e => { if (e.target.id === 'sheet') closeSheet(); };
  $('#shP').onclick = async () => {
    $('#shP').disabled = true; $('#shS').textContent = t('pay_proc'); await new Promise(r => setTimeout(r, 1100));
    $('#shS').innerHTML = '<b class="okc">✓ ' + t('pay_ok') + '</b>'; S.paid = true;
    if (S.saved) { await db.update('bookings', S.saved.id, { pay_status: 'paid', paid_at: H.now(), status: 'confirmed', history: [...(S.saved.history || []), { s: 'confirmed', t: H.now() }] }); notify(`💳 Plaćeno online ${S.saved.ref} · ${fmt(S.saved.price)} RSD`); }
    setTimeout(() => { closeSheet(); if (afterPay) { const f = afterPay; afterPay = null; toast('✓ ' + t('paid')); f(); } else done(); }, 700);
  };
  function bookingText() {
    const s = S.saved || {};
    return [`${C.brand} · ${t('tr_ref')} ${S.ref}`, routeName() + (s.return_trip ? ' ↺' : ''), `${s.date} ${s.time}`, `📍 ${s.addr}`, s.flight ? '✈ ' + s.flight : '', `${H.cls(S.cls).name} · ${S.pax}👤 ${S.bags}🧳`, `${s.price != null ? cur(s.price) : t('req')}${S.paid ? ' ✓' : ''}`, `${s.name} · ${s.phone}`, s.note ? '📝 ' + s.note : ''].filter(Boolean).join('\n');
  }
  function done() {
    $('#doneRef').textContent = S.ref;
    const txt = bookingText(), ch = CH()[S.channel];
    $('#ipsOut').innerHTML = '';
    if (S.pay === 'ips' && price() != null) {
      $('#ipsOut').innerHTML = `<div class="qrbox"><div id="qr"></div><div><b>IPS QR · ${cur(price())}</b><p class="mut">${t('ips_t')}</p></div></div>`;
      const P = C.payments, s = `K:PR|V:01|C:1|R:${P.ipsAccount}|N:${P.ipsName}|I:RSD${price()},00|SF:289|S:Prevoz ${S.ref}`;
      try { const q = qrcode(0, 'M'); q.addData(s); q.make(); $('#qr').innerHTML = q.createImgTag(4, 0); } catch (e) { $('#qr').textContent = s; }
    }
    $('#doneActs').innerHTML = [`<a class="btn btn-gold" target="_blank" rel="noopener" id="dSend" href="${ch.msg ? ch.msg(txt) : ch.h}">${svg(S.channel, '#120e07', 18)} ${t('send_via')} ${ch.n}</a>`,
      C.telegramBot ? `<a class="btn" target="_blank" rel="noopener" href="https://t.me/${C.telegramBot}?start=${S.ref}">🔔 ${t('tgbot')}</a>` : '',
      `<button class="btn" id="dIcs">📅 ${t('cal')}</button>`, `<a class="btn" href="#track" id="dTrack">📍 ${t('trackb')}</a>`].join('');
    $('#dSend').addEventListener('click', () => { if (ch.copy) { navigator.clipboard?.writeText(txt).catch(() => { }); toast(t('copied')); } });
    $('#dIcs').onclick = ics;
    $('#dTrack').onclick = () => { $('#tRef').value = S.ref; $('#tPhone').value = $('#phone').value; setTimeout(lookup, 600); };
    try { localStorage.setItem('volta_last', JSON.stringify({ ref: S.ref, phone: $('#phone').value })); } catch (e) { }
    go(5, true); scrollTo({ top: $('#book').getBoundingClientRect().top + scrollY - 70, behavior: 'smooth' });
  }
  function ics() {
    const s = S.saved, dt = (s.date + 'T' + s.time).replace(/[-:]/g, '') + '00';
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//VOLTA//EN', 'BEGIN:VEVENT', `UID:${S.ref}@volta`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`, `DTSTART:${dt}`, 'DURATION:PT1H', `SUMMARY:${C.brand} Tesla ${S.ref}`, `LOCATION:${s.addr}`, `DESCRIPTION:${bookingText().replace(/\n/g, '\\n')}\\n${C.phone}`, 'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Tesla transfer', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' })); a.download = S.ref + '.ics'; a.click();
  }
  $('#again').onclick = () => { S.ref = H.ref(); S.saved = null; S.paid = false; go(1, true); };

  /* ---------------- TRACK ---------------- */
  const FLOW = ['new', 'confirmed', 'assigned', 'enroute', 'arrived', 'onboard', 'done'];
  async function lookup() {
    const out = $('#trkOut'), r = $('#tRef').value, p = $('#tPhone').value; if (!r || !p) return;
    const b = await db.findBooking(r, p);
    if (!b) { out.innerHTML = `<div class="empty"><div>🤔</div><p class="mut">${t('tr_nf')}</p></div>`; return; }
    let drv = b.driver || null; if (b.driver_id && !LIVE) drv = (await db.list('drivers')).find(d => d.id === b.driver_id);
    const st = b.status === 'accepted' ? 'assigned' : b.status, idx = FLOW.indexOf(st), canCancel = !['done', 'cancelled', 'onboard'].includes(b.status) && (new Date(b.date + 'T' + b.time) - Date.now()) / 36e5 > 24;
    out.innerHTML = `<div class="trh"><b class="mono">${esc(b.ref)}</b><span class="badge">${t('st_' + (b.status === 'cancelled' ? 'cancelled' : st))}</span></div>
      <h4 class="serif">${esc(H.route(b))}</h4><p class="mut">${esc(b.date)} · ${esc(b.time)} · ${esc(H.cls(b.class).name)} · ${b.price != null ? cur(b.price) : '—'}</p>
      ${b.status === 'cancelled' ? '' : `<ul class="tline">${FLOW.map((s, i) => `<li class="${i <= idx ? 'ok' : ''} ${i === idx ? 'cur' : ''}"><i></i>${t('st_' + s)}</li>`).join('')}</ul>`}
      ${drv ? `<div class="drvc"><div class="av">${esc(drv.name[0])}</div><div><b>${esc(drv.name)}</b><small class="mut">${esc(drv.car || '')} · ${esc(drv.plate || '')} · ★ ${drv.rating || '5.0'}</small></div><a class="btn btn-sm btn-ink" href="tel:${esc(drv.phone)}">☎</a></div>` : ''}
      <div class="acts">${b.pay_status !== 'paid' && b.status !== 'cancelled' && C.payments.online && b.price ? `<button class="btn btn-gold btn-sm" id="tPay">${APPLE} Pay · ${cur(b.price)}</button>` : b.pay_status === 'paid' ? `<span class="badge okb">✓ ${t('paid')}</span>` : ''}
      ${canCancel ? `<button class="btn btn-sm" id="tCancel">${t('cancel')}</button>` : ''}${b.status === 'done' ? `<a class="btn btn-sm" href="#reviews" id="tRev">★ ${t('rate')}</a>` : ''}</div>`;
    if ($('#tCancel')) $('#tCancel').onclick = async () => { if (!confirm(t('cancel_q'))) return; if (LIVE) await db.cancelBooking(b.ref, p); else await db.update('bookings', b.id, { status: 'cancelled', pay_status: b.pay_status === 'paid' ? 'refunded' : b.pay_status, history: [...(b.history || []), { s: 'cancelled', t: H.now(), by: 'client' }] }); notify(`❌ Otkazana ${b.ref}`); toast(t('cancelled')); lookup(); };
    if ($('#tPay')) $('#tPay').onclick = () => { S.saved = b; S.ref = b.ref; S.paid = false; afterPay = lookup; startPay('apple', b.price); };
    if ($('#tRev')) $('#tRev').onclick = () => { $('#rName').value = b.name.split(' ')[0]; $('#rRoute').value = H.route(b); };
  }
  $('#trk').onsubmit = e => { e.preventDefault(); lookup(); };

  /* ---------------- REVIEWS ---------------- */
  let rating = 5; const stars = () => $$('#rstars button').forEach(b => b.classList.toggle('on', +b.dataset.v <= rating));
  $$('#rstars button').forEach(b => b.onclick = () => { rating = +b.dataset.v; stars(); }); stars();
  async function loadReviews() {
    const rs = await db.publicReviews(), g = C.googleRating;
    if (!rs.length) { $('.rtrack').style.display = 'none'; return; }
    $('#avg').textContent = (g ? g.avg : rs.reduce((a, r) => a + r.rating, 0) / rs.length).toFixed(1);
    $('#cnt').textContent = rs.length + ' ' + t('on_site') + (g ? ` · ${g.count} Google` : '');
    let l = rs.slice(); while (l.length < 8) l = l.concat(rs);
    $('#revs').innerHTML = l.concat(l).map(r => `<div class="rev"><div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div><p>${esc(r.text)}</p><footer><div class="av">${esc(r.name[0])}</div><div><b>${esc(r.name)}</b><small class="mut">${esc(r.route || '')}</small></div></footer></div>`).join('');
  }
  $('#rform').onsubmit = async e => {
    e.preventDefault(); if ($('#rText').value.trim().length < 5) return toast(t('short_review'));
    await db.insert('reviews', { name: $('#rName').value.trim(), route: $('#rRoute').value.trim(), rating, text: $('#rText').value.trim(), status: 'pending', source: 'site' });
    notify(`⭐ Novi utisak (${rating}/5) — ${$('#rName').value}: ${$('#rText').value.slice(0, 200)}`);
    $('#rOk').hidden = false; const hi = rating >= 4; $('#rform').reset(); rating = 5; stars();
    if (hi) setTimeout(() => { if (confirm(t('rf_g2'))) open(C.googleReviewUrl, '_blank'); }, 300);
  };

  /* ---------------- LANDING (avion sleće, Tesla čeka) ---------------- */
  $('#rwl').innerHTML = Array.from({ length: 11 }, (_, i) => `<circle cx="${330 + i * 23}" cy="386" r="1.6" fill="#f0d79b" opacity=".7"/>`).join('');
  const rp = $('#rp'), rl = rp.getTotalLength(), pp = $('#pp'), pl = pp.getTotalLength(), land = $('#landing'), start = rp.getPointAtLength(0);
  rp.style.strokeDasharray = rl; rp.style.strokeDashoffset = rl;
  const cl = (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a))), ease = x => 1 - Math.pow(1 - x, 3);
  function landingFrame() {
    const r = land.getBoundingClientRect(), k = Math.max(0, Math.min(1, -r.top / (r.height - innerHeight)));
    const a = ease(cl(k, 0, .45)), p1 = pp.getPointAtLength(pl * a), p2 = pp.getPointAtLength(Math.min(pl, pl * a + 2));
    $('#plane').setAttribute('transform', `translate(${p1.x},${p1.y}) rotate(${a >= 1 ? 0 : Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI})`);
    $('#planeS').setAttribute('transform', `scale(${.7 + .5 * Math.min(1, p1.y / 397)})`);
    $('#psh').setAttribute('cx', p1.x); $('#psh').setAttribute('opacity', p1.y > 300 ? (p1.y - 300) / 97 * .8 : 0);
    const w = cl(k, .47, .6), px = $('#paxDot'); px.setAttribute('opacity', w > 0 && w < 1 ? 1 : 0); px.setAttribute('cx', 540 + (start.x - 540) * w); px.setAttribute('cy', 410 + (start.y - 410) * w);
    const d = ease(cl(k, .6, 1)), cp = rp.getPointAtLength(rl * d);
    rp.style.strokeDashoffset = rl * (1 - d); $('#lcar').setAttribute('transform', `translate(${cp.x},${cp.y})`);
    $('#wait').style.display = $('#sign').style.display = k < .6 ? '' : 'none'; $('#nsPin').setAttribute('opacity', d > .97 ? 1 : .35);
    $('#rKm').textContent = Math.round(95 * d); $('#rMin').textContent = Math.round(65 * d); $('#rCo').textContent = (11.4 * d).toFixed(1);
    const ph = k < .3 ? ['✈', 'ph1', 0] : k < .45 ? ['🛬', 'ph2', 0] : k < .6 ? ['🪧', 'ph3', 1] : k < .98 ? ['⚡', 'ph4', 1] : ['🏠', 'ph5', 1];
    $('#fIc').textContent = ph[0]; $('#fTx').textContent = t(ph[1]); $('#fDot').className = ph[2] ? 'on' : '';
  }

  /* ---------------- MOTION / NAV ---------------- */
  function onScroll() {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    $('#prog').style.width = (y / h * 100) + '%'; $('#nav').classList.toggle('solid', y > 60);
    landingFrame();
  }
  addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('shown'); io.unobserve(e.target); } }), { threshold: .12 });
  const watch = () => $$('.rv:not(.shown)').forEach(e => io.observe(e));
  $('#burger').onclick = () => $('#mmenu').classList.add('open'); $('#mx').onclick = () => $('#mmenu').classList.remove('open');
  $$('#mmenu a').forEach(a => a.addEventListener('click', () => $('#mmenu').classList.remove('open')));
  $('#fabB').onclick = () => $('#fab').classList.toggle('open');
  $$('#langs button').forEach(b => b.onclick = () => {
    localStorage.setItem('volta_lang', b.dataset.l);
    if (FORCED) { location.href = { ru: 'index.html', sr: 'sr.html', en: 'en.html' }[b.dataset.l] + location.hash; return; }
    lang = b.dataset.l; boot();
  });

  function renderAll() { renderBook(); }
  function boot() { applyI18n(); renderStatic(); renderPrices(); renderBook(); loadReviews(); go(S.step, true); watch(); onScroll(); subs.forEach(f => f(S, { lang: true })); }

  window.VOLTA_APP = { S, set, on: f => subs.push(f), t, N, cur, item, price, needed, rank, lang: () => lang, optList, priceLabel, toast, goStep: n => go(n, true) };
  boot();
  if (Q.get('ref')) { $('#tRef').value = Q.get('ref'); try { const l = JSON.parse(localStorage.getItem('volta_last') || '{}'); if (l.ref === Q.get('ref')) { $('#tPhone').value = l.phone; setTimeout(() => { lookup(); $('#track').scrollIntoView(); }, 400); } } catch (e) { } if (Q.get('pay') === 'ok') toast('✓ ' + t('paid')); }
})();
