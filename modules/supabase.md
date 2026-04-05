# Supabase Rules

## Row Level Security
Enable RLS on every table. Never leave a table without policies.
```sql
-- ALWAYS enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rows
CREATE POLICY "users see own items"
  ON items FOR SELECT
  USING (auth.uid() = user_id);
```

## Auth
- Use `supabase.auth.getUser()` server-side to get the authenticated user. Never trust `getSession()` alone for authorization.
- Store the Supabase client in a singleton. Never instantiate it inside a component.

## Queries
```ts
// WRONG: no error handling
const { data } = await supabase.from('items').select('*');

// RIGHT
const { data, error } = await supabase.from('items').select('id, name, created_at');
if (error) throw new Error(error.message);
```

## Rules
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Use it only in server-side code.
- Use typed clients: generate types with `supabase gen types typescript`.
- Prefer server-side Supabase client in Next.js Server Components and Route Handlers.
