import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DenominationCalculator from '@/app/components/DenominationCalculator'

describe('DenominationCalculator', () => {
  it('renders input and select', () => {
    render(<DenominationCalculator />)

    expect(screen.getByLabelText('Amount to convert')).toBeInTheDocument()
    expect(screen.getByLabelText('Unit to convert from')).toBeInTheDocument()
  })

  it('shows placeholder when no value entered', () => {
    render(<DenominationCalculator />)

    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument()
  })

  it('converts BTC to other units', async () => {
    const user = userEvent.setup()
    render(<DenominationCalculator />)

    const input = screen.getByLabelText('Amount to convert')
    await user.type(input, '1')

    // Should show converted values (no placeholder-only state)
    // Check for the Satoshi result value (100,000,000 sats = 1 BTC)
    expect(screen.getByText('100,000,000')).toBeInTheDocument()
  })

  it('updates results when value changes', async () => {
    const user = userEvent.setup()
    render(<DenominationCalculator />)

    const input = screen.getByLabelText('Amount to convert')
    
    await user.type(input, '1')
    const firstResult = screen.getByText('100,000,000').textContent

    await user.clear(input)
    await user.type(input, '2')
    const secondResult = screen.getByText('200,000,000').textContent

    expect(firstResult).not.toBe(secondResult)
  })

  it('updates results when unit changes', async () => {
    const user = userEvent.setup()
    render(<DenominationCalculator />)

    const input = screen.getByLabelText('Amount to convert')
    const select = screen.getByLabelText('Unit to convert from')

    await user.type(input, '1000000')
    
    // Change from BTC to sat (the option value is 'sat', not 'sats')
    await user.selectOptions(select, 'sat')

    // Results should update - should show BTC in results (not in select options)
    // Look for the BTC result value which should be 0.01 (1,000,000 sats = 0.01 BTC)
    expect(screen.getByText('0.01')).toBeInTheDocument()
  })

  it('shows separator for current unit', async () => {
    const user = userEvent.setup()
    render(<DenominationCalculator />)

    const input = screen.getByLabelText('Amount to convert')
    await user.type(input, '1')

    // Should have separator (dotted border)
    const separator = document.querySelector('.border-dotted')
    expect(separator).toBeInTheDocument()
  })

  it('handles invalid input gracefully', async () => {
    const user = userEvent.setup()
    render(<DenominationCalculator />)

    const input = screen.getByLabelText('Amount to convert')
    await user.type(input, 'abc')

    // Invalid input: no conversion results shown
    expect(screen.queryByText('100,000,000')).not.toBeInTheDocument()
  })

  it('handles empty input', () => {
    render(<DenominationCalculator />)

    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument()
  })

  it('displays all unit options in select', () => {
    render(<DenominationCalculator />)

    const select = screen.getByLabelText('Unit to convert from')
    const options = Array.from(select.querySelectorAll('option'))

    expect(options.length).toBeGreaterThan(0)
    expect(options.some(opt => opt.textContent?.includes('BTC'))).toBe(true)
    expect(options.some(opt => opt.textContent?.includes('Satoshi'))).toBe(true)
  })
})
