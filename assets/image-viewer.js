(function () {
  "use strict";
  const selector = ".f-product-photo img, .gallery-image, .visual-card img, .form-product-card img, .f-static-product img, .f-product img";
  let images = [], current = 0, returnFocus = null, modal = null, imageNode, captionNode, countNode, previous, next;
  function eligible(node) {
    return node instanceof HTMLImageElement && !node.closest("a,button,[data-catalogue-order]") &&
      node.isConnected && node.getAttribute("src") && !node.closest("[hidden]");
  }
  function enhance(root) {
    if (!root || !(root instanceof Element || root instanceof Document)) return;
    const found = [];
    if (root instanceof Element && root.matches(selector)) found.push(root);
    root.querySelectorAll(selector).forEach(node => found.push(node));
    found.forEach(node => {
      if (!eligible(node) || node.dataset.formeViewerReady === "1") return;
      node.dataset.formeViewerReady = "1";
      node.classList.add("forme-image-zoom");
      node.tabIndex = 0;
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", "View larger image: " + (node.alt || "Product photo"));
    });
  }
  function collectionFor(node) {
    const group = node.closest("#f-men-grid, .f-static-product-grid, .visual-grid, .visual-gallery, .gallery-grid, .f-product-grid, .f-category-grid");
    if (!group) return [node];
    const list = Array.from(group.querySelectorAll(selector)).filter(eligible);
    return list.length ? list : [node];
  }
  function ensureModal() {
    if (modal) return;
    modal = document.createElement("div");
    modal.id = "forme-image-viewer";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Product image viewer");
    modal.innerHTML = '<div class="fiv-toolbar"><span class="fiv-caption"></span><button class="fiv-close" type="button" aria-label="Close image viewer">×</button></div><div class="fiv-stage"><button class="fiv-nav fiv-prev" type="button" aria-label="Previous image">‹</button><img class="fiv-image" alt=""><button class="fiv-nav fiv-next" type="button" aria-label="Next image">›</button></div><div class="fiv-count" aria-live="polite"></div>';
    document.body.append(modal);
    imageNode = modal.querySelector(".fiv-image");
    captionNode = modal.querySelector(".fiv-caption");
    countNode = modal.querySelector(".fiv-count");
    previous = modal.querySelector(".fiv-prev");
    next = modal.querySelector(".fiv-next");
    modal.addEventListener("click", event => {
      if (event.target === modal || event.target.closest(".fiv-close")) close();
    });
    previous.addEventListener("click", () => show(current - 1));
    next.addEventListener("click", () => show(current + 1));
  }
  function show(index) {
    if (!images.length) return;
    current = (index + images.length) % images.length;
    const selected = images[current];
    imageNode.src = selected.currentSrc || selected.src;
    imageNode.alt = selected.alt || "FORME product image";
    captionNode.textContent = selected.alt || "FORME collection";
    countNode.textContent = (current + 1) + " / " + images.length;
    previous.disabled = images.length < 2;
    next.disabled = images.length < 2;
  }
  function open(node) {
    if (!eligible(node)) return;
    ensureModal();
    returnFocus = node;
    images = collectionFor(node);
    current = Math.max(0, images.indexOf(node));
    show(current);
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    modal.querySelector(".fiv-close").focus();
  }
  function close() {
    if (!modal || !modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    imageNode.removeAttribute("src");
    if (returnFocus && returnFocus.isConnected) returnFocus.focus();
    returnFocus = null;
  }
  document.addEventListener("click", event => {
    const node = event.target.closest(selector);
    if (node && node.dataset.formeViewerReady === "1") { event.preventDefault(); open(node); }
  });
  document.addEventListener("keydown", event => {
    if (!modal || !modal.classList.contains("is-open")) return;
    if (event.key === "Escape") { event.preventDefault(); close(); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); show(current - 1); }
    else if (event.key === "ArrowRight") { event.preventDefault(); show(current + 1); }
  });
  document.addEventListener("DOMContentLoaded", () => enhance(document));
  enhance(document);
  const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (node instanceof Element) enhance(node);
  })));
  observer.observe(document.documentElement, { childList:true, subtree:true });
})();