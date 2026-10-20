// /api/pay — preusmerenje na bankarski gateway (Apple Pay / Google Pay / kartice su na njegovoj formi).
// Stripe ne prima srpske firme → CorvusPay / Monri / AllSecure. Polja i potpis uskladiti sa dokumentacijom (>>> PROVIDER <<<).
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, PAY_STORE_ID, PAY_SECRET, PAY_CHECKOUT_URL, SITE_URL
async function hmac(secret, msg) { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg)))].map(b => b.toString(16).padStart(2, '0')).join(''); }
export async function onRequestPost({ request }) {
  const { ref } = await request.json().catch(() => ({}));
  if (!/^VT-[A-Z0-9]{5}$/.test(ref || '')) return Response.json({ error: 'bad ref' }, { status: 400 });
  return Response.json({ url: `/api/pay?ref=${ref}` });
}
export async function onRequestGet({ request, env }) {
  const ref = new URL(request.url).searchParams.get('ref');
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?ref=eq.${encodeURIComponent(ref)}&select=*`, { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } });
  const b = (await r.json())[0];
  if (!b || b.pay_status === 'paid' || b.status === 'cancelled' || !b.price) return Response.redirect(`${env.SITE_URL}/?ref=${ref}#track`, 302);
  const params = { version: '1.4', store_id: env.PAY_STORE_ID, order_number: b.ref, language: b.lang === 'en' ? 'en' : 'sr', currency: 'RSD', amount: Number(b.price).toFixed(2),   // >>> PROVIDER <<<
    cart: `Tesla transfer ${b.ref}`, require_complete: 'false', cardholder_name: (b.name || '').split(' ')[0], cardholder_surname: (b.name || '').split(' ').slice(1).join(' '),
    cardholder_email: b.email || '', cardholder_phone: b.phone || '', success_url: `${env.SITE_URL}/api/pay-callback`, cancel_url: `${env.SITE_URL}/?ref=${b.ref}&pay=cancel#track` };
  params.signature = await hmac(env.PAY_SECRET, Object.keys(params).sort().map(k => k + params[k]).join(''));   // >>> PROVIDER <<<
  const inputs = Object.entries(params).map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, '&quot;')}">`).join('');
  return new Response(`<!doctype html><meta charset="utf-8"><title>Plaćanje…</title><body style="background:#07080a;color:#fff;font-family:system-ui;display:grid;place-items:center;height:100vh"><form id="f" method="POST" action="${env.PAY_CHECKOUT_URL}">${inputs}<noscript><button>Nastavi</button></noscript></form><p>Preusmeravanje na sigurnu stranu za plaćanje…</p><script>document.getElementById('f').submit()</script>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
