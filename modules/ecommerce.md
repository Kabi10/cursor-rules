# E-commerce Rules

## Cart
- Cart state lives server-side (DB or Redis). Client-side cart is a cache only.
- Validate cart contents and prices server-side at checkout — never trust client prices.

## Checkout Flow
1. Cart review → shipping address → payment → order confirmation
2. Never skip server-side inventory check before charging.
3. Create the order record AFTER payment succeeds, not before.

## Payments
- Use Stripe Payment Intents — never Charges API (deprecated).
- Handle webhooks for: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`.
- Idempotency: use `idempotency_key` on all Stripe API calls.

## Inventory
```ts
// Atomic stock decrement — prevent overselling
await db.transaction(async (tx) => {
  const [product] = await tx
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .for('update');
  if (product.stock < quantity) throw new Error('Insufficient stock');
  await tx.update(products)
    .set({ stock: product.stock - quantity })
    .where(eq(products.id, productId));
});
```

## Rules
- Never log full card numbers or CVV — ever.
- PCI compliance: use Stripe Elements or Stripe Checkout, never build your own card form.
- All prices are stored as integers (cents) in the DB — never floats.
