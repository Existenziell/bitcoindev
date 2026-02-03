import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SecretOverlay, { playSecretSpeech } from '@/app/interactive-tools/terminal/SecretOverlay'
import { mysteriousMessages } from '@/app/interactive-tools/terminal/secretConstants'

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}))

describe('SecretOverlay', () => {
  const onClose = vi.fn()
  const onGoHome = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders null when visible is false', () => {
    const { container } = render(
      <SecretOverlay visible={false} onClose={onClose} onGoHome={onGoHome} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders overlay with SECRET heading and static copy when visible', async () => {
    render(
      <SecretOverlay visible={true} onClose={onClose} onGoHome={onGoHome} />
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByText('SECRET')).toBeInTheDocument()
    expect(
      screen.getByText('You have discovered a hidden path.')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'The mysteries of Bitcoin run deeper than you thought.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'What you seek is not in the code, but in the philosophy.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText("Don't trust, verify.")).toBeInTheDocument()
    expect(
      screen.getByText(/Block Height: 0 \| Hash:/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /The Times 03\/Jan\/2009 Chancellor on brink of second bailout/
      )
    ).toBeInTheDocument()
  })

  it('shows random message or Loading after microtask', async () => {
    render(
      <SecretOverlay visible={true} onClose={onClose} onGoHome={onGoHome} />
    )

    const loadingEl = screen.queryByText('Loading...')
    const hasMessageBefore = mysteriousMessages.some((msg) =>
      document.body.textContent?.includes(msg)
    )
    expect(loadingEl || hasMessageBefore).toBeTruthy()

    await act(async () => {
      await Promise.resolve()
    })

    const loadingAfter = screen.queryByText('Loading...')
    const hasMessageAfter = mysteriousMessages.some((msg) =>
      document.body.textContent?.includes(msg)
    )
    expect(loadingAfter || hasMessageAfter).toBe(true)
  })

  it('renders Back to Terminal and Return Home buttons', async () => {
    render(
      <SecretOverlay visible={true} onClose={onClose} onGoHome={onGoHome} />
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(
      screen.getByRole('button', { name: 'Back to Terminal' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Return Home' })
    ).toBeInTheDocument()
  })

  it('calls onClose when Back to Terminal is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SecretOverlay visible={true} onClose={onClose} onGoHome={onGoHome} />
    )

    await act(async () => {
      await Promise.resolve()
    })

    await user.click(screen.getByRole('button', { name: 'Back to Terminal' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onGoHome).not.toHaveBeenCalled()
  })

  it('calls onGoHome when Return Home is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SecretOverlay visible={true} onClose={onClose} onGoHome={onGoHome} />
    )

    await act(async () => {
      await Promise.resolve()
    })

    await user.click(screen.getByRole('button', { name: 'Return Home' }))
    expect(onGoHome).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('playSecretSpeech', () => {
  const mockSpeak = vi.fn()
  const mockGetVoices = vi.fn()
  const mockAddEventListener = vi.fn()
  const mockRemoveEventListener = vi.fn()
  const originalSpeechSynthesis = window.speechSynthesis
  const originalSpeechSynthesisUtterance = (global as any).SpeechSynthesisUtterance

  afterEach(() => {
    ;(window as any).speechSynthesis = originalSpeechSynthesis
    ;(global as any).SpeechSynthesisUtterance = originalSpeechSynthesisUtterance
    vi.restoreAllMocks()
  })

  it('does nothing when speechSynthesis is not in window', () => {
    delete (window as any).speechSynthesis

    playSecretSpeech()

    expect(mockSpeak).not.toHaveBeenCalled()
  })

  it('calls speak when speechSynthesis has voices', () => {
    class MockSpeechSynthesisUtterance {
      text = ''
      constructor(text: string) {
        this.text = text
      }
    }
    ;(global as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance
    mockGetVoices.mockReturnValue([{ name: 'English', lang: 'en-US' }])
    ;(window as any).speechSynthesis = {
      getVoices: mockGetVoices,
      speak: mockSpeak,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    }

    playSecretSpeech()

    expect(mockGetVoices).toHaveBeenCalled()
    expect(mockSpeak).toHaveBeenCalledTimes(1)
    const utterance = mockSpeak.mock.calls[0][0]
    expect(utterance.text).toContain('hidden path')
    expect(utterance.text).toContain('mysteries of Bitcoin')
  })

  it('adds voiceschanged listener when no voices initially', () => {
    class MockSpeechSynthesisUtterance {
      text = ''
      constructor(text: string) {
        this.text = text
      }
    }
    ;(global as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance
    mockGetVoices.mockReturnValue([])
    let voicesChangedHandler: (() => void) | null = null
    mockAddEventListener.mockImplementation(
      (event: string, handler: () => void) => {
        if (event === 'voiceschanged') voicesChangedHandler = handler
      }
    )
    mockGetVoices.mockReturnValueOnce([]).mockReturnValueOnce([
      { name: 'Samantha', lang: 'en-US' },
    ])

    ;(window as any).speechSynthesis = {
      getVoices: mockGetVoices,
      speak: mockSpeak,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    }

    playSecretSpeech()

    expect(mockAddEventListener).toHaveBeenCalledWith(
      'voiceschanged',
      expect.any(Function)
    )
    expect(mockSpeak).not.toHaveBeenCalled()

    if (voicesChangedHandler) {
      ;(voicesChangedHandler as () => void)()
      expect(mockSpeak).toHaveBeenCalledTimes(1)
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'voiceschanged',
        voicesChangedHandler
      )
    }
  })
})
