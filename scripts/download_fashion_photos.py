#!/usr/bin/env python3
"""Download actual fashion photographs into the static FORME website bundle."""
from __future__ import annotations
import json
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
MEN_CATALOG = ROOT / "men" / "catalog.json"
OUTPUT = ROOT / "assets" / "fashion-photos"
IMAGE_WIDTH = 1000

# Unsplash photo IDs; all selected image pages are marked free to use under the Unsplash License.
PHOTO_IDS = {
    "bottoms": [
        "photo-1687276154818-d555a7b337ba", "photo-1626596662792-12cdc7ecce71",
        "photo-1591195853828-11db59a44f6b", "photo-1594633312681-425c7b97ccd1",
        "photo-1542272604-787c3835535d", "photo-1624378439575-d8705ad7ae80",
    ],
    "dress": [
        "photo-1651282621540-0c93c8c7e965", "photo-1704627363852-484e95695411",
        "photo-1721094781490-86de5145447c", "photo-1689626237016-f257f6f90bd2",
        "photo-1722585726948-daed92e2c3e0", "photo-1738895006815-4bbfc23dfcc4",
        "photo-1664893876000-9c2c980860fc", "photo-1650922025764-488db4e0e8c7",
        "photo-1595272251257-1bbe120103d5",
    ],
    "bag": [
        "photo-1681037716806-7d297267edf1", "photo-1567769568058-46bf07221c68",
        "photo-1759717760080-6659d0b34e27", "photo-1647412983527-5aa4b12febe8",
        "photo-1597374399395-f61fe1509e0e", "photo-1770017863938-237bd953a6e6",
        "photo-1524499982521-1ffd58dd89ea", "photo-1553062407-98eeb64c6a62",
    ],
    "jewelry": [
        "photo-1758995115857-2de1eb6283d0", "photo-1778000001290-0b67eeb2fbc2",
        "photo-1669010353994-aca67b0aaa3d", "photo-1680068099049-0263ffbcefd8",
        "photo-1614146424692-384e5fbf4dd4", "photo-1670541481909-0b2c047fb45a",
        "photo-1617038220319-276d3cfab638", "photo-1611652022419-a9419f74343d",
    ],
    "shoes": [
        "photo-1560769629-975ec94e6a86", "photo-1646747859549-56d6c2ee3e6e",
        "photo-1655318955720-7d7bd3808731", "photo-1637437757614-6491c8e915b5",
        "photo-1726317219474-7f8a98b53743", "photo-1669671943625-e20799ee5f42",
        "photo-1542291026-7eec264c27ff", "photo-1495555961986-6d4c1ecb7be3",
    ],
    "sports": [
        "photo-1770026136368-0873a0833a20", "photo-1552902831-bb0e060ac5a2",
        "photo-1726317219474-7f8a98b53743", "photo-1646747859549-56d6c2ee3e6e",
        "photo-1637437757614-6491c8e915b5", "photo-1655318955720-7d7bd3808731",
        "photo-1564557287817-3785e38ec1f5", "photo-1538805060514-97d9cc17730c",
    ],
    "kids": [
        "photo-1601382995116-7401bfe50a1a", "photo-1603508434799-658bd402a35a",
        "photo-1632768745980-e9e72300c28a", "photo-1758851552775-7353c60e4906",
        "photo-1645458455677-9b63212e5c80", "photo-1555850021-9283dd370433",
        "photo-1620905385976-9f191e837efd", "photo-1683155462067-8e5c82e313d7",
        "photo-1602006110179-b0d24017550a", "photo-1758782213532-bbb5fd89885e",
        "photo-1709185726526-64f61e41cb8b",
    ],
}

# Existing Men catalogue photography supplies the matching core clothing and accessory shots.
MEN_CATEGORY_POOLS = {
    "top": ["half-sleeve-t-shirt", "full-sleeve-t-shirt", "polo-t-shirt", "shirt"],
    "bottoms": ["jeans", "comfy-trouser", "joggers", "cargo-pants", "shorts"],
    "outerwear": ["hoodie", "jacket", "sweatshirt"],
    "wallet": ["wallet"],
    "cap": ["cap"],
    "socks": ["socks"],
    "belt": ["belt"],
}
EXPECTED_KINDS = ("top", "bottoms", "outerwear", "wallet", "cap", "socks", "belt", "dress", "bag", "jewelry", "shoes", "sports", "kids")

