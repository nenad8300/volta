// /api/pay-callback — gateway potvrđuje uplatu → rezervacija "paid" → Telegram dispečeru → povratak na sajt
async function hmac(secret, msg) { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg)))].map(b => b.toString(16).padStart(2, '0')).join(''); }
async function handle(request, env) {
  const p = Object.fromEntries(request.method === 'POST' ? await request.formData() : new URL(request.url).searchParams);
  const ref = p.order_number, { signature, ...rest } = p;                     // >>> PROVIDER <<<
  const ok = signature && signature === await hmac(env.PAY_SECRET, Object.keys(rest).sort().map(k => k + rest[k]).join(''));
  if (!ref || !ok) return Response.redirect(`${env.SITE_URL}/?ref=${ref || ''}&pay=error#track`, 302);
  await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?ref=eq.${encodeURIComponent(ref)}`, { method: 'PATCH', headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ pay_status: 'paid', paid_at: new Date().toISOString(), pay_txn: p.approval_code || p.transaction_id || null, status: 'confirmed' }) });
  if (env.TG_BOT_TOKEN) await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text: `💳 Plaćeno online: ${ref}` }) });
  return Response.redirect(`${env.SITE_URL}/?ref=${ref}&pay=ok#track`, 302);
}
export const onRequestPost = ({ request, env }) => handle(request, env);
export const onRequestGet = ({ request, env }) => handle(request, env);
