const PROJECT_URL = Deno.env.get("SUPABASE_URL") || "https://zfgcovvfczjiqagrnfjr.supabase.co";
const ALLOWED_ORIGINS = new Set(["https://sobujkhamarofficial-ctrl.github.io"]);
const MODEL = "models/gemini-3.8-live";
const RATE_LIMIT_TIMEOUT_MS = 10000;

const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "null",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, accept",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
});
function json(body: Record<string, unknown>, status: number, origin: string | null, requestId: string) {
  return new Response(JSON.stringify({ ...body, requestId }), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Request-ID": requestId },
  });
}
function getServiceKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "string") return parsed;
      if (parsed && typeof parsed === "object") {
        const preferred = (parsed as Record<string, unknown>).default;
        if (typeof preferred === "string") return preferred;
        const values = Object.values(parsed).filter((v) => typeof v === "string") as string[];
        if (values.length) return values[0];
      }
    } catch { console.error("Supabase server-key environment could not be parsed."); }
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  throw new Error("Server database credentials are unavailable.");
}
function clientIp(req: Request): string {
  return (req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-client").slice(0, 120);
}
async function consumeRateLimit(ip: string, requestId: string): Promise<boolean> {
  const response = await fetch(PROJECT_URL + "/rest/v1/rpc/consume_store_rate_limit", {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": getServiceKey() },
    body: JSON.stringify({ p_action: "ai_live_voice", p_fingerprint: ip, p_limit: 8, p_window_seconds: 3600 }),
    signal: AbortSignal.timeout(RATE_LIMIT_TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    console.error("Live voice rate-limit check failed:", requestId, response.status, detail);
    throw new Error("Rate-limit service unavailable.");
  }
  return await response.json() === true;
}
const SYSTEM_INSTRUCTION = `You are FORME's live voice fashion shopping assistant for a Bangladesh-focused clothing store. Speak naturally and warmly, mainly in Bengali; use English if the customer does. Keep answers conversational and reasonably brief. Let the customer finish speaking; do not talk over them. You can understand spoken Bangla and English.

You have secure store tools:
- For every product-specific request, search_products before making claims. Translate spoken Bengali to concise English search terms. You may use category and budget_max.
- Use get_product_details only with an exact product ID found earlier in this session.
- Use prepare_order only when the customer clearly says they want to buy a specific selected product. Use exact product IDs from search results, and prepare a secure order form only; never claim the order is submitted or confirmed. The user must review and submit the form in the website chat.
- Use prepare_support_ticket when the customer explicitly asks for a human or a problem remains unresolved. It only prepares a secure form; the user must fill and submit it.
- Never invent products, product IDs, prices, discounts, size charts, stock or delivery promises. Product catalogue prices and availability are provisional and must be confirmed by the store team. needs_confirmation is not verified stock; preorder must be called preorder.
- Never ask for phone numbers, addresses, passwords, OTPs or payment details aloud. Personal information belongs only in secure website forms. Never ask for advance payment or card details.
- Be clear that a prepared order/support request is not submitted until the customer completes the website form.
- If a tool returns no match, say so honestly. Offer to show matches in the website text chat when useful.
- If asked to stop, end the conversation politely. Do not claim an action happened unless the tool result confirms it.`;

const LIVE_TOOLS = [{
  functionDeclarations: [
    { name: "search_products", description: "Search the live FORME catalogue before all product recommendations, comparisons or product-specific prices. Translate spoken Bengali into English keywords. Never invent matches.", parameters: { type: "OBJECT", properties: { query: { type: "STRING" }, category: { type: "STRING" }, budget_max: { type: "INTEGER" } }, required: ["query"] } },
    { name: "get_product_details", description: "Read details for an exact product returned by an earlier search.", parameters: { type: "OBJECT", properties: { product_id: { type: "STRING" } }, required: ["product_id"] } },
    { name: "prepare_order", description: "Prepare, but do not submit, a secure website order form after the customer clearly requests to buy selected products. Use catalogue IDs only.", parameters: { type: "OBJECT", properties: { items: { type: "ARRAY", items: { type: "OBJECT", properties: { product_id: { type: "STRING" }, quantity: { type: "INTEGER" }, requested_variant: { type: "STRING" } }, required: ["product_id", "quantity"] } } }, required: ["items"] } },
    { name: "prepare_support_ticket", description: "Prepare a secure support form only when the customer explicitly requests a human agent or an issue remains unresolved. It does not submit a ticket.", parameters: { type: "OBJECT", properties: { issue_type: { type: "STRING", enum: ["order", "delivery", "product", "payment", "other"] }, priority: { type: "STRING", enum: ["normal", "high"] }, summary: { type: "STRING" } }, required: ["issue_type", "priority", "summary"] } },
  ],
}];

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const requestId = crypto.randomUUID();

  if (req.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response("origin not allowed", { status: 403, headers: cors(null) });
    return new Response("ok", { headers: cors(origin) });
  }
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "This website origin is not allowed." }, 403, null, requestId);

  if (req.method === "GET") {
    return json({
      ok: true,
      service: "FORME Live Voice Token",
      status: Deno.env.get("AI_CUSTOMER_CARE_ENABLED") === "true" && Boolean(Deno.env.get("GEMINI_API_KEY")) ? "configured" : "paused",
      model: MODEL,
      note: "POST issues a short-lived, single-use Live API token. No long-lived Google API key is sent to browsers.",
    }, 200, origin, requestId);
  }
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405, origin, requestId);
  if (Deno.env.get("AI_CUSTOMER_CARE_ENABLED") !== "true" || !Deno.env.get("GEMINI_API_KEY")) {
    return json({ ok: false, status: "paused", error: "লাইভ ভয়েস সেবা সাময়িকভাবে বন্ধ আছে।" }, 503, origin, requestId);
  }

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > 4000) return json({ error: "Invalid request." }, 413, origin, requestId);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid voice session request." }, 400, origin, requestId);
  }

  try {
    if (!await consumeRateLimit(clientIp(req), requestId)) {
      return json({ ok: false, status: "rate_limited", error: "এই সংযোগ থেকে লাইভ ভয়েস ব্যবহারের সীমা পূর্ণ হয়েছে। পরে আবার চেষ্টা করুন।" }, 429, origin, requestId);
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY") || "";
    const now = Date.now();
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        uses: 1,
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model: MODEL,
          config: { responseModalities: ["AUDIO"], sessionResumption: {} },
        },
      }),
      signal: AbortSignal.timeout(12000),
    });
    const raw = await response.text();
    let result: Record<string, unknown> = {};
    try { result = JSON.parse(raw) as Record<string, unknown>; } catch { /* upstream body is not exposed */ }
    if (!response.ok || typeof result.name !== "string" || !result.name.startsWith("auth_tokens/")) {
      const upstream = result.error && typeof result.error === "object" ? result.error as Record<string, unknown> : {};
      console.error("Gemini ephemeral token request failed:", JSON.stringify({
        requestId, httpStatus: response.status,
        code: String(upstream.status || upstream.code || "").slice(0, 80),
        message: String(upstream.message || "").slice(0, 240),
      }));
      return json({ ok: false, error: response.status === 429 ? "লাইভ ভয়েস সেবা এখন ব্যস্ত। কিছুক্ষণ পর চেষ্টা করুন।" : "নিরাপদ ভয়েস সংযোগ তৈরি করা যায়নি। আবার চেষ্টা করুন।" }, response.status === 429 ? 429 : 502, origin, requestId);
    }
    return json({
      ok: true,
      token: result.name,
      model: MODEL,
      expiresAt: typeof result.expireTime === "string" ? result.expireTime : new Date(now + 30 * 60 * 1000).toISOString(),
      newSessionExpiresAt: typeof result.newSessionExpireTime === "string" ? result.newSessionExpireTime : new Date(now + 60 * 1000).toISOString(),
    }, 200, origin, requestId);
  } catch (error) {
    console.error("Live voice token service failed:", JSON.stringify({ requestId, errorName: error instanceof Error ? error.name : "UnknownError" }));
    return json({ ok: false, error: "লাইভ ভয়েস সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।" }, 503, origin, requestId);
  }
});
