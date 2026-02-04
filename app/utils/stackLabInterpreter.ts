/**
 * Bitcoin Script Interpreter for Stack Lab
 * Implements core OP codes for educational purposes
 */

import { bytesToHex } from '@/app/utils/stackLabFormatters'

export type StackItem = number | string | boolean | Uint8Array

export interface OpCode {
  name: string
  hex: string
  category: string
  description: string
  enabled: boolean
}

export interface ExecutionStep {
  opCode: string
  stackBefore: StackItem[]
  stackAfter: StackItem[]
  success: boolean
  error?: string
}

export interface ExecutionResult {
  success: boolean
  finalStack: StackItem[]
  steps: ExecutionStep[]
  error?: string
}

export class ScriptInterpreter {
  private stack: StackItem[] = []
  private altStack: StackItem[] = []
  private executionSteps: ExecutionStep[] = []
  private ifStack: boolean[] = [] // Track nested IF conditions

  constructor() {
    this.reset()
  }

  reset(): void {
    this.stack = []
    this.altStack = []
    this.executionSteps = []
    this.ifStack = []
  }

  getStack(): StackItem[] {
    return [...this.stack]
  }

  getSteps(): ExecutionStep[] {
    return [...this.executionSteps]
  }

  private shouldExecute(): boolean {
    // If we're in a false IF branch, don't execute (except control flow ops)
    return this.ifStack.length === 0 || this.ifStack[this.ifStack.length - 1]
  }

  private recordStep(opCode: string, stackBefore: StackItem[], success: boolean, error?: string): void {
    // Capture current stack as "after" state
    const stackAfter = [...this.stack]
    this.executionSteps.push({
      opCode,
      stackBefore: [...stackBefore],
      stackAfter,
      success,
      error,
    })
  }

  private push(item: StackItem): void {
    if (this.stack.length >= 1000) {
      throw new Error('Stack overflow: maximum 1000 items')
    }
    this.stack.push(item)
  }

  private pop(): StackItem | null {
    if (this.stack.length === 0) {
      return null
    }
    return this.stack.pop()!
  }

  private peek(n: number = 0): StackItem | null {
    if (this.stack.length <= n) {
      return null
    }
    return this.stack[this.stack.length - 1 - n]
  }

  // Convert stack item to number
  private toNumber(item: StackItem): number | null {
    if (typeof item === 'number') return item
    if (typeof item === 'boolean') return item ? 1 : 0
    if (typeof item === 'string') {
      // Try to parse hex string
      if (item.startsWith('0x') || /^[0-9a-fA-F]+$/.test(item)) {
        const num = parseInt(item.replace('0x', ''), 16)
        if (!isNaN(num)) return num
      }
      const num = parseInt(item, 10)
      if (!isNaN(num)) return num
    }
    return null
  }

  /** Pop two stack items, convert to numbers. Returns values or error. Does not record step. */
  private popTwoNumbers(): { a: number; b: number } | { error: string } {
    const b = this.pop()
    const a = this.pop()
    if (a === null || b === null) return { error: 'Stack has less than 2 items' }
    const na = this.toNumber(a)
    const nb = this.toNumber(b)
    if (na === null || nb === null) return { error: 'Cannot convert to numbers' }
    return { a: na, b: nb }
  }

  /** Pop one stack item, convert to number. Returns value or error. Does not record step. */
  private popOneNumber(): number | { error: string } {
    const top = this.pop()
    if (top === null) return { error: 'Stack empty' }
    const num = this.toNumber(top)
    if (num === null) return { error: 'Cannot convert to number' }
    return num
  }

  /** Pop one stack item, convert to bytes. Returns value or error. Does not record step. */
  private popOneBytes(): Uint8Array | { error: string } {
    const top = this.pop()
    if (top === null) return { error: 'Stack empty' }
    const bytes = this.toBytes(top)
    if (bytes === null) return { error: 'Cannot convert to bytes' }
    return bytes
  }

