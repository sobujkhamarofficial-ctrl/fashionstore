(function () {
  "use strict";
  const BASE = "/fashionstore/";
  function productDetails(button) {
    const card = button.closest(".visual-card, .form-product-card, .f-static-product, .f-product") || button.parentElement;
    const image = card && card.querySelector("img");
    const nameNode = card && card.querySelector(".form-product-copy strong, .f-product-name, strong");
    return {
      name: String(button.dataset.productName || (nameNode && nameNode.textContent) || "").trim(),
      category: String(button.dataset.productCategory || document.querySelector("h1")?.textContent || "FORME catalogue").trim(),
      image: String(button.dataset.imageUrl || (image && (image.getAttribute("src") || image.src)) || "").trim(),
      source: String(button.dataset.sourcePath || window.location.pathname).trim()
    };
  }
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-catalogue-order]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const item = productDetails(button);
    if (!item.name || !item.image || !item.source.startsWith(BASE)) {
      window.alert("এই পণ্যের অর্ডার তথ্য সম্পূর্ণ নয়। অনুগ্রহ করে FORME টিমের সঙ্গে যোগাযোগ করুন।");
      return;
    }
    const params = new URLSearchParams({name:item.name,category:item.category,image:item.image,source:item.source});
    window.location.assign(BASE + "pages/catalogue-order.html?" + params.toString());
  });
  const observer = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (!node || node.nodeType !== 1) continue;
      const cards = node.matches?.(".form-product-card") ? [node] : Array.from(node.querySelectorAll?.(".form-product-card") || []);
      cards.forEach(card => {
        if (card.querySelector("[data-catalogue-order]")) return;
        const image = card.querySelector("img"), name = card.querySelector(".form-product-copy strong");
        if (!image || !name) return;
        const button = document.createElement("button");
        button.type = "button"; button.className = "visual-order-button"; button.textContent = "অর্ডার নাও";
        button.dataset.catalogueOrder = ""; button.dataset.productName = name.textContent.trim();
        button.dataset.productCategory = document.querySelector("h1")?.textContent.trim() || "FORME catalogue";
        button.dataset.imageUrl = image.getAttribute("src") || image.src;
        button.dataset.sourcePath = window.location.pathname;
        card.querySelector(".form-product-copy")?.append(button);
      });
    }
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();