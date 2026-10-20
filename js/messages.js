/* VOLTA — automatske poruke putniku (RU / SR / EN). Koriste ih portal (slanje jednim klikom) i workers/notifier.js (automatski). */
(function (G) {
  const RULES = [
    { id: 'confirm', when: 'created', label: 'Potvrda rezervacije' },
    { id: 'driver', when: -18 * 60, label: 'Vozač, auto, tablice (dan ranije)', needs: 'driver' },
    { id: 'remind', when: -120, label: 'Podsetnik 2 h pre' },
    { id: 'enroute', when: 'enroute', label: 'Vozač je krenuo' },
    { id: 'arrived', when: 'arrived', label: 'Vozač je stigao' },
    { id: 'review', when: 'done+90', label: 'Hvala + Google recenzija' }
  ];
  const T = {
    confirm: {
      ru: (b, c) => `Здравствуйте, ${b.first}! ✅ Бронь ${b.ref} подтверждена.\n\n🚘 ${b.route}\n📅 ${b.date} в ${b.time}\n📍 ${b.addr}${b.flight ? `\n✈ Рейс ${b.flight} — отслеживаем` : ''}\n💳 ${b.price} · ${b.pay}\n\nДанные водителя пришлём накануне. Статус: ${c.track}\nБесплатная отмена — за 24 часа. ${c.brand}`,
      sr: (b, c) => `Poštovani ${b.first}, ✅ rezervacija ${b.ref} je potvrđena.\n\n🚘 ${b.route}\n📅 ${b.date} u ${b.time}\n📍 ${b.addr}${b.flight ? `\n✈ Let ${b.flight} — pratimo ga` : ''}\n💳 ${b.price} · ${b.pay}\n\nPodatke o vozaču šaljemo dan ranije. Status: ${c.track}\nBesplatan otkaz do 24 h. ${c.brand}`,
      en: (b, c) => `Hi ${b.first}! ✅ Booking ${b.ref} is confirmed.\n\n🚘 ${b.route}\n📅 ${b.date} at ${b.time}\n📍 ${b.addr}${b.flight ? `\n✈ Flight ${b.flight} — we track it` : ''}\n💳 ${b.price} · ${b.pay}\n\nDriver details come the day before. Status: ${c.track}\nFree cancellation up to 24 h. ${c.brand}` },
    driver: {
      ru: (b, c) => `${b.first}, завтра в ${b.time} за вами приедет:\n\n👤 ${b.dName}\n🚗 ${b.car} · ${b.plate}\n📞 ${b.dPhone}\n\n${b.fromAirport ? 'Водитель встретит вас в зале прилёта с табличкой. Задержку рейса отслеживаем.' : 'Водитель будет на месте за 10 минут.'}\nБронь ${b.ref}. ${c.brand}`,
      sr: (b, c) => `${b.first}, sutra u ${b.time} dolazi po vas:\n\n👤 ${b.dName}\n🚗 ${b.car} · ${b.plate}\n📞 ${b.dPhone}\n\n${b.fromAirport ? 'Vozač vas čeka u dolaznom holu sa tablom. Pratimo let.' : 'Vozač je na adresi 10 minuta ranije.'}\nRezervacija ${b.ref}. ${c.brand}`,
      en: (b, c) => `${b.first}, tomorrow at ${b.time} you'll be picked up by:\n\n👤 ${b.dName}\n🚗 ${b.car} · ${b.plate}\n📞 ${b.dPhone}\n\n${b.fromAirport ? 'Your driver waits in arrivals with a name sign. We track your flight.' : 'Your driver arrives 10 minutes early.'}\nBooking ${b.ref}. ${c.brand}` },
    remind: {
      ru: (b, c) => `⏰ Напоминание: ${b.route} сегодня в ${b.time}.${b.dName ? ` Водитель ${b.dName}, ${b.dPhone}.` : ''} ${c.brand}`,
      sr: (b, c) => `⏰ Podsetnik: ${b.route} danas u ${b.time}.${b.dName ? ` Vozač ${b.dName}, ${b.dPhone}.` : ''} ${c.brand}`,
      en: (b, c) => `⏰ Reminder: ${b.route} today at ${b.time}.${b.dName ? ` Driver ${b.dName}, ${b.dPhone}.` : ''} ${c.brand}` },
    enroute: {
      ru: (b, c) => `🚗 ${b.dName || 'Водитель'} выехал к вам. ${b.car ? b.car + ' · ' + b.plate + '. ' : ''}Следить: ${c.track}`,
      sr: (b, c) => `🚗 ${b.dName || 'Vozač'} je krenuo ka vama. ${b.car ? b.car + ' · ' + b.plate + '. ' : ''}Prati: ${c.track}`,
      en: (b, c) => `🚗 ${b.dName || 'Your driver'} is on the way. ${b.car ? b.car + ' · ' + b.plate + '. ' : ''}Track: ${c.track}` },
    arrived: {
      ru: b => `📍 ${b.dName || 'Водитель'} на месте${b.fromAirport ? ' — в зале прилёта с табличкой' : ''}. ${b.car ? b.car + ', ' + b.plate + '. ' : ''}Ждём вас!`,
      sr: b => `📍 ${b.dName || 'Vozač'} je stigao${b.fromAirport ? ' — u dolaznom holu sa tablom' : ''}. ${b.car ? b.car + ', ' + b.plate + '. ' : ''}Čekamo vas!`,
      en: b => `📍 ${b.dName || 'Your driver'} has arrived${b.fromAirport ? ' — in arrivals with a name sign' : ''}. ${b.car ? b.car + ', ' + b.plate + '. ' : ''}See you!` },
    review: {
      ru: (b, c) => `Спасибо, что выбрали ${c.brand}! 🙏\nЕсли поездка понравилась, оставьте, пожалуйста, отзыв в Google — 20 секунд, и это очень нам помогает:\n${c.review}\n\nСледующая поездка — в Telegram @${c.telegram}`,
      sr: (b, c) => `Hvala što ste izabrali ${c.brand}! 🙏\nAko ste zadovoljni, ostavite nam ocenu na Google-u — 20 sekundi, a mnogo nam znači:\n${c.review}`,
      en: (b, c) => `Thank you for riding with ${c.brand}! 🙏\nIf you enjoyed it, a quick Google review helps us a lot (20 seconds):\n${c.review}` }
  };
  const PAY = { cash: { ru: 'водителю', sr: 'vozaču', en: 'to driver' }, online: { ru: 'онлайн', sr: 'online', en: 'online' }, ips: { ru: 'IPS QR', sr: 'IPS QR', en: 'IPS QR' }, invoice: { ru: 'по счёту', sr: 'faktura', en: 'invoice' } };
  function build(id, b, d, cfg, opt = {}) {
    const lang = ['ru', 'sr', 'en'].includes(b.lang) ? b.lang : 'ru';
    const fmt = v => v == null ? '—' : Math.round(v).toLocaleString('de-DE').replace(/\./g, ' ') + (lang === 'ru' ? ' дин' : lang === 'sr' ? ' din' : ' RSD');
    const site = (opt.site || cfg.siteUrl || '').replace(/\/$/, '');
    const x = { ref: b.ref, first: (b.name || '').split(' ')[0], date: b.date, time: b.time, addr: b.addr || '', flight: b.flight || '', route: opt.routeName || `${b.from} → ${b.to}`,
      price: fmt(b.price), pay: (PAY[b.pay_method] || PAY.cash)[lang] + (b.pay_status === 'paid' ? ' ✓' : ''), dName: d ? d.name.split(' ')[0] : '', dPhone: d ? d.phone : '', car: d ? d.car : '', plate: d ? d.plate : '', fromAirport: b.from === 'beg' };
    return T[id][lang](x, { brand: cfg.brand, telegram: cfg.telegram, review: cfg.googleReviewUrl, track: `${site}/?ref=${b.ref}#track` });
  }
  function due(b, now = Date.now()) {
    const log = b.msg_log || {}, at = new Date(`${b.date}T${b.time}:00`).getTime(), out = [];
    if (b.status === 'cancelled') return out;
    const hist = s => (b.history || []).find(h => h.s === s);
    for (const r of RULES) {
      if (log[r.id] || (r.needs === 'driver' && !b.driver_id)) continue;
      let ok = false;
      if (r.when === 'created') ok = true;
      else if (typeof r.when === 'number') ok = now >= at + r.when * 60000 && now < at;
      else if (r.when === 'done+90') { const h = hist('done'); ok = !!h && now >= new Date(h.t).getTime() + 90 * 60000; }
      else ok = b.status === r.when;
      if (ok) out.push(r.id);
    }
    return out;
  }
  G.VOLTA_MSG = { RULES, build, due };
})(typeof window !== 'undefined' ? window : globalThis);
