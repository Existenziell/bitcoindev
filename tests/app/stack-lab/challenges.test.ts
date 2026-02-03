import { describe, it, expect } from 'vitest'
import { ScriptInterpreter } from '@/app/utils/stackLabInterpreter'
import {
  validateChallenge,
  CHALLENGES,
  type UnlockChallenge,
  type MatchOutcomeChallenge,
  type TraceChallenge,
  type PredictValidChallenge,
} from '@/app/interactive-tools/stack-lab/challenges'

function freshInterpreter() {
  return new ScriptInterpreter()
}

describe('validateChallenge', () => {
  describe('unlock', () => {
    it('returns solved when unlocking script validates', () => {
      const challenge: UnlockChallenge = {
        id: 'test-unlock',
        type: 'unlock',
        title: 'Test',
        description: 'Test',
        difficulty: 'easy',
        lockingScript: ['OP_ADD', 8, 'OP_EQUAL'],
      }
      const result = validateChallenge(
        challenge,
        { type: 'unlock', input: { unlockingScript: [3, 5] } },
        freshInterpreter()
      )
      expect(result.solved).toBe(true)
      expect(result.message).toMatch(/[Cc]orrect/)
    })

    it('returns not solved when unlocking script does not validate', () => {
      const challenge: UnlockChallenge = {
        id: 'test-unlock',
        type: 'unlock',
        title: 'Test',
        description: 'Test',
        difficulty: 'easy',
        lockingScript: ['OP_ADD', 8, 'OP_EQUAL'],
      }
      const result = validateChallenge(
        challenge,
        { type: 'unlock', input: { unlockingScript: [1, 2] } },
        freshInterpreter()
      )
      expect(result.solved).toBe(false)
    })

    it('returns error when user input type does not match challenge', () => {
      const challenge: UnlockChallenge = {
        id: 'test-unlock',
        type: 'unlock',
        title: 'Test',
        description: 'Test',
        difficulty: 'easy',
        lockingScript: ['OP_EQUAL'],
      }
      const result = validateChallenge(
        challenge,
        { type: 'predict_valid', input: { userValid: true } },
        freshInterpreter()
      )
      expect(result.solved).toBe(false)
      expect(result.message).toMatch(/[Ii]nvalid input/)
    })
  })

  describe('match_outcome', () => {
    it('returns solved when goal is "valid" and script validates', () => {
      const challenge: MatchOutcomeChallenge = {
        id: 'test-match',
        type: 'match_outcome',
        title: 'Test',
        description: 'Test',
        difficulty: 'easy',
        goal: 'valid',
      }
      const result = validateChallenge(
        challenge,
        {
          type: 'match_outcome',
          input: {
            unlockingScript: [1],
            lockingScript: [],
          },
        },
        freshInterpreter()
      )
      expect(result.solved).toBe(true)
    })

    it('returns solved when goal is finalStack and stack matches', () => {
      const challenge: MatchOutcomeChallenge = {
        id: 'test-match',
        type: 'match_outcome',
        title: 'Test',
        description: 'Test',
        difficulty: 'easy',
        goal: { finalStack: [1] },
      }
      const result = validateChallenge(
        challenge,
        {
          type: 'match_outcome',
          input: {
            unlockingScript: [1],
            lockingScript: [],
          },
        },
        freshInterpreter()
      )
      expect(result.solved).toBe(true)
    })

    it('returns not solved when finalStack does not match', () => {
      const challenge: MatchOutcomeChallenge = {
        id: 'test-match',
        type: 'match_outcome',
        title: 'Test',
        description: 'Test',
        difficulty: 'easy',
        goal: { finalStack: [5] },
      }
      const result = validateChallenge(
        challenge,
        {
          type: 'match_outcome',
          input: {
            unlockingScript: [1],
            lockingScript: [],
          },
        },
        freshInterpreter()
      )
      expect(result.solved).toBe(false)
    })
  })

  describe('trace', () => {
    it('returns solved for stack_after_step when user answer matches', () => {
      // Interpreter stores stack bottom-to-top: push 5 then 3 => [5, 3]
      const challenge: TraceChallenge = {
        id: 'test-trace',
        type: 'trace',
        title: 'Test',
        description: 'Test',
        difficulty: 'easy',
        unlockingScript: [5, 3],
        lockingScript: ['OP_ADD'],
        question: { type: 'stack_after_step', stepIndex: 1 },
        expectedAnswer: [5, 3],
      }
      const result = validateChallenge(
        challenge,
        { type: 'trace', input: { answer: [5, 3] } },
        freshInterpreter()
      )
      expect(result.solved).toBe(true)
    })

    it('returns solved for valid question when user answer matches script result', () => {
      const challenge: TraceChallenge = {
        id: 'test-trace',
        type: 'trace',
        title: 'Test',
        description: 'Test',
        difficulty: 'easy',
        unlockingScript: [0],
        lockingScript: ['OP_VERIFY', 1],
        question: { type: 'valid' },
        expectedAnswer: false,
      }
      const result = validateChallenge(
        challenge,
        { type: 'trace', input: { answer: false } },
        freshInterpreter()
      )
      expect(result.solved).toBe(true)
    })

    it('returns not solved when trace answer is wrong', () => {
      const challenge: TraceChallenge = {
        id: 'test-trace',
        type: 'trace',
        title: 'Test',
        description: 'Test',
        difficulty: 'easy',
        unlockingScript: [5, 3],
        lockingScript: ['OP_ADD'],
        question: { type: 'stack_after_step', stepIndex: 1 },
        expectedAnswer: [5, 3],
      }
      const result = validateChallenge(
        challenge,
        { type: 'trace', input: { answer: [1, 2] } },
        freshInterpreter()
      )
      expect(result.solved).toBe(false)
    })
  })

  describe('predict_valid', () => {
    it('returns solved when user prediction matches script validity', () => {
      const challenge: PredictValidChallenge = {
        id: 'test-predict',
        type: 'predict_valid',
        title: 'Test',
        description: 'Test',
        difficulty: 'easy',
        unlockingScript: [5, 3],
        lockingScript: ['OP_ADD', 8, 'OP_EQUAL'],
        expectedValid: true,
      }
      const result = validateChallenge(
        challenge,
        { type: 'predict_valid', input: { userValid: true } },
        freshInterpreter()
      )
      expect(result.solved).toBe(true)
    })

    it('returns not solved when user prediction is wrong', () => {
      const challenge: PredictValidChallenge = {
        id: 'test-predict',
        type: 'predict_valid',
        title: 'Test',
        description: 'Test',
        difficulty: 'easy',
        unlockingScript: [0],
        lockingScript: ['OP_VERIFY', 1],
        expectedValid: false,
      }
      const result = validateChallenge(
        challenge,
        { type: 'predict_valid', input: { userValid: true } },
        freshInterpreter()
      )
      expect(result.solved).toBe(false)
    })
  })
})

