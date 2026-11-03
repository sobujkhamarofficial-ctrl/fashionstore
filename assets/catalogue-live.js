(function () {
  "use strict";
  const API = "https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api";
  const KEY = "sb_publishable_EWY6B3OF8lOQB7uB7jBZRA_3MwimKRy";
  const money = value => "৳" + Number(value || 0).toLocaleString("en-BD");
  let catalogue = null;

  function noteFor(product) {
    const status = String(product.availability_status || "needs_confirmation");
    if (!product.is_active || status === "archived") return "This item is not currently listed.";
    if (status === "out_of_stock") return "Currently out of stock.";
    if (status === "preorder") return "Available for preorder; timing will be confirmed.";
    if (!product.details_verified) return "Stock, size and final price will be confirmed before dispatch.";
    return status === "in_stock" ? "Verified product · In stock." : "Availability will be confirmed before dispatch.";
  }

  function setNote(card, product, text) {
    const info = card.querySelector(".f-product-info");
    if (!info) return;
    let note = info.querySelector("[data-live-product-note]");
    if (!note) {
      note = document.createElement("span");
      note.className = "f-live-product-note";
      note.dataset.liveProductNote = "";
      info.appendChild(note);
    }
    note.textContent = text || noteFor(product);
  }

  function syncCard(card) {
    const id = String(card.dataset.id || "");
    if (!id || !card.querySelector("[data-f-add], [data-f-buy-now]")) return;
    const product = catalogue && catalogue.get(id);
    if (!product) {
      card.querySelectorAll("[data-f-add], [data-f-buy-now]").forEach(button => {
        button.disabled = true;
        button.title = "This product is not present in the live catalogue.";
      });
      setNote(card, {}, "Live product details could not be matched. Please contact FORME.");
      return;
    }

    const status = String(product.availability_status || "needs_confirmation");
    const active = product.is_active === true && status !== "archived";
    card.hidden = !active;
    if (!active) return;

    const price = Number(product.price_bdt || 0);
    card.dataset.name = String(product.name || "");
    card.dataset.price = String(price);
    card.dataset.image = String(product.image_url || "");
    card.dataset.category = String(product.category || "");
    card.dataset.availability = status;
    card.dataset.detailsVerified = String(product.details_verified === true);

    const name = card.querySelector(".f-product-name");
    if (name) name.textContent = String(product.name || "FORME product");

    const description = card.querySelector(".f-men-savings, .f-product-meta");
    if (description && product.description) description.textContent = String(product.description);

    const image = card.querySelector(".f-product-photo img, img");
    if (image && product.image_url) {
      image.setAttribute("src", String(product.image_url));
      image.setAttribute("alt", String(product.name || "FORME product"));
    }

    card.querySelectorAll(".f-price, .f-men-price-row strong").forEach(node => {
      node.textContent = price > 0 ? money(price) : "Price to be confirmed";
    });

    const tag = card.querySelector(".f-product-tag");
    if (tag) {
      if (status === "out_of_stock") tag.textContent = "Out of stock";
      else if (status === "preorder") tag.textContent = "Pre-order";
      else if (product.details_verified === true && status === "in_stock") tag.textContent = "In stock";
      else tag.textContent = "Confirm availability";
    }

    const unavailable = status === "out_of_stock" || price <= 0;
    card.querySelectorAll("[data-f-add], [data-f-buy-now]").forEach(button => {
      button.disabled = unavailable;
      button.title = unavailable
        ? (status === "out_of_stock" ? "This item is currently out of stock." : "The listed price must be confirmed first.")
        : "Send a cash-on-delivery order request.";
    });
    setNote(card, product);
  }

  function syncAll(root) {
    const scope = root && root.querySelectorAll ? root : document;
    if (scope.matches && scope.matches(".f-product[data-id], .f-static-product[data-id]")) syncCard(scope);
    scope.querySelectorAll(".f-product[data-id], .f-static-product[data-id]").forEach(syncCard);
  }

  function lockCards(message) {
    document.querySelectorAll(".f-product[data-id], .f-static-product[data-id]").forEach(card => {
      const buttons = card.querySelectorAll("[data-f-add], [data-f-buy-now]");
      if (!buttons.length) return;
      const hasSafeLocalDetails = Boolean(card.dataset.id && card.dataset.name && Number(card.dataset.price) > 0);
      buttons.forEach(button => {
        button.disabled = !hasSafeLocalDetails;
        button.title = hasSafeLocalDetails
          ? "Live details are temporarily unavailable. The server will re-check this item at checkout."
          : "Product details are not available yet.";
      });
      setNote(card, {}, message || "Could not reach the live catalogue. You can save this item to your bag; the server will verify it again at checkout.");
    });
  }

  async function load() {
    document.querySelectorAll(".f-product[data-id], .f-static-product[data-id]").forEach(card => {
      if (card.querySelector("[data-f-add], [data-f-buy-now]")) setNote(card, {}, "Checking the latest price and availability…");
    });
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      let response;
      try {
        response = await fetch(API + "?action=products", {
          method: "GET",
          cache: "no-store",
          headers: { "apikey": KEY, "Accept": "application/json" },
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeout);
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok || !Array.isArray(payload.products)) {
        throw new Error(payload.error || "Catalogue unavailable");
      }
      catalogue = new Map(payload.products.map(product => [String(product.id), product]));
      syncAll(document);
    } catch (_) {
      lockCards();
    }
  }

  const observer = new MutationObserver(records => {
    if (!catalogue) return;
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node && node.nodeType === 1) syncAll(node);
    }));
  });
  observer.observe(document.body, { childList: true, subtree: true });
  void load();
})();