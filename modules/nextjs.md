# Next.js Rules

## Component Model
- Default to Server Components. Add `'use client'` only when you need browser APIs, event handlers, or useState/useEffect.
- Never import server-only code in Client Components.
- Co-locate server logic with the page that needs it.

## App Router Conventions
- `page.tsx` — route UI
- `layout.tsx` — shared shell (do not fetch data here unless it applies to every child)
- `loading.tsx` — Suspense boundary
- `error.tsx` — error boundary (must be a Client Component)
- `route.ts` — API route handler

## Data Fetching
```tsx
// CORRECT: fetch in Server Component
export default async function Page() {
  const data = await fetch('https://api.example.com/items', {
    next: { revalidate: 60 },
  }).then(r => r.json());
  return <ItemList items={data} />;
}
```

## Server Actions
Use Server Actions for mutations. Never build a separate API route just to handle a form submit.
```tsx
async function createItem(formData: FormData) {
  'use server';
  const name = formData.get('name') as string;
  await db.insert(items).values({ name });
  revalidatePath('/items');
}
```

## Rules
- Always use `next/image` for images — never `<img>`.
- Always use `next/link` for internal navigation — never `<a>`.
- Metadata must be exported from `page.tsx` or `layout.tsx`, not set with `<head>`.
