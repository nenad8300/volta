# -*- coding: utf-8 -*-
"""
VOLTA — SEO build. Pravi folder dist/ spreman za objavu:
  index.html (RU), sr.html, en.html — sav tekst u HTML-u (Google ga vidi bez JS-a)
  landing stranice za svaku rutu × 3 jezika, blog, sitemap.xml, robots.txt, _headers, schema.org
Pokretanje:  python build/build.py https://vas-domen.rs
(potreban Python 3 + playwright: pip install playwright && playwright install chromium)
"""
import json, os, re, shutil, subprocess, sys, glob, html, datetime
sys.path.insert(0, os.path.dirname(__file__))
from content import *
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); DIST = os.path.join(ROOT, 'dist')
SITE = (sys.argv[1] if len(sys.argv) > 1 else 'https://volta-transfer.rs').rstrip('/'); TODAY = datetime.date.today().isoformat(); E = html.escape
cfg = json.loads(subprocess.check_output(['node', '-e', "globalThis.window=globalThis;require('%s');console.log(JSON.stringify(globalThis.VOLTA_CONFIG))" % os.path.join(ROOT, 'js/config.js').replace('\\', '/')]))
BRAND = cfg['brand']; CAT = {r['id']: r for r in cfg['catalog']}; OGL = {'ru': 'ru_RU', 'sr': 'sr_RS', 'en': 'en_US'}
def fmt(v, l): s = f"{int(round(v)):,}"; return s.replace(',', ' ' if l == 'ru' else '.' if l == 'sr' else ',')
def ptxt(r, l):
    if r.get('req'): return T['req'][l]
    if r.get('from'): return f"{T['from'][l]} €{r['oweur']}"
    if r.get('ow') is not None: return f"{fmt(r['ow'], l)} {T['rsd'][l]}"
    return f"{fmt(r['rt'], l)} {T['rsd'][l]} ({T['rt'][l]})"
def rname(r, l): return f"{T['ns'][l]} — {r['n'][l]}"
def url(p): return f"{SITE}/{'' if p == 'index.html' else p[:-5] if p.endswith('.html') else p}"
def slug(rid, l): return SLUG[rid][LANGS.index(l)] + '.html'
def ld(*o): return ''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in o)
def hreflang(alts): return ''.join(f'<link rel="alternate" hreflang="{l}" href="{url(p)}">' for l, p in alts.items()) + f'<link rel="alternate" hreflang="x-default" href="{url(alts.get("ru") or list(alts.values())[0])}">'
def faq_ld(p): return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in p]}
def crumbs(items): return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(items)]}
def business(l):
    b = {"@context": "https://schema.org", "@type": ["LocalBusiness", "TaxiService"], "@id": SITE + "/#business", "name": BRAND, "url": url(HOME[l]), "image": SITE + "/img/plate.webp", "logo": SITE + "/img/icon.png",
         "telephone": cfg['phone'], "email": cfg['email'], "priceRange": "3000–23000 RSD", "address": {"@type": "PostalAddress", "addressLocality": "Novi Sad", "addressCountry": "RS"}, "geo": {"@type": "GeoCoordinates", "latitude": 45.2671, "longitude": 19.8335},
         "areaServed": ["Novi Sad", "Belgrade", "Serbia", "Bosnia and Herzegovina", "Montenegro"], "openingHours": "Mo-Su 00:00-23:59", "sameAs": [f"https://t.me/{cfg['telegram']}", f"https://instagram.com/{cfg['instagram']}"],
         "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Transfers", "itemListElement": [{"@type": "Offer", "name": rname(r, l), "price": str(r.get('ow') or r.get('rt')), "priceCurrency": "RSD", "url": url(slug(r['id'], l))} for r in cfg['catalog'] if r['id'] in SLUG and not r.get('req') and not r.get('from')]}}
    if cfg.get('googleRating'): b["aggregateRating"] = {"@type": "AggregateRating", "ratingValue": cfg['googleRating']['avg'], "reviewCount": cfg['googleRating']['count']}
    return b

