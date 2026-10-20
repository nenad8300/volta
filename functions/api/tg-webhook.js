// /api/tg-webhook — putnik klikne "Obaveštenja na Telegram" (t.me/<bot>?start=VT-XXXXX) → chat se vezuje za rezervaciju.
// Registracija (jednom): https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<domen>/api/tg-webhook&secret_token=<TG_WEBHOOK_SECRET>
// Env: TG_BOT_TOKEN, TG_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY, TG_CHAT_ID
export async function onRequestPost({ request, env }) {
  if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.TG_WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
  const u = await request.json().catch(() => ({})), m = u.message; if (!m || !m.text) return new Response('ok');
  const say = text => fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: m.chat.id, text }) });
  const ref = (m.text.match(/VT-[A-Z0-9]{5}/i) || [])[0];
  if (ref) {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?ref=eq.${ref.toUpperCase()}`, { method: 'PATCH', headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ tg_chat_id: m.chat.id }) });
    const rows = r.ok ? await r.json() : [];
    if (rows.length) { const L = rows[0].lang || 'ru'; await say({ ru: `✅ Готово! Уведомления по брони ${ref.toUpperCase()} будут приходить сюда: водитель, номер машины, «водитель выехал» и «на месте».`, sr: `✅ Gotovo! Obaveštenja za rezervaciju ${ref.toUpperCase()} stižu ovde.`, en: `✅ Done! Updates for booking ${ref.toUpperCase()} will arrive here.` }[L] || '✅'); }
    else await say('Бронь не найдена / Rezervacija nije pronađena.');
  } else {
    await say('Здравствуйте! Напишите маршрут, дату и время — диспетчер ответит через несколько минут.\nZdravo! Napišite rutu, datum i vreme — dispečer odgovara za par minuta.');
    if (env.TG_CHAT_ID) await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/forwardMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: env.TG_CHAT_ID, from_chat_id: m.chat.id, message_id: m.message_id }) });
  }
  return new Response('ok');
}
