const PROJECT_URL = Deno.env.get("SUPABASE_URL") || "https://zfgcovvfczjiqagrnfjr.supabase.co";
const ADMIN_EMAIL = "sobujkhamar.official@gmail.com";
const ALLOWED_ORIGINS = new Set(["https://sobujkhamarofficial-ctrl.github.io"]);
const MAX_REQUESTS_PER_MINUTE = 6;
const rateBuckets = new Map<string, { start: number; count: number }>();

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "null",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
function json(body: Record<string, unknown>, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
function text(value: unknown, max = 2000): string { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function limited(req: Request): boolean {
  const now = Date.now();
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = (forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown").slice(0, 100);
  const current = rateBuckets.get(ip);
  if (!current || now - current.start >= 60_000) { rateBuckets.set(ip, { start: now, count: 1 }); return false; }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_MINUTE;
}
function getServiceKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "string") return parsed;
      if (parsed && typeof parsed === "object") {
        const values = Object.values(parsed).filter((v) => typeof v === "string") as string[];
        const preferred = (parsed as Record<string, unknown>).default;
        if (typeof preferred === "string") return preferred;
        if (values.length) return values[0];
      }
    } catch { console.error("SUPABASE_SECRET_KEYS could not be parsed."); }
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  throw new Error("Supabase server key is not configured.");
}
async function callRpc(name: string, args: Record<string, unknown>) {
  const serviceKey = getServiceKey();
  const response = await fetch(PROJECT_URL + "/rest/v1/rpc/" + name, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": serviceKey },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = result && typeof result === "object" && "message" in result ? text((result as Record<string, unknown>).message, 300) : "Database request failed";
    console.error("Store RPC failed:", name, response.status, detail);
    throw new Error(response.status === 400 ? detail : "The store could not save this request. Please try again.");
  }
  return result;
}

async function consumeRateLimit(action: string, fingerprint: string, limit: number, windowSeconds: number): Promise<boolean> {
  const result = await callRpc("consume_store_rate_limit", {
    p_action: action,
    p_fingerprint: fingerprint || "unknown-client",
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  return result === true;
}


async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

function createSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function adminFetch(path: string, init: RequestInit = {}) {
  const serviceKey = getServiceKey();
  const headers = new Headers(init.headers || {});
  headers.set("apikey", serviceKey);
  headers.delete("Authorization");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return await fetch(PROJECT_URL + path, { ...init, headers, signal: init.signal || AbortSignal.timeout(15_000) });
}


function parseTextArray(value: unknown, maxItems: number, maxLength: number): string[] | null {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const items: string[] = [];
  const seen = new Set<string>();
  for (const raw of value) {
    if (typeof raw !== "string") return null;
    const item = raw.trim();
    if (!item || item.length > maxLength) return null;
    const key = item.toLowerCase();
    if (seen.has(key)) return null;
    seen.add(key);
    items.push(item);
  }
  return items;
}

async function adminLogin(body: Record<string, unknown>, req: Request, origin: string | null) {
  const serverPassword = Deno.env.get("FORME_ADMIN_PASSWORD") || "";
  if (serverPassword.length < 16 || serverPassword.length > 200) {
    return json({ error: "The admin password is not configured. Save a password of 16–200 characters in Supabase Edge Function Secrets as FORME_ADMIN_PASSWORD." }, 503, origin);
  }

  const email = text(body.email, 254).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "unknown-client").slice(0, 100);

  try {
    if (!await consumeRateLimit("admin_login", ip, 8, 900)) {
      return json({ error: "Too many sign-in attempts. Please try again in 15 minutes." }, 429, origin);
    }
  } catch (error) {
    console.error("Admin login rate limiter failed:", error instanceof Error ? error.message : "unknown error");
    return json({ error: "Admin sign-in is temporarily unavailable. Please try again." }, 503, origin);
  }

  if (password.length > 200 || !constantTimeEqual(email, ADMIN_EMAIL) || !constantTimeEqual(password, serverPassword)) {
    return json({ error: "Invalid admin email or password." }, 401, origin);
  }

  const accessToken = createSessionToken();
  const tokenHash = await sha256Hex(accessToken);
  const passwordFingerprint = await sha256Hex(serverPassword);
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

  const response = await adminFetch("/rest/v1/store_admin_sessions", {
    method: "POST",
    headers: { "Prefer": "return=minimal" },
    body: JSON.stringify({ token_hash: tokenHash, password_fingerprint: passwordFingerprint, expires_at: expiresAt }),
  });
  if (!response.ok) {
    console.error("Admin session could not be stored:", response.status);
    return json({ error: "The server could not start an admin session. Please try again." }, 503, origin);
  }

  return json({ ok: true, access_token: accessToken, expires_at: expiresAt, user: { email: ADMIN_EMAIL } }, 200, origin);
}

async function getAdminUser(req: Request): Promise<Record<string, unknown> | null> {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!/^[0-9a-f]{64}$/i.test(token)) return null;

  const serverPassword = Deno.env.get("FORME_ADMIN_PASSWORD") || "";
  if (serverPassword.length < 16 || serverPassword.length > 200) return null;

  const tokenHash = await sha256Hex(token);
  const passwordFingerprint = await sha256Hex(serverPassword);
  const query = new URLSearchParams({
    select: "id",
    token_hash: "eq." + tokenHash,
    password_fingerprint: "eq." + passwordFingerprint,
    revoked_at: "is.null",
    expires_at: "gt." + new Date().toISOString(),
    limit: "1",
  });
  const response = await adminFetch("/rest/v1/store_admin_sessions?" + query.toString());
  const rows = await response.json().catch(() => []);
  if (!response.ok || !Array.isArray(rows) || !rows.length) return null;

  return { email: ADMIN_EMAIL, session_id: rows[0].id, token_hash: tokenHash };
}

