'use client'

import { useDraggable } from '@dnd-kit/core'
import { OP_CODES, OP_CODE_CATEGORIES, type OpCode } from '@/app/utils/stackLabInterpreter'
import { useState } from 'react'
import InfoTooltip from '@/app/components/stack-lab/InfoTooltip'
import StackLabCard from '@/app/components/stack-lab/StackLabCard'

interface OpCodePaletteProps {
  onAddData?: () => void
}

function DraggableOpCode({ opCode }: { opCode: OpCode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `opcode-${opCode.name}`,
    data: {
      type: 'opcode',
      opCode: opCode.name,
    },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`
        px-2 py-1.5 rounded border cursor-grab active:cursor-grabbing
        ${opCode.enabled
          ? 'bg-gray-200 dark:bg-gray-800 border-gray-400 dark:border-gray-600 hover:border-accent hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
          : 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800 text-gray-500 dark:text-gray-600 cursor-not-allowed opacity-50'
        }
        ${isDragging ? 'opacity-0 pointer-events-none' : ''}
        transition-opacity
      `}
      title={`${opCode.name} - ${opCode.description}`}
    >
      <div className="font-mono text-xs font-semibold">{opCode.name}</div>
    </div>
  )
}

export default function OpCodePalette({ onAddData }: OpCodePaletteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredOpCodes = OP_CODES.filter(opCode => {
    const matchesSearch = opCode.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         opCode.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || opCode.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const opCodesByCategory = OP_CODE_CATEGORIES.reduce((acc, category) => {
    acc[category] = filteredOpCodes.filter(op => op.category === category)
    return acc
  }, {} as Record<string, OpCode[]>)

  return (
    <StackLabCard flex>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">OP Codes</h3>
        <InfoTooltip content="Drag OP codes from here to the script builders. OP codes are the instructions that Bitcoin Script uses to manipulate the stack and execute logic." />
      </div>
      
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search OP codes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-panel w-full px-3 py-2 text-sm placeholder-gray-500"
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`
            px-2 py-1 text-xs rounded border
            ${!selectedCategory
              ? 'bg-accent/20 border-accent text-accent'
              : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-secondary hover:border-gray-400 dark:hover:border-gray-600'
            }
          `}
        >
          All
        </button>
        {OP_CODE_CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`
              px-2 py-1 text-xs rounded border
              ${selectedCategory === category
                ? 'bg-accent/20 border-accent text-accent'
                : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-secondary hover:border-gray-400 dark:hover:border-gray-600'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>

      {onAddData && (
        <button
          onClick={onAddData}
          className="panel-base-hover mb-3 w-full px-3 py-2 text-sm"
        >
          + Push Data
        </button>
      )}

      <div className="flex-1 overflow-y-auto">
        {selectedCategory ? (
          <div>
            <h4 className="text-xs font-semibold text-secondary mb-2 uppercase">
              {selectedCategory}
            </h4>
            <div className="flex flex-wrap gap-2">
              {opCodesByCategory[selectedCategory]?.map(opCode => (
                <DraggableOpCode key={opCode.name} opCode={opCode} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {OP_CODE_CATEGORIES.map(category => {
              const codes = opCodesByCategory[category]
              if (codes.length === 0) return null
              
              return (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-secondary mb-2 uppercase">
                    {category}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {codes.map(opCode => (
                      <DraggableOpCode key={opCode.name} opCode={opCode} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {filteredOpCodes.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            No OP codes found
          </div>
        )}
      </div>
    </StackLabCard>
  )
}
