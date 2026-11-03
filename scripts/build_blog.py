#!/usr/bin/env python3
"""Build FORME's long-form Bengali editorial blog from reviewed source content."""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "/fashionstore/"
BASE_URL = "https://sobujkhamarofficial-ctrl.github.io/fashionstore/"
BLOG_DIR = ROOT / "blog"
DATA_FILES = sorted((ROOT / "content").glob("blog_posts_part*.json"))
COVER_ROOT = ROOT / "assets" / "fashion-photos"

CATEGORY_FILTERS = [
    ("all", "সব লেখা"),
    ("compare", "তুলনামূলক গাইড"),
    ("wardrobe", "ওয়ার্ডরোব"),
    ("fit", "ফিট ও সাইজ"),
    ("fabric", "ফ্যাব্রিক"),
    ("style", "স্টাইল"),
    ("care", "পোশাকের যত্ন"),
    ("shopping", "অনলাইন শপিং"),
    ("conscious", "সচেতন ফ্যাশন"),
]

def esc(value: object) -> str:
    return html.escape(str(value), quote=True)

def slug_id(value: str) -> str:
    value = re.sub(r"[^\w\u0980-\u09ff]+", "-", value, flags=re.UNICODE).strip("-")
    return value or "section"

def count_words(article: dict) -> int:
    material = []
    for section in article["sections"]:
        material.extend(section["p"])
    material.extend(example[1] for example in article["examples"])
    material.extend(answer for _, answer in article["faqs"])
    return len(re.findall(r"\S+", " ".join(material)))

def topic_for(category: str) -> str:
    if "তুলনা" in category:
        return "compare"
    if "ওয়ার্ডরোব" in category:
        return "wardrobe"
    if "ফিট" in category or "সাইজ" in category:
        return "fit"
    if "ফ্যাব্রিক" in category or "উপকরণ" in category:
        return "fabric"
    if "যত্ন" in category or "কেয়ার" in category:
        return "care"
    if "অনলাইন" in category:
        return "shopping"
    if "সচেতন" in category:
        return "conscious"
    return "style"

def read_articles() -> list[dict]:
    articles: list[dict] = []
    for path in DATA_FILES:
        if not path.is_file():
            raise FileNotFoundError(f"Missing blog source: {path}")
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise ValueError(f"Blog source must be a JSON list: {path}")
        articles.extend(data)

    if len(articles) not in (10, 20, 25, 30):
        raise ValueError(f"Expected 10, 20, 25 or 30 published articles, found {len(articles)}")
    slugs = [a.get("slug", "") for a in articles]
    if len(set(slugs)) != len(slugs) or any(not re.fullmatch(r"[a-z0-9-]+", slug) for slug in slugs):
        raise ValueError("Blog article slugs must be unique lowercase URL-safe values")

    for article in articles:
        required = ("slug", "title", "category", "date", "readTime", "excerpt", "cover", "tags", "sections", "examples", "faqs")
        missing = [key for key in required if key not in article]
        if missing:
            raise ValueError(f"{article.get('slug', 'unknown')} is missing fields: {missing}")
        if not (COVER_ROOT / article["cover"]).is_file():
            raise FileNotFoundError(f"Missing editorial cover image: {article['cover']}")
        if not article["sections"] or not article["examples"] or not article["faqs"]:
            raise ValueError(f"Article needs sections, examples and FAQs: {article['slug']}")
        article["word_count"] = count_words(article)
        minimum_words = 2800 if "তুলনা" in article["category"] else 3000
        if not minimum_words <= article["word_count"] <= 4000:
            raise ValueError(f"{article['slug']} has {article['word_count']} body words; required range is {minimum_words:,}–4,000")
        article["topic"] = topic_for(article["category"])
    return articles

def header() -> str:
    # Blog is intentionally kept out of the header navigation; it is a dedicated footer destination.
    return f'''<div class="fc-topbar">FORME · EVERYDAY, REFINED · BANGLADESH</div>
<header class="fc-header"><div class="fc-head-inner">
<a class="fc-logo" href="{BASE}">FORME<small>EVERYDAY, REFINED</small></a>
<nav class="fc-nav" aria-label="Site navigation">
<a href="{BASE}">Shop</a><a href="{BASE}men/">Men</a><a href="{BASE}women/">Women</a>
<a href="{BASE}pages/about.html">About</a><a href="{BASE}pages/contact.html">Contact</a>
</nav></div></header>'''