describe('CHALLENGES', () => {
  it('is non-empty', () => {
    expect(CHALLENGES.length).toBeGreaterThan(0)
  })

  it('has unique ids', () => {
    const ids = CHALLENGES.map((c) => c.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('every challenge has valid difficulty', () => {
    const validDifficulty = ['easy', 'medium', 'hard']
    for (const c of CHALLENGES) {
      expect(validDifficulty).toContain(c.difficulty)
      expect(c.id).toBeTruthy()
      expect(c.title).toBeTruthy()
      expect(c.type).toBeTruthy()
    }
  })

  it('unlock challenges have lockingScript', () => {
    const unlock = CHALLENGES.filter((c) => c.type === 'unlock')
    for (const c of unlock) {
      expect(c).toHaveProperty('lockingScript')
      expect(Array.isArray((c as UnlockChallenge).lockingScript)).toBe(true)
    }
  })

  it('match_outcome challenges have goal', () => {
    const match = CHALLENGES.filter((c) => c.type === 'match_outcome')
    for (const c of match) {
      expect(c).toHaveProperty('goal')
      const goal = (c as MatchOutcomeChallenge).goal
      expect(goal === 'valid' || (typeof goal === 'object' && Array.isArray(goal.finalStack))).toBe(true)
    }
  })

  it('predict_valid challenges have unlockingScript, lockingScript, expectedValid', () => {
    const predict = CHALLENGES.filter((c) => c.type === 'predict_valid')
    for (const c of predict) {
      expect(c).toHaveProperty('unlockingScript')
      expect(c).toHaveProperty('lockingScript')
      expect(c).toHaveProperty('expectedValid')
      expect(typeof (c as PredictValidChallenge).expectedValid).toBe('boolean')
    }
  })

  it('trace challenges have question and expectedAnswer', () => {
    const trace = CHALLENGES.filter((c) => c.type === 'trace')
    for (const c of trace) {
      expect(c).toHaveProperty('question')
      expect(c).toHaveProperty('expectedAnswer')
      expect((c as TraceChallenge).question.type).toMatch(/stack_after_step|valid/)
    }
  })
})
