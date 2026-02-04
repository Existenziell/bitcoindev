'use client'

import { useState, useRef, useEffect, KeyboardEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CopyIcon, TerminalIcon } from '@/app/components/Icons'
import copyToClipboard from '@/app/utils/copyToClipboard'
import { bitcoinRpc } from '@/app/utils/bitcoinRpc'
import { useMobileWarning } from '@/app/hooks/useMobileWarning'
import MatrixAnimation from '@/app/components/MatrixAnimation'
import SecretOverlay, { playSecretSpeech } from '@/app/interactive-tools/terminal/SecretOverlay'
import { SECRET_TRIGGERS, SYSTEM_ERROR_MESSAGES } from '@/app/interactive-tools/terminal/secretConstants'
import {
  COMMANDS,
  parseCommand,
  findMatchingCommands,
  commandRequiresParams,
  getUsageInfo,
  getParameterDetails,
  generateExample,
} from '@/app/utils/terminalCommands'

interface OutputLine {
  type: 'command' | 'result' | 'error' | 'info' | 'logo' | 'log' | 'usage'
  content: string
  timestamp: Date
  copyableCommand?: string // For example usage lines that can be copied
}

const STARTUP_LOGS = [
  'Bitcoin Core version v28.0 (release build)',
  'Using the \'arm_shani(1way,2way)\' SHA256 implementation',
  'Default data directory /home/bitcoin/.bitcoin',
  'Using data directory /home/bitcoin/.bitcoin',
  'Config file: /home/bitcoin/.bitcoin/bitcoin.conf',
  'Using at most 125 automatic connections (1048576 file descriptors available)',
  'scheduler thread start',
  'Binding RPC on address 127.0.0.1 port 8332',
  'Starting HTTP server with 4 worker threads',
  'Using /16 prefix for IP bucketing',
  'init message: Loading P2P addresses…',
  'Loaded 65132 addresses from peers.dat  42ms',
  'init message: Loading banlist…',
  'SetNetworkActive: true',
  'Cache configuration:',
  '* Using 2.0 MiB for block index database',
  '* Using 8.0 MiB for chain state database',
  '* Using 440.0 MiB for in-memory UTXO set',
  'Script verification uses 10 additional threads',
  'init message: Loading block index…',
  'Assuming ancestors of block 00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054 have valid signatures.',
  'Opening LevelDB in /home/bitcoin/.bitcoin/blocks/index',
  'Opened LevelDB successfully',
  'init message: Verifying blocks…',
  'Loaded best chain: hashBestChain=00000000000000000001a5f1b5c6c5e7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3 height=933104 date=2026-01-20T15:43:09Z progress=1.000000',
  'Block index and chainstate loaded',
  '',
  'Bitcoin CLI Terminal ready - Connected to Public Node (mainnet)',
  'Type \'help\' for available commands.',
]

const BITCOIN_LOGO = `
     ⣿⡇⠀⢸⣿⡇⠀⠀⠀⠀
  ⠿⣿⣿⣿⡿⠿⠿⣿⣿⣿⣶⣄⠀
  ⠀⠀⢸⣿⣿⡇⠀⠀⠀⠈⣿⣿⣿⠀
  ⠀⠀⢸⣿⣿⡇⠀⠀⢀⣠⣿⣿⠟⠀
  ⠀⠀⢸⣿⣿⡿⠿⠿⠿⣿⣿⣥⣄⠀
  ⠀⠀⢸⣿⣿⡇⠀⠀⠀⠀⢻⣿⣿⣧
  ⠀⠀⢸⣿⣿⡇⠀⠀⠀⠀⣼⣿⣿⣿
  ⣶⣿⣿⣿⣷⣶⣶⣾⣿⣿⠿⠛⠁
  ⠀⠀⠀⣿⡇⠀⢸⣿⡇
    `

function getInitialOutput(): OutputLine[] {
  const now = new Date()
  return [
    { type: 'logo', content: BITCOIN_LOGO, timestamp: now },
    ...STARTUP_LOGS.map((content) => ({ type: 'log' as const, content, timestamp: now })),
  ]
}