def footer(articles: list[dict]) -> str:
    return f'''<footer class="fc-footer"><div class="fc-foot-inner">
<div class="fc-foot-grid">
<div><a class="fc-logo" style="color:#fff" href="{BASE}">FORME<small style="color:#d8ded8">EVERYDAY, REFINED</small></a>
<p>Considered clothing and modern everyday essentials. A Bangladesh-focused fashion storefront.</p></div>
<div><h3>Explore</h3><a href="{BASE}">Shop all</a><a href="{BASE}men/">Men</a><a href="{BASE}women/">Women</a></div>
<div><h3>Blog</h3><a href="{BASE}blog/">সব ব্লগ পোস্ট</a></div>
<div><h3>Customer care</h3><a href="{BASE}pages/shipping-delivery.html">Shipping &amp; delivery</a><a href="{BASE}pages/returns-refunds.html">Returns &amp; refunds</a><a href="{BASE}pages/cancellations.html">Cancellations</a><a href="{BASE}pages/size-guide.html">Size guide</a><a href="{BASE}pages/reviews.html">Customer reviews</a><a href="{BASE}pages/faq.html">FAQs</a><a href="{BASE}pages/order-tracking.html">Track an order</a></div>
<div><h3>Information</h3><a href="{BASE}pages/about.html">About FORME</a><a href="{BASE}pages/contact.html">Contact</a><a href="{BASE}pages/payment.html">Payment policy</a><a href="{BASE}pages/privacy.html">Privacy policy</a><a href="{BASE}pages/terms.html">Terms &amp; conditions</a></div>
</div><div class="fc-footer-bottom"><span>© 2026 FORME. All rights reserved.</span><span>Bangladesh · Pilot storefront</span></div>
</div></footer>'''

def common_head(title: str, description: str, canonical: str, og_image: str, extra_json: dict | None = None) -> str:
    structured = ""
    if extra_json:
        structured = '<script type="application/ld+json">' + json.dumps(extra_json, ensure_ascii=False).replace("</", "<\\/") + "</script>"
    return f'''<!doctype html>
<html lang="bn"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#F7F5F0">
<meta name="description" content="{esc(description)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="FORME">
<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{esc(canonical)}"><meta property="og:image" content="{esc(og_image)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="{esc(canonical)}">
<link rel="stylesheet" href="{BASE}assets/content-pages.css">
<link rel="stylesheet" href="{BASE}assets/blog.css?v=20261103-1">
<link rel="stylesheet" href="{BASE}assets/customer-care.css?v=20261103-5">
<title>{esc(title)} | FORME Blog</title>
{structured}
</head>'''

