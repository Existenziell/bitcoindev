'use client'

import { useEffect, useRef } from 'react'

interface MatrixAnimationProps {
  duration?: number // Duration in milliseconds
  onComplete?: () => void
}

export default function MatrixAnimation({ duration = 4000, onComplete }: MatrixAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    startTimeRef.current = Date.now()
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match viewport (full page)
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Detect theme from document (same as theme toggle / next-themes)
    const getTheme = () => {
      const isDark =
        document.documentElement.classList.contains('dark') ||
        document.body.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      return { isDark, charColor: isDark ? '#f2a900' : '#4ade80' }
    }

    // Set initial blend mode from theme (animate() will update each frame if theme toggles)
    const { isDark } = getTheme()
    canvas.style.mixBlendMode = isDark ? 'screen' : 'multiply'

    // Matrix characters
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
    const charArray = chars.split('')

    // Column configuration
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = []

    // Initialize drops
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100
    }

    // Animation function
    const animate = () => {
      const start = startTimeRef.current
      if (start === null) return
      const elapsed = Date.now() - start

      if (elapsed >= duration) {
        if (onComplete) {
          onComplete()
        }
        return
      }

      const { isDark, charColor } = getTheme()
      // Light mode: multiply blend so chars are visible on light bg; clear with white fade for trail.
      // Dark mode: screen blend on dark bg; clear with black fade for trail.
      canvas.style.mixBlendMode = isDark ? 'screen' : 'multiply'
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Set text properties - match terminal theme
      ctx.fillStyle = charColor
      ctx.font = `${fontSize}px monospace`

      // Draw characters
      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)]
        const x = i * fontSize
        const y = drops[i] * fontSize

        // Draw character
        ctx.fillText(text, x, y)

        // Reset drop if it reaches bottom or randomly
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }

        // Move drop down
        drops[i]++
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [duration, onComplete])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  )
}
