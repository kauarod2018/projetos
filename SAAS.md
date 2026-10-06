# SaaS foundation: companies, team and one-month trial

## Implemented

- An authenticated account remains a person. Business queries use a separate, server-resolved data-owner scope.
- One owned company per account; an account can join other companies through invitations.
- Company membership and entitlement are checked on every authenticated business request.
- Owner/admin/editor/viewer/employee/reception roles. Employee has only assigned work, no general business reads or billing. Reception has customers, scheduling and read-only service reports, without quotes, finance or team management. Editor/viewer remain general access, including finance; viewers cannot mutate. Only owner/admin can change payment profile or manage team. Admin cannot manage owner/admin permissions or grant admin access.
- New accounts choose Individual or Company. Company adds employee registration, restricted invitations and appointment distribution; see `EMPLOYEES.md`. Existing businesses stay Company. Mode changes never restart trials or subscriptions.
- Company selection is stored per authenticated session in MySQL. Switching performs a full browser navigation. Revoked selected membership fails closed; the company picker remains accessible.
- Registration atomically creates the account, company, owner membership and trial when SaaS is enabled.
- Trial starts at registration and lasts one UTC calendar month, with end-of-month clamping. It is company-wide and never restarts through login, invitation or company switching.
- At the exact deadline, private business APIs deny reads and writes with HTTP 402. Account/company metadata stays available. Records are not deleted.
- Existing accounts are grandfathered with legacy access by migration 013. This is not a paid subscription or a new trial.
- Team invitation links expire after seven days, store only SHA-256 digests, and use URL fragments. Acceptance requires the matching verified email, an authorized inviter and current company entitlement. Links are single-use and revocable. No invitation email delivery is claimed: the owner shares the generated link.

## Activation

Default: `SAAS_ENABLED=false`. This preserves the existing installation before migration. Never turn it off after onboarding SaaS users as an entitlement bypass: it is a rollout flag, not a billing setting.

For an existing database: verify a backup and restore procedure, enter maintenance, apply `database/013-saas-workspaces.sql` once after previous required migrations, check backfilled companies/members, then enable SaaS and rebuild. MySQL DDL is not transactional; partial failure requires inspection before retry. Migration 013 deliberately is not advertised as rerunnable.

For a NEW EMPTY database: use `database/schema.sql`, which already contains all SaaS tables. Do not also run migration 013. The optional `005-service-catalog.sql` restores the incremental service-table migration referenced by the existing tests; it is not needed for a fresh schema.

Set server-side MySQL credentials, `APP_URL` with HTTPS, SMTP configuration and tested email verification. Use a staging database to validate two independent owners, an invited team member, revocation, concurrency and rollback before public registration. Registration reads its SaaS disclosure at runtime; production SaaS registration also requires configured HTTPS terms/privacy links. See `VALIDACAO.md` for this release's activation checklist.

## Billing implementation, not activated

The approved introductory plan is BRL 49.90 per company per month. Stripe is implemented as the provisional provider pending the owner's confirmation and account setup. Its official Node SDK 23.0.0 is pinned with API version 2026-09-30.endive. Hosted card checkout, customer portal and signed raw-body webhooks are implemented; no provider account, credentials or real payment has been configured in this workspace. See `BILLING.md` for activation and limitations.

Checkout is available only to the verified company owner after free/paid access ends. There is no second provider trial and no card collection during the free month. An open checkout is reused; an existing nonterminal subscription must be managed through the portal. There is no browser endpoint to set paid status or extend a trial. Success redirects never grant access. Only matching confirmed paid invoice periods extend access; failed renewals cannot grant an unpaid month. Cancellation preserves the finite paid period. Webhook event IDs and state updates are committed atomically under a company lock, with current provider state fetched instead of trusting stale snapshots.

Do not launch public trials until staging MySQL, provider sandbox, cancellation, payment failures, signature verification and webhook replay are tested end-to-end. These are still external activation tasks, not proven by the simulator tests.

Existing public quote links intentionally remain accessible to customers, including approval of previously shared quotes. This does not grant access to the private workspace or permit creation of new links after expiration. Decide and disclose that public-link retention policy before launch.

## Remaining production work

- Apply and verify schema/migration on real MySQL. The route tests use a transactional in-memory database, not a live database.
- Apply pending migrations 014, 015 and 016 after 013 on existing databases; complete real provider sandbox and live MySQL tests before enabling recurring payments and public registration.
- Add operational refund/dispute handling and alerting. Refunded invoices do not automatically shorten an already granted period in this initial implementation; see BILLING.md before live activation.
- Define trial abuse protections, team/AI quotas, retention/export/deletion policy, terms/privacy and observability. No compliance certification is claimed.
- Business history is company-scoped but does not yet attribute every legacy business action to its individual team actor. Add actor-aware auditing before requiring individual accountability.
- Real database concurrency testing is still needed; simulator locks do not prove MySQL race behavior.
- Sites deployment is not completed. This Next/MySQL application needs a compatible server and database or a deliberate Sites-compatible backend migration. The Sites connector is unavailable in this session.

## Verification

`npm run typecheck`, `npm run test:unit`, `npm run build`, then `npm run test:runtime` against that fresh build. `npm run check:staging` reports external configuration gaps separately.

New SaaS policy/route tests cover calendar deadlines, paid-period bounds, roles, selected company isolation, revocation, foreign IDs, invitation lifecycle and atomic registration rollback. Browser screenshots use synthetic fixtures and are explicitly not evidence of a live production account or payment.
