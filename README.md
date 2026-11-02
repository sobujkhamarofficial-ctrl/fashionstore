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
- Server-side product ID and price validation; the server calculates the item subtotal from the database rather than trusting browser-supplied prices.
- Order requests and item snapshots stored in Supabase tables with Row Level Security enabled.
- Contact messages and optional newsletter subscriptions stored in the backend.
- Public information and customer policies: About, Shipping & Delivery, Returns & Refunds, Cancellations, Size Guide, FAQs, Payment Policy, Privacy Policy and Terms & Conditions.
- FORME Journal with three published style and care articles.
- Sitemap and robots.txt generated during deployment.

## Current pilot limitations

The public catalogue contains sample product records. Names, images, listed prices, variants and stock are not yet verified as a final sellable inventory. All seeded products are marked as requiring store confirmation. An online checkout submission creates an **order request** only, not a confirmed order or payment transaction.

The store team must contact the customer to confirm:
1. The exact product, size/variant and availability.
2. The final product price and any applicable promotion.
3. The delivery area, courier availability, delivery charge and realistic delivery estimate.
4. The accepted payment method and final total.

No online payment gateway or live courier booking/tracking integration is connected. Do not request or collect card numbers, PINs, passwords or OTPs through this site. The experimental AI Customer Care widget remains disabled while the order and policy workflows are verified.

Before accepting confirmed commercial orders, complete the product catalogue with real SKU data and stock, add verified merchant legal identity and official contact details, publish agreed delivery rates and service levels, integrate a Bangladesh-supported payment gateway and courier workflow, and obtain legal review of the policies.

## Backend

Supabase project: `forme-fashion-backend`

- `store_products`: current pilot catalogue and verification/availability flags.
- `store_orders`: order request and customer delivery details.
- `store_order_items`: product snapshots requested by customers.
- `store_contact_messages`: customer support queue.
- `store_newsletter_subscribers`: opt-in email list.

Public browser code uses only the Supabase publishable key. The Gemini and Supabase server secrets remain in Supabase Edge Function secrets and are not stored in this repository.

## Deployment

GitHub Actions runs these build steps on pushes to `main`:
1. Generate the Men catalogue pages.
2. Download and verify local fashion photography.
3. Generate the collection gallery hierarchy.
4. Build policies, contact page, Journal articles, sitemap and robots rules.
5. Run page, code and integration checks.
6. Publish the static site to GitHub Pages.

Never commit API secrets, service-role keys, payment credentials or private customer data to this public repository.
