#!/usr/bin/env python3
"""Generate standalone FORME Men's collection pages from the shared catalogue."""
import html, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "/fashionstore/"
OUT = ROOT / "men"
def esc(v): return html.escape(str(v), quote=True)
def href(slug): return f'{BASE}men/{slug + "/" if slug != "men" else ""}'
def header(cats):
    parts=[]
    for group in ("Topwear","Bottomwear","Accessories"):
        links="".join(f'<a href="{href(c["slug"])}">{esc(c["title"])}</a>' for c in cats if c["group"]==group)
        n=sum(1 for c in cats if c["group"]==group)
        parts.append(f'<div class="f-mega-group"><b>{group}</b><div class="f-mega-links">{links}</div></div>')
    menu='<div class="f-mega-menu" id="f-men-mega-menu"><div class="f-mega-inner">'+''.join(parts)+f'<a class="f-mega-all" href="{href("men")}">View all men\'s items ↗</a></div></div>'
    other_menus=[]
    collection_data=json.loads((ROOT/"collections"/"catalog.json").read_text(encoding="utf-8"))
    for department in collection_data["departments"]:
        dept_slug=department["slug"]
        groups=[]
        for group in department["groups"]:
            group_url=f'{BASE}{dept_slug}/{group["slug"]}/'
            links="".join(
                f'<a href="{BASE}{dept_slug}/{group["slug"]}/{category["slug"]}/">{esc(category["title"])}</a>'
                for category in group["categories"]
            )
            groups.append(
                f'<div class="f-mega-group"><b><a href="{group_url}">{esc(group["title"])}</a></b>'
                f'<div class="f-mega-links">{links}</div></div>'
            )
        other_menu=(
            f'<div class="f-mega-menu" id="f-{dept_slug}-mega-menu"><div class="f-mega-inner">'
            + ''.join(groups)
            + f'<a class="f-mega-all" href="{BASE}{dept_slug}/">View all {esc(department["title"])} ↗</a>'
            + '</div></div>'
        )
        other_menus.append(
            f'<a href="{BASE}{dept_slug}/">{esc(department["title"])}</a>'
            f'<details class="f-native-mega" id="f-{dept_slug}-native-mega">'
            f'<summary class="f-nav-men-toggle" aria-label="Open {esc(department["title"])} categories"><span aria-hidden="true">⌄</span></summary>'
            f'{other_menu}</details>'
        )
    other_nav=''.join(other_menus)
    return ('<div class="f-announcement">Discover the new season edit <strong>·</strong> Everyday pieces, thoughtfully chosen</div>'
      '<header class="f-header"><div class="f-container f-head-main">'
      f'<a href="{BASE}" class="f-logo">FORME<small>EVERYDAY, REFINED</small></a>'
      '<nav class="f-nav" aria-label="Main navigation">'
      f'<a href="{href("men")}" class="f-nav-men-link f-nav-active">Men</a>'
      + '<details class="f-native-mega" id="f-men-native-mega"><summary class="f-nav-men-toggle" aria-label="Open men categories"><span aria-hidden="true">⌄</span></summary>'+menu+'</details>'
      + other_nav
      + '</nav><div class="f-actions"><a class="f-icon" href="'+BASE+'#f-new-in" aria-label="Browse new arrivals"><svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg></a></div>'
      + '</div></header>')
def card(p,priority=False):
    badge=f'<span class="f-product-tag">{esc(p["badge"])}</span>' if p.get("badge") else ""
    loading="eager" if priority else "lazy"
    high=' fetchpriority="high"' if priority else ""
    product_id=str(p.get('product_id') or f'men-{p["id"]}')
    return ('<article class="f-product f-static-product"'
      f' data-id="{esc(product_id)}" data-name="{esc(p["name"])}" data-price="{int(p["price"])}" data-image="{esc(p["image"])}">'
      '<div class="f-product-photo">'
      f'<img src="{esc(p["image"])}" alt="{esc(p["name"])}" loading="{loading}"{high} data-fallback="f-photo-missing" onerror="this.hidden=true;this.parentElement.classList.add(this.dataset.fallback)">{badge}'
      f'<div class="f-product-actions"><button class="f-add" type="button" data-f-add="{esc(product_id)}">Add to Cart</button><button class="f-buy-now" type="button" data-f-buy-now="{esc(product_id)}">অর্ডার নাও</button></div></div>'
      '<div class="f-product-info">'
      f'<span class="f-product-name">{esc(p["name"])}</span><span class="f-men-savings">{esc(p["description"])}</span>'
      f'<div class="f-men-price-row"><strong>৳{int(p["price"]):,}</strong></div>'
      '</div></article>')
def directory(cats):
    groups=[]
    for group in ("Topwear","Bottomwear","Accessories"):
        items=[c for c in cats if c["group"]==group]
        links="".join(f'<a class="f-men-category-link" href="{href(c["slug"])}"><b>{esc(c["title"])}</b><small>{len(c["products"])} listings to explore</small></a>' for c in items)
        groups.append(f'<section class="f-men-category-group"><div class="f-men-category-group-title"><b>{group}</b><small>{len(items)} categories</small></div><div class="f-men-category-links">{links}</div></section>')
    return ('<section class="f-static-categories"><div class="f-men-category-top"><div><b>Explore men\'s categories</b><small>Every category has its own collection page with catalogue listings.</small></div>'
      f'<span>{len(cats)} categories</span></div>'+''.join(groups)+'</section>')
def category_nav(cats,active):
    links="".join(f'<a href="{href(c["slug"])}"'+(' class="active"' if c["slug"]==active else "")+f'>{esc(c["title"])}</a>' for c in cats)
    return f'<nav class="f-static-category-nav" aria-label="Other men categories">{links}</nav>'
def make_page(title,desc,cats,selected=None):
    main=selected is None
    slug="men" if main else selected["slug"]
    crumb='<a href="'+BASE+'">Home</a> / Men' if main else f'<a href="{BASE}">Home</a> / <a href="{href("men")}">Men</a> / {esc(title)}'
    listing=directory(cats) if main else category_nav(cats,slug)
    if main:
        featured=[c["products"][0] for c in cats][:12]
        products_label="12 featured catalogue listings"; section_title="Featured men's pieces"
    else:
        featured=selected["products"]; products_label=f'{len(featured)} catalogue listing{"s" if len(featured) != 1 else ""}'; section_title=f'{esc(title)} collection'
    cards="".join(card(p,i==0) for i,p in enumerate(featured))
    warning='<p class="f-catalog-note">FORME pilot catalogue · product names and listed prices are database-backed; photographs are representative catalogue imagery. Stock, sizes, variants and final delivery charges require confirmation. Buy Now creates a pending COD order request, not a confirmed dispatch.</p>'
    page_title="Men's Collection" if main else title
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#F7F5F0"><meta name="description" content="{esc(desc)}">
<title>{esc(page_title)} | FORME</title><link rel="stylesheet" href="{BASE}men/men-pages.css"><link rel="stylesheet" href="{BASE}assets/customer-care.css?v=20261103-5"><link rel="stylesheet" href="{BASE}assets/image-viewer.css?v=20261103-1"><link rel="stylesheet" href="{BASE}assets/blog.css?v=20261103-1"><link rel="stylesheet" href="{BASE}assets/catalogue-live.css?v=20261103-3"><link rel="stylesheet" href="{BASE}assets/commerce-actions.css?v=20261103-1"></head>
<body><div id="forme-storefront">{header(cats)}
<main class="f-static-main"><div class="f-container"><div class="f-static-crumb">{crumb}</div>
<section class="f-static-intro"><span class="f-kicker">{"The men's wardrobe" if main else esc(selected["group"])}</span><h1>{esc(page_title)}</h1><p>{esc(desc)}</p></section>
{listing}<section class="f-static-products"><div class="f-section-head"><div><span class="f-kicker">The collection</span><h2>{section_title}</h2></div><span class="f-men-total">{products_label}</span></div>
{warning}<div class="f-static-product-grid">{cards}</div></section>
<a class="f-static-back" href="{href("men")}">← Back to Men's Collection</a></div></main>
<footer class="f-static-footer"><div class="f-container"><strong class="f-logo">FORME<small>EVERYDAY, REFINED</small></strong><small>Pilot catalogue · stock, variants and final delivery details are confirmed by the store before dispatch</small><nav class="f-static-legal"><a href="{BASE}pages/shipping-delivery.html">Shipping</a><a href="{BASE}pages/returns-refunds.html">Returns</a><a href="{BASE}pages/reviews.html">Reviews</a><a href="{BASE}pages/order-tracking.html">Track order</a><a href="{BASE}pages/privacy.html">Privacy</a><a href="{BASE}pages/terms.html">Terms</a><a href="{BASE}pages/contact.html">Contact</a></nav><div class="fb-footer-blog"><strong>Blog</strong><a href="{BASE}blog/">সব ব্লগ পোস্ট</a></div><a href="{BASE}" style="font-size:10px;color:#fff">Home ↗</a></div></footer></div><script src="{BASE}assets/commerce-actions.js?v=20261103-1" defer></script><script src="{BASE}assets/catalogue-live.js?v=20261103-3" defer></script><script src="{BASE}assets/image-viewer.js?v=20261103-1" defer></script><script src="{BASE}assets/customer-care.js?v=20261103-5" defer></script><script src="{BASE}assets/customer-live-voice.js?v=20261103-3" defer></script></body></html>'''
def main():
    data=json.loads((OUT/"catalog.json").read_text(encoding="utf-8"))
    cats=data["categories"]
    assert len(cats)==23 and all(len(c["products"])>=1 for c in cats)
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/"index.html").write_text(make_page("Men's Collection","Explore men's everyday essentials, considered fits and modern classics. Browse all 23 categories and discover database-linked catalogue listings.",cats),encoding="utf-8")
    for c in cats:
        folder=OUT/c["slug"]; folder.mkdir(parents=True,exist_ok=True)
        desc=f'Explore the FORME {c["title"]} collection. Browse the catalogue listings in this category.'
        (folder/"index.html").write_text(make_page(c["title"],desc,cats,c),encoding="utf-8")
    old=OUT/"men"; old.mkdir(parents=True,exist_ok=True)
    (old/"index.html").write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/fashionstore/men/"><link rel="canonical" href="https://sobujkhamarofficial-ctrl.github.io/fashionstore/men/"><title>Men | FORME</title><script>location.replace("/fashionstore/men/")</script></head><body><a href="/fashionstore/men/">Continue to Men\'s Collection</a></body></html>',encoding="utf-8")
    print(f'Generated 1 landing page and {len(cats)} category pages with {sum(len(c["products"]) for c in cats)} products.')
if __name__=="__main__": main()
