/* VOLTA — sloj podataka: DEMO (localStorage) ili Supabase, isti API */
(function () {
  const C = window.VOLTA_CONFIG, LIVE = !!(C.supabaseUrl && C.supabaseAnonKey), KEY = 'volta_db_v5';
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now() + Math.random().toString(16).slice(2));
  const ref = () => 'VT-' + Math.random().toString(36).slice(2, 7).toUpperCase().padEnd(5, 'X');
  const now = () => new Date().toISOString();
  const fmt = v => Math.round(v).toLocaleString('de-DE').replace(/\./g, ' ');
  const H = {
    place: id => id === 'ns' ? 'Novi Sad' : ((C.catalog.find(r => r.id === id) || {}).n || { sr: id }).sr,
    cls: id => C.classes.find(c => c.id === id) || C.classes[0],
    eur: v => v == null ? '—' : fmt(v) + ' RSD',
    rsd: v => v == null ? '' : '≈ €' + Math.round(v / C.eurRsd),
    route: b => H.place(b.from) + ' → ' + H.place(b.to) + (b.return_trip ? ' ↺' : ''),
    driverShare: (b, d) => (b.price || 0) * (1 - (d && d.commission != null ? d.commission : C.commissionDefault)),
    STATUS: { new: ['Nova', '#e8c77d'], confirmed: ['Potvrđena', '#7ad7ff'], assigned: ['Dodeljena', '#b59bff'], accepted: ['Vozač prihvatio', '#b59bff'], enroute: ['Vozač na putu', '#ffb35a'], arrived: ['Vozač čeka', '#ffb35a'], onboard: ['U vožnji', '#5affb0'], done: ['Završena', '#5affb0'], cancelled: ['Otkazana', '#ff6b6b'] },
    PAY: { cash: 'Vozaču (keš/kartica)', online: 'Online — Apple/Google Pay, kartica', ips: 'IPS QR', invoice: 'Faktura' },
    uid, ref, now, fmt
  };

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }
  function seed() {
    const drivers = [
      { id: 'd1', name: 'Marko Petrović', phone: '+381641112233', car: 'Tesla Model Y', plate: 'NS 123-EV', pin: '1111', commission: .25, active: true, rating: 4.9 },
      { id: 'd2', name: 'Nikola Jovanović', phone: '+381652223344', car: 'Tesla Model 3', plate: 'NS 456-EV', pin: '2222', commission: .25, active: true, rating: 4.8 },
      { id: 'd3', name: 'Stefan Ilić', phone: '+381633334455', car: 'Tesla Model Y', plate: 'NS 789-EV', pin: '3333', commission: .2, active: true, rating: 5 }];
    const names = ['Анна Смирнова', 'Ivan Petrov', 'Olga K.', 'Petar Nikolić', 'James Miller', 'Елена В.', 'Dušan K.', 'Mia S.'];
    const routes = [['ns', 'beg'], ['beg', 'ns'], ['ns', 'bg'], ['ns', 'ikea'], ['ns', 'beg'], ['ns', 'fruska'], ['ns', 'ba4'], ['ns', 'zl']];
    const pays = ['cash', 'cash', 'online', 'online', 'ips', 'invoice', 'cash', 'online'];
    const bookings = [], d0 = new Date();
    for (let i = 0; i < 46; i++) {
      const day = new Date(d0); day.setDate(d0.getDate() - Math.floor(i * .68) + (i < 4 ? 1 + i : 0));
      const r = routes[i % 8], it = C.catalog.find(x => x.id === (r[0] === 'ns' ? r[1] : r[0])), pm = pays[i % 8];
      const st = i < 4 ? ['new', 'confirmed', 'assigned', 'assigned'][i] : (i % 17 === 5 ? 'cancelled' : 'done');
      bookings.push({ id: uid(), ref: ref(), created_at: new Date(day - 2 * 864e5).toISOString(), from: r[0], to: r[1], date: day.toISOString().slice(0, 10), time: ['05:30', '09:15', '13:40', '18:05', '22:50'][i % 5],
        addr: ['Bulevar oslobođenja 12', 'Zmaj Jovina 8', 'Narodnog fronta 23', 'Hotel Park', 'Petrovaradin, Preradovićeva 2'][i % 5], flight: r[0] === 'beg' ? 'JU541' : '',
        pax: 1 + i % 4, bags: 1 + i % 3, class: i % 4 === 3 ? 'my' : 'm3', extras: ['sign'], return_trip: !it.ow, price: it.ow ?? it.rt, name: names[i % 8], phone: '+38160' + (1000000 + i * 7919), email: '', note: '',
        channel: ['telegram', 'whatsapp', 'viber', 'email'][i % 4], lang: i % 3 ? 'ru' : 'sr', pay_method: pm, pay_status: (pm === 'online' || pm === 'ips' || (st === 'done' && pm === 'cash')) ? 'paid' : 'unpaid',
        status: st, driver_id: st === 'new' || st === 'confirmed' ? null : drivers[i % 3].id, settled: i > 25,
        history: [{ s: 'new', t: day.toISOString() }].concat(st === 'done' ? [{ s: 'done', t: new Date(+day + 3 * 36e5).toISOString() }] : []),
        msg_log: st === 'done' ? Object.fromEntries(['confirm', 'driver', 'remind', 'enroute', 'arrived', 'review'].map(k => [k, { t: day.toISOString(), via: 'auto' }])) : (i === 0 ? {} : { confirm: { t: day.toISOString(), via: 'auto' } }) });
    }
    const reviews = [['Анна', 'Нови Сад → аэропорт', 5, 'Водитель ждал, хотя рейс задержался на час. Tesla чистая, цена как в прайсе.'], ['Ivan P.', 'Šoping Bijeljina', 5, 'Sve tačno: pokupili od kuće, čekali koliko treba, nazad sa punim gepekom.'], ['James', 'BEG → Novi Sad', 5, 'Name sign, water, silent car. Booked my return trip on the spot.'], ['Ольга', 'IKEA', 5, 'Очень удобно — ждали два часа, всё влезло в багажник Model Y.'], ['Petar N.', 'Novi Sad → BEG', 4, 'Odlično, vozač je stigao 10 minuta ranije.']]
      .map((r, i) => ({ id: uid(), created_at: new Date(Date.now() - i * 4 * 864e5).toISOString(), name: r[0], route: r[1], rating: r[2], text: r[3], status: 'approved', source: 'demo' }));
    reviews.push({ id: uid(), created_at: now(), name: 'Novi gost', route: 'BEG → Novi Sad', rating: 5, text: 'Odlično iskustvo!', status: 'pending', source: 'site' });
    const d = { drivers, bookings, reviews }; save(d); return d;
  }
  const db = () => load() || seed();
  const Local = {
    async list(t) { return db()[t].slice(); },
    async insert(t, row) { const d = db(); row.id = row.id || uid(); row.created_at = row.created_at || now(); d[t].unshift(row); save(d); return row; },
    async update(t, id, p) { const d = db(), r = d[t].find(x => x.id === id); if (!r) return null; Object.assign(r, p); save(d); return r; },
    async remove(t, id) { const d = db(); d[t] = d[t].filter(x => x.id !== id); save(d); },
    async findBooking(r, ph) { const p = String(ph || '').replace(/\D/g, '').slice(-6); return db().bookings.find(b => b.ref === String(r).toUpperCase().trim() && b.phone.replace(/\D/g, '').slice(-6) === p) || null; },
    async publicReviews() { return db().reviews.filter(r => r.status === 'approved'); },
    reset() { localStorage.removeItem(KEY); seed(); }
  };
  let sb = null;
  async function client() {
    if (sb) return sb;
    if (!window.supabase) await new Promise((ok, er) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'; s.onload = ok; s.onerror = er; document.head.appendChild(s); });
    return (sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey));
  }
  const Remote = {
    async list(t) { const c = await client(), { data, error } = await c.from(t).select('*').order('created_at', { ascending: false }); if (error) throw error; return data; },
    async insert(t, row) { const c = await client(); if (t === 'bookings') { const { data, error } = await c.rpc('create_booking', { b: row }); if (error) throw error; return data; } const { data, error } = await c.from(t).insert(row).select().maybeSingle(); if (error) throw error; return data || row; },
    async update(t, id, p) { const c = await client(), { data, error } = await c.from(t).update(p).eq('id', id).select().single(); if (error) throw error; return data; },
    async remove(t, id) { const c = await client(); await c.from(t).delete().eq('id', id); },
    async findBooking(r, ph) { const c = await client(), { data } = await c.rpc('find_booking', { p_ref: String(r).toUpperCase().trim(), p_phone: ph }); return data; },
    async cancelBooking(r, ph) { const c = await client(), { data } = await c.rpc('cancel_booking', { p_ref: r, p_phone: ph }); return data; },
    async publicReviews() { const c = await client(), { data } = await c.from('reviews').select('*').eq('status', 'approved').order('created_at', { ascending: false }); return data || []; },
    async signIn(e, p) { const c = await client(); return c.auth.signInWithPassword({ email: e, password: p }); },
    async signOut() { const c = await client(); return c.auth.signOut(); },
    async me() { const c = await client(), { data } = await c.auth.getUser(); if (!data.user) return null; const { data: p } = await c.from('profiles').select('*').eq('id', data.user.id).single(); return p; },
    async subscribe(cb) { const c = await client(); c.channel('volta').on('postgres_changes', { event: '*', schema: 'public' }, cb).subscribe(); }
  };
  async function notify(text) { if (location.protocol === 'file:') return; try { await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }); } catch (e) { } }
  window.VOLTA = { C, H, LIVE, db: LIVE ? Remote : Local, notify };
})();
