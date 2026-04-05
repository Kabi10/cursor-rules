# Shadcn/UI Rules

## Component Usage
- Never modify files inside `components/ui/` — these are generated and will be overwritten.
- Extend behaviour by wrapping `ui/` components in your own `components/` directory.

```tsx
// WRONG: editing ui/button.tsx directly
// RIGHT: wrap it
import { Button } from '@/components/ui/button';

export function PrimaryButton({ children, ...props }) {
  return <Button variant="default" size="lg" {...props}>{children}</Button>;
}
```

## Variants
Use `cva` (class-variance-authority) for variant logic — never inline conditional className strings.
```tsx
import { cva } from 'class-variance-authority';

const badge = cva('rounded-full px-2 py-0.5 text-xs font-medium', {
  variants: {
    status: {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-600',
    },
  },
});
```

## Rules
- Install components with `npx shadcn@latest add <component>` — never copy-paste from docs.
- Keep `components/ui/` in `.gitignore` awareness — treat as vendor code.
- Use `cn()` utility for merging Tailwind classes, not manual string concatenation.
