(function () {
  "use strict";
  const PHOTO_BASE = "/fashionstore/assets/fashion-photos/";
  function hintText(image) {
    const parts = [
      image.alt || "",
      image.dataset.fallbackKind || "",
      image.closest("[data-category]")?.dataset.category || "",
      image.closest("[data-department]")?.dataset.department || "",
      image.closest("[data-image-kind]")?.dataset.imageKind || "",
      image.closest(".f-product")?.dataset.category || "",
      image.parentElement?.className || ""
    ];
    return parts.join(" ").toLowerCase();
  }
  function kindFor(image) {
    const hint = hintText(image);
    if (/handbag|tote|crossbody|shoulder bag|backpack|purse|bag/.test(hint)) return "bag";
    if (/wallet|card.?holder|pouch/.test(hint)) return "wallet";
    if (/cap|hat|beanie/.test(hint)) return "cap";
    if (/sock/.test(hint)) return "socks";
    if (/belt/.test(hint)) return "belt";
    if (/shoe|sneaker|trainer|sandal|boot/.test(hint)) return "shoes";
    if (/jewellery|jewelry|watch|sunglasses|accessories/.test(hint)) return "jewelry";
    if (/kids|kid's|baby|toddler|child|teen/.test(hint)) return "kids";
    if (/sports|football|cricket|basketball|gym|activewear/.test(hint)) return "sports";
    if (/dress|frock|saree|salwar|kameez|kurti|dupatta|jumpsuit|co-ord/.test(hint)) return "dress";
    if (/jeans|trouser|pants|jogger|leggings|shorts|skirt/.test(hint)) return "bottoms";
    if (/hoodie|jacket|sweater|cardigan|sweatshirt|winter|coat|outerwear|shrug/.test(hint)) return "outerwear";
    if (/shirt|t-shirt|tee|polo|blouse|top|panjabi/.test(hint)) return "top";
    return "editorial";
  }
  function hostFor(image) {
    return image.closest(".f-category,.f-type-thumb,.f-product-photo,.f-campaign-image,.visual-image-wrap,.category-card,.j-card,figure") || image.parentElement;
  }
  function finish(image) {
    image.hidden = true;
    const host = hostFor(image);
    if (host) host.classList.add("forme-image-fallback");
    image.removeAttribute("src");
  }
  function recover(image) {
    if (!(image instanceof HTMLImageElement)) return;
    if (image.dataset.formeFallbackAttempted === "1") {
      finish(image);
      return;
    }
    image.dataset.formeFallbackAttempted = "1";
    const kind = kindFor(image);
    let fallback = PHOTO_BASE + kind + "-01.jpg";
    try {
      const current = new URL(image.currentSrc || image.src, document.baseURI).pathname;
      if (current === fallback) fallback = PHOTO_BASE + kind + "-02.jpg";
    } catch (_) {}
    image.hidden = false;
    image.removeAttribute("onerror");
    image.onerror = null;
    const host = hostFor(image);
    if (host) {
      host.classList.remove("forme-image-fallback");
      host.classList.add("forme-image-recovered");
    }
    image.src = fallback;
  }
  function prepare(root) {
    if (!root) return;
    const images = [];
    if (root instanceof HTMLImageElement) images.push(root);
    if (root.querySelectorAll) root.querySelectorAll("img").forEach(node => images.push(node));
    images.forEach(image => {
      if (image.dataset.formeImageReady === "1") return;
      image.dataset.formeImageReady = "1";
      image.removeAttribute("onerror");
      image.onerror = null;
      if (image.complete && image.currentSrc && image.naturalWidth === 0) recover(image);
    });
  }
  document.addEventListener("error", event => {
    if (event.target instanceof HTMLImageElement) recover(event.target);
  }, true);
  prepare(document);
  const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (node instanceof Element) prepare(node);
  })));
  observer.observe(document.documentElement, {childList:true,subtree:true});
})();