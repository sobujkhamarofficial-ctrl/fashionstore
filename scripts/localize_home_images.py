#!/usr/bin/env python3
"""Replace homepage Unsplash links with bundled catalogue/editorial files."""
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
HOME = ROOT / "index.html"
MAP = ROOT / "assets" / "fashion-photos" / "product-image-map.json"

def main():
    mapping = json.loads(MAP.read_text(encoding="utf-8"))
    editorial = {
        "photo-1529139574466-a303027c1d8b": "/fashionstore/assets/fashion-photos/dress-01.jpg",
        "photo-1515886657613-9f3515b0c78f": "/fashionstore/assets/fashion-photos/dress-02.jpg",
        "photo-1483985988355-763728e1935b": "/fashionstore/assets/fashion-photos/dress-03.jpg",
        "photo-1617137968427-85924c800a22": "/fashionstore/assets/fashion-photos/top-02.jpg",
        "photo-1503919005314-30d93d07d823": "/fashionstore/assets/fashion-photos/kids-01.jpg",
        "photo-1490481651871-ab68de25d43d": "/fashionstore/assets/fashion-photos/bag-01.jpg",
        "photo-1556821840-3a63f95609a7": "/fashionstore/assets/fashion-photos/outerwear-01.jpg",
        "photo-1578681994506-b8f463449011": "/fashionstore/assets/fashion-photos/outerwear-02.jpg",
        "photo-1622560480654-d96214fdc887": "/fashionstore/assets/fashion-photos/bag-02.jpg",
    }
    source = HOME.read_text(encoding="utf-8")
    def localize(match):
        url = match.group(0)
        key = urlsplit(url).path.rsplit("/", 1)[-1]
        return mapping.get(key) or editorial.get(key) or url
    source = re.sub(r"https://images\.unsplash\.com/[^\s\"']+", localize, source)
    for path in re.findall(r"/fashionstore/assets/fashion-photos/[^\s\"')]+", source):
        relative = path.split("/fashionstore/", 1)[1]
        if not (ROOT / relative).is_file():
            raise RuntimeError(f"Homepage photo missing from local bundle: {relative}")
    HOME.write_text(source, encoding="utf-8")
    print("Localised homepage product and editorial images.")

if __name__ == "__main__":
    main()
