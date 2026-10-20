/* =====================================================================
   VOLTA — CENTRALNA KONFIGURACIJA
   Sve što se menja za klijenta menja se SAMO ovde.
   Cene = cenovnik klijenta (transfer_tesla), po vozilu sa vozačem, u RSD.
   ===================================================================== */
(function () {
  const C = {
    brand: 'VOLTA',
    siteUrl: '',                  // npr. 'https://volta-transfer.rs' (linkovi u porukama putniku)

    /* ---------- BACKEND (prazno = DEMO, sve se čuva u pregledaču) ---------- */
    supabaseUrl: '',
    supabaseAnonKey: '',

    /* ---------- KANALI ---------- */
    phone: '+381600000000',
    whatsapp: '381600000000',     // bez + i razmaka
    viber: '381600000000',
    telegram: 'transfer_tesla',   // t.me/<ovo>
    telegramBot: '',              // korisničko ime bota bez @ (automatske poruke putniku)
    instagram: 'transfer_tesla',
    email: 'booking@volta.rs',

    /* ---------- GOOGLE ---------- */
    googlePlaceQuery: 'Novi Sad',
    googleReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Novi+Sad',   // zameniti linkom iz Google profila (Zatraži recenzije)
    googleRating: null,           // { avg: 4.9, count: 41 } — SAMO pravi podaci

    /* ---------- PLAĆANJE ---------- provider: demo | corvuspay | monri | allsecure */
    payments: {
      provider: 'demo', online: true, ips: true, cash: true, invoice: true,
      onlineDiscount: 0,
      ipsAccount: '160000000000000000', ipsName: 'VOLTA DOO Novi Sad'
    },

    currency: 'RSD', eurRsd: 117.2, commissionDefault: 0.25,

    /* vozila: mult = koliko vozila se naplaćuje */
    classes: [
      { id: 'm3', name: 'Tesla Model 3', tag: 'Sedan', pax: 3, bag: 2, mult: 1, img: 'img/m3-front.webp' },
      { id: 'my', name: 'Tesla Model Y', tag: 'Comfort', pax: 4, bag: 4, mult: 1, img: 'img/my-front.webp' },
      { id: '2c', name: '2 × Tesla', tag: 'Group', pax: 8, bag: 8, mult: 2, img: 'img/my-front.webp' }
    ],

    /* ---------- CENOVNIK ----------
       cat: ns (Novi Sad i okolina) · rs (Srbija) · ba (BiH) · me (Crna Gora / EU)
       ow = jedan smer · rt = tamo-nazad · wait = besplatno čekanje (h) · eur = cena u € iz cenovnika */
    catalog: [
      { id: 'beg', cat: 'ns', ow: 7500, eur: 65, img: 'img/arrivals.webp', km: 95, min: 65, n: { ru: 'Аэропорт Никола Тесла', sr: 'Aerodrom Nikola Tesla', en: 'Belgrade Airport (BEG)' }, d: { ru: 'Фиксированная цена 24/7', sr: 'Fiksna cena 0–24', en: 'Fixed price 24/7' } },
      { id: 'bg', cat: 'ns', ow: 9000, rt: 12000, wait: 2, img: 'img/night.webp', km: 90, min: 70, n: { ru: 'Белград', sr: 'Beograd', en: 'Belgrade' } },
      { id: 'emb', cat: 'ns', ow: 9000, km: 92, min: 75, n: { ru: 'Посольство РФ, Белград', sr: 'Ambasada RF, Beograd', en: 'Russian Embassy, Belgrade' } },
      { id: 'ikea', cat: 'ns', rt: 12000, wait: 2, img: 'img/mall.webp', km: 85, min: 60, n: { ru: 'IKEA (туда-обратно)', sr: 'IKEA (povratno)', en: 'IKEA (return)' } },
      { id: 'outlet', cat: 'ns', rt: 8000, wait: 2, km: 45, min: 35, n: { ru: 'Outlet Inđija (туда-обратно)', sr: 'Outlet Inđija (povratno)', en: 'Outlet Inđija (return)' } },
      { id: 'palic', cat: 'ns', ow: 9000, km: 110, min: 80, n: { ru: 'Зоопарк / Аквапарк Палич', sr: 'Zoo / Akvapark Palić', en: 'Palić Zoo / Aquapark' } },
      { id: 'terme', cat: 'ns', ow: 3000, km: 25, min: 25, n: { ru: 'Mövenpick Фрушке Терме', sr: 'Mövenpick Fruške Terme', en: 'Mövenpick Fruške Terme' } },
      { id: 'petro', cat: 'ns', ow: 3000, km: 30, min: 30, n: { ru: 'Аквапарк Petroland', sr: 'Akvapark Petroland', en: 'Petroland Aquapark' } },
      { id: 'concert', cat: 'ns', ow: 9000, rt: 12000, img: 'img/night.webp', km: 90, min: 70, n: { ru: 'Концерт в Белграде', sr: 'Koncert u Beogradu', en: 'Concert in Belgrade' }, d: { ru: 'Белград → Нови Сад 9000 · туда-обратно 12000', sr: 'Beograd → Novi Sad 9000 · povratno 12000', en: 'Belgrade → Novi Sad 9000 · return 12000' } },
      { id: 'fruska', cat: 'ns', ow: 3000, img: 'img/fruska.webp', km: 20, min: 25, n: { ru: 'Прогулка на Фрушку гору', sr: 'Izlet na Frušku goru', en: 'Fruška Gora trip' } },
      { id: 'sub', cat: 'rs', ow: 9000, km: 105, min: 75, n: { ru: 'Суботица', sr: 'Subotica', en: 'Subotica' } },
      { id: 'kik', cat: 'rs', ow: 9000, km: 115, min: 90, n: { ru: 'Кикинда', sr: 'Kikinda', en: 'Kikinda' } },
      { id: 'zr', cat: 'rs', ow: 6000, km: 50, min: 45, n: { ru: 'Зренянин', sr: 'Zrenjanin', en: 'Zrenjanin' } },
      { id: 'vb', cat: 'rs', ow: 18000, km: 260, min: 200, n: { ru: 'Врнячка-Баня', sr: 'Vrnjačka Banja', en: 'Vrnjačka Banja' } },
      { id: 'zl', cat: 'rs', ow: 20000, img: 'img/fruska.webp', km: 270, min: 220, n: { ru: 'Златибор', sr: 'Zlatibor', en: 'Zlatibor' } },
      { id: 'gol', cat: 'rs', ow: 16000, km: 200, min: 170, n: { ru: 'Крепость Голубац', sr: 'Tvrđava Golubac', en: 'Golubac Fortress' } },
      { id: 'nis', cat: 'rs', ow: 23000, km: 330, min: 210, n: { ru: 'Ниш', sr: 'Niš', en: 'Niš' } },
      { id: 'ba1', cat: 'ba', rt: 10000, eur: 85, n: { ru: 'Визаран до границы с Боснией', sr: 'Vizaran do granice sa BiH', en: 'Visa run to the BiH border' } },
      { id: 'ba2', cat: 'ba', rt: 12000, eur: 100, n: { ru: 'Визаран с пересечением границы', sr: 'Vizaran sa prelaskom granice', en: 'Visa run with border crossing' } },
      { id: 'ba3', cat: 'ba', rt: 11000, eur: 95, wait: 1, n: { ru: 'Визаран + магазин с низкими ценами', sr: 'Vizaran + jeftina prodavnica', en: 'Visa run + discount store' } },
      { id: 'ba4', cat: 'ba', rt: 17000, eur: 145, wait: 3, img: 'img/mall.webp', n: { ru: 'Шопинг-тур, Биелина', sr: 'Šoping tura, Bijeljina', en: 'Shopping tour, Bijeljina' }, d: { ru: 'ТЦ, Bingo, кафе и рестораны', sr: 'TC, Bingo, kafići i restorani', en: 'Mall, Bingo, cafés & restaurants' } },
      { id: 'ba5', cat: 'ba', rt: 16500, eur: 140, wait: 3, n: { ru: 'Прогулка и рестораны, Станишичи', sr: 'Etno selo Stanišići', en: 'Stanišići village' } },
      { id: 'me', cat: 'me', from: true, oweur: 400, img: 'img/montenegro.webp', n: { ru: 'Черногория', sr: 'Crna Gora', en: 'Montenegro' }, d: { ru: 'от 400 € в одну сторону', sr: 'od 400 € u jednom smeru', en: 'from €400 one way' } },
      { id: 'eu', cat: 'me', req: true, n: { ru: 'Страны ЕС', sr: 'Zemlje EU', en: 'EU countries' }, d: { ru: 'Цена по запросу', sr: 'Cena na upit', en: 'Price on request' } },
      { id: 'other', cat: 'rs', req: true, n: { ru: 'Другой город', sr: 'Drugi grad', en: 'Other city' }, d: { ru: 'Уточним цену в сообщении', sr: 'Cenu javljamo porukom', en: 'We quote by message' } }
    ],

    /* dodaci (RSD) — POTVRDITI sa klijentom */
    extras: [['sign', 0], ['child', 0], ['quiet', 0], ['pet', 0], ['stop', 1000], ['wait', 1500]],

    demoAdminPin: '0000'
  };
  /* izvedeno — ne menjati */
  C.places = [['ns', 'Novi Sad']].concat(C.catalog.map(r => [r.id, r.n.sr]));
  C.prices = {}; C.catalog.forEach(r => { const b = r.ow ?? r.rt ?? (r.oweur ? Math.round(r.oweur * C.eurRsd) : null); if (b != null) C.prices['ns-' + r.id] = b; });
  (typeof window !== 'undefined' ? window : globalThis).VOLTA_CONFIG = C;
})();
