(function () {
  "use strict";

  if (document.getElementById("forme-ai-customer-care")) return;

  const API_ENDPOINT = "https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/fashion-customer-care";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_EWY6B3OF8lOQB7uB7jBZRA_3MwimKRy";
  const MAX_LOCAL_HISTORY = 12;

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/fashionstore/assets/customer-care.css";
  document.head.appendChild(stylesheet);

  const shell = document.createElement("section");
  shell.id = "forme-ai-customer-care";
  shell.setAttribute("aria-label", "FORME AI Customer Care");
  shell.innerHTML = [
    '<button class="fcw-launcher" type="button" aria-label="Open FORME AI customer care" aria-expanded="false">',
      '<span class="fcw-launcher-icon" aria-hidden="true">✦</span>',
      '<span class="fcw-launcher-label">Chat with FORME</span>',
      '<span class="fcw-launcher-dot" aria-hidden="true"></span>',
    '</button>',
    '<section class="fcw-panel" role="dialog" aria-modal="false" aria-label="FORME Customer Care" hidden>',
      '<header class="fcw-header">',
        '<div class="fcw-brand-mark" aria-hidden="true">F</div>',
        '<div class="fcw-heading"><strong>FORME Customer Care</strong><span><i></i> AI assistant · Beta</span></div>',
        '<button class="fcw-close" type="button" aria-label="Close chat">×</button>',
      '</header>',
      '<div class="fcw-intro"><strong>How can we help?</strong><span>Ask about styles, collections or finding the right piece.</span></div>',
      '<div class="fcw-messages" aria-live="polite" aria-relevant="additions"></div>',
      '<div class="fcw-quick-replies" aria-label="Suggested questions">',
        '<button type="button" data-prompt="Can you help me choose a style?">Help me choose a style</button>',
        '<button type="button" data-prompt="Tell me about the products on this page.">About this page</button>',
        '<button type="button" data-prompt="What should I know about delivery and returns?">Delivery &amp; returns</button>',
      '</div>',
      '<form class="fcw-form">',
        '<label class="fcw-sr-only" for="fcw-input">Your message</label>',
        '<input id="fcw-input" name="message" type="text" maxlength="1000" autocomplete="off" placeholder="Type your message…" required>',
        '<button class="fcw-send" type="submit" aria-label="Send message"><span aria-hidden="true">➤</span></button>',
      '</form>',
      '<p class="fcw-disclaimer">Beta assistant. Product and policy details may need confirmation. Please do not share payment details, passwords or OTPs.</p>',
    '</section>'
  ].join("");

  document.body.appendChild(shell);

  const launcher = shell.querySelector(".fcw-launcher");
  const panel = shell.querySelector(".fcw-panel");
  const closeButton = shell.querySelector(".fcw-close");
  const messagesNode = shell.querySelector(".fcw-messages");
  const form = shell.querySelector(".fcw-form");
  const input = shell.querySelector("#fcw-input");
  const sendButton = shell.querySelector(".fcw-send");
  const quickReplies = shell.querySelector(".fcw-quick-replies");
  const conversation = [];
  let busy = false;

  function addMessage(role, text, save) {
    const bubble = document.createElement("div");
    bubble.className = "fcw-message " + (role === "user" ? "fcw-message-user" : "fcw-message-assistant");
    bubble.textContent = text;
    messagesNode.appendChild(bubble);
    if (save !== false) conversation.push({ role: role, text: text });
    while (conversation.length > MAX_LOCAL_HISTORY) conversation.shift();
    messagesNode.scrollTop = messagesNode.scrollHeight;
    return bubble;
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", open ? "true" : "false");
    launcher.classList.toggle("fcw-launcher-open", open);
    if (open) {
      window.setTimeout(function () { input.focus(); }, 30);
    }
  }

  function getPageContext() {
    const main = document.querySelector(".f-static-main, .page-shell, #forme-storefront main, main");
    const visibleText = main ? (main.innerText || main.textContent || "") : "";
    return [
      "Page title: " + (document.title || "FORME"),
      "Page path: " + window.location.pathname,
      "Visible page content: " + visibleText.replace(/\s+/g, " ").trim().slice(0, 1450)
    ].join("\n").slice(0, 1800);
  }

  async function sendMessage(text) {
    const message = (text || "").trim();
    if (!message || busy) return;

    const history = conversation.slice(-8).map(function (item) {
      return { role: item.role, text: item.text };
    });

    addMessage("user", message);
    input.value = "";
    busy = true;
    sendButton.disabled = true;
    input.disabled = true;
    quickReplies.hidden = true;
    const typing = document.createElement("div");
    typing.className = "fcw-message fcw-message-assistant fcw-typing";
    typing.textContent = "FORME is thinking…";
    messagesNode.appendChild(typing);
    messagesNode.scrollTop = messagesNode.scrollHeight;

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          message: message,
          history: history,
          pageContext: getPageContext()
        })
      });
      const data = await response.json().catch(function () { return {}; });
      typing.remove();
      if (!response.ok || !data.reply) {
        throw new Error(data.error || "The assistant could not reply. Please try again.");
      }
      addMessage("assistant", data.reply);
    } catch (error) {
      typing.remove();
      addMessage("assistant", error && error.message ? error.message : "Connection problem. Please try again shortly.", false);
    } finally {
      busy = false;
      sendButton.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  launcher.addEventListener("click", function () { setOpen(panel.hidden); });
  closeButton.addEventListener("click", function () { setOpen(false); });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    sendMessage(input.value);
  });
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input.value);
    }
  });
  quickReplies.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-prompt]");
    if (button) sendMessage(button.getAttribute("data-prompt"));
  });

  addMessage("assistant", "Hello! আমি FORME-এর AI Customer Care Assistant। কীভাবে সাহায্য করতে পারি?", false);
})();
