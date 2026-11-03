# FORME AI Control API (v1)

This is a private, server-to-server API for authorised FORME AI agents and internal automation. It is not a browser API.

## Base URL

https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/forme-ai-api

## Authentication

Send the private key in either the X-FORME-AI-KEY header or an Authorization: Bearer header. The key is stored only as a Supabase Edge Function secret named FORME_AI_AGENT_KEY. It must contain at least 32 characters. Never store it in HTML, JavaScript shipped to browsers, GitHub, prompts, or public documents.

The health endpoint is public and intentionally reveals only service readiness flags. All v1 agent routes require the private key. Requests are rate limited to 50 calls per agent key per hour through the database-backed rate limiter.

## Endpoints

### GET /health

Returns service readiness, the available routes, and whether the agent secret and Gemini key are configured. It does not return any secret values.

### POST /v1/catalogue/search

Request JSON:
- query: string, optional when category, audience or season is provided
- category: string, optional
- audience: men | women | teens | kids | unisex, optional; only records with audience_verified=true match
- season: spring | summer | autumn | winter | all_season, optional; only records with season_verified=true match
- size: exact size option, optional; requires attributes_verified=true
- color: exact colour option, optional; requires attributes_verified=true
- material: exact material value, optional; requires attributes_verified=true
- fit: exact fit value, optional; requires attributes_verified=true
- max_price_bdt: integer, optional; results are filtered using price_verified=true only
- limit: integer from 1 to 30, optional

Product responses include verification flags and structured audience, season, sizes and colours. The private API also returns SKU and recorded stock quantity. A null stock quantity means stock has not been recorded; it does not mean zero. Never treat unverified audience, season or attributes as facts.

### POST /v1/catalogue/product

Request JSON:
- product_id: string

Returns the active catalogue record with audience/season verification, size and colour options, SKU, recorded stock quantity, price verification and other available product attributes. This route is private; do not forward internal stock quantities or SKU to shoppers unless a separate policy permits it.

### POST /v1/catalogue/summary

Request JSON:
- empty JSON object

Returns aggregate catalogue counts and explicit data-quality limitations.

### POST /v1/ai/content/draft

Request JSON:
- product_id: string
- content_type: product_description | seo_title | seo_description | social_caption | product_faq
- language: bn | en (default bn)
- objective: optional short writing objective

Gemini generates an unpublished draft using only product facts that pass their specific verification flags. Size, colour, material, fit and pattern are used only when attributes_verified=true; audience and season are used only when their own verification flags are true. Prices are always omitted from generated copy. The endpoint does not save or publish the draft; the response always sets publication_status to draft_only and review_required to true.

## Example request

POST https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/forme-ai-api/v1/catalogue/search

Headers:
Content-Type: application/json
X-FORME-AI-KEY: YOUR_PRIVATE_AGENT_KEY

Body:
{
  "query": "hoodie",
  "audience": "men",
  "season": "winter",
  "limit": 5
}

## Current safety limits

- No order creation, order-status updates, inventory changes, price changes, payment actions, courier bookings, customer profile reads, or advertising changes.
- No writes to product records and no automatic publication.
- The agent credential is never returned by the health endpoint.
- All AI-created copy is a draft and must be reviewed by a human.
- Audience and season searches use explicit verification flags; no segment is guessed from a product ID or category.
- Product attributes are usable only after attributes_verified is true.
- Unverified product prices and availability are clearly labelled and must not be stated as confirmed.
- Stock quantity remains internal to the private API; null means unknown, not zero.

## Enable the agent credential

In Supabase Dashboard, open Project Settings -> Edge Functions -> Secrets (or the Edge Functions Secrets section in the dashboard) and add:

Name: FORME_AI_AGENT_KEY
Value: create a long random value of at least 32 characters and keep it in a password manager.

Do not put the value in this repository. After saving the secret, call GET /health and confirm status is ready_for_agent_auth. Until then all agent routes intentionally return 503.

## Product Intelligence fields

The `store_products` table now supports:
- `audience` + `audience_verified`
- `season_tags` + `season_verified`
- `size_options`, `color_options`, `material`, `fit`, `pattern`, `search_keywords` + `attributes_verified`
- `sku`, nullable `stock_quantity` + `stock_checked_at`
- `price_verified`

The initial backfill assigns the Men audience only to records whose source is explicitly `men_directory` or `homepage_men`, and assigns Men/Women only to matching `homepage_featured` department records. Seasonal tags, sizes, colours, SKU, stock and price verification were not guessed or backfilled. Admin users can maintain these fields in the product editor or CSV. In CSV, array fields use semicolon-separated values.

## Planned extensions (not enabled in v1)

Per-agent credentials and scopes, further structured product attributes, human-approved write actions, Google Ads, Meta, Merchant Center, payment and courier adapters.
