(function () {
  "use strict";
  const API = "https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api";
  const KEY = "sb_publishable_EWY6B3OF8lOQB7uB7jBZRA_3MwimKRy";
  const grid = document.getElementById("fc-shop-grid");
  const status = document.getElementById("fc-shop-status");
  const search = document.getElementById("fc-shop-search");
  const category = document.getElementById("fc-shop-category");
  const sort = document.getElementById("fc-shop-sort");
  if (!grid || !status) return;
  let products = [];
  let photoMap = {};
  const money = value => "৳" + Number(value || 0).toLocaleString("en-BD");
  const escape = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
  function localPhoto(source) {
    try {
      const key = new URL(source, location.origin).pathname.split("/").pop();
      return photoMap[key] || source || "";
    } catch (_) { return source || ""; }
  }
  function render() {
    const q = (search?.value || "").trim().toLowerCase();
    const selectedCategory = category?.value || "";
    let list = products.filter(product =>
      (!selectedCategory || product.category === selectedCategory) &&
      (!q || (product.name + " " + product.category + " " + (product.description || "")).toLowerCase().includes(q))
    );
    if (sort?.value === "price-low") list.sort((a,b)=>Number(a.price_bdt)-Number(b.price_bdt));
    if (sort?.value === "price-high") list.sort((a,b)=>Number(b.price_bdt)-Number(a.price_bdt));
    if (sort?.value === "name") list.sort((a,b)=>a.name.localeCompare(b.name));
    status.textContent = list.length + " catalogue listings · availability and final price require store confirmation.";
    if (!list.length) {
      grid.innerHTML = '<div class="fc-shop-empty">No products match this search. Try another name or category.</div>';
      return;
    }
    grid.innerHTML = list.map(product => {
      const image = localPhoto(product.image_url);
      const imageHtml = image
        ? '<img src="' + escape(image) + '" alt="' + escape(product.name) + '" loading="lazy" decoding="async" onerror="this.hidden=true">'
        : '<div class="fc-shop-no-image" role="img" aria-label="Image not available">FORME</div>';
      const verified = product.details_verified === true;
      const statusLabel = verified && product.availability_status === "in_stock"
        ? "Stock verified"
        : product.availability_status === "preorder" && verified
          ? "Pre-order"
          : "Confirm availability";
      return '<article class="fc-shop-card f-static-product" data-id="' + escape(product.id) +
        '" data-name="' + escape(product.name) + '" data-price="' + Number(product.price_bdt) +
        '" data-image="' + escape(image) + '">' +
        '<div class="fc-shop-photo f-product-photo">' + imageHtml +
        '<span class="fc-shop-tag">' + escape(statusLabel) + '</span>' +
        '<div class="f-product-actions"><button type="button" class="f-add" data-f-add="' + escape(product.id) + '">Add to Cart</button>' +
        '<button type="button" class="f-buy-now" data-f-buy-now="' + escape(product.id) + '">Buy Now</button></div></div>' +
        '<div class="fc-shop-card-info"><span class="fc-shop-name">' + escape(product.name) + '</span>' +
        '<span class="fc-shop-category">' + escape(product.category) + '</span>' +
        '<strong class="fc-shop-price">' + money(product.price_bdt) + '</strong>' +
        '<p class="fc-shop-confirm">Listed price · store confirmation required</p></div></article>';
    }).join("");
  }
  async function load() {
    status.textContent = "Loading the registered catalogue…";
    try {
      const [catalogueResponse, mapResponse] = await Promise.all([
        fetch(API + "?action=products", { headers: { "apikey": KEY } }),
        fetch("/fashionstore/assets/fashion-photos/product-image-map.json").catch(() => null)
      ]);
      const payload = await catalogueResponse.json().catch(() => ({}));
      if (!catalogueResponse.ok || !payload.ok || !Array.isArray(payload.products)) {
        throw new Error(payload.error || "The catalogue is temporarily unavailable.");
      }
      if (mapResponse && mapResponse.ok) photoMap = await mapResponse.json().catch(() => ({}));
      products = payload.products.filter(product => product && product.id && Number(product.price_bdt) > 0 && product.image_url);
      const names = [...new Set(products.map(product => product.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      names.forEach(name => category.add(new Option(name, name)));
      const requestedCategory = new URLSearchParams(location.search).get("category");
      if (requestedCategory && names.includes(requestedCategory)) category.value = requestedCategory;
      render();
    } catch (error) {
      status.textContent = error.message || "The catalogue could not be loaded. Please refresh and try again.";
      grid.innerHTML = '<div class="fc-shop-empty">The product list could not be loaded right now. Your saved bag has not been changed.</div>';
    }
  }
  search?.addEventListener("input", render);
  category?.addEventListener("change", render);
  sort?.addEventListener("change", render);
  load();
})();