if os.path.exists(DIST): shutil.rmtree(DIST)
os.makedirs(os.path.join(DIST, 'blog'))
for d in ['img', 'css', 'js']: shutil.copytree(os.path.join(ROOT, d), os.path.join(DIST, d))
for f in ['portal.html', 'manifest.webmanifest']: shutil.copy(os.path.join(ROOT, f), DIST)
pages = []

# ---------- 1. početne (prerender) ----------
from playwright.sync_api import sync_playwright
exe = (glob.glob('/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell') or [None])[0]
def route_links(l):
    g = {'ns': ('Нови-Сад и окрестности', 'Novi Sad i okolina', 'Novi Sad & around'), 'rs': ('По Сербии', 'Po Srbiji', 'Across Serbia'), 'ba': ('Босния', 'Bosna', 'Bosnia'), 'me': ('Черногория', 'Crna Gora', 'Montenegro')}
    cols = ''.join(f'<div><h5>{nm[LANGS.index(l)]}</h5>' + ''.join(f'<a href="{slug(r["id"], l)}">{E(r["n"][l])} · {E(ptxt(r, l))}</a>' for r in cfg['catalog'] if r['cat'] == c and r['id'] in SLUG) + '</div>' for c, nm in g.items())
    if l in BLOG_UI: cols += f'<div><h5>{BLOG_UI[l]["blog"]}</h5>' + ''.join([f'<a href="blog/{p[1]}.html">{E(p[2])}</a>' for p in POSTS if p[0] == l][:5]) + '</div>'
    return f'<section class="s" id="routes" style="padding:40px 0 80px"><div class="wrap"><span class="eyebrow">{["Все направления", "Sve destinacije", "All destinations"][LANGS.index(l)]}</span><div class="seo-links">{cols}</div></div></section>'
SEO_CSS = '.seo-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:26px;margin-top:22px}.seo-links h5{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--mut);margin-bottom:10px}.seo-links a{display:block;padding:5px 0;font-size:14px;color:var(--ink2);border-bottom:1px dashed var(--line)}.seo-links a:hover{color:var(--gold2)}'
with sync_playwright() as p:
    br = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
    for l, fn in HOME.items():
        pg = br.new_page(viewport={'width': 1440, 'height': 900})
        pg.route('**/*', lambda rt: rt.abort() if any(x in rt.request.url for x in ['google.com/maps', 'jsdelivr', 'fonts.g']) else rt.continue_())
        pg.goto('file://' + os.path.join(ROOT, 'index.html') + f'?lang={l}'); pg.wait_for_timeout(1200)
        pg.evaluate("""()=>{document.querySelectorAll('.shown').forEach(e=>e.classList.remove('shown'));['#revs','#cars','#doneActs','#ipsOut','#mq'].forEach(s=>{const e=document.querySelector(s);if(e)e.innerHTML=''});
          document.querySelector('#atlas svg').innerHTML='';document.getElementById('gmap').removeAttribute('src');document.getElementById('nav').classList.remove('solid');
          document.querySelectorAll('.plate').forEach(e=>e.removeAttribute('style'));document.getElementById('fleetCopy').classList.remove('in');}""")
        h = pg.content(); pg.close()
        title, desc = [x.format(brand=BRAND) for x in HOME_META[l]]
        h = re.sub(r'<html[^>]*>', f'<html lang="{l}" data-force-lang="{l}">', h, 1)
        h = re.sub(r'<title>.*?</title>', f'<title>{E(title)}</title>', h, 1, flags=re.S)
        h = re.sub(r'<meta name="description"[^>]*>', f'<meta name="description" content="{E(desc)}">', h, 1)
        h = re.sub(r'<meta property="og:(title|description|image)"[^>]*>', '', h)
        head = (f'<link rel="canonical" href="{url(fn)}">{hreflang(HOME)}<meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc)}"><meta property="og:url" content="{url(fn)}"><meta property="og:type" content="website"><meta property="og:locale" content="{OGL[l]}"><meta property="og:image" content="{SITE}/img/plate.webp"><meta name="twitter:card" content="summary_large_image">'
                + ld(business(l), faq_ld([tuple(x) for x in json.loads(subprocess.check_output(['node', '-e', "global.window={};require('%s');console.log(JSON.stringify(window.VOLTA_FAQ['%s']))" % (os.path.join(ROOT, 'js/i18n.js').replace('\\', '/'), l)]))])) + f'<style>{SEO_CSS}</style>')
        h = h.replace('</head>', head + '</head>', 1).replace('<section class="s ivory" id="faq">', route_links(l) + '<section class="s ivory" id="faq">', 1)
        open(os.path.join(DIST, fn), 'w', encoding='utf-8').write(h)
    br.close()

