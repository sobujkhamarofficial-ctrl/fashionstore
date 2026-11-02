#!/usr/bin/env python3
"""Generate multi-level FORME category pages with six unique original illustrations per page."""
from html import escape
import json
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
    if any(x in words for x in ("backpack", "handbag", "tote", "crossbody", "shoulder bag", "pouch", "bag")): return "bag"
    if any(x in words for x in ("wallet", "card holder", "card-holder", "key case")): return "wallet"
    if any(x in words for x in ("cap", "hat", "beanie", "headwear")): return "cap"
    if any(x in words for x in ("sock", "multipack")): return "socks"
    if any(x in words for x in ("belt", "waist belt")): return "belt"
    if any(x in words for x in ("shoe", "sneaker", "trainer", "boot", "footwear", "sandal")): return "shoes"
    if any(x in words for x in ("jewellery", "jewelry", "earring", "necklace", "bracelet", "watch", "sunglasses", "hair accessory", "keyring")): return "jewelry"
    if department["slug"] == "kids": return "kids"
    if department["slug"] == "sports" or any(x in words for x in ("sports", "activewear", "athletic", "jersey", "football", "cricket", "basketball", "gym wear")): return "sports"
    if any(x in words for x in ("jeans", "trouser", "pants", "jogger", "legging", "shorts", "skirt")): return "bottoms"
    if any(x in words for x in ("dress", "frock", "saree", "salwar", "kameez", "kurti", "dupatta", "jumpsuit", "romper")): return "dress"
    if any(x in words for x in ("hoodie", "jacket", "sweater", "cardigan", "sweatshirt", "windbreaker", "outerwear", "shrug", "coat")): return "outerwear"
    if any(x in words for x in ("shirt", "t-shirt", "tee", "polo", "blouse", "top", "tank", "bodysuit")): return "top"
    cycle = ["top", "dress", "bottoms", "outerwear", "bag", "jewelry"]
    offset = sum(ord(ch) for ch in department["slug"] + node["title"]) % len(cycle)
    return cycle[(offset + index) % len(cycle)]


def gallery_photo_path(kind, index):
    return f"{BASE}assets/fashion-photos/{kind}-{index + 1:02d}.jpg"


def gallery_html(node, department, parts, ancestors):
    title = node["title"]
    images = []
    for index in range(6):
        kind = image_kind(department, node, ancestors, index)
        src = gallery_photo_path(kind, index)
        alt = f"{title} fashion photograph {index + 1}"
        images.append(
            f'<figure class="visual-card"><div class="visual-image-wrap">'
            f'<img class="gallery-image" src="{src}" alt="{esc(alt)}" loading="lazy" decoding="async" data-fallback="visual-image-missing" onerror="this.hidden=true;this.parentElement.classList.add(this.dataset.fallback)">'
            f'<span class="visual-number">{index + 1:02d}</span></div>'
            f'<figcaption><strong>{esc(title)} · Look {index + 1:02d}</strong>'
            f'<span>Fashion photography</span></figcaption></figure>'
        )
    return (
        '<section class="visual-gallery">'
        '<div class="section-heading"><div><span class="eyebrow">FORME photo edit</span>'
        f'<h2>Explore the {esc(title)} styles</h2></div>'
        '<span class="count-label">6 real photographs</span></div>'
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
<link rel="stylesheet" href="{BASE}assets/customer-care.css">
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
<div class="stage-note"><strong>Collection inspiration gallery.</strong> These category pages help you explore styles. Individual product listings, verified prices, sizes and stock are being added separately; gallery images are not an offer to sell a specific item.</div>
{child_section}
{gallery}
{sibling_links}
{parent_label_html}
</div>
</main>
<footer class="site-footer"><div class="page-container"><a class="site-logo" href="{BASE}">FORME<span>EVERYDAY, REFINED</span></a><p>Curated fashion photography · Explore the FORME catalogue.</p><a href="{BASE}blog/">Journal</a> · <a href="{BASE}pages/shipping-delivery.html">Shipping</a> · <a href="{BASE}pages/returns-refunds.html">Returns</a> · <a href="{BASE}pages/reviews.html">Reviews</a> · <a href="{BASE}pages/order-tracking.html">Track order</a> · <a href="{BASE}pages/privacy.html">Privacy</a> · <a href="{BASE}pages/terms.html">Terms</a> · <a href="{BASE}pages/contact.html">Contact</a><p><a href="{BASE}">Return to FORME home ↗</a></p></div></footer>
<script src="{BASE}assets/customer-care.js" defer></script>
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
