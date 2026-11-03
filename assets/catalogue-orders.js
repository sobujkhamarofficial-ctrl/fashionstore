(function () {
  "use strict";
  const API = "https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api";
  const KEY = "sb_publishable_EWY6B3OF8lOQB7uB7jBZRA_3MwimKRy";
  const MODAL_ID = "fc-catalogue-order-modal";
  let selected = null;
  let busy = false;
  const make = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value || "";
  };
  function closeModal() {
    const wrap = document.getElementById(MODAL_ID);
    if (wrap) wrap.hidden = true;
    document.body.style.overflow = "";
    busy = false;
    selected = null;
  }
  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    const wrap = make("div", "fc-catalogue-modal");
    wrap.id = MODAL_ID;
    wrap.hidden = true;
    wrap.innerHTML =
      '<button class="fc-catalogue-backdrop" type="button" data-catalogue-close aria-label="Close order form"></button>' +
      '<section class="fc-catalogue-dialog" role="dialog" aria-modal="true" aria-labelledby="fc-catalogue-title">' +
      '<div class="fc-catalogue-head"><div><span class="eyebrow">FORME · ORDER REQUEST</span><h2 id="fc-catalogue-title">অর্ডার নাও</h2></div><button class="fc-catalogue-close" type="button" data-catalogue-close aria-label="বন্ধ করুন">×</button></div>' +
      '<div class="fc-catalogue-product"><img id="fc-catalogue-image" alt="" loading="lazy"><div><strong id="fc-catalogue-product-name"></strong><small id="fc-catalogue-category"></small><em>দাম ও স্টক নিশ্চিত করে জানানো হবে</em></div></div>' +
      '<form class="fc-catalogue-form" id="fc-catalogue-order-form">' +
      '<div class="fc-catalogue-field"><label for="fc-cat-name">আপনার নাম *</label><input id="fc-cat-name" name="customer_name" maxlength="120" autocomplete="name" required></div>' +
      '<div class="fc-catalogue-field"><label for="fc-cat-phone">মোবাইল নম্বর *</label><input id="fc-cat-phone" name="customer_phone" type="tel" inputmode="tel" maxlength="20" placeholder="01XXXXXXXXX" autocomplete="tel" pattern="(\\+?88)?01[3-9][0-9]{8}" required></div>' +
      '<div class="fc-catalogue-field"><label for="fc-cat-email">ইমেইল (ঐচ্ছিক)</label><input id="fc-cat-email" name="customer_email" type="email" maxlength="254" autocomplete="email"></div>' +
      '<div class="fc-catalogue-field"><label for="fc-cat-district">জেলা / শহর *</label><input id="fc-cat-district" name="district" maxlength="80" autocomplete="address-level1" required></div>' +
      '<div class="fc-catalogue-field"><label for="fc-cat-area">এলাকা</label><input id="fc-cat-area" name="area" maxlength="100" autocomplete="address-level2"></div>' +
      '<div class="fc-catalogue-field"><label for="fc-cat-qty">পরিমাণ *</label><input id="fc-cat-qty" name="quantity" type="number" min="1" max="10" step="1" value="1" required></div>' +
      '<div class="fc-catalogue-field wide"><label for="fc-cat-address">সম্পূর্ণ ঠিকানা *</label><textarea id="fc-cat-address" name="delivery_address" minlength="8" maxlength="500" autocomplete="street-address" placeholder="বাড়ি, রাস্তা, এলাকা ও কাছের পরিচিত স্থান" required></textarea></div>' +
      '<div class="fc-catalogue-field wide"><label for="fc-cat-variant">সাইজ / রং / ভ্যারিয়েন্ট</label><input id="fc-cat-variant" name="requested_variant" maxlength="80" placeholder="যেমন: M, Black, 32, Free Size"></div>' +
      '<div class="fc-catalogue-field wide"><label for="fc-cat-note">অতিরিক্ত নির্দেশনা (ঐচ্ছিক)</label><textarea id="fc-cat-note" name="customer_note" maxlength="400" placeholder="আপনার পছন্দ বা অন্য কোনো তথ্য"></textarea></div>' +
      '<label class="fc-catalogue-check"><input type="checkbox" name="privacy_consent" required> <span><a href="/fashionstore/pages/privacy.html" target="_blank" rel="noopener">Privacy Policy</a> পড়ে সম্মতি দিচ্ছি।</span></label>' +
      '<label class="fc-catalogue-check"><input type="checkbox" name="terms_accepted" required> <span><a href="/fashionstore/pages/terms.html" target="_blank" rel="noopener">Terms &amp; Conditions</a> মেনে নিচ্ছি। পণ্যের স্টক, সাইজ ও দাম নিশ্চিত হওয়ার পরই অর্ডার গ্রহণ করা হবে।</span></label>' +
      '<input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-10000px;width:1px;height:1px">' +
      '<button class="fc-catalogue-submit" id="fc-cat-submit" type="submit">অর্ডার রিকোয়েস্ট পাঠান</button><p class="fc-catalogue-status" id="fc-cat-status" role="status" aria-live="polite"></p>' +
      '</form><div class="fc-catalogue-success" id="fc-cat-success" hidden></div>' +
      '<p class="fc-catalogue-hint">এটি Cash on Delivery অর্ডার রিকোয়েস্ট। এখনই কোনো টাকা নেওয়া হবে না। FORME আপনার সঙ্গে যোগাযোগ করে পণ্যের ধরন, দাম, সাইজ ও ডেলিভারি চার্জ নিশ্চিত করবে।</p></section>';
    document.body.append(wrap);
    wrap.addEventListener("click", event => {
      if (event.target.closest("[data-catalogue-close]")) closeModal();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !wrap.hidden) closeModal();
    });
    wrap.querySelector("#fc-catalogue-order-form").addEventListener("submit", submitOrder);
  }
  function openModal(data) {
    ensureModal();
    selected = data;
    const wrap = document.getElementById(MODAL_ID);
    const form = wrap.querySelector("#fc-catalogue-order-form");
    const success = wrap.querySelector("#fc-cat-success");
    const image = wrap.querySelector("#fc-catalogue-image");
    form.reset();
    form.hidden = false;
    success.hidden = true;
    success.replaceChildren();
    wrap.querySelector("#fc-cat-status").textContent = "";
    image.hidden = false;
    image.src = data.imageUrl;
    image.alt = data.productName;
    image.onerror = () => { image.hidden = true; };
    setText("fc-catalogue-product-name", data.productName);
    setText("fc-catalogue-category", data.category);
    wrap.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => wrap.querySelector("#fc-cat-name")?.focus(), 30);
  }
  function openFromButton(button) {
    const card = button.closest(".visual-card, .form-product-card, .f-static-product, .f-product") || button.parentElement;
    const image = card && card.querySelector("img");
    const nameNode = card && card.querySelector("strong, .f-product-name");
    const name = button.dataset.productName || (nameNode && nameNode.textContent.trim()) || "FORME style request";
    const imageUrl = button.dataset.imageUrl || (image && (image.getAttribute("src") || image.src)) || "";
    const category = button.dataset.productCategory || document.querySelector("h1")?.textContent.trim() || "FORME catalogue";
    const sourcePath = button.dataset.sourcePath || window.location.pathname;
    if (name && imageUrl) openModal({productName:name, category, imageUrl, sourcePath});
  }
  async function submitOrder(event) {
    event.preventDefault();
    if (busy || !selected) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const order = {
      customer_name:String(data.get("customer_name")||"").trim(),
      customer_phone:String(data.get("customer_phone")||"").trim(),
      customer_email:String(data.get("customer_email")||"").trim(),
      district:String(data.get("district")||"").trim(),
      area:String(data.get("area")||"").trim(),
      delivery_address:String(data.get("delivery_address")||"").trim(),
      customer_note:String(data.get("customer_note")||"").trim(),
      requested_variant:String(data.get("requested_variant")||"").trim(),
      quantity:Number(data.get("quantity")||1),
      product_name:selected.productName,
      category:selected.category,
      image_url:selected.imageUrl,
      source_path:selected.sourcePath,
      privacy_consent:data.get("privacy_consent")==="on",
      terms_accepted:data.get("terms_accepted")==="on",
      privacy_policy_version:"2026-11-03",
      terms_version:"2026-11-03"
    };
    const wrap = document.getElementById(MODAL_ID);
    const status = wrap.querySelector("#fc-cat-status");
    const submit = wrap.querySelector("#fc-cat-submit");
    busy = true;
    submit.disabled = true;
    submit.textContent = "পাঠানো হচ্ছে…";
    status.textContent = "আপনার অর্ডার রিকোয়েস্ট নিরাপদে পাঠানো হচ্ছে…";
    try {
      const response = await fetch(API,{
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":KEY},
        body:JSON.stringify({action:"catalogue-order",order,website:String(data.get("website")||"")})
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok || !payload.order || !payload.order.order_number) throw new Error(payload.error || "রিকোয়েস্ট পাঠানো যায়নি। তথ্য পরীক্ষা করে আবার চেষ্টা করুন।");
      form.hidden = true;
      const success = wrap.querySelector("#fc-cat-success");
      success.hidden = false;
      success.replaceChildren(
        make("h3","","আপনার অর্ডার রিকোয়েস্ট গ্রহণ করা হয়েছে"),
        make("p","","Order Number: " + payload.order.order_number),
        make("p","","এই রিকোয়েস্ট Pending Review-এ আছে। FORME পণ্যের সঠিক ধরন, দাম, সাইজ, স্টক ও ডেলিভারি চার্জ নিশ্চিত করে আপনার সঙ্গে যোগাযোগ করবে। এখন কোনো টাকা নেওয়া হয়নি।")
      );
      const tracking = make("a","","অর্ডারের অবস্থা দেখুন");
      tracking.href = "/fashionstore/pages/order-tracking.html";
      success.append(tracking);
      status.textContent = "রিকোয়েস্ট সফলভাবে সংরক্ষিত হয়েছে।";
    } catch (error) {
      status.textContent = error && error.message ? error.message : "নেটওয়ার্ক সমস্যার কারণে পাঠানো যায়নি। আবার চেষ্টা করুন।";
    } finally {
      busy = false;
      submit.disabled = false;
      submit.textContent = "অর্ডার রিকোয়েস্ট পাঠান";
    }
  }
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-catalogue-order]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    openFromButton(button);
  });
  ensureModal();
  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        const cards = node.matches?.(".form-product-card") ? [node] : Array.from(node.querySelectorAll?.(".form-product-card") || []);
        cards.forEach(card => {
          if (card.querySelector("[data-catalogue-order]")) return;
          const image = card.querySelector("img");
          const name = card.querySelector(".form-product-copy strong");
          if (!image || !name) return;
          const button = make("button","visual-order-button","অর্ডার নাও");
          button.type = "button";
          button.dataset.catalogueOrder = "";
          button.dataset.productName = name.textContent.trim();
          button.dataset.productCategory = document.querySelector("h1")?.textContent.trim() || "Men catalogue";
          button.dataset.imageUrl = image.getAttribute("src") || image.src;
          button.dataset.sourcePath = window.location.pathname;
          card.querySelector(".form-product-copy")?.append(button);
        });
      }
    }
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();