# ---------- 2. landing stranice ruta ----------
PAGE_CSS = '''.lp-hero{position:relative;min-height:62vh;display:flex;align-items:flex-end;overflow:hidden;background:#000}.lp-hero .bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.75}
.lp-hero:before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(0deg,var(--bg),rgba(0,0,0,.3) 70%)}.lp-hero .wrap{position:relative;z-index:2;padding:140px 0 50px}
.lp-hero h1{font-family:var(--serif);font-weight:500;font-size:clamp(40px,6vw,84px);line-height:.98;max-width:900px}.crumbs{font-size:13px;color:var(--mut);margin-bottom:14px}.crumbs a{text-decoration:underline}
.lp{display:grid;grid-template-columns:1.4fr .9fr;gap:40px;align-items:start}.lp p{font-size:17px;color:var(--ink2);margin-bottom:16px}.lp h2{font-family:var(--serif);font-weight:500;font-size:38px;margin:30px 0 12px}
.inc{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:10px}.inc li:before{content:"✓ ";color:var(--ok)}
.pbox{position:sticky;top:90px;background:var(--card);border:1px solid var(--line);border-radius:26px;padding:26px}.pbox .big{font-family:var(--serif);font-size:54px;color:var(--gold2);line-height:1}
.pbox dl{display:grid;grid-template-columns:auto 1fr;gap:8px 14px;margin:18px 0;font-size:14.5px}.pbox dt{color:var(--mut)}.pbox dd{text-align:right;font-weight:600}.pbox .btn{width:100%;margin-top:8px}
.rel{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.rel a{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;display:flex;justify-content:space-between;gap:10px;font-weight:600}.rel a span{color:var(--gold2)}
.mini{position:absolute;top:0;left:0;right:0;z-index:5}.mini .wrap{display:flex;align-items:center;justify-content:space-between;height:78px}.mini .lg a{font-weight:700;font-size:13px;margin-left:12px;opacity:.7}.mini .lg a.on{opacity:1;color:var(--gold2)}
.bgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}.bcard{border-radius:24px;overflow:hidden;border:1px solid var(--line);background:var(--card);display:flex;flex-direction:column;transition:.3s}.bcard:hover{transform:translateY(-5px);border-color:rgba(212,176,106,.45)}
.bcard .im{height:200px;background-size:cover;background-position:center}.bcard .t{padding:20px;display:grid;gap:10px}.bcard h3{font-family:var(--serif);font-size:27px;font-weight:500;line-height:1.08}.bcard p{color:var(--mut);font-size:14px}.bcard span{color:var(--gold2);font-weight:700}
.ctabox{margin:36px 0;padding:24px;border-radius:22px;border:1px solid rgba(212,176,106,.35);background:linear-gradient(135deg,rgba(212,176,106,.12),transparent);display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap}.ctabox b{font-family:var(--serif);font-size:28px;font-weight:500}
@media(max-width:900px){.lp{grid-template-columns:1fr}.pbox{position:relative;top:0}.inc{grid-template-columns:1fr}}'''
def head(l, title, desc, fn, alts, img, extra, pre=''):
    return (f'<!doctype html><html lang="{l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{E(title)}</title><meta name="description" content="{E(desc)}">'
            f'<link rel="canonical" href="{url(fn)}">{hreflang(alts)}<meta property="og:type" content="website"><meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc)}"><meta property="og:url" content="{url(fn)}"><meta property="og:image" content="{SITE}/{img}"><meta property="og:locale" content="{OGL[l]}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#07080a">'
            f'<link rel="icon" href="{pre}img/icon.png"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="{pre}css/site.css"><style>{PAGE_CSS}</style>{extra}</head><body>')
