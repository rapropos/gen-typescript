import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Union variant: enums generated with `-enum=union` as `as const` objects + union types.
import {
  Kind,
  Intent,
  errors,
  WebrpcErrorCodes,
} from './enum-union.gen.js'
import type {
  Kind as KindType,
  Intent as IntentType,
  UserRec,
} from './enum-union.gen.js'

const unionSource = readFileSync(
  fileURLToPath(new URL('./enum-union.gen.ts', import.meta.url)),
  'utf8',
)
const defaultSource = readFileSync(
  fileURLToPath(new URL('./enum-default.gen.ts', import.meta.url)),
  'utf8',
)

describe('enum=union schema enums', () => {
  it('exposes members as runtime const-object values', () => {
    // Numeric-backed enum uses the field name as the value (matches `enum` behavior).
    expect(Kind.USER).toBe('USER')
    expect(Kind.ADMIN).toBe('ADMIN')
    // String-backed enum uses the field value.
    expect(Intent.openSession).toBe('openSession')
    expect(Intent.closeSession).toBe('closeSession')
  })

  it('produces a union type that doubles as a value (drop-in for enum)', () => {
    // Type position: the generated type name is usable as an annotation.
    const k: KindType = Kind.USER
    const i: IntentType = Intent.closeSession
    const rec: UserRec = { kind: Kind.ADMIN, intent: Intent.openSession }

    expect(k).toBe('USER')
    expect(i).toBe('closeSession')
    expect(rec).toEqual({ kind: 'ADMIN', intent: 'openSession' })
  })

  it('keys/values mirror an enum so iteration still works', () => {
    expect(Object.keys(Kind)).toEqual(['USER', 'ADMIN'])
    expect(Object.values(Intent)).toEqual(['openSession', 'closeSession'])
  })
})

describe('enum=union error enums (regression: errors must be erasable too)', () => {
  it('exposes the `errors` name enum as a const object', () => {
    expect(errors.Unauthorized).toBe('Unauthorized')
    expect(errors.RateLimited).toBe('RateLimited')
  })

  it('exposes `WebrpcErrorCodes` as a const object preserving numeric codes', () => {
    expect(WebrpcErrorCodes.Unauthorized).toBe(1000)
    expect(WebrpcErrorCodes.RateLimited).toBe(1001)
    // Built-in webrpc codes are still present and negative.
    expect(WebrpcErrorCodes.WebrpcEndpoint).toBe(0)
    expect(WebrpcErrorCodes.WebrpcInternalError).toBe(-7)
  })
})

describe('erasability', () => {
  it('emits no runtime `enum` in union mode (incl. error enums)', () => {
    // The whole point of `-enum=union`: nothing that survives type erasure.
    expect(unionSource).not.toMatch(/export enum/)
    expect(unionSource).toContain('export const Kind = {')
    expect(unionSource).toContain('export const errors = {')
    expect(unionSource).toContain('export const WebrpcErrorCodes = {')
  })

  it('default mode still emits runtime `enum` (flag actually toggles behavior)', () => {
    expect(defaultSource).toContain('export enum Kind {')
    expect(defaultSource).toContain('export enum errors {')
    expect(defaultSource).toContain('export enum WebrpcErrorCodes {')
  })
})