  // Convert stack item to bytes
  private toBytes(item: StackItem): Uint8Array | null {
    if (item instanceof Uint8Array) return item
    if (typeof item === 'string') {
      // Hex string
      if (item.startsWith('0x')) {
        const hex = item.slice(2)
        if (hex.length % 2 === 0) {
          const bytes = new Uint8Array(hex.length / 2)
          for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
          }
          return bytes
        }
      }
      // Regular string
      return new TextEncoder().encode(item)
    }
    if (typeof item === 'number') {
      // Convert number to little-endian bytes
      const bytes = new Uint8Array(8)
      const view = new DataView(bytes.buffer)
      view.setBigInt64(0, BigInt(item), true)
      return bytes
    }
    return null
  }

  // Push Operations
  pushData(data: StackItem): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep(`PUSH(${data})`, stackBefore, true)
      return true
    }
    try {
      this.push(data)
      this.recordStep(`PUSH(${data})`, stackBefore, true)
      return true
    } catch (error) {
      this.recordStep(`PUSH(${data})`, stackBefore, false, String(error))
      return false
    }
  }

  op0(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_0', stackBefore, true)
      return true
    }
    this.push(0)
    this.recordStep('OP_0', stackBefore, true)
    return true
  }

  op1Negate(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_1NEGATE', stackBefore, true)
      return true
    }
    this.push(-1)
    this.recordStep('OP_1NEGATE', stackBefore, true)
    return true
  }

  opN(n: number): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep(`OP_${n}`, stackBefore, true)
      return true
    }
    if (n < 1 || n > 16) return false
    this.push(n)
    this.recordStep(`OP_${n}`, stackBefore, true)
    return true
  }

  // Stack Operations
  opDup(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_DUP', stackBefore, true)
      return true
    }
    const top = this.peek()
    if (top === null) {
      this.recordStep('OP_DUP', stackBefore, false, 'Stack empty')
      return false
    }
    this.push(top)
    this.recordStep('OP_DUP', stackBefore, true)
    return true
  }

  opDrop(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_DROP', stackBefore, true)
      return true
    }
    const item = this.pop()
    if (item === null) {
      this.recordStep('OP_DROP', stackBefore, false, 'Stack empty')
      return false
    }
    this.recordStep('OP_DROP', stackBefore, true)
    return true
  }

  opSwap(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_SWAP', stackBefore, true)
      return true
    }
    if (this.stack.length < 2) {
      this.recordStep('OP_SWAP', stackBefore, false, 'Stack has less than 2 items')
      return false
    }
    const a = this.pop()!
    const b = this.pop()!
    this.push(a)
    this.push(b)
    this.recordStep('OP_SWAP', stackBefore, true)
    return true
  }

  opOver(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_OVER', stackBefore, true)
      return true
    }
    const second = this.peek(1)
    if (second === null) {
      this.recordStep('OP_OVER', stackBefore, false, 'Stack has less than 2 items')
      return false
    }
    this.push(second)
    this.recordStep('OP_OVER', stackBefore, true)
    return true
  }

  opRot(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_ROT', stackBefore, true)
      return true
    }
    if (this.stack.length < 3) {
      this.recordStep('OP_ROT', stackBefore, false, 'Stack has less than 3 items')
      return false
    }
    const c = this.pop()!
    const b = this.pop()!
    const a = this.pop()!
    this.push(b)
    this.push(c)
    this.push(a)
    this.recordStep('OP_ROT', stackBefore, true)
    return true
  }

  op2Drop(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_2DROP', stackBefore, true)
      return true
    }
    if (this.stack.length < 2) {
      this.recordStep('OP_2DROP', stackBefore, false, 'Stack has less than 2 items')
      return false
    }
    this.pop()
    this.pop()
    this.recordStep('OP_2DROP', stackBefore, true)
    return true
  }

  op2Dup(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_2DUP', stackBefore, true)
      return true
    }
    if (this.stack.length < 2) {
      this.recordStep('OP_2DUP', stackBefore, false, 'Stack has less than 2 items')
      return false
    }
    const b = this.peek(1)!
    const a = this.peek()!
    this.push(b)
    this.push(a)
    this.recordStep('OP_2DUP', stackBefore, true)
    return true
  }

  opNip(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_NIP', stackBefore, true)
      return true
    }
    if (this.stack.length < 2) {
      this.recordStep('OP_NIP', stackBefore, false, 'Stack has less than 2 items')
      return false
    }
    const top = this.pop()!
    this.pop() // Remove second
    this.push(top)
    this.recordStep('OP_NIP', stackBefore, true)
    return true
  }

  opTuck(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_TUCK', stackBefore, true)
      return true
    }
    if (this.stack.length < 2) {
      this.recordStep('OP_TUCK', stackBefore, false, 'Stack has less than 2 items')
      return false
    }
    const top = this.peek()!
    const second = this.peek(1)!
    this.stack[this.stack.length - 2] = top
    this.push(second)
    this.recordStep('OP_TUCK', stackBefore, true)
    return true
  }

  // Arithmetic Operations
  opAdd(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_ADD', stackBefore, true)
      return true
    }
    const ab = this.popTwoNumbers()
    if ('error' in ab) {
      this.recordStep('OP_ADD', stackBefore, false, ab.error)
      return false
    }
    this.push(ab.a + ab.b)
    this.recordStep('OP_ADD', stackBefore, true)
    return true
  }

  opSub(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_SUB', stackBefore, true)
      return true
    }
    const ab = this.popTwoNumbers()
    if ('error' in ab) {
      this.recordStep('OP_SUB', stackBefore, false, ab.error)
      return false
    }
    this.push(ab.a - ab.b)
    this.recordStep('OP_SUB', stackBefore, true)
    return true
  }

  op1Add(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_1ADD', stackBefore, true)
      return true
    }
    const num = this.popOneNumber()
    if (typeof num === 'object') {
      this.recordStep('OP_1ADD', stackBefore, false, num.error)
      return false
    }
    this.push(num + 1)
    this.recordStep('OP_1ADD', stackBefore, true)
    return true
  }

  op1Sub(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_1SUB', stackBefore, true)
      return true
    }
    const num = this.popOneNumber()
    if (typeof num === 'object') {
      this.recordStep('OP_1SUB', stackBefore, false, num.error)
      return false
    }
    this.push(num - 1)
    this.recordStep('OP_1SUB', stackBefore, true)
    return true
  }

  opNegate(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_NEGATE', stackBefore, true)
      return true
    }
    const num = this.popOneNumber()
    if (typeof num === 'object') {
      this.recordStep('OP_NEGATE', stackBefore, false, num.error)
      return false
    }
    this.push(-num)
    this.recordStep('OP_NEGATE', stackBefore, true)
    return true
  }

  opAbs(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_ABS', stackBefore, true)
      return true
    }
    const top = this.pop()
    if (top === null) {
      this.recordStep('OP_ABS', stackBefore, false, 'Stack empty')
      return false
    }
    const num = this.toNumber(top)
    if (num === null) {
      this.recordStep('OP_ABS', stackBefore, false, 'Cannot convert to number')
      return false
    }
    this.push(Math.abs(num))
    this.recordStep('OP_ABS', stackBefore, true)
    return true
  }

  opNot(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_NOT', stackBefore, true)
      return true
    }
    const top = this.pop()
    if (top === null) {
      this.recordStep('OP_NOT', stackBefore, false, 'Stack empty')
      return false
    }
    const num = this.toNumber(top)
    if (num === null) {
      this.recordStep('OP_NOT', stackBefore, false, 'Cannot convert to number')
      return false
    }
    this.push(num === 0 ? 1 : 0)
    this.recordStep('OP_NOT', stackBefore, true)
    return true
  }

  op0NotEqual(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_0NOTEQUAL', stackBefore, true)
      return true
    }
    const top = this.pop()
    if (top === null) {
      this.recordStep('OP_0NOTEQUAL', stackBefore, false, 'Stack empty')
      return false
    }
    const num = this.toNumber(top)
    if (num === null) {
      this.recordStep('OP_0NOTEQUAL', stackBefore, false, 'Cannot convert to number')
      return false
    }
    this.push(num !== 0 ? 1 : 0)
    this.recordStep('OP_0NOTEQUAL', stackBefore, true)
    return true
  }

  // Comparison Operations
  opEqual(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_EQUAL', stackBefore, true)
      return true
    }
    const b = this.pop()
    const a = this.pop()
    if (a === null || b === null) {
      this.recordStep('OP_EQUAL', stackBefore, false, 'Stack has less than 2 items')
      return false
    }
    // Deep comparison
    let equal = false
    if (a instanceof Uint8Array && b instanceof Uint8Array) {
      equal = a.length === b.length && a.every((val, i) => val === b[i])
    } else if (typeof a === typeof b) {
      equal = a === b
    }
    this.push(equal ? 1 : 0)
    this.recordStep('OP_EQUAL', stackBefore, true)
    return true
  }

  opEqualVerify(): boolean {
    if (!this.opEqual()) return false
    return this.opVerify()
  }

  opLessThan(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_LESSTHAN', stackBefore, true)
      return true
    }
    const b = this.pop()
    const a = this.pop()
    if (a === null || b === null) {
      this.recordStep('OP_LESSTHAN', stackBefore, false, 'Stack has less than 2 items')
      return false
    }
    const numA = this.toNumber(a)
    const numB = this.toNumber(b)
    if (numA === null || numB === null) {
      this.recordStep('OP_LESSTHAN', stackBefore, false, 'Cannot convert to numbers')
      return false
    }
    this.push(numA < numB ? 1 : 0)
    this.recordStep('OP_LESSTHAN', stackBefore, true)
    return true
  }

  opGreaterThan(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_GREATERTHAN', stackBefore, true)
      return true
    }
    const b = this.pop()
    const a = this.pop()
    if (a === null || b === null) {
      this.recordStep('OP_GREATERTHAN', stackBefore, false, 'Stack has less than 2 items')
      return false
    }
    const numA = this.toNumber(a)
    const numB = this.toNumber(b)
    if (numA === null || numB === null) {
      this.recordStep('OP_GREATERTHAN', stackBefore, false, 'Cannot convert to numbers')
      return false
    }
    this.push(numA > numB ? 1 : 0)
    this.recordStep('OP_GREATERTHAN', stackBefore, true)
    return true
  }

  opLessThanOrEqual(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_LESSTHANOREQUAL', stackBefore, true)
      return true
    }
    const b = this.pop()
    const a = this.pop()
    if (a === null || b === null) {
      this.recordStep('OP_LESSTHANOREQUAL', stackBefore, false, 'Stack has less than 2 items')
      return false
    }
    const numA = this.toNumber(a)
    const numB = this.toNumber(b)
    if (numA === null || numB === null) {
      this.recordStep('OP_LESSTHANOREQUAL', stackBefore, false, 'Cannot convert to numbers')
      return false
    }
    this.push(numA <= numB ? 1 : 0)
    this.recordStep('OP_LESSTHANOREQUAL', stackBefore, true)
    return true
  }

  opGreaterThanOrEqual(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_GREATERTHANOREQUAL', stackBefore, true)
      return true
    }
    const b = this.pop()
    const a = this.pop()
    if (a === null || b === null) {
      this.recordStep('OP_GREATERTHANOREQUAL', stackBefore, false, 'Stack has less than 2 items')
      return false
    }
    const numA = this.toNumber(a)
    const numB = this.toNumber(b)
    if (numA === null || numB === null) {
      this.recordStep('OP_GREATERTHANOREQUAL', stackBefore, false, 'Cannot convert to numbers')
      return false
    }
    this.push(numA >= numB ? 1 : 0)
    this.recordStep('OP_GREATERTHANOREQUAL', stackBefore, true)
    return true
  }

  opMin(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_MIN', stackBefore, true)
      return true
    }
    const b = this.pop()
    const a = this.pop()
    if (a === null || b === null) {
      this.recordStep('OP_MIN', stackBefore, false, 'Stack has less than 2 items')
      return false
    }
    const numA = this.toNumber(a)
    const numB = this.toNumber(b)
    if (numA === null || numB === null) {
      this.recordStep('OP_MIN', stackBefore, false, 'Cannot convert to numbers')
      return false
    }
    this.push(Math.min(numA, numB))
    this.recordStep('OP_MIN', stackBefore, true)
    return true
  }

  opMax(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_MAX', stackBefore, true)
      return true
    }
    const b = this.pop()
    const a = this.pop()
    if (a === null || b === null) {
      this.recordStep('OP_MAX', stackBefore, false, 'Stack has less than 2 items')
      return false
    }
    const numA = this.toNumber(a)
    const numB = this.toNumber(b)
    if (numA === null || numB === null) {
      this.recordStep('OP_MAX', stackBefore, false, 'Cannot convert to numbers')
      return false
    }
    this.push(Math.max(numA, numB))
    this.recordStep('OP_MAX', stackBefore, true)
    return true
  }

  // Cryptographic Operations (simplified - no actual crypto)
  opSha256(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_SHA256', stackBefore, true)
      return true
    }
    const bytes = this.popOneBytes()
    if ('error' in bytes) {
      this.recordStep('OP_SHA256', stackBefore, false, bytes.error)
      return false
    }
    // Simulate hash (in real implementation, use crypto.subtle.digest)
    this.push(`0x${bytesToHex(bytes)}`)
    this.recordStep('OP_SHA256', stackBefore, true)
    return true
  }

  opHash160(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_HASH160', stackBefore, true)
      return true
    }
    const bytes = this.popOneBytes()
    if ('error' in bytes) {
      this.recordStep('OP_HASH160', stackBefore, false, bytes.error)
      return false
    }
    // Simulate HASH160 (SHA256 + RIPEMD160)
    this.push(`0x${bytesToHex(bytes, 20)}`)
    this.recordStep('OP_HASH160', stackBefore, true)
    return true
  }

  opHash256(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_HASH256', stackBefore, true)
      return true
    }
    const bytes = this.popOneBytes()
    if ('error' in bytes) {
      this.recordStep('OP_HASH256', stackBefore, false, bytes.error)
      return false
    }
    // Simulate double SHA256
    this.push(`0x${bytesToHex(bytes)}`)
    this.recordStep('OP_HASH256', stackBefore, true)
    return true
  }

  opCheckSig(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_CHECKSIG', stackBefore, true)
      return true
    }
    // Simplified: just pop signature and pubkey, return 1 (success)
    // In real implementation, this would verify ECDSA signature
    if (this.stack.length < 2) {
      this.recordStep('OP_CHECKSIG', stackBefore, false, 'Stack has less than 2 items')
      return false
    }
    this.pop() // signature
    this.pop() // pubkey
    this.push(1) // Success
    this.recordStep('OP_CHECKSIG', stackBefore, true)
    return true
  }

  opCheckSigVerify(): boolean {
    if (!this.opCheckSig()) return false
    return this.opVerify()
  }

  // Control Flow
  opIf(): boolean {
    // Always execute IF to manage control flow
    const stackBefore = [...this.stack]
    const top = this.pop()
    if (top === null) {
      this.recordStep('OP_IF', stackBefore, false, 'Stack empty')
      return false
    }
    const condition = this.toNumber(top)
    const isTrue = condition !== null && condition !== 0
    this.ifStack.push(isTrue)
    this.recordStep('OP_IF', stackBefore, true)
    return true
  }

  opNotIf(): boolean {
    // Always execute NOTIF to manage control flow
    const stackBefore = [...this.stack]
    const top = this.pop()
    if (top === null) {
      this.recordStep('OP_NOTIF', stackBefore, false, 'Stack empty')
      return false
    }
    const condition = this.toNumber(top)
    const isTrue = condition !== null && condition === 0
    this.ifStack.push(isTrue)
    this.recordStep('OP_NOTIF', stackBefore, true)
    return true
  }

  opElse(): boolean {
    const stackBefore = [...this.stack]
    if (this.ifStack.length === 0) {
      this.recordStep('OP_ELSE', stackBefore, false, 'No matching OP_IF')
      return false
    }
    // Toggle the current IF condition
    this.ifStack[this.ifStack.length - 1] = !this.ifStack[this.ifStack.length - 1]
    this.recordStep('OP_ELSE', stackBefore, true)
    return true
  }

  opEndIf(): boolean {
    const stackBefore = [...this.stack]
    if (this.ifStack.length === 0) {
      this.recordStep('OP_ENDIF', stackBefore, false, 'No matching OP_IF')
      return false
    }
    this.ifStack.pop()
    this.recordStep('OP_ENDIF', stackBefore, true)
    return true
  }

  opVerify(): boolean {
    const stackBefore = [...this.stack]
    if (!this.shouldExecute()) {
      this.recordStep('OP_VERIFY', stackBefore, true)
      return true
    }
    const top = this.pop()
    if (top === null) {
      this.recordStep('OP_VERIFY', stackBefore, false, 'Stack empty')
      return false
    }
    const num = this.toNumber(top)
    if (num === null || num === 0) {
      this.recordStep('OP_VERIFY', stackBefore, false, 'Verification failed')
      return false
    }
    this.recordStep('OP_VERIFY', stackBefore, true)
    return true
  }

  opReturn(): boolean {
    // Always execute - marks script as invalid
    const stackBefore = [...this.stack]
    this.recordStep('OP_RETURN', stackBefore, false, 'OP_RETURN marks script as invalid')
    return false
  }

  // Execute a script
  execute(script: Array<string | StackItem>): ExecutionResult {
    this.reset()
    
    for (let i = 0; i < script.length; i++) {
      const item = script[i]
      let success = false

      if (typeof item === 'string') {
        // Check if it's an OP code (must start with OP_)
        const opCode = item.toUpperCase()
        const isOpCode = opCode.startsWith('OP_')
        
        if (!isOpCode) {
          // Not an OP code, treat as data push
          success = this.pushData(item)
          if (success) {
            continue
          }
        }
        
        // Map OP code names to methods
        switch (opCode) {
          case 'OP_0': case 'OP_FALSE':
            success = this.op0()
            break
          case 'OP_1NEGATE':
            success = this.op1Negate()
            break
          case 'OP_1': case 'OP_TRUE': case 'OP_2': case 'OP_3': case 'OP_4': case 'OP_5':
          case 'OP_6': case 'OP_7': case 'OP_8': case 'OP_9': case 'OP_10': case 'OP_11':
          case 'OP_12': case 'OP_13': case 'OP_14': case 'OP_15': case 'OP_16':
            success = this.opN(opCode === 'OP_TRUE' ? 1 : parseInt(opCode.slice(3), 10))
            break
          case 'OP_DUP':
            success = this.opDup()
            break
          case 'OP_DROP':
            success = this.opDrop()
            break
          case 'OP_SWAP':
            success = this.opSwap()
            break
          case 'OP_OVER':
            success = this.opOver()
            break
          case 'OP_ROT':
            success = this.opRot()
            break
          case 'OP_2DROP':
            success = this.op2Drop()
            break
          case 'OP_2DUP':
            success = this.op2Dup()
            break
          case 'OP_NIP':
            success = this.opNip()
            break
          case 'OP_TUCK':
            success = this.opTuck()
            break
          case 'OP_ADD':
            success = this.opAdd()
            break
          case 'OP_SUB':
            success = this.opSub()
            break
          case 'OP_1ADD':
            success = this.op1Add()
            break
          case 'OP_1SUB':
            success = this.op1Sub()
            break
          case 'OP_NEGATE':
            success = this.opNegate()
            break
          case 'OP_ABS':
            success = this.opAbs()
            break
          case 'OP_NOT':
            success = this.opNot()
            break
          case 'OP_0NOTEQUAL':
            success = this.op0NotEqual()
            break
          case 'OP_EQUAL':
            success = this.opEqual()
            break
          case 'OP_EQUALVERIFY':
            success = this.opEqualVerify()
            break
          case 'OP_LESSTHAN':
            success = this.opLessThan()
            break
          case 'OP_GREATERTHAN':
            success = this.opGreaterThan()
            break
          case 'OP_LESSTHANOREQUAL':
            success = this.opLessThanOrEqual()
            break
          case 'OP_GREATERTHANOREQUAL':
            success = this.opGreaterThanOrEqual()
            break
          case 'OP_MIN':
            success = this.opMin()
            break
          case 'OP_MAX':
            success = this.opMax()
            break
          case 'OP_SHA256':
            success = this.opSha256()
            break
          case 'OP_HASH160':
            success = this.opHash160()
            break
          case 'OP_HASH256':
            success = this.opHash256()
            break
          case 'OP_CHECKSIG':
            success = this.opCheckSig()
            break
          case 'OP_CHECKSIGVERIFY':
            success = this.opCheckSigVerify()
            break
          case 'OP_IF':
            success = this.opIf()
            break
          case 'OP_NOTIF':
            success = this.opNotIf()
            break
          case 'OP_ELSE':
            success = this.opElse()
            break
          case 'OP_ENDIF':
            success = this.opEndIf()
            break
          case 'OP_VERIFY':
            success = this.opVerify()
            break
          case 'OP_RETURN':
            success = this.opReturn()
            break
          default:
            // If it's not a known OP code, treat it as data (push to stack)
            // This allows users to push arbitrary strings/values
            success = this.pushData(item as StackItem)
        }
      } else {
        // Direct data push
        success = this.pushData(item)
      }

      if (!success && this.executionSteps.length > 0) {
        const lastStep = this.executionSteps[this.executionSteps.length - 1]
        if (lastStep.error) {
          return {
            success: false,
            finalStack: this.getStack(),
            steps: this.getSteps(),
            error: lastStep.error,
          }
        }
      }
    }

    // Update final stack state in last step
    if (this.executionSteps.length > 0) {
      this.executionSteps[this.executionSteps.length - 1].stackAfter = this.getStack()
    }

    // Script is valid if stack is not empty and top item is truthy
    const finalStack = this.getStack()
    const isValid = finalStack.length > 0 && this.toNumber(finalStack[finalStack.length - 1]) !== 0

    return {
      success: isValid,
      finalStack,
      steps: this.getSteps(),
    }
  }
}

