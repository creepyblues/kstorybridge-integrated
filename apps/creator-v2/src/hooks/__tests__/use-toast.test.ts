import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useToast, toast } from '../use-toast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should initialize with empty toasts array', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toasts).toEqual([])
  })

  it('should add a toast when toast() is called', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Test Title',
        description: 'Test Description',
      })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Test Title',
      description: 'Test Description',
      open: true,
    })
  })

  it('should limit toasts to 1 at a time', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: 'Toast 1' })
      result.current.toast({ title: 'Toast 2' })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Toast 2')
  })

  it('should auto-dismiss toast after 5 seconds', async () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: 'Auto Dismiss Test' })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].open).toBe(true)

    // Fast-forward time by 100ms (user dismisses)
    act(() => {
      result.current.toasts[0].onOpenChange?.(false)
    })

    expect(result.current.toasts[0].open).toBe(false)

    // Fast-forward time by 5 seconds (auto-remove)
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(result.current.toasts).toHaveLength(0)
    })
  })

  it('should dismiss toast manually', () => {
    const { result } = renderHook(() => useToast())

    let toastId: string

    act(() => {
      const t = result.current.toast({ title: 'Manual Dismiss Test' })
      toastId = t.id
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.dismiss(toastId)
    })

    expect(result.current.toasts[0].open).toBe(false)
  })

  it('should update toast after creation', () => {
    const { result } = renderHook(() => useToast())

    let toastRef: ReturnType<typeof toast>

    act(() => {
      toastRef = result.current.toast({
        title: 'Original Title',
        description: 'Original Description',
      })
    })

    expect(result.current.toasts[0].title).toBe('Original Title')

    act(() => {
      toastRef.update({
        id: toastRef.id,
        title: 'Updated Title',
        description: 'Updated Description',
      })
    })

    expect(result.current.toasts[0].title).toBe('Updated Title')
    expect(result.current.toasts[0].description).toBe('Updated Description')
  })

  it('should handle variant prop', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Error Toast',
        variant: 'destructive',
      })
    })

    expect(result.current.toasts[0].variant).toBe('destructive')
  })

  it('should handle custom duration', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Custom Duration',
        duration: 10000,
      })
    })

    expect(result.current.toasts[0].duration).toBe(10000)
  })

  it('should generate unique IDs for each toast', () => {
    const { result } = renderHook(() => useToast())

    const ids: string[] = []

    act(() => {
      const t1 = result.current.toast({ title: 'Toast 1' })
      ids.push(t1.id)
    })

    act(() => {
      const t2 = result.current.toast({ title: 'Toast 2' })
      ids.push(t2.id)
    })

    expect(ids[0]).not.toBe(ids[1])
    expect(ids[0]).toBeTruthy()
    expect(ids[1]).toBeTruthy()
  })
})

describe('toast() standalone function', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return toast control object', () => {
    const toastControl = toast({ title: 'Standalone Toast' })

    expect(toastControl).toHaveProperty('id')
    expect(toastControl).toHaveProperty('dismiss')
    expect(toastControl).toHaveProperty('update')
    expect(typeof toastControl.dismiss).toBe('function')
    expect(typeof toastControl.update).toBe('function')
  })

  it('should allow dismissing via returned dismiss function', () => {
    const { result } = renderHook(() => useToast())

    let toastControl: ReturnType<typeof toast>

    act(() => {
      toastControl = toast({ title: 'Dismiss Test' })
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      toastControl.dismiss()
    })

    expect(result.current.toasts[0].open).toBe(false)
  })
})
