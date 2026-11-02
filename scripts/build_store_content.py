#!/usr/bin/env python3
"""Build FORME's public information, policy, and journal pages."""
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "/fashionstore/"
ASSET = BASE + "assets/content-pages.css"

def e(value):
    return escape(str(value), quote=True)

def header():
    return f'''<div class="fc-topbar">FORME · EVERYDAY, REFINED · BANGLADESH</div>
<header class="fc-header"><div class="fc-head-inner">
<a class="fc-logo" href="{BASE}">FORME<small>EVERYDAY, REFINED</small></a>
<nav class="fc-nav" aria-label="Site navigation">
<a href="{BASE}">Shop</a><a href="{BASE}men/">Men</a><a href="{BASE}women/">Women</a>
<a href="{BASE}blog/">Journal</a><a href="{BASE}pages/about.html">About</a>
<a href="{BASE}pages/contact.html">Contact</a>
</nav></div></header>'''

def footer():
    return f'''<footer class="fc-footer"><div class="fc-foot-inner">
<div class="fc-foot-grid">
<div><a class="fc-logo" style="color:#fff" href="{BASE}">FORME<small style="color:#d8ded8">EVERYDAY, REFINED</small></a>
<p>Considered clothing and modern everyday essentials. A Bangladesh-focused fashion storefront.</p></div>
<div><h3>Explore</h3><a href="{BASE}">Shop all</a><a href="{BASE}men/">Men</a><a href="{BASE}women/">Women</a><a href="{BASE}blog/">Journal</a></div>
<div><h3>Customer care</h3><a href="{BASE}pages/shipping-delivery.html">Shipping & delivery</a><a href="{BASE}pages/returns-refunds.html">Returns & refunds</a><a href="{BASE}pages/cancellations.html">Cancellations</a><a href="{BASE}pages/size-guide.html">Size guide</a><a href="{BASE}pages/faq.html">FAQs</a></div>
<div><h3>Information</h3><a href="{BASE}pages/about.html">About FORME</a><a href="{BASE}pages/contact.html">Contact</a><a href="{BASE}pages/payment.html">Payment policy</a><a href="{BASE}pages/privacy.html">Privacy policy</a><a href="{BASE}pages/terms.html">Terms & conditions</a></div>
</div><div class="fc-footer-bottom"><span>© 2026 FORME. All rights reserved.</span><span>Bangladesh · Pilot storefront</span></div>
</div></footer>'''

