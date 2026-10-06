# Individual, Company and restricted employees

## Product scope

New registrations choose Individual (default) or Company, with a required company name for Company. Individual keeps clients, agenda, quotes, services and finance but has no team. Company adds an employee directory and appointment distribution. The introductory price remains BRL 49.90 per business per month; this release does not add per-seat charges or paid upgrades. The existing one-calendar-month trial applies to both modes.

An account identifies a person, not an employee record. Owners register staff (name, email, phone, job title) separately, then share an invitation for restricted access. No invitation email is sent by this flow. Acceptance requires an account with the same verified email. Invitation tokens are hashed, seven-day, single-use and revocable. Employees can belong to an employer and separately own an Individual workspace. Those subscriptions and data are independent.

## Permissions

| Role | Business records | Staff and assignments | Subscription | Own assigned work |
| --- | --- | --- | --- | --- |
| Owner | Full | Manage | Manage after verified email | Uses manager distribution |
| Admin | Full | Manage, excluding owner/admin escalation | Metadata only | Uses manager distribution |
| Editor (general access) | Read/write, including finance | No | Metadata only | No restricted-worker screen |
| Viewer (general access) | Read only, including finance | No | Metadata only | No restricted-worker screen |
| Employee | No general business endpoints | No directory/coworkers | No billing endpoint | Own assigned appointments only |

**Editor and Viewer are NOT confidential employee roles.** Existing permissions were preserved and are explicitly labeled general access. Employee is the default invitation choice. It requires a corresponding active employee record. For an existing general-access member without a staff record, remove the general membership first, register the employee and issue a restricted invitation. Where a staff record already exists, managers can change the role to Employee in team permissions. A record cannot silently attach an existing general-access member.

The worker projection contains appointment title, customer name, start/end civil time, status, version and dedicated employee instructions. It excludes customer IDs/contact details, general appointment notes, financial IDs/amounts, catalog prices and coworkers. Managers must avoid confidential content in shared titles or dedicated instructions. Workers can move Scheduled/Confirmed to In service, then Completed, only for their assignment. They cannot cancel, reschedule, reopen, skip execution, change assignment or create financial transactions.

## Lifecycle and integrity

- Company scope, membership and entitlement are enforced server-side. Worker requests cannot select another employee/company using query/body fields. General private APIs deny Employee even on GET; navigation hiding is supplementary.
- Registering, inviting, switching businesses or converting Individual to Company does not restart or extend a trial. Only Owner can change mode. Company cannot convert to Individual with other members, active employee records or live pending invitations.
- Archiving preserves directory and assignment history, removes employee membership, clears the login link and revokes unused invitations. Restoring requires a new invitation. Removing team access also clears its employee login link. Revoked selected-company membership fails closed; the company picker remains available.
- Employee email is immutable to prevent a different person inheriting assignments. Register another record for a different identity. Duplicate emails, including archived records, are rejected within a company.
- Assignment changes increment appointment version. Worker status updates require the current version and assignment; stale changes return 409. Company locking serializes permission changes and staff mutations. Assignment/status updates and actor-aware activity entries are transactional.
- Invitation acceptance opens `/meu-trabalho` for Employee. A fresh login follows the existing owned-workspace default; use My account / company selection when the employer is not selected. Company selection is per authenticated session, not a persistent cross-device preference.

## Limits and activation

This is a first staff-management slice, not payroll or HR. Salaries, commissions, attendance/timeclock, documents and granular receptionist permissions are not implemented. Each appointment has one assigned employee. Distribution is day-based, max 250 appointments per request. Existing company-wide appointment conflict rules remain: simultaneous independent calendars per employee are NOT implemented. Recurring appointment occurrences must be assigned individually; no automatic staff propagation is claimed.

Apply `database/015-individual-company-employees.sql` once AFTER 013 and 014, in maintenance, with a tested backup/restore. Existing businesses remain Company without changed memberships, business rows or subscriptions. New empty databases use `database/schema.sql` instead of incremental migrations. New tables have foreign keys and company-scoped unique constraints. DDL is not transactional: inspect any partial migration before retrying.

Build and runtime must both use `SAAS_ENABLED=true` after migration. Do not switch the flag off for employee accounts: legacy mode intentionally has no SaaS permissions. Real MySQL configuration and concurrent staging tests are still required before rollout. The isolated route tests use an in-memory transactional harness; browser tests use synthetic fixtures and cannot prove live DB race behavior, email delivery or payment operation. Billing and Sites activation remain separate pending tasks described in `SAAS.md` and `BILLING.md`.
