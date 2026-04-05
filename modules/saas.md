# SaaS Rules

## Multi-Tenancy
Every database query that touches tenant data MUST filter by `org_id` or `team_id`. Never return rows across tenant boundaries.
```ts
// WRONG
const items = await db.select().from(items);

// RIGHT
const items = await db.select().from(items).where(eq(items.orgId, currentOrgId));
```

## Authentication Flow
1. Sign up → create user record → create org → create membership
2. Sign in → verify identity → load org membership → set session
3. Invitation → create pending invite → email link → accept → create membership

## Feature Flags
Gate new features behind flags from day one. Never release directly to all users.
```ts
if (await featureEnabled('new-dashboard', orgId)) {
  return <NewDashboard />;
}
return <LegacyDashboard />;
```

## Billing
- Sync subscription state from Stripe webhooks to your DB. Never compute plan limits from Stripe API at request time.
- Store: `plan`, `status`, `current_period_end`, `stripe_customer_id`, `stripe_subscription_id`.
- Check limits server-side before every usage-gated operation.

## Rules
- All admin routes must check `role === 'admin'` server-side — never client-side only.
- Soft-delete users and orgs — never hard delete (compliance, audit trail).
- Every API endpoint must be authenticated. No public endpoints unless intentionally designed as such.
