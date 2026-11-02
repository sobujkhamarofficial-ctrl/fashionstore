(function () {
  "use strict";
  const API = "https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api";
  const KEY = "sb_publishable_EWY6B3OF8lOQB7uB7jBZRA_3MwimKRy";
  const CART = "forme-cart-v1";
  const money = value => "৳" + Number(value || 0).toLocaleString("en-BD");
  function readCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(CART) || "[]");
      if (!Array.isArray(saved)) return [];
      let units = 0;
      return saved.slice(0, 10).map(product => {
        const qty = Math.min(10, Math.max(1, Math.round(Number(product.qty) || 1)), Math.max(0, 20 - units));
        units += qty;
        return {
          id: String(product.id || "").slice(0, 100),
          name: String(product.name || "").slice(0, 180),
          price: Math.max(0, Math.round(Number(product.price) || 0)),
          image: String(product.image || "").slice(0, 1000),
          qty,
          variant: String(product.variant || "").slice(0, 80)
        };
      }).filter(product => product.id && product.name && product.price > 0 && product.qty > 0);
    } catch (_) { return []; }
  }
  let cart = readCart();
  const shell = document.getElementById("fc-checkout-shell");
  const empty = document.getElementById("fc-checkout-empty");
  const success = document.getElementById("fc-order-success");
  const form = document.getElementById("fc-order-form");
  const status = document.getElementById("fc-order-status");
  const submit = document.getElementById("fc-place-order");
  const items = document.getElementById("fc-checkout-items");
  const subtotalNode = document.getElementById("fc-subtotal");
  if (!form || !shell || !items) return;
  let busy = false;
  function saveCart() {
    try { localStorage.setItem(CART, JSON.stringify(cart)); } catch (_) {}
  }
  function showEmpty() {
    shell.hidden = true;
    empty.hidden = false;
    empty.innerHTML = 'Your bag is empty. <a href="/fashionstore/pages/shop.html">Browse the product catalogue</a> to choose an item.';
  }
  function button(label, action, disabled) {
    const node = document.createElement("button");
    node.type = "button";
    node.className = "fc-cart-control";
    node.textContent = label;
    node.setAttribute("aria-label", action);
    node.disabled = !!disabled;
    return node;
  }
  function render() {
    if (!cart.length) { showEmpty(); return; }
    shell.hidden = false;
    empty.hidden = true;
    items.replaceChildren();
    let subtotal = 0;
    cart.forEach((product, index) => {
      subtotal += product.price * product.qty;
      const row = document.createElement("article");
      row.className = "fc-card fc-checkout-item";
      const image = document.createElement("img");
      image.className = "fc-checkout-item-photo";
      image.src = product.image || "";
      image.alt = product.name;
      image.loading = "lazy";
      image.addEventListener("error", () => { image.hidden = true; });
      const details = document.createElement("div");
      details.className = "fc-checkout-item-details";
      const name = document.createElement("h3");
      name.textContent = product.name;
      const price = document.createElement("p");
      price.className = "fc-meta";
      price.textContent = money(product.price) + " each · " + money(product.price * product.qty) + " line total";
      const variantLabel = document.createElement("label");
      variantLabel.className = "fc-checkout-variant-label";
      variantLabel.textContent = "Size / colour / variant";
      const variant = document.createElement("input");
      variant.type = "text";
      variant.maxLength = 80;
      variant.value = product.variant;
      variant.placeholder = "e.g. M, 32, black, free size";
      variant.className = "fc-checkout-variant";
      variant.addEventListener("input", () => { cart[index].variant = variant.value.slice(0, 80); saveCart(); });
      variantLabel.append(variant);
      const controls = document.createElement("div");
      controls.className = "fc-checkout-controls";
      const minus = button("−", "Decrease quantity of " + product.name, product.qty <= 1);
      const quantity = document.createElement("strong");
      quantity.textContent = String(product.qty);
      const plus = button("+", "Increase quantity of " + product.name, product.qty >= 10 || cart.reduce((n,p)=>n+p.qty,0) >= 20);
      const remove = button("Remove", "Remove " + product.name + " from bag", false);
      remove.classList.add("fc-cart-remove");
      minus.addEventListener("click", () => { if (cart[index].qty > 1) { cart[index].qty--; saveCart(); render(); } });
      plus.addEventListener("click", () => {
        const total = cart.reduce((n,p)=>n+p.qty,0);
        if (cart[index].qty < 10 && total < 20) { cart[index].qty++; saveCart(); render(); }
      });
      remove.addEventListener("click", () => { cart.splice(index, 1); saveCart(); render(); });
      controls.append(minus, quantity, plus, remove);
      details.append(name, price, variantLabel, controls);
      row.append(image, details);
      items.append(row);
    });
    subtotalNode.textContent = money(subtotal);
  }
  if (!cart.length) { showEmpty(); return; }
  if (cart.reduce((sum, product) => sum + product.qty, 0) > 20) {
    shell.hidden = true;
    empty.hidden = false;
    empty.textContent = "This bag exceeds the 20-item limit. Return to the catalogue and reduce the quantities.";
    return;
  }
  render();
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || !cart.length) return;
    status.textContent = "";
    const data = new FormData(form);
    const order = {
      customer_name: String(data.get("customer_name") || "").trim(),
      customer_phone: String(data.get("customer_phone") || "").trim(),
      customer_email: String(data.get("customer_email") || "").trim(),
      district: String(data.get("district") || "").trim(),
      area: String(data.get("area") || "").trim(),
      delivery_address: String(data.get("delivery_address") || "").trim(),
      postal_code: String(data.get("postal_code") || "").trim(),
      customer_note: String(data.get("customer_note") || "").trim(),
      privacy_consent: data.get("privacy_consent") === "on",
      terms_accepted: data.get("terms_accepted") === "on",
      privacy_policy_version: "2026-11-03",
      terms_version: "2026-11-03",
      items: cart.map(product => ({
        product_id: product.id,
        quantity: product.qty,
        requested_variant: product.variant
      }))
    };
    busy = true;
    submit.disabled = true;
    submit.textContent = "Sending order request…";
    status.textContent = "Submitting your cash-on-delivery order request securely…";
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": KEY },
        body: JSON.stringify({ action: "order", order, website: String(data.get("website") || "") })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok || !payload.order || !payload.order.order_number) {
        throw new Error(payload.error || "We could not submit your request. Your bag has been kept so you can try again.");
      }
      localStorage.removeItem(CART);
      cart = [];
      shell.hidden = true;
      empty.hidden = true;
      success.hidden = false;
      success.replaceChildren();
      const heading = document.createElement("h2");
      heading.textContent = "Your COD order request has been received";
      const reference = document.createElement("p");
      reference.textContent = "Order reference: " + payload.order.order_number;
      const total = document.createElement("p");
      total.textContent = "Catalogue subtotal: " + money(payload.order.subtotal_bdt);
      const state = document.createElement("p");
      state.textContent = "Status: Pending review. Your order is not confirmed until FORME contacts you.";
      const payment = document.createElement("p");
      payment.textContent = "Payment: Cash on delivery only. No online or advance payment has been collected.";
      const note = document.createElement("p");
      note.textContent = "The team will verify the product, requested size or colour, availability, final price and delivery charge before dispatch. Pay only the agreed amount to the identified delivery person when the parcel is delivered.";
      const links = document.createElement("p");
      links.innerHTML = '<a href="/fashionstore/pages/order-tracking.html">Track this request</a> · <a href="/fashionstore/pages/shop.html">Continue shopping</a> · <a href="/fashionstore/pages/contact.html">Contact customer care</a>';
      success.append(heading, reference, total, state, payment, note, links);
      status.textContent = "Your order request has been saved.";
    } catch (error) {
      status.textContent = error && error.message ? error.message : "A connection problem occurred. Your bag has been kept.";
      submit.disabled = false;
      submit.textContent = "Place COD order request";
      busy = false;
    }
  });
})();