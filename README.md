# Birthday Hero Book

Two complete launch directions for [birthdayherobook.com](https://birthdayherobook.com), built as a mobile-first Next.js application.

## The two directions

### Version One — The Living Book

Routes: `/` and `/version-one`

An editorial, product-led direction inspired by the confidence and restraint of premium creative-technology brands. Oversized typography, an immersive explanation of personalisation, bright illustration against warm neutrals, and a cinematic dark sample-book section make the product feel tangible without leading with technology.

**Strengths:** clearest product comprehension, strongest live-demo hierarchy, premium credibility, excellent fit for conversion testing and paid traffic.

### Version Two — The Birthday Theatre

Route: `/version-two`

An original theatrical story-world built from velvet, paper collage, playbills, tickets, footlights and chapter-like transitions. The child is introduced as the star and the page unfolds like a birthday performance.

**Strengths:** most distinctive brand memory, strongest emotional storytelling, highly ownable visual world, especially effective for organic/social discovery.

## Selected launch direction

**Version One is the selected production site and now renders at the root route.** Version Two remains available as a retained campaign/editorial direction; its theatre concept could become a seasonal landing page, launch-film art direction or social creative system.

## Routes

- `/` — selected Version One production landing page
- `/version-one` — The Living Book landing page
- `/version-two` — The Birthday Theatre landing page
- `/personalise` — post-checkout order questionnaire
- `/thank-you` — demonstration confirmation
- `/privacy` — launch policy placeholder
- `/terms` — launch terms placeholder
- `/refund-and-corrections` — launch policy placeholder
- `/sitemap.xml` and `/robots.txt` — generated SEO files

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Production verification:

```bash
npm run build
npm start
```

## Commercial configuration

Edit [`lib/site-config.ts`](./lib/site-config.ts) to change:

- prices and package contents
- adventure names and descriptions
- checkout URLs
- founding deadline copy and ISO deadline
- delivery promise
- contact email

Current launch details:

- Trading name: Birthday Hero Book
- Service location: United Kingdom
- Contact and order notifications: `hello@birthdayherobook.com`
- Founding deadline: 21 July 2026 at midnight UK time

The current checkout URLs intentionally point to the local `/personalise` demo so every button works during review.

### Connect Stripe Payment Links

1. Create one Stripe Payment Link for each edition.
2. Configure each Stripe link to redirect after payment with Stripe’s literal session placeholder:
   - Standard: `https://birthdayherobook.com/personalise?package=standard&session_id={CHECKOUT_SESSION_ID}`
   - Deluxe: `https://birthdayherobook.com/personalise?package=deluxe&session_id={CHECKOUT_SESSION_ID}`
   - Family: `https://birthdayherobook.com/personalise?package=family&session_id={CHECKOUT_SESSION_ID}`
3. Replace `standardCheckoutUrl`, `deluxeCheckoutUrl`, and `familyCheckoutUrl` in `lib/site-config.ts` with the corresponding Stripe URLs.
4. Add the server-only Stripe values from `.env.example` to Vercel. Never prefix them with `NEXT_PUBLIC_` or commit real secrets.
5. The personalisation form captures the Checkout Session ID invisibly, verifies that Stripe reports it as paid and complete, and confirms that its Payment Link matches the selected edition. Customers never need to copy an order number.
6. Before launch, connect a signed `checkout.session.completed` webhook using `STRIPE_WEBHOOK_SECRET`; the redirect improves the immediate journey, while the webhook provides dependable payment-event handling if a customer closes the browser.

## Connect the personalisation form

When the URL includes `demo=1`, the submission:

- validates required fields in the browser
- excludes the photo from local storage
- stores only non-file demo fields under `birthdayHeroDemoSubmission`
- redirects to `/thank-you`

Without `demo=1`, the form requires Stripe’s automatically supplied Checkout Session ID and submits to the server-only `/api/orders` Route Handler. That endpoint verifies the completed payment with Stripe, validates every field, limits optional photographs to JPG/PNG/WebP files of 5MB or less, uploads images to a private bucket, and stores the order in Supabase. Stripe and Supabase server keys are never sent to the browser.

### Supabase launch setup

1. Create a Supabase project in the UK or closest appropriate region.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor. This creates the private order table and private `order-photos` bucket with row-level security enabled and no public policies.
3. Copy `.env.example` to `.env.local` for local testing, or add the same names in Vercel **Settings → Environment Variables**.
4. Set the Supabase, Stripe and notification values listed in `.env.example`. Use Supabase's current `sb_secret_…` server key, and never expose it or a Stripe secret key in source code or with a `NEXT_PUBLIC_` prefix.
5. Configure a Supabase Database Webhook or Make workflow for new `birthday_hero_orders` rows to notify `hello@birthdayherobook.com`. Do not include child details or photographs in the notification email; link staff to the protected Supabase dashboard instead.
6. Add a documented retention/deletion schedule and restricted staff-access process before accepting live orders.

The Stripe redirect URLs deliberately omit `demo=1`, so paid customers use the secure Supabase path. The temporary checkout URLs in `lib/site-config.ts` include `demo=1`, keeping local review submissions on-device.

### Other form-platform options

### Tally

Rebuild the fields in Tally, use the same privacy wording, and redirect the Stripe Payment Link to the Tally URL. Alternatively embed Tally and keep this page shell.

### Airtable + Make

Submit to a private Next.js Route Handler. That server-side endpoint should verify and sanitize fields, then call a Make webhook or Airtable API using environment variables. Never call Airtable with a private token directly from the browser.

Whichever platform is chosen, retain upload size/type checks, spam protection, automatic payment verification, encrypted transport/storage, retention automation, and an internal access policy. Have the data flow and policies professionally reviewed before accepting children’s information.

## Artwork and replacement

Original generated launch artwork lives in `public/illustrations/`:

- `adventure-world.png` — panoramic three-world story illustration
- `birthday-theatre.png` — theatrical paper-collage hero image
- `adventure-dinosaur.png` — bespoke Dinosaur Birthday Adventure card
- `adventure-space.png` — bespoke Magical Space Adventure card
- `adventure-mystery.png` — bespoke Birthday Mystery card

The illustrations are deliberately text-free; names and titles are live HTML. To replace an image, retain the filename and approximate aspect ratio, or change the relevant `next/image` path. Keep focal subjects near the current crop positions and export a modern WebP/AVIF version when final artwork is approved. Next.js will generate responsive formats automatically.

These are polished original launch illustrations. The adventure-card set deliberately represents different children and experiences while preserving one coherent publishing style.

## Privacy notes

The form requests first name and age being turned—not surname, exact birth date, school, address or precise location. Photograph upload is optional. Permission and privacy acknowledgements are required; marketing consent is separate and not preselected.

The public legal pages identify Birthday Hero Book as a UK-based service. A qualified UK professional should still review the complete processing flow, contracts, retention schedule, cancellation consent for personalised digital content, cookie/analytics setup and final policy text before launch.

## Deploy to Vercel

1. Push the project to a Git provider.
2. Import it in Vercel; it will detect Next.js automatically.
3. Use `npm run build` as the build command (the default).
4. Add environment variables only when the server-side form integration exists.
5. Deploy and test all Stripe redirect URLs against the production hostname.

## Connect `birthdayherobook.com`

1. In the Vercel project, open **Settings → Domains** and add `birthdayherobook.com` and `www.birthdayherobook.com`.
2. The domain is registered through Squarespace. In the Squarespace Domains dashboard, open the domain’s DNS settings and add the exact records Vercel shows. Do not replace unrelated email records.
3. Choose the apex domain as primary and redirect `www` to it.
4. Wait for DNS verification and Vercel’s SSL certificate.
5. Update `metadataBase`, sitemap hostname and any form redirect/webhook allowlists if a staging domain was used first.

## Launch checklist

- Replace checkout links and test all three payment/redirect paths
- Connect secure form storage and delivery automation
- Professionally review legal/privacy/cancellation wording
- Replace or approve illustration assets and test alternative likenesses
- Add consent-aware analytics and cookie handling if required
- Add a monitored support inbox
- Test email deliverability and five-working-day operations
- Verify mobile, keyboard, reduced-motion and screen-reader journeys