def page(title, kicker, lede, body, description=None, canonical=None):
    desc = description or lede
    url = canonical or ""
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#F7F5F0"><meta name="description" content="{e(desc)}">
<link rel="stylesheet" href="{ASSET}"><title>{e(title)} | FORME</title>
{f'<link rel="canonical" href="{url}">' if url else ''}
</head><body>{header()}<main class="fc-main">
<div class="fc-breadcrumb"><a href="{BASE}">Home</a> / {e(title)}</div>
<span class="fc-kicker">{e(kicker)}</span><h1>{e(title)}</h1><p class="fc-lede">{e(lede)}</p>
<p class="fc-meta">Updated 2 November 2026 · FORME Bangladesh</p>
<div class="fc-content">{body}</div>
</main>{footer()}</body></html>'''

pages = {
"about.html": (
"About FORME","OUR APPROACH","A considered fashion destination for everyday clothing, personal style and practical wardrobe choices.",
'''<p>FORME is being developed as a modern clothing and accessories storefront for customers in Bangladesh. Our point of view is simple: useful pieces, thoughtful styling and clear information that helps people make confident choices.</p>
<h2>What you will find here</h2><p>The site is organised around Men, Women, Teens, Kids, Sports and Accessories collections. We are building the product catalogue in stages. Some collection pages currently act as visual catalogues, while product-level details, final prices, size options and availability are still being verified.</p>
<h2>Our service promise</h2><ul><li>Show product and price information clearly before an order is accepted.</li><li>Confirm availability, delivery cost and estimated delivery timing with the customer before final confirmation.</li><li>Handle customer information only for clear store purposes and protect it with appropriate safeguards.</li><li>Provide a visible route for customer questions, order changes and complaints.</li></ul>
<div class="fc-note"><strong>Storefront status:</strong> FORME is currently operating a pilot order-request flow. Submitting the checkout form sends a request to our team; it does not mean a paid or confirmed purchase. Payment collection and courier integration are not yet enabled.</div>
<h2>Business information</h2><p>FORME is the public-facing brand name. The legal operator name, registered business address, trade licence details and official customer-care telephone number must be displayed here before the store starts taking confirmed commercial orders. We will not publish invented registration details.</p>
<p>For product questions or support, use our <a href="/fashionstore/pages/contact.html">contact form</a>.</p>'''
),
"shipping-delivery.html": (
"Shipping & delivery","CUSTOMER CARE","Clear delivery charges and estimated timelines are provided before a customer agrees to a confirmed order.",
'''<h2>1. Current order-request stage</h2><p>FORME currently accepts order requests for listed pilot-catalogue items. A request is not a confirmed sale, dispatch instruction or payment request. Our team must first verify the item, final selling price, size or variant, stock availability, delivery destination and delivery charge. We will communicate those details and obtain your agreement before confirming the order.</p>
<h2>2. Delivery areas</h2><p>Delivery availability depends on the destination and the delivery partner available for that route. At present, FORME has not connected a live courier-rate or tracking integration. We therefore do not display a made-up nationwide fee or guaranteed delivery promise. The delivery area, applicable charge and estimated delivery date will be confirmed with you before the order is accepted.</p>
<h2>3. Delivery charges</h2><p>Any delivery, handling or other mandatory charge must be disclosed separately and included in the final amount communicated to you before you confirm. A promotion such as free delivery will apply only where it is clearly shown for the specific product or order and confirmed by our team.</p>
<h2>4. Delivery timing and handover</h2><p>The expected delivery date depends on stock confirmation, destination, courier coverage, weather, transport disruption and other events outside the store's direct control. We will provide a realistic estimate before confirming the order and notify you if a material delay becomes known.</p><p>FORME will operate its delivery process in accordance with applicable Bangladesh digital-commerce requirements. The Digital Commerce Operation Guidelines, 2021 set specific handover and delivery expectations for fully paid orders; this pilot page does not replace those requirements or create a longer contractual deadline.</p>
<h2>5. Receiving your parcel</h2><ul><li>Please provide a complete address, active mobile number and useful delivery directions.</li><li>Keep your phone reachable around the communicated delivery window.</li><li>Where practical, inspect the outer packaging before accepting the parcel and report visible damage promptly.</li><li>Do not pay a person or account that has not been identified to you through an official FORME order confirmation.</li></ul>
<h2>6. Delays, failed delivery and complaints</h2><p>If a delivery is delayed, an address is incomplete or the courier cannot reach you, contact us through the <a href="/fashionstore/pages/contact.html">support form</a> with your order-request reference. We will review the available information and agree the next step with you. Statutory consumer rights remain unaffected.</p>
<div class="fc-note"><strong>Important:</strong> Until a final delivery charge and estimate are communicated and accepted, the checkout subtotal is only an item-price estimate—not the final payable total.</div>'''
),
"returns-refunds.html": (
"Returns, exchanges & refunds","CUSTOMER CARE","A fair process for incorrect, damaged or unsuitable items, with statutory consumer rights preserved.",
'''<h2>1. Contact us first</h2><p>To request a return, exchange or refund, contact FORME within 7 calendar days of receiving the item. Include your order reference, the item name, the reason for the request and clear photographs where the item is damaged, faulty or different from the description. This seven-day request window is a store policy and does not remove any longer or separate right available under applicable law.</p>
<h2>2. Item condition</h2><p>For a change-of-mind or size exchange request, the item should be unused, unwashed, unaltered, free from fragrance or damage, with original tags, labels and packaging intact. Please do not send an item back before our team confirms the return address and instructions.</p>
<h2>3. Incorrect, damaged or defective items</h2><p>If we supplied the wrong item, or an item arrives damaged, defective, counterfeit or materially different from the description, tell us as soon as reasonably possible. We may ask for photographs or other details so we can investigate. Where the issue is verified, FORME will arrange an appropriate remedy—replacement, exchange or refund—consistent with applicable consumer law. We will not use this policy to exclude rights that cannot lawfully be excluded.</p>
<h2>4. Change of mind and size exchanges</h2><p>Change-of-mind returns and size exchanges are subject to item condition and availability. If an exchange is unavailable, we will discuss the available alternatives with you. For a non-fault change-of-mind request, return delivery costs may be the customer's responsibility where this is disclosed and agreed before the return is arranged.</p>
<h2>5. Items that may not be accepted for change-of-mind return</h2><p>For hygiene and safety reasons, opened or worn innerwear, intimate apparel, swimwear, pierced jewellery and other sealed hygiene items may be excluded from change-of-mind returns where the exclusion is clearly disclosed before purchase. This does not affect remedies for an incorrect, defective or misdescribed item where the law requires a remedy.</p>
<h2>6. Refund processing</h2><p>Once a return is received and inspected, we will tell you whether the request is approved and confirm the refund method and expected processing steps. Refunds will be sent through the original payment channel where available, or another mutually agreed lawful method. Bank, mobile-financial-service and payment-provider processing times may vary. No refund is due for an order-request that was never confirmed or paid.</p>
<h2>7. Return shipping</h2><p>Where the return is due to a verified FORME error or defective item, we will explain how the return shipping cost will be handled. For non-fault returns or size exchanges, any applicable return-shipping cost will be disclosed before you proceed.</p>
<h2>8. How to raise a request</h2><p>Use the <a href="/fashionstore/pages/contact.html">contact form</a> and choose “Return, exchange or refund”. Include your order reference and phone number. We aim to acknowledge customer complaints promptly and to handle them in line with applicable Bangladesh requirements.</p>'''
),
"privacy.html": (
"Privacy policy","YOUR INFORMATION","How FORME collects, uses, stores and protects information when you browse, contact us or send an order request.",
'''<h2>1. Who is responsible</h2><p>FORME is the public-facing brand operating this pilot storefront. The legal operator name and registered contact address will be added before confirmed commercial sales begin. For privacy questions in the meantime, use the <a href="/fashionstore/pages/contact.html">contact form</a> and select “Privacy request”.</p>
<h2>2. Information we collect</h2><ul><li>Order-request information: name, mobile number, email address if supplied, delivery address, district, area, postal code, requested items, quantities, size or variant notes and customer instructions.</li><li>Customer-support information: the name and contact details you provide, the subject of your enquiry and the message you send.</li><li>Newsletter information: email address and the fact that you chose to subscribe.</li><li>Basic technical information: page path, browser request information and limited security/rate-limit data needed to operate and protect the service.</li></ul><p>Please do not send payment-card numbers, banking passwords, PINs, OTPs, identity documents or other sensitive information through ordinary website forms.</p>
<h2>3. Why we use information</h2><p>We use information to receive and review order requests, check product availability, contact you about an order, arrange delivery after confirmation, respond to support or return requests, maintain business and security records, prevent abuse, and send newsletter updates where you have separately opted in.</p>
<h2>4. Consent and choice</h2><p>When you submit an order request, we ask you to acknowledge this notice so we can process the information for that request. Newsletter subscription is separate and optional. You may ask us to stop sending marketing messages at any time. Refusing optional marketing consent does not prevent you from submitting an order request.</p>
<h2>5. Service providers and overseas processing</h2><p>The website is published through GitHub Pages. Order, contact and newsletter records are stored in a Supabase-hosted database for the FORME backend project, currently configured in Singapore. This means the information you submit may be processed or stored outside Bangladesh by those service providers. We use the information only for the purposes described here and apply access controls and other safeguards appropriate to the pilot service. By submitting an order request, you acknowledge this disclosed cloud processing as part of the service.</p>
<h2>6. AI customer care</h2><p>The experimental AI customer-care widget is temporarily disabled while the store's policies and order process are being completed. When AI chat is enabled, FORME will update this notice and provide a clear notice before messages are sent to an AI service provider. Customers should not put personal, payment or account credentials into an AI chat.</p>
<h2>7. Sharing</h2><p>We do not sell customer personal information. We may share the minimum information necessary with a delivery partner, payment provider (once enabled), cloud hosting provider or professional adviser where this is needed to fulfil a request, operate the store, protect rights or comply with law. We may disclose information to a competent authority where legally required.</p>
<h2>8. Retention</h2><p>We keep order and processing records for as long as needed to handle the transaction, customer service, disputes, accounting and legal obligations. Bangladesh's Personal Data Protection Act, 2026 contains record-keeping and retention requirements, including a minimum five-year record period for relevant processing records. We will not keep unrelated personal information longer than necessary and will review records for deletion or anonymisation when they are no longer required.</p>
<h2>9. Security</h2><p>We use server-side secrets, restricted database access and row-level security for the pilot database. No payment-card data is collected through the present checkout. No online payment gateway is currently connected. No internet service can guarantee absolute security; please contact us promptly if you believe your information has been misused.</p>
<h2>10. Your requests</h2><p>Subject to applicable law and necessary record retention, you may ask to access, correct, update, restrict or delete personal information, withdraw consent where consent is the basis for processing, or object to optional marketing. Use the contact form and select “Privacy request”. We may need to verify that the request relates to you before acting.</p>
<h2>11. Children</h2><p>The checkout is intended to be completed by an adult or a parent/guardian. We do not knowingly request sensitive personal information from children. A parent or guardian who believes a child has submitted information may contact us to request review.</p>
<h2>12. Changes</h2><p>We may update this notice as features, providers and legal requirements change. The latest version date appears at the top of this page. Material changes will be highlighted on the website where appropriate.</p>
<div class="fc-note"><strong>Legal reference:</strong> This notice is prepared with reference to Bangladesh's Personal Data Protection Act, 2026 (Act No. 63 of 2026), including its provisions on lawful processing, consent, confidentiality, security, retention and cross-border transfer. It is an operational website notice, not a substitute for a legal compliance review.</div>'''
),
"terms.html": (
"Terms & conditions","PLEASE READ BEFORE ORDERING","The rules for browsing FORME and sending an order request through this pilot storefront.",
'''<h2>1. About this website</h2><p>FORME is a fashion storefront being developed for customers in Bangladesh. These terms apply when you browse the website, use its forms or submit an order request. The legal operator name, registered address and business licence details must be published before the platform begins confirmed commercial sales.</p>
<h2>2. Catalogue accuracy and pilot status</h2><p>Some product names, prices, comparison prices, photographs, descriptions and collection images on the pilot site are sample catalogue content and may not represent verified stock or a final sale offer. Each product's size, material, colour, availability and final selling price must be confirmed by FORME before an order is accepted. We will correct material errors when identified.</p>
<h2>3. Order requests are not confirmed orders</h2><p>Submitting the checkout form sends an order request to FORME. It does not itself create a confirmed sale, guarantee stock, fix the final price, book a courier or collect payment. Our team must review the requested items, verify their availability and final price, calculate the delivery charge, provide an estimated delivery date and contact you. The order becomes confirmed only after you agree to those details.</p>
<h2>4. Price and delivery total</h2><p>The subtotal displayed at checkout is calculated from the listed sample prices in the catalogue. Delivery charges and the final total are not yet calculated automatically. We will disclose all applicable amounts before asking you to confirm. No additional charge should be collected beyond the amount agreed with you.</p>
<h2>5. Payment</h2><p>Online card, mobile-financial-service and bank-payment gateways are not connected at this stage. The checkout does not collect payment. A payment method, including any cash-on-delivery arrangement, will be agreed only during manual order confirmation. Do not transfer money to an unverified personal account or share PINs, OTPs or card credentials.</p>
<h2>6. Customer responsibilities</h2><ul><li>Provide accurate contact and delivery information.</li><li>Check the requested item, size or variant and delivery details when we contact you.</li><li>Do not misuse the site, submit fraudulent requests or attempt to interfere with the service.</li><li>Keep your order reference for follow-up.</li></ul>
<h2>7. Cancellations, returns and complaints</h2><p>Order requests can be withdrawn before confirmation by contacting us. Confirmed orders are subject to our <a href="/fashionstore/pages/cancellations.html">cancellation policy</a>, <a href="/fashionstore/pages/returns-refunds.html">returns policy</a> and applicable consumer law. Nothing in these terms removes a consumer right that cannot legally be excluded.</p>
<h2>8. Intellectual property and content</h2><p>Website text, layout, brand elements and original materials are provided for personal, non-commercial browsing. You may not copy or reuse them commercially without permission. Product photographs or third-party materials remain subject to their respective rights.</p>
<h2>9. Availability and service changes</h2><p>We may update, suspend or remove catalogue items, features or content to correct errors, verify stock or maintain the site. We will not use a website update to avoid an obligation already confirmed with a customer.</p>
<h2>10. Privacy</h2><p>Personal information is handled under our <a href="/fashionstore/pages/privacy.html">Privacy Policy</a>. By submitting a request, you acknowledge the information processing described there.</p>
<h2>11. Governing law and complaints</h2><p>These terms are intended to operate under the laws of Bangladesh. If you have a concern, contact us first through the <a href="/fashionstore/pages/contact.html">support form</a>. Your right to contact the Directorate of National Consumer Rights Protection or another competent authority is not affected.</p>
<h2>12. Updates</h2><p>We may revise these terms as the order, payment and delivery systems become operational. The version date shown on this page indicates the latest update.</p>'''
),
"payment.html": (
"Payment policy","SAFE & TRANSPARENT PAYMENTS","FORME does not currently collect online payments. Payment is discussed only after the store reviews an order request.",
'''<div class="fc-note"><strong>Current status:</strong> Online card, bKash, Nagad, Rocket, bank transfer and payment-gateway checkout are not enabled. No money is taken when you submit an order request.</div>
<h2>1. How the pilot checkout works</h2><p>The checkout records your requested items and contact details. Our team then verifies the product, final price, stock, size or variant, delivery fee and estimated delivery timing. We will tell you the final amount and available payment method before the order is confirmed.</p>
<h2>2. Do not prepay from an unverified message</h2><p>Do not send money to a personal mobile-financial-service number or bank account solely because someone contacts you claiming to represent FORME. Use only payment instructions confirmed through an official FORME communication channel after your order details have been reviewed. Never share your PIN, OTP, card number or banking password.</p>
<h2>3. Future online payments</h2><p>When a licensed payment gateway is integrated, the checkout will identify the available methods, applicable charges and refund route before a customer chooses to pay. Card data will be handled by the payment provider; FORME does not intend to store full payment-card credentials.</p>
<h2>4. Refunds</h2><p>Refund eligibility and the process are described in our <a href="/fashionstore/pages/returns-refunds.html">Returns, exchanges & refunds policy</a>. No payment refund is due where no money was collected.</p>'''
),
"cancellations.html": (
"Order cancellations","CHANGE YOUR MIND","A simple route to withdraw an order request before it becomes a confirmed order.",
'''<h2>1. Before confirmation</h2><p>You may withdraw an order request at any time before FORME confirms the product, final price, delivery charge and expected delivery date. Contact us with your request reference and the mobile number used at checkout.</p>
<h2>2. After confirmation but before dispatch</h2><p>Contact us as quickly as possible. We will review whether the order can still be stopped. A cancellation cannot be guaranteed once picking, packing or courier handover has begun.</p>
<h2>3. After dispatch or delivery</h2><p>Once an item has been dispatched, the request is handled under the applicable delivery and <a href="/fashionstore/pages/returns-refunds.html">returns policy</a>. A refusal at the door may create courier return costs; any such charge will be explained before an order is confirmed.</p>
<h2>4. Refunds</h2><p>If you have paid an amount for a confirmed order and the cancellation is accepted, we will confirm the refund method and processing steps. The present pilot checkout does not collect advance payment.</p>
<h2>5. How to request cancellation</h2><p>Use the <a href="/fashionstore/pages/contact.html">contact form</a> and choose “Cancel an order”. Include your request reference and a reachable phone number.</p>'''
),
"size-guide.html": (
"Size guide","FIND YOUR FIT","Use these measuring steps as a starting point; rely on the product-specific size chart once it is published for that item.",
'''<h2>1. Measure a garment that fits you well</h2><p>For the most useful comparison, lay a similar garment flat on a level surface and measure it without stretching. Compare those measurements with the product's own chart rather than relying on a generic S/M/L label.</p>
<h2>2. Common measurements</h2><ul><li><strong>Chest:</strong> Measure across the garment just below the armhole and double the result for garment circumference.</li><li><strong>Shoulder:</strong> Measure straight across from one shoulder seam to the other.</li><li><strong>Length:</strong> Measure from the highest shoulder point to the hem.</li><li><strong>Sleeve:</strong> Measure from the shoulder seam to the sleeve end.</li><li><strong>Waist:</strong> Measure across the waistband while the garment is laid flat.</li><li><strong>Inseam:</strong> Measure from the crotch seam to the bottom hem.</li></ul>
<h2>3. Fit notes</h2><p>Regular, slim and relaxed fits can vary between styles and manufacturers. Fabric stretch, cut, intended layering and personal preference also affect the fit. If you are between sizes, ask us for the actual garment measurements before confirming an order.</p>
<h2>4. Current catalogue limitation</h2><p>Product-specific size charts and confirmed variant-level stock are still being added. Do not assume that a size is available just because it is a common size. We will confirm the requested size or variant before accepting an order.</p>
<p>Need help? Use the <a href="/fashionstore/pages/contact.html">contact form</a> and include the product name, your usual fit preference and the measurements you are comfortable sharing.</p>'''
),
"faq.html": (
"Frequently asked questions","HELP & INFORMATION","Answers about catalogue status, order requests, delivery, payment and returns.",
'''<h2>Can I place an order?</h2><p>You can currently submit an order request for a listed pilot item. It becomes a confirmed order only after our team verifies the item, price, availability and delivery details and you agree to them.</p>
<h2>Will the website charge my card?</h2><p>No. Online payment is not enabled and the current checkout does not collect money.</p>
<h2>Are all product prices and stock confirmed?</h2><p>No. The site is still being populated with verified product information. Sample catalogue prices and images are not a guarantee of available stock or a final sale price.</p>
<h2>How much is delivery?</h2><p>The delivery charge depends on the destination and delivery partner. We will disclose it and the expected delivery timing before confirming the order.</p>
<h2>Can I request a size?</h2><p>Yes. Add the size or variant you want in the checkout notes. Our team will confirm whether it is available. Product-specific size charts are still being added.</p>
<h2>What if the item is damaged or incorrect?</h2><p>Contact us promptly with your request reference and photographs. See our <a href="/fashionstore/pages/returns-refunds.html">returns and refunds policy</a>.</p>
<h2>How do I cancel?</h2><p>Contact us before the order is confirmed or dispatched. See the <a href="/fashionstore/pages/cancellations.html">cancellation policy</a>.</p>
<h2>How do I contact FORME?</h2><p>Use the <a href="/fashionstore/pages/contact.html">contact form</a>. It sends your message to our store support inbox in the backend database. Email and phone support details will be published once the official business contact channels are finalised.</p>
<h2>Is AI chat available?</h2><p>The experimental AI customer-care widget is temporarily disabled while we complete and verify these customer policies and order workflows.</p>'''
),
}

