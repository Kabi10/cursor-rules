# TypeScript Rules

## Strict Mode
Always enable strict mode. Never disable it to silence errors.
```tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Type Safety
- Never use `any`. Use `unknown` and narrow with type guards.
- Prefer `interface` for object shapes, `type` for unions and intersections.
- Export types alongside their implementations.
- Use `satisfies` operator to validate objects against types without widening.

## Examples

```ts
// WRONG
function process(data: any) { return data.value; }

// RIGHT
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return data.value;
  }
  throw new Error('Invalid data shape');
}
```
