# Configurable Enum Style: enum vs union/const

## Context

TypeScript best practices are moving away from `enum` declarations. The `erasableSyntaxOnly` tsconfig option reflects this trend. This change adds a `-enum` generator option so users can choose between traditional TypeScript enums and the modern `as const` object + union type pattern.

## Option

**`-enum`** accepts two values:

| Value | Description |
|-------|-------------|
| `enum` | (default) Current behavior — generates `export enum` |
| `union` | Generates `as const` object + union type |

## Output Formats

### Input RIDL

```ridl
enum Kind: uint32
  - USER
  - ADMIN

enum Intent: string
  - openSession
  - closeSession
```

### `-enum=enum` (default)

```typescript
export enum Kind {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum Intent {
  openSession = 'openSession',
  closeSession = 'closeSession'
}
```

### `-enum=union`

```typescript
export const Kind = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const
export type Kind = (typeof Kind)[keyof typeof Kind]

export const Intent = {
  openSession: 'openSession',
  closeSession: 'closeSession',
} as const
export type Intent = (typeof Intent)[keyof typeof Intent]
```

## Design Details

- The const object and type share the same name — this is intentional and idiomatic TypeScript (declaration merging between value and type namespaces).
- Value logic is the same for both styles: `$field.Value` for string-typed enums, `$field.Name` for others.
- The union type is fully compatible everywhere a TypeScript enum would be used — function parameters, interface fields, etc. — because the type name is identical.
- No changes needed to type references in generated interfaces or client/server code.

## Files Modified

1. **`main.go.tmpl`** — Add `enum` option with default `"enum"`, validate accepts `"enum"` or `"union"`
2. **`types.go.tmpl`** — Branch on `$opts.enum`: existing block for `"enum"`, new const+union block for `"union"`
3. **`_examples/`** — Update generated examples

## Verification

1. Generate with `-enum=enum` — output should match current behavior exactly
2. Generate with `-enum=union` — output should use `as const` + union type pattern
3. Invalid `-enum=foo` — should print error and exit
4. No `-enum` flag — should default to `"enum"` style