for filename, (title, kicker, lede, body) in pages.items():
    out = ROOT / "pages" / filename
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page(title, kicker, lede, body, canonical="https://sobujkhamarofficial-ctrl.github.io/fashionstore/pages/" + filename), encoding="utf-8")

contact_body = '''<p>Send a question about a product, order request, delivery, return, cancellation or privacy issue. This form stores your message in the FORME support queue; it does not send an instant email confirmation.</p>
<div class="fc-note">Please do not include card details, PINs, passwords, OTPs or identity documents. For order questions, include your request reference.</div>
<form class="fc-form" id="fc-contact-form">
<div class="fc-field"><label for="fc-name">Your name *</label><input id="fc-name" name="name" maxlength="120" required></div>
<div class="fc-field"><label for="fc-phone">Mobile number</label><input id="fc-phone" name="phone" type="tel" maxlength="30" placeholder="01XXXXXXXXX"></div>
<div class="fc-field"><label for="fc-email">Email address</label><input id="fc-email" name="email" type="email" maxlength="254"></div>
<div class="fc-field"><label for="fc-subject">What is this about? *</label><select id="fc-subject" name="subject" required><option value="">Choose a topic</option><option>Product question</option><option>Order request</option><option>Delivery question</option><option>Return, exchange or refund</option><option>Cancel an order</option><option>Privacy request</option><option>Other</option></select></div>
<div class="fc-field"><label for="fc-message">Message *</label><textarea id="fc-message" name="message" minlength="10" maxlength="2000" required></textarea></div>
<label class="fc-check"><input type="checkbox" name="privacy_consent" required> I have read the <a href="/fashionstore/pages/privacy.html">Privacy Policy</a> and agree that FORME may use these details to respond to my enquiry.</label>
<input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-10000px;width:1px;height:1px">
<button class="fc-button" type="submit">Send message</button><p class="fc-status" id="fc-contact-status" role="status" aria-live="polite"></p></form>
<script src="/fashionstore/assets/site-forms.js" defer></script>'''
contact = page("Contact FORME","CUSTOMER CARE","Send a message and the FORME team can review your request.",contact_body,canonical="https://sobujkhamarofficial-ctrl.github.io/fashionstore/pages/contact.html")
(ROOT/"pages"/"contact.html").write_text(contact,encoding="utf-8")

