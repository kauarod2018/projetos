import { bigint, boolean, double, index, int, mediumtext, mysqlTable, text, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

const id = (name = "id") => int(name, { unsigned: true }).autoincrement().primaryKey();
const reference = (name: string) => int(name, { unsigned: true });
const timestamp = (name: string) => varchar(name, { length: 24 });
const created = (name = "created_at") => timestamp(name).notNull().$defaultFn(() => new Date().toISOString());
const money = (name: string) => bigint(name, { mode: "number", unsigned: true });

export const users = mysqlTable("users", {
  id: id(), name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  phone: varchar("phone", { length: 30 }).notNull().default(""),
  passwordHash: varchar("password_hash", { length: 128 }).notNull(),
  passwordSalt: varchar("password_salt", { length: 32 }).notNull(), createdAt: created(),
  emailVerifiedAt: timestamp("email_verified_at"),
  businessProfile: mediumtext("business_profile"),
});

export const accountTokens = mysqlTable("account_tokens", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: reference("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  purpose: varchar("purpose", { length: 16 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(), createdAt: created(),
}, (table) => [index("idx_account_tokens_user").on(table.userId), index("idx_account_tokens_expiry").on(table.expiresAt)]);

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: reference("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(), createdAt: created(),
}, (table) => [index("idx_sessions_user_id").on(table.userId), index("idx_sessions_expires_at").on(table.expiresAt)]);

export const loginAttempts = mysqlTable("login_attempts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  attempts: int("attempts", { unsigned: true }).notNull().default(0),
  windowStartedAt: timestamp("window_started_at").notNull(),
  blockedUntil: timestamp("blocked_until"), updatedAt: created("updated_at"),
});

// Business records retain their original owner key during the SaaS migration.
export const workspaces = mysqlTable("workspaces", {
  id: id(), ownerUserId: reference("owner_user_id").notNull().unique().references(() => users.id, { onDelete: "restrict" }),
  kind: varchar("kind", { length: 16 }).notNull().default("company"),
  name: varchar("name", { length: 120 }).notNull(), createdAt: created(),
});

export const workspaceMembers = mysqlTable("workspace_members", {
  workspaceId: reference("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: reference("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 16 }).notNull(), createdAt: created(),
}, table => [uniqueIndex("uq_workspace_member").on(table.workspaceId, table.userId), index("idx_workspace_member_user").on(table.userId)]);

export const workspaceSubscriptions = mysqlTable("workspace_subscriptions", {
  workspaceId: reference("workspace_id").primaryKey().references(() => workspaces.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 16 }).notNull(),
  trialStartsAt: timestamp("trial_starts_at"), trialEndsAt: timestamp("trial_ends_at"),
  paidUntil: timestamp("paid_until"), updatedAt: created("updated_at"),
});

