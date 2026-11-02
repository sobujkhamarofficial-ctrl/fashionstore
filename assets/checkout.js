(function () {
  "use strict";
  const API = "https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api";
  const PUBLISHABLE_KEY = "sb_publishable_EWY6B3OF8lOQB7uB7jBZRA_3MwimKRy";
  const CART_KEY = "forme-cart-v1";
  const getCart = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw.slice(0, 10).map((p) => ({
        id: String(p.id || "").slice(0, 100),
        name: String(p.name || "").slice(0, 180),
        price: Math.max(0, Math.round(Number(p.price) || 0)),
        image: String(p.image || "").slice(0, 1000),
        qty: Math.min(10, Math.max(1, Math.round(Number(p.qty) || 1))),
      })).filter((p) => p.id && p.name && p.price > 0);
    } catch (_) { return []; }
  };
  const money = (value) => "৳" + Number(value || 0).toLocaleString("en-BD");
  const cart = getCart();
  const shell = document.getElementById("fc-checkout-shell");
  const empty = document.getElementById("fc-checkout-empty");
  const success = document.getElementById("fc-order-success");
  const form = document.getElementById("fc-order-form");
  const status = document.getElementById("fc-order-status");
  const submit = document.getElementById("fc-place-order");
  const itemsNode = document.getElementById("fc-checkout-items");
  if (!form || !shell) return;

  if (!cart.length) {
    shell.hidden = true;
    empty.hidden = false;
    return;
  }

  function renderItems() {
    const subtotal = cart.reduce((sum, p) => sum + p.price * p.qty, 0);
    itemsNode.innerHTML = cart.map((p, index) => {
      const row = document.createElement("div");
      row.className = "fc-card";
      row.style.marginBottom = "12px";
      const image = document.createElement("img");
      image.src = p.image;
      image.alt = "";
      image.loading = "lazy";
      image.style.cssText = "width:68px;height:82px;object-fit:cover;float:left;margin:0 15px 8px 0;background:#eee";
      const name = document.createElement("h3");
      name.textContent = p.name;
      name.style.cssText = "font:500 17px Georgia,serif;margin:0 0 5px";
      const price = document.createElement("p");
      price.textContent = money(p.price) + " × " + p.qty + " = " + money(p.price * p.qty);
      price.style.cssText = "font-size:12px;color:#737970;margin:0 0 10px";
      const label = document.createElement("label");
      label.htmlFor = "fc-variant-" + index;
      label.textContent = "Requested size / variant (optional)";
      label.style.cssText = "display:block;font-size:11px;font-weight:700;margin:8px 0 5px";
      const input = document.createElement("input");
      input.id = "fc-variant-" + index;
      input.className = "fc-variant-input";
      input.dataset.productId = p.id;
      input.maxLength = 80;
      input.placeholder = "e.g. M, 32, black, free size";
      input.style.cssText = "width:100%;max-width:360px;padding:10px;border:1px solid #dcd7ce;background:#fffefa;font-size:12px";
      row.append(image,name,price,label,input);
      return row.outerHTML;
    }).join("");
    document.getElementById("fc-subtotal").textContent = money(subtotal);
  }

  renderItems();

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
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
      privacy_policy_version: "2026-11-02",
      terms_version: "2026-11-02",
      items: cart.map((p) => {
        const variant = form.querySelector('[data-product-id="' + CSS.escape(p.id) + '"]');
        return { product_id: p.id, quantity: p.qty, requested_variant: variant ? variant.value.trim() : "" };
      }),
    };
    submit.disabled = true;
    submit.textContent = "Sending request…";
    status.textContent = "Submitting your order request securely…";
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": PUBLISHABLE_KEY },
        body: JSON.stringify({ action: "order", order: order, website: String(data.get("website") || "") }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok || !result.order) {
        throw new Error(result.error || "We could not submit the request. Please try again.");
      }
      const reference = result.order.order_number || "Received";
      const subtotalText = money(result.order.subtotal_bdt);
      localStorage.removeItem(CART_KEY);
      shell.hidden = true;
      empty.hidden = true;
      success.hidden = false;
      success.innerHTML = "";
      const heading = document.createElement("h2");
      heading.textContent = "Your request has been received";
      heading.style.cssText = "font:500 28px Georgia,serif;color:#263b32;margin:0 0 12px";
      const ref = document.createElement("p");
      ref.textContent = "Request reference: " + reference;
      const total = document.createElement("p");
      total.textContent = "Estimated item subtotal: " + subtotalText;
      const explanation = document.createElement("p");
      explanation.textContent = "This is not yet a confirmed order. FORME must verify the items, final price, delivery charge and estimated delivery date, then contact you for your agreement. No payment has been collected.";
      const links = document.createElement("p");
      links.innerHTML = '<a href="/fashionstore/">Continue browsing</a> · <a href="/fashionstore/pages/contact.html">Contact customer care</a>';
      success.append(heading,ref,total,explanation,links);
    } catch (error) {
      status.textContent = error && error.message ? error.message : "Something went wrong. Please try again.";
      submit.disabled = false;
      submit.textContent = "Submit order request";
    }
  });
})();
