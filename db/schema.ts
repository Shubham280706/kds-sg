import { mysqlTable, int, varchar, timestamp, boolean, datetime, text, mysqlEnum } from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['admin', 'analyst']).default('analyst').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const categories = mysqlTable('categories', {
  id: int('id').primaryKey().autoincrement(),
  code: varchar('code', { length: 10 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  defaultTatHours: int('default_tat_hours').default(48).notNull(),
  color: varchar('color', { length: 7 }).default('#1D9E75').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})

export const tests = mysqlTable('tests', {
  id: int('id').primaryKey().autoincrement(),
  categoryId: int('category_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  unit: varchar('unit', { length: 100 }).notNull(),
  defaultMethod: varchar('default_method', { length: 255}),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})

export const samples = mysqlTable('samples', {
  id: int('id').primaryKey().autoincrement(),
  sampleCode: varchar('sample_code', { length: 50 }).unique().notNull(),
  categoryId: int('category_id').notNull(),
  client: varchar('client', { length: 255 }).notNull(),
  source: varchar('source', { length: 255 }),
  samplingAt: datetime('sampling_at').notNull(),
  receivedAt: datetime('received_at').notNull(),
  receivedBy: int('received_by').notNull(),
  quantity: varchar('quantity', { length: 100 }),
  condition: varchar('condition', { length: 255 }),
  remarks: text('remarks'),
  status: mysqlEnum('status', ['registered', 'assigned', 'in_analysis', 'under_review', 'approved', 'reported', 'closed']).default('registered').notNull(),
  dueAt: datetime('due_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})

export const sampleTests = mysqlTable('sample_tests', {
  id: int('id').primaryKey().autoincrement(),
  sampleId: int('sample_id').notNull(),
  testId: int('test_id').notNull(),
  assignedTo: int('assigned_to'),
  status: mysqlEnum('status', ['pending', 'in_progress', 'done']).default('pending').notNull(),
  resultValue: varchar('result_value', { length: 255 }),
  resultUnit: varchar('result_unit', { length: 100 }),
  method: varchar('method', { length: 255 }),
  doneAt: datetime('done_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const statusEvents = mysqlTable('status_events', {
  id: int('id').primaryKey().autoincrement(),
  sampleId: int('sample_id').notNull(),
  fromStatus: varchar('from_status', { length: 50 }).notNull(),
  toStatus: varchar('to_status', { length: 50 }).notNull(),
  byUser: int('by_user').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  samples: many(samples),
  sampleTests: many(sampleTests),
  statusEvents: many(statusEvents),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  tests: many(tests),
  samples: many(samples),
}))

export const testsRelations = relations(tests, ({ one, many }) => ({
  category: one(categories, { fields: [tests.categoryId], references: [categories.id] }),
  sampleTests: many(sampleTests),
}))

export const samplesRelations = relations(samples, ({ one, many }) => ({
  category: one(categories, { fields: [samples.categoryId], references: [categories.id] }),
  receivedByUser: one(users, { fields: [samples.receivedBy], references: [users.id] }),
  sampleTests: many(sampleTests),
  statusEvents: many(statusEvents),
}))

export const sampleTestsRelations = relations(sampleTests, ({ one }) => ({
  sample: one(samples, { fields: [sampleTests.sampleId], references: [samples.id] }),
  test: one(tests, { fields: [sampleTests.testId], references: [tests.id] }),
  assignedToUser: one(users, { fields: [sampleTests.assignedTo], references: [users.id] }),
}))

export const statusEventsRelations = relations(statusEvents, ({ one }) => ({
  sample: one(samples, { fields: [statusEvents.sampleId], references: [samples.id] }),
  byUser: one(users, { fields: [statusEvents.byUser], references: [users.id] }),
}))
