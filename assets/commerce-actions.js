(function () {
  "use strict";

  const CART_KEY = "forme-cart-v1";
  const CART_URL = "/fashionstore/pages/cart.html";
  const CHECKOUT_URL = "/fashionstore/pages/checkout.html";
  const money = value => "৳" + Number(value || 0).toLocaleString("en-BD");

  function readCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      let units = 0;
      return raw.slice(0, 10).filter(item => item && item.id && item.name && Number(item.price) > 0).map(item => {
        const qty = Math.min(10, Math.max(1, Math.round(Number(item.qty) || 1)), Math.max(0, 20 - units));
        units += qty;
        return { id:String(item.id).slice(0,100), name:String(item.name).slice(0,180),
          price:Math.round(Number(item.price)), image:String(item.image || "").slice(0,1000),
          qty, variant:String(item.variant || "").slice(0,80) };
      }).filter(item => item.qty > 0);
    } catch (_) { return []; }
  }

  let localCart = readCart();
  let bagLink = null, toastNode = null, toastTimer = null;

  function getCart() {
    const homeCart = window.FORME_CART_API;
    if (homeCart && Array.isArray(homeCart.items)) return homeCart.items;
    localCart = readCart();
    return localCart;
  }

  function ensureBagLink() {
    if (document.getElementById("f-cart-open")) return null;
    if (bagLink && bagLink.isConnected) return bagLink;
    bagLink = document.getElementById("fc-global-bag");
    if (!bagLink) {
      bagLink = document.createElement("a");
      bagLink.id = "fc-global-bag";
      bagLink.className = "fc-global-bag";
      bagLink.href = CART_URL;
      bagLink.setAttribute("aria-label", "Open your FORME shopping bag");
      document.body.appendChild(bagLink);
    }
    return bagLink;
  }

  function renderBag(cart = getCart()) {
    const link = ensureBagLink();
    if (!link) return;
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const total = cart.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);
    link.textContent = count ? "ব্যাগ দেখুন · " + count + " · " + money(total) : "আমার ব্যাগ · ০";
    link.classList.toggle("has-items", count > 0);
    link.setAttribute("aria-label", count ? "View " + count + " items in your bag, subtotal " + money(total) : "Your bag is currently empty");
  }

  function persistCart(cart) {
    const homeCart = window.FORME_CART_API;
    if (homeCart && homeCart.items === cart && typeof homeCart.refresh === "function") homeCart.refresh();
    else {
      localCart = cart;
      try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) {}
    }
    renderBag(cart);
  }

  function showToast(message) {
    const homeCart = window.FORME_CART_API;
    if (homeCart && typeof homeCart.toast === "function") {
      homeCart.toast(message);
      return;
    }
    if (!toastNode) {
      toastNode = document.createElement("div");
      toastNode.className = "fc-commerce-toast";
      toastNode.setAttribute("role", "status");
      toastNode.setAttribute("aria-live", "polite");
      document.body.appendChild(toastNode);
    }
    toastNode.textContent = message;
    toastNode.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastNode.classList.remove("is-visible"), 2600);
  }

  document.addEventListener("click", event => {
    const button = event.target && event.target.closest ? event.target.closest("[data-f-add], [data-f-buy-now]") : null;
    if (!button) return;
    const card = button.closest(".f-product, .f-static-product");
    if (!card) return;
    event.preventDefault();

    if (button.disabled) {
      showToast("এই পণ্যের সর্বশেষ স্টক/দাম যাচাই করা যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।");
      return;
    }

    const buyNow = button.hasAttribute("data-f-buy-now");
    const id = String((buyNow ? button.dataset.fBuyNow : button.dataset.fAdd) || card.dataset.id || "").trim();
    const item = {
      id, name:String(card.dataset.name || "").trim(),
      price:Math.round(Number(card.dataset.price) || 0),
      image:String(card.dataset.image || "").trim(), qty:1, variant:""
    };

    if (!item.id || !item.name || !Number.isFinite(item.price) || item.price <= 0) {
      showToast("এই পণ্যটি এখন অর্ডারের জন্য প্রস্তুত নয়।");
      return;
    }

    const cart = getCart();
    if (buyNow) {
      cart.splice(0, cart.length, item);
      persistCart(cart);
      window.location.assign(CHECKOUT_URL + "?product=" + encodeURIComponent(item.id));
      return;
    }

    const units = cart.reduce((sum, product) => sum + Number(product.qty || 0), 0);
    if (units >= 20) { showToast("একটি ব্যাগে সর্বোচ্চ ২০টি পণ্য রাখা যাবে।"); return; }
    const existing = cart.find(product => product.id === item.id);
    if (existing) {
      if (Number(existing.qty || 1) >= 10) { showToast("একটি পণ্যের সর্বোচ্চ ১০টি নেওয়া যাবে।"); return; }
      existing.qty = Number(existing.qty || 1) + 1;
    } else {
      if (cart.length >= 10) { showToast("একটি ব্যাগে সর্বোচ্চ ১০ ধরনের পণ্য রাখা যাবে।"); return; }
      cart.push(item);
    }
    persistCart(cart);
    showToast("ব্যাগে যোগ হয়েছে। ব্যাগ দেখে COD অর্ডার সম্পন্ন করুন।");
  });

  window.addEventListener("storage", event => {
    if (event.key === CART_KEY) { localCart = readCart(); renderBag(localCart); }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => renderBag(), { once:true });
  else renderBag();
})();
