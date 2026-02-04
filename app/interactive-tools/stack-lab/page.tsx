'use client'

import { useState, useCallback, useEffect, useRef, Suspense, type ReactNode } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core'
import { useMobileWarning } from '@/app/hooks/useMobileWarning'
import StackVisualization from '@/app/components/stack-lab/StackVisualization'
import OpCodePalette from '@/app/components/stack-lab/OpCodePalette'
import ScriptBuilder from '@/app/components/stack-lab/ScriptBuilder'
import ExecutionControls from '@/app/components/stack-lab/ExecutionControls'
import ExecutionLog from '@/app/components/stack-lab/ExecutionLog'
import ScriptTemplates from '@/app/components/stack-lab/ScriptTemplates'
import StackLabCard from '@/app/components/stack-lab/StackLabCard'
import StackLabChallenges from '@/app/components/stack-lab/StackLabChallenges'
import { ScriptInterpreter, type StackItem, type ExecutionStep } from '@/app/utils/stackLabInterpreter'
import { parseStackItem } from '@/app/utils/stackLabFormatters'
import { ChevronDown, StackLabIcon } from '@/app/components/Icons'

function StackLabTabsAndContent({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const modeParam = searchParams.get('mode')
  const activeTab: 'sandbox' | 'challenges' =
    modeParam === 'challenges' ? 'challenges' : 'sandbox'

  const handleTabChange = useCallback(
    (tab: 'sandbox' | 'challenges') => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('mode', tab)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  useEffect(() => {
    if (modeParam === null) {
      router.replace(`${pathname}?mode=sandbox`, { scroll: false })
    }
  }, [modeParam, pathname, router])

  return (
    <>
      <div className="flex justify-center mb-6">
        <div
          className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-200/60 dark:bg-gray-800/60 p-1"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sandbox'}
            onClick={() => handleTabChange('sandbox')}
            className={`px-5 py-2.5 text-sm font-semibold rounded-md transition-colors ${
              activeTab === 'sandbox'
                ? 'bg-btc text-gray-900 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Sandbox
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'challenges'}
            onClick={() => handleTabChange('challenges')}
            className={`px-5 py-2.5 text-sm font-semibold rounded-md transition-colors ${
              activeTab === 'challenges'
                ? 'bg-btc text-gray-900 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Challenges
          </button>
        </div>
      </div>

      {activeTab === 'challenges' ? (
        <StackLabChallenges />
      ) : (
        children
      )}
    </>
  )
}

export default function StackLabPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [unlockingScript, setUnlockingScript] = useState<Array<string | StackItem>>([])
  const [lockingScript, setLockingScript] = useState<Array<string | StackItem>>([])
  const [stack, setStack] = useState<StackItem[]>([])
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [isExecuting, setIsExecuting] = useState(false)
  const [showDataModal, setShowDataModal] = useState(false)
  const [dataModalTarget, setDataModalTarget] = useState<'unlocking' | 'locking' | null>(null)
  const [dataInput, setDataInput] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const { showWarning: showMobileWarning, dismissed: mobileWarningDismissed, dismiss: handleDismissMobileWarning } = useMobileWarning('stack-lab-mobile-warning-dismissed')
  const [isFlowExplanationExpanded, setIsFlowExplanationExpanded] = useState(false)

  const interpreterRef = useRef<ScriptInterpreter | null>(null)
  useEffect(() => {
    interpreterRef.current = new ScriptInterpreter()
    return () => {
      interpreterRef.current = null
    }
  }, [])

  // Client-only to avoid hydration mismatch
  useEffect(() => {
    queueMicrotask(() => setIsMounted(true))
  }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event
    setActiveId(null)

    if (!over) return

    // Ignore click (no drag)
    if (active.id === over.id) return

    if (delta && (Math.abs(delta.x) < 5 && Math.abs(delta.y) < 5)) {
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId.startsWith('opcode-')) {
      const opCode = activeId.replace('opcode-', '')
      
      if (overId === 'unlocking-script') {
        setUnlockingScript(prev => [...prev, opCode])
      } else if (overId === 'locking-script') {
        setLockingScript(prev => [...prev, opCode])
      }
    }
  }

  const handleDragStart = (event: any) => {
    const id = event.active.id as string
    setActiveId(id)
  }

  const handleRemoveFromScript = (scriptType: 'unlocking' | 'locking', index: number) => {
    if (scriptType === 'unlocking') {
      setUnlockingScript(prev => prev.filter((_, i) => i !== index))
    } else {
      setLockingScript(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleEditScriptItem = (scriptType: 'unlocking' | 'locking', index: number, newValue: string | StackItem) => {
    if (scriptType === 'unlocking') {
      setUnlockingScript(prev => {
        const updated = [...prev]
        updated[index] = newValue
        return updated
      })
    } else {
      setLockingScript(prev => {
        const updated = [...prev]
        updated[index] = newValue
        return updated
      })
    }
  }

  const [executionResult, setExecutionResult] = useState<{ success: boolean; error?: string } | undefined>(undefined)

  const handleExecute = useCallback(() => {
    if (!interpreterRef.current) return
    setIsExecuting(true)
    setCurrentStepIndex(-1)

    const fullScript = [...unlockingScript, ...lockingScript]
    const result = interpreterRef.current.execute(fullScript)

    setStack(result.finalStack)
    setExecutionSteps(result.steps)
    setCurrentStepIndex(result.steps.length - 1)
    setExecutionResult({
      success: result.success,
      error: result.error,
    })
    setIsExecuting(false)
  }, [unlockingScript, lockingScript])

  const handleStep = useCallback(() => {
    if (!interpreterRef.current) return
    const fullScript = [...unlockingScript, ...lockingScript]
    if (fullScript.length === 0) return

    if (currentStepIndex < 0) {
      // Run full script once and cache all steps (O(N) instead of O(N^2) when stepping through)
      const result = interpreterRef.current.execute(fullScript)
      setExecutionSteps(result.steps)
      setCurrentStepIndex(0)
      setStack(result.steps[0]?.stackAfter ?? [])
    } else if (currentStepIndex < executionSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
      const next = executionSteps[currentStepIndex + 1]
      if (next) setStack(next.stackAfter)
    } else {
      const nextIndex = currentStepIndex + 1
      if (nextIndex >= fullScript.length) return
      const result = interpreterRef.current.execute(fullScript.slice(0, nextIndex + 1))
      setExecutionSteps(result.steps)
      setCurrentStepIndex(nextIndex)
      setStack(result.finalStack)
    }
  }, [currentStepIndex, executionSteps, unlockingScript, lockingScript])

  const clearExecutionState = useCallback(() => {
    setStack([])
    setExecutionSteps([])
    setCurrentStepIndex(-1)
  }, [])

  const handleStepBack = useCallback(() => {
    if (currentStepIndex <= 0) {
      clearExecutionState()
    } else {
      const prevIndex = currentStepIndex - 1
      setCurrentStepIndex(prevIndex)
      if (executionSteps[prevIndex]) {
        setStack(executionSteps[prevIndex].stackAfter)
      }
    }
  }, [currentStepIndex, executionSteps, clearExecutionState])

  const handleReset = () => {
    clearExecutionState()
    setExecutionResult(undefined)
    setUnlockingScript([])
    setLockingScript([])
  }

  const handleLoadTemplate = (template: { unlockingScript: Array<string | number>; lockingScript: Array<string | number> }) => {
    clearExecutionState()
    setUnlockingScript(template.unlockingScript)
    setLockingScript(template.lockingScript)
  }

  const handleAddData = (target: 'unlocking' | 'locking') => {
    setDataModalTarget(target)
    setShowDataModal(true)
    setDataInput('')
  }

  const handleDataSubmit = () => {
    if (!dataModalTarget || !dataInput.trim()) return

    const value = parseStackItem(dataInput.trim())
    if (value === null) return

    if (dataModalTarget === 'unlocking') {
      setUnlockingScript((prev) => [...prev, value])
    } else {
      setLockingScript((prev) => [...prev, value])
    }

    setShowDataModal(false)
    setDataModalTarget(null)
    setDataInput('')
  }

  if (!isMounted) {
    return (
      <>
        <div className="flex justify-center mb-3">
          <StackLabIcon className="w-20 h-20" />
        </div>
        <h1 className="heading-page text-center">
          Stack Lab
        </h1>
        <p className="text-secondary text-center mb-8">
          Interactive Bitcoin Script Playground
        </p>
        <div className="text-center text-secondary">Loading...</div>
      </>
    )
  }

  return (
    <>
      <div className="flex justify-center mb-3">
        <StackLabIcon className="w-20 h-20" />
      </div>
      <h1 className="heading-page text-center">
        Stack Lab
      </h1>
      <Suspense fallback={<div className="text-center text-secondary py-8">Loading...</div>}>
        <StackLabTabsAndContent>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        modifiers={[]}
        
      >
        <p className="text-secondary text-center mb-4">
          Interactive Bitcoin Script Playground
        </p>
        <div className="space-y-2 pb-12">
          <StackLabCard>
            <button
              onClick={() => setIsFlowExplanationExpanded(!isFlowExplanationExpanded)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">How Stack Lab Works</h2>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                  isFlowExplanationExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isFlowExplanationExpanded && (
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    <strong className="text-gray-600 dark:text-gray-300">1. Build Scripts:</strong><br />Drag OP codes from the palette to the Unlocking Script (runs first) and Locking Script (runs second). 
                    You can also push data (numbers, hex strings) using the &quot;+ Push Data&quot; button or load an example template.
                    <br />
                    <strong className="text-gray-600 dark:text-gray-300">2. Execute:</strong><br />Click &quot;Execute&quot; to run both scripts together, or use &quot;Step&quot; to execute one operation at a time. 
                    Watch the stack update in real-time as operations execute.
                    <br />
                    <strong className="text-gray-600 dark:text-gray-300">3. Learn:</strong><br />The execution log shows each step with the stack state before and after each operation. 
                    A script is valid if the final stack contains a non-zero value.
                  </p>
                </div>
              </div>
            )}
          </StackLabCard>

          <ScriptTemplates onLoadTemplate={handleLoadTemplate} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <OpCodePalette onAddData={() => handleAddData('unlocking')} />
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-2">
                <ScriptBuilder
                  id="unlocking-script"
                  title="Unlocking Script"
                  script={unlockingScript}
                  onRemove={(index) => handleRemoveFromScript('unlocking', index)}
                  onEdit={(index, newValue) => handleEditScriptItem('unlocking', index, newValue)}
                />
                <ScriptBuilder
                  id="locking-script"
                  title="Locking Script"
                  script={lockingScript}
                  onRemove={(index) => handleRemoveFromScript('locking', index)}
                  onEdit={(index, newValue) => handleEditScriptItem('locking', index, newValue)}
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-2">
                <StackVisualization stack={stack} />
                
                <div className="flex justify-center w-full">
                  <ExecutionControls
                    onExecute={handleExecute}
                    onStep={handleStep}
                    onStepBack={handleStepBack}
                    onReset={handleReset}
                    canStep={(unlockingScript.length > 0 || lockingScript.length > 0) && !isExecuting && (executionSteps.length === 0 || currentStepIndex < (unlockingScript.length + lockingScript.length - 1))}
                    canStepBack={currentStepIndex >= 0 && !isExecuting}
                    canExecute={unlockingScript.length > 0 || lockingScript.length > 0}
                    isExecuting={isExecuting}
                  />
                </div>

                {executionSteps.length > 0 && (
                  <ExecutionLog 
                    steps={executionResult !== undefined
                      ? executionSteps
                      : executionSteps.slice(0, currentStepIndex + 1)}
                    currentStep={currentStepIndex}
                    executionResult={executionResult}
                  />
                )}
              </div>
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeId && activeId.startsWith('opcode-') ? (
              <div className="output-panel">
                <div className="font-mono text-sm font-semibold">
                  {activeId.replace('opcode-', '')}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </div>
      </DndContext>
        </StackLabTabsAndContent>
      </Suspense>

      {showMobileWarning && !mobileWarningDismissed && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Stack Lab is not optimized for small screens. The drag-and-drop interface and layout work best on desktop or tablet devices with larger screens.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              You can still use Stack Lab on mobile, but the experience may be limited. For the best experience, please use a desktop or tablet.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleDismissMobileWarning(false)}
                className="btn-primary-sm w-full"
              >
                Continue Anyway
              </button>
              <button
                onClick={() => handleDismissMobileWarning(true)}
                className="btn-secondary-sm w-full"
              >
                Continue & Don&apos;t Show Again
              </button>
            </div>
          </div>
        </div>
      )}

      {showDataModal && (
        <div className="modal-overlay flex items-center justify-center" onClick={() => setShowDataModal(false)}>
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
                if (e.key === 'Enter') {
                  handleDataSubmit()
                } else if (e.key === 'Escape') {
                  setShowDataModal(false)
                }
              }}
              className="input-panel w-full px-3 py-2 mb-4"
              placeholder="Enter data..."
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDataModal(false)}
                className="btn-secondary-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDataSubmit}
                className="btn-primary-sm"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
