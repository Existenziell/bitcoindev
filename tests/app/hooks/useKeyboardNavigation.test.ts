import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useKeyboardNavigation } from '@/app/hooks/useKeyboardNavigation'

interface TestItem {
  path: string
  title: string
}

describe('useKeyboardNavigation', () => {
  const mockItems: TestItem[] = [
    { path: '/docs/bitcoin', title: 'Bitcoin Protocol' },
    { path: '/philosophy/fundamentals', title: 'Fundamentals' },
    { path: '/docs/mining', title: 'Mining' },
  ]

  /** Flush the hook's initial reset effect microtask so updates run inside act() */
  async function flushMicrotasks() {
    await act(async () => {
      await Promise.resolve()
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset document.activeElement
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Reset document.activeElement mock
    Object.defineProperty(document, 'activeElement', {
      value: document.body,
      writable: true,
      configurable: true,
    })
  })

  it('initializes with selectedIndex -1 (no selection)', async () => {
    const onNavigate = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onNavigate,
      })
    )
    await flushMicrotasks()

    expect(result.current.selectedIndex).toBe(-1)
  })

  it('navigates down with ArrowDown key', async () => {
    const onNavigate = vi.fn()
    const input = document.createElement('input')
    const inputRef = { current: input }
    
    // Mock document.activeElement to return our input
    Object.defineProperty(document, 'activeElement', {
      value: input,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        inputRef,
        onNavigate,
      })
    )

    await flushMicrotasks()

    // First ArrowDown should go from -1 to 0
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.selectedIndex).toBe(0)

    // Second ArrowDown should go from 0 to 1
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.selectedIndex).toBe(1)
  })

  it('navigates up with ArrowUp key', async () => {
    const onNavigate = vi.fn()
    const input = document.createElement('input')
    const inputRef = { current: input }
    
    // Mock document.activeElement to return our input
    Object.defineProperty(document, 'activeElement', {
      value: input,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        inputRef,
        onNavigate,
      })
    )
    await flushMicrotasks()

    // First move down twice to get to index 1
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.selectedIndex).toBe(1)

    // Then move up
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    })
    expect(result.current.selectedIndex).toBe(0)
  })

  it('stays at -1 when ArrowUp is pressed with no selection', async () => {
    const onNavigate = vi.fn()
    const input = document.createElement('input')
    const inputRef = { current: input }
    
    Object.defineProperty(document, 'activeElement', {
      value: input,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        inputRef,
        onNavigate,
      })
    )
    await flushMicrotasks()

    // Should start at -1
    expect(result.current.selectedIndex).toBe(-1)

    // ArrowUp from -1 should stay at -1
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    })

    expect(result.current.selectedIndex).toBe(-1)
  })

  it('goes back to -1 when ArrowUp is pressed at first item', async () => {
    const onNavigate = vi.fn()
    const input = document.createElement('input')
    const inputRef = { current: input }
    
    Object.defineProperty(document, 'activeElement', {
      value: input,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        inputRef,
        onNavigate,
      })
    )
    await flushMicrotasks()

    // First move down to select first item
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.selectedIndex).toBe(0)

    // Then move up to go back to no selection
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    })
    expect(result.current.selectedIndex).toBe(-1)
  })

  it('does not go above items.length - 1 with ArrowDown', async () => {
    const onNavigate = vi.fn()
    const input = document.createElement('input')
    const inputRef = { current: input }
    
    // Mock document.activeElement to return our input
    Object.defineProperty(document, 'activeElement', {
      value: input,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        inputRef,
        onNavigate,
      })
    )
    await flushMicrotasks()

    // Move to last item
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })

    expect(result.current.selectedIndex).toBe(mockItems.length - 1)

    // Try to go further
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })

    expect(result.current.selectedIndex).toBe(mockItems.length - 1)
  })

  it('does not call onNavigate when Enter is pressed with no selection', async () => {
    const onNavigate = vi.fn()
    const input = document.createElement('input')
    const inputRef = { current: input }
    
    // Mock document.activeElement to return our input
    Object.defineProperty(document, 'activeElement', {
      value: input,
      writable: true,
      configurable: true,
    })

    renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        inputRef,
        onNavigate,
      })
    )
    await flushMicrotasks()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })

    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('calls onNavigate when Enter is pressed with a selected item', async () => {
    const onNavigate = vi.fn()
    const input = document.createElement('input')
    const inputRef = { current: input }
    
    // Mock document.activeElement to return our input
    Object.defineProperty(document, 'activeElement', {
      value: input,
      writable: true,
      configurable: true,
    })

    renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        inputRef,
        onNavigate,
      })
    )
    await flushMicrotasks()

    // First select an item
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })

    // Then press Enter
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })

    expect(onNavigate).toHaveBeenCalledWith(mockItems[0], 0)
  })

  it('does not call onNavigate when Enter is pressed and input is not focused', async () => {
    const onNavigate = vi.fn()
    const inputRef = { current: document.createElement('input') }
    // Don't focus the input

    renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        inputRef,
        onNavigate,
      })
    )
    await flushMicrotasks()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })

    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('calls onEscape when Escape key is pressed', async () => {
    const onNavigate = vi.fn()
    const onEscape = vi.fn()

    renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onNavigate,
        onEscape,
      })
    )
    await flushMicrotasks()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('resets selectedIndex to -1 when items change', async () => {
    const onNavigate = vi.fn()
    const input = document.createElement('input')
    const inputRef = { current: input }
    
    // Mock document.activeElement to return our input
    Object.defineProperty(document, 'activeElement', {
      value: input,
      writable: true,
      configurable: true,
    })

    const { result, rerender } = renderHook(
      ({ items }) =>
        useKeyboardNavigation({
          items,
          inputRef,
          onNavigate,
        }),
      { initialProps: { items: mockItems } }
    )
    await flushMicrotasks()

    // Move selection
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.selectedIndex).toBe(0)
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.selectedIndex).toBe(1)

    // Change items - should reset to -1 (effect uses queueMicrotask)
    rerender({ items: [{ path: '/docs/new', title: 'New Item' }] })

    await waitFor(() => {
      expect(result.current.selectedIndex).toBe(-1)
    })
  })

  it('resets selectedIndex to -1 when resetDeps change', async () => {
    const onNavigate = vi.fn()
    const input = document.createElement('input')
    const inputRef = { current: input }
    
    // Mock document.activeElement to return our input
    Object.defineProperty(document, 'activeElement', {
      value: input,
      writable: true,
      configurable: true,
    })

    const { result, rerender } = renderHook(
      ({ query }) =>
        useKeyboardNavigation({
          items: mockItems,
          inputRef,
          onNavigate,
          resetDeps: [query],
        }),
      { initialProps: { query: 'bitcoin' } }
    )
    await flushMicrotasks()

    // Move selection
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.selectedIndex).toBe(0)

    // Change resetDeps - should reset to -1 (effect uses queueMicrotask)
    rerender({ query: 'mining' })

    await waitFor(() => {
      expect(result.current.selectedIndex).toBe(-1)
    })
  })

  it('does not handle keyboard events when disabled', async () => {
    const onNavigate = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onNavigate,
        enabled: false,
      })
    )
    await flushMicrotasks()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })

    expect(result.current.selectedIndex).toBe(-1)
  })

  it('does not handle keyboard events when items array is empty', async () => {
    const onNavigate = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: [],
        onNavigate,
      })
    )
    await flushMicrotasks()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })

    expect(result.current.selectedIndex).toBe(-1)
  })

  it('allows navigation without focus when allowNavigationWithoutFocus is true', async () => {
    const onNavigate = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onNavigate,
        allowNavigationWithoutFocus: true,
      })
    )
    await flushMicrotasks()

    // Ensure no input is focused
    Object.defineProperty(document, 'activeElement', {
      value: document.body,
      writable: true,
      configurable: true,
    })

    // First ArrowDown should go from -1 to 0
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.selectedIndex).toBe(0)

    // Second ArrowDown should go from 0 to 1
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.selectedIndex).toBe(1)
  })

  it('does not allow navigation without focus when allowNavigationWithoutFocus is false', async () => {
    const onNavigate = vi.fn()
    const inputRef = { current: document.createElement('input') }

    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        inputRef,
        onNavigate,
        allowNavigationWithoutFocus: false,
      })
    )
    await flushMicrotasks()

    // Ensure no input is focused
    Object.defineProperty(document, 'activeElement', {
      value: document.body,
      writable: true,
      configurable: true,
    })

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })

    expect(result.current.selectedIndex).toBe(-1)
  })

  it('does not navigate when typing in another input', async () => {
    const onNavigate = vi.fn()
    const inputRef = { current: document.createElement('input') }
    const otherInput = document.createElement('input')
    document.body.appendChild(otherInput)
    
    // Mock document.activeElement to return the other input (not our inputRef)
    Object.defineProperty(document, 'activeElement', {
      value: otherInput,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        inputRef,
        onNavigate,
        allowNavigationWithoutFocus: true,
      })
    )
    await flushMicrotasks()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })

    expect(result.current.selectedIndex).toBe(-1)

    document.body.removeChild(otherInput)
  })

  it('allows navigation when typing in the provided inputRef', async () => {
    const onNavigate = vi.fn()
    const input = document.createElement('input')
    document.body.appendChild(input)
    const inputRef = { current: input }
    
    Object.defineProperty(document, 'activeElement', {
      value: input,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        inputRef,
        onNavigate,
        allowNavigationWithoutFocus: true,
      })
    )
    await flushMicrotasks()

    // First ArrowDown should go from -1 to 0
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.selectedIndex).toBe(0)

    document.body.removeChild(input)
  })

  it('allows manual selection via setSelectedIndex', async () => {
    const onNavigate = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onNavigate,
      })
    )
    await flushMicrotasks()

    act(() => {
      result.current.setSelectedIndex(2)
    })

    expect(result.current.selectedIndex).toBe(2)
  })

  it('provides selectedItemRef for scrolling', async () => {
    const onNavigate = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onNavigate,
      })
    )
    await flushMicrotasks()

    expect(result.current.selectedItemRef).toBeDefined()
    expect(result.current.selectedItemRef.current).toBeNull()
  })

  it('cleans up event listener on unmount', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const onNavigate = vi.fn()

    const { unmount } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onNavigate,
      })
    )
    await flushMicrotasks()

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('prevents default behavior on arrow keys', async () => {
    const onNavigate = vi.fn()
    const input = document.createElement('input')
    const inputRef = { current: input }
    
    // Mock document.activeElement to return our input
    Object.defineProperty(document, 'activeElement', {
      value: input,
      writable: true,
      configurable: true,
    })

    renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        inputRef,
        onNavigate,
      })
    )
    await flushMicrotasks()

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    act(() => {
      window.dispatchEvent(event)
    })

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('prevents default behavior on Enter key when input is focused and item is selected', async () => {
    const onNavigate = vi.fn()
    const input = document.createElement('input')
    const inputRef = { current: input }
    
    // Mock document.activeElement to return our input
    Object.defineProperty(document, 'activeElement', {
      value: input,
      writable: true,
      configurable: true,
    })

    renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        inputRef,
        onNavigate,
      })
    )
    await flushMicrotasks()

    // First select an item
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })

    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    act(() => {
      window.dispatchEvent(event)
    })

    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})
