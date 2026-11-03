# FORME — Fashion Store

FORME is an editorial-style fashion storefront for Bangladesh. The site is published through GitHub Pages and uses a separate Supabase backend for pilot order requests, customer messages and newsletter subscriptions.

## Live storefront

- https://sobujkhamarofficial-ctrl.github.io/fashionstore/
- Men catalogue: https://sobujkhamarofficial-ctrl.github.io/fashionstore/men/
- Journal: https://sobujkhamarofficial-ctrl.github.io/fashionstore/blog/

## What is implemented

- Responsive home page and Men, Women, Teens, Kids, Sports and Accessories collection navigation.
- Locally bundled fashion photography for collection gallery pages.
- Men catalogue cards connected to a shared local shopping bag.
- Checkout order-request form connected to Supabase Edge Functions.
- Private order tracking by matching order reference and checkout mobile number.
- Verified customer review submissions, with explicit publication consent and manual moderation.
- Server-side product ID and price validation; the server calculates the item subtotal from the database rather than trusting browser-supplied prices.
- Order requests and item snapshots stored in Supabase tables with Row Level Security enabled and explicit deny policies for browser roles.
- Persistent server-side rate limits store only hashed contact fingerprints.
- Customer order lookup by order reference plus checkout phone, including courier name, tracking reference and estimated delivery date when entered by the store team.
- Contact messages and optional newsletter subscriptions stored in the backend.
- Public information and customer policies: About, Shipping & Delivery, Returns & Refunds, Cancellations, Size Guide, FAQs, Payment Policy, Privacy Policy and Terms & Conditions.
- FORME Journal with three published style and care articles.
- Sitemap and robots.txt generated during deployment.

## Current pilot limitations

The public catalogue contains pilot product records. Names, images, listed prices, variants and stock are not yet verified as a final sellable inventory. All seeded products remain marked as requiring store confirmation; no product is approved as in stock. The live database has 212 active product records. Explicit source provenance allows 211 records to have a verified audience segment (Men or Women), but this does not verify their price, stock, size, colour or seasonal suitability. Product Intelligence fields are now available for audience, season, size, colour, SKU, stock quantity, material, fit, pattern and search keywords; unknown values remain blank until the store team checks them. An online checkout submission creates an **order request** only, not a confirmed order or payment transaction.

The store team must contact the customer to confirm:
1. The exact product, size/variant and availability.
2. The final product price and any applicable promotion.
3. The delivery area, courier availability, delivery charge and realistic delivery estimate.
4. The accepted payment method and final total.

No online payment gateway or live courier booking/tracking integration is connected. Do not request or collect card numbers, PINs, passwords or OTPs through this site. FORME AI Shopping Assistant is connected to the live public product catalogue using Gemini function calling. It can search products, display image cards, read product details and prepare an in-chat order request form. The customer must submit the form themselves; the server calculates prices and creates only a pending_review order request. The AI cannot directly confirm orders, reserve inventory, collect payment or book couriers.

Before accepting confirmed commercial orders, complete the product catalogue with real SKU data and stock, add verified merchant legal identity and official contact details, publish agreed delivery rates and service levels, integrate a Bangladesh-supported payment gateway and courier workflow, and obtain legal review of the policies.

## Product Intelligence layer

The product table now has structured fields for audience and seasonal classification, size and colour options, SKU, stock quantity, material, fit, pattern, and search keywords. Audience, season, attributes and price each have independent verification flags. Men/Women segmentation uses verified catalogue metadata rather than guessing from IDs or product names. Winter listings appear only after season tags are checked and marked verified.

The private admin product editor and CSV import/export can maintain these fields. In CSV array fields (season_tags, size_options, color_options and search_keywords) use semicolon-separated values. Leave stock_quantity blank when the count is unknown; do not enter 0 to mean "not checked".

## Admin password and access

