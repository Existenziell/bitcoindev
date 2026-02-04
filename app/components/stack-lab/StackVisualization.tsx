'use client'

import { StackItem } from '@/app/utils/stackLabInterpreter'
import { formatStackItem, getItemType, itemCount } from '@/app/utils/stackLabFormatters'
import InfoTooltip from '@/app/components/stack-lab/InfoTooltip'
import StackLabCard from '@/app/components/stack-lab/StackLabCard'

interface StackVisualizationProps {
  stack: StackItem[]
}

export default function StackVisualization({ stack }: StackVisualizationProps) {
  return (
    <StackLabCard flex>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Stack</h3>
        <InfoTooltip content="The stack is a Last-In-First-Out (LIFO) data structure. Items are pushed onto the top and popped from the top. The stack shows the current state during script execution." />
      </div>
      
      {stack.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          <div className="text-center">
            <div className="mb-2">Stack is empty</div>
            <div className="text-xs">Execute a script to see stack changes</div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1">
            <div className="text-xs text-gray-500 mb-2 px-2">Top ↓</div>
            
            {[...stack].reverse().map((item, index) => {
              const actualIndex = stack.length - 1 - index
              const isTop = actualIndex === stack.length - 1
              const itemType = getItemType(item)
              
              return (
                <div
                  key={actualIndex}
                  className={`
                    px-3 py-2 rounded border
                    ${isTop 
                      ? 'bg-btc/20 border-btc/50 text-btc' 
                      : 'bg-gray-200/60 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }
                    transition-colors
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm truncate">
                        {formatStackItem(item, { hexShowTail: true })}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {itemType}
                      </div>
                    </div>
                    {isTop && (
                      <div className="ml-2 text-xs text-btc font-semibold">
                        TOP
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            
            <div className="text-xs text-gray-500 mt-2 px-2">Bottom ↑</div>
          </div>
        </div>
      )}
      
      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-700 text-xs text-gray-500">
        {itemCount(stack.length)}
      </div>
    </StackLabCard>
  )
}
