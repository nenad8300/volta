/* Cloudflare Worker (cron svakog minuta): automatske poruke putniku preko Telegram bota ili emaila (Resend).
   Postavljanje: npm i -g wrangler && wrangler login && cd workers && wrangler deploy
   wrangler secret put SUPABASE_SERVICE_KEY · wrangler secret put TG_BOT_TOKEN · (opciono) wrangler secret put RESEND_API_KEY */
import '../js/config.js';
import '../js/messages.js';
const C = globalThis.VOLTA_CONFIG, M = globalThis.VOLTA_MSG;
const placeName = id => id === 'ns' ? 'Novi Sad' : ((C.catalog.find(x => x.id === id) || {}).n || { sr: id }).sr;
async function sb(env, path, opt = {}) { const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { ...opt, headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', ...(opt.headers || {}) } }); if (!r.ok) throw new Error(await r.text()); return r.status === 204 ? null : r.json().catch(() => null); }
async function tg(env, chat, text) { return (await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }) })).ok; }
async function mail(env, to, subject, text) { if (!env.RESEND_API_KEY || !to) return false; return (await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: env.MAIL_FROM, to, subject, text }) })).ok; }
async function run(env) {
  const from = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
  const [bookings, drivers] = await Promise.all([sb(env, `bookings?select=*&date=gte.${from}&status=neq.cancelled`), sb(env, 'drivers?select=id,name,phone,car,plate')]);
  let sent = 0;
  for (const b of bookings) {
    const due = M.due(b); if (!due.length) continue;
    const d = drivers.find(x => x.id === b.driver_id) || null, log = { ...(b.msg_log || {}) }; let changed = false;
    for (const id of due) {
      const text = M.build(id, b, d, C, { site: env.SITE_URL, routeName: `${placeName(b.from)} → ${placeName(b.to)}` }); let via = null;
      if (b.tg_chat_id && await tg(env, b.tg_chat_id, text)) via = 'telegram-bot'; else if (b.email && await mail(env, b.email, `${C.brand} · ${b.ref}`, text)) via = 'email';
      if (via) { log[id] = { t: new Date().toISOString(), via, by: 'auto' }; sent++; changed = true; }   // bez kanala: ostaje u portalu (✉ Poruke) za slanje jednim klikom
    }
    if (changed) await sb(env, `bookings?id=eq.${b.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ msg_log: log }) });
  }
  return sent;
}
export default { async scheduled(e, env, ctx) { ctx.waitUntil(run(env)); }, async fetch() { return new Response('VOLTA notifier'); } };