def nav(l, alts, pre=''):
    lg = ''.join(f'<a href="{pre}{alts[x]}" class="{"on" if x == l else ""}" hreflang="{x}">{x.upper()}</a>' for x in LANGS if x in alts)
    return f'<header class="mini"><div class="wrap"><a href="{pre}{HOME[l]}" class="logo"><i>V</i><span>{BRAND}</span></a><div class="lg">{lg}</div></div></header>'
def foot(l, pre=''):
    return (f'<footer class="ft"><div class="wrap"><div class="g"><div><a href="{pre}{HOME[l]}" class="logo"><i>V</i><span>{BRAND}</span></a><p class="mut">Tesla · Novi Sad</p></div><div><h5>Telegram / WhatsApp</h5><a href="https://t.me/{cfg["telegram"]}">@{cfg["telegram"]}</a><a href="https://wa.me/{cfg["whatsapp"]}">WhatsApp</a><a href="tel:{cfg["phone"]}">{cfg["phone"]}</a></div>'
            f'<div><h5>{T["book"][l]}</h5><a href="{pre}{HOME[l]}#fleet">{T["book"][l]}</a><a href="{pre}{HOME[l]}#prices">{T["price"][l]}</a></div><div><h5>Instagram</h5><a href="https://instagram.com/{cfg["instagram"]}">@{cfg["instagram"]}</a></div></div><div class="bot"><span>© {datetime.date.today().year} {BRAND}</span><span>{T["per_car"][l]}</span></div></div></footer>'
            f'<div class="mbar"><a href="tel:{cfg["phone"]}">☎</a><a href="https://t.me/{cfg["telegram"]}">Telegram</a><a href="{pre}{HOME[l]}#fleet" class="g">{T["book"][l]}</a></div></body></html>')
