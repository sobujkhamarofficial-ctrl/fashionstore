(function () {
  "use strict";
  const KEY = "forme-cart-v1";
  const money = (n) => "৳" + Number(n || 0).toLocaleString("en-BD");
  function readCart() {
    try {
      const list = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(list) ? list.filter(x => x && x.id && Number(x.price) > 0).slice(0, 10) : [];
    } catch (_) { return []; }
  }
  function saveCart(cart) {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (_) {}
  }
  let cart = readCart();
  const addButton = document.createElement("a");
  addButton.className = "fc-static-cart";
  addButton.href = "/fashionstore/pages/checkout.html";
  addButton.setAttribute("aria-label", "Review your bag and submit an order request");
  document.body.appendChild(addButton);

  const toast = document.createElement("div");
  toast.className = "fc-static-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.appendChild(toast);
  let timer;
  function render() {
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const subtotal = cart.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);
    addButton.textContent = count ? "Review bag · " + count + " · " + money(subtotal) : "Your bag is empty";
    addButton.classList.toggle("has-items", count > 0);
  }
  function notify(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("visible"), 2600);
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-f-add]");
    if (!button) return;
    const card = button.closest(".f-static-product");
    if (!card) return;
    const id = card.dataset.id;
    const name = card.dataset.name;
    const price = Number(card.dataset.price);
    const image = card.dataset.image;
    if (!id || !name || !Number.isFinite(price) || price <= 0) {
      notify("This sample item is not available for an order request yet.");
      return;
    }
    const existing = cart.find(item => item.id === id);
    if (existing) {
      existing.qty = Math.min(10, Number(existing.qty || 1) + 1);
    } else {
      if (cart.length >= 10) {
        notify("Your bag can contain up to 10 different items.");
        return;
      }
      cart.push({ id, name, price, image, qty: 1 });
    }
    saveCart(cart);
    render();
    notify("Added to your bag. Final price and availability will be confirmed.");
  });

  render();
})();
