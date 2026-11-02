(function () {
  "use strict";
  const KEY = "forme-cart-v1";
  const money = (n) => "৳" + Number(n || 0).toLocaleString("en-BD");
  function readCart() {
    try {
      const list = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(list)) return [];
      let units = 0;
      return list.slice(0, 10).filter(x => x && x.id && Number(x.price) > 0).map(x => {
        const qty = Math.min(10, Math.max(1, Number(x.qty) || 1), Math.max(0, 20 - units));
        units += qty;
        return { ...x, price: Number(x.price), qty };
      }).filter(x => x.qty > 0);
    } catch (_) { return []; }
  }
  function saveCart(cart) {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (_) {}
  }
  let cart = readCart();
  const addButton = document.createElement("a");
  addButton.className = "fc-static-cart";
  addButton.href = "/fashionstore/pages/checkout.html";
  addButton.setAttribute("aria-label", "Review your bag and place a cash-on-delivery order");
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
  function cartQuantity() { return cart.reduce((sum, item) => sum + Number(item.qty || 0), 0); }
  function notify(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("visible"), 2600);
  }

  document.addEventListener("click", (event) => {
    const button=event.target.closest("[data-f-add], [data-f-buy-now]");if(!button)return;
    const buyNow=button.hasAttribute("data-f-buy-now"),card=button.closest(".f-static-product");if(!card)return;
    const id=buyNow?button.dataset.fBuyNow:button.dataset.fAdd,name=card.dataset.name,price=Number(card.dataset.price),image=card.dataset.image;
    if(!id||!name||!Number.isFinite(price)||price<=0){notify("This item is not available for a COD order yet.");return;}
    if(buyNow){cart.splice(0,cart.length);cart.push({id,name,price,image,qty:1});saveCart(cart);render();window.location.assign("/fashionstore/pages/checkout.html");return;}
    if(cartQuantity()>=20){notify("Your bag can contain up to 20 items in total.");return;}
    const existing=cart.find(item=>item.id===id);
    if(existing){if(Number(existing.qty||1)>=10){notify("Maximum 10 units of one item.");return;}existing.qty=Number(existing.qty||1)+1;}
    else{if(cart.length>=10){notify("Your bag can contain up to 10 different items.");return;}cart.push({id,name,price,image,qty:1});}
    saveCart(cart);render();notify("Added to your bag. Place your COD order when ready.");
  });

  render();
})();