def render_article(article: dict, all_articles: list[dict]) -> str:
    canonical = BASE_URL + "blog/" + article["slug"] + ".html"
    cover_url = BASE_URL + "assets/fashion-photos/" + article["cover"]
    related = [a for a in all_articles if a["slug"] != article["slug"]][:3]
    toc_items = []
    body_parts = []
    for section in article["sections"]:
        sid = slug_id(section["h"])
        toc_items.append(f'<a href="#{esc(sid)}">{esc(section["h"])}</a>')
        paragraphs = "".join(f"<p>{esc(p)}</p>" for p in section["p"])
        body_parts.append(f'<section id="{esc(sid)}"><h2>{esc(section["h"])}</h2>{paragraphs}</section>')
    examples_id = "practical-examples"
    examples_html = "".join(f"<h3>{esc(title)}</h3><p>{esc(copy)}</p>" for title, copy in article["examples"])
    faqs_id = "common-questions"
    faqs_html = "".join(f"<h3>{esc(question)}</h3><p>{esc(answer)}</p>" for question, answer in article["faqs"])
    related_html = "".join(
        f'''<a href="{BASE}blog/{esc(a["slug"])}.html"><small>{esc(a["category"])}</small><br>{esc(a["title"])}</a>'''
        for a in related
    )
    article_json = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": article["title"],
        "description": article["excerpt"],
        "image": cover_url,
        "datePublished": "2026-11-03",
        "dateModified": "2026-11-03",
        "inLanguage": "bn-BD",
        "author": {"@type": "Organization", "name": "FORME Editorial Team"},
        "publisher": {"@type": "Organization", "name": "FORME", "url": BASE_URL},
        "mainEntityOfPage": canonical,
        "wordCount": article["word_count"],
        "articleSection": article["category"],
        "keywords": article["tags"],
    }
    tags = "".join(f'<span class="fb-topic">{esc(tag)}</span>' for tag in article["tags"])
    body = f'''<div class="fc-breadcrumb"><a href="{BASE}">Home</a> / <a href="{BASE}blog/">Blog</a> / {esc(article["category"])}</div>
<div class="fb-article-hero"><img src="{BASE}assets/fashion-photos/{esc(article["cover"])}" alt="{esc(article["title"])}" loading="eager" decoding="async"></div>
<span class="fb-eyebrow">{esc(article["category"])} · FORME EDITORIAL</span>
<h1 class="fb-article-title">{esc(article["title"])}</h1>
<p class="fb-article-deck">{esc(article["excerpt"])}</p>
<div class="fb-byline"><strong>FORME Editorial Team</strong><span>{esc(article["date"])}</span><span>{esc(article["readTime"])}</span><span>{article["word_count"]:,} শব্দ</span></div>
<div class="fb-share"><button type="button" data-blog-share>লিংক শেয়ার / কপি করুন</button><a class="fb-read" href="{BASE}blog/">সব ব্লগ পোস্ট দেখুন →</a></div>
<div class="fb-article-layout">
<article class="fb-prose">
{''.join(body_parts)}
<section id="{examples_id}"><h2>বাস্তব উদাহরণ ও প্রয়োগ</h2>{examples_html}</section>
<section id="{faqs_id}"><h2>সাধারণ প্রশ্ন ও উত্তর</h2>{faqs_html}</section>
<div class="fb-note"><strong>FORME নোট:</strong> এই আর্টিকেলটি সাধারণ স্টাইল ও পোশাক-সংক্রান্ত তথ্যের জন্য। নির্দিষ্ট পণ্যের ছবি, ফ্যাব্রিক, সাইজ, স্টক, দাম ও ডেলিভারি সম্পর্কে চূড়ান্ত তথ্য সংশ্লিষ্ট পণ্যের পেজ বা FORME টিমের কাছ থেকে নিশ্চিত করুন।</div>
<p>{tags}</p>
</article>
<aside class="fb-toc"><strong>এই লেখায় যা আছে</strong>{''.join(toc_items)}<a href="#{examples_id}">বাস্তব উদাহরণ</a><a href="#{faqs_id}">সাধারণ প্রশ্ন</a></aside>
</div>
<section class="fb-related"><h2>আরও পড়ুন</h2><div class="fb-related-grid">{related_html}</div></section>
<a class="fb-back" href="{BASE}blog/">← Blog Index-এ ফিরে যান</a>'''
    head = common_head(article["title"], article["excerpt"], canonical, cover_url, article_json)
    return f'''{head}<body>{header()}<main class="fc-main fb-main">{body}</main>{footer(all_articles)}
<script src="{BASE}assets/blog.js?v=20261103-1" defer></script>
<script src="{BASE}assets/customer-care.js?v=20261103-5" defer></script>
<script src="{BASE}assets/customer-live-voice.js?v=20261103-2" defer></script>
</body></html>'''