// OP Code definitions for UI
export const OP_CODES: OpCode[] = [
  // Push Operations
  { name: 'OP_0', hex: '0x00', category: 'Push', description: 'Push empty array (false)', enabled: true },
  { name: 'OP_1NEGATE', hex: '0x4f', category: 'Push', description: 'Push -1', enabled: true },
  { name: 'OP_1', hex: '0x51', category: 'Push', description: 'Push 1', enabled: true },
  { name: 'OP_2', hex: '0x52', category: 'Push', description: 'Push 2', enabled: true },
  { name: 'OP_3', hex: '0x53', category: 'Push', description: 'Push 3', enabled: true },
  { name: 'OP_4', hex: '0x54', category: 'Push', description: 'Push 4', enabled: true },
  { name: 'OP_5', hex: '0x55', category: 'Push', description: 'Push 5', enabled: true },
  { name: 'OP_6', hex: '0x56', category: 'Push', description: 'Push 6', enabled: true },
  { name: 'OP_7', hex: '0x57', category: 'Push', description: 'Push 7', enabled: true },
  { name: 'OP_8', hex: '0x58', category: 'Push', description: 'Push 8', enabled: true },
  { name: 'OP_9', hex: '0x59', category: 'Push', description: 'Push 9', enabled: true },
  { name: 'OP_10', hex: '0x5a', category: 'Push', description: 'Push 10', enabled: true },
  { name: 'OP_11', hex: '0x5b', category: 'Push', description: 'Push 11', enabled: true },
  { name: 'OP_12', hex: '0x5c', category: 'Push', description: 'Push 12', enabled: true },
  { name: 'OP_13', hex: '0x5d', category: 'Push', description: 'Push 13', enabled: true },
  { name: 'OP_14', hex: '0x5e', category: 'Push', description: 'Push 14', enabled: true },
  { name: 'OP_15', hex: '0x5f', category: 'Push', description: 'Push 15', enabled: true },
  { name: 'OP_16', hex: '0x60', category: 'Push', description: 'Push 16', enabled: true },
  
  // Stack Operations
  { name: 'OP_DUP', hex: '0x76', category: 'Stack', description: 'Duplicate top stack item', enabled: true },
  { name: 'OP_DROP', hex: '0x75', category: 'Stack', description: 'Remove top stack item', enabled: true },
  { name: 'OP_SWAP', hex: '0x7c', category: 'Stack', description: 'Swap top two items', enabled: true },
  { name: 'OP_OVER', hex: '0x78', category: 'Stack', description: 'Copy second-to-top to top', enabled: true },
  { name: 'OP_ROT', hex: '0x7b', category: 'Stack', description: 'Rotate top three items', enabled: true },
  { name: 'OP_2DROP', hex: '0x6d', category: 'Stack', description: 'Remove top two items', enabled: true },
  { name: 'OP_2DUP', hex: '0x6e', category: 'Stack', description: 'Duplicate top two items', enabled: true },
  { name: 'OP_NIP', hex: '0x77', category: 'Stack', description: 'Remove second-to-top item', enabled: true },
  { name: 'OP_TUCK', hex: '0x7d', category: 'Stack', description: 'Copy top below second', enabled: true },
  
  // Arithmetic
  { name: 'OP_ADD', hex: '0x93', category: 'Arithmetic', description: 'a + b', enabled: true },
  { name: 'OP_SUB', hex: '0x94', category: 'Arithmetic', description: 'a - b', enabled: true },
  { name: 'OP_1ADD', hex: '0x8b', category: 'Arithmetic', description: 'a + 1', enabled: true },
  { name: 'OP_1SUB', hex: '0x8c', category: 'Arithmetic', description: 'a - 1', enabled: true },
  { name: 'OP_NEGATE', hex: '0x8f', category: 'Arithmetic', description: '-a', enabled: true },
  { name: 'OP_ABS', hex: '0x90', category: 'Arithmetic', description: 'abs(a)', enabled: true },
  { name: 'OP_NOT', hex: '0x91', category: 'Arithmetic', description: '!a (logical)', enabled: true },
  { name: 'OP_0NOTEQUAL', hex: '0x92', category: 'Arithmetic', description: 'a != 0', enabled: true },
  
  // Comparison
  { name: 'OP_EQUAL', hex: '0x87', category: 'Comparison', description: 'Returns 1 if equal, else 0', enabled: true },
  { name: 'OP_EQUALVERIFY', hex: '0x88', category: 'Comparison', description: 'OP_EQUAL + OP_VERIFY', enabled: true },
  { name: 'OP_LESSTHAN', hex: '0x9f', category: 'Comparison', description: 'a < b', enabled: true },
  { name: 'OP_GREATERTHAN', hex: '0xa0', category: 'Comparison', description: 'a > b', enabled: true },
  { name: 'OP_LESSTHANOREQUAL', hex: '0xa1', category: 'Comparison', description: 'a <= b', enabled: true },
  { name: 'OP_GREATERTHANOREQUAL', hex: '0xa2', category: 'Comparison', description: 'a >= b', enabled: true },
  { name: 'OP_MIN', hex: '0xa3', category: 'Comparison', description: 'min(a, b)', enabled: true },
  { name: 'OP_MAX', hex: '0xa4', category: 'Comparison', description: 'max(a, b)', enabled: true },
  
  // Cryptographic
  { name: 'OP_SHA256', hex: '0xa8', category: 'Cryptographic', description: 'SHA-256 hash', enabled: true },
  { name: 'OP_HASH160', hex: '0xa9', category: 'Cryptographic', description: 'SHA256 + RIPEMD160', enabled: true },
  { name: 'OP_HASH256', hex: '0xaa', category: 'Cryptographic', description: 'Double SHA-256', enabled: true },
  { name: 'OP_CHECKSIG', hex: '0xac', category: 'Cryptographic', description: 'Verify ECDSA signature', enabled: true },
  { name: 'OP_CHECKSIGVERIFY', hex: '0xad', category: 'Cryptographic', description: 'OP_CHECKSIG + OP_VERIFY', enabled: true },
  
  // Control Flow
  { name: 'OP_IF', hex: '0x63', category: 'Control Flow', description: 'Execute if top is non-zero', enabled: true },
  { name: 'OP_NOTIF', hex: '0x64', category: 'Control Flow', description: 'Execute if top is zero', enabled: true },
  { name: 'OP_ELSE', hex: '0x67', category: 'Control Flow', description: 'Else branch', enabled: true },
  { name: 'OP_ENDIF', hex: '0x68', category: 'Control Flow', description: 'End conditional', enabled: true },
  { name: 'OP_VERIFY', hex: '0x69', category: 'Control Flow', description: 'Fail if top is false', enabled: true },
  { name: 'OP_RETURN', hex: '0x6a', category: 'Control Flow', description: 'Mark output unspendable', enabled: true },
]

const KNOWN_OPCODE_NAMES = new Set([
  ...OP_CODES.map((o) => o.name),
  'OP_FALSE', // alias for OP_0
  'OP_TRUE',  // alias for OP_1
])

export function isKnownOpCode(name: string): boolean {
  return KNOWN_OPCODE_NAMES.has(name.toUpperCase())
}

export const OP_CODE_CATEGORIES = ['Push', 'Stack', 'Arithmetic', 'Comparison', 'Cryptographic', 'Control Flow']
