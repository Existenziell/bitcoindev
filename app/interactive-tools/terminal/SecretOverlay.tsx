'use client'

import { useEffect, useState, useRef } from 'react'
import confetti from 'canvas-confetti'
import { mysteriousMessages } from './secretConstants'

/** Play the secret TTS (used during Matrix animation, ~halfway through). */
export function playSecretSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

  const speak = () => {
    const voices = speechSynthesis.getVoices()
    const mysteriousVoice =
      voices.find(
        (voice) =>
          voice.name.toLowerCase().includes('zira') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('alex')
      ) || voices.find((voice) => voice.lang.startsWith('en'))

    // Prepend zero-width space so engine's volume ramp happens on it and "You" is audible
    const mainText =
      '\u200BYou have discovered the hidden path. The mysteries of Bitcoin run deeper than you thought. What you seek is not in the code, but in the philosophy.'

    const utterance = new SpeechSynthesisUtterance(mainText)
    utterance.volume = 1
    if (mysteriousVoice) {
      utterance.voice = mysteriousVoice
      utterance.rate = 0.85
      utterance.pitch = 0.9
    }

    speechSynthesis.speak(utterance)
  }

  const voices = speechSynthesis.getVoices()
  if (voices.length === 0) {
    const handleVoicesChanged = () => {
      speak()
      speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
    }
    speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
  } else {
    speak()
  }
}

interface SecretOverlayProps {
  visible: boolean
  onClose: () => void
  onGoHome: () => void
}

export default function SecretOverlay({ visible, onClose, onGoHome }: SecretOverlayProps) {
  const [randomMessage, setRandomMessage] = useState('')
  const confettiTriggered = useRef(false)

  useEffect(() => {
    if (!visible) return
    if (!confettiTriggered.current) {
      confettiTriggered.current = true

      const duration = 3000
      const end = Date.now() + duration

      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval)
          return
        }

        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f2a900', '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1'],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f2a900', '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1'],
        })
      }, 100)

      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f2a900', '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1'],
        })
      }, duration)
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return
    queueMicrotask(() => {
      setRandomMessage(
        mysteriousMessages[Math.floor(Math.random() * mysteriousMessages.length)]
      )
    })
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden page-bg min-h-dvh animate-fadeIn">
      {/* Animated background effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-btc/20 via-transparent to-btc/20 animate-pulse" />
      </div>

      <div className="relative z-10 flex min-h-full items-center justify-center px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto w-full text-center space-y-5 sm:space-y-6 md:space-y-8">
        <h1 className="heading-page text-5xl sm:text-6xl md:text-8xl font-bold relative">
          <span className="absolute inset-0 text-btc/30 blur-sm animate-pulse">
            SECRET
          </span>
        </h1>

        <div className="space-y-6">
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 font-mono leading-relaxed">
            {randomMessage || 'Loading...'}
          </p>

          <div className="border-t border-b border-btc/30 py-6 space-y-4">
            <p className="text-lg text-gray-600 dark:text-gray-400 font-mono">
              You have discovered a hidden path.
            </p>
            <p className="text-base text-gray-500 dark:text-gray-500 font-mono">
              The mysteries of Bitcoin run deeper than you thought.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-600 font-mono italic">
              What you seek is not in the code, but in the philosophy.
            </p>
          </div>

          <div className="space-y-2 text-gray-600 dark:text-gray-400 font-mono text-sm">
            <p className="text-btc font-semibold">Don&apos;t trust, verify.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <button type="button" onClick={onClose} className="btn-primary">
            Back to Terminal
          </button>
          <button type="button" onClick={onGoHome} className="btn-secondary">
            Return Home
          </button>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-300 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-600 font-mono break-all">
            Block Height: 0 | Hash:
            000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600 font-mono mt-2">
            &quot;The Times 03/Jan/2009 Chancellor on brink of second bailout
            for banks&quot;
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}
