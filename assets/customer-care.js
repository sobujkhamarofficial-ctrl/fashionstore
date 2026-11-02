(function () {
  "use strict";
  const API = "https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/fashion-customer-care";
  const BASE = "/fashionstore/";
  const conversation = [];
  let ready = false, busy = false, panel, launch, input, sendButton, chat, statusLine, promptButtons = [];

  function addMessage(value, type) {
    const node = document.createElement("div");
    node.className = "fa-message" + (type ? " " + type : "");
    node.textContent = String(value || "");
    chat.appendChild(node);
    chat.scrollTop = chat.scrollHeight;
    return node;
  }

  function setAvailability(isReady, label) {
    ready = Boolean(isReady);
    statusLine.classList.toggle("ready", ready);
    statusLine.querySelector(".fa-status-label").textContent = label || (ready ? "Configured · first reply test pending" : "Assistant is temporarily unavailable");
    // The message composer stays available so visitors can retry or use contact links.
    input.disabled = busy;
    sendButton.disabled = busy;
    promptButtons.forEach(function (button) { button.disabled = !ready || busy; });
  }

  function toggle(open) {
    const next = typeof open === "boolean" ? open : !panel.classList.contains("is-open");
    panel.classList.toggle("is-open", next);
    panel.setAttribute("aria-hidden", String(!next));
    launch.setAttribute("aria-expanded", String(next));
    // Inline visibility is a fail-safe if an older cached stylesheet is still present.
    panel.style.opacity = next ? "1" : "0";
    panel.style.visibility = next ? "visible" : "hidden";
    panel.style.pointerEvents = next ? "auto" : "none";
    panel.style.transform = next ? "translateY(0)" : "translateY(10px)";
    panel.style.zIndex = "2";
    if (next) window.setTimeout(function () { input.focus(); }, 100);
  }

  function showTyping() {
    const node = document.createElement("div");
    node.className = "fa-message";
    node.setAttribute("aria-label", "FORME assistant is typing");
    node.innerHTML = '<span class="fa-typing"><i></i><i></i><i></i></span>';
    chat.appendChild(node);
    chat.scrollTop = chat.scrollHeight;
    return node;
  }

  async function refreshStatus() {
    try {
      const response = await fetch(API, { method: "GET", cache: "no-store", headers: { "Accept": "application/json" } });
      const data = await response.json().catch(function () { return {}; });
      if (response.ok && data.status === "configured") {
        setAvailability(true, "Configured · live Gemini check on first message");
        addMessage("হ্যালো! আমি FORME-এর ভার্চুয়াল সহকারী। পোশাকের স্টাইল, ফিট, সাইজ-গাইড, কেয়ার এবং ওয়েবসাইটের নীতিমালা সম্পর্কে প্রশ্ন করতে পারেন।", "");
      } else {
        setAvailability(false, "Temporarily paused");
        addMessage("FORME AI সহকারীটি আপাতত চালু করা যাচ্ছে না। অর্ডার সংক্রান্ত তথ্যের জন্য Order Tracking বা Contact পেজ ব্যবহার করুন।", "");
      }
    } catch (_) {
      setAvailability(false, "Connection unavailable");
      addMessage("সহকারীর সঙ্গে সংযোগ করা যাচ্ছে না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন অথবা Contact পেজ ব্যবহার করুন।", "");
    }
  }

  async function sendMessage(value) {
    const message = String(value || "").trim();
    if (!message || busy) return;
    input.value = "";
    addMessage(message, "user");
    const typing = showTyping();
    busy = true;
    setAvailability(ready, "Connecting to AI service…");
    const priorHistory = conversation.slice(-8).map(function (item) {
      return { role: item.role, text: item.text };
    });
    const controller = new AbortController();
    const timeout = window.setTimeout(function () { controller.abort(); }, 40_000);

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ message: message, history: priorHistory }),
        signal: controller.signal
      });
      const data = await response.json().catch(function () { return {}; });
      typing.remove();

      if (!response.ok || !data.ok || !data.reply) {
        if (response.status === 429 || data.status === "rate_limited") {
          setAvailability(true, "Message limit reached");
          addMessage("এই সংযোগ থেকে আপাতত নির্ধারিত মেসেজ সীমা পূর্ণ হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।", "system");
        } else if (response.status === 504 || data.status === "upstream_timeout") {
          ready = false;
          setAvailability(false, "Gemini connection timed out");
          addMessage("Google AI সার্ভার থেকে নির্ধারিত সময়ের মধ্যে উত্তর পাওয়া যায়নি। এটি IP বা সার্ভার-সংযোগের সমস্যাও হতে পারে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।", "system");
        } else if (response.status === 503 && data.status === "paused") {
          ready = false;
          setAvailability(false, "Temporarily paused");
          addMessage("AI সহকারীটি আপাতত বন্ধ আছে। অর্ডার ট্র্যাক করতে Order Tracking পেজে যান, অথবা Contact পেজে বার্তা পাঠান।", "system");
        } else if (response.status >= 500) {
          ready = false;
          setAvailability(false, "AI service connection issue");
          addMessage(data.error || "দুঃখিত, AI সার্ভার থেকে এখন উত্তর পাওয়া যাচ্ছে না। পরে আবার চেষ্টা করুন।", "system");
        } else {
          addMessage(data.error || "দুঃখিত, এই মুহূর্তে উত্তর তৈরি করা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।", "system");
        }
        return;
      }

      ready = true;
      setAvailability(true, "Online · reply received");
      conversation.push({ role: "user", text: message }, { role: "model", text: String(data.reply) });
      while (conversation.length > 8) conversation.shift();
      addMessage(data.reply, "");
    } catch (error) {
      typing.remove();
      ready = false;
      const timedOut = error && (error.name === "AbortError" || error.name === "TimeoutError");
      setAvailability(false, timedOut ? "Connection timed out" : "Connection unavailable");
      addMessage(
        timedOut
          ? "উত্তর পেতে বেশি সময় লাগছে। Google AI সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।"
          : "নেটওয়ার্ক সমস্যার কারণে উত্তর পাওয়া যায়নি। আবার চেষ্টা করুন।",
        "system"
      );
    } finally {
      window.clearTimeout(timeout);
      busy = false;
      setAvailability(ready, ready ? "Configured · Gemini replied successfully" : "Connection issue · you can retry");
      input.focus();
    }
  }

  function mount() {
    if (document.getElementById("forme-ai-widget")) return;
    const root = document.createElement("div");
    root.id = "forme-ai-widget";
    root.innerHTML =
      '<section class="fa-panel" role="dialog" aria-modal="false" aria-hidden="true" aria-label="FORME virtual assistant">' +
        '<header class="fa-head"><div class="fa-brand"><span class="fa-mark" aria-hidden="true">F.</span><div><div class="fa-title">FORME Concierge</div><div class="fa-subtitle">STYLE · FIT · EVERYDAY CARE</div></div></div><button type="button" class="fa-close" data-fa-close aria-label="Close assistant">×</button></header>' +
        '<div class="fa-status" role="status" aria-live="polite"><span class="fa-status-dot"></span><span class="fa-status-label">Checking secure connection…</span></div>' +
        '<div class="fa-chat" aria-live="polite" aria-label="Conversation"></div>' +
        '<div class="fa-prompts"><button class="fa-prompt" type="button" data-fa-prompt="Help me choose an everyday outfit.">Everyday style</button><button class="fa-prompt" type="button" data-fa-prompt="How should I choose the right clothing size and fit?">Size &amp; fit</button><button class="fa-prompt" type="button" data-fa-prompt="Please explain FORME delivery and return policies.">Delivery &amp; returns</button></div>' +
        '<div class="fa-warning">Please do not share phone numbers, order references, addresses, payment details, PINs or OTPs. <a href="' + BASE + 'pages/order-tracking.html">Track an order</a>.</div>' +
        '<form class="fa-form"><textarea class="fa-input" rows="1" maxlength="1200" placeholder="Write a message to FORME…" aria-label="Your message"></textarea><button class="fa-send" type="submit" aria-label="Send message"><svg viewBox="0 0 24 24"><path d="m21 3-7.5 18-3.7-7.8L2 9.5 21 3Z"/><path d="M9.8 13.2 14 9"/></svg></button></form>' +
        '<div class="fa-foot">AI responses are guidance only · Store availability is confirmed by our team</div>' +
      '</section>' +
      '<button type="button" class="fa-launch" aria-expanded="false" aria-label="Open FORME chat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.7-3A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 10h8M8 13.5h5"/></svg><span>ASK MORE</span><i class="fa-launch-dot" aria-hidden="true"></i></button>';
    document.body.appendChild(root);
    panel = root.querySelector(".fa-panel");
    launch = root.querySelector(".fa-launch");
    input = root.querySelector(".fa-input");
    sendButton = root.querySelector(".fa-send");
    chat = root.querySelector(".fa-chat");
    statusLine = root.querySelector(".fa-status");
    promptButtons = Array.from(root.querySelectorAll("[data-fa-prompt]"));
    launch.addEventListener("click", function () { toggle(); });
    root.querySelector("[data-fa-close]").addEventListener("click", function () { toggle(false); });
    root.querySelector(".fa-form").addEventListener("submit", function (event) {
      event.preventDefault();
      sendMessage(input.value);
    });
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage(input.value);
      }
    });
    promptButtons.forEach(function (button) {
      button.addEventListener("click", function () { sendMessage(button.dataset.faPrompt); });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && panel.classList.contains("is-open")) toggle(false);
    });
    refreshStatus();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
