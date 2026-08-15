import { pgTable, uuid, varchar, timestamp, text, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { customers } from './customers.js';
import { subscriptions } from './subscriptions.js';

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
    invoiceNumber: varchar('invoice_number', { length: 100 }).notNull().unique(),
    amountDue: integer('amount_due').notNull().default(0),
    amountPaid: integer('amount_paid').notNull().default(0),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    status: varchar('status', { length: 50 }).notNull().default('PAID'), // PAID, OPEN, VOID, UNCOLLECTIBLE, REFUNDED
    invoicePdfUrl: text('invoice_pdf_url'),
    dueDate: timestamp('due_date', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('invoice_num_idx').on(table.invoiceNumber),
    index('invoices_customer_idx').on(table.customerId),
    index('invoices_status_idx').on(table.status)
  ]
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
    invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
    amount: integer('amount').notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    status: varchar('status', { length: 50 }).notNull().default('SUCCEEDED'), // SUCCEEDED, PENDING, FAILED, REFUNDED
    paymentMethod: varchar('payment_method', { length: 50 }).default('CARD').notNull(),
    provider: varchar('provider', { length: 50 }).notNull().default('MOCK'),
    providerTransactionId: varchar('provider_transaction_id', { length: 255 }),
    failureReason: text('failure_reason'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('payments_customer_idx').on(table.customerId),
    index('payments_invoice_idx').on(table.invoiceId),
    index('payments_status_idx').on(table.status)
  ]
);
