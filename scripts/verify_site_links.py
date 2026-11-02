#!/usr/bin/env python3
"""Check generated local links, pages and assets before publishing."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import re

ROOT = Path(__file__).resolve().parents[1]
BASE = "/fashionstore/"
EXTERNAL = ("http:", "https:", "mailto:", "tel:", "javascript:", "data:")

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.targets = []
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        for name in ("href", "src", "poster"):
            value = values.get(name)
            if value:
                self.targets.append((name, value.strip()))

def resolve(path, source):
    if not path:
        return source
    if path.startswith(BASE):
        target = ROOT / path[len(BASE):]
    elif path.startswith("/"):
        return None
    else:
        target = (source.parent / path).resolve()
    try:
        target.relative_to(ROOT)
    except ValueError:
        return None
    if target.is_dir() or not target.suffix:
        target = target / "index.html"
    return target

def main():
    failures = []
    pages = list(ROOT.rglob("*.html"))
    for source in pages:
        parser = Parser()
        try:
            parser.feed(source.read_text(encoding="utf-8"))
        except (OSError, UnicodeError) as error:
            failures.append(f"{source.relative_to(ROOT)}: {error}")
            continue
        for attr, raw in parser.targets:
            value = raw.strip()
            if not value or value.startswith("#") or value.startswith(EXTERNAL):
                continue
            parts = urlsplit(value)
            if parts.scheme or parts.netloc:
                continue
            target = resolve(unquote(parts.path), source)
            if target is None:
                failures.append(f"{source.relative_to(ROOT)}: invalid local link {attr}={value}")
            elif not target.is_file():
                failures.append(f"{source.relative_to(ROOT)}: missing {attr}={value}")
    for css in ROOT.rglob("*.css"):
        content = css.read_text(encoding="utf-8")
        for raw in re.findall(r"url\(([^)]+)\)", content):
            value = raw.strip().strip("\"' ")
            if not value or value.startswith(EXTERNAL) or value.startswith("#"):
                continue
            parts = urlsplit(value)
            if parts.scheme or parts.netloc:
                continue
            target = resolve(unquote(parts.path), css)
            if target is None or not target.is_file():
                failures.append(f"{css.relative_to(ROOT)}: missing CSS asset {value}")
    if failures:
        raise SystemExit("\n".join(failures[:200]) + f"\nTotal broken links/assets: {len(failures)}")
    print(f"Verified {len(pages)} generated HTML pages and all local page/asset links.")

if __name__ == "__main__":
    main()
