// POST /api/notify — obaveštenje dispečeru u Telegram grupu. Env: TG_BOT_TOKEN, TG_CHAT_ID
export async function onRequestPost({ request, env }) {
  if (!env.TG_BOT_TOKEN || !env.TG_CHAT_ID) return new Response('not configured', { status: 204 });
  let text = ''; try { ({ text } = await request.json()); } catch (e) { return new Response('bad', { status: 400 }); }
  text = String(text || '').slice(0, 1500); if (!text) return new Response('empty', { status: 400 });
  const r = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text, disable_web_page_preview: true }) });
  return new Response(r.ok ? 'ok' : 'tg error', { status: r.ok ? 200 : 502 });
}
