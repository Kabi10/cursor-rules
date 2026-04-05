# Drizzle ORM Rules

## Schema Definition
Define all tables in `db/schema.ts`. Export every table and its inferred types.
```ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Item = InferSelectModel<typeof items>;
export type NewItem = InferInsertModel<typeof items>;
```

## Queries
- Use the query builder (`db.select().from()`) for reads.
- Use `db.insert().values().returning()` for inserts when you need the created row.
- Never write raw SQL unless the query builder cannot express it.

## Migrations
- Run `drizzle-kit generate` to create migration files. Never edit generated files manually.
- Apply migrations with `drizzle-kit migrate` in CI before deploying.

## Rules
- Keep the `db` instance in `db/index.ts`. Import it everywhere else.
- Never pass the `db` instance to client components.
- Use transactions (`db.transaction()`) for multi-step writes.
