# FORME — Fashion Store

A responsive, editorial-style storefront starter for GitHub Pages.

## Storefront features

- Women, Men and Accessories collections
- Product browsing, category filters, search and price sorting
- Interactive wishlist and shopping bag
- Quantity controls and subtotal calculation in Bangladeshi taka (BDT)
- Checkout form preview
- Responsive desktop and mobile navigation
- Self-contained static site: no build tool or package installation required

## Deploy with GitHub Pages

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, choose **GitHub Actions** as the source.
3. The workflow at `.github/workflows/deploy-pages.yml` deploys automatically on pushes to `main`.
4. When the workflow succeeds, the site will be available at:

   https://sobujkhamarofficial-ctrl.github.io/fashionstore/

## Important before taking real orders

This repository currently contains a front-end demo, not a production ecommerce system.

- Demo products, product artwork and prices are placeholders.
- Checkout does not create or save an order.
- No payment is collected.
- Newsletter signup is a local preview only.

Before accepting customer orders, connect a secure backend and database, server-side stock/order validation, a Bangladesh-supported payment gateway, verified payment webhooks, delivery rules, exchange/return policies and real customer-support details.

Never commit payment secrets, private API keys or database service-role keys to this public repository.

## Customization

- Update the product list and prices in the inline script at the bottom of `index.html`.
- Replace the illustrative SVG product artwork with real product photography.
- Update contact and social links in the footer.
- Update the FORME brand name, colors and copy in `index.html` when your brand identity is finalized.