IMG = {'ns': 'img/plate.webp', 'rs': 'img/fruska.webp', 'ba': 'img/mall.webp', 'me': 'img/montenegro.webp'}
for rid in SLUG:
    r = CAT.get(rid)
    if not r: continue
    alts = {l: slug(rid, l) for l in LANGS}
    for l in LANGS:
        fn, rn, pt, img = alts[l], rname(r, l), ptxt(r, l), r.get('img') or IMG[r['cat']]
        faqs = [(q.format(route=rn, price=pt), a.format(route=rn, price=pt)) for q, a in T['faq'][l]]
        body = BLURB.get(rid, {}).get(l) or [T['generic'][l].format(route=rn, price=pt)]
        facts = ([(T['dist'][l], f"~{r['km']} km"), (T['dur'][l], f"~{r['min']} min")] if r.get('km') else []) + ([(T['price'][l], f"{fmt(r['ow'], l)} {T['rsd'][l]}")] if r.get('ow') else []) + ([(T['rt'][l].capitalize(), f"{fmt(r['rt'], l)} {T['rsd'][l]}")] if r.get('rt') else []) + ([('⏱', T['wait'][l].format(h=r['wait']))] if r.get('wait') else [])
        offer = {"@context": "https://schema.org", "@type": "Service", "serviceType": "Private transfer", "name": rn, "provider": {"@id": SITE + "/#business"}, "areaServed": "Novi Sad", "offers": {"@type": "Offer", "priceCurrency": "EUR" if r.get('from') else "RSD", "price": str(r.get('oweur') if r.get('from') else (r.get('ow') or r.get('rt') or 0)), "url": url(fn)}}
        rel = [x for x in cfg['catalog'] if x['id'] in SLUG and x['id'] != rid and (x['cat'] == r['cat'] or x['id'] in ('beg', 'bg'))][:6]
        h = head(l, T['title'][l].format(route=rn, price=pt, brand=BRAND), T['desc'][l].format(route=rn, price=pt), fn, alts, img, ld(faq_ld(faqs), crumbs([(T['home'][l], url(HOME[l])), (rn, url(fn))]), offer)) + nav(l, alts)
        h += (f'<section class="lp-hero"><div class="bg" style="background-image:url({img})"></div><div class="wrap"><nav class="crumbs"><a href="{HOME[l]}">{T["home"][l]}</a> / {E(rn)}</nav><h1>{E(T["title"][l].split(" — ")[0].format(route=rn))}</h1>'
              f'<p style="margin-top:14px;font-size:20px"><b style="color:var(--gold2)">{E(pt)}</b> · {T["per_car"][l]}</p></div></section><section class="s" style="padding-top:50px"><div class="wrap lp"><div>{"".join(f"<p>{E(x)}</p>" for x in body)}'
              f'<h2>{T["incl_h"][l]}</h2><ul class="inc">{"".join(f"<li>{E(x)}</li>" for x in T["incl"][l])}</ul><h2>{T["faq_h"][l]}</h2><div class="faq" style="margin:0">{"".join(f"<details {chr(111)+chr(112)+chr(101)+chr(110) if i == 0 else ''}><summary>{E(q)}</summary><p>{E(a)}</p></details>" for i, (q, a) in enumerate(faqs))}</div>'
              f'<h2>{T["related"][l]}</h2><div class="rel">{"".join(f"<a href={chr(34)}{slug(x[chr(105)+chr(100)], l)}{chr(34)}>{E(x[chr(110)][l])}<span>{E(ptxt(x, l))}</span></a>" for x in rel)}</div></div>'
              f'<aside class="pbox"><small class="mut">{T["per_car"][l]}</small><div class="big">{E(pt)}</div><dl>{"".join(f"<dt>{E(a)}</dt><dd>{E(b)}</dd>" for a, b in facts)}</dl><a class="btn btn-gold" href="{HOME[l]}?to={rid}#fleet">{T["book"][l]} →</a><a class="btn" href="https://t.me/{cfg["telegram"]}">{T["tg"][l]}</a></aside></div></section>')
        open(os.path.join(DIST, fn), 'w', encoding='utf-8').write(h + foot(l)); pages.append((fn, alts))

