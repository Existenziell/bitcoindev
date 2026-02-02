'use client'

import { useState, useCallback, useEffect, useRef, useMemo, startTransition } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core'
import StackVisualization from '@/app/components/stack-lab/StackVisualization'
import OpCodePalette from '@/app/components/stack-lab/OpCodePalette'
import ScriptBuilder from '@/app/components/stack-lab/ScriptBuilder'
import ExecutionLog from '@/app/components/stack-lab/ExecutionLog'
import StackLabCard from '@/app/components/stack-lab/StackLabCard'
import { ScriptInterpreter, type StackItem, type ExecutionStep } from '@/app/utils/stackLabInterpreter'
import { parseStackItem, formatStackForLog } from '@/app/utils/stackLabFormatters'
import {
  CHALLENGES,
  validateChallenge,
  type Challenge,
  type UnlockChallenge,
  type MatchOutcomeChallenge,
  type TraceChallenge,
  type PredictValidChallenge,
  type ValidationResult,
} from '@/app/stack-lab/challenges'

const UNLOCKING_ID = 'challenge-unlocking-script'
const LOCKING_ID = 'challenge-locking-script'

const STACK_LAB_SOLVED_KEY = 'stack-lab-solved-challenges'

function loadSolvedChallengeIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STACK_LAB_SOLVED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function saveSolvedChallengeIds(ids: string[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STACK_LAB_SOLVED_KEY, JSON.stringify(ids))
  } catch {
    // ignore
  }
}

function isUnlock(c: Challenge): c is UnlockChallenge {
  return c.type === 'unlock'
}

function isMatchOutcome(c: Challenge): c is MatchOutcomeChallenge {
  return c.type === 'match_outcome'
}

function isTrace(c: Challenge): c is TraceChallenge {
  return c.type === 'trace'
}

function isPredictValid(c: Challenge): c is PredictValidChallenge {
  return c.type === 'predict_valid'
}

export type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

function isValidDifficulty(s: string | null): s is Difficulty {
  return s === 'easy' || s === 'medium' || s === 'hard'
}

