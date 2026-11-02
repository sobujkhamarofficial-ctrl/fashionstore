#!/usr/bin/env python3
"""Generate multi-level FORME category pages with six unique original illustrations per page."""
from html import escape
import base64
import hashlib
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "collections" / "catalog.json"
BASE = "/fashionstore/"
DEPARTMENTS = ("men", "women", "teens", "kids", "sports", "accessories")


def esc(value):
    return escape(str(value), quote=True)


def page_url(department, parts=()):
    tail = "/".join([department["slug"], *parts])
    return f"{BASE}{tail}/"


def node_children(node):
    for key in ("groups", "categories", "subcategories"):
        if key in node:
            return node[key]
    return []


def node_kind(node, is_department=False):
    if is_department:
        return "Department"
    level = node.get("level")
    if level == "category":
        return "Category"
    if level == "sub-category":
        return "Sub-category"
    if level == "sub-sub-category":
        return "Sub-sub-category"
    if "categories" in node:
        return "Collection"
    return "Sub-category"


def count_descendants(node):
    children = node_children(node)
    return len(children) + sum(count_descendants(child) for child in children)


NAVIGATION_HTML = ""


def build_nav_html(departments, men_categories):
    menu_items = []
    for group in ("Topwear", "Bottomwear", "Accessories"):
        cats = [c for c in men_categories if c["group"] == group]
        menu_items.append({
            "slug": "men",
            "title": "Men",
            "group": group,
            "categories": cats,
        })
    items = [{"slug": "men", "title": "Men", "groups": []}]
    for group in ("Topwear", "Bottomwear", "Accessories"):
        cats = [c for c in men_categories if c["group"] == group]
        items[0]["groups"].append({"slug": "", "title": group, "categories": cats})
    items.extend(departments)

    nav = []
    for department in items:
        slug = department["slug"]
        title = department["title"]
        groups = []
        for group in department["groups"]:
            group_url = f'{BASE}{slug}/{group["slug"]}/' if group["slug"] else ""
            links = "".join(
                f'<a href="{BASE}{slug}/{group["slug"] + "/" if group["slug"] else ""}{category["slug"]}/">{esc(category["title"])}</a>'
                for category in group["categories"]
            )
            heading = (
                f'<b><a href="{group_url}">{esc(group["title"])}</a></b>'
                if group_url else f'<b>{esc(group["title"])}</b>'
            )
            groups.append(
                f'<div class="nav-mega-group">{heading}<div class="nav-mega-links">{links}</div></div>'
            )
        menu = (
            f'<div class="nav-mega"><div class="nav-mega-inner">{"".join(groups)}'
            f'<a class="nav-mega-all" href="{BASE}{slug}/">View all {esc(title)} ↗</a>'
            '</div></div>'
        )
        nav.append(
            f'<div class="nav-department"><a href="{BASE}{slug}/">{esc(title)}</a>'
            f'<details class="nav-dropdown"><summary aria-label="Show {esc(title)} categories"><span>⌄</span></summary>{menu}</details></div>'
        )
    links = "".join(nav)
    return (
        '<div class="site-topline">FORME · EVERYDAY, REFINED</div>'
        '<header class="site-header"><div class="site-header-inner">'
        f'<a class="site-logo" href="{BASE}">FORME<span>EVERYDAY, REFINED</span></a>'
        f'<nav class="primary-categories" aria-label="Main categories">{links}</nav>'
        '</div></header>'
    )


def nav_html():
    return NAVIGATION_HTML


