(function () {
  "use strict";
  const API = "https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api";
  const KEY = "sb_publishable_EWY6B3OF8lOQB7uB7jBZRA_3MwimKRy";
  const CART_KEY = "forme-cart-v1";
  const money = value => "৳" + Number(value || 0).toLocaleString("en-BD");

  function readCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(saved)) return [];
      let units = 0;
      return saved.slice(0, 10).map(item => {
        const qty = Math.min(10, Math.max(1, Math.round(Number(item.qty) || 1)), Math.max(0, 20 - units));
        units += qty;
        return {
          id: String(item.id || "").slice(0, 100),
          name: String(item.name || "").slice(0, 180),
          price: Math.max(0, Math.round(Number(item.price) || 0)),
          image: String(item.image || "").slice(0, 1000),
          qty,
          variant: String(item.variant || "").slice(0, 80)
        };
      }).filter(item => item.id && item.name && item.price > 0 && item.qty > 0);
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
  if (!form || !shell || !empty || !items || !subtotalNode) return;

  let busy = false;
  let orderPlaced = false;
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) {}
  }
  function subtotal() {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }
  function updateEmptyState() {
    if (orderPlaced) {
      shell.hidden = true;
      empty.hidden = true;
      return;
    }
    const hasItems = cart.length > 0;
    shell.hidden = !hasItems;
    empty.hidden = hasItems;
    if (!hasItems) {
      empty.replaceChildren(document.createTextNode("Your bag is empty. "));
      const link = document.createElement("a");
      link.href = "/fashionstore/";
      link.textContent = "Return to the store";
      empty.append(link, document.createTextNode(" to choose an item."));
    }
  }
  function makeButton(label, action, className, disabled) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.cartAction = action;
    button.className = className;
    button.disabled = !!disabled || busy;
    return button;
  }
  function render() {
    updateEmptyState();
    if (!cart.length) {
      items.replaceChildren();
      subtotalNode.textContent = money(0);
      return;
    }
    const fragment = document.createDocumentFragment();
    cart.forEach((item, index) => {
      const row = document.createElement("article");
      row.className = "fc-card fc-checkout-item";
      row.dataset.index = String(index);

      const image = document.createElement("img");
      image.src = item.image;
      image.alt = item.name;
      image.loading = "lazy";
      image.onerror = () => { image.hidden = true; };
      image.className = "fc-checkout-thumb";

      const details = document.createElement("div");
      details.className = "fc-checkout-item-details";
      const name = document.createElement("h3");
      name.textContent = item.name;
      const price = document.createElement("p");
      price.className = "fc-checkout-item-price";
      price.textContent = money(item.price) + " each · " + money(item.price * item.qty) + " total";

      const variantLabel = document.createElement("label");
      variantLabel.htmlFor = "fc-variant-" + index;
      variantLabel.textContent = "Size / colour / variant (optional)";
      const variant = document.createElement("input");
      variant.id = "fc-variant-" + index;
      variant.className = "fc-variant-input";
      variant.maxLength = 80;
      variant.placeholder = "e.g. M, 32, black, free size";
      variant.value = item.variant;
      variant.addEventListener("change", () => {
        item.variant = variant.value.trim().slice(0, 80);
        saveCart();
      });

      const controls = document.createElement("div");
      controls.className = "fc-quantity-controls";
      const quantity = document.createElement("span");
      quantity.textContent = String(item.qty);
      quantity.className = "fc-qty-value";
      controls.append(
        makeButton("−", "decrease", "fc-qty-button", item.qty <= 1),
        quantity,
        makeButton("+", "increase", "fc-qty-button", item.qty >= 10 || cart.reduce((n, p) => n + p.qty, 0) >= 20),
        makeButton("Remove", "remove", "fc-remove-item", false)
      );
      details.append(name, price, variantLabel, variant, controls);
      row.append(image, details);
      fragment.append(row);
    });
    items.replaceChildren(fragment);
    subtotalNode.textContent = money(subtotal());
  }

  async function restoreDirectProduct() {
    const productId = new URLSearchParams(window.location.search).get("product");
    if (!productId || cart.length) return;
    try {
      const response = await fetch(API + "?action=products", {
        method: "GET", cache: "no-store",
        headers: { "apikey": KEY, "Accept": "application/json" }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok || !Array.isArray(payload.products)) throw new Error(payload.error || "The product could not be loaded. Please try again.");
      const product = payload.products.find(item => String(item.id) === productId);
      if (!product || !product.is_active || !Number(product.price_bdt)) throw new Error("This product is not currently available for a checkout request.");
      cart = [{ id:String(product.id), name:String(product.name || ""), price:Number(product.price_bdt), image:String(product.image_url || ""), qty:1, variant:"" }];
      saveCart();
    } catch (error) {
      status.textContent = error && error.message ? error.message : "The product could not be loaded. Please try again.";
    }
  }

  items.addEventListener("click", event => {
    const button = event.target.closest("[data-cart-action]");
    if (!button || busy) return;
    const row = button.closest("[data-index]");
    const index = Number(row && row.dataset.index);
    if (!Number.isInteger(index) || !cart[index]) return;
    const action = button.dataset.cartAction;
    if (action === "remove") cart.splice(index, 1);
    if (action === "decrease" && cart[index] && cart[index].qty > 1) cart[index].qty -= 1;
    if (action === "increase" && cart[index] && cart[index].qty < 10 && cart.reduce((n, p) => n + p.qty, 0) < 20) cart[index].qty += 1;
    saveCart();
    render();
  });

  void restoreDirectProduct().finally(render);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || !cart.length) return;
    status.textContent = "";
    if (cart.reduce((sum, item) => sum + item.qty, 0) > 20) {
      status.textContent = "Your bag exceeds the 20-item limit. Please reduce the quantities.";
      return;
    }
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
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.qty,
        requested_variant: item.variant
      }))
    };
    busy = true;
    submit.disabled = true;
    submit.textContent = "Placing COD order…";
    status.textContent = "Sending your cash-on-delivery order securely…";
    render();
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": KEY },
        body: JSON.stringify({ action: "order", order, website: String(data.get("website") || "") })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok || !payload.order) {
        throw new Error(payload.error || "We could not place your order. Please check your details and try again.");
      }
      localStorage.removeItem(CART_KEY);
      orderPlaced = true;
      cart = [];
      shell.hidden = true;
      empty.hidden = true;
      success.hidden = false;
      const orderReference = String(payload.order.order_number || "").trim();
      if (!/^FRM-[0-9]{6}-[A-Z0-9]{6}$/.test(orderReference)) throw new Error("The server did not return a valid order reference. Please contact support before submitting again.");
      window.location.assign("/fashionstore/pages/order-confirmation.html?ref=" + encodeURIComponent(orderReference));
      return;
    } catch (error) {
      status.textContent = error && error.message ? error.message : "Something went wrong. Please try again.";
    } finally {
      busy = false;
      submit.disabled = false;
      submit.textContent = "Place COD order";
      render();
    }
  });
})();