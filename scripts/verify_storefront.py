#!/usr/bin/env python3
"""Validate local navigation and image references across every generated FORME page."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = "/fashionstore/"

class References(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
        self.images = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in {"a", "link", "script"}:
            key = "href" if tag in {"a", "link"} else "src"
            value = attrs.get(key)
            if value:
                self.links.append(value)
        if tag in {"img", "source"}:
            value = attrs.get("src")
            if value:
                self.images.append(value)

def local_path(url):
    parsed = urlsplit(url)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return None
    path = unquote(parsed.path)
    if not path.startswith(BASE):
        return None
    relative = path[len(BASE):]
    target = ROOT / relative
    if target.is_dir():
        target = target / "index.html"
    if not target.suffix and not target.exists():
        target = target / "index.html"
    return target

home = (ROOT / "index.html").read_text(encoding="utf-8")
if "1,362" in home or "1362" in home:
    raise SystemExit("Homepage still contains an obsolete Men product total.")
if "buildMenCategoryFilters" not in home:
    raise SystemExit("Homepage Men filters are not generated from the catalogue.")
if "Showing 23 sample products from 1,362" in home:
    raise SystemExit("Homepage contains an obsolete Men result summary.")

html_files = sorted(p for p in ROOT.rglob("*.html") if ".git" not in p.parts)
missing_links = []
missing_images = []
checked_links = checked_images = 0
for page in html_files:
    parser = References()
    parser.feed(page.read_text(encoding="utf-8"))
    for ref in parser.links:
        target = local_path(ref)
        if target is None:
            continue
        checked_links += 1
        if not target.is_file():
            missing_links.append((page.relative_to(ROOT).as_posix(), ref))
    for ref in parser.images:
        target = local_path(ref)
        if target is None:
            continue
        checked_images += 1
        if not target.is_file():
            missing_images.append((page.relative_to(ROOT).as_posix(), ref))

if missing_links or missing_images:
    for page, ref in missing_links:
        print(f"BROKEN LINK: {page} -> {ref}")
    for page, ref in missing_images:
        print(f"MISSING IMAGE: {page} -> {ref}")
    sys.exit(1)

print(f"Verified {len(html_files)} HTML pages, {checked_links} local links and {checked_images} local image/script references.")