def image_kind(department, node, ancestors, index):
    words = " ".join([department["title"], *(x[0] for x in ancestors), node["title"]]).lower()
    if any(x in words for x in ("backpack", "handbag", "tote", "crossbody", "shoulder bag", "pouch", "bag")):
        return "bag"
    if any(x in words for x in ("wallet", "card holder", "card-holder", "key case")):
        return "wallet"
    if any(x in words for x in ("cap", "hat", "beanie", "headwear")):
        return "cap"
    if any(x in words for x in ("sock", "multipack")):
        return "socks"
    if any(x in words for x in ("jewellery", "jewelry", "earring", "necklace", "bracelet", "watch", "sunglasses", "hair accessory", "keyring")):
        return "jewelry"
    if any(x in words for x in ("jeans", "trouser", "pants", "jogger", "legging", "shorts", "skirt")):
        return "bottoms"
    if any(x in words for x in ("dress", "frock", "saree", "salwar", "kameez", "kurti", "dupatta", "jumpsuit", "romper")):
        return "dress"
    if any(x in words for x in ("hoodie", "jacket", "sweater", "cardigan", "sweatshirt", "windbreaker", "outerwear", "shrug")):
        return "outerwear"
    if any(x in words for x in ("shirt", "t-shirt", "tee", "polo", "blouse", "top", "tank", "jersey", "bodysuit")):
        return "top"
    cycle = ["top", "dress", "bottoms", "outerwear", "bag", "jewelry"]
    offset = sum(ord(ch) for ch in department["slug"] + node["title"]) % len(cycle)
    return cycle[(offset + index) % len(cycle)]


