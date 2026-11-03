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
- query: string, optional when category is provided
- category: string, optional
- max_price_bdt: integer, optional; results are filtered using verified prices only
- limit: integer from 1 to 30, optional

Audience and season filters are deliberately rejected for now because the current product table does not have structured audience or season fields. Do not infer them from an ID or product name.

### POST /v1/catalogue/product

Request JSON:
- product_id: string

Returns the active catalogue record with its verification and availability status.

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

Gemini generates an unpublished draft using only the product facts returned by the database. The endpoint does not save or publish the draft. The response always sets publication_status to draft_only and review_required to true. Prices are deliberately omitted because the current schema has one overall product verification flag, not separate price verification.

## Example request

POST https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/forme-ai-api/v1/catalogue/search

Headers:
Content-Type: application/json
X-FORME-AI-KEY: YOUR_PRIVATE_AGENT_KEY

Body:
{
  "query": "hoodie",
  "limit": 5
}

## Current safety limits

- No order creation, order-status updates, inventory changes, price changes, payment actions, courier bookings, customer profile reads, or advertising changes.
- No writes to product records and no automatic publication.
- The agent credential is never returned by the health endpoint.
- All AI-created copy is a draft and must be reviewed by a human.
- Product search does not invent audience or season segments.
- Unverified product prices and availability are clearly labelled and must not be stated as confirmed.

## Enable the agent credential

In Supabase Dashboard, open Project Settings -> Edge Functions -> Secrets (or the Edge Functions Secrets section in the dashboard) and add:

Name: FORME_AI_AGENT_KEY
Value: create a long random value of at least 32 characters and keep it in a password manager.

Do not put the value in this repository. After saving the secret, call GET /health and confirm status is ready_for_agent_auth. Until then all agent routes intentionally return 503.

## Planned extensions (not enabled in v1)

Per-agent credentials and scopes, structured audience/season attributes, product variant/inventory data, human-approved write actions, Google Ads, Meta, Merchant Center, payment and courier adapters.
