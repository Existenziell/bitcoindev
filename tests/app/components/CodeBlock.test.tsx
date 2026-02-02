import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CodeBlock, { MultiLanguageCodeBlock } from '@/app/components/CodeBlock'

const mockCopyToClipboard = vi.fn()
vi.mock('@/app/utils/copyToClipboard', () => ({
  default: (...args: unknown[]) => mockCopyToClipboard(...args),
}))

describe('CodeBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders copy button when rawCode is provided', () => {
    render(
      <CodeBlock language="rust" rawCode="fn main() {}">
        <span>fn main() {'{}'}</span>
      </CodeBlock>
    )

    const copyButton = screen.getByRole('button', { name: /Copy code/i })
    expect(copyButton).toBeInTheDocument()
  })

  it('does not render copy button when rawCode is not provided', () => {
    render(
      <CodeBlock language="rust">
        <span>fn main() {'{}'}</span>
      </CodeBlock>
    )

    expect(screen.queryByRole('button', { name: /Copy code/i })).not.toBeInTheDocument()
  })

  it('calls copyToClipboard with rawCode and "Code" when copy button is clicked', async () => {
    const user = userEvent.setup()
    const rawCode = 'fn main() { println!("hi"); }'

    render(
      <CodeBlock language="rust" rawCode={rawCode}>
        <span>highlighted</span>
      </CodeBlock>
    )

    const copyButton = screen.getByRole('button', { name: /Copy code/i })
    await user.click(copyButton)

    expect(mockCopyToClipboard).toHaveBeenCalledTimes(1)
    expect(mockCopyToClipboard).toHaveBeenCalledWith(rawCode, 'Code')
  })

  it('renders language label and code content', () => {
    render(
      <CodeBlock language="rust" rawCode="fn main() {}">
        <span>fn main() {'{}'}</span>
      </CodeBlock>
    )

    expect(screen.getByRole('group', { name: /Code block: Rust/i })).toBeInTheDocument()
    expect(screen.getByText('fn main() {}')).toBeInTheDocument()
  })
})

describe('MultiLanguageCodeBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders copy button', async () => {
    render(
      <MultiLanguageCodeBlock
        languages={[
          { lang: 'rust', code: 'fn main() {}' },
          { lang: 'cpp', code: 'int main() { return 0; }' },
        ]}
      />
    )

    const copyButton = await screen.findByRole('button', { name: /Copy code/i })
    expect(copyButton).toBeInTheDocument()
  })

  it('calls copyToClipboard with selected tab code and language label on click', async () => {
    const user = userEvent.setup()
    const rustCode = 'fn main() {}'
    const cppCode = 'int main() { return 0; }'

    render(
      <MultiLanguageCodeBlock
        languages={[
          { lang: 'rust', code: rustCode },
          { lang: 'cpp', code: cppCode },
        ]}
      />
    )

    const copyButton = await screen.findByRole('button', { name: /Copy code/i })
    await user.click(copyButton)

    expect(mockCopyToClipboard).toHaveBeenCalledTimes(1)
    expect(mockCopyToClipboard).toHaveBeenCalledWith(rustCode, 'Rust code')
  })

  it('copies the currently selected language after switching tab', async () => {
    const user = userEvent.setup()
    const rustCode = 'fn main() {}'
    const cppCode = 'int main() { return 0; }'

    render(
      <MultiLanguageCodeBlock
        languages={[
          { lang: 'rust', code: rustCode },
          { lang: 'cpp', code: cppCode },
        ]}
      />
    )

    const cppTab = await screen.findByRole('tab', { name: /C\+\+/i })
    await user.click(cppTab)

    const copyButton = screen.getByRole('button', { name: /Copy code/i })
    await user.click(copyButton)

    expect(mockCopyToClipboard).toHaveBeenCalledWith(cppCode, 'C++ code')
  })
})
