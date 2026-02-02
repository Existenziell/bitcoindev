'use client'

interface ExecutionControlsProps {
  onExecute: () => void
  onStep: () => void
  onStepBack?: () => void
  onReset: () => void
  canStep: boolean
  canStepBack?: boolean
  canExecute: boolean
  isExecuting: boolean
}

export default function ExecutionControls({
  onExecute,
  onStep,
  onStepBack,
  onReset,
  canStep,
  canStepBack = false,
  canExecute,
  isExecuting,
}: ExecutionControlsProps) {
  return (
    <div className="flex items-center justify-start gap-2 w-full text-sm">
      <button
        onClick={onExecute}
        disabled={!canExecute || isExecuting}
        className="btn-primary-sm disabled-btn"
      >
        Execute
      </button>
      {onStepBack && (
        <button
          onClick={onStepBack}
          disabled={!canStepBack || isExecuting}
          className="panel-base-hover px-5 py-2 disabled-btn"
          title="Step back to previous execution state"
        >
          ←
        </button>
      )}
      <button
        onClick={onStep}
        disabled={!canStep || isExecuting}
        className="panel-base-hover px-5 py-2 disabled-btn"
      >
        →
      </button>
      <button
        onClick={onReset}
        disabled={isExecuting}
        className="panel-base-hover px-4 py-2 disabled-btn"
      >
        Reset
      </button>
    </div>
  )
}
