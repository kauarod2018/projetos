# Vemo subscriptions: BRL 49.90/month

## Status

Price approved by the owner on 2026-10-05. Implementation prepared with Stripe, pending provider confirmation and account setup. Billing and live payments are OFF by default. No real charges, provider sandbox transactions, production migrations or Sites deployment were performed.

New companies get one calendar month free without a card. After expiration the verified owner can contract recurring monthly card billing. The checkout has no additional trial. Existing grandfathered companies are not charged automatically. Team invitations do not create or renew a trial.

## Existing or fresh database

Existing installation: backup and test restoration; apply migration 013, then 014 once in maintenance. If 013 is already applied, apply only 014. MySQL DDL is not transactional. Fresh EMPTY database: schema.sql includes both; do not also run incremental migrations. All business records and trial dates remain unchanged. Default server flags remain disabled until verification.

## Provider setup

1. Confirm Stripe as the provider. Create/verify a Brazilian merchant account and complete its required business details. Keep test and production accounts/databases separate.
2. In the sandbox create a single recurring, licensed, per-unit price: BRL 49.90, monthly, interval count 1, no additional taxes/discounts. Use an inclusive or unspecified tax behavior without additional tax rules. Tax/legal/invoice obligations require separate professional review; this app is not a fiscal invoice issuer.
3. Create a dedicated customer portal configuration. Enable invoice history and payment-method updates; enable cancellation AT PERIOD END. Disable subscription updates, quantity changes, coupons and plan switching. The server validates these principal settings before creating checkout/portal sessions. Do not enable a separate public portal login link.
4. Configure a snapshot webhook endpoint at `https://YOUR_DOMAIN/api/billing/webhook`, API version `2026-09-30.endive`. Subscribe to `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Do not configure Connect or organization-wide events for this endpoint.
5. Set APP_URL, SAAS_ENABLED=true, BILLING_ENABLED=true, STRIPE_MODE=test, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID and STRIPE_PORTAL_CONFIGURATION_ID on the SERVER only. Never use NEXT_PUBLIC for these or paste secrets into chat. LIVE_PAYMENTS_ENABLED remains false. Use an isolated staging database/domain: test-mode payments grant only staging access, not a real purchase.
6. Verify the staging checklist below. For live use a separate live database/provider configuration and STRIPE_MODE=live with a matching sk_live key, live price, live portal and live webhook secret. Only after review set LIVE_PAYMENTS_ENABLED=true deliberately. Rebuild with matching SaaS flags. Do not copy test customer/subscription IDs into the live database.

## Enforcement and failure behavior

- Every checkout/portal POST requires same-origin, authenticated verified owner and current membership rechecked under a company lock. Workspace IDs, prices and return URLs are never supplied by the browser. Rate limit: 10 requests per 10 minutes per actor.
- Price and portal settings are checked server-side. Currency, fixed amount, interval, quantity and invoice period are checked again during reconciliation. No amount is accepted from the client.
- Checkout/customer creation uses deterministic provider idempotency keys; open sessions are reused. A completed checkout awaiting a webhook cannot create a duplicate subscription. Provider SDK requests have an 8-second timeout, no automatic network retries.
- All payment information is entered on Stripe-hosted pages. Card numbers are not collected, stored or logged by Vemo. Redirect URLs are restricted to the HTTPS Stripe checkout/portal hosts.
- Webhook payloads are bounded to 256 KiB and verified against the raw body by the official SDK. The application does not implement its own signature algorithm.
- Recognized events fetch CURRENT subscription state while holding the company lock. Customer, metadata and recorded checkout/subscription must match. Previously processed IDs are deduplicated in the same transaction as access updates. Old subscription events cannot replace a newer subscription. Failures return 500 for provider retries, with only event ID/type logged.
- Access is not unlocked by a redirect, subscription status alone or a zero/unpaid/prorated/manual invoice. A matching fully paid monthly invoice grants only its finite invoice-line period; repeated events cannot renew a trial or shorten a later paid deadline. Paid time is preserved through ordinary renewal failure until that deadline. Unsupported plan changes fail closed.
- Missing configuration, key-mode mismatch or a missing explicit live opt-in disables checkout. Missing database tables must be fixed by applying the correct migration, not by bypassing access controls.

## Required staging checks before launch

- Two independent companies, foreign IDs, removed memberships, verified vs unverified owner, editor/viewer/admin, expired trial, trial still active, preserved legacy access.
- Successful first payment, failed card, additional authentication, unfinished checkout, duplicate click, concurrent owner sessions, expired checkout and provider timeout with retried request.
- Paid renewal, failure/recovery, out-of-order and duplicate delivery, invalid/stale signature, partial database failure and event replay. Confirm database locking/rollback on real MySQL; simulator tests are not concurrency proof.
- Portal cancellation at period end, resume before end, access deadline, new subscription after terminal cancellation. Validate the public site's payment copy against actual portal configuration.
- Add alerting for webhook failures and an operator reconciliation procedure using authenticated provider data. Retain event deduplication records for at least the provider replay period.
- Refunds/disputes are NOT automatically reconciled in this version. Before live launch, define the policy and implement the required signed events/operator workflow. A refund does not automatically revoke an already granted paid period. Never extend a period simply because an operator opened a success URL.
- A long outage after remote checkout creation but before database commit can exceed Stripe's idempotency retention. Inspect provider sessions/subscriptions before retrying after such an outage; do not delete billing rows to unblock checkout.
- Finalize terms, privacy, retention/export/deletion, support contact, fiscal obligations and anti-abuse controls. No legal/PCI/LGPD certification is claimed.

## Primary implementation references

- https://docs.stripe.com/billing/subscriptions/build-subscriptions
- https://docs.stripe.com/webhooks
- https://docs.stripe.com/customer-management/integrate-customer-portal
- https://docs.stripe.com/api/checkout/sessions/create
- https://docs.stripe.com/api/invoices/object
- The installed official stripe SDK declarations define the pinned API request/response fields, including `allowed_payment_method_types` on Checkout.

Deployment via Sites remains unavailable here; the current Next/MySQL backend requires a compatible server or a deliberate Sites-compatible backend migration. Do not publish a static mock as a functioning paid SaaS.