export default function TerminalPage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState<OutputLine[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLocked, setIsLocked] = useState(false) // Lock input after secret easter egg
  const [exampleBlockHash, setExampleBlockHash] = useState<string>('')
  const [exampleTxId, setExampleTxId] = useState<string>('')
  const [showMatrix, setShowMatrix] = useState(false)
  const [showSecretOverlay, setShowSecretOverlay] = useState(false)
  const { showWarning: showMobileWarning, dismissed: mobileWarningDismissed, dismiss: handleDismissMobileWarning } = useMobileWarning('terminal-mobile-warning-dismissed')
  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const lastTabPressRef = useRef<number>(0)

  // Stream startup logs one-by-one for effect; defer start with requestIdleCallback so first
  // paint and first tap aren't competing (INP). One line per rAF yields to the main thread each frame.
  useEffect(() => {
    const now = new Date()
    setOutput([{ type: 'logo', content: BITCOIN_LOGO, timestamp: now }])

    let cancelled = false
    let rafId: number | null = null

    const startStreaming = () => {
      let index = 0
      const tick = () => {
        if (cancelled || index >= STARTUP_LOGS.length) return
        setOutput((prev) => [
          ...prev,
          { type: 'log', content: STARTUP_LOGS[index], timestamp: new Date() },
        ])
        index += 1
        if (index < STARTUP_LOGS.length) {
          rafId = requestAnimationFrame(tick)
        }
      }
      rafId = requestAnimationFrame(tick)
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(startStreaming, { timeout: 600 })
      return () => {
        cancelled = true
        if (rafId !== null) cancelAnimationFrame(rafId)
        ;(window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId)
      }
    }
    const timeoutId = setTimeout(startStreaming, 100)
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    const fetchExamples = async () => {
      try {
        const [blockHashData, mempoolData] = await Promise.all([
          bitcoinRpc('getbestblockhash', []),
          bitcoinRpc('getrawmempool', []),
        ])
        if (blockHashData.result) {
          setExampleBlockHash(blockHashData.result as string)
        }
        if (mempoolData.result && Array.isArray(mempoolData.result) && mempoolData.result.length > 0) {
          setExampleTxId(mempoolData.result[0] as string)
        }
      } catch (error) {
        // On error, examples stay empty
        console.error('Failed to fetch examples:', error)
      }
    }

    // Defer to not block startup
    const timeout = setTimeout(fetchExamples, 2000)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  // Refocus after command finishes
  useEffect(() => {
    if (!isLoading && !isLocked && inputRef.current && document.activeElement !== inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [isLoading, isLocked])

  const handleOutputClick = () => {
    if (isLocked) return
    const selection = window.getSelection()
    if (!selection || selection.toString().length === 0) {
      inputRef.current?.focus()
    }
  }

  const handleAutocomplete = (showAll: boolean = false) => {
    const trimmed = input.trim()
    const matches = findMatchingCommands(trimmed, COMMANDS)

    if (matches.length === 0) {
      setOutput(prev => [
        ...prev,
        {
          type: 'error',
          content: `No commands found matching "${trimmed}"`,
          timestamp: new Date(),
        },
      ])
      return
    }

    if (matches.length === 1) {
      const match = matches[0]
      const inputParts = trimmed.split(/\s+/)
      if (inputParts.length === 1) {
        setInput(match)
      } else {
        const args = inputParts.slice(1).join(' ')
        setInput(`${match} ${args}`)
      }
    } else {
      if (showAll) {
        const matchList = matches.map(cmd => `  ${cmd.padEnd(20)} ${COMMANDS[cmd]}`).join('\n')
        setOutput(prev => [
          ...prev,
          {
            type: 'info',
            content: `Possible completions:\n${matchList}`,
            timestamp: new Date(),
          },
        ])
      } else {
        const commonPrefix = matches.reduce((prefix, cmd) => {
          let i = 0
          while (i < prefix.length && i < cmd.length && prefix[i].toLowerCase() === cmd[i].toLowerCase()) {
            i++
          }
          return prefix.substring(0, i)
        })

        if (commonPrefix.length > trimmed.split(/\s+/)[0].length) {
          const inputParts = trimmed.split(/\s+/)
          const args = inputParts.slice(1).join(' ')
          setInput(args ? `${commonPrefix} ${args}` : commonPrefix)
        } else {
          const matchList = matches.map(cmd => `  ${cmd.padEnd(20)} ${COMMANDS[cmd]}`).join('\n')
          setOutput(prev => [
            ...prev,
            {
              type: 'info',
              content: `Possible completions:\n${matchList}`,
              timestamp: new Date(),
            },
          ])
        }
      }
    }
  }

  const executeCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim()
    if (!trimmedCmd) return

    setOutput(prev => [
      ...prev,
      { type: 'command', content: `$ bitcoin-cli ${trimmedCmd}`, timestamp: new Date() },
    ])

    setCommandHistory(prev => [...prev, trimmedCmd])
    setHistoryIndex(-1)

    // Check for secret triggers (case-insensitive)
    const lowerCmd = trimmedCmd.toLowerCase()
    const isEasterEgg = SECRET_TRIGGERS.some(trigger => 
      lowerCmd.includes(trigger.toLowerCase())
    )

    if (isEasterEgg) {
      // Permanently lock the terminal input
      setIsLocked(true)
      setInput('')
      // Display all error messages at once
      const allMessages = SYSTEM_ERROR_MESSAGES.join('\n')
      
      setOutput(prev => [
        ...prev,
        {
          type: 'error',
          content: `error code: -1\nerror message:\n${allMessages}\n\nSystem integrity compromised...\nInitiating emergency protocols...`,
          timestamp: new Date(),
        },
      ])

      // Start Matrix animation after a short delay
      setTimeout(() => {
        setShowMatrix(true)
      }, 500)

      // Start voice at half the Matrix animation (2s into the 4s animation)
      const matrixDuration = 4000
      setTimeout(() => {
        playSecretSpeech()
      }, 500 + matrixDuration / 2)

      return
    }

    const { method, params } = parseCommand(trimmedCmd)

    if (method === 'clear') {
      setOutput([])
      return
    }

    if (method === 'help') {
      if (params.length > 0) {
        // Normalize -commandname or commandname
        let commandName = String(params[0])
        if (commandName.startsWith('-')) {
          commandName = commandName.substring(1)
        }
        commandName = commandName.toLowerCase()

        if (!COMMANDS[commandName]) {
          setOutput(prev => [
            ...prev,
            {
              type: 'error',
              content: `error: unknown command "${commandName}". Type 'help' for available commands.`,
              timestamp: new Date(),
            },
          ])
          return
        }

        const fullDesc = COMMANDS[commandName]
        const descMatch = fullDesc.match(/^(.+?)(?:\.\s*Usage:)/)
        const description = descMatch ? descMatch[1] : fullDesc.replace(/\.\s*Usage:.*$/, '')

        const helpLines: string[] = []
        helpLines.push(`Command: ${commandName}`)
        helpLines.push(`Description: ${description}`)
        helpLines.push('')

        const usage = getUsageInfo(commandName, COMMANDS)
        if (usage) {
          helpLines.push(`Usage: ${commandName} ${usage}`)
          helpLines.push('')

          const paramDetails = getParameterDetails(usage)
          if (paramDetails.length > 0) {
            helpLines.push('Parameters:')
            paramDetails.forEach(param => {
              const paramDisplay = param.isOptional ? `[${param.name}]` : `<${param.name}>`
              helpLines.push(`  ${paramDisplay.padEnd(20)} ${param.format} - ${param.description}`)
            })
            helpLines.push('')
          }

          const example = generateExample(commandName, usage, { exampleBlockHash, exampleTxId })
          if (example) {
            const fullCommand = `${commandName} ${example}`
            setOutput(prev => [
              ...prev,
              { type: 'info', content: helpLines.join('\n'), timestamp: new Date() },
              {
                type: 'usage',
                content: `Example usage: ${fullCommand}`,
                timestamp: new Date(),
                copyableCommand: fullCommand,
              },
            ])
          } else {
            setOutput(prev => [
              ...prev,
              { type: 'info', content: helpLines.join('\n'), timestamp: new Date() },
            ])
          }
        } else {
          setOutput(prev => [
            ...prev,
            { type: 'info', content: helpLines.join('\n'), timestamp: new Date() },
          ])
        }
      } else {
        const helpText = Object.entries(COMMANDS)
          .map(([cmd, desc]) => `  ${cmd.padEnd(20)} ${desc}`)
          .join('\n')
        setOutput(prev => [
          ...prev,
          {
            type: 'info',
            content: `Available commands:\n${helpText}\n\nUse 'help <command>' for detailed information about a specific command.`,
            timestamp: new Date()
          },
        ])
      }
      return
    }

    if (!COMMANDS[method]) {
      setOutput(prev => [
        ...prev,
        {
          type: 'error',
          content: `error: unknown command "${method}". Type 'help' for available commands.`,
          timestamp: new Date(),
        },
      ])
      return
    }

    if (commandRequiresParams(method, COMMANDS) && params.length === 0) {
      const usage = getUsageInfo(method, COMMANDS)
      const example = usage ? generateExample(method, usage, { exampleBlockHash, exampleTxId }) : null

      setOutput(prev => [
        ...prev,
        {
          type: 'error',
          content: `error code: -1\nerror message:`,
          timestamp: new Date(),
        },
      ])

      setOutput(prev => [
        ...prev,
        {
          type: 'usage',
          content: `Usage: ${method} ${usage || '<parameters>'}`,
          timestamp: new Date(),
        },
      ])

      if (example) {
        const fullCommand = `${method} ${example}`
        setOutput(prev => [
          ...prev,
          {
            type: 'usage',
            content: `Example usage: ${fullCommand}`,
            timestamp: new Date(),
            copyableCommand: fullCommand,
          },
        ])
      }

      return
    }

    setIsLoading(true)
    try {
      const data = await bitcoinRpc(method, params)

      if (data.error) {
        const err = data.error
        setOutput(prev => [
          ...prev,
          {
            type: 'error',
            content: `error code: ${err.code ?? 'unknown'}\nerror message:\n${err.message ?? 'Unknown error'}`,
            timestamp: new Date(),
          },
        ])
      } else {
        const resultStr = typeof data.result === 'object'
          ? JSON.stringify(data.result, null, 2)
          : String(data.result)
        setOutput(prev => [
          ...prev,
          { type: 'result', content: resultStr, timestamp: new Date() },
        ])
      }
    } catch (error) {
      setOutput(prev => [
        ...prev,
        {
          type: 'error',
          content: `Network error: ${error instanceof Error ? error.message : 'Failed to connect'}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (isLocked) return
    if (!isLoading && input.trim()) {
      executeCommand(input)
      setInput('')
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isLocked) {
      e.preventDefault()
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '')
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '')
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const now = Date.now()
      const timeSinceLastTab = now - lastTabPressRef.current
      const isDoubleTab = timeSinceLastTab < 300 // 300ms window for double tab

      lastTabPressRef.current = now

      if (isDoubleTab) {
        handleAutocomplete(true)
      } else {
        handleAutocomplete(false)
      }
    } else if (e.key === 'Enter') {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setOutput([])
    }
  }

  return (
    <>
      {showMatrix && (
        <>
          <MatrixAnimation
            duration={4000}
            onComplete={() => {
              setShowMatrix(false)
              setShowSecretOverlay(true)
            }}
          />
          {/* Invisible overlay blocks nav and page interaction during Matrix animation */}
          <div
            className="fixed inset-0 z-50 pointer-events-auto"
            aria-hidden
          />
        </>
      )}
      {showSecretOverlay && (
        <SecretOverlay
          visible={showSecretOverlay}
          onClose={() => {
            setShowSecretOverlay(false)
            setIsLocked(false)
            setOutput(getInitialOutput())
            setTimeout(() => inputRef.current?.focus(), 0)
          }}
          onGoHome={() => router.push('/')}
        />
      )}
        <div className="flex justify-center mb-3">
          <TerminalIcon className="w-20 h-20" />
        </div>
       <h1 className="heading-page text-center">
        Bitcoin CLI Terminal
      </h1>
      <p className="text-secondary text-center mb-8">
        Interactive Bitcoin RPC playground
      </p>

      <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 shadow-2xl flex flex-col h-[450px] md:h-[700px]">
          <div className="bg-gray-200 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-3 md:px-4 py-2 flex items-center gap-2 flex-shrink-0">
            <div className="flex gap-1.5">
              <button
                onClick={() => router.push('/')}
                className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
                title="Close terminal"
              />
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-gray-600 dark:text-gray-300 text-xs md:text-sm font-mono ml-2">bitcoin-cli — mainnet</span>
          </div>

          <div
            ref={outputRef}
            onClick={handleOutputClick}
            className="bg-black dark:bg-gray-950 p-2 md:p-4 overflow-y-auto font-mono text-xs md:text-sm cursor-text flex-1 relative"
          >
            {output.map((line, i) => (
            <div key={i} className={line.type === 'log' ? 'mb-0.5' : 'mb-1 md:mb-2'}>
              {line.type === 'logo' && (
                <pre className="text-btc whitespace-pre text-[10px] md:text-sm">{line.content}</pre>
              )}
              {line.type === 'log' && (
                <div className="text-green-500 dark:text-gray-300 text-[10px] md:text-xs">{line.content}</div>
              )}
              {line.type === 'command' && (
                <div className="text-green-400 dark:text-btc">{line.content}</div>
              )}
              {line.type === 'result' && (
                <pre className="text-green-400 dark:text-emerald-300 whitespace-pre-wrap break-all">{line.content}</pre>
              )}
              {line.type === 'error' && (
                <pre className="text-red-400 dark:text-red-300 whitespace-pre-wrap">{line.content}</pre>
              )}
              {line.type === 'info' && (
                <pre className="text-green-500 dark:text-gray-300 whitespace-pre-wrap">{line.content}</pre>
              )}
              {line.type === 'usage' && (
                <div className="flex items-center gap-2 group flex-wrap">
                  <pre className="text-green-400 dark:text-emerald-300 whitespace-pre-wrap">{line.content}</pre>
                  {line.copyableCommand && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(line.copyableCommand!, 'Command')
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-green-900/30 dark:hover:bg-gray-800 rounded flex-shrink-0"
                      title="Copy command"
                    >
                      <CopyIcon className="w-3.5 h-3.5 text-green-400 dark:text-emerald-300" />
                    </button>
                  )}
                </div>
              )}
            </div>
            ))}

            {isLoading && (
              <div className="text-green-400 dark:text-gray-300 animate-pulse">Loading...</div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="bg-black dark:bg-gray-900 border-t border-green-800 dark:border-gray-800 p-2 md:p-4 flex items-center gap-1 md:gap-2 flex-shrink-0">
            <span className="text-green-400 dark:text-btc font-mono text-xs md:text-sm">$</span>
            <span className="text-green-500 dark:text-gray-300 font-mono text-xs md:text-sm hidden sm:inline">bitcoin-cli</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isLocked}
              className="terminal-input"
              placeholder={isLoading ? 'executing...' : 'enter command...'}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
            />
            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="terminal-submit"
            >
              Run
            </button>
          </form>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-12">
        This emulates <code className="code-inline text-xs">bitcoin-cli</code>.<br />Commands are sent as JSON-RPC to a public mainnet node.<br />Only read-only RPC methods are available.<br />Tab autocomplete is available.
      </p>

      {showMobileWarning && !mobileWarningDismissed && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Bitcoin CLI Terminal is not optimized for small screens. The terminal interface and keyboard shortcuts (Tab autocomplete, arrow keys for history) work best on desktop or tablet devices with larger screens.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              You can still use the terminal on mobile, but the experience may be limited. For the best experience, please use a desktop or tablet.
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
    </>
  )
}
