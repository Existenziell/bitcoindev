import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  AppError,
  handleError,
  getUserFriendlyErrorMessage,
} from '@/app/utils/errorHandling'

describe('errorHandling', () => {
  describe('AppError', () => {
    it('sets message and name', () => {
      const err = new AppError('Something failed')
      expect(err.message).toBe('Something failed')
      expect(err.name).toBe('AppError')
    })

    it('accepts optional code and userMessage', () => {
      const err = new AppError('Internal', 'ERR_001', 'Please try again')
      expect(err.code).toBe('ERR_001')
      expect(err.userMessage).toBe('Please try again')
    })

    it('is an instance of Error', () => {
      const err = new AppError('Test')
      expect(err).toBeInstanceOf(Error)
      expect(err).toBeInstanceOf(AppError)
    })
  })

  describe('getUserFriendlyErrorMessage', () => {
    it('returns userMessage when error is AppError with userMessage', () => {
      const err = new AppError('Internal', undefined, 'Something went wrong. Try again.')
      expect(getUserFriendlyErrorMessage(err)).toBe('Something went wrong. Try again.')
    })

    it('returns error.message when error is AppError without userMessage', () => {
      const err = new AppError('Technical message')
      expect(getUserFriendlyErrorMessage(err)).toBe('Technical message')
    })

    it('returns message for generic Error', () => {
      expect(getUserFriendlyErrorMessage(new Error('Network error'))).toBe('Network error')
    })

    it('returns fallback for non-Error values', () => {
      expect(getUserFriendlyErrorMessage('string')).toBe('An unexpected error occurred')
      expect(getUserFriendlyErrorMessage(null)).toBe('An unexpected error occurred')
      expect(getUserFriendlyErrorMessage(42)).toBe('An unexpected error occurred')
    })
  })

  describe('handleError', () => {
    const originalEnv = process.env.NODE_ENV
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
      consoleSpy.mockClear()
    })

    it('logs error in development when context provided', () => {
      process.env.NODE_ENV = 'development'
      const err = new Error('Dev error')
      handleError(err, 'TestContext')
      expect(consoleSpy).toHaveBeenCalledWith('[TestContext]', err)
    })

    it('logs error in development without context', () => {
      process.env.NODE_ENV = 'development'
      const err = new Error('Dev error')
      handleError(err)
      expect(consoleSpy).toHaveBeenCalledWith(err)
    })

    it('does not throw', () => {
      process.env.NODE_ENV = 'production'
      expect(() => handleError(new Error('Any'))).not.toThrow()
    })
  })
})
