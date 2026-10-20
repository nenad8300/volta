/* VOLTA — portal: dispečer/admin + aplikacija za vozače */
(function () {
  if (!window.VOLTA || !window.VOLTA_MSG || !window.VOLTA_CONFIG) {
    const n = document.getElementById('lNote');
    if (n) n.innerHTML = '<b style="color:#ff6b6b">Greška: nisu učitani fajlovi js/config.js, js/store.js ili js/messages.js.</b><br>Proveri da u folderu <b>dist/js/</b> na GitHub-u postoje svi fajlovi i da je Cloudflare deploy uspeo.';
    return;
  }
  const { C, H, LIVE, db, notify } = window.VOLTA, M = window.VOLTA_MSG;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = H.eur, today = () => new Date().toISOString().slice(0, 10);
  const badge = s => { const [l, c] = H.STATUS[s] || [s, '#fff']; return `<span class="badge" style="background:${c}1f;color:${c}">${l}</span>`; };
  const payBadge = b => b.pay_status === 'paid' ? '<span class="badge" style="background:#5affb01f;color:#5affb0">Plaćeno</span>' : b.pay_status === 'refunded' ? '<span class="badge" style="background:#ff6b6b1f;color:#ff6b6b">Refund</span>' : `<span class="badge" style="background:#ffffff12;color:#aab">${{ cash: 'Vozaču', ips: 'Čeka IPS', invoice: 'Faktura', online: 'Čeka online' }[b.pay_method] || '—'}</span>`;
  const waLink = (ph, t) => `https://wa.me/${String(ph).replace(/\D/g, '')}?text=${encodeURIComponent(t)}`;
  let tt; const toast = m => { const e = $('#toast'); e.textContent = m; e.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => e.classList.remove('on'), 3500); };
  $$('.brandT').forEach(e => e.textContent = C.brand);
  let ME = null, VIEW = 'dash', D = { bookings: [], drivers: [], reviews: [] }, F = { st: 'active', q: '', from: '', to: '' };
  const load = async () => { [D.bookings, D.drivers, D.reviews] = await Promise.all([db.list('bookings'), db.list('drivers'), db.list('reviews')]); };
  const drv = id => D.drivers.find(d => d.id === id);
  const sortB = a => a.sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time));

  /* ---------- login ---------- */
  let role = 'admin';
  async function initLogin() {
    if (LIVE) { $('#lDemo').hidden = true; $('#lLive').hidden = false; $('#lseg').hidden = true; $('#lNote').innerHTML = 'Prijava Supabase nalogom. Uloga (admin / dispatcher / driver) je u tabeli <b>profiles</b>.'; }
    $$('#lseg button').forEach(b => b.onclick = () => { role = b.dataset.r; $$('#lseg button').forEach(x => x.classList.toggle('on', x === b)); $('#lDrvW').hidden = role !== 'driver'; });
    $('#lGo').onclick = login; [$('#lPin'), $('#lPass')].forEach(i => i && (i.onkeydown = e => e.key === 'Enter' && login()));
    if (!LIVE) { try { await load(); } catch (e) { toast('Greška pri učitavanju demo podataka: ' + e.message); } $('#lDrv').innerHTML = D.drivers.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join(''); }
    try { const s = JSON.parse(sessionStorage.getItem('volta_me')); if (s && !LIVE) { ME = s; return enter(); } } catch (e) { }
    if (LIVE) { const p = await db.me(); if (p) { ME = p; enter(); } }
  }
  async function login() {
    if (LIVE) { const { error } = await db.signIn($('#lMail').value, $('#lPass').value); if (error) return toast('Pogrešan email ili lozinka'); ME = await db.me(); if (!ME) return toast('Nalog nema ulogu'); return enter(); }
    const pin = $('#lPin').value.trim();
    if (role === 'admin') { if (pin !== C.demoAdminPin) return toast('Pogrešan PIN'); ME = { role: 'admin', name: 'Dispečer' }; }
    else { const d = D.drivers.find(x => x.id === $('#lDrv').value); if (!d || d.pin !== pin) return toast('Pogrešan PIN'); ME = { role: 'driver', driver_id: d.id, name: d.name }; }
    sessionStorage.setItem('volta_me', JSON.stringify(ME)); enter();
  }
  async function enter() {
    $('#login').style.display = 'none'; await load();
    if (ME.role === 'driver') { $('#drv').style.display = 'block'; driverApp(); }
    else { $('#app').style.display = 'block'; $('#modeB').textContent = LIVE ? 'LIVE · Supabase' : 'DEMO'; $('#modeB').classList.toggle('live', LIVE); show(VIEW); }
    watch();
  }
  $$('[data-out]').forEach(a => a.onclick = async () => { sessionStorage.removeItem('volta_me'); if (LIVE) await db.signOut(); location.reload(); });
  function watch() {
    let known = new Set(D.bookings.map(b => b.id));
    const refresh = async () => { await load(); const fresh = D.bookings.filter(b => !known.has(b.id)); known = new Set(D.bookings.map(b => b.id));
      if (fresh.length && ME.role !== 'driver') { toast(`🚘 Nova rezervacija ${fresh[0].ref} · ${H.route(fresh[0])}`); beep(); }
      ME.role === 'driver' ? driverRender() : show(VIEW, true); };
    if (LIVE) db.subscribe(refresh); else addEventListener('storage', e => { if (e.key === 'volta_db_v5') refresh(); });
  }
  function beep() { try { const a = new AudioContext(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.setValueAtTime(.08, a.currentTime); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + .5); o.start(); o.stop(a.currentTime + .5); } catch (e) { } }
  async function patch(b, p) { if (p.status && p.status !== b.status) p.history = [...(b.history || []), { s: p.status, t: H.now(), by: ME.name }]; Object.assign(b, await db.update('bookings', b.id, p) || p); }

  $$('.side a[data-v]').forEach(a => a.onclick = () => { show(a.dataset.v); $('#side').classList.remove('open'); });
  $('#mMenu').onclick = () => $('#side').classList.toggle('open');
  function show(v, silent) {
    VIEW = v; $$('.side a[data-v]').forEach(a => a.classList.toggle('on', a.dataset.v === v));
    const nNew = D.bookings.filter(b => b.status === 'new').length, nRev = D.reviews.filter(r => r.status === 'pending').length, nMsg = D.bookings.reduce((a, b) => a + M.due(b).length, 0);
    [['#nNew', nNew], ['#nRev', nRev], ['#nMsg', nMsg]].forEach(([s, n]) => { $(s).hidden = !n; $(s).textContent = n; });
    ({ dash, rides, messages, drivers, fin, reviews, settings })[v](); if (!silent) scrollTo(0, 0);
  }
  const top = (title, right = '') => `<div class="top"><div><div class="mut" style="font-size:12px;letter-spacing:.14em;text-transform:uppercase">${new Date().toLocaleDateString('sr-Latn', { weekday: 'long', day: 'numeric', month: 'long' })}</div><h2 class="serif">${title}</h2></div><div style="display:flex;gap:8px;flex-wrap:wrap">${right}</div></div>`;

  function dash() {
    const m = today().slice(0, 7), mb = D.bookings.filter(b => b.date.startsWith(m) && b.status !== 'cancelled'), done = mb.filter(b => b.status === 'done');
    const rev = done.reduce((a, b) => a + b.price, 0), comm = done.reduce((a, b) => a + b.price - H.driverShare(b, drv(b.driver_id)), 0), open = D.bookings.filter(b => ['new', 'confirmed'].includes(b.status)).length;
    const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); const k = d.toISOString().slice(0, 10); return [k, D.bookings.filter(b => b.date === k && b.status === 'done').reduce((a, b) => a + b.price, 0)]; }), mx = Math.max(...days.map(d => d[1]), 1);
    const cols = { cash: '#e2c48d', online: '#7ad7ff', ips: '#b59bff', invoice: '#5affb0' }, mix = Object.keys(cols).map(k => [k, mb.filter(b => b.pay_method === k).length]), tot = mix.reduce((a, b) => a + b[1], 0) || 1; let acc = 0;
    const grad = mix.map(([k, v]) => { const s = acc; acc += v / tot * 360; return `${cols[k]} ${s}deg ${acc}deg`; }).join(',');
    const up = sortB(D.bookings.filter(b => b.date >= today() && !['done', 'cancelled'].includes(b.status))).slice(0, 7);
    $('#main').innerHTML = top('Pregled', `<a class="btn" href="index.html#fleet" target="_blank">+ Sa sajta</a><button class="btn acc" id="newB">+ Telefonska rezervacija</button>`) + `
      <div class="kpis"><div class="kpi"><small>Prihod (mesec)</small><b>${eur(rev)}</b><em>${done.length} završenih</em></div><div class="kpi"><small>Neto platforme</small><b>${eur(comm)}</b><em>provizija</em></div>
      <div class="kpi"><small>Vožnje (mesec)</small><b>${mb.length}</b><em>${D.bookings.filter(b => b.date === today()).length} danas</em></div><div class="kpi"><small>Prosečna vožnja</small><b>${eur(done.length ? rev / done.length : 0)}</b></div>
      <div class="kpi"><small>Online plaćanja</small><b>${Math.round(mb.filter(b => b.pay_method === 'online').length / (mb.length || 1) * 100)}%</b></div><div class="kpi" style="${open ? 'border-color:var(--acc)' : ''}"><small>Čeka dodelu</small><b>${open}</b></div></div>
      <div class="grid2"><div class="card"><h3>Prihod — 14 dana <span class="mut">${eur(days.reduce((a, d) => a + d[1], 0))}</span></h3><div class="bars">${days.map(([k, v]) => `<div title="${eur(v)}"><i style="height:${v / mx * 100}%"></i><span>${k.slice(8)}</span></div>`).join('')}</div></div>
      <div class="card"><h3>Način plaćanja</h3><div class="donut" style="background:conic-gradient(${grad})"></div><div class="leg">${mix.map(([k, v]) => `<div><i style="background:${cols[k]}"></i>${H.PAY[k]}<b>${v}</b></div>`).join('')}</div></div></div>
      <div class="grid2"><div class="card list"><h3>Predstojeće vožnje <button class="btn sm" id="toRides">Sve →</button></h3>${up.map(b => `<div class="row"><div class="when"><b>${b.time}</b><small>${b.date.slice(8)}.${b.date.slice(5, 7)}.</small></div><div style="flex:1;min-width:0"><b class="ref" data-ref="${b.id}">${b.ref}</b> · ${esc(H.route(b))}<div class="mut" style="font-size:12px">${esc(b.name)} · ${H.cls(b.class).name} · ${drv(b.driver_id) ? esc(drv(b.driver_id).name) : '<span style="color:var(--acc)">bez vozača</span>'}</div></div>${badge(b.status)}</div>`).join('') || '<p class="mut">Nema.</p>'}</div>
      <div class="card list"><h3>Vozači</h3>${D.drivers.map(d => `<div class="row"><div class="av" style="width:36px;height:36px">${esc(d.name[0])}</div><div style="flex:1"><b>${esc(d.name)}</b><div class="mut" style="font-size:12px">${esc(d.car)} · ${D.bookings.filter(b => b.driver_id === d.id && b.date === today()).length} danas</div></div><span class="badge" style="color:${d.active ? '#5affb0' : '#888'}">${d.active ? 'Online' : 'Offline'}</span></div>`).join('')}</div></div>`;
    $('#toRides').onclick = () => show('rides'); $('#newB').onclick = () => editBooking(); $$('[data-ref]').forEach(e => e.onclick = () => detail(D.bookings.find(b => b.id === e.dataset.ref)));
  }

  function rides() {
    let l = D.bookings.slice();
    if (F.st === 'active') l = l.filter(b => !['done', 'cancelled'].includes(b.status)); else if (F.st !== 'all') l = l.filter(b => b.status === F.st);
    if (F.from) l = l.filter(b => b.date >= F.from); if (F.to) l = l.filter(b => b.date <= F.to);
    if (F.q) { const q = F.q.toLowerCase(); l = l.filter(b => [b.ref, b.name, b.phone, b.flight, b.addr].join(' ').toLowerCase().includes(q)); }
    l = F.st === 'active' ? sortB(l) : l.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    $('#main').innerHTML = top('Vožnje', `<button class="btn" id="csv">⇩ CSV</button><button class="btn acc" id="newB">+ Nova</button>`) + `
      <div class="filters"><select class="in" id="fSt"><option value="active">Aktivne</option><option value="all">Sve</option>${Object.entries(H.STATUS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select>
      <input class="in" type="date" id="fFrom" value="${F.from}"><input class="in" type="date" id="fTo" value="${F.to}"><input class="in" id="fQ" placeholder="🔍 Ref, ime, telefon, let…" value="${esc(F.q)}" style="flex:1;min-width:200px">
      <span class="mut" style="align-self:center">${l.length} · ${eur(l.filter(b => b.status !== 'cancelled').reduce((a, b) => a + (b.price || 0), 0))}</span></div>
      <div class="tw"><table><thead><tr><th>Ref</th><th>Termin</th><th>Ruta</th><th>Putnik</th><th>Vozilo</th><th>Cena</th><th>Plaćanje</th><th>Vozač</th><th>Status</th></tr></thead><tbody>
      ${l.map(b => `<tr class="${b.status === 'new' ? 'new' : ''}"><td><span class="ref" data-ref="${b.id}">${b.ref}</span></td><td><b>${b.date.slice(8)}.${b.date.slice(5, 7)}.</b> ${b.time}${b.flight ? `<div class="mut" style="font-size:11.5px">✈ ${esc(b.flight)}</div>` : ''}</td>
      <td>${esc(H.route(b))}<div class="mut" style="font-size:11.5px">${esc(b.addr || '')}</div></td><td>${esc(b.name)}<div class="mut" style="font-size:11.5px">${esc(b.phone)} · ${esc(b.channel || '')}</div></td>
      <td>${H.cls(b.class).name.replace('Tesla ', '')}<div class="mut" style="font-size:11.5px">👤${b.pax} 🧳${b.bags}</div></td><td><b>${eur(b.price)}</b></td><td>${payBadge(b)}</td>
      <td><select class="in" data-as="${b.id}" ${['done', 'cancelled'].includes(b.status) ? 'disabled' : ''}><option value="">— dodeli —</option>${D.drivers.filter(d => d.active || d.id === b.driver_id).map(d => `<option value="${d.id}" ${d.id === b.driver_id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></td>
      <td><select class="in" data-st="${b.id}">${Object.entries(H.STATUS).map(([k, v]) => `<option value="${k}" ${k === b.status ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></td></tr>`).join('') || '<tr><td colspan="9" class="mut" style="text-align:center;padding:40px">Nema vožnji.</td></tr>'}</tbody></table></div>`;
    $('#fSt').value = F.st; $('#fSt').onchange = e => { F.st = e.target.value; rides(); }; $('#fFrom').onchange = e => { F.from = e.target.value; rides(); }; $('#fTo').onchange = e => { F.to = e.target.value; rides(); };
    $('#fQ').onchange = e => { F.q = e.target.value; rides(); };
    $$('[data-ref]').forEach(e => e.onclick = () => detail(D.bookings.find(b => b.id === e.dataset.ref)));
    $$('[data-as]').forEach(s => s.onchange = async () => { await assign(D.bookings.find(x => x.id === s.dataset.as), s.value); rides(); });
    $$('[data-st]').forEach(s => s.onchange = async () => { const b = D.bookings.find(x => x.id === s.dataset.st); await patch(b, { status: s.value }); toast(`${b.ref} → ${H.STATUS[s.value][0]}`); rides(); });
    $('#newB').onclick = () => editBooking(); $('#csv').onclick = () => csv(l);
  }
  async function assign(b, id) { await patch(b, { driver_id: id || null, status: id ? 'assigned' : 'confirmed' }); const d = drv(id); if (d) { toast(`${b.ref} → ${d.name}`); notify(`👤 ${b.ref} dodeljena: ${d.name}`); } }
  function csv(l) {
    const rows = [['ref', 'datum', 'vreme', 'ruta', 'ime', 'telefon', 'vozilo', 'putnici', 'kofera', 'cena', 'placanje', 'status_placanja', 'status', 'vozac'], ...l.map(b => [b.ref, b.date, b.time, H.route(b), b.name, b.phone, H.cls(b.class).name, b.pax, b.bags, b.price, b.pay_method, b.pay_status, b.status, drv(b.driver_id)?.name || ''])];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv' })); a.download = `volta-voznje-${today()}.csv`; a.click();
  }

  /* ---------- poruke putniku ---------- */
  const siteUrl = () => (C.siteUrl || location.origin + location.pathname.replace(/portal(\.html)?.*$/, '')).replace(/\/$/, '');
  const msgText = (id, b) => M.build(id, b, drv(b.driver_id), C, { site: siteUrl(), routeName: H.route(b) });
  async function sendMsg(b, id) {
    const txt = msgText(id, b), ph = String(b.phone || '').replace(/\D/g, '');
    let href = null, copy = false, via = b.channel || 'whatsapp';
    if (via === 'whatsapp') href = waLink(b.phone, txt); else if (via === 'email' && b.email) href = `mailto:${b.email}?subject=${encodeURIComponent(C.brand + ' ' + b.ref)}&body=${encodeURIComponent(txt)}`;
    else if (via === 'viber') { href = 'viber://chat?number=%2B' + ph; copy = true; } else { copy = true; if (via === 'telegram') href = 'https://t.me/+' + ph; }
    if (copy) { try { await navigator.clipboard.writeText(txt); } catch (e) { } toast('Tekst kopiran — nalepi u ' + via); }
    if (href) window.open(href, '_blank');
    await patch(b, { msg_log: Object.assign({}, b.msg_log || {}, { [id]: { t: H.now(), by: ME.name, via } }) });
  }
  function messages() {
    const now = Date.now(), rows = [], L = Object.fromEntries(M.RULES.map(r => [r.id, r.label]));
    D.bookings.filter(b => b.status !== 'cancelled').forEach(b => M.due(b, now).forEach(id => rows.push({ b, id })));
    sortB(rows.map(r => r.b)); rows.sort((x, y) => (x.b.date + x.b.time).localeCompare(y.b.date + y.b.time));
    const sent = D.bookings.flatMap(b => Object.entries(b.msg_log || {}).map(([id, v]) => ({ b, id, v }))).sort((a, b) => b.v.t.localeCompare(a.v.t)).slice(0, 25);
    $('#main').innerHTML = top('Poruke putnicima', `<span class="mode ${LIVE ? 'live' : ''}">${LIVE ? 'AUTO: Telegram bot + email' : 'Slanje jednim klikom'}</span>`) + `
      <div class="grid2"><div class="card list"><h3>Za slanje sada <span class="mut">${rows.length}</span></h3>${rows.map((r, i) => `<div class="row" style="align-items:flex-start"><div class="when"><b>${r.b.time}</b><small>${r.b.date.slice(8)}.${r.b.date.slice(5, 7)}.</small></div>
        <div style="flex:1;min-width:0"><b>${esc(L[r.id])}</b> · <span class="ref" data-ref="${r.b.id}">${r.b.ref}</span><div class="mut" style="font-size:12px">${esc(r.b.name)} · ${esc(r.b.channel || 'whatsapp')} · ${esc((r.b.lang || 'ru').toUpperCase())}</div><pre class="msg">${esc(msgText(r.id, r.b))}</pre></div>
        <div style="display:grid;gap:6px"><button class="btn sm acc" data-send="${i}">Pošalji</button><button class="btn sm" data-skip="${i}">Preskoči</button></div></div>`).join('') || '<p class="mut">Sve poslato ✓</p>'}</div>
      <div class="card list"><h3>Raspored</h3>${M.RULES.map(r => `<div class="row"><b style="flex:1">${r.label}</b><span class="mut" style="font-size:12px">${typeof r.when === 'number' ? Math.abs(r.when / 60) + ' h pre' : r.when === 'created' ? 'odmah' : r.when === 'done+90' ? '90 min posle' : 'na status'}</span></div>`).join('')}
      <h3 style="margin-top:18px">Poslednje poslato</h3>${sent.map(s => `<div class="row"><span style="flex:1">${esc(L[s.id] || s.id)} · ${s.b.ref}</span><small class="mut">${new Date(s.v.t).toLocaleString('sr-Latn')} · ${esc(s.v.via || '')}</small></div>`).join('')}</div></div>`;
    $$('[data-send]').forEach(x => x.onclick = async () => { const r = rows[+x.dataset.send]; await sendMsg(r.b, r.id); show('messages', true); });
    $$('[data-skip]').forEach(x => x.onclick = async () => { const r = rows[+x.dataset.skip]; await patch(r.b, { msg_log: Object.assign({}, r.b.msg_log || {}, { [r.id]: { t: H.now(), via: 'preskočeno' } }) }); show('messages', true); });
    $$('[data-ref]').forEach(e => e.onclick = () => detail(D.bookings.find(b => b.id === e.dataset.ref)));
  }

  /* ---------- detalj ---------- */
  function detail(b) {
    const d = drv(b.driver_id), msgDrv = `${b.ref} · ${b.date} ${b.time}\n${H.route(b)}\n${b.addr}\n${b.flight ? '✈ ' + b.flight + '\n' : ''}${b.name} ${b.phone}\n👤${b.pax} 🧳${b.bags}\n${eur(b.price)} · ${H.PAY[b.pay_method]} (${b.pay_status})${b.note ? '\n📝 ' + b.note : ''}`;
    $('#dw').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:24px;letter-spacing:.1em">${b.ref}</b><button class="btn sm" id="dwX">✕</button></div>
      <div style="margin-top:8px;display:flex;gap:6px">${badge(b.status)} ${payBadge(b)}</div><h3 style="margin-top:14px;font-size:20px">${esc(H.route(b))}</h3>
      <div class="kv"><span>Termin</span><span>${b.date} u ${b.time}</span><span>Adresa</span><span>${esc(b.addr || '—')}</span>
      ${b.flight ? `<span>Let</span><span>${esc(b.flight)} · <a style="color:var(--acc)" target="_blank" href="https://www.flightradar24.com/data/flights/${esc(b.flight.toLowerCase())}">status →</a></span>` : ''}
      <span>Putnik</span><span>${esc(b.name)}<br><a style="color:var(--acc)" href="tel:${esc(b.phone)}">${esc(b.phone)}</a> ${b.email ? '· ' + esc(b.email) : ''}</span><span>Kanal / jezik</span><span>${esc(b.channel || '—')} · ${esc((b.lang || 'ru').toUpperCase())}</span>
      <span>Vozilo</span><span>${H.cls(b.class).name} · 👤${b.pax} 🧳${b.bags}</span><span>Dodaci</span><span>${esc((b.extras || []).join(', ') || '—')}</span>
      <span>Cena</span><span><b>${eur(b.price)}</b></span><span>Plaćanje</span><span>${H.PAY[b.pay_method]} · ${b.pay_status}</span>
      ${d ? `<span>Zarada vozača</span><span>${eur(H.driverShare(b, d))}</span>` : ''}${b.note ? `<span>Napomena</span><span>${esc(b.note)}</span>` : ''}</div>
      <label class="l">Vozač</label><select class="in" id="dwDrv"><option value="">— nije dodeljen —</option>${D.drivers.map(x => `<option value="${x.id}" ${x.id === b.driver_id ? 'selected' : ''}>${esc(x.name)} · ${esc(x.car)}</option>`).join('')}</select>
      <div class="acts">${d ? `<a class="btn" target="_blank" href="${waLink(d.phone, msgDrv)}">🚘 Pošalji vozaču</a>` : ''}${b.pay_status !== 'paid' ? '<button class="btn" id="dwPaid">✓ Plaćeno</button>' : ''}<button class="btn" id="dwEdit">✎ Izmeni</button>${b.status !== 'cancelled' ? '<button class="btn bad" id="dwCancel">Otkaži</button>' : ''}</div>
      <label class="l" style="margin-top:20px">Poruke putniku</label><div class="acts">${M.RULES.map(r => `<button class="btn sm ${(b.msg_log || {})[r.id] ? '' : M.due(b).includes(r.id) ? 'acc' : ''}" data-msg="${r.id}">${(b.msg_log || {})[r.id] ? '✓ ' : ''}${r.label}</button>`).join('')}</div>
      <label class="l" style="margin-top:20px">Istorija</label><div class="hist">${(b.history || []).map(h => `<div><b>${H.STATUS[h.s]?.[0] || h.s}</b> <span class="mut">${new Date(h.t).toLocaleString('sr-Latn')}${h.by ? ' · ' + esc(h.by) : ''}</span></div>`).join('')}</div>`;
    $('#drawer').classList.add('open'); $('#dwX').onclick = closeD;
    $('#dwDrv').onchange = async e => { await assign(b, e.target.value); detail(b); show(VIEW, true); };
    $('#dwPaid') && ($('#dwPaid').onclick = async () => { await patch(b, { pay_status: 'paid', paid_at: H.now() }); detail(b); show(VIEW, true); });
    $('#dwCancel') && ($('#dwCancel').onclick = async () => { if (!confirm('Otkazati ' + b.ref + '?')) return; await patch(b, { status: 'cancelled', pay_status: b.pay_status === 'paid' ? 'refunded' : b.pay_status }); detail(b); show(VIEW, true); });
    $('#dwEdit').onclick = () => editBooking(b);
    $$('[data-msg]').forEach(x => x.onclick = async () => { await sendMsg(b, x.dataset.msg); detail(b); });
  }
  const closeD = () => $('#drawer').classList.remove('open'); $('#drawer').onclick = e => { if (e.target.id === 'drawer') closeD(); };
  function editBooking(b) {
    const n = !b; b = b || { from: 'ns', to: 'beg', date: today(), time: '10:00', pax: 1, bags: 1, class: 'm3', extras: ['sign'], pay_method: 'cash', channel: 'phone', name: '', phone: '', addr: '', flight: '', note: '', lang: 'ru' };
    const pl = v => C.places.map(p => `<option value="${p[0]}" ${p[0] === v ? 'selected' : ''}>${p[1]}</option>`).join('');
    $('#dw').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><h3 class="serif" style="font-size:30px">${n ? 'Nova rezervacija' : 'Izmena ' + b.ref}</h3><button class="btn sm" id="dwX">✕</button></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 10px"><div><label class="l">Od</label><select class="in" id="eFrom">${pl(b.from)}</select></div><div><label class="l">Do</label><select class="in" id="eTo">${pl(b.to)}</select></div>
      <div><label class="l">Datum</label><input class="in" type="date" id="eDate" value="${b.date}"></div><div><label class="l">Vreme</label><input class="in" type="time" id="eTime" value="${b.time}"></div>
      <div style="grid-column:1/-1"><label class="l">Adresa</label><input class="in" id="eAddr" value="${esc(b.addr)}"></div><div><label class="l">Ime</label><input class="in" id="eName" value="${esc(b.name)}"></div><div><label class="l">Telefon</label><input class="in" id="ePhone" value="${esc(b.phone)}"></div>
      <div><label class="l">Let</label><input class="in" id="eFl" value="${esc(b.flight || '')}"></div><div><label class="l">Vozilo</label><select class="in" id="eCls">${C.classes.map(c => `<option value="${c.id}" ${c.id === b.class ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>
      <div><label class="l">Putnici</label><input class="in" type="number" min="1" max="8" id="ePax" value="${b.pax}"></div><div><label class="l">Kofera</label><input class="in" type="number" min="0" max="8" id="eBags" value="${b.bags}"></div>
      <div><label class="l">Plaćanje</label><select class="in" id="ePay">${Object.entries(H.PAY).map(([k, v]) => `<option value="${k}" ${k === b.pay_method ? 'selected' : ''}>${v}</option>`).join('')}</select></div><div><label class="l">Cena (RSD)</label><input class="in" type="number" id="ePrice" value="${b.price ?? ''}" placeholder="auto"></div>
      <div><label class="l">Jezik poruka</label><select class="in" id="eLang">${['ru', 'sr', 'en'].map(l => `<option ${l === b.lang ? 'selected' : ''}>${l}</option>`).join('')}</select></div><div><label class="l">Kanal</label><select class="in" id="eCh">${['whatsapp', 'telegram', 'viber', 'email', 'phone'].map(l => `<option ${l === b.channel ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div style="grid-column:1/-1"><label class="l">Napomena</label><input class="in" id="eNote" value="${esc(b.note || '')}"></div></div><button class="btn acc big" id="eSave" style="margin-top:18px">Sačuvaj</button>`;
    $('#drawer').classList.add('open'); $('#dwX').onclick = closeD;
    const auto = () => { const k = $('#eFrom').value === 'ns' ? $('#eTo').value : $('#eFrom').value, v = C.prices['ns-' + k]; return v != null ? v * H.cls($('#eCls').value).mult : null; };
    $('#eSave').onclick = async () => {
      const v = { from: $('#eFrom').value, to: $('#eTo').value, date: $('#eDate').value, time: $('#eTime').value, addr: $('#eAddr').value, name: $('#eName').value, phone: $('#ePhone').value, flight: $('#eFl').value.toUpperCase(), class: $('#eCls').value, pax: +$('#ePax').value, bags: +$('#eBags').value, pay_method: $('#ePay').value, note: $('#eNote').value, lang: $('#eLang').value, channel: $('#eCh').value, price: +$('#ePrice').value || auto() };
      if (!v.name || !v.phone) return toast('Ime i telefon su obavezni');
      if (n) await db.insert('bookings', { ...v, ref: H.ref(), status: 'confirmed', pay_status: 'unpaid', driver_id: null, return_trip: false, extras: ['sign'], msg_log: {}, history: [{ s: 'confirmed', t: H.now(), by: ME.name }] }); else await patch(b, v);
      await load(); closeD(); show(VIEW, true); toast('Sačuvano');
    };
  }

  /* ---------- vozači / finansije ---------- */
  function stats(d, from, to) {
    const l = D.bookings.filter(b => b.driver_id === d.id && b.status === 'done' && (!from || b.date >= from) && (!to || b.date <= to));
    const gross = l.reduce((a, b) => a + b.price, 0), share = l.reduce((a, b) => a + H.driverShare(b, d), 0), cash = l.filter(b => b.pay_method === 'cash').reduce((a, b) => a + b.price, 0), open = l.filter(b => !b.settled);
    return { n: l.length, gross, share, comm: gross - share, cash, open, owe: open.reduce((a, b) => a + (b.pay_method === 'cash' ? -(b.price - H.driverShare(b, d)) : H.driverShare(b, d)), 0) };
  }
  function drivers() {
    const m = today().slice(0, 7) + '-01';
    $('#main').innerHTML = top('Vozači', '<button class="btn acc" id="addD">+ Dodaj vozača</button>') + `<div class="dgrid">${D.drivers.map(d => { const s = stats(d, m), a = stats(d); return `<div class="dc"><div class="dc-h"><div class="av">${esc(d.name[0])}</div><div style="flex:1"><b style="font-size:16px">${esc(d.name)}</b><div class="mut" style="font-size:12px">${esc(d.car)} · ${esc(d.plate)}</div></div><span class="badge" style="color:${d.active ? '#5affb0' : '#888'}">${d.active ? 'Aktivan' : 'Neaktivan'}</span></div>
      <div class="dstats"><div><small>Vožnje (mes.)</small><b>${s.n}</b></div><div><small>Promet</small><b>${eur(s.gross)}</b></div><div><small>Zarada</small><b>${eur(s.share)}</b></div><div><small>Ocena</small><b>★ ${d.rating || '5.0'}</b></div><div><small>Provizija</small><b>${Math.round((d.commission ?? C.commissionDefault) * 100)}%</b></div><div><small>Keš kod vozača</small><b>${eur(s.cash)}</b></div></div>
      <div class="bal"><span class="mut">${a.owe >= 0 ? 'Platforma duguje vozaču' : 'Vozač duguje platformi'}</span><b style="font-size:19px;color:${a.owe >= 0 ? 'var(--ok)' : 'var(--warn)'}">${eur(Math.abs(a.owe))}</b></div>
      <div class="acts"><button class="btn sm" data-ed="${d.id}">✎ Izmeni</button>${a.open.length ? `<button class="btn sm acc" data-set="${d.id}">Izmiri ${a.open.length}</button>` : ''}<a class="btn sm" href="tel:${esc(d.phone)}">☎</a><a class="btn sm" target="_blank" href="${waLink(d.phone, '')}">💬</a></div></div>`; }).join('')}</div>`;
    $('#addD').onclick = () => editDriver(); $$('[data-ed]').forEach(b => b.onclick = () => editDriver(drv(b.dataset.ed)));
    $$('[data-set]').forEach(b => b.onclick = async () => { const s = stats(drv(b.dataset.set)); if (!confirm(`Izmiriti ${s.open.length} vožnji (${eur(Math.abs(s.owe))})?`)) return; for (const x of s.open) await db.update('bookings', x.id, { settled: true, settled_at: H.now() }); await load(); drivers(); toast('Izmireno'); });
  }
  function editDriver(d) {
    const n = !d; d = d || { name: '', phone: '', car: 'Tesla Model Y', plate: '', pin: '', commission: C.commissionDefault, active: true };
    $('#dw').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><h3 class="serif" style="font-size:30px">${n ? 'Novi vozač' : esc(d.name)}</h3><button class="btn sm" id="dwX">✕</button></div>
      <label class="l">Ime i prezime</label><input class="in" id="xN" value="${esc(d.name)}"><label class="l">Telefon</label><input class="in" id="xP" value="${esc(d.phone)}">
      <label class="l">Vozilo</label><select class="in" id="xC">${['Tesla Model 3', 'Tesla Model Y'].map(c => `<option ${c === d.car ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <label class="l">Registracija</label><input class="in" id="xR" value="${esc(d.plate)}"><label class="l">Provizija platforme (%)</label><input class="in" type="number" id="xK" value="${Math.round((d.commission ?? C.commissionDefault) * 100)}">
      ${LIVE ? '<p class="mut" style="margin-top:12px;font-size:12px">Login vozača: Supabase → Authentication → Add user, pa red u tabeli profiles (role=driver, driver_id).</p>' : `<label class="l">PIN</label><input class="in" id="xPin" value="${esc(d.pin || '')}" maxlength="6">`}
      <label class="l"><input type="checkbox" id="xA" ${d.active ? 'checked' : ''}> Aktivan</label><button class="btn acc big" id="xS" style="margin-top:14px">Sačuvaj</button>`;
    $('#drawer').classList.add('open'); $('#dwX').onclick = closeD;
    $('#xS').onclick = async () => { const v = { name: $('#xN').value.trim(), phone: $('#xP').value.trim(), car: $('#xC').value, plate: $('#xR').value.trim(), commission: (+$('#xK').value || 0) / 100, active: $('#xA').checked }; if (!LIVE) v.pin = $('#xPin').value.trim(); if (!v.name) return toast('Unesite ime');
      n ? await db.insert('drivers', { ...v, rating: 5 }) : await db.update('drivers', d.id, v); await load(); closeD(); drivers(); };
  }
  let FF = { from: today().slice(0, 7) + '-01', to: today() };
  function fin() {
    const rows = D.drivers.map(d => ({ d, s: stats(d, FF.from, FF.to) })), T = rows.reduce((a, r) => ({ n: a.n + r.s.n, gross: a.gross + r.s.gross, share: a.share + r.s.share, comm: a.comm + r.s.comm, cash: a.cash + r.s.cash }), { n: 0, gross: 0, share: 0, comm: 0, cash: 0 });
    const unpaid = D.bookings.filter(b => b.status === 'done' && b.pay_status !== 'paid').length;
    $('#main').innerHTML = top('Finansije', '<button class="btn" id="fcsv">⇩ CSV obračun</button>') + `<div class="filters"><input class="in" type="date" id="ffF" value="${FF.from}"><input class="in" type="date" id="ffT" value="${FF.to}"></div>
      <div class="kpis"><div class="kpi"><small>Promet</small><b>${eur(T.gross)}</b><em>${T.n} vožnji</em></div><div class="kpi"><small>Provizija platforme</small><b>${eur(T.comm)}</b></div><div class="kpi"><small>Zarada vozača</small><b>${eur(T.share)}</b></div><div class="kpi"><small>Keš kod vozača</small><b>${eur(T.cash)}</b></div><div class="kpi"><small>Online / IPS / faktura</small><b>${eur(T.gross - T.cash)}</b></div><div class="kpi"><small>Nenaplaćeno</small><b>${unpaid}</b></div></div>
      <div class="tw" style="margin-top:12px"><table><thead><tr><th>Vozač</th><th>Vožnje</th><th>Promet</th><th>Provizija</th><th>Zarada</th><th>Keš kod vozača</th><th>Saldo</th></tr></thead><tbody>${rows.map(({ d, s }) => { const a = stats(d); return `<tr><td><b>${esc(d.name)}</b></td><td>${s.n}</td><td>${eur(s.gross)}</td><td>${eur(s.comm)}</td><td>${eur(s.share)}</td><td>${eur(s.cash)}</td><td style="color:${a.owe >= 0 ? 'var(--ok)' : 'var(--warn)'}"><b>${a.owe >= 0 ? '+' : '−'}${eur(Math.abs(a.owe))}</b> <span class="mut" style="font-size:11px">${a.owe >= 0 ? 'isplata vozaču' : 'vozač uplaćuje'}</span></td></tr>`; }).join('')}</tbody></table></div>
      <p class="mut" style="margin-top:12px;font-size:12.5px">Putnik platio vozaču → vozač duguje proviziju. Platforma naplatila online/IPS/fakturom → platforma duguje vozaču njegov deo. Zatvara se dugmetom „Izmiri“ kod vozača.</p>`;
    $('#ffF').onchange = e => { FF.from = e.target.value; fin(); }; $('#ffT').onchange = e => { FF.to = e.target.value; fin(); };
    $('#fcsv').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + [['Vozac', 'Voznje', 'Promet', 'Provizija', 'Zarada', 'Kes'], ...rows.map(({ d, s }) => [d.name, s.n, s.gross, Math.round(s.comm), Math.round(s.share), s.cash])].map(r => r.join(';')).join('\n')], { type: 'text/csv' })); a.download = `volta-obracun-${FF.from}-${FF.to}.csv`; a.click(); };
  }
  function reviews() {
    const l = D.reviews.slice().sort((a, b) => (a.status === 'pending' ? -1 : 1) - (b.status === 'pending' ? -1 : 1));
    $('#main').innerHTML = top('Recenzije', `<a class="btn" target="_blank" href="${C.googleReviewUrl}">Google ↗</a>`) + `<div class="dgrid">${l.map(r => `<div class="dc" style="${r.status === 'pending' ? 'border-color:var(--acc)' : ''}"><div style="display:flex;justify-content:space-between"><span style="color:var(--acc)">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span><span class="badge">${{ pending: 'Čeka', approved: 'Objavljeno', hidden: 'Skriveno' }[r.status]}</span></div>
      <p style="margin:12px 0">${esc(r.text)}</p><div class="mut" style="font-size:12px">${esc(r.name)} · ${esc(r.route || '')}</div><div class="acts">${r.status !== 'approved' ? `<button class="btn sm acc" data-ok="${r.id}">Objavi</button>` : ''}${r.status !== 'hidden' ? `<button class="btn sm" data-hide="${r.id}">Sakrij</button>` : ''}<button class="btn sm bad" data-del="${r.id}">Obriši</button></div></div>`).join('')}</div>`;
    const act = async (id, p) => { p ? await db.update('reviews', id, p) : await db.remove('reviews', id); await load(); show('reviews', true); };
    $$('[data-ok]').forEach(b => b.onclick = () => act(b.dataset.ok, { status: 'approved' })); $$('[data-hide]').forEach(b => b.onclick = () => act(b.dataset.hide, { status: 'hidden' })); $$('[data-del]').forEach(b => b.onclick = () => confirm('Obrisati?') && act(b.dataset.del));
  }
  function settings() {
    $('#main').innerHTML = top('Podešavanja') + `<div class="grid2"><div class="card"><h3>Režim</h3><p>${LIVE ? '✅ LIVE — Supabase baza, svi uređaji vide iste podatke.' : '⚠️ DEMO — podaci samo u ovom pregledaču. Za produkciju upiši Supabase u js/config.js i pokreni supabase/schema.sql.'}</p>${LIVE ? '' : '<button class="btn" id="reset" style="margin-top:14px">↺ Resetuj demo podatke</button>'}</div>
      <div class="card list"><h3>Integracije</h3>${[['Plaćanje', C.payments.provider], ['Telegram', '@' + C.telegram], ['Telegram bot', C.telegramBot ? '@' + C.telegramBot : '— nije podešen'], ['WhatsApp', '+' + C.whatsapp], ['Viber', '+' + C.viber], ['Instagram', '@' + C.instagram], ['Domen', C.siteUrl || '— nije podešen']].map(r => `<div class="row"><b style="flex:1">${r[0]}</b><span class="mut">${esc(r[1])}</span></div>`).join('')}</div></div>
      <div class="card list" style="margin-top:12px"><h3>Cenovnik (js/config.js)</h3>${C.catalog.map(r => `<div class="row"><span style="flex:1">${esc(r.n.sr)}</span><b>${r.req ? 'na upit' : r.from ? 'od €' + r.oweur : eur(r.ow ?? r.rt) + (r.ow == null ? ' ↺' : '')}</b></div>`).join('')}</div>`;
    $('#reset') && ($('#reset').onclick = async () => { if (!confirm('Obrisati sve i vratiti demo podatke?')) return; db.reset(); await load(); show('dash'); });
  }

  /* ---------- aplikacija za vozača ---------- */
  let DT = 'now';
  const NEXT = { assigned: ['accepted', '✓ Prihvati vožnju'], accepted: ['enroute', '🚗 Krenuo sam'], enroute: ['arrived', '📍 Stigao sam'], arrived: ['onboard', '👤 Putnik u vozilu'], onboard: ['done', '🏁 Završi vožnju'] };
  function driverApp() {
    $$('#dTabs button').forEach(b => b.onclick = () => { DT = b.dataset.d; $$('#dTabs button').forEach(x => x.classList.toggle('on', x === b)); driverRender(); });
    $('#dOnl').onclick = async e => { e.preventDefault(); const d = drv(ME.driver_id); await db.update('drivers', d.id, { active: !d.active }); await load(); driverRender(); };
    driverRender();
  }
  function driverRender() {
    const d = drv(ME.driver_id); if (!d) return;
    $('#dAv').textContent = d.name[0]; $('#dName').textContent = d.name; $('#dCar').textContent = d.car + ' · ' + d.plate; $('#dOnl').classList.toggle('on', d.active); $('#dOnlT').textContent = d.active ? 'Online' : 'Offline';
    const mine = D.bookings.filter(b => b.driver_id === d.id);
    if (DT === 'earn') return driverEarn(d, mine);
    const l = DT === 'now' ? sortB(mine.filter(b => !['done', 'cancelled'].includes(b.status))) : mine.filter(b => b.status === 'done').sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 40);
    $('#dBody').innerHTML = `<div class="rides">${l.map((b, i) => { const nx = NEXT[b.status], nav = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.from === 'beg' ? 'Aerodrom Nikola Tesla Beograd' : (b.addr || 'Novi Sad'))}`;
      return `<div class="ride ${i === 0 && DT === 'now' ? 'hot' : ''}"><div class="ride-t"><div><div class="tm">${b.time}</div><div class="mut" style="font-size:12px;margin-top:4px">${new Date(b.date).toLocaleDateString('sr-Latn', { weekday: 'short', day: 'numeric', month: 'short' })}</div></div>${badge(b.status)}</div>
        <h4>${esc(H.route(b))}</h4><div class="mut">${esc(b.addr || '')}</div><div class="meta"><span>👤 ${esc(b.name)}</span><span>👤${b.pax} 🧳${b.bags}</span>${b.flight ? `<span>✈ ${esc(b.flight)}</span>` : ''}${b.note ? `<span>📝 ${esc(b.note)}</span>` : ''}</div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:14px">${payBadge(b)}<div class="pr">${eur(H.driverShare(b, d))}<small>vaša zarada · cena ${eur(b.price)}</small></div></div>
        ${DT === 'now' ? `<div class="quick"><a href="${nav}" target="_blank"><b>🧭</b>Navigacija</a><a href="tel:${esc(b.phone)}"><b>☎</b>Pozovi</a><a href="${waLink(b.phone, 'Dobar dan, ja sam ' + d.name + ', vaš vozač (' + C.brand + ').')}" target="_blank"><b>💬</b>WhatsApp</a>${b.flight ? `<a href="https://www.flightradar24.com/data/flights/${esc(b.flight.toLowerCase())}" target="_blank"><b>✈</b>Let</a>` : `<a href="sms:${esc(b.phone)}"><b>✉</b>SMS</a>`}</div>${nx ? `<button class="btn acc big" style="margin-top:12px" data-nx="${b.id}">${nx[1]}</button>` : ''}` : ''}</div>`; }).join('') || `<div class="empty"><b>☕</b>${DT === 'now' ? 'Nema dodeljenih vožnji.' : 'Još nema završenih vožnji.'}</div>`}</div>`;
    $$('[data-nx]').forEach(btn => btn.onclick = async () => { const b = D.bookings.find(x => x.id === btn.dataset.nx), nx = NEXT[b.status][0], p = { status: nx };
      if (nx === 'done' && b.pay_status !== 'paid' && b.pay_method === 'cash') { if (!confirm(`Naplaćeno od putnika ${eur(b.price)}?`)) return; p.pay_status = 'paid'; p.paid_at = H.now(); p.collected_by_driver = true; }
      await patch(b, p); notify(`🚘 ${b.ref}: ${H.STATUS[nx][0]} (${d.name})`); toast(H.STATUS[nx][0]); driverRender(); });
  }
  function driverEarn(d, mine) {
    const done = mine.filter(b => b.status === 'done'), m = today().slice(0, 7), sum = l => l.reduce((a, b) => a + H.driverShare(b, d), 0), s = stats(d);
    const days = [...Array(7)].map((_, i) => { const x = new Date(); x.setDate(x.getDate() - 6 + i); const k = x.toISOString().slice(0, 10); return [x.toLocaleDateString('sr-Latn', { weekday: 'short' }), sum(done.filter(b => b.date === k))]; }), mx = Math.max(...days.map(x => x[1]), 1);
    $('#dBody').innerHTML = `<div class="earn"><div class="earn-hero"><small class="mut">Zarada ovog meseca</small><b>${eur(sum(done.filter(b => b.date.startsWith(m))))}</b><span class="mut">${done.filter(b => b.date.startsWith(m)).length} vožnji</span></div>
      <div class="card"><h3>Poslednjih 7 dana</h3><div class="bars" style="height:140px">${days.map(([k, v]) => `<div title="${eur(v)}"><i style="height:${v / mx * 100}%"></i><span>${k}</span></div>`).join('')}</div></div>
      <div class="bal" style="background:var(--card)"><span>${s.owe >= 0 ? 'Platforma vam duguje' : 'Za uplatu platformi'}</span><b style="font-size:20px;color:${s.owe >= 0 ? 'var(--ok)' : 'var(--warn)'}">${eur(Math.abs(s.owe))}</b></div></div>`;
  }
  initLogin();
})();