function adminInputFields(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const data = input as Record<string, unknown>;
  const fields: Record<string, unknown> = {};
  const allowedStatuses = new Set(["pending_review","contacted","confirmed","processing","shipped","delivered","cancelled","rejected"]);
  const allowedVerification = new Set(["needs_manual_confirmation","verified"]);
  const allowedPaymentMethods = new Set(["to_be_confirmed","cash_on_delivery","manual_transfer","online_gateway"]);
  const allowedPaymentStatuses = new Set(["not_collected","pending","paid","refunded","failed"]);
  if (data.status !== undefined) {
    if (typeof data.status !== "string" || !allowedStatuses.has(data.status)) throw new Error("Choose a valid order status.");
    fields.status = data.status;
  }
  if (data.price_verification !== undefined) {
    if (typeof data.price_verification !== "string" || !allowedVerification.has(data.price_verification)) throw new Error("Choose a valid price-verification state.");
    fields.price_verification = data.price_verification;
  }
  if (data.payment_method !== undefined) {
    if (typeof data.payment_method !== "string" || !allowedPaymentMethods.has(data.payment_method)) throw new Error("Choose a valid payment method.");
    fields.payment_method = data.payment_method;
  }
  if (data.payment_status !== undefined) {
    if (typeof data.payment_status !== "string" || !allowedPaymentStatuses.has(data.payment_status)) throw new Error("Choose a valid payment status.");
    fields.payment_status = data.payment_status;
  }
  for (const key of ["delivery_charge_bdt","final_total_bdt"] as const) {
    if (data[key] !== undefined) {
      const value = data[key];
      if (value !== null && (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 5_000_000)) throw new Error("Enter a valid BDT amount.");
      fields[key] = value;
    }
  }
  for (const [key,max] of [["courier_name",100],["courier_tracking_number",120],["internal_note",1000]] as const) {
    if (data[key] !== undefined) {
      const raw = data[key];
      if (raw !== null && typeof raw !== "string") throw new Error("One of the text fields is invalid.");
      const value = raw === null ? null : raw.trim();
      if (typeof value === "string" && value.length > max) throw new Error("One of the text fields is too long.");
      fields[key] = value || null;
    }
  }
  if (data.estimated_delivery_at !== undefined) {
    const value = data.estimated_delivery_at;
    if (value !== null && (typeof value !== "string" || Number.isNaN(Date.parse(value)))) throw new Error("Enter a valid estimated delivery date.");
    fields.estimated_delivery_at = value;
  }
  if (!Object.keys(fields).length) throw new Error("No order changes were provided.");
  return fields;
}