def svg_image_data(page_key, title, kind, index):
    seed_text = f"{page_key}|visual-{index + 1}|{title}"
    digest = hashlib.sha256(seed_text.encode("utf-8")).digest()
    rng = random.Random(int.from_bytes(digest[:8], "big"))

    backgrounds = [
        ("#F2EDE4", "#E4DED2"), ("#E7E9E1", "#D6DED4"),
        ("#F1E4DC", "#E7D2C5"), ("#E6E8EF", "#D5D9E5"),
        ("#EEE8D8", "#E4DCC4"), ("#E9E1E8", "#DCCEDB"),
        ("#E1E9E8", "#CEDDD9"), ("#ECE5DE", "#DED1C5"),
    ]
    garments = [
        "#293E35", "#B66C4D", "#343B50", "#9A8067",
        "#6E7D71", "#C08E72", "#596C83", "#7E5860",
        "#D0B99B", "#3D4843", "#87918A", "#A6A08E",
    ]
    bg1, bg2 = backgrounds[rng.randrange(len(backgrounds))]
    cloth = garments[rng.randrange(len(garments))]
    accent = garments[rng.randrange(len(garments))]
    ink = "#27332E"
    sid = digest.hex()[:12]
    gradient = f"cloth-{sid}"
    back_gradient = f"back-{sid}"
    shadow = f"shadow-{sid}"
    pattern = f"pattern-{sid}"
    rotation = rng.randint(-7, 7)
    scale = round(rng.uniform(0.88, 1.08), 3)
    variation = rng.randrange(4)
    trim_width = rng.randint(3, 7)

    if kind in ("top", "outerwear"):
        body = (
            '<path d="M-86 -165 L-42 -198 Q0 -177 42 -198 L86 -165 '
            'L165 -105 L122 -43 L91 -72 L91 178 Q0 198 -91 178 '
            'L-91 -72 L-122 -43 L-165 -105 Z" '
            f'fill="url(#{gradient})" stroke="{ink}" stroke-width="7" stroke-linejoin="round"/>'
            '<path d="M-42 -197 Q0 -148 42 -197" fill="none" stroke="#F5EFE7" stroke-width="13" stroke-linecap="round"/>'
            f'<path d="M-91 -72 L-91 178 M91 -72 L91 178" fill="none" stroke="{accent}" stroke-width="5" opacity=".75"/>'
            f'<path d="M-145 -103 L-116 -69 M145 -103 L116 -69" stroke="{accent}" stroke-width="{trim_width}" stroke-linecap="round"/>'
        )
        if kind == "outerwear":
            body += (
                '<path d="M0 -166 L0 179" stroke="#F2EDE4" stroke-width="7"/>'
                '<path d="M-34 -190 L0 -151 L34 -190" fill="none" stroke="#F2EDE4" stroke-width="8"/>'
                + "".join(f'<circle cx="13" cy="{y}" r="4.5" fill="#F2EDE4"/>' for y in (-95, -30, 35, 100))
            )
        elif variation == 0:
            body += f'<path d="M-28 -139 L28 -139 L28 -87 L-28 -87 Z" fill="{accent}" opacity=".88"/>'
        elif variation == 1:
            body += f'<path d="M-70 15 L70 15 M-70 27 L70 27 M-70 39 L70 39" stroke="{accent}" stroke-width="5" opacity=".8"/>'
        else:
            body += f'<path d="M-55 -75 L55 -75 L55 20 L-55 20 Z" fill="none" stroke="{accent}" stroke-width="5"/>'
    elif kind in ("dress",):
        body = (
            '<path d="M-52 -190 L52 -190 L70 -55 Q108 5 156 190 '
            'Q0 228 -156 190 Q-108 5 -70 -55 Z" '
            f'fill="url(#{gradient})" stroke="{ink}" stroke-width="7" stroke-linejoin="round"/>'
            '<path d="M-50 -184 Q0 -140 50 -184" fill="none" stroke="#F4EEE4" stroke-width="12" stroke-linecap="round"/>'
            f'<path d="M-70 -55 Q0 -26 70 -55" fill="none" stroke="{accent}" stroke-width="6"/>'
            f'<path d="M-100 37 L-77 181 M-48 48 L-38 193 M0 48 L0 200 M48 48 L38 193 M100 37 L77 181" stroke="{accent}" stroke-width="4" opacity=".65"/>'
        )
        if variation == 0:
            body += f'<path d="M-42 -135 L42 -135" stroke="{accent}" stroke-width="8"/>'
        elif variation == 1:
            body += f'<path d="M-18 -174 L-18 -60 L18 -60 L18 -174" fill="none" stroke="{accent}" stroke-width="5"/>'
    elif kind == "bottoms":
        body = (
            '<path d="M-130 -178 Q0 -194 130 -178 L118 -55 L87 192 '
            'L12 192 L0 -20 L-12 192 L-87 192 L-118 -55 Z" '
            f'fill="url(#{gradient})" stroke="{ink}" stroke-width="7" stroke-linejoin="round"/>'
            '<path d="M-128 -159 Q0 -132 128 -159" fill="none" stroke="#F2EDE4" stroke-width="10"/>'
            f'<path d="M-105 -140 L-105 -72 M105 -140 L105 -72" stroke="{accent}" stroke-width="5"/>'
            f'<path d="M-87 190 L-87 140 M87 190 L87 140" stroke="{accent}" stroke-width="{trim_width}"/>'
            '<path d="M0 -20 L0 15" stroke="#F2EDE4" stroke-width="5"/>'
        )
        if variation == 0:
            body += f'<path d="M-65 -115 L-65 -72 L-8 -72 L-8 -115 Z" fill="none" stroke="{accent}" stroke-width="5"/>'
        elif variation == 1:
            body += f'<path d="M50 -118 L108 -118 L108 -40 L50 -40 Z" fill="none" stroke="{accent}" stroke-width="5"/>'
    elif kind == "bag":
        body = (
            '<path d="M-105 -45 Q-105 -112 0 -112 Q105 -112 105 -45" fill="none" stroke="#7C5D48" stroke-width="19" stroke-linecap="round"/>'
            '<path d="M-145 -45 Q-145 -62 -125 -62 L125 -62 Q145 -62 145 -45 '
            'L128 174 Q0 202 -128 174 Z" '
            f'fill="url(#{gradient})" stroke="{ink}" stroke-width="7" stroke-linejoin="round"/>'
            f'<path d="M-104 -24 L104 -24 L91 137 L-91 137 Z" fill="none" stroke="{accent}" stroke-width="5" opacity=".8"/>'
            f'<path d="M-36 18 L36 18 L36 75 L-36 75 Z" fill="{accent}" opacity=".9"/>'
            '<circle cx="0" cy="47" r="7" fill="#F2EDE4"/>'
        )
        if variation % 2:
            body += '<path d="M-125 120 Q0 148 125 120" fill="none" stroke="#F2EDE4" stroke-width="7" opacity=".6"/>'
    elif kind == "wallet":
        body = (
            '<rect x="-150" y="-112" width="300" height="224" rx="22" '
            f'fill="url(#{gradient})" stroke="{ink}" stroke-width="7"/>'
            f'<path d="M-130 -52 Q0 -25 130 -52 L130 94 L-130 94 Z" fill="{accent}" opacity=".52"/>'
            '<path d="M-126 -42 Q0 -14 126 -42" fill="none" stroke="#F2EDE4" stroke-width="6"/>'
            '<rect x="-53" y="-15" width="106" height="65" rx="11" fill="none" stroke="#F2EDE4" stroke-width="6"/>'
            '<circle cx="0" cy="18" r="7" fill="#F2EDE4"/>'
        )
    elif kind == "cap":
        body = (
            '<path d="M-125 32 Q-125 -130 0 -145 Q125 -130 125 32 Z" '
            f'fill="url(#{gradient})" stroke="{ink}" stroke-width="7"/>'
            '<path d="M-125 20 Q0 -8 126 20 Q170 88 52 97 Q-38 93 -125 20 Z" '
            f'fill="{accent}" stroke="{ink}" stroke-width="7"/>'
            '<path d="M0 -138 L0 -12 M-82 -88 Q0 -30 82 -88" fill="none" stroke="#F2EDE4" stroke-width="6" opacity=".7"/>'
            '<circle cx="0" cy="-116" r="8" fill="#F2EDE4"/>'
        )
    elif kind == "socks":
        body = (
            '<path d="M-112 -168 L-22 -168 L-22 62 Q-22 108 -75 111 '
            'L-150 111 Q-170 111 -166 83 L-142 40 L-112 22 Z" '
            f'fill="url(#{gradient})" stroke="{ink}" stroke-width="7" stroke-linejoin="round"/>'
            '<path d="M28 -168 L118 -168 L118 34 Q118 83 163 95 Q187 108 164 130 '
            'L72 140 Q22 134 28 91 Z" '
            f'fill="url(#{gradient})" stroke="{ink}" stroke-width="7" stroke-linejoin="round"/>'
            f'<path d="M-112 -126 L-22 -126 M28 -126 L118 -126" stroke="{accent}" stroke-width="13"/>'
            '<path d="M-146 75 L-82 75 M90 102 L158 102" stroke="#F2EDE4" stroke-width="6"/>'
        )
    else:  # jewellery and finishing accessories
        body = (
            '<path d="M-150 -110 Q0 155 150 -110" fill="none" stroke="#B48A57" stroke-width="15" stroke-linecap="round"/>'
            '<path d="M-122 -83 Q0 134 122 -83" fill="none" stroke="#E7D0A0" stroke-width="8"/>'
            f'<path d="M0 64 L-34 105 L0 151 L34 105 Z" fill="{accent}" stroke="{ink}" stroke-width="6"/>'
            '<circle cx="0" cy="105" r="12" fill="#F8EBCB"/>'
            '<circle cx="-130" cy="-72" r="13" fill="#E7D0A0"/><circle cx="130" cy="-72" r="13" fill="#E7D0A0"/>'
        )

    pattern_lines = []
    if variation == 0:
        pattern_lines = [
            '<path d="M-190 -110 L190 -110 M-190 -65 L190 -65 M-190 -20 L190 -20 M-190 25 L190 25 M-190 70 L190 70 M-190 115 L190 115" stroke="#FFFFFF" stroke-width="7" opacity=".15"/>'
        ]
    elif variation == 1:
        pattern_lines = [
            "".join(f'<circle cx="{x}" cy="{y}" r="5" fill="#FFFFFF" opacity=".22"/>' for x in (-65, 0, 65) for y in (-90, -25, 40, 105))
        ]
    elif variation == 2:
        pattern_lines = [
            '<path d="M-190 -130 L190 60 M-190 -65 L190 125 M-190 0 L120 155" stroke="#FFFFFF" stroke-width="8" opacity=".13"/>'
        ]

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800">
<defs>
  <linearGradient id="{back_gradient}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{bg1}"/><stop offset="1" stop-color="{bg2}"/></linearGradient>
  <linearGradient id="{gradient}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{cloth}"/><stop offset=".55" stop-color="{accent}"/><stop offset="1" stop-color="{cloth}"/></linearGradient>
  <filter id="{shadow}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="15"/></filter>
  <pattern id="{pattern}" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M0 22L22 0" stroke="#fff" stroke-width="2" opacity=".16"/></pattern>