The private FORME admin page uses a single fixed owner email: `sobujkhamar.official@gmail.com`. The password is not stored in the browser, website files or GitHub. Set it as the Supabase Edge Function secret `FORME_ADMIN_PASSWORD` for the `storefront-commerce-api` function. Use a password between 16 and 200 characters. To change or reset the password, replace that secret in Supabase Dashboard → Edge Functions → Secrets; the new password is used without changing the website code. Existing admin sessions become invalid when the secret changes. Admin sessions expire after 8 hours and can also be ended with Sign out.

Never commit the password or other server secrets to this repository.

## Backend

Supabase project: `forme-fashion-backend`

- `store_products`: current pilot catalogue and verification/availability flags.
- `store_orders`: order request and customer delivery details.
- `store_order_items`: product snapshots requested by customers.
- `store_contact_messages`: customer support queue.
- `store_newsletter_subscribers`: opt-in email list.
- `store_product_reviews`: order-verified product reviews awaiting moderation or publication.
- `store_request_throttles`: hashed contact fingerprints for persistent request rate limits.

## Store operations

New order requests are private. For the pilot, the store owner can review and update them in the [Supabase Table Editor](https://supabase.com/dashboard/project/zfgcovvfczjiqagrnfjr/editor) after signing in to the Supabase project. Use `store_orders` to review customer requests and update the order status, final price, delivery charge, courier, tracking number and estimated delivery date. Use `store_order_items` to view the item details. Do not make these tables public.

Use `store_product_reviews` to review new submissions. Change `publication_status` to `published` only after verifying the delivered order and content; do not delete genuine negative reviews merely because they are negative. Set `store_products.details_verified` and `availability_status` only after checking actual inventory and the exact SKU, size/variant and price.

Public browser code uses only the Supabase publishable key. The Gemini and Supabase server secrets remain in Supabase Edge Function secrets and are not stored in this repository.

## FORME AI customer experience

The FORME Shopping Assistant includes:
- Bilingual customer-care instructions with empathetic responses and honest objection handling.
- Live catalogue search and a secure, customer-submitted COD order-request form.
- Optional garment-photo search through a one-request image attachment. Uploaded image bytes are not persisted by the storefront application.
- Optional browser speech-to-text and read-aloud controls where the customer's browser supports them.
- Explicit opt-in device-only style memory that stores up to five selected public product IDs in local storage; no customer profile or contact information is saved.
- Human support-ticket preparation and explicit submission into the private admin customer-message inbox.
- Helpful / needs-improvement response ratings and an admin-only AI Insights view.

AI feedback stores ratings, issue labels, intent/sentiment heuristics, model name, page path, response time and a hashed session identifier. It does not store full prompts, AI replies, customer phone numbers, addresses or uploaded images. Feedback is for human review; it does not automatically train or fine-tune the model.

The public product catalogue remains a pilot dataset. Current price, product details and stock must be checked by the store team before an order is confirmed. Image matching and sentiment/intent signals are assistive estimates, not guarantees. Voice controls depend on browser support. Support tickets are reviewed from the admin inbox; they are not real-time live agent chat.

## Deployment

GitHub Actions runs these build steps on pushes to `main`:
1. Generate the Men catalogue pages.
2. Download and verify local fashion photography.
3. Generate the collection gallery hierarchy.
4. Build policies, contact page, Journal articles, sitemap and robots rules.
5. Run page, code and integration checks.
6. Publish the static site to GitHub Pages.

Never commit API secrets, service-role keys, payment credentials or private customer data to this public repository.

## FORME AI Control API v1

A separate private server-to-server Edge Function is deployed at:
https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/forme-ai-api

V1 currently supports active catalogue search, exact product lookup, catalogue-quality summaries, and Gemini-generated unpublished product/SEO content drafts. It is intentionally read-only: it cannot modify products, inventory, orders, payments, courier bookings, or advertising campaigns.

The function source, API guide, and OpenAPI contract are maintained in:
- `supabase/functions/forme-ai-api/index.ts`
- `supabase/functions/forme-ai-api/README.md`
- `supabase/functions/forme-ai-api/openapi.yaml`

Agent routes remain disabled until the private Supabase Edge Function secret `FORME_AI_AGENT_KEY` is configured. The key must never be committed to GitHub or placed in browser code. Check the public `/health` route to confirm readiness after adding the secret.