async function adminAction(body: Record<string, unknown>, req: Request, origin: string | null) {
  const operation = text(body.operation, 30);
  if (operation === "login") return await adminLogin(body, req, origin);

  const user = await getAdminUser(req);
  if (!user) return json({ error: "Admin sign-in is required or the session has expired. Please sign in again." }, 401, origin);

  if (operation === "logout") {
    const sessionId = text(user.session_id, 36);
    const response = await adminFetch("/rest/v1/store_admin_sessions?id=eq." + encodeURIComponent(sessionId) + "&revoked_at=is.null", {
      method: "PATCH",
      body: JSON.stringify({ revoked_at: new Date().toISOString() }),
    });
    if (!response.ok) {
      console.error("Admin session revocation failed:", response.status);
      return json({ error: "The session could not be closed on the server." }, 503, origin);
    }
    return json({ ok: true }, 200, origin);
  }

  if (operation === "messages") {
    const response = await adminFetch("/rest/v1/store_contact_messages?select=id,name,phone,email,subject,message,status,created_at&order=created_at.desc&limit=200");
    const messages = await response.json().catch(() => []);
    if (!response.ok || !Array.isArray(messages)) {
      console.error("Admin support inbox failed:", response.status);
      return json({ error: "Customer messages could not be loaded. Please refresh." }, 502, origin);
    }
    return json({ ok: true, messages }, 200, origin);
  }

  if (operation === "message-update") {
    const id = text(body.message_id, 36);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return json({ error: "Invalid message reference." }, 400, origin);
    const status = text(body.status, 20);
    if (!["new","in_progress","resolved","spam"].includes(status)) return json({ error: "Choose a valid message status." }, 400, origin);
    const response = await adminFetch("/rest/v1/store_contact_messages?id=eq." + encodeURIComponent(id), {
      method: "PATCH",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify({ status }),
    });
    const rows = await response.json().catch(() => []);
    if (!response.ok || !Array.isArray(rows) || !rows.length) return json({ error: "The customer message could not be updated." }, 502, origin);
    return json({ ok: true, message: rows[0] }, 200, origin);
  }

  if (operation === "ai-feedback") {
    try {
      const rows = await callRpc("list_store_ai_feedback", { p_limit: 200 });
      if (!Array.isArray(rows)) return json({ error: "AI feedback could not be loaded." }, 502, origin);
      const stats = {
        total: rows.length,
        positive: rows.filter((row: Record<string, unknown>) => row.rating === 1).length,
        negative: rows.filter((row: Record<string, unknown>) => row.rating === -1).length,
        frustrated: rows.filter((row: Record<string, unknown>) => ["angry","frustrated"].includes(String(row.sentiment))).length,
      };
      return json({ ok: true, feedback: rows, stats }, 200, origin);
    } catch (error) {
      console.error("Admin AI feedback read failed:", error instanceof Error ? error.message : "unknown error");
      return json({ error: "AI feedback could not be loaded. Please refresh." }, 502, origin);
    }
  }

  if (operation === "products") {
    const response = await adminFetch("/rest/v1/store_products?select=id,name,category,description,price_bdt,compare_at_price_bdt,image_url,is_active,details_verified,price_verified,availability_status,audience,audience_verified,audience_verified_at,season_tags,season_verified,season_verified_at,size_options,color_options,sku,stock_quantity,stock_checked_at,material,fit,pattern,search_keywords,attributes_verified,attributes_verified_at,price_verified_at,updated_at&order=category.asc,name.asc&limit=500");
    const products = await response.json().catch(() => []);
    if (!response.ok || !Array.isArray(products)) {
      console.error("Admin product list failed:", response.status);
      return json({ error: "Products could not be loaded. Please refresh." }, 502, origin);
    }
    return json({ ok: true, products }, 200, origin);
  }

  if (operation === "list") {
    const response = await adminFetch("/rest/v1/store_orders?select=*,store_order_items(*)&order=created_at.desc&limit=100");
    const orders = await response.json().catch(() => []);
    if (!response.ok || !Array.isArray(orders)) {
      console.error("Admin order list failed:", response.status);
      return json({ error: "Orders could not be loaded. Please refresh." }, 502, origin);
    }
    const statsResponse = await adminFetch("/rest/v1/store_orders?select=id,status,subtotal_bdt,final_total_bdt,payment_status&limit=1000");
    const allStats = await statsResponse.json().catch(() => []);
    const rows = Array.isArray(allStats) ? allStats : orders;
    const totalPaid = rows.filter((o) => o.payment_status === "paid").reduce((sum, o) => sum + Number(o.final_total_bdt || o.subtotal_bdt || 0), 0);
    const stats = {
      total: rows.length,
      awaiting: rows.filter((o) => ["pending_review","contacted"].includes(o.status)).length,
      active: rows.filter((o) => ["confirmed","processing","shipped"].includes(o.status)).length,
      delivered: rows.filter((o) => o.status === "delivered").length,
      paidBdt: totalPaid,
    };
    const email = typeof user.email === "string" ? user.email : "";
    return json({ ok: true, user: { email }, orders, stats }, 200, origin);
  }

  if (operation === "product-bulk-update") {
    if (!Array.isArray(body.products) || body.products.length < 1 || body.products.length > 250) {
      return json({ error: "Import between 1 and 250 products at a time." }, 400, origin);
    }
    const seen = new Set<string>();
    const entries: Array<{ id: string; fields: Record<string, unknown> }> = [];
    const allowedStatuses = new Set(["needs_confirmation","in_stock","out_of_stock","preorder","archived"]);
    const imagePattern = /^https:\/\/images\.unsplash\.com\/photo-[A-Za-z0-9-]+(?:\?[A-Za-z0-9_=&%.,-]*)?$|^\/fashionstore\/assets\/fashion-photos\/[a-z0-9-]+\.jpg$/i;
    for (const item of body.products) {
      if (!item || typeof item !== "object" || Array.isArray(item)) return json({ error: "Every CSV row must be a product record." }, 400, origin);
      const row = item as Record<string, unknown>;
      const id = text(row.id, 100);
      if (!/^[a-z0-9][a-z0-9-]{0,99}$/i.test(id) || seen.has(id)) return json({ error: "A product ID is invalid or duplicated: " + id }, 400, origin);
      seen.add(id);
      const name = text(row.name, 180), category = text(row.category, 120), description = text(row.description, 2000);
      const imageUrl = text(row.image_url, 1000);
      const price = row.price_bdt, compare = row.compare_at_price_bdt;
      const availability = text(row.availability_status, 30);
      const active = row.is_active, verified = row.details_verified;
      if (!name || !category || !description || !imagePattern.test(imageUrl)) return json({ error: "A CSV row has missing product text or an unsupported image URL: " + id }, 400, origin);
      if (!Number.isInteger(price) || Number(price) < 0 || Number(price) > 5_000_000) return json({ error: "Enter a valid whole-number BDT price for " + id }, 400, origin);
      if (compare !== null && compare !== undefined && (!Number.isInteger(compare) || Number(compare) < 0 || Number(compare) > 5_000_000)) return json({ error: "Enter a valid comparison price for " + id }, 400, origin);
      if (typeof active !== "boolean" || typeof verified !== "boolean" || !allowedStatuses.has(availability)) return json({ error: "Invalid visibility, verification or availability value for " + id }, 400, origin);
      if (verified && (Number(price) <= 0 || availability === "needs_confirmation" || availability === "archived")) return json({ error: "A verified product needs a positive price and a final stock status: " + id }, 400, origin);
      if ((availability === "in_stock" || availability === "preorder") && verified !== true) return json({ error: "Verify the product details before marking it in stock or preorder: " + id }, 400, origin);
      if (compare !== null && compare !== undefined && Number(compare) > 0 && Number(compare) < Number(price)) return json({ error: "The comparison price must be at least the current price for " + id }, 400, origin);
      const allowedAudiences = new Set(["men","women","teens","kids","unisex"]);
      const allowedSeasons = new Set(["spring","summer","autumn","winter","all_season"]);
      const audience = row.audience === "" || row.audience === null ? null : text(row.audience,20).toLowerCase();
      const seasonTags = parseTextArray(row.season_tags,5,20);
      const sizes = parseTextArray(row.size_options,40,30);
      const colors = parseTextArray(row.color_options,40,50);
      const keywords = parseTextArray(row.search_keywords,40,80);
      if (audience !== null && !allowedAudiences.has(audience)) return json({ error: "Invalid audience for " + id }, 400, origin);
      if (row.audience_verified === true && !audience) return json({ error: "Audience is required before marking it verified: " + id }, 400, origin);
      if (!seasonTags || seasonTags.some((value) => !allowedSeasons.has(value)) || (seasonTags.includes("all_season") && seasonTags.length > 1)) return json({ error: "Invalid season tags for " + id }, 400, origin);
      if (row.season_verified === true && seasonTags.length === 0) return json({ error: "Season tags are required before marking them verified: " + id }, 400, origin);
      if (!sizes || !colors || !keywords) return json({ error: "Invalid or duplicate size, colour or search-keyword values for " + id }, 400, origin);
      const sku = row.sku === "" || row.sku === null ? null : text(row.sku,80);
      const material = row.material === "" || row.material === null ? null : text(row.material,120);
      const fit = row.fit === "" || row.fit === null ? null : text(row.fit,80);
      const pattern = row.pattern === "" || row.pattern === null ? null : text(row.pattern,80);
      if (row.stock_quantity !== null && row.stock_quantity !== "" && (!Number.isInteger(row.stock_quantity) || Number(row.stock_quantity) < 0 || Number(row.stock_quantity) > 2_000_000)) return json({ error: "Invalid stock quantity for " + id }, 400, origin);
      if (row.attributes_verified === true && typeof row.attributes_verified !== "boolean") return json({ error: "Invalid attributes verification for " + id }, 400, origin);
      if (row.price_verified === true && (typeof row.price_verified !== "boolean" || Number(price) <= 0)) return json({ error: "A verified price must be positive for " + id }, 400, origin);
      entries.push({
        id,
        fields: {
          name, category, description, price_bdt: Number(price),
          compare_at_price_bdt: compare === "" ? null : compare,
          image_url: imageUrl,
          availability_status: availability,
          is_active: active,
          details_verified: verified,
          audience,
          audience_verified: row.audience_verified === true,
          audience_verified_at: row.audience_verified === true ? new Date().toISOString() : null,
          season_tags: seasonTags,
          season_verified: row.season_verified === true,
          season_verified_at: row.season_verified === true ? new Date().toISOString() : null,
          size_options: sizes,
          color_options: colors,
          sku,
          stock_quantity: row.stock_quantity === "" || row.stock_quantity === null ? null : row.stock_quantity,
          stock_checked_at: row.stock_quantity === "" || row.stock_quantity === null ? null : new Date().toISOString(),
          material,
          fit,
          pattern,
          search_keywords: keywords,
          attributes_verified: row.attributes_verified === true,
          attributes_verified_at: row.attributes_verified === true ? new Date().toISOString() : null,
          price_verified: row.price_verified === true,
          price_verified_at: row.price_verified === true ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
      });
    }

    const ids = entries.map(entry => entry.id);
    const existingResponse = await adminFetch("/rest/v1/store_products?select=id&id=in.(" + ids.join(",") + ")");
    const existingRows = await existingResponse.json().catch(() => []);
    const existingIds = new Set(Array.isArray(existingRows) ? existingRows.map((row: Record<string, unknown>) => String(row.id)) : []);
    const missing = ids.filter(id => !existingIds.has(id));
    if (!existingResponse.ok || missing.length) return json({ error: "Unknown product IDs in CSV: " + missing.slice(0, 8).join(", ") }, 400, origin);

    let updated = 0;
    for (let offset = 0; offset < entries.length; offset += 8) {
      const batch = entries.slice(offset, offset + 8);
      const results = await Promise.all(batch.map(entry => adminFetch("/rest/v1/store_products?id=eq." + encodeURIComponent(entry.id), {
        method: "PATCH",
        headers: { "Prefer": "return=minimal" },
        body: JSON.stringify(entry.fields),
      })));
      const successes = results.filter(response => response.ok).length;
      updated += successes;
      const failures = batch.length - successes;
      if (failures) {
        console.error("Bulk product update partially failed:", { updated, batchSize: batch.length, failures });
        return json({ error: "Some products could not be updated. " + updated + " rows were saved before the error; refresh the catalogue and retry the remaining rows.", updated_count: updated }, 502, origin);
      }
    }
    return json({ ok: true, updated_count: updated }, 200, origin);
  }

  if (operation === "product-update") {
    const id = text(body.product_id, 100);
    if (!/^[a-z0-9][a-z0-9-]{0,99}$/i.test(id)) return json({ error: "Invalid product reference." }, 400, origin);
    if (!body.fields || typeof body.fields !== "object" || Array.isArray(body.fields)) return json({ error: "Product changes are missing." }, 400, origin);
    const input = body.fields as Record<string, unknown>;
    const fields: Record<string, unknown> = {};
    const allowedStatuses = new Set(["needs_confirmation","in_stock","out_of_stock","preorder","archived"]);
    const stringFields: Array<[string, number]> = [["name",180],["category",120],["description",2000]];
    for (const [key,max] of stringFields) {
      if (input[key] !== undefined) {
        if (typeof input[key] !== "string") return json({ error: "Product text fields must be valid text." }, 400, origin);
        const value = (input[key] as string).trim();
        if (!value || value.length > max) return json({ error: "Product name, category and description must not be empty or too long." }, 400, origin);
        fields[key] = value;
      }
    }
    for (const key of ["price_bdt","compare_at_price_bdt"] as const) {
      if (input[key] !== undefined) {
        const value = input[key];
        if (value !== null && (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 5_000_000)) {
          return json({ error: "Enter a valid BDT price." }, 400, origin);
        }
        fields[key] = value;
      }
    }
    if (input.image_url !== undefined) {
      if (typeof input.image_url !== "string") return json({ error: "Enter a valid product image path." }, 400, origin);
      const imageUrl = input.image_url.trim();
      const allowedImage = /^https:\/\/images\.unsplash\.com\/photo-[A-Za-z0-9-]+(?:\?[A-Za-z0-9_=&%.,-]*)?$/.test(imageUrl)
        || /^\/fashionstore\/assets\/fashion-photos\/[a-z0-9-]+\.jpg$/i.test(imageUrl);
      if (!allowedImage) return json({ error: "Use an approved Unsplash image URL or a FORME-hosted fashion photo." }, 400, origin);
      fields.image_url = imageUrl;
    }
    for (const key of ["is_active","details_verified"] as const) {
      if (input[key] !== undefined) {
        if (typeof input[key] !== "boolean") return json({ error: "Product status flags must be true or false." }, 400, origin);
        fields[key] = input[key];
      }
    }
    if (input.availability_status !== undefined) {
      if (typeof input.availability_status !== "string" || !allowedStatuses.has(input.availability_status)) {
        return json({ error: "Choose a valid product availability status." }, 400, origin);
      }
      fields.availability_status = input.availability_status;
    }

    const allowedAudiences = new Set(["men","women","teens","kids","unisex"]);
    const allowedSeasons = new Set(["spring","summer","autumn","winter","all_season"]);
    if (input.audience !== undefined) {
      const value = input.audience === null || input.audience === "" ? null : text(input.audience, 20).toLowerCase();
      if (value !== null && !allowedAudiences.has(value)) return json({ error: "Choose a valid audience segment." }, 400, origin);
      fields.audience = value;
    }
    if (input.audience_verified !== undefined) {
      if (typeof input.audience_verified !== "boolean") return json({ error: "Audience verification must be true or false." }, 400, origin);
      fields.audience_verified = input.audience_verified;
      fields.audience_verified_at = input.audience_verified ? new Date().toISOString() : null;
    }
    if (input.season_tags !== undefined) {
      const values = parseTextArray(input.season_tags, 5, 20);
      if (!values || values.some((value) => !allowedSeasons.has(value))) return json({ error: "Use valid season tags: spring, summer, autumn, winter or all_season." }, 400, origin);
      if (values.includes("all_season") && values.length > 1) return json({ error: "all_season cannot be combined with other seasons." }, 400, origin);
      fields.season_tags = values;
    }
    if (input.season_verified !== undefined) {
      if (typeof input.season_verified !== "boolean") return json({ error: "Season verification must be true or false." }, 400, origin);
      fields.season_verified = input.season_verified;
      fields.season_verified_at = input.season_verified ? new Date().toISOString() : null;
    }
    for (const [key, maxItems, maxLength] of [
      ["size_options",40,30],["color_options",40,50],["search_keywords",40,80],
    ] as const) {
      if (input[key] !== undefined) {
        const values = parseTextArray(input[key], maxItems, maxLength);
        if (!values) return json({ error: "Invalid or duplicate values in " + key + "." }, 400, origin);
        fields[key] = values;
      }
    }
    for (const [key, max] of [["sku",80],["material",120],["fit",80],["pattern",80]] as const) {
      if (input[key] !== undefined) {
        if (input[key] !== null && typeof input[key] !== "string") return json({ error: "Invalid text value for " + key + "." }, 400, origin);
        const value = input[key] === null ? "" : (input[key] as string).trim();
        if (value.length > max) return json({ error: key + " is too long." }, 400, origin);
        fields[key] = value || null;
      }
    }
    if (input.stock_quantity !== undefined) {
      const value = input.stock_quantity;
      if (value !== null && (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 2_000_000)) return json({ error: "Stock quantity must be blank or a whole number from 0 to 2,000,000." }, 400, origin);
      fields.stock_quantity = value;
      fields.stock_checked_at = value === null ? null : new Date().toISOString();
    }
    if (input.attributes_verified !== undefined) {
      if (typeof input.attributes_verified !== "boolean") return json({ error: "Attribute verification must be true or false." }, 400, origin);
      fields.attributes_verified = input.attributes_verified;
      fields.attributes_verified_at = input.attributes_verified ? new Date().toISOString() : null;
    }
    if (input.price_verified !== undefined) {
      if (typeof input.price_verified !== "boolean") return json({ error: "Price verification must be true or false." }, 400, origin);
      fields.price_verified = input.price_verified;
      fields.price_verified_at = input.price_verified ? new Date().toISOString() : null;
    }
    if (!Object.keys(fields).length) return json({ error: "No product changes were supplied." }, 400, origin);

    const currentResponse = await adminFetch("/rest/v1/store_products?id=eq." + encodeURIComponent(id) + "&select=id,name,category,description,price_bdt,image_url,details_verified,availability_status,audience,audience_verified,season_tags,season_verified,attributes_verified,price_verified&limit=1");
    const currentRows = await currentResponse.json().catch(() => []);
    const current = Array.isArray(currentRows) ? currentRows[0] : null;
    if (!currentResponse.ok || !current) return json({ error: "This product could not be found." }, 404, origin);

    const finalProduct = { ...current, ...fields };
    if (finalProduct.audience_verified === true && !finalProduct.audience) return json({ error: "Select an audience before marking it verified." }, 400, origin);
    if (finalProduct.season_verified === true && (!Array.isArray(finalProduct.season_tags) || finalProduct.season_tags.length === 0)) return json({ error: "Add at least one season tag before marking seasons verified." }, 400, origin);
    if (finalProduct.price_verified === true && Number(finalProduct.price_bdt) <= 0) return json({ error: "Enter a positive price before marking the price verified." }, 400, origin);
    if (finalProduct.details_verified === true) {
      if (!finalProduct.name || !finalProduct.category || !finalProduct.description || !finalProduct.image_url || Number(finalProduct.price_bdt) <= 0) {
        return json({ error: "Add a real name, category, description, image and positive price before marking this product verified." }, 400, origin);
      }
      if (finalProduct.availability_status === "needs_confirmation" || finalProduct.availability_status === "archived") {
        return json({ error: "A verified product must be marked in stock, out of stock or preorder." }, 400, origin);
      }
    }
    if ((finalProduct.availability_status === "in_stock" || finalProduct.availability_status === "preorder") && finalProduct.details_verified !== true) {
      return json({ error: "Verify the product details before marking it in stock or available for preorder." }, 400, origin);
    }
    if (finalProduct.compare_at_price_bdt !== null && finalProduct.compare_at_price_bdt !== undefined
      && Number(finalProduct.compare_at_price_bdt) > 0 && Number(finalProduct.compare_at_price_bdt) < Number(finalProduct.price_bdt)) {
      return json({ error: "The comparison price must be at least the current selling price." }, 400, origin);
    }
    fields.updated_at = new Date().toISOString();
    const response = await adminFetch("/rest/v1/store_products?id=eq." + encodeURIComponent(id), {
      method: "PATCH",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify(fields),
    });
    const rows = await response.json().catch(() => []);
    if (!response.ok || !Array.isArray(rows) || !rows.length) {
      console.error("Admin product update failed:", response.status);
      return json({ error: "The product could not be updated. Please try again." }, 502, origin);
    }
    return json({ ok: true, product: rows[0] }, 200, origin);
  }

  if (operation === "update") {
    const id = text(body.order_id, 36);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return json({ error: "Invalid order reference." }, 400, origin);
    const fields = adminInputFields(body.fields);
    if (!fields) return json({ error: "No order changes were supplied." }, 400, origin);
    const status = fields.status;
    if (status === "confirmed" || status === "processing" || status === "shipped" || status === "delivered") {
      const response = await adminFetch("/rest/v1/store_orders?id=eq." + encodeURIComponent(id) + "&select=id,subtotal_bdt,delivery_charge_bdt,final_total_bdt,price_verification");
      const rows = await response.json().catch(() => []);
      const existing = Array.isArray(rows) ? rows[0] : null;
      if (!response.ok || !existing) return json({ error: "This order could not be found." }, 404, origin);
      const verification = Object.prototype.hasOwnProperty.call(fields, "price_verification") ? fields.price_verification : existing.price_verification;
      const delivery = Object.prototype.hasOwnProperty.call(fields, "delivery_charge_bdt") ? fields.delivery_charge_bdt : existing.delivery_charge_bdt;
      const finalTotal = Object.prototype.hasOwnProperty.call(fields, "final_total_bdt") ? fields.final_total_bdt : existing.final_total_bdt;
      if (verification !== "verified" || delivery === null || finalTotal === null || Number(finalTotal) < Number(existing.subtotal_bdt) + Number(delivery)) {
        return json({ error: "Before confirming or dispatching, verify the price and enter the delivery charge and final total." }, 400, origin);
      }
    }
    if (status === "shipped") fields.dispatched_at = new Date().toISOString();
    if (status === "delivered") fields.delivered_at = new Date().toISOString();
    fields.updated_at = new Date().toISOString();
    const response = await adminFetch("/rest/v1/store_orders?id=eq." + encodeURIComponent(id), {
      method: "PATCH",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify(fields),
    });
    const rows = await response.json().catch(() => []);
    if (!response.ok || !Array.isArray(rows) || !rows.length) {
      console.error("Admin order update failed:", response.status);
      return json({ error: "The order could not be updated. Please try again." }, 502, origin);
    }
    return json({ ok: true, order: rows[0] }, 200, origin);
  }
  return json({ error: "Unknown admin operation." }, 400, origin);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response("origin not allowed", { status: 403, headers: cors(null) });
    return new Response("ok", { headers: cors(origin) });
  }
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "This website origin is not allowed." }, 403, null);
  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.get("action") === "products") {
      try {
        const query = new URLSearchParams({
          select: "id,name,category,description,price_bdt,compare_at_price_bdt,image_url,is_active,availability_status,details_verified,price_verified,audience,audience_verified,season_tags,season_verified,size_options,color_options,material,fit,pattern,attributes_verified",
          order: "category.asc,name.asc",
          limit: "500",
        });
        const response = await adminFetch("/rest/v1/store_products?" + query.toString());
        const products = await response.json().catch(() => []);
        if (!response.ok || !Array.isArray(products)) {
          console.error("Public catalogue request failed:", response.status);
          return json({ error: "The catalogue is temporarily unavailable." }, 502, origin);
        }
        return json({ ok: true, products, count: products.length, catalogue_status: "pilot_confirmation_required" }, 200, origin);
      } catch (error) {
        console.error("Public catalogue request failed:", error instanceof Error ? error.message : "unknown error");
        return json({ error: "The catalogue is temporarily unavailable." }, 502, origin);
      }
    }
    if (url.searchParams.get("action") === "reviews") {
      try {
        const reviews = await callRpc("list_store_product_reviews", { p_limit: 20 });
        return json({ ok: true, reviews }, 200, origin);
      } catch {
        return json({ error: "Published reviews are temporarily unavailable." }, 502, origin);
      }
    }
    return json({ ok: true, service: "FORME Storefront Commerce API", status: "ready" }, 200, origin);
  }
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405, origin);
  if (limited(req)) return json({ error: "Too many requests. Please wait a minute and try again." }, 429, origin);
  const length = Number(req.headers.get("content-length") || "0");
  if (length > 20_000) return json({ error: "Request is too large." }, 413, origin);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Please send a valid request." }, 400, origin); }
  if (text(body.website, 200)) return json({ received: true }, 202, origin);
  const action = text(body.action, 30);
  try {
    if (action === "admin") return await adminAction(body, req, origin);
    if (action === "ai-support-ticket") {
      const name = text(body.name, 120);
      const phone = text(body.phone, 30);
      const email = text(body.email, 254).toLowerCase();
      const issueType = text(body.issue_type, 30);
      const priority = text(body.priority, 20);
      const summary = text(body.summary, 900);
      const consent = body.privacy_consent === true;
      const allowedIssues = new Set(["order","delivery","product","payment","other"]);
      const validPhone = /^(?:\+?88)?01[3-9]\d{8}$/.test(phone);
      if (!name || !validPhone || (email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email))
        || !allowedIssues.has(issueType) || !["normal","high"].includes(priority)
        || summary.length < 20 || !consent) {
        return json({ error: "Please enter your name, a valid Bangladesh mobile number, issue summary and accept the privacy notice." }, 400, origin);
      }
      const fingerprint = phone || email || req.headers.get("x-forwarded-for") || "unknown-client";
      if (!await consumeRateLimit("contact", fingerprint, 5, 3600)) {
        return json({ error: "Too many support requests from this contact. Please try again later." }, 429, origin);
      }
      const subject = "[AI SUPPORT] " + issueType + " · " + priority.toUpperCase();
      const ticketMessage = [
        "AI support handover",
        "Issue type: " + issueType,
        "Priority: " + priority,
        "Summary: " + summary,
        "Source: FORME Shopping Assistant",
      ].join("\\n");
      const result = await callRpc("create_store_contact_message", {
        p_name: name, p_phone: phone, p_email: email || null,
        p_subject: subject, p_message: ticketMessage, p_privacy_consent: true,
      });
      return json({ ok: true, reference: (result as Record<string, unknown>)?.reference, status: "new" }, 201, origin);
    }
    if (action === "ai-feedback") {
      const rating = Number(body.rating);
      const reason = text(body.reason, 40);
      const intent = text(body.intent, 40) || "general";
      const sentiment = text(body.sentiment, 30) || "neutral";
      const model = text(body.model, 100) || null;
      const pagePath = text(body.page_path, 180) || null;
      const sessionId = text(body.session_id, 60);
      const latencyMs = body.latency_ms === null || body.latency_ms === undefined ? null : Number(body.latency_ms);
      const reasons = new Set(["helpful","wrong_information","irrelevant","tone","other"]);
      const intents = new Set(["general","order","delivery","returns","product","size","support"]);
      const sentiments = new Set(["angry","frustrated","confused","positive","neutral","urgent"]);
      if (![1,-1].includes(rating) || !reasons.has(reason) || !intents.has(intent) || !sentiments.has(sentiment)
        || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)
        || (pagePath !== null && (!pagePath.startsWith("/") || pagePath.length > 180))
        || (latencyMs !== null && (!Number.isInteger(latencyMs) || latencyMs < 0 || latencyMs > 180000))) {
        return json({ error: "Feedback details are invalid." }, 400, origin);
      }
      const sessionHash = await sha256Hex(sessionId);
      if (!await consumeRateLimit("ai_feedback", sessionHash, 8, 3600)) {
        return json({ error: "Feedback limit reached for this session." }, 429, origin);
      }
      await callRpc("create_store_ai_feedback", {
        p_rating: rating, p_reason: reason, p_intent: intent, p_sentiment: sentiment,
        p_model: model, p_session_hash: sessionHash, p_page_path: pagePath, p_latency_ms: latencyMs,
      });
      return json({ ok: true, saved: true }, 201, origin);
    }
    if (action === "order") {
      const order = body.order;
      if (!order || typeof order !== "object" || Array.isArray(order)) return json({ error: "Order details are missing." }, 400, origin);
      const orderData = order as Record<string, unknown>;
      const orderPhone = text(orderData.customer_phone, 30) || req.headers.get("x-forwarded-for") || "unknown-client";
      if (!await consumeRateLimit("order", orderPhone, 3, 900)) {
        return json({ error: "Too many order requests from this contact. Please try again in 15 minutes." }, 429, origin);
      }
      const result = await callRpc("create_store_order", { p_order: orderData });
      return json({ ok: true, order: result }, 201, origin);
    }
    if (action === "catalogue-order") {
      const order = body.order;
      if (!order || typeof order !== "object" || Array.isArray(order)) return json({ error: "Catalogue order details are missing." }, 400, origin);
      const orderData = order as Record<string, unknown>;
      const orderPhone = text(orderData.customer_phone, 30) || req.headers.get("x-forwarded-for") || "unknown-client";
      if (!await consumeRateLimit("catalogue_order", orderPhone, 3, 900)) {
        return json({ error: "Too many order requests from this contact. Please try again in 15 minutes." }, 429, origin);
      }
      const result = await callRpc("create_store_catalogue_request", { p_order: orderData });
      return json({ ok: true, order: result }, 201, origin);
    }
    if (action === "contact") {
      const name = text(body.name, 120), phone = text(body.phone, 30), email = text(body.email, 254);
      const subject = text(body.subject, 120), message = text(body.message, 2000);
      const consent = body.privacy_consent === true;
      if (!name || !subject || message.length < 10 || !consent) return json({ error: "Please complete the form and accept the privacy notice." }, 400, origin);
      const contactFingerprint = phone || email || req.headers.get("x-forwarded-for") || "unknown-client";
      if (!await consumeRateLimit("contact", contactFingerprint, 5, 3600)) {
        return json({ error: "Too many messages from this contact. Please try again later." }, 429, origin);
      }
      const result = await callRpc("create_store_contact_message", { p_name: name, p_phone: phone || null, p_email: email || null, p_subject: subject, p_message: message, p_privacy_consent: consent });
      return json({ ok: true, reference: (result as Record<string, unknown>)?.reference }, 201, origin);
    }
    if (action === "track") {
      const orderNumber = text(body.order_number, 40);
      const phone = text(body.customer_phone, 30);
      if (!orderNumber || !phone) {
        return json({ error: "Enter the order reference and the mobile number used at checkout." }, 400, origin);
      }
      if (!await consumeRateLimit("track", orderNumber + ":" + phone, 10, 3600)) {
        return json({ error: "Too many tracking attempts for this order. Please try again later." }, 429, origin);
      }
      const result = await callRpc("lookup_store_order", {
        p_order_number: orderNumber,
        p_customer_phone: phone,
      });
      return json({ ok: true, order: result }, 200, origin);
    }

    if (action === "review") {
      const orderNumber = text(body.order_number, 40);
      const phone = text(body.customer_phone, 30);
      const productName = text(body.product_name, 180);
      const reviewerName = text(body.reviewer_name, 100);
      const rating = Number(body.rating);
      const reviewText = text(body.review_text, 1200);
      const publicationConsent = body.publication_consent === true;
      if (!orderNumber || !phone || !productName || !reviewerName || !Number.isInteger(rating) || rating < 1 || rating > 5 || reviewText.length < 10 || !publicationConsent) {
        return json({ error: "Please complete all review fields with a valid delivered order reference." }, 400, origin);
      }
      if (!await consumeRateLimit("review", orderNumber + ":" + phone, 3, 86400)) {
        return json({ error: "A review request for this order has already been submitted several times today." }, 429, origin);
      }
      const result = await callRpc("submit_store_product_review", {
        p_order_number: orderNumber,
        p_customer_phone: phone,
        p_product_name: productName,
        p_reviewer_name: reviewerName,
        p_rating: rating,
        p_review_text: reviewText,
        p_publication_consent: publicationConsent,
      });
      return json({ ok: true, review: result }, 201, origin);
    }

    if (action === "newsletter") {
      const email = text(body.email, 254);
      const consent = body.marketing_consent === true;
      if (!email || !consent) return json({ error: "Enter your email and tick the optional newsletter consent box." }, 400, origin);
      if (!await consumeRateLimit("newsletter", email, 2, 86400)) {
        return json({ error: "This email has reached the daily subscription request limit." }, 429, origin);
      }
      const result = await callRpc("subscribe_store_newsletter", { p_email: email, p_consent: consent });
      return json({ ok: true, subscribed: (result as Record<string, unknown>)?.subscribed === true }, 201, origin);
    }
    return json({ error: "Unknown request type." }, 400, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request could not be saved.";
    const safeClientError = /required|invalid|too long|quantity|cart|selected item|consent|could not find|matching those details|delivered order|mobile number/i.test(message);
    return json({ error: safeClientError ? message : "We could not save your request right now. Please try again." }, safeClientError ? 400 : 502, origin);
  }
});