# ---------- 3. blog ----------
rp = lambda s, l: re.sub(r'\{price:(\w+)\}', lambda m: ptxt(CAT[m.group(1)], l), s)
for l, U in BLOG_UI.items():
    posts = [p for p in POSTS if p[0] == l]; balts = {x: BLOG_UI[x]['idx'].replace('blog/', '') for x in BLOG_UI}
    for _, sl, title, desc, img, cta, body in posts:
        fn = f'blog/{sl}.html'; r = CAT[cta]; mins = max(2, round(sum(len(x.split()) for _, ps in body for x in ps) / 160))
        art = {"@context": "https://schema.org", "@type": "BlogPosting", "headline": title, "description": desc, "datePublished": TODAY, "dateModified": TODAY, "inLanguage": l, "author": {"@type": "Organization", "name": BRAND}, "publisher": {"@id": SITE + "/#business"}, "image": f"{SITE}/{img}", "mainEntityOfPage": url(fn)}
        box = f'<div class="ctabox"><div><small class="mut">{U["cta"]}</small><br><b>{E(rname(r, l))}</b> · <span style="color:var(--gold2);font-weight:800">{E(ptxt(r, l))}</span></div><a class="btn btn-gold" href="../{HOME[l]}?to={cta}#fleet">{T["book"][l]} →</a></div>'
        h = head(l, title + ' | ' + BRAND, desc, fn, {l: fn}, img, ld(art, crumbs([(T['home'][l], url(HOME[l])), (U['blog'], url(U['idx'])), (title, url(fn))])), '../') + nav(l, {l: 'blog/' + balts[l]}, '../')
        h += (f'<section class="lp-hero"><div class="bg" style="background-image:url(../{img})"></div><div class="wrap"><nav class="crumbs"><a href="../{HOME[l]}">{T["home"][l]}</a> / <a href="{balts[l]}">{U["blog"]}</a></nav><h1>{E(title)}</h1><p class="mut" style="margin-top:12px">{mins} {U["min"]}</p></div></section>'
              f'<section class="s" style="padding-top:50px"><div class="wrap" style="max-width:820px"><article class="lp" style="display:block"><p style="font-size:20px;color:var(--ink)">{E(desc)}</p>'
              + ''.join(f'<h2>{E(t)}</h2>' + ''.join(f'<p>{E(rp(x, l))}</p>' for x in ps) + (box if i == 1 else '') for i, (t, ps) in enumerate(body)) + box +
              f'</article><h2 class="serif" style="font-size:38px;margin:50px 0 18px">{U["more"]}</h2><div class="bgrid">' + ''.join([f'<a class="bcard" href="{p[1]}.html"><div class="im" style="background-image:url(../{p[4]})"></div><div class="t"><h3>{E(p[2])}</h3><span>{U["read"]}</span></div></a>' for p in posts if p[1] != sl][:3]) + '</div></div></section>')
        open(os.path.join(DIST, fn), 'w', encoding='utf-8').write(h + foot(l, '../')); pages.append((fn, {l: fn}))
    fn = U['idx']; ialts = {x: BLOG_UI[x]['idx'] for x in BLOG_UI}
    h = head(l, U['title'], U['desc'], fn, ialts, 'img/fruska.webp', ld(crumbs([(T['home'][l], url(HOME[l])), (U['blog'], url(fn))])), '../') + nav(l, {x: 'blog/' + balts[x] for x in balts}, '../')
    h += (f'<section class="lp-hero" style="min-height:48vh"><div class="bg" style="background-image:url(../img/fruska.webp)"></div><div class="wrap"><nav class="crumbs"><a href="../{HOME[l]}">{T["home"][l]}</a></nav><h1>{U["blog"]}</h1><p style="margin-top:10px;font-size:19px">{U["lead"]}</p></div></section>'
          f'<section class="s" style="padding-top:40px"><div class="wrap"><div class="bgrid">' + ''.join(f'<a class="bcard" href="{p[1]}.html"><div class="im" style="background-image:url(../{p[4]})"></div><div class="t"><h3>{E(p[2])}</h3><p>{E(p[3])}</p><span>{U["read"]}</span></div></a>' for p in posts) + '</div></div></section>')
    open(os.path.join(DIST, fn), 'w', encoding='utf-8').write(h + foot(l, '../')); pages.append((fn, ialts))

# ---------- 4. sitemap / robots / headers ----------
def sm(fn, alts, pr): return f'<url><loc>{url(fn)}</loc><lastmod>{TODAY}</lastmod><priority>{pr}</priority>' + ''.join(f'<xhtml:link rel="alternate" hreflang="{l}" href="{url(p)}"/>' for l, p in alts.items()) + '</url>'
urls = [sm(f, HOME, '1.0') for f in HOME.values()] + [sm(f, a, '0.9' if 'aero' in f or 'airport' in f else '0.7') for f, a in pages]
open(os.path.join(DIST, 'sitemap.xml'), 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' + ''.join(urls) + '</urlset>')
open(os.path.join(DIST, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nDisallow: /portal\nSitemap: {SITE}/sitemap.xml\n')
open(os.path.join(DIST, '_headers'), 'w').write('/img/*\n  Cache-Control: public, max-age=31536000, immutable\n/css/*\n  Cache-Control: public, max-age=86400\n/js/*\n  Cache-Control: public, max-age=86400\n/portal*\n  X-Robots-Tag: noindex\n')
print(f'OK {SITE} -> dist/  | početne 3 · stranice {len(pages)} · sitemap {len(urls)} URL')
