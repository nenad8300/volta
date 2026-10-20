# -*- coding: utf-8 -*-
"""SEO sadržaj: landing stranice ruta (RU/SR/EN) + blog. Cene se uvek čitaju iz js/config.js."""
LANGS = ['ru', 'sr', 'en']
HOME = {'ru': 'index.html', 'sr': 'sr.html', 'en': 'en.html'}
SLUG = {
 'beg': ('transfer-novi-sad-aeroport-belgrad', 'prevoz-novi-sad-aerodrom-beograd', 'transfer-novi-sad-belgrade-airport'),
 'bg': ('transfer-novi-sad-belgrad', 'prevoz-novi-sad-beograd', 'transfer-novi-sad-belgrade'),
 'emb': ('transfer-novi-sad-posolstvo-rossii', 'prevoz-novi-sad-ambasada-rusije', 'transfer-novi-sad-russian-embassy'),
 'ikea': ('poezdka-v-ikea-belgrad-iz-novi-sada', 'prevoz-novi-sad-ikea', 'novi-sad-to-ikea-belgrade'),
 'outlet': ('outlet-indjija-iz-novi-sada', 'prevoz-novi-sad-outlet-indjija', 'novi-sad-to-indjija-outlet'),
 'palic': ('transfer-novi-sad-palic', 'prevoz-novi-sad-palic', 'transfer-novi-sad-palic'),
 'terme': ('transfer-novi-sad-fruske-terme', 'prevoz-novi-sad-fruske-terme', 'transfer-novi-sad-fruske-terme'),
 'petro': ('transfer-novi-sad-petroland', 'prevoz-novi-sad-petroland', 'transfer-novi-sad-petroland'),
 'concert': ('transfer-na-koncert-v-belgrad', 'prevoz-na-koncert-beograd', 'belgrade-concert-transfer'),
 'fruska': ('poezdka-na-frushku-goru', 'izlet-fruska-gora', 'fruska-gora-trip'),
 'sub': ('transfer-novi-sad-subotica', 'prevoz-novi-sad-subotica', 'transfer-novi-sad-subotica'),
 'kik': ('transfer-novi-sad-kikinda', 'prevoz-novi-sad-kikinda', 'transfer-novi-sad-kikinda'),
 'zr': ('transfer-novi-sad-zrenjanin', 'prevoz-novi-sad-zrenjanin', 'transfer-novi-sad-zrenjanin'),
 'vb': ('transfer-novi-sad-vrnjacka-banja', 'prevoz-novi-sad-vrnjacka-banja', 'transfer-novi-sad-vrnjacka-banja'),
 'zl': ('transfer-novi-sad-zlatibor', 'prevoz-novi-sad-zlatibor', 'transfer-novi-sad-zlatibor'),
 'gol': ('poezdka-v-krepost-golubac', 'izlet-tvrdjava-golubac', 'golubac-fortress-trip'),
 'nis': ('transfer-novi-sad-nis', 'prevoz-novi-sad-nis', 'transfer-novi-sad-nis'),
 'ba1': ('vizaran-bosniya-iz-novi-sada', 'vizaran-bosna-novi-sad', 'visa-run-bosnia-from-novi-sad'),
 'ba2': ('vizaran-s-peresecheniem-granicy', 'vizaran-prelazak-granice-bih', 'visa-run-bosnia-border-crossing'),
 'ba3': ('vizaran-bosniya-s-magazinom', 'vizaran-bih-prodavnica', 'visa-run-bosnia-shop-stop'),
 'ba4': ('shoping-tur-bijeljina', 'soping-tura-bijeljina', 'bijeljina-shopping-tour'),
 'ba5': ('poezdka-v-stanisici', 'izlet-stanisici', 'stanisici-village-trip'),
 'me': ('transfer-novi-sad-chernogoriya', 'prevoz-novi-sad-crna-gora', 'transfer-novi-sad-montenegro'),
}
BLURB = {
 'beg': {'ru': ['Самый частый маршрут: Нови-Сад ↔ аэропорт Белграда имени Николы Теслы (BEG). 95 км по автомагистрали A1, около часа в пути. Забираем с вашего адреса в Нови-Саде, Петроварадине, Сремской Каменице или Ветернике и подвозим ко входу терминала.', 'При встрече из аэропорта водитель отслеживает рейс по номеру и ждёт в зале прилёта с табличкой. Задержка рейса не оплачивается. Цена фиксирована 24/7: ночной рейс стоит столько же, сколько дневной.'],
         'sr': ['Najčešća ruta: Novi Sad ↔ Aerodrom Nikola Tesla (BEG). 95 km autoputem A1, oko sat vremena. Dolazimo na adresu u Novom Sadu, Petrovaradinu, Sremskoj Kamenici ili Veterniku i vozimo do ulaza u terminal.', 'Kod dočeka vozač prati let i čeka u dolaznom holu sa tablom. Kašnjenje leta se ne naplaćuje. Cena je fiksna 0–24.'],
         'en': ['Our most booked route: Novi Sad ↔ Belgrade Nikola Tesla Airport (BEG). 95 km on the A1, about an hour, door to terminal.', 'For arrivals the driver tracks your flight and waits in arrivals with a name sign. Delays are never charged. The price is fixed 24/7.']},
 'ikea': {'ru': ['IKEA Белград находится в Бубань Поток — общественным транспортом из Нови-Сада туда долго, а покупки потом некуда положить. Туда-обратно с ожиданием до 2 часов, вместительный багажник Model Y.'], 'sr': ['IKEA Beograd je u Bubanj Potoku — javnim prevozom iz Novog Sada dugo i nepraktično. Povratno sa čekanjem do 2 sata, veliki gepek Model Y.'], 'en': ['IKEA Belgrade is in Bubanj Potok — slow by public transport and nowhere to put your shopping. Return trip with up to 2 hours waiting and a big Model Y trunk.']},
 'ba1': {'ru': ['Визаран для тех, кому нужно выехать из Сербии. Едем до пограничного перехода с Боснией и Герцеговиной и возвращаемся в Нови-Сад. Правила въезда зависят от гражданства — проверьте их на официальных сайтах перед поездкой.'], 'sr': ['Vizaran za strane državljane kojima treba izlazak iz Srbije: do granice sa BiH i nazad u Novi Sad.'], 'en': ['A visa run to the Bosnia & Herzegovina border and back to Novi Sad. Check entry rules for your citizenship before travelling.']},
 'ba4': {'ru': ['Шопинг-тур в Биелину: торговые центры, супермаркет Bingo, кафе и рестораны. Бесплатное ожидание до 3 часов, цена за всю машину.'], 'sr': ['Šoping tura u Bijeljinu: tržni centri, Bingo, kafići i restorani. Čekanje do 3 sata gratis.'], 'en': ['Shopping tour to Bijeljina: malls, Bingo supermarket, cafés. Up to 3 hours free waiting.']},
 'me': {'ru': ['Индивидуальный трансфер из Нови-Сада в Черногорию — Будва, Бар, Херцег-Нови, Котор, Подгорица. Остановки по пути — по желанию. Точную цену назовём в Telegram.'], 'sr': ['Individualni prevoz iz Novog Sada u Crnu Goru — Budva, Bar, Herceg Novi, Kotor, Podgorica. Pauze po želji.'], 'en': ['Private transfer from Novi Sad to Montenegro — Budva, Bar, Herceg Novi, Kotor, Podgorica. Stops wherever you like.']},
}
T = {
 'title': {'ru': 'Трансфер {route} на Tesla — {price} | {brand}', 'sr': 'Prevoz {route} Teslom — {price} | {brand}', 'en': '{route} transfer by Tesla — {price} | {brand}'},
 'desc': {'ru': '{route}: {price} за машину с водителем. Tesla, фиксированная цена 24/7, без доплат за ночь и багаж. Apple Pay, IPS QR или водителю.', 'sr': '{route}: {price} po vozilu sa vozačem. Tesla, fiksna cena 0–24, bez doplate za noć i prtljag. Apple Pay, IPS QR ili vozaču.', 'en': '{route}: {price} per car with driver. Tesla, fixed price 24/7, no night or luggage surcharge.'},
 'generic': {'ru': 'Поездка {route} на Tesla с личным водителем, без попутчиков. {price} — цена за всю машину до 4 пассажиров, она не меняется ночью и в праздники.', 'sr': 'Vožnja {route} Teslom sa ličnim vozačem, bez usputnih putnika. {price} je cena za celo vozilo do 4 putnika, ista noću i praznikom.', 'en': 'A private Tesla ride {route} with your own driver. {price} for the whole car up to 4 passengers, same at night and on holidays.'},
 'ns': {'ru': 'Нови-Сад', 'sr': 'Novi Sad', 'en': 'Novi Sad'}, 'per_car': {'ru': 'за машину с водителем', 'sr': 'po vozilu sa vozačem', 'en': 'per car with driver'},
 'rsd': {'ru': 'дин', 'sr': 'din', 'en': 'RSD'}, 'from': {'ru': 'от', 'sr': 'od', 'en': 'from'}, 'req': {'ru': 'Цена по запросу', 'sr': 'Cena na upit', 'en': 'Price on request'}, 'rt': {'ru': 'туда-обратно', 'sr': 'povratno', 'en': 'return'},
 'book': {'ru': 'Забронировать', 'sr': 'Rezerviši', 'en': 'Book now'}, 'tg': {'ru': 'Написать в Telegram', 'sr': 'Piši na Telegram', 'en': 'Message on Telegram'}, 'home': {'ru': 'Главная', 'sr': 'Početna', 'en': 'Home'},
 'incl_h': {'ru': 'Что входит в цену', 'sr': 'Šta je uključeno', 'en': 'What is included'},
 'incl': {'ru': ['Новая Tesla Model 3 / Model Y', 'Цена за машину, а не за человека', 'Без доплат ночью и за багаж', 'Вода, USB-C, детское кресло по запросу', 'Отслеживание рейса и табличка', 'Бесплатная отмена за 24 часа'], 'sr': ['Nova Tesla Model 3 / Model Y', 'Cena po vozilu, ne po osobi', 'Bez doplate noću i za prtljag', 'Voda, USB-C, dečje sedište na zahtev', 'Praćenje leta i tabla', 'Besplatan otkaz do 24 h'], 'en': ['A new Tesla Model 3 / Model Y', 'Price per car, not per person', 'No night or luggage surcharge', 'Water, USB-C, child seat on request', 'Flight tracking & name sign', 'Free cancellation up to 24 h']},
 'faq_h': {'ru': 'Частые вопросы', 'sr': 'Česta pitanja', 'en': 'FAQ'},
 'faq': {'ru': [('Сколько стоит трансфер {route}?', '{price} за машину с водителем, до 4 пассажиров (5–8 — две машины).'), ('Есть ли доплата ночью?', 'Нет. Цена одинаковая днём, ночью и в праздники.'), ('Как оплатить?', 'Apple Pay, Google Pay, картой, по IPS QR, наличными водителю (дин / €) или по счёту.')],
         'sr': [('Koliko košta prevoz {route}?', '{price} po vozilu sa vozačem, do 4 putnika (5–8 — dva vozila).'), ('Da li postoji noćna tarifa?', 'Ne. Cena je ista danju, noću i praznikom.'), ('Kako se plaća?', 'Apple Pay, Google Pay, kartica, IPS QR, keš vozaču (din / €) ili faktura.')],
         'en': [('How much is the {route} transfer?', '{price} per car with driver, up to 4 passengers (5–8 travel in two cars).'), ('Is there a night surcharge?', 'No. Same price day, night and holidays.'), ('How can I pay?', 'Apple Pay, Google Pay, card, IPS QR, cash to the driver (RSD / €) or invoice.')]},
 'related': {'ru': 'Другие направления', 'sr': 'Druge destinacije', 'en': 'Other destinations'},
 'dist': {'ru': 'Расстояние', 'sr': 'Udaljenost', 'en': 'Distance'}, 'dur': {'ru': 'В пути', 'sr': 'Trajanje', 'en': 'Duration'}, 'price': {'ru': 'Цена', 'sr': 'Cena', 'en': 'Price'},
 'wait': {'ru': 'Ожидание до {h} ч бесплатно', 'sr': 'Čekanje do {h} h gratis', 'en': 'Up to {h} h free waiting'},
}
HOME_META = {
 'ru': ('Трансфер Нови-Сад — аэропорт Белграда на Tesla · 7 500 дин 24/7 | {brand}', 'Трансфер на Tesla из Нови-Сада: аэропорт Белграда 7 500 дин 24/7, Белград, IKEA, визаран в Боснию, Златибор, Черногория. Цена за машину. Apple Pay, IPS QR, наличные.'),
 'sr': ('Prevoz Novi Sad — Aerodrom Beograd Teslom · 7.500 din 0–24 | {brand}', 'Tesla prevoz iz Novog Sada: Aerodrom Nikola Tesla 7.500 din 0–24, Beograd, IKEA, vizaran BiH, Zlatibor, Crna Gora. Cena po vozilu. Apple Pay, IPS QR, keš.'),
 'en': ('Novi Sad to Belgrade Airport Tesla Transfer · 7,500 RSD 24/7 | {brand}', 'Tesla transfers from Novi Sad: Belgrade Airport 7,500 RSD 24/7, Belgrade, IKEA, Bosnia visa runs, Zlatibor, Montenegro. Price per car.'),
}
BLOG_UI = {
 'ru': {'idx': 'blog/index.html', 'blog': 'Блог', 'title': 'Блог VOLTA — поездки, аэропорт и жизнь в Нови-Саде', 'desc': 'Как добраться из аэропорта Белграда в Нови-Сад, визаран, шопинг в Боснии, поездки по Сербии.', 'lead': 'Как добраться, куда поехать и как сэкономить время в Сербии.', 'read': 'Читать →', 'cta': 'Забронировать эту поездку', 'more': 'Ещё статьи', 'min': 'мин чтения'},
 'sr': {'idx': 'blog/sr.html', 'blog': 'Blog', 'title': 'VOLTA blog — prevoz, aerodrom i izleti iz Novog Sada', 'desc': 'Kako stići od aerodroma do Novog Sada, izleti, šoping i putovanja po Srbiji.', 'lead': 'Kako stići, gde otići i kako uštedeti vreme.', 'read': 'Pročitaj →', 'cta': 'Rezerviši ovu vožnju', 'more': 'Još tekstova', 'min': 'min čitanja'},
}
POSTS = [
 ('ru', 'kak-dobratsya-iz-aeroporta-belgrada-v-novi-sad-noch', 'Ночной прилёт в Белград: как добраться до Нови-Сада после полуночи', 'Работает ли транспорт ночью, сколько стоит такси и трансфер из аэропорта Никола Тесла в Нови-Сад и как не переплатить.', 'img/airport-eve.webp', 'beg', [
  ('Почему ночной прилёт — отдельная история', ['Многие рейсы садятся в Белграде после полуночи. Аэропорт работает круглосуточно, но до Нови-Сада почти 95 км, а прямого общественного транспорта нет.', 'Днём можно ехать с пересадками — автобус до Белграда, затем поезд. Ночью цепочка ломается, и несколько часов придётся провести на вокзале с чемоданами.']),
  ('Варианты', ['Такси у терминала работает всегда, но цена до другого города заранее не фиксирована и ночью обычно выше. Если рейс задержится, ждать вас никто не будет.', 'Частный трансфер с фиксированной ценой: водитель знает номер рейса, видит задержку и ждёт в зале прилёта с табличкой.']),
  ('Сколько стоит', ['Трансфер Нови-Сад ↔ аэропорт Белграда у VOLTA стоит {price:beg} за машину на Tesla — одинаково в 14:00 и в 03:00. Цена за автомобиль, а не за человека.']),
  ('Как забронировать', ['Укажите номер рейса при бронировании — водитель сам подстроится под задержку. Подтверждение придёт в Telegram, WhatsApp или на почту.'])]),
 ('ru', 'vizaran-iz-serbii-v-bosniyu', 'Визаран из Нови-Сада в Боснию: как это устроено и сколько стоит', 'Варианты визарана из Нови-Сада на границу с Боснией и Герцеговиной, что взять с собой и сколько стоит трансфер.', 'img/hero2.webp', 'ba1', [
  ('Что такое визаран', ['Визаран — выезд из страны и обратный въезд, чтобы начать новый срок пребывания. Ближайшая граница из Нови-Сада — с Боснией и Герцеговиной.', 'Правила пребывания меняются и зависят от гражданства. Перед поездкой обязательно проверьте актуальные требования на официальных сайтах.']),
  ('Три варианта', ['До границы и обратно — {price:ba1}.', 'С пересечением границы — {price:ba2}.', 'С заездом в магазин с низкими ценами, ожидание до часа — {price:ba3}.']),
  ('Подготовка', ['Возьмите паспорт и документы о пребывании. В выходные очереди на границе дольше. Цена — за всю машину до 4 человек.'])]),
 ('ru', 'shoping-v-bieline', 'Шопинг в Биелине из Нови-Сада: Bingo, торговые центры и что выгодно покупать', 'Поездка за покупками в Биелину: сколько времени закладывать, что посмотреть и как устроен шопинг-тур на Tesla.', 'img/mall.webp', 'ba4', [
  ('Почему Биелина', ['Биелина — крупный торговый город на северо-востоке Боснии, недалеко от сербской границы. Сюда ездят за продуктами, бытовой химией, одеждой и техникой.']),
  ('Как спланировать день', ['Закладывайте целый день: дорога, граница в обе стороны и 2–3 часа на покупки. Лучше ехать утром в будний день.', 'Перед поездкой проверьте таможенные лимиты на ввоз товаров в Сербию.']),
  ('Шопинг-тур VOLTA', ['Туда-обратно — {price:ba4} за машину, водитель ждёт до 3 часов бесплатно, багажник Model Y вмещает крупные покупки.'])]),
 ('ru', 'ikea-belgrad-iz-novi-sada', 'IKEA Белград из Нови-Сада: как добраться и привезти покупки', 'Как доехать до IKEA в Белграде из Нови-Сада без машины и вернуться с мебелью и пакетами.', 'img/mall.webp', 'ikea', [
  ('Где IKEA', ['Единственная IKEA в Сербии — в Белграде, в районе Бубань Поток у кольцевой дороги, около 85 км от Нови-Сада.']),
  ('Проблема — вернуться', ['Доехать общественным транспортом можно, но с пересадками. Обратно с коробками в автобус и поезд не сядешь.']),
  ('Поездка с ожиданием', ['VOLTA везёт вас в IKEA и обратно за {price:ikea}, ожидание до 2 часов включено. Совет: проверьте наличие товаров на сайте IKEA заранее.'])]),
 ('ru', 'posolstvo-rossii-v-belgrade-iz-novi-sada', 'Посольство России в Белграде: как добраться из Нови-Сада вовремя', 'Время в пути, когда выезжать и как вернуться после приёма в посольстве РФ.', 'img/night.webp', 'emb', [
  ('Главное — не опоздать', ['Запись на консульские услуги привязана ко времени. Из Нови-Сада до центра Белграда около полутора часов, утром на въезде бывают пробки. Адрес и порядок приёма уточните на официальном сайте посольства.']),
  ('Цена', ['Трансфер Нови-Сад — посольство: {price:emb} за машину. Нужна поездка туда-обратно с ожиданием — напишите в Telegram.'])]),
 ('ru', 'kuda-poehat-iz-novi-sada-na-den', 'Куда поехать из Нови-Сада на один день: 6 мест рядом', 'Фрушка гора, термы, Палич, Суботица, Голубац — идеи для поездки на день с ценой трансфера.', 'img/fruska.webp', 'fruska', [
  ('Фрушка гора', ['Национальный парк в 20–30 минутах от города: монастыри, виноградники, смотровые площадки. Поездка — {price:fruska}.']),
  ('Термы и аквапарк', ['Mövenpick Fruške Terme в Врднике — {price:terme}. Аквапарк Petroland — {price:petro}.']),
  ('Палич и Суботица', ['Озеро, зоопарк и аквапарк у Суботицы — {price:palic}.']),
  ('Голубац', ['Средневековая крепость на Дунае у ущелья Джердап — {price:gol}.'])]),
 ('ru', 'koncert-v-belgrade-kak-vernutsya', 'Концерт в Белграде: как вернуться в Нови-Сад после полуночи', 'Štark Arena, Ташмайдан, Ušće — как вернуться домой, когда последний поезд уже ушёл.', 'img/night.webp', 'concert', [
  ('Проблема последнего поезда', ['Большие концерты заканчиваются ближе к полуночи. Поезда и автобусы в Нови-Сад к этому времени уже ушли, а такси у арены — очередь и непредсказуемая цена.']),
  ('Варианты', ['Только обратно — {price:concert}. Туда и обратно — 12 000 дин за машину: на компанию из четырёх это выгодно.'])]),
 ('ru', 'transfer-iz-novi-sada-v-chernogoriyu', 'Из Нови-Сада в Черногорию с водителем: маршрут и цена', 'Как доехать до Будвы, Бара, Котора или Подгорицы на частном трансфере.', 'img/montenegro.webp', 'me', [
  ('Почему на машине', ['Удобных прямых рейсов немного, поезд идёт долго. Трансфер забирает из дома и привозит к отелю, без ограничений по багажу.']),
  ('Маршрут и цена', ['Дорога идёт через Белград и Златибор к побережью — по пути можно остановиться. Трансфер в Черногорию — от 400 € в одну сторону за машину.'])]),
 ('ru', 'tesla-ili-taksi-v-aeroport', 'Tesla-трансфер или такси до аэропорта Белграда: что выгоднее', 'Сравнение такси, автобуса и трансфера из Нови-Сада в аэропорт: цена, надёжность, комфорт.', 'img/cabin.webp', 'beg', [
  ('Что важно', ['Главный риск — не успеть на рейс. Важно, чтобы машина приехала вовремя, цена была известна заранее и багаж поместился.']),
  ('Сравнение', ['Такси — цена до другого города не фиксирована. Автобус + поезд — дёшево, но 2–3 часа с пересадками. Трансфер VOLTA — {price:beg} за машину, фиксировано 24/7.'])]),
 ('ru', 'pereezd-v-novi-sad-pervye-dni', 'Переезд в Нови-Сад: первые дни — от аэропорта до IKEA', 'Чек-лист первых дней после переезда: дорога из аэропорта, покупки для квартиры, поездки без машины.', 'img/arrivals.webp', 'beg', [
  ('День 1: прилёт', ['Закажите трансфер заранее и укажите номер рейса: водитель встретит с табличкой и отвезёт прямо к квартире. Нови-Сад — аэропорт: {price:beg}.']),
  ('Обустройство', ['IKEA — {price:ikea} туда-обратно с ожиданием, Outlet Inđija — {price:outlet}.']),
  ('Первые месяцы', ['Визаран к боснийской границе — {price:ba1}. Правила пребывания проверяйте на официальных ресурсах.'])]),
 ('sr', 'nocni-let-beograd-novi-sad', 'Noćni let za Beograd: kako stići do Novog Sada posle ponoći', 'Avion sleće u 2 ujutru — prevoz od Aerodroma Nikola Tesla do Novog Sada noću.', 'img/airport-eve.webp', 'beg', [
  ('Problem noćnog dolaska', ['Direktnog javnog prevoza do Novog Sada nema, a noću ne rade ni vozovi ni većina autobusa.']),
  ('Opcije', ['Taksi — cena do drugog grada nije unapred fiksna. Transfer — vozač prati let i čeka sa tablom. Kod VOLTA: {price:beg} po vozilu, isto danju i noću.'])]),
 ('sr', 'izlet-iz-novog-sada', 'Izlet iz Novog Sada za jedan dan: 6 mesta u blizini', 'Fruška gora, Fruške Terme, Palić, Golubac — ideje za jednodnevni izlet sa cenom prevoza.', 'img/fruska.webp', 'fruska', [
  ('Fruška gora i Terme', ['Manastiri i vidikovci ({price:fruska}). Mövenpick Fruške Terme — {price:terme}.']),
  ('Palić i Golubac', ['Palić — {price:palic}. Tvrđava Golubac — {price:gol}.'])]),
 ('sr', 'ikea-beograd-iz-novog-sada', 'IKEA Beograd iz Novog Sada bez automobila', 'Kako do IKEA u Beogradu i nazad sa kupovinom — povratna vožnja sa čekanjem.', 'img/mall.webp', 'ikea', [
  ('Povratak je problem', ['Javnim prevozom se može stići, ali sa kutijama nazad je nepraktično.']),
  ('Rešenje', ['Povratna vožnja {price:ikea}, čekanje do 2 sata, veliki gepek Model Y.'])]),
 ('sr', 'koncert-beograd-povratak', 'Koncert u Beogradu: povratak u Novi Sad posle ponoći', 'Kako se vratiti u Novi Sad posle koncerta kad poslednji voz već ode.', 'img/night.webp', 'concert', [
  ('Opcije', ['Samo povratak — {price:concert}. Tamo i nazad — 12.000 din po vozilu.'])]),
]