def unique(items):
    return list(dict.fromkeys(item for item in items if item))

def get_men_photo_pools():
    data = json.loads(MEN_CATALOG.read_text(encoding="utf-8"))
    categories = {item["slug"]: item for item in data.get("categories", [])}
    pools = {}
    for kind, slugs in MEN_CATEGORY_POOLS.items():
        photos = []
        for slug in slugs:
            if slug not in categories:
                raise RuntimeError(f"Missing Men photo source category: {slug}")
            photos.extend(product.get("image", "") for product in categories[slug].get("products", []))
        pools[kind] = unique(photos)
    return pools

def make_url(source):
    if source.startswith("photo-"):
        source = "https://images.unsplash.com/" + source
    parsed = urlsplit(source)
    if parsed.scheme != "https" or parsed.netloc != "images.unsplash.com":
        raise RuntimeError(f"Unapproved photo source: {source}")
    query = f"auto=format&fit=crop&fm=jpg&q=82&w={IMAGE_WIDTH}"
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, query, ""))

def download_photo(source, destination):
    url = make_url(source)
    request = Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; FORME-Storefront/1.0)", "Accept": "image/jpeg,image/*;q=0.9,*/*;q=0.5"})
    last_error = None
    for attempt in range(1, 4):
        try:
            with urlopen(request, timeout=40) as response:
                payload = response.read(7_000_001)
                content_type = (response.headers.get("Content-Type") or "").lower()
            if len(payload) < 8_000 or len(payload) > 7_000_000:
                raise RuntimeError(f"Unexpected photo size: {len(payload)} bytes")
            if not payload.startswith(b"\xff\xd8\xff") and "jpeg" not in content_type:
                raise RuntimeError(f"Not a JPEG image: {content_type}")
            destination.write_bytes(payload)
            return url
        except (HTTPError, URLError, TimeoutError, RuntimeError, OSError) as error:
            last_error = error
            if attempt < 3:
                time.sleep(attempt * 2)
    raise RuntimeError(f"Unable to download {url}: {last_error}")

def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    pools = {kind: ["https://images.unsplash.com/" + photo_id for photo_id in ids] for kind, ids in PHOTO_IDS.items()}
    for kind, sources in get_men_photo_pools().items():
        pools[kind] = unique(sources + pools.get(kind, []))
    if set(pools) != set(EXPECTED_KINDS):
        raise RuntimeError(f"Photo types mismatch: {sorted(pools)}")
    manifest = ["# FORME fashion photography sources", "", "Real fashion photographs downloaded from Unsplash during the GitHub Pages build.", "Curated photo pages are marked free to use under the Unsplash License.", "Men's core-category photos are sourced from the existing Men product catalogue.", "License: https://unsplash.com/license", "", "Source photo URLs:", ""]
    total = 0
    for kind in EXPECTED_KINDS:
        successful = 0
        tried = set()
        for source in pools[kind]:
            if source in tried:
                continue
            tried.add(source)
            filename = f"{kind}-{successful + 1:02d}.jpg"
            destination = OUTPUT / filename
            try:
                final_url = download_photo(source, destination)
            except Exception as error:
                print(f"WARN: skipped {kind} candidate {source}: {error}")
                continue
            successful += 1
            total += 1
            manifest.append(f"- {filename} — {final_url}")
            print(f"Downloaded {filename} ({destination.stat().st_size:,} bytes)")
            if successful == 6:
                break
        if successful != 6:
            raise RuntimeError(f"Only {successful} valid photos for {kind}; six are required")
    (OUTPUT / "README.md").write_text("\n".join(manifest) + "\n", encoding="utf-8")
    print(f"Downloaded and verified {total} local fashion photographs.")

if __name__ == "__main__":
    main()