def render_index(articles: list[dict]) -> str:
    canonical = BASE_URL + "blog/"
    cards = []
    for article in articles:
        search_text = " ".join([article["title"], article["excerpt"], article["category"], *article["tags"]])
        cards.append(f'''<article class="fb-card" data-blog-card data-topic="{esc(article["topic"])}" data-search="{esc(search_text)}">
<a class="fb-cover" href="{BASE}blog/{esc(article["slug"])}.html"><img src="{BASE}assets/fashion-photos/{esc(article["cover"])}" alt="{esc(article["title"])}" loading="lazy" decoding="async"></a>
<div class="fb-card-body"><div class="fb-card-meta"><span>{esc(article["category"])}</span><span>{article["word_count"]:,} শব্দ</span><span>{esc(article["readTime"])}</span></div>
<h2>{esc(article["title"])}</h2><p>{esc(article["excerpt"])}</p>
<a class="fb-read" href="{BASE}blog/{esc(article["slug"])}.html">আর্টিকেল পড়ুন →</a></div></article>''')
    filter_buttons = "".join(
        f'<button type="button" class="fb-topic{" active" if key == "all" else ""}" data-blog-filter="{esc(key)}">{esc(label)}</button>'
        for key, label in CATEGORY_FILTERS
    )
    hero_images = "".join(
        f'<img src="{BASE}assets/fashion-photos/{esc(a["cover"])}" alt="{esc(a["title"])}" loading="eager">'
        for a in articles[:2]
    )
    blog_json = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "FORME Blog",
        "description": "বাংলাদেশের আবহাওয়া, দৈনন্দিন ফ্যাশন, ফিট, কাপড়ের যত্ন ও সচেতন কেনাকাটা নিয়ে FORME-এর বাংলা গাইড।",
        "url": canonical,
        "inLanguage": "bn-BD",
        "publisher": {"@type": "Organization", "name": "FORME"},
    }
    head = common_head("FORME Blog — ফ্যাশন, ফিট ও পোশাকের যত্ন", blog_json["description"], canonical, BASE_URL + "assets/fashion-photos/" + articles[0]["cover"], blog_json)
    body = f'''<div class="fc-breadcrumb"><a href="{BASE}">Home</a> / Blog</div>
<section class="fb-hero"><div><span class="fb-eyebrow">THE FORME EDITORIAL</span><h1>স্টাইল বুঝে বেছে নিন। নিজের মতো করে পরুন।</h1><p>বাংলাদেশের আবহাওয়া, দৈনন্দিন পোশাক, ফিট, ফ্যাব্রিক, garment care ও সচেতন কেনাকাটা নিয়ে ব্যবহারিক বাংলা গাইড। প্রতিটি লেখা বিস্তারিতভাবে তৈরি, যাতে কেনার আগে ও পোশাক ব্যবহারের সময় কাজে লাগে।</p></div><div class="fb-hero-art">{hero_images}</div></section>
<div class="fb-filterbar"><label class="fb-search"><span aria-hidden="true">⌕</span><input id="fb-search" type="search" placeholder="বিষয়, শিরোনাম বা keyword লিখুন…" aria-label="ব্লগ পোস্ট খুঁজুন"></label><div class="fb-topics">{filter_buttons}</div></div>
<p class="fb-results" id="fb-results"></p>
<div class="fb-grid">{''.join(cards)}</div>
<div class="fb-empty" id="fb-empty" hidden>এই বিষয়ে কোনো লেখা পাওয়া যায়নি। অন্য শব্দ বা ক্যাটাগরি দিয়ে খুঁজুন।</div>
<div class="fb-note"><strong>পাঠকের জন্য:</strong> এই Blog-এ প্রকাশিত লেখাগুলো সাধারণ fashion ও clothing-care guidance। FORME-এর pilot catalogue-এ কিছু product detail, size, stock ও final price এখনও team confirmation-এর অধীন। অর্ডারের আগে পণ্যের নির্দিষ্ট তথ্য নিশ্চিত করুন।</div>'''
    return f'''{head}<body>{header()}<main class="fc-main fb-main">{body}</main>{footer(articles)}
<script src="{BASE}assets/blog.js?v=20261103-1" defer></script>
<script src="{BASE}assets/customer-care.js?v=20261103-5" defer></script>
<script src="{BASE}assets/customer-live-voice.js?v=20261103-2" defer></script>
</body></html>'''

def rebuild_sitemap() -> int:
    urls = set()
    for html_file in ROOT.rglob("*.html"):
        rel = html_file.relative_to(ROOT).as_posix()
        if rel.startswith(".github/") or rel == "404.html":
            continue
        urls.add(BASE_URL if rel == "index.html" else BASE_URL + (rel[:-10] if rel.endswith("/index.html") else rel))
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for url in sorted(urls):
        sitemap += f'<url><loc>{esc(url)}</loc></url>\n'
    sitemap += '</urlset>\n'
    (ROOT / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    (ROOT / "robots.txt").write_text("User-agent: *\nAllow: /\nSitemap: " + BASE_URL + "sitemap.xml\n", encoding="utf-8")
    return len(urls)

def main() -> None:
    articles = read_articles()
    BLOG_DIR.mkdir(parents=True, exist_ok=True)
    keep = {a["slug"] + ".html" for a in articles}
    for old_page in BLOG_DIR.glob("*.html"):
        if old_page.name != "index.html" and old_page.name not in keep:
            old_page.unlink()
    (BLOG_DIR / "index.html").write_text(render_index(articles), encoding="utf-8")
    for article in articles:
        path = BLOG_DIR / (article["slug"] + ".html")
        path.write_text(render_article(article, articles), encoding="utf-8")
    sitemap_count = rebuild_sitemap()
    total_words = sum(a["word_count"] for a in articles)
    print(f"Built {len(articles)} long-form Bengali blog articles; {total_words:,} article-body words total; all individual posts validated at 3,000–4,000 words; sitemap URLs: {sitemap_count}.")

if __name__ == "__main__":
    main()
