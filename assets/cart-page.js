(function () {
  "use strict";
  const KEY = "forme-cart-v1";
  const home = "/fashionstore/";
  const checkout = "/fashionstore/pages/checkout.html";
  const $ = id => document.getElementById(id);
  const money = value => "৳" + Number(value || 0).toLocaleString("en-BD");
  const status = $("fc-bag-status");
  const itemRoot = $("fc-bag-items");
  const content = $("fc-bag-content");
  const empty = $("fc-bag-empty");
  const countNode = $("fc-bag-count");
  const subtotalNode = $("fc-bag-subtotal");
  const totalNode = $("fc-bag-total");
  const checkoutButton = $("fc-bag-checkout");
  if (!itemRoot || !content || !empty || !checkoutButton) return;

  function readCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      let units = 0;
      return raw.slice(0, 10).map(item => {
        if (!item || !item.id || !item.name) return null;
        const price = Math.max(0, Math.round(Number(item.price) || 0));
        const wanted = Math.max(1, Math.round(Number(item.qty) || 1));
        const qty = Math.min(10, wanted, Math.max(0, 20 - units));
        units += qty;
        return { id:String(item.id).slice(0,100), name:String(item.name).slice(0,180), price,
          image:String(item.image || "").slice(0,1000), qty, variant:String(item.variant || "").slice(0,80) };
      }).filter(item => item && item.price > 0 && item.qty > 0);
    } catch (_) { return []; }
  }
  let cart = readCart();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); }
    catch (_) { status.textContent = "Your browser could not save the bag. Please enable site storage and try again."; }
  }
  function button(label, action, disabled) {
    const node = document.createElement("button");
    node.type = "button"; node.textContent = label; node.dataset.action = action; node.disabled = !!disabled;
    return node;
  }
  function render() {
    const units = cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    content.hidden = cart.length === 0;
    empty.hidden = cart.length > 0;
    countNode.textContent = String(units);
    subtotalNode.textContent = money(subtotal);
    totalNode.textContent = money(subtotal);
    itemRoot.replaceChildren();
    if (!cart.length) return;
    const fragment = document.createDocumentFragment();
    cart.forEach((item, index) => {
      const row = document.createElement("article"); row.className = "fc-bag-row"; row.dataset.index = String(index);
      const product = document.createElement("div"); product.className = "fc-bag-product";
      const image = document.createElement("img"); image.className = "fc-bag-thumb"; image.alt = item.name; image.loading = "lazy";
      if (item.image) { image.src = item.image; image.onerror = () => { image.hidden = true; }; }
      const copy = document.createElement("div"); copy.className = "fc-bag-product-copy";
      const name = document.createElement("h3"); name.textContent = item.name;
      const detail = document.createElement("p"); detail.textContent = "FORME catalogue item · stock and final details confirmed before dispatch";
      const price = document.createElement("span"); price.className = "fc-bag-unit-price"; price.textContent = money(item.price) + " each";
      const variantWrap = document.createElement("div"); variantWrap.className = "fc-bag-variant";
      const label = document.createElement("label"); label.htmlFor = "fc-bag-variant-" + index; label.textContent = "Size / colour / variant (optional)";
      const variant = document.createElement("input"); variant.id = label.htmlFor; variant.maxLength = 80; variant.placeholder = "e.g. M, 32, black";
      variant.value = item.variant;
      variant.addEventListener("change", () => { item.variant = variant.value.trim().slice(0,80); save(); });
      variantWrap.append(label, variant);
      copy.append(name, detail, price, variantWrap); product.append(image, copy);
      const quantity = document.createElement("div"); quantity.className = "fc-bag-quantity";
      quantity.append(button("−", "decrease", item.qty <= 1), Object.assign(document.createElement("strong"), {textContent:String(item.qty)}),
        button("+", "increase", item.qty >= 10 || units >= 20));
      const remove = button("Remove item", "remove", false); remove.className = "fc-bag-remove"; quantity.append(remove);
      const lineTotal = document.createElement("div"); lineTotal.className = "fc-bag-line-total"; lineTotal.textContent = money(item.price * item.qty);
      row.append(product, quantity, lineTotal); fragment.append(row);
    });
    itemRoot.append(fragment);
  }
  itemRoot.addEventListener("click", event => {
    const control = event.target.closest("[data-action]");
    if (!control) return;
    const row = control.closest("[data-index]");
    const index = Number(row && row.dataset.index);
    if (!Number.isInteger(index) || !cart[index]) return;
    const action = control.dataset.action;
    const units = cart.reduce((sum, item) => sum + item.qty, 0);
    if (action === "remove") cart.splice(index, 1);
    if (action === "decrease" && cart[index].qty > 1) cart[index].qty -= 1;
    if (action === "increase") {
      if (cart[index].qty >= 10 || units >= 20) { status.textContent = "A maximum of 10 units per item and 20 units per bag is allowed."; return; }
      cart[index].qty += 1;
    }
    status.textContent = "";
    save(); render();
  });
  checkoutButton.addEventListener("click", () => {
    if (!cart.length) { status.textContent = "Your bag is empty. Add an item before checkout."; return; }
    window.location.assign(checkout);
  });
  window.addEventListener("storage", event => {
    if (event.key === KEY) { cart = readCart(); render(); }
  });
  render();
})();