</defs>
<rect width="640" height="800" fill="url(#{back_gradient})"/>
<circle cx="{rng.randint(80, 180)}" cy="{rng.randint(170, 290)}" r="{rng.randint(95, 140)}" fill="#fff" opacity=".17"/>
<circle cx="{rng.randint(470, 560)}" cy="{rng.randint(440, 570)}" r="{rng.randint(100, 150)}" fill="{accent}" opacity=".12"/>
<path d="M0 620 Q170 570 320 630 T640 610 L640 800 L0 800Z" fill="#fff" opacity=".19"/>
<path d="M52 94 H588" stroke="{ink}" stroke-width="2" opacity=".14"/>
<text x="54" y="70" font-size="15" font-family="Arial,sans-serif" font-weight="700" letter-spacing="4" fill="{ink}" opacity=".62">FORME  /  STYLE {index + 1:02d}</text>
<ellipse cx="320" cy="612" rx="165" ry="31" fill="#465047" opacity=".17" filter="url(#{shadow})"/>
<g transform="translate(320 400) rotate({rotation}) scale({scale})">
{body}
<g opacity=".85">{''.join(pattern_lines)}</g>
</g>
<path d="M54 684 H586" stroke="{ink}" stroke-width="2" opacity=".15"/>
<text x="54" y="725" font-size="13" font-family="Arial,sans-serif" font-weight="700" letter-spacing="3" fill="{ink}" opacity=".55">THE EVERYDAY COLLECTION</text>
<text x="586" y="725" text-anchor="end" font-size="12" font-family="Arial,sans-serif" letter-spacing="2" fill="{ink}" opacity=".5"> {sid[:6].upper()} </text>
</svg>'''
    encoded = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    return "data:image/svg+xml;base64," + encoded


def gallery_html(node, department, parts, ancestors):
    title = node["title"]
    key = page_url(department, parts)
    images = []
    for index in range(6):
        kind = image_kind(department, node, ancestors, index)
        src = svg_image_data(key, title, kind, index)
        alt = f"{title} original fashion illustration {index + 1}"
        images.append(
            f'<figure class="visual-card"><div class="visual-image-wrap">'
            f'<img class="gallery-image" src="{src}" alt="{esc(alt)}" loading="lazy" decoding="async" data-fallback="visual-image-missing" onerror="this.hidden=true;this.parentElement.classList.add(this.dataset.fallback)">'
            f'<span class="visual-number">{index + 1:02d}</span></div>'
            f'<figcaption><strong>{esc(title)} · Style {index + 1:02d}</strong>'
            f'<span>Original visual concept</span></figcaption></figure>'
        )
    return (
        '<section class="visual-gallery">'
        '<div class="section-heading"><div><span class="eyebrow">FORME visual edit</span>'
        f'<h2>Explore the {esc(title)} styles</h2></div>'
        '<span class="count-label">6 unique visuals</span></div>'
        f'<div class="visual-grid">{"".join(images)}</div></section>'
    )


def card_html(child, department, parts):
    child_parts = parts + [child["slug"]]
    child_url = page_url(department, child_parts)
    kind = node_kind(child)
    count = count_descendants(child)
    summary = child.get("description", "")
    return (
        f'<a class="category-card" href="{child_url}">'
        f'<span class="card-kind">{esc(kind)}</span>'
        f'<strong>{esc(child["title"])}</strong>'
        f'<span class="card-summary">{esc(summary)}</span>'
        f'<span class="card-count">{count} further option{"s" if count != 1 else ""}</span>'
        '<span class="card-arrow" aria-hidden="true">↗</span>'
        '</a>'
    )


def build_page(node, department, parts, ancestors, siblings, is_department=False):
    current_url = page_url(department, parts)
    title = node["title"]
    kind = node_kind(node, is_department=is_department)
    children = node_children(node)
    descendants = count_descendants(node)

    crumbs = [f'<a href="{BASE}">Home</a>']
    for ancestor_title, ancestor_url in ancestors:
        crumbs.append(f'<a href="{ancestor_url}">{esc(ancestor_title)}</a>')
    crumbs.append(f'<span aria-current="page">{esc(title)}</span>')
    breadcrumb = '<nav class="breadcrumbs" aria-label="Breadcrumb">' + '<span> / </span>'.join(crumbs) + '</nav>'

    parent_url = page_url(department, parts[:-1]) if parts else BASE
    parent_label = ancestors[-1][0] if ancestors else "Home"

    if children:
        cards = "".join(card_html(child, department, parts) for child in children)
        child_section = (
            '<section class="hierarchy-section">'
            f'<div class="section-heading"><div><span class="eyebrow">Browse the structure</span>'
            f'<h2>Explore {esc(title)}</h2></div>'
            f'<span class="count-label">{len(children)} {kind.lower()} options</span></div>'
            f'<div class="category-grid">{cards}</div></section>'
        )
        leaf_note = ""
    else:
        child_section = (
            '<section class="ready-panel"><span class="ready-mark">✓</span>'
            '<div><h2>Category structure completed</h2>'
            '<p>This sub-category page is ready. Verified product names, stock and prices can be added when the real inventory is ready.</p></div>'
            '</section>'
        )
        leaf_note = "This is the most specific level in the current category structure."

    sibling_links = ""
    other_siblings = [item for item in siblings if item["slug"] != node["slug"]]
    if other_siblings:
        sibling_cards = "".join(
            f'<a href="{page_url(department, parts[:-1] + [item["slug"]])}">{esc(item["title"])} <span>↗</span></a>'
            for item in other_siblings
        )
        sibling_links = (
            '<section class="sibling-section"><span class="eyebrow">Continue exploring</span>'
            f'<div class="sibling-links">{sibling_cards}</div></section>'
        )

    parent_label_html = (
        f'<a class="back-link" href="{parent_url}">← Back to {esc(parent_label)}</a>'
    )
    description = node.get("description", f"Explore the {title} category at FORME.")
    hierarchy_note = (
        f'{len(children)} immediate options · {descendants} total lower-level options'
        if children else leaf_note
    )
    full_title_parts = [department["title"]] + [a[0] for a in ancestors[1:]] + [title]
    unique_title = " / ".join(full_title_parts)
    gallery = gallery_html(node, department, parts, ancestors)

    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#F7F5F0">
<meta name="description" content="{esc(description)}">
<link rel="canonical" href="https://sobujkhamarofficial-ctrl.github.io{current_url}">
<link rel="stylesheet" href="{BASE}collections/collections.css">
<title>{esc(unique_title)} | FORME</title>
</head>
<body>
{nav_html()}
<main class="page-shell">
<div class="page-container">
{breadcrumb}
<section class="page-intro">
<span class="eyebrow">{esc(kind)} · FORME CATEGORY DIRECTORY</span>
<h1>{esc(title)}</h1>
<p>{esc(description)}</p>
<div class="structure-meta">{esc(hierarchy_note)}</div>
</section>
<div class="stage-note"><strong>Six original visuals.</strong> These custom-generated fashion illustrations are unique to this page. Replace them with verified product photos when the real product inventory is ready.</div>
{child_section}
{gallery}
{sibling_links}
{parent_label_html}
</div>
</main>
<footer class="site-footer"><div class="page-container"><a class="site-logo" href="{BASE}">FORME<span>EVERYDAY, REFINED</span></a><p>Original category illustrations · Product photography can be added with verified inventory.</p><a href="{BASE}">Return to FORME home ↗</a></div></footer>
</body>
</html>
'''
    target = ROOT / department["slug"]
    for part in parts:
        target = target / part
    target.mkdir(parents=True, exist_ok=True)
    output = target / "index.html"
    output.write_text(html, encoding="utf-8")
    if html.count('<img class="gallery-image"') != 6:
        raise AssertionError(f"Expected six visuals in {output}")
    if "unsplash.com" in html.lower():
        raise AssertionError(f"Unexpected external stock-image reference in {output}")
    if len(html) < 1200:
        raise AssertionError(f"Generated page is unexpectedly small: {output}")
    return 1


