# VOLTA — Tesla transfer platforma (kompletan paket)

U ovom folderu je sve: javni sajt, scena gde se vozilo doveze i odveze, portal za dispečera i vozače, baza, plaćanje, automatske poruke putniku, SEO stranice i blog.

```
dist/                 ← GOTOV SAJT ZA OBJAVU (ovo ide na internet)
functions/api/        ← Cloudflare funkcije: plaćanje, Telegram obaveštenja, Telegram bot
index.html, portal.html, js/, css/, img/   ← izvorni fajlovi (ovde se menja)
js/config.js          ← ⚙ SVE ŠTO SE MENJA: telefoni, Telegram, cene, Supabase, plaćanje
supabase/schema.sql   ← baza (pokreće se jednom)
workers/              ← automatske poruke putniku (cron svakog minuta)
build/                ← pravi dist/ (SEO stranice, blog, sitemap)
```

## 1. Probaj odmah (bez ikakvog podešavanja)
Otvori `dist/sr.html` (srpski) ili `dist/index.html` (ruski) u pregledaču. U drugom tabu otvori `dist/portal.html`.

| Uloga | PIN |
|---|---|
| Dispečer / Admin | `0000` |
| Vozač Marko / Nikola / Stefan | `1111` / `2222` / `3333` |

Napravi rezervaciju na sajtu i ona se odmah pojavi u portalu. Podaci se u ovom režimu čuvaju samo u tom pregledaču (DEMO).

## 2. Objava — Cloudflare Pages preko GitHub-a (preporuka)
1. Napravi novi GitHub repozitorijum i ubaci u njega **ceo sadržaj ovog foldera**.
2. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → izaberi repo.
3. Podešavanja builda:
   - Framework preset: **None**
   - Build command: **prazno**
   - Build output directory: **`dist`**
4. Deploy. Sajt je živ na `*.pages.dev`. Folder `functions/` Cloudflare sam prepoznaje.
5. Custom domains → dodaj domen klijenta.

Brza alternativa za probu: Cloudflare → Pages → **Upload assets** → prevuci folder `dist`. Sajt radi, ali bez plaćanja i Telegram obaveštenja, jer `functions/` radi samo preko GitHub/Wrangler objave.

## 3. Podaci klijenta → `js/config.js`
Telefon, WhatsApp, Viber, Telegram, Instagram, email, `siteUrl` (domen), `googleReviewUrl` (link iz Google profila: Zatraži recenzije), IPS račun, cene (`catalog`).
Posle izmena pokreni build (tačka 7), da se i SEO stranice osveže.

## 4. Prava baza (Supabase, besplatan plan je dovoljan)
1. supabase.com → New project.
2. SQL Editor → nalepi `supabase/schema.sql` → Run.
3. Project Settings → API → kopiraj **Project URL** i **anon public** u `js/config.js` (`supabaseUrl`, `supabaseAnonKey`).
4. Authentication → Users → Add user (vlasnik). Pokreni red za ADMIN sa dna `schema.sql` (zameni email).
5. Vozače dodaj u portalu (Vozači), svakom napravi nalog i poveži ga redom za VOZAČA sa dna `schema.sql`.
6. Kad su URL i ključ upisani, sajt i portal sami prelaze iz DEMO u LIVE režim.

## 5. Telegram (besplatno)
**Obaveštenja dispečeru:** @BotFather → `/newbot` → dobiješ token. Napravi grupu „VOLTA dispečer“ i dodaj bota u nju. Otvori `https://api.telegram.org/bot<TOKEN>/getUpdates` i prepiši `chat.id`.
U Cloudflare → Settings → Variables dodaj: `TG_BOT_TOKEN`, `TG_CHAT_ID`.

**Automatske poruke putniku:**
1. Korisničko ime bota upiši u `config.js` → `telegramBot`.
2. Dodaj Cloudflare promenljive `TG_WEBHOOK_SECRET` (bilo koja tajna reč), `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (Supabase → API → service_role).
3. Jednom otvori `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<domen>/api/tg-webhook&secret_token=<TG_WEBHOOK_SECRET>`.
4. `cd workers` → upiši SUPABASE_URL i domen u `wrangler.toml` → `npx wrangler deploy` → `npx wrangler secret put SUPABASE_SERVICE_KEY` i `npx wrangler secret put TG_BOT_TOKEN`.

Putnik posle rezervacije klikne „🔔 Obaveštenja na Telegram“ i od tada sve poruke dobija automatski: potvrdu, podatke o vozaču, podsetnik, „vozač je krenuo/stigao“ i zahvalnicu sa linkom za Google recenziju. WhatsApp/Viber poruke dispečer šalje jednim klikom iz portala (✉ Poruke).

## 6. Online plaćanje (Apple Pay / Google Pay / kartice / IPS)
Stripe ne prima firme iz Srbije, pa ide domaći gateway: **CorvusPay**, **Monri** ili **AllSecure**.
1. Klijent potpiše ugovor i dobije Store ID i tajni ključ, i zatraži uključivanje Apple Pay i Google Pay.
2. Cloudflare promenljive: `PAY_STORE_ID`, `PAY_SECRET`, `PAY_CHECKOUT_URL`, `SITE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.
3. U `functions/api/pay.js` i `pay-callback.js` uskladi nazive polja sa dokumentacijom gateway-a (označeno sa `>>> PROVIDER <<<`).
4. U `config.js`: `payments.provider: 'corvuspay'` (ili drugi).

**IPS QR radi odmah**: upiši 18-cifreni račun firme u `payments.ipsAccount`. Uplatu dispečer potvrdi dugmetom „Plaćeno“.

## 7. SEO build (posle svake izmene cena ili teksta)
```
pip install playwright && playwright install chromium
python build/build.py https://domen-klijenta.rs
```
Dobija se novi `dist/`: 3 početne stranice (RU/SR/EN), stranica za svaku rutu na 3 jezika, blog (10 RU + 4 SR), sitemap.xml, robots.txt.
Posle objave: Google Search Console i Yandex Webmaster → dodaj domen → prijavi `sitemap.xml`. Napravi Google Business Profile za Novi Sad.

## 8. Scena „Izaberi svoju Teslu“ (js/fleet.js)
Jedna nepomična noćna scena aerodroma (`img/plate.webp`) i zasebni slojevi vozila (`img/m3-front.webp`, `img/my-front.webp`).
Model 3 dolazi iz dubine i parkira se. Pri promeni vozila pale se zadnja svetla, auto izlazi udesno, kadar ostaje prazan ~0,3 s, a novo vozilo dolazi i parkira se na isto mesto. Tek tada se menjaju podaci (putnici, kofere, odlika, cena).
Broj putnika i kofera sam bira vozilo: 1–3 putnika → Model 3, 4 → Model Y, 5–8 → 2 × Tesla (drugi auto se parkira iza prvog).
Pravim fotografijama klijenta se slojevi menjaju bez promene koda: isti ugao (prednji 3/4, okrenut udesno), prozirna pozadina, PNG/WEBP.

## Pre objave
- [ ] Pravi telefoni, PIB, naziv firme (`VOLTA` je radni naziv)
- [ ] Demo recenzije nestaju kad se uključi Supabase (prikazuju se samo prave)
- [ ] Cene dodataka (dodatno stajanje 1.000 din, +1 sat čekanja 1.500 din) — potvrditi sa klijentom
- [ ] Uslovi prevoza i politika privatnosti
