(function () {
  "use strict";
  const API = "https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api";
  const KEY = "sb_publishable_EWY6B3OF8lOQB7uB7jBZRA_3MwimKRy";
  const form = document.getElementById("fc-review-form");
  const list = document.getElementById("fc-review-list");
  const status = document.getElementById("fc-review-status");

  function addText(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value;
    return node;
  }

  async function loadReviews() {
    if (!list) return;
    try {
      const response = await fetch(API + "?action=reviews", {
        headers: { "apikey": KEY }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok || !Array.isArray(data.reviews)) {
        throw new Error("Published reviews are temporarily unavailable.");
      }
      list.innerHTML = "";
      if (!data.reviews.length) {
        list.appendChild(addText("p", "fc-empty", "No customer reviews have been published yet. Verified reviews will appear here."));
        return;
      }
      data.reviews.forEach((review) => {
        const card = document.createElement("article");
        card.className = "fc-card";
        const product = addText("small", "", review.product_name || "FORME product");
        product.style.cssText = "color:#b76f50;letter-spacing:.12em;text-transform:uppercase;font-size:10px";
        const title = addText("h3", "", review.reviewer_name || "Customer");
        const stars = addText("p", "fc-review-stars", "★".repeat(Math.max(0, Math.min(5, Number(review.rating) || 0))) + "☆".repeat(5 - Math.max(0, Math.min(5, Number(review.rating) || 0))));
        const body = addText("p", "", review.review_text || "");
        const date = addText("small", "", review.created_at ? new Date(review.created_at).toLocaleDateString("en-GB") : "");
        date.style.color = "#858b83";
        card.append(product,title,stars,body,date);
        list.appendChild(card);
      });
    } catch (error) {
      list.innerHTML = "";
      list.appendChild(addText("p", "fc-empty", error && error.message ? error.message : "Reviews could not be loaded."));
    }
  }

  if (form) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      const data = new FormData(form);
      const payload = {
        action: "review",
        order_number: String(data.get("order_number") || "").trim(),
        customer_phone: String(data.get("customer_phone") || "").trim(),
        product_name: String(data.get("product_name") || "").trim(),
        reviewer_name: String(data.get("reviewer_name") || "").trim(),
        rating: Number(data.get("rating")),
        review_text: String(data.get("review_text") || "").trim(),
        publication_consent: data.get("publication_consent") === "on",
        website: String(data.get("website") || "")
      };
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      status.textContent = "Checking your delivered order…";
      try {
        const response = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": KEY },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(result.error || "Your review could not be submitted.");
        form.reset();
        status.textContent = "Thank you. Your review has been saved for publication review. Your phone number and order reference will not be published.";
      } catch (error) {
        status.textContent = error && error.message ? error.message : "A connection problem occurred.";
      } finally {
        button.disabled = false;
      }
    });
  }
  loadReviews();
})();
