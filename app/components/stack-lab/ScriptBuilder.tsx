'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { StackItem } from '@/app/utils/stackLabInterpreter'
import { formatStackItem, itemCount, parseStackItem } from '@/app/utils/stackLabFormatters'
import InfoTooltip from '@/app/components/stack-lab/InfoTooltip'
import StackLabCard from '@/app/components/stack-lab/StackLabCard'
import { XIcon } from '@/app/components/Icons'

interface ScriptBuilderProps {
  id: string
  title: string
  script: Array<string | StackItem>
  onRemove: (index: number) => void
  onEdit?: (index: number, newValue: string | StackItem) => void
  /** When true, script is displayed only (no drop, remove, or edit). */
  readOnly?: boolean
}

function ScriptItem({ 
  item, 
  index, 
  onRemove,
  onEdit
}: { 
  item: string | StackItem
  index: number
  onRemove: (index: number) => void
  onEdit?: (index: number, newValue: string | StackItem) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const handleEdit = () => {
    if (typeof item === 'string' || typeof item === 'number') {
      // Set to original value when starting to edit
      setEditValue(String(item))
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    const trimmed = editValue.trim()
    if (trimmed === '') {
      handleCancel()
      return
    }
    const newValue = parseStackItem(trimmed)
    if (newValue === null) {
      handleCancel()
      return
    }
    if (onEdit) onEdit(index, newValue)
    setIsEditing(false)
    setEditValue('')
  }

  const handleCancel = () => {
    // Reset edit value to original item value and exit edit mode
    setEditValue(typeof item === 'string' || typeof item === 'number' ? String(item) : '')
    setIsEditing(false)
  }
  if (isEditing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-800 border border-btc rounded">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSave()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              handleCancel()
            }
          }}
          onBlur={(e) => {
            // Only save on blur if not clicking cancel button
            const relatedTarget = e.relatedTarget as HTMLElement
            if (!relatedTarget || !relatedTarget.closest('button[data-cancel]')) {
              handleSave()
            } else {
              handleCancel()
            }
          }}
          className="flex-1 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm font-mono text-gray-800 dark:text-gray-200 focus:outline-none focus:border-btc"
          autoFocus
        />
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            handleSave()
          }}
          onMouseDown={(e) => e.preventDefault()}
          className="px-2 py-1 bg-btc text-gray-900 text-xs font-semibold rounded hover:bg-btc/80 transition-colors"
        >
          Save
        </button>
        <button
          data-cancel
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            handleCancel()
          }}
          onMouseDown={(e) => e.preventDefault()}
          className="px-2 py-1 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="panel-base-hover flex items-center gap-2 group">
      <div 
        className="flex-1 font-mono text-sm text-gray-800 dark:text-gray-200 cursor-text"
        onClick={handleEdit}
        title="Click to edit"
      >
        {formatStackItem(item)}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onRemove(index)
        }}
        className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
        title="Remove"
      >
        <XIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  )
}

export default function ScriptBuilder({
  id,
  title,
  script,
  onRemove,
  onEdit,
  readOnly = false,
}: ScriptBuilderProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: readOnly,
  })

  const getInfoText = () => {
    if (id === 'unlocking-script') {
      return 'Unlocking Script (scriptSig): Runs first. Provides the data and operations (signatures, keys, etc.) needed to satisfy the locking script\'s conditions. This script is included in the transaction input when spending Bitcoin. It runs first, pushing data onto the stack.'
    }
    return 'Locking Script (scriptPubKey): Runs second. Defines the conditions/requirements that must be met to unlock and spend the Bitcoin. This script is stored in the transaction output and specifies what data or operations are required. It runs after the unlocking script, verifying that the data satisfies the conditions.'
  }

  return (
    <StackLabCard flex>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        <InfoTooltip content={getInfoText()} />
      </div>
      
      <div
        ref={setNodeRef}
        className={`
          overflow-y-auto h-[250px] p-3 rounded border-2 border-dashed
          ${readOnly
            ? 'border-gray-300 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/30 cursor-default'
            : isOver
              ? 'border-btc bg-btc/10'
              : 'border-gray-300 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/30'
          }
          transition-colors
        `}
      >
        {script.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-gray-500 text-sm text-center">
            <div>
              {readOnly ? (
                <div className="text-sm">(empty)</div>
              ) : (
                <>
                  <div className="mb-2">Drop OP codes here</div>
                  <div className="text-xs">or click &quot;+ Push Data&quot; to add data</div>
                </>
              )}
            </div>
          </div>
        ) : readOnly ? (
          <div className="space-y-2">
            {script.map((item, index) => (
              <div
                key={index}
                className="panel-base flex items-center gap-2"
              >
                <div className="flex-1 font-mono text-sm text-gray-800 dark:text-gray-200">
                  {formatStackItem(item)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {script.map((item, index) => (
              <ScriptItem
                key={index}
                item={item}
                index={index}
                onRemove={onRemove}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-700 text-xs text-gray-500">
        {itemCount(script.length)}
      </div>
    </StackLabCard>
  )
}