blog_posts = [
{
"slug":"build-a-versatile-capsule-wardrobe",
"title":"Build a versatile capsule wardrobe",
"category":"WARDROBE NOTES",
"date":"2 November 2026",
"reading":"6 min read",
"lede":"A practical way to make everyday dressing easier: start with your real routine, choose pieces that work together and buy with intention.",
"body":'''<p>A useful wardrobe is not necessarily a large wardrobe. It is a wardrobe that helps you get dressed without second-guessing every combination. A capsule approach focuses on a manageable group of pieces that suit your lifestyle and can be worn in several ways.</p>
<h2>Start with your week, not a trend</h2><p>Before making a list, look at the week you actually live. Consider work or study, commuting, family time, social occasions, religious or cultural events and the local weather. A wardrobe for a mostly casual routine will look different from one built around formal office wear. The right starting point is your calendar.</p>
<h2>Choose a simple colour structure</h2><p>Pick two or three colours that you enjoy wearing and that work comfortably with the rest of your wardrobe. Neutrals such as navy, charcoal, cream, black, denim blue and earthy tones can provide a base, while one or two accent colours add personality. You do not need to follow a fixed palette; choose colours that you already reach for.</p>
<h2>Build around repeatable outfit formulas</h2><p>Think in combinations rather than isolated items. A shirt can work with tailored trousers, denim or a relaxed bottom. A simple tee may be worn on its own, under an overshirt or with a lightweight layer. If a new piece cannot work with at least two or three items you already own, pause and consider whether it fills a genuine gap.</p>
<h2>Prioritise fit and comfort</h2><p>Fit influences how often you wear a garment. Pay attention to shoulder width, chest ease, sleeve length, rise and overall length. A relaxed fit should still feel intentional; a slim fit should not restrict movement. Compare product-specific measurements whenever they are available rather than relying only on a generic size label.</p>
<h2>Check the details before you buy</h2><p>Read the composition, care instructions, garment measurements, colour description and return conditions. Look closely at product photographs, but remember that screens and lighting can change how colours appear. Ask the seller to clarify any important detail that is missing.</p>
<h2>Use a simple wardrobe audit</h2><ol><li>Separate the pieces you wear regularly from those you rarely choose.</li><li>Identify the outfits you repeat and why they work.</li><li>Note gaps that prevent you from combining existing pieces.</li><li>Repair, tailor or donate items thoughtfully rather than replacing everything.</li><li>Make a short shopping list and stick to it.</li></ol>
<h2>Buy fewer pieces with clearer purpose</h2><p>Good wardrobe planning is not about buying the most expensive item or owning only a certain number of clothes. It is about understanding your own needs, checking quality and care information, and making purchases you are likely to use. Let your wardrobe reflect your life rather than a passing trend.</p>
<div class="fc-note">FORME note: our product catalogue is still being verified. Check the product-specific details and confirmed availability with our team before treating a listed item or price as final.</div>'''
},
{
"slug":"how-to-choose-the-right-shirt-fit",
"title":"How to choose the right shirt fit",
"category":"FIT & DETAIL",
"date":"2 November 2026",
"reading":"5 min read",
"lede":"Regular, slim and relaxed are useful starting points, but the best shirt fit comes from measurements, movement and the silhouette you want.",
"body":'''<p>A shirt can look excellent on a hanger and feel uncomfortable after an hour. Fit is a combination of proportion, movement and personal preference. Instead of relying on the size printed on a label, compare the garment's actual measurements with a shirt you already enjoy wearing.</p>
<h2>Understand the shoulder first</h2><p>The shoulder seam is a useful visual guide. On a conventional fit, it usually sits close to the point where your shoulder turns into your upper arm. A dropped-shoulder or oversized shirt is designed to sit further down, so compare like with like.</p>
<h2>Check chest and body ease</h2><p>A shirt should allow you to move your arms, sit and reach without pulling sharply across the chest or buttons. Too much extra fabric may create a shape you do not want; too little can restrict movement. The right amount of ease depends on the style and the way you plan to wear it.</p>
<h2>Compare sleeve and body length</h2><p>For a short-sleeve shirt, check where the sleeve opening sits on your upper arm. For a long-sleeve shirt, consider the cuff position when your arms are relaxed. Body length should work with your intended styling—tucked, untucked or layered.</p>
<h2>What the fit labels usually mean</h2><ul><li><strong>Regular:</strong> a balanced silhouette with room for everyday movement.</li><li><strong>Slim:</strong> a closer silhouette through the chest and body; it should not feel tight.</li><li><strong>Relaxed:</strong> more room through the body and sleeves, often for an easy casual look.</li><li><strong>Oversized:</strong> deliberately broader proportions and often dropped shoulders.</li></ul><p>These labels are not universal standards. Different cuts and brands can use the same words for different measurements.</p>
<h2>Measure a shirt you already own</h2><ol><li>Lay it flat without stretching the fabric.</li><li>Measure chest width from one side seam to the other, then double it for an approximate circumference.</li><li>Measure shoulder width seam to seam.</li><li>Measure body length from the highest shoulder point to the hem.</li><li>Measure sleeve length from the shoulder seam to the sleeve edge.</li></ol>
<h2>Consider fabric and use</h2><p>Fabric weight, stretch and construction affect how a shirt feels. A structured woven shirt may sit differently from a knitted tee. Think about whether you will wear it in warm weather, layer it or use it for a more formal setting. Always check the actual composition and care instructions supplied for the product.</p>
<h2>Ask when a chart is missing</h2><p>If the seller has not published a product-specific size chart, ask for the garment measurements before buying. A quick clarification can prevent an avoidable exchange. The size guide on FORME is a measurement primer only; product-level charts are still being added.</p>'''
},
{
"slug":"care-for-your-clothes",
"title":"Care for your clothes so they last longer",
"category":"CARE GUIDE",
"date":"2 November 2026",
"reading":"6 min read",
"lede":"Simple habits—reading care labels, washing thoughtfully and storing garments properly—can help keep a wardrobe in better condition.",
"body":'''<p>Clothing care starts before the first wash. The care label is the best source for the manufacturer's instructions because fibres, dyes, trims and construction can respond differently to water, heat and detergents. When a label is available, follow it rather than relying on a universal rule.</p>
<h2>Read the care label</h2><p>Look for washing temperature, hand-wash or machine-wash guidance, bleach restrictions, drying instructions and ironing temperature. If the label says dry clean only, do not assume that a home wash will be safe. If instructions are unclear, ask the seller or a professional cleaner.</p>
<h2>Sort before washing</h2><p>Separate light and dark colours, check pockets and close zips or hooks that could snag other garments. Turn printed or dark items inside out when the care label permits. Avoid overloading the machine; garments need room to move and rinse properly.</p>
<h2>Use detergent and temperature carefully</h2><p>Use an appropriate amount of detergent and avoid assuming that hotter water cleans every garment better. Excessive detergent can leave residue, while unsuitable temperatures may contribute to shrinkage, fading or damage. Follow the garment's label and the detergent instructions.</p>
<h2>Dry with care</h2><p>High heat can affect shape and fibres. When permitted, air-drying in a well-ventilated shaded area is a gentle option. Shape knitwear while damp and dry it flat if the label recommends it. Avoid leaving damp clothing folded in a bag or basket for long periods.</p>
<h2>Store garments properly</h2><p>Make sure clothes are clean and fully dry before storage. Use hangers that support the shoulders of structured garments. Fold heavier knitwear rather than hanging it if hanging may stretch the shoulders. Keep storage areas dry and allow some airflow.</p>
<h2>Repair small issues early</h2><p>A loose button, open seam or small snag can often be repaired before it becomes a larger problem. Keep spare buttons when supplied and follow the garment's construction when choosing a repair method.</p>
<h2>Do not guess about fabric</h2><p>Two garments that look similar may use different blends and finishes. Do not use a heat setting or chemical treatment based only on appearance. Check the exact fibre content and care label for each item.</p>
<div class="fc-note">Care advice on this page is general. The care label supplied with a specific garment takes priority.</div>'''
}
]