export default function StackLabChallenges() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const difficultyParam = searchParams.get('difficulty')
  const selectedDifficulty: Difficulty = isValidDifficulty(difficultyParam) ? difficultyParam : 'easy'
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)

  useEffect(() => {
    if (!isValidDifficulty(difficultyParam)) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('difficulty', 'easy')
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }, [difficultyParam, pathname, router, searchParams])

  const handleDifficultyChange = useCallback(
    (difficulty: Difficulty) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('difficulty', difficulty)
      params.delete('challengeId')
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
      setSelectedChallenge(null)
    },
    [pathname, router, searchParams]
  )

  const challengesByDifficulty = useMemo(() => {
    const byDiff: Record<Difficulty, Challenge[]> = { easy: [], medium: [], hard: [] }
    for (const c of CHALLENGES) {
      if (c.difficulty === 'easy') byDiff.easy.push(c)
      else if (c.difficulty === 'medium') byDiff.medium.push(c)
      else if (c.difficulty === 'hard') byDiff.hard.push(c)
    }
    return byDiff
  }, [])

  const currentChallenges = challengesByDifficulty[selectedDifficulty]

  // Sync selected challenge from URL (challengeId) when params or currentChallenges change
  useEffect(() => {
    const challengeIdParam = searchParams.get('challengeId')
    startTransition(() => {
      if (!challengeIdParam) {
        setSelectedChallenge(null)
        return
      }
      const challenge = currentChallenges.find((c) => c.id === challengeIdParam)
      if (challenge) {
        setSelectedChallenge(challenge)
      } else {
        setSelectedChallenge(null)
        const params = new URLSearchParams(searchParams.toString())
        params.delete('challengeId')
        if (params.toString() !== searchParams.toString()) {
          router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false })
        }
      }
    })
  }, [searchParams, pathname, router, selectedDifficulty, currentChallenges])

  const [userUnlockingScript, setUserUnlockingScript] = useState<Array<string | StackItem>>([])
  const [userLockingScript, setUserLockingScript] = useState<Array<string | StackItem>>([])
  const [checkResult, setCheckResult] = useState<ValidationResult | null>(null)
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([])
  const [displayStack, setDisplayStack] = useState<StackItem[]>([])
  const [showDataModal, setShowDataModal] = useState(false)
  const [dataModalTarget, setDataModalTarget] = useState<'unlocking' | 'locking'>('unlocking')
  const [dataInput, setDataInput] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [predictValidAnswer, setPredictValidAnswer] = useState<boolean | null>(null)
  const [traceOptions, setTraceOptions] = useState<Array<{ label: string; value: StackItem[] }>>([])
  const [selectedTraceOption, setSelectedTraceOption] = useState<number>(-1)
    const [solvedChallengeIds, setSolvedChallengeIds] = useState<string[]>(() => loadSolvedChallengeIds())

  const interpreterRef = useRef<ScriptInterpreter | null>(null)
  useEffect(() => {
    interpreterRef.current = new ScriptInterpreter()
    return () => {
      interpreterRef.current = null
    }
  }, [])

  const openChallenge = useCallback(
    (c: Challenge) => {
      setSelectedChallenge(c)
      setUserUnlockingScript([])
      setUserLockingScript([])
      setCheckResult(null)
      setExecutionSteps([])
      setDisplayStack([])
      setPredictValidAnswer(null)
      setTraceOptions([])
      setSelectedTraceOption(-1)
      const params = new URLSearchParams(searchParams.toString())
      params.set('challengeId', c.id)
      params.set('difficulty', selectedDifficulty)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams, selectedDifficulty]
  )

  const closeChallenge = useCallback(() => {
    setSelectedChallenge(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('challengeId')
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  useEffect(() => {
    if (!selectedChallenge || !isTrace(selectedChallenge) || selectedChallenge.question.type !== 'stack_after_step' || !interpreterRef.current) {
      return
    }
    const fullScript = [...selectedChallenge.unlockingScript, ...selectedChallenge.lockingScript]
    const result = interpreterRef.current.execute(fullScript)
    const step = result.steps[selectedChallenge.question.stepIndex]
    if (!step) return
    const correct = step.stackAfter
    const wrong1: StackItem[] = []
    const wrong2: StackItem[] = [0]
    const wrong3: StackItem[] = result.finalStack.length > 0 ? result.finalStack : [1]
    const options = [
      { label: formatStackForLog(correct), value: correct },
      { label: formatStackForLog(wrong1), value: wrong1 },
      { label: formatStackForLog(wrong2), value: wrong2 },
      { label: formatStackForLog(wrong3), value: wrong3 },
    ]
    const unique = options.filter((o, i, arr) => arr.findIndex((x) => formatStackForLog(x.value) === formatStackForLog(o.value)) === i)
    const shuffled = [...unique].sort(() => Math.random() - 0.5)
    setTraceOptions(shuffled)
    setSelectedTraceOption(-1)
  }, [selectedChallenge])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, delta } = event
      setActiveId(null)
      if (!over || active.id === over.id) return
      if (delta && Math.abs(delta.x) < 5 && Math.abs(delta.y) < 5) return

      const activeIdStr = active.id as string
      const overId = over.id as string
      if (!activeIdStr.startsWith('opcode-')) return

      const opCode = activeIdStr.replace('opcode-', '')
      if (overId === UNLOCKING_ID) {
        setUserUnlockingScript((prev) => [...prev, opCode])
      } else if (overId === LOCKING_ID && selectedChallenge && isMatchOutcome(selectedChallenge)) {
        setUserLockingScript((prev) => [...prev, opCode])
      }
    },
    [selectedChallenge]
  )

  const handleDragStart = (event: { active: { id: unknown } }) => {
    setActiveId(String(event.active.id))
  }

  const handleRemoveFromScript = (scriptType: 'unlocking' | 'locking', index: number) => {
    if (scriptType === 'unlocking') {
      setUserUnlockingScript((prev) => prev.filter((_, i) => i !== index))
    } else {
      setUserLockingScript((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleEditScriptItem = (
    scriptType: 'unlocking' | 'locking',
    index: number,
    newValue: string | StackItem
  ) => {
    if (scriptType === 'unlocking') {
      setUserUnlockingScript((prev) => {
        const updated = [...prev]
        updated[index] = newValue
        return updated
      })
    } else {
      setUserLockingScript((prev) => {
        const updated = [...prev]
        updated[index] = newValue
        return updated
      })
    }
  }

  const handleAddData = (target: 'unlocking' | 'locking') => {
    setDataModalTarget(target)
    setShowDataModal(true)
    setDataInput('')
  }

  const handleDataSubmit = () => {
    if (!dataInput.trim()) return
    const value = parseStackItem(dataInput.trim())
    if (value === null) return
    if (dataModalTarget === 'unlocking') {
      setUserUnlockingScript((prev) => [...prev, value])
    } else {
      setUserLockingScript((prev) => [...prev, value])
    }
    setShowDataModal(false)
    setDataInput('')
  }

  const markChallengeSolved = useCallback((id: string) => {
    setSolvedChallengeIds((prev) => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      saveSolvedChallengeIds(next)
      return next
    })
  }, [])

  const handleCheck = useCallback(() => {
    if (!selectedChallenge || !interpreterRef.current) return

    if (isUnlock(selectedChallenge)) {
      const userInput = {
        type: 'unlock' as const,
        input: { unlockingScript: userUnlockingScript },
      }
      const result = validateChallenge(selectedChallenge, userInput, interpreterRef.current)
      setCheckResult(result)
      if (result.solved) markChallengeSolved(selectedChallenge.id)
      const steps = result.steps ?? []
      setExecutionSteps(steps)
      setDisplayStack(steps.length > 0 ? steps[steps.length - 1].stackAfter : [])
    } else if (isMatchOutcome(selectedChallenge)) {
      const userInput = {
        type: 'match_outcome' as const,
        input: {
          unlockingScript: userUnlockingScript,
          lockingScript: userLockingScript,
        },
      }
      const result = validateChallenge(selectedChallenge, userInput, interpreterRef.current)
      setCheckResult(result)
      if (result.solved) markChallengeSolved(selectedChallenge.id)
      const steps = result.steps ?? []
      setExecutionSteps(steps)
      setDisplayStack(steps.length > 0 ? steps[steps.length - 1].stackAfter : [])
    } else if (isPredictValid(selectedChallenge)) {
      if (predictValidAnswer === null) return
      const userInput = {
        type: 'predict_valid' as const,
        input: { userValid: predictValidAnswer },
      }
      const result = validateChallenge(selectedChallenge, userInput, interpreterRef.current)
      setCheckResult(result)
      if (result.solved) markChallengeSolved(selectedChallenge.id)
      setExecutionSteps(result.steps ?? [])
    } else if (isTrace(selectedChallenge)) {
      const q = selectedChallenge.question
      if (q.type === 'valid') {
        if (predictValidAnswer === null) return
        const userInput = {
          type: 'trace' as const,
          input: { answer: predictValidAnswer },
        }
        const result = validateChallenge(selectedChallenge, userInput, interpreterRef.current)
        setCheckResult(result)
        if (result.solved) markChallengeSolved(selectedChallenge.id)
        setExecutionSteps(result.steps ?? [])
      } else {
        if (selectedTraceOption < 0 || selectedTraceOption >= traceOptions.length) return
        const userInput = {
          type: 'trace' as const,
          input: { answer: traceOptions[selectedTraceOption].value },
        }
        const result = validateChallenge(selectedChallenge, userInput, interpreterRef.current)
        setCheckResult(result)
        if (result.solved) markChallengeSolved(selectedChallenge.id)
        setExecutionSteps(result.steps ?? [])
      }
    }
  }, [
    selectedChallenge,
    userUnlockingScript,
    userLockingScript,
    predictValidAnswer,
    traceOptions,
    selectedTraceOption,
    markChallengeSolved,
  ])

  const handleReset = useCallback(() => {
    if (!selectedChallenge) return
    setUserUnlockingScript([])
    setUserLockingScript([])
    setCheckResult(null)
    setExecutionSteps([])
    setDisplayStack([])
    setPredictValidAnswer(null)
    setSelectedTraceOption(-1)
  }, [selectedChallenge])

  const showWorkspace =
    selectedChallenge && (isUnlock(selectedChallenge) || isMatchOutcome(selectedChallenge))

  const difficultyTabBar = (
    <div className="flex justify-center gap-0 mb-4 border-b border-gray-300 dark:border-gray-700">
      {DIFFICULTIES.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => handleDifficultyChange(d)}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize ${
            selectedDifficulty === d
              ? 'border-btc text-gray-900 dark:text-gray-100'
              : 'btn-tab'
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  )

  if (!selectedChallenge) {
    const solvedInDifficulty = currentChallenges.filter((c) => solvedChallengeIds.includes(c.id)).length
    const totalInDifficulty = currentChallenges.length
    const totalSolved = solvedChallengeIds.length
    const totalChallenges = CHALLENGES.length
    return (
      <div className="space-y-4 pb-12">
        <p className="text-secondary text-center max-w-2xl mx-auto">
          Test your script knowledge. Select a challenge below.
        </p>
        {difficultyTabBar}
        <div className="flex flex-col items-center gap-1">
          {totalInDifficulty > 0 && (
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Progress: <span className="font-medium text-emerald-600 dark:text-emerald-400">{solvedInDifficulty}</span> of {totalInDifficulty} solved
            </p>
          )}
          {totalChallenges > 0 && (
            <p className="text-sm text-center text-gray-500 dark:text-gray-500">
              Total: <span className="font-medium text-emerald-600 dark:text-emerald-400">{totalSolved}</span> of {totalChallenges} challenges solved
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentChallenges.map((c) => {
            const solved = solvedChallengeIds.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => openChallenge(c)}
                className={`text-left panel-base-hover p-4 rounded-lg border transition-colors ${
                  solved
                    ? 'border-emerald-500 dark:border-emerald-600 bg-emerald-50/60 dark:bg-emerald-900/20 hover:border-emerald-600 dark:hover:border-emerald-500'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-semibold text-gray-800 dark:text-gray-200">{c.title}</div>
                  {solved && (
                    <span
                      className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300"
                      title="Solved"
                    >
                      ✓ Solved
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                  {c.description}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (selectedChallenge && (isPredictValid(selectedChallenge) || isTrace(selectedChallenge))) {
    const scripts = isPredictValid(selectedChallenge)
      ? {
          unlocking: selectedChallenge.unlockingScript,
          locking: selectedChallenge.lockingScript,
        }
      : {
          unlocking: selectedChallenge.unlockingScript,
          locking: selectedChallenge.lockingScript,
        }
    const traceQ = isTrace(selectedChallenge) ? selectedChallenge.question : null
    const isTraceValid = traceQ?.type === 'valid'
    const _isTraceStack = traceQ?.type === 'stack_after_step'

    return (
      <div className="space-y-4 pb-12">
        <button
          type="button"
          onClick={closeChallenge}
          className="btn-secondary-sm"
        >
          ← Back to list
        </button>
        <StackLabCard>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {selectedChallenge.title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedChallenge.description}</p>
        </StackLabCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-start">
          <div className="space-y-2">
            <ScriptBuilder
              id="readonly-unlocking"
              title="Unlocking Script"
              script={scripts.unlocking}
              onRemove={() => {}}
              readOnly
            />
            <ScriptBuilder
              id="readonly-locking"
              title="Locking Script"
              script={scripts.locking}
              onRemove={() => {}}
              readOnly
            />
          </div>
          <div className="space-y-4">
            <StackLabCard>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {isPredictValid(selectedChallenge)
                  ? 'Does this script validate?'
                  : isTraceValid
                    ? 'Does this script validate?'
                    : `What is on the stack after step ${(traceQ as { stepIndex: number }).stepIndex}?`}
              </h3>
              {isPredictValid(selectedChallenge) || isTraceValid ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPredictValidAnswer(true)}
                    className={`btn-primary-sm ${predictValidAnswer === true ? 'ring-2 ring-offset-2 ring-btc' : 'opacity-80'}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setPredictValidAnswer(false)}
                    className={`btn-secondary-sm ${predictValidAnswer === false ? 'ring-2 ring-offset-2 ring-gray-500' : ''}`}
                  >
                    No
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {traceOptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedTraceOption(i)}
                      className={`w-full text-left px-3 py-2 rounded border font-mono text-sm ${
                        selectedTraceOption === i
                          ? 'border-btc bg-btc/10 text-gray-900 dark:text-gray-100'
                          : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </StackLabCard>
            <div className="flex justify-start gap-2">
              <button
                type="button"
                onClick={handleCheck}
                disabled={
                  isPredictValid(selectedChallenge) || isTraceValid
                    ? predictValidAnswer === null
                    : selectedTraceOption < 0
                }
                className="btn-primary-sm"
              >
                Check
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary-sm"
              >
                Reset
              </button>
            </div>
            {checkResult && (
              <StackLabCard>
                <div
                  className={`p-3 rounded border text-sm font-medium ${
                    checkResult.solved
                      ? 'bg-emerald-100/80 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-100/80 dark:bg-red-900/20 border-red-400 dark:border-red-700/50 text-red-700 dark:text-red-300'
                  }`}
                >
                  {checkResult.solved ? '✓ Correct!' : '✗ Not quite.'}
                  {checkResult.message && (
                    <p className="mt-1 text-xs opacity-90">{checkResult.message}</p>
                  )}
                </div>
              </StackLabCard>
            )}
            {checkResult?.steps && checkResult.steps.length > 0 && (
              <ExecutionLog
                steps={checkResult.steps}
                currentStep={checkResult.steps.length - 1}
                executionResult={checkResult.executionResult}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  if (selectedChallenge && !showWorkspace) {
    const c = selectedChallenge as Challenge
    return (
      <div className="space-y-4 pb-12">
        <button
          type="button"
          onClick={closeChallenge}
          className="btn-secondary-sm"
        >
          ← Back to list
        </button>
        <StackLabCard>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {c.title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{c.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-3">
            This challenge type is not yet implemented.
          </p>
        </StackLabCard>
      </div>
    )
  }

  const lockingScriptForDisplay =
    selectedChallenge && isUnlock(selectedChallenge)
      ? selectedChallenge.lockingScript
      : userLockingScript
  const lockingReadOnly = selectedChallenge && isUnlock(selectedChallenge)

  return (
    <>
      <div className="space-y-4 pb-12">
        <button
          type="button"
          onClick={closeChallenge}
          className="btn-secondary-sm"
        >
          ← Back to list
        </button>

        <StackLabCard>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {selectedChallenge.title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedChallenge.description}</p>
        </StackLabCard>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          modifiers={[]}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <OpCodePalette
                  onAddData={() => handleAddData(lockingReadOnly ? 'unlocking' : 'unlocking')}
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-2">
                <ScriptBuilder
                  id={UNLOCKING_ID}
                  title="Unlocking Script"
                  script={userUnlockingScript}
                  onRemove={(index) => handleRemoveFromScript('unlocking', index)}
                  onEdit={(index, newValue) => handleEditScriptItem('unlocking', index, newValue)}
                />
                <ScriptBuilder
                  id={LOCKING_ID}
                  title="Locking Script"
                  script={lockingScriptForDisplay}
                  onRemove={(index) => handleRemoveFromScript('locking', index)}
                  onEdit={(index, newValue) => handleEditScriptItem('locking', index, newValue)}
                  readOnly={lockingReadOnly}
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-2">
                <StackVisualization stack={displayStack} />

                {checkResult && (
                  <StackLabCard>
                    <div
                      className={`p-3 rounded border text-sm font-medium ${
                        checkResult.solved
                          ? 'bg-emerald-100/80 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300'
                          : 'bg-red-100/80 dark:bg-red-900/20 border-red-400 dark:border-red-700/50 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {checkResult.solved ? '✓ Correct!' : '✗ Not quite.'}
                      {checkResult.message && (
                        <p className="mt-1 text-xs opacity-90">{checkResult.message}</p>
                      )}
                    </div>
                  </StackLabCard>
                )}

                <div className="flex justify-start gap-2 w-full">
                  <button
                    type="button"
                    onClick={handleCheck}
                    disabled={
                      lockingReadOnly
                        ? userUnlockingScript.length === 0
                        : userUnlockingScript.length === 0 && userLockingScript.length === 0
                    }
                    className="btn-primary-sm"
                  >
                    Check
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-secondary-sm"
                  >
                    Reset
                  </button>
                </div>

                {executionSteps.length > 0 && checkResult?.executionResult !== undefined && (
                  <ExecutionLog
                    steps={executionSteps}
                    currentStep={executionSteps.length - 1}
                    executionResult={checkResult.executionResult}
                  />
                )}
              </div>
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeId && activeId.startsWith('opcode-') ? (
              <div className="px-3 py-2 rounded border bg-gray-200 dark:bg-gray-800 border-gray-400 dark:border-gray-600 text-gray-800 dark:text-gray-200 pointer-events-none">
                <div className="font-mono text-sm font-semibold">
                  {activeId.replace('opcode-', '')}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {showDataModal && (
        <div
          className="modal-overlay flex items-center justify-center"
          onClick={() => setShowDataModal(false)}
        >
          <div className="modal-card mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Push Data to {dataModalTarget === 'unlocking' ? 'Unlocking' : 'Locking'} Script
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter a number or hex string (e.g., 42, 0x1234, &quot;hello&quot;)
            </p>
            <input
              type="text"
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDataSubmit()
                else if (e.key === 'Escape') setShowDataModal(false)
              }}
              className="input-panel w-full px-3 py-2 mb-4"
              placeholder="Enter data..."
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowDataModal(false)} className="btn-secondary-sm">
                Cancel
              </button>
              <button type="button" onClick={handleDataSubmit} className="btn-primary-sm">
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
