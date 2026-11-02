(function () {
  "use strict";
  const API = "https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api";
  const PUBLISHABLE_KEY = "sb_publishable_EWY6B3OF8lOQB7uB7jBZRA_3MwimKRy";

  const contact = document.getElementById("fc-contact-form");
  if (contact) {
    contact.addEventListener("submit", async function (event) {
      event.preventDefault();
      const status = document.getElementById("fc-contact-status");
      const button = contact.querySelector('button[type="submit"]');
      const data = new FormData(contact);
      const payload = {
        action: "contact",
        name: String(data.get("name") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        email: String(data.get("email") || "").trim(),
        subject: String(data.get("subject") || "").trim(),
        message: String(data.get("message") || "").trim(),
        privacy_consent: data.get("privacy_consent") === "on",
        website: String(data.get("website") || ""),
      };
      status.textContent = "Sending your message…";
      button.disabled = true;
      try {
        const response = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": PUBLISHABLE_KEY },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(result.error || "Message could not be sent. Please try again.");
        contact.reset();
        status.textContent = "Thank you. Your message has been saved for the FORME support team.";
      } catch (error) {
        status.textContent = error && error.message ? error.message : "A connection problem occurred.";
      } finally {
        button.disabled = false;
      }
    });
  }

  const newsletter = document.getElementById("f-news-form");
  if (newsletter) {
    newsletter.addEventListener("submit", async function (event) {
      event.preventDefault();
      const input = newsletter.querySelector('input[type="email"]');
      const button = newsletter.querySelector('button[type="submit"]');
      const email = input ? input.value.trim() : "";
      if (!email) return;
      button.disabled = true;
      const original = button.textContent;
      button.textContent = "Joining…";
      try {
        const response = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": PUBLISHABLE_KEY },
          body: JSON.stringify({ action: "newsletter", email: email }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(result.error || "Could not subscribe.");
        newsletter.reset();
        button.textContent = "You're on the list";
      } catch (error) {
        button.textContent = "Try again";
      } finally {
        button.disabled = false;
        window.setTimeout(() => { button.textContent = original; }, 3500);
      }
    });
  }
})();