export const workspaceSelections = mysqlTable("workspace_selections", {
  sessionId: varchar("session_id", { length: 64 }).primaryKey().references(() => sessions.id, { onDelete: "cascade" }),
  workspaceId: reference("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
});

export const workspaceInvites = mysqlTable("workspace_invites", {
  id: varchar("id", { length: 64 }).primaryKey(),
  workspaceId: reference("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 254 }).notNull(), role: varchar("role", { length: 16 }).notNull(),
  invitedBy: reference("invited_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  expiresAt: timestamp("expires_at").notNull(), acceptedAt: timestamp("accepted_at"), revokedAt: timestamp("revoked_at"), createdAt: created(),
}, table => [index("idx_workspace_invites").on(table.workspaceId, table.email)]);

export const workspaceBilling = mysqlTable("workspace_billing", {
  workspaceId: reference("workspace_id").primaryKey().references(() => workspaces.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id", { length: 255 }).unique(),
  subscriptionId: varchar("subscription_id", { length: 255 }).unique(),
  checkoutId: varchar("checkout_id", { length: 255 }).unique(),
  checkoutGeneration: int("checkout_generation", { unsigned: true }).notNull().default(0),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  providerStatus: varchar("provider_status", { length: 32 }), updatedAt: created("updated_at"),
});

export const billingEvents = mysqlTable("billing_events", {
  id: varchar("id", { length: 255 }).primaryKey(),
  workspaceId: reference("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }).notNull(), createdAt: created(),
});

export const customers = mysqlTable("customers", {
  id: id(), userId: reference("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(), phone: varchar("phone", { length: 30 }).notNull().default(""),
  email: varchar("email", { length: 254 }).notNull().default(""),
  address: varchar("address", { length: 300 }).notNull().default(""),
  notes: varchar("notes", { length: 1000 }).notNull().default(""), createdAt: created(),
  requestKey: varchar("request_key", { length: 36 }),
}, (table) => [index("idx_customers_user_id").on(table.userId), uniqueIndex("uq_customers_owner_request").on(table.userId, table.requestKey)]);

export const services = mysqlTable("services", {
  id: id(), userId: reference("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  description: varchar("description", { length: 300 }).notNull().default(""),
  priceCents: money("price_cents").notNull(),
  durationMinutes: int("duration_minutes", { unsigned: true }).notNull(),
  archived: boolean("archived").notNull().default(false),
  version: int("version", { unsigned: true }).notNull().default(1),
  requestKey: varchar("request_key", { length: 36 }).notNull(),
  createdAt: created(), updatedAt: created("updated_at"),
}, (table) => [index("idx_services_owner_archived").on(table.userId, table.archived), uniqueIndex("uq_services_owner_request").on(table.userId, table.requestKey)]);

export const appointments = mysqlTable("appointments", {
  id: id(), userId: reference("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customerId: reference("customer_id").references(() => customers.id, { onDelete: "set null" }),
  serviceId: reference("service_id").references(() => services.id, { onDelete: "set null" }),
  employeeId: reference("employee_id"), quoteId: reference("quote_id"),
  seriesId: reference("series_id"), occurrenceKey: varchar("occurrence_key", { length: 80 }),
  customerName: varchar("customer_name", { length: 120 }).notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  startsAt: varchar("starts_at", { length: 16 }).notNull(), endsAt: varchar("ends_at", { length: 16 }).notNull(),
  durationMinutes: int("duration_minutes", { unsigned: true }).notNull(),
  notes: varchar("notes", { length: 1000 }).notNull().default(""),
  status: varchar("status", { length: 24 }).notNull().default("Agendado"),
  version: int("version", { unsigned: true }).notNull().default(1),
  requestKey: varchar("request_key", { length: 36 }).notNull(),
  createdAt: created(), updatedAt: created("updated_at"),
}, table => [index("idx_appointments_owner_time").on(table.userId, table.startsAt), index("idx_appointments_resource_time").on(table.userId, table.employeeId, table.startsAt), index("idx_appointments_quote").on(table.userId, table.quoteId), uniqueIndex("uq_appointments_owner_request").on(table.userId, table.requestKey), uniqueIndex("uq_appointments_owner_occurrence").on(table.userId, table.occurrenceKey)]);

export const workspaceEmployees = mysqlTable("workspace_employees", {
  id: id(), workspaceId: reference("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: reference("user_id").references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 120 }).notNull(), email: varchar("email", { length: 254 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull().default(""), jobTitle: varchar("job_title", { length: 120 }).notNull().default(""),
  availability: text("availability"),
  archived: boolean("archived").notNull().default(false), version: int("version", { unsigned: true }).notNull().default(1),
  createdAt: created(), updatedAt: created("updated_at"),
}, table => [uniqueIndex("uq_employee_email").on(table.workspaceId, table.email), uniqueIndex("uq_employee_user").on(table.workspaceId, table.userId)]);

export const employeeAssignments = mysqlTable("employee_assignments", {
  appointmentId: reference("appointment_id").primaryKey().references(() => appointments.id, { onDelete: "cascade" }),
  workspaceId: reference("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  employeeId: reference("employee_id").notNull().references(() => workspaceEmployees.id, { onDelete: "restrict" }),
  instructions: varchar("instructions", { length: 1000 }).notNull().default(""),
  assignedBy: reference("assigned_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  updatedAt: created("updated_at"),
}, table => [index("idx_employee_assignments").on(table.workspaceId, table.employeeId)]);

export const employeeAbsences = mysqlTable("employee_absences", {
  id: id(), workspaceId: reference("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  employeeId: reference("employee_id").notNull().references(() => workspaceEmployees.id, { onDelete: "cascade" }),
  startsAt: varchar("starts_at", { length: 16 }).notNull(), endsAt: varchar("ends_at", { length: 16 }).notNull(),
  reason: varchar("reason", { length: 120 }).notNull().default(""), createdAt: created(),
}, table => [index("idx_absences_resource").on(table.workspaceId, table.employeeId, table.startsAt)]);

export const serviceReports = mysqlTable("service_reports", {
  appointmentId: reference("appointment_id").primaryKey().references(() => appointments.id, { onDelete: "cascade" }),
  userId: reference("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  checklist: text("checklist").notNull(), photos: mediumtext("photos").notNull(),
  summary: varchar("summary", { length: 2000 }).notNull().default(""),
  acknowledgedBy: varchar("acknowledged_by", { length: 120 }), acknowledgedAt: timestamp("acknowledged_at"),
  nextVisitOn: varchar("next_visit_on", { length: 10 }),
  publicTokenHash: varchar("public_token_hash", { length: 64 }).unique(), publicExpiresAt: timestamp("public_expires_at"),
  version: int("version", { unsigned: true }).notNull().default(1), updatedAt: created("updated_at"),
}, table => [index("idx_reports_owner_return").on(table.userId, table.nextVisitOn)]);

export const appointmentSeries = mysqlTable("appointment_series", {
  id: id(), userId: reference("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recurrence: varchar("recurrence", { length: 16 }).notNull(), intervalCount: int("interval_count", { unsigned: true }).notNull().default(1),
  startsOn: varchar("starts_on", { length: 10 }).notNull(), endsOn: varchar("ends_on", { length: 10 }).notNull(), createdAt: created(),
}, table => [index("idx_appointment_series_owner").on(table.userId, table.startsOn)]);

export const quotes = mysqlTable("quotes", {
  id: id(), userId: reference("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customerId: reference("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  clientSnapshot: text("client_snapshot"),
  description: text("description").notNull(),
  status: varchar("status", { length: 24 }).notNull().default("Rascunho"),
  validUntil: varchar("valid_until", { length: 10 }).notNull(),
  deadline: varchar("deadline", { length: 200 }).notNull().default("A combinar"),
  paymentMethod: varchar("payment_method", { length: 200 }).notNull().default("Pix"),
  discountCents: money("discount_cents").notNull().default(0),
  createdAt: created(), updatedAt: created("updated_at"),
  sentAt: timestamp("sent_at"), approvedAt: timestamp("approved_at"), archivedAt: timestamp("archived_at"),
  publicToken: varchar("public_token", { length: 64 }).notNull().unique(),
}, (table) => [index("idx_quotes_customer_id").on(table.customerId), index("idx_quotes_user_id").on(table.userId), index("idx_quotes_status").on(table.status)]);

export const quoteItems = mysqlTable("quote_items", {
  id: id(), quoteId: reference("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 16 }).notNull().default("service"),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: double("quantity").notNull().default(1), unitPriceCents: money("unit_price_cents").notNull(),
}, (table) => [index("idx_quote_items_quote_id").on(table.quoteId)]);

export const transactions = mysqlTable("transactions", {
  id: id(), userId: reference("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quoteId: reference("quote_id").references(() => quotes.id, { onDelete: "set null" }),
  obligationId: reference("obligation_id"), voidedAt: timestamp("voided_at"), reversalOfId: reference("reversal_of_id"),
  requestKey: varchar("request_key", { length: 36 }),
  receiptVersion: int("receipt_version", { unsigned: true }).notNull().default(1),
  category: varchar("category", { length: 50 }).notNull().default("Outros"),
  type: varchar("type", { length: 16 }).notNull(), description: varchar("description", { length: 300 }).notNull(),
  amountCents: money("amount_cents").notNull(), transactionDate: varchar("transaction_date", { length: 10 }).notNull(),
  createdAt: created(),
}, (table) => [index("idx_transactions_user_id").on(table.userId), index("idx_transactions_date").on(table.transactionDate), index("idx_transactions_obligation").on(table.userId, table.obligationId), uniqueIndex("uq_transactions_reversal").on(table.reversalOfId), uniqueIndex("uq_transactions_owner_request").on(table.userId, table.requestKey)]);

export const financialObligations = mysqlTable("financial_obligations", {
  id: id(), userId: reference("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quoteId: reference("quote_id").references(() => quotes.id, { onDelete: "set null" }),
  customerId: reference("customer_id").references(() => customers.id, { onDelete: "set null" }),
  type: varchar("type", { length: 16 }).notNull(), description: varchar("description", { length: 300 }).notNull(),
  amountCents: money("amount_cents").notNull(), dueDate: varchar("due_date", { length: 10 }).notNull(), status: varchar("status", { length: 16 }).notNull().default("open"),
  installmentGroup: varchar("installment_group", { length: 36 }), installmentNumber: int("installment_number", { unsigned: true }).notNull().default(1), installmentCount: int("installment_count", { unsigned: true }).notNull().default(1),
  requestKey: varchar("request_key", { length: 36 }), version: int("version", { unsigned: true }).notNull().default(1), createdAt: created(), updatedAt: created("updated_at"),
}, table => [index("idx_obligations_owner_due").on(table.userId, table.status, table.dueDate), index("idx_obligations_quote").on(table.userId, table.quoteId), uniqueIndex("uq_obligations_owner_request").on(table.userId, table.requestKey)]);

export const businessActivity = mysqlTable("business_activity", {
  id: id(), userId: reference("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 40 }).notNull(), entityType: varchar("entity_type", { length: 32 }).notNull(),
  entityId: reference("entity_id"), title: varchar("title", { length: 240 }).notNull(), details: mediumtext("details"),
  reversible: boolean("reversible").notNull().default(false), undoneAt: timestamp("undone_at"), createdAt: created(),
}, table => [index("idx_business_activity_owner_time").on(table.userId, table.createdAt), index("idx_business_activity_entity").on(table.userId, table.entityType, table.entityId)]);

export const assistantUsage = mysqlTable("assistant_usage", {
  userId: reference("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  usageDay: varchar("usage_day", { length: 10 }).notNull(), requestCount: int("request_count", { unsigned: true }).notNull().default(0), updatedAt: created("updated_at"),
}, table => [uniqueIndex("uq_assistant_usage_owner_day").on(table.userId, table.usageDay)]);

export const receiptDateCorrections = mysqlTable("receipt_date_corrections", {
  id: id(), userId: reference("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  transactionId: reference("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  version: int("version", { unsigned: true }).notNull(),
  previousDate: varchar("previous_date", { length: 10 }).notNull(),
  correctedDate: varchar("corrected_date", { length: 10 }).notNull(),
  reason: varchar("reason", { length: 500 }).notNull(), createdAt: created(),
}, table => [uniqueIndex("uq_receipt_correction_version").on(table.transactionId, table.version), index("idx_receipt_correction_owner").on(table.userId, table.transactionId)]);