blog_index_body = '<div class="fc-article-list">' + ''.join(
    f'''<article class="fc-article"><div><small>{e(p["category"])} · {e(p["date"])} · {e(p["reading"])}</small><h2>{e(p["title"])}</h2><p>{e(p["lede"])}</p></div><a href="/fashionstore/blog/{e(p["slug"])}.html">Read article →</a></article>''' for p in blog_posts
) + '</div><div class="fc-note">FORME Journal shares practical style, fit and clothing-care information. Product availability and product-specific claims are confirmed separately on each item listing.</div>'
(ROOT/"blog").mkdir(parents=True,exist_ok=True)
(ROOT/"blog"/"index.html").write_text(page("FORME Journal","THE JOURNAL","Practical notes on personal style, fit, everyday dressing and garment care.",blog_index_body,canonical="https://sobujkhamarofficial-ctrl.github.io/fashionstore/blog/"),encoding="utf-8")
for post in blog_posts:
    body = f'''<div class="fc-meta">{e(post["category"])} · {e(post["date"])} · {e(post["reading"])}</div>{post["body"]}<p><a href="/fashionstore/blog/">← Back to the Journal</a></p>'''
    (ROOT/"blog"/(post["slug"]+".html")).write_text(page(post["title"],post["category"],post["lede"],body,canonical="https://sobujkhamarofficial-ctrl.github.io/fashionstore/blog/"+post["slug"]+".html"),encoding="utf-8")

# Publish a sitemap for static collection, legal, information and journal pages.
BASE_URL = "https://sobujkhamarofficial-ctrl.github.io/fashionstore/"
urls = set()
for html_file in ROOT.rglob("*.html"):
    rel = html_file.relative_to(ROOT).as_posix()
    if rel.startswith(".github/") or rel == "404.html":
        continue
    if rel == "index.html":
        urls.add(BASE_URL)
    else:
        urls.add(BASE_URL + rel)
sitemap = '<?xml version="1.0" encoding="UTF-8"?>\\n'
sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n'
for url in sorted(urls):
    sitemap += f'<url><loc>{e(url)}</loc></url>\\n'
sitemap += '</urlset>\\n'
(ROOT / "sitemap.xml").write_text(sitemap, encoding="utf-8")
(ROOT / "robots.txt").write_text("User-agent: *\\nAllow: /\\nSitemap: " + BASE_URL + "sitemap.xml\\n", encoding="utf-8")

# A single build entry point keeps all content pages reproducible on every Pages deployment.
print(f"Generated {len(pages)+1} policy/information pages, 1 journal index and {len(blog_posts)} published articles.")
