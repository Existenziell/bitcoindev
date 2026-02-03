/**
 * Stack Lab Challenges: data model and validation.
 * Reuses ScriptInterpreter and types from stackLabInterpreter.
 */

import { ScriptInterpreter, type StackItem, type ExecutionStep } from '@/app/utils/stackLabInterpreter'
import { formatStackForLog } from '@/app/utils/stackLabFormatters'

export type ChallengeType = 'unlock' | 'match_outcome' | 'trace' | 'predict_valid'

export interface ChallengeBase {
  id: string
  type: ChallengeType
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface UnlockChallenge extends ChallengeBase {
  type: 'unlock'
  lockingScript: Array<string | number>
}

export interface MatchOutcomeChallenge extends ChallengeBase {
  type: 'match_outcome'
  goal: 'valid' | { finalStack: StackItem[] }
  /** Optional hint: restrict allowed OP codes (not enforced in v1, for display only). */
  allowedOps?: string[]
}

export interface TraceQuestionStackAfter {
  type: 'stack_after_step'
  stepIndex: number
}
export interface TraceQuestionValid {
  type: 'valid'
}
export type TraceQuestion = TraceQuestionStackAfter | TraceQuestionValid

export interface TraceChallenge extends ChallengeBase {
  type: 'trace'
  unlockingScript: Array<string | number>
  lockingScript: Array<string | number>
  question: TraceQuestion
  /** For stack_after_step: expected stack (compared after execution). For valid: expected boolean. */
  expectedAnswer: StackItem[] | boolean
}

export interface PredictValidChallenge extends ChallengeBase {
  type: 'predict_valid'
  unlockingScript: Array<string | number>
  lockingScript: Array<string | number>
  expectedValid: boolean
}

export type Challenge =
  | UnlockChallenge
  | MatchOutcomeChallenge
  | TraceChallenge
  | PredictValidChallenge

export interface UnlockUserInput {
  unlockingScript: Array<string | StackItem>
}

export interface MatchOutcomeUserInput {
  unlockingScript: Array<string | StackItem>
  lockingScript: Array<string | StackItem>
}

export interface TraceUserInput {
  /** For stack_after_step: user's answer as stack (array of items). For valid: boolean. */
  answer: StackItem[] | boolean
}

export interface PredictValidUserInput {
  userValid: boolean
}

export type ChallengeUserInput =
  | { type: 'unlock'; input: UnlockUserInput }
  | { type: 'match_outcome'; input: MatchOutcomeUserInput }
  | { type: 'trace'; input: TraceUserInput }
  | { type: 'predict_valid'; input: PredictValidUserInput }

export interface ValidationResult {
  solved: boolean
  message?: string
  /** For runnable challenges, the execution steps (e.g. to show in log). */
  steps?: ExecutionStep[]
  executionResult?: { success: boolean; error?: string }
}

function stackItemsEqual(a: StackItem, b: StackItem): boolean {
  if (a instanceof Uint8Array && b instanceof Uint8Array) {
    return a.length === b.length && a.every((val, i) => val === b[i])
  }
  return a === b
}

function stacksEqual(left: StackItem[], right: StackItem[]): boolean {
  if (left.length !== right.length) return false
  return left.every((item, i) => stackItemsEqual(item, right[i]))
}

/**
 * Validate user input against a challenge. Uses a fresh ScriptInterpreter per call.
 */
export function validateChallenge(
  challenge: Challenge,
  userInput: ChallengeUserInput,
  interpreter: ScriptInterpreter
): ValidationResult {
  switch (challenge.type) {
    case 'unlock': {
      if (userInput.type !== 'unlock') {
        return { solved: false, message: 'Invalid input for unlock challenge' }
      }
      const fullScript = [...userInput.input.unlockingScript, ...challenge.lockingScript]
      const result = interpreter.execute(fullScript)
      const solved = result.success
      return {
        solved,
        message: solved ? 'Correct! The script validates.' : (result.error ?? 'Script did not validate.'),
        steps: result.steps,
        executionResult: { success: result.success, error: result.error },
      }
    }

    case 'match_outcome': {
      if (userInput.type !== 'match_outcome') {
        return { solved: false, message: 'Invalid input for match outcome challenge' }
      }
      const fullScript = [
        ...userInput.input.unlockingScript,
        ...userInput.input.lockingScript,
      ]
      const result = interpreter.execute(fullScript)
      if (challenge.goal === 'valid') {
        const solved = result.success
        return {
          solved,
          message: solved ? 'Correct! The script validates.' : (result.error ?? 'Script did not validate.'),
          steps: result.steps,
          executionResult: { success: result.success, error: result.error },
        }
      }
      const solved = result.success && stacksEqual(result.finalStack, challenge.goal.finalStack)
      return {
        solved,
        message: solved
          ? 'Correct! Script validates and final stack matches.'
          : !result.success
            ? (result.error ?? 'Script did not validate.')
            : `Final stack was ${formatStackForLog(result.finalStack)}; expected ${formatStackForLog(challenge.goal.finalStack)}.`,
        steps: result.steps,
        executionResult: { success: result.success, error: result.error },
      }
    }

    case 'trace': {
      if (userInput.type !== 'trace') {
        return { solved: false, message: 'Invalid input for trace challenge' }
      }
      const fullScript = [...challenge.unlockingScript, ...challenge.lockingScript]
      const result = interpreter.execute(fullScript)
      const q = challenge.question
      if (q.type === 'valid') {
        const userAnswer = userInput.input.answer as boolean
        const actual = result.success
        const solved = userAnswer === actual
        return {
          solved,
          message: solved ? 'Correct!' : `Script is ${actual ? 'valid' : 'invalid'}.`,
          steps: result.steps,
        }
      }
      const step = result.steps[q.stepIndex]
      if (!step) {
        return { solved: false, message: 'Step index out of range.', steps: result.steps }
      }
      const userStack = userInput.input.answer as StackItem[]
      const solved = stacksEqual(userStack, step.stackAfter)
      return {
        solved,
        message: solved ? 'Correct!' : `Expected stack ${formatStackForLog(step.stackAfter)}.`,
        steps: result.steps,
      }
    }

    case 'predict_valid': {
      if (userInput.type !== 'predict_valid') {
        return { solved: false, message: 'Invalid input for predict_valid challenge' }
      }
      const fullScript = [...challenge.unlockingScript, ...challenge.lockingScript]
      const result = interpreter.execute(fullScript)
      const solved = userInput.input.userValid === result.success
      return {
        solved,
        message: solved ? 'Correct!' : `Script is ${result.success ? 'valid' : 'invalid'}.`,
        steps: result.steps,
        executionResult: { success: result.success, error: result.error },
      }
    }

    default:
      return { solved: false, message: 'Unknown challenge type' }
  }
}

/** All challenges. */
export const CHALLENGES: Challenge[] = [
  // --- Unlock (2–3) ---
  {
    id: 'unlock-simple-add',
    type: 'unlock',
    title: 'Unlock: Simple addition',
    description: 'The locking script expects two numbers on the stack, adds them, and checks the result equals 8. Provide an unlocking script that pushes the correct two numbers.',
    difficulty: 'easy',
    lockingScript: ['OP_ADD', 8, 'OP_EQUAL'],
  },
  {
    id: 'unlock-comparison',
    type: 'unlock',
    title: 'Unlock: Comparison',
    description: 'The locking script expects two values on the stack and checks they are equal (OP_EQUAL). Push two equal values so the script validates.',
    difficulty: 'easy',
    lockingScript: ['OP_EQUAL'],
  },
  {
    id: 'unlock-conditional',
    type: 'unlock',
    title: 'Unlock: Conditional',
    description: 'The locking script uses OP_IF/ELSE/ENDIF. It expects one value on the stack: non-zero runs the first branch (pushes 100), zero runs the else (pushes 200). Provide an unlocking script that leaves 100 on the stack.',
    difficulty: 'medium',
    lockingScript: ['OP_IF', 100, 'OP_ELSE', 200, 'OP_ENDIF'],
  },
  // --- Match outcome (2–3) ---
  {
    id: 'match-valid-one',
    type: 'match_outcome',
    title: 'Match: Script must validate',
    description: 'Build an unlocking script and a locking script that together leave a non-zero value on the stack (script validates).',
    difficulty: 'easy',
    goal: 'valid',
  },
  {
    id: 'match-final-stack',
    type: 'match_outcome',
    title: 'Match: Final stack [1]',
    description: 'Build unlocking and locking scripts so that execution ends with exactly one value on the stack: 1.',
    difficulty: 'medium',
    goal: { finalStack: [1] },
  },
  {
    id: 'match-add-equal',
    type: 'match_outcome',
    title: 'Match: Add and equal',
    description: 'Build scripts that push two numbers, add them, and verify the result equals a constant. The final stack should contain 1 (valid).',
    difficulty: 'easy',
    goal: 'valid',
  },
  // --- Predict valid (2–3) ---
  {
    id: 'predict-valid-simple',
    type: 'predict_valid',
    title: 'Predict: Does it validate?',
    description: 'Given the unlocking and locking scripts below, predict whether the combined script validates.',
    difficulty: 'easy',
    unlockingScript: [5, 3],
    lockingScript: ['OP_ADD', 8, 'OP_EQUAL'],
    expectedValid: true,
  },
  {
    id: 'predict-invalid',
    type: 'predict_valid',
    title: 'Predict: Invalid script',
    description: 'Given the scripts below, predict whether they validate. This script is designed to fail.',
    difficulty: 'easy',
    unlockingScript: [0],
    lockingScript: ['OP_VERIFY', 1],
    expectedValid: false,
  },
  {
    id: 'predict-equal',
    type: 'predict_valid',
    title: 'Predict: Equal check',
    description: 'Two values are compared with OP_EQUAL. Does this script validate?',
    difficulty: 'easy',
    unlockingScript: [7, 7],
    lockingScript: ['OP_EQUAL'],
    expectedValid: true,
  },
  {
    id: 'trace-stack-after-step',
    type: 'trace',
    title: 'Trace: Stack after second push',
    description: 'The script pushes 5, then 3, then runs OP_ADD. What is on the stack after the second push (step 1), before OP_ADD?',
    difficulty: 'easy',
    unlockingScript: [5, 3],
    lockingScript: ['OP_ADD'],
    question: { type: 'stack_after_step', stepIndex: 1 },
    expectedAnswer: [3, 5],
  },
  {
    id: 'trace-invalid',
    type: 'trace',
    title: 'Trace: Invalid script',
    description: 'Determine whether this script validates. It uses OP_VERIFY with zero.',
    difficulty: 'easy',
    unlockingScript: [0],
    lockingScript: ['OP_VERIFY', 1],
    question: { type: 'valid' },
    expectedAnswer: false,
  },
  // --- More Easy (3) ---
  {
    id: 'medium-unlock-sum-15',
    type: 'unlock',
    title: 'Unlock: Sum to 15',
    description: 'The locking script adds two numbers and checks the result equals 15. Push two numbers that sum to 15.',
    difficulty: 'medium',
    lockingScript: ['OP_ADD', 15, 'OP_EQUAL'],
  },
  {
    id: 'easy-predict-min',
    type: 'predict_valid',
    title: 'Predict: OP_MIN result',
    description: 'The script pushes 10 and 5, then runs OP_MIN (leaves the smaller). Does it validate?',
    difficulty: 'easy',
    unlockingScript: [10, 5],
    lockingScript: ['OP_MIN'],
    expectedValid: true,
  },
  {
    id: 'easy-trace-add-result',
    type: 'trace',
    title: 'Trace: Stack after OP_ADD',
    description: 'The script pushes 7 and 4, then runs OP_ADD. What is on the stack after step 2 (after OP_ADD)?',
    difficulty: 'easy',
    unlockingScript: [7, 4],
    lockingScript: ['OP_ADD'],
    question: { type: 'stack_after_step', stepIndex: 2 },
    expectedAnswer: [11],
  },
  // --- More Medium (10) ---
  {
    id: 'medium-unlock-verify-add',
    type: 'unlock',
    title: 'Unlock: Add then verify',
    description: 'The locking script expects two numbers, adds them, then OP_VERIFY (fails if 0). It then pushes 1. Push two numbers that sum to a non-zero value (e.g. 12).',
    difficulty: 'medium',
    lockingScript: ['OP_ADD', 'OP_VERIFY', 1],
  },
  {
    id: 'medium-unlock-dup-equal',
    type: 'unlock',
    title: 'Unlock: Duplicate and equal',
    description: 'The locking script expects one value, duplicates it (OP_DUP), then checks the two copies are equal with OP_EQUAL. Push any single value.',
    difficulty: 'medium',
    lockingScript: ['OP_DUP', 'OP_EQUAL'],
  },
  {
    id: 'medium-unlock-else-200',
    type: 'unlock',
    title: 'Unlock: Else branch',
    description: 'The locking script uses OP_IF/ELSE/ENDIF. Non-zero pushes 100, zero pushes 200. Provide an unlocking script that leaves 200 on the stack.',
    difficulty: 'medium',
    lockingScript: ['OP_IF', 100, 'OP_ELSE', 200, 'OP_ENDIF'],
  },
  {
    id: 'medium-match-final-5',
    type: 'match_outcome',
    title: 'Match: Final stack [5]',
    description: 'Build unlocking and locking scripts so execution ends with exactly one value on the stack: 5.',
    difficulty: 'medium',
    goal: { finalStack: [5] },
  },
  {
    id: 'medium-match-two-values',
    type: 'match_outcome',
    title: 'Match: Final stack [2, 1]',
    description: 'Build scripts so the final stack has exactly two values: 2 on top, 1 below (stack [2, 1]).',
    difficulty: 'medium',
    goal: { finalStack: [2, 1] },
  },
  {
    id: 'medium-predict-verify-invalid',
    type: 'predict_valid',
    title: 'Predict: OP_VERIFY with zero',
    description: 'The script pushes 0 then runs OP_VERIFY (fails if top is 0). Does it validate?',
    difficulty: 'medium',
    unlockingScript: [0],
    lockingScript: ['OP_VERIFY', 1],
    expectedValid: false,
  },
  {
    id: 'medium-predict-max',
    type: 'predict_valid',
    title: 'Predict: OP_MAX',
    description: 'The script pushes 3 and 9, then OP_MAX. Does it validate?',
    difficulty: 'medium',
    unlockingScript: [3, 9],
    lockingScript: ['OP_MAX'],
    expectedValid: true,
  },
  {
    id: 'medium-trace-step2',
    type: 'trace',
    title: 'Trace: Stack after step 2',
    description: 'The script pushes 1, then 2, then runs OP_ADD. What is on the stack after step 2 (after the second push)?',
    difficulty: 'medium',
    unlockingScript: [1, 2],
    lockingScript: ['OP_ADD'],
    question: { type: 'stack_after_step', stepIndex: 1 },
    expectedAnswer: [2, 1],
  },
  {
    id: 'medium-trace-swap',
    type: 'trace',
    title: 'Trace: Stack after OP_SWAP',
    description: 'The script pushes 10, then 20, then runs OP_SWAP. What is on the stack after OP_SWAP (step 2)?',
    difficulty: 'medium',
    unlockingScript: [10, 20],
    lockingScript: ['OP_SWAP'],
    question: { type: 'stack_after_step', stepIndex: 2 },
    expectedAnswer: [10, 20],
  },
  {
    id: 'easy-trace-conditional',
    type: 'trace',
    title: 'Trace: Conditional valid?',
    description: 'The script pushes 0, then OP_IF pushes 1, OP_ELSE pushes 2, OP_ENDIF. Does the combined script validate?',
    difficulty: 'easy',
    unlockingScript: [0],
    lockingScript: ['OP_IF', 1, 'OP_ELSE', 2, 'OP_ENDIF'],
    question: { type: 'valid' },
    expectedAnswer: true,
  },
  {
    id: 'easy-unlock-sum-20',
    type: 'unlock',
    title: 'Unlock: Sum to 20',
    description: 'The locking script adds two numbers and checks the result equals 20. Push two numbers that sum to 20.',
    difficulty: 'easy',
    lockingScript: ['OP_ADD', 20, 'OP_EQUAL'],
  },
  {
    id: 'easy-predict-lessthan',
    type: 'predict_valid',
    title: 'Predict: OP_LESSTHAN',
    description: 'The script pushes 3 and 7, then runs OP_LESSTHAN (1 if first < second). Does it validate?',
    difficulty: 'easy',
    unlockingScript: [3, 7],
    lockingScript: ['OP_LESSTHAN'],
    expectedValid: true,
  },
  {
    id: 'easy-trace-empty-stack',
    type: 'trace',
    title: 'Trace: Stack after two pushes',
    description: 'The script pushes 1, then 2. What is on the stack after the first push (step 0)?',
    difficulty: 'easy',
    unlockingScript: [1, 2],
    lockingScript: [],
    question: { type: 'stack_after_step', stepIndex: 0 },
    expectedAnswer: [1],
  },
  // --- More Medium (3 more to reach 15) ---
  {
    id: 'medium-unlock-negate',
    type: 'unlock',
    title: 'Unlock: OP_NEGATE',
    description: 'The locking script expects one number, negates it (OP_NEGATE), then checks the result equals -10. Push the number that when negated gives -10 (i.e. 10).',
    difficulty: 'medium',
    lockingScript: ['OP_NEGATE', -10, 'OP_EQUAL'],
  },
  {
    id: 'medium-match-abs',
    type: 'match_outcome',
    title: 'Match: Final stack using OP_ABS',
    description: 'Build scripts that push a number, run OP_ABS (absolute value), and leave exactly one value on the stack (e.g. 5 from -5).',
    difficulty: 'medium',
    goal: { finalStack: [5] },
  },
  {
    id: 'medium-predict-1add',
    type: 'predict_valid',
    title: 'Predict: OP_1ADD',
    description: 'The script pushes 6, then runs OP_1ADD (add 1). Does it validate?',
    difficulty: 'medium',
    unlockingScript: [6],
    lockingScript: ['OP_1ADD'],
    expectedValid: true,
  },
  // --- Hard (3 more to reach 15) ---
  {
    id: 'hard-unlock-1sub-equal',
    type: 'unlock',
    title: 'Unlock: OP_1SUB and equal',
    description: 'The locking script expects one number, runs OP_1SUB (subtract 1), then checks the result equals 4. Push the number that minus 1 equals 4 (i.e. 5).',
    difficulty: 'hard',
    lockingScript: ['OP_1SUB', 4, 'OP_EQUAL'],
  },
  {
    id: 'hard-match-three-values',
    type: 'match_outcome',
    title: 'Match: Final stack [1, 2, 3]',
    description: 'Build unlocking and locking scripts so the final stack has exactly three values: 1 on top, then 2, then 3 (stack [1, 2, 3]).',
    difficulty: 'hard',
    goal: { finalStack: [1, 2, 3] },
  },
  {
    id: 'hard-trace-nip',
    type: 'trace',
    title: 'Trace: Stack after OP_NIP',
    description: 'The script pushes 10, then 20, then runs OP_NIP (remove second-to-top). What is on the stack after OP_NIP (step 2)?',
    difficulty: 'hard',
    unlockingScript: [10, 20],
    lockingScript: ['OP_NIP'],
    question: { type: 'stack_after_step', stepIndex: 2 },
    expectedAnswer: [20],
  },
  // --- Hard (original 12) ---
  {
    id: 'hard-unlock-three-add',
    type: 'unlock',
    title: 'Unlock: Three numbers, sum check',
    description: 'The locking script expects three numbers a, b, c. It adds the first two and checks the result equals the third. Push three numbers that satisfy a + b = c (e.g. 4, 5, 9).',
    difficulty: 'hard',
    lockingScript: ['OP_ADD', 'OP_EQUAL'],
  },
  {
    id: 'hard-unlock-2dup-add-equal',
    type: 'unlock',
    title: 'Unlock: 2DUP add and equal',
    description: 'The locking script expects two values. It duplicates them (OP_2DUP), adds the top two (OP_ADD), then checks that sum equals the value below. So you need first + second = second: push 0 and any number (e.g. 0, 5).',
    difficulty: 'hard',
    lockingScript: ['OP_2DUP', 'OP_ADD', 'OP_EQUAL'],
  },
  {
    id: 'hard-unlock-nested-if',
    type: 'unlock',
    title: 'Unlock: Nested conditional',
    description: 'The locking script uses OP_IF ... OP_ELSE ... OP_ENDIF. It expects one value: non-zero pushes 42, zero pushes 99. Push 1 to leave 42 on the stack.',
    difficulty: 'hard',
    lockingScript: ['OP_IF', 42, 'OP_ELSE', 99, 'OP_ENDIF'],
  },
  {
    id: 'hard-match-rot',
    type: 'match_outcome',
    title: 'Match: Use OP_ROT',
    description: 'Build scripts that push three numbers, run OP_ROT (rotate top three: a b c -> b c a), and leave exactly one value on the stack (the one that ends on top).',
    difficulty: 'hard',
    goal: { finalStack: [1] },
  },
  {
    id: 'hard-match-over-equal',
    type: 'match_outcome',
    title: 'Match: OP_OVER and OP_EQUAL',
    description: 'Build scripts that leave two values on the stack such that the second (OP_OVER) equals the top, and the script validates (e.g. push same value twice, OP_OVER, OP_EQUAL).',
    difficulty: 'hard',
    goal: 'valid',
  },
  {
    id: 'hard-predict-conditional',
    type: 'predict_valid',
    title: 'Predict: Conditional script',
    description: 'The script pushes 1, then OP_IF pushes 100, OP_ELSE pushes 0, OP_ENDIF. Does it validate?',
    difficulty: 'hard',
    unlockingScript: [1],
    lockingScript: ['OP_IF', 100, 'OP_ELSE', 0, 'OP_ENDIF'],
    expectedValid: true,
  },
  {
    id: 'hard-trace-step3',
    type: 'trace',
    title: 'Trace: Stack after step 3',
    description: 'The script pushes 2, 3, 4, then runs OP_ADD (step 3). What is on the stack after step 3 (after the third push, before OP_ADD)?',
    difficulty: 'hard',
    unlockingScript: [2, 3, 4],
    lockingScript: ['OP_ADD'],
    question: { type: 'stack_after_step', stepIndex: 2 },
    expectedAnswer: [4, 3, 2],
  },
  {
    id: 'hard-trace-verify-conditional',
    type: 'trace',
    title: 'Trace: Verify then conditional',
    description: 'The script pushes 1, OP_VERIFY, then OP_IF 1 OP_ELSE 0 OP_ENDIF. Does it validate?',
    difficulty: 'hard',
    unlockingScript: [1],
    lockingScript: ['OP_VERIFY', 'OP_IF', 1, 'OP_ELSE', 0, 'OP_ENDIF'],
    question: { type: 'valid' },
    expectedAnswer: true,
  },
  {
    id: 'hard-unlock-sub-equal',
    type: 'unlock',
    title: 'Unlock: Subtraction check',
    description: 'The locking script expects two numbers a, b. It subtracts (a - b) and checks the result equals 5. Push two numbers such that a - b = 5 (e.g. 10, 5).',
    difficulty: 'hard',
    lockingScript: ['OP_SUB', 5, 'OP_EQUAL'],
  },
  {
    id: 'hard-match-2dup',
    type: 'match_outcome',
    title: 'Match: Final stack using 2DUP',
    description: 'Build scripts that use OP_2DUP (duplicate top two items) and leave exactly two identical values on the stack (e.g. [7, 7]).',
    difficulty: 'hard',
    goal: { finalStack: [7, 7] },
  },
  {
    id: 'hard-trace-multi-step',
    type: 'trace',
    title: 'Trace: Multi-step arithmetic',
    description: 'The script pushes 5, 3, runs OP_ADD (step 2), then pushes 2, runs OP_SUB (step 4). What is on the stack after step 2 (after OP_ADD)?',
    difficulty: 'hard',
    unlockingScript: [5, 3],
    lockingScript: ['OP_ADD', 2, 'OP_SUB'],
    question: { type: 'stack_after_step', stepIndex: 2 },
    expectedAnswer: [8],
  },
  {
    id: 'hard-predict-equalverify',
    type: 'predict_valid',
    title: 'Predict: OP_EQUALVERIFY',
    description: 'The script pushes two equal values then OP_EQUALVERIFY then 1. Does it validate?',
    difficulty: 'hard',
    unlockingScript: [6, 6],
    lockingScript: ['OP_EQUALVERIFY', 1],
    expectedValid: true,
  },
]