def build_tree(node, department, parts=(), ancestors=None, siblings=None, is_department=False):
    ancestors = ancestors or []
    siblings = siblings or [node]
    written = build_page(node, department, list(parts), ancestors, siblings, is_department)
    children = node_children(node)
    next_ancestors = ancestors + [(node["title"], page_url(department, parts))]
    for child in children:
        written += build_tree(
            child,
            department,
            list(parts) + [child["slug"]],
            next_ancestors,
            children,
            False,
        )
    return written


def main():
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    departments = data["departments"]
    men_data = json.loads((ROOT / "men" / "catalog.json").read_text(encoding="utf-8"))
    global NAVIGATION_HTML
    NAVIGATION_HTML = build_nav_html(departments, men_data["categories"])
    if len(departments) != 5:
        raise AssertionError(f"Expected 5 departments, found {len(departments)}")

    total_pages = total_groups = total_categories = total_subcategories = total_nested = 0
    seen_departments = set()
    for department in departments:
        if department["slug"] in seen_departments or department["slug"] == "men":
            raise AssertionError(f"Duplicate or reserved department slug: {department['slug']}")
        seen_departments.add(department["slug"])
        groups = department["groups"]
        if not groups:
            raise AssertionError(f"No groups under {department['title']}")
        total_groups += len(groups)
        for group in groups:
            if not group["categories"]:
                raise AssertionError(f"No categories under {department['title']} / {group['title']}")
            total_categories += len(group["categories"])
            for category in group["categories"]:
                if not category["subcategories"]:
                    raise AssertionError(f"No sub-categories under {category['title']}")
                total_subcategories += len(category["subcategories"])
                for subcategory in category["subcategories"]:
                    nested_options = subcategory.get("subcategories", [])
                    if len(nested_options) != 4:
                        raise AssertionError(
                            f"Expected 4 nested options under {subcategory['title']}, "
                            f"found {len(nested_options)}"
                        )
                    total_nested += len(nested_options)
        total_pages += build_tree(department, department, is_department=True)

    expected = (
        len(departments) + total_groups + total_categories
        + total_subcategories + total_nested
    )
    if total_pages != expected:
        raise AssertionError(f"Page count mismatch: generated {total_pages}, expected {expected}")
    total_images = total_pages * 6
    print(
        f"Generated {total_pages} unique pages with {total_images} original visuals "
        f"({len(departments)} departments, {total_groups} collections, "
        f"{total_categories} categories, {total_subcategories} sub-categories "
        f"and {total_nested} nested sub-categories)."
    )


if __name__ == "__main__":
    main()
