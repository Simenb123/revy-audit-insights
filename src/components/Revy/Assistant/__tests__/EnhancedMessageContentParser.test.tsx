import { render, screen } from '@testing-library/react'
import EnhancedMessageContentParser from '../EnhancedMessageContentParser'
import { MemoryRouter } from 'react-router-dom'

describe('EnhancedMessageContentParser', () => {
  it('renders knowledge article references when metadata present', () => {
    const meta = [{ title: 'Test Article', slug: 'test-article', reference_code: 'ISA 315' }]
    const content = `Svar tekst\n<!-- KNOWLEDGE_ARTICLES: ${JSON.stringify(meta)} -->`
    render(
      <MemoryRouter>
        <EnhancedMessageContentParser content={content} />
      </MemoryRouter>
    )

    const link = screen.getByRole('link', { name: /Test Article/i })
    expect(link).toHaveAttribute('href', '/fag/artikkel/test-article')
    expect(screen.getByText('ISA 315')).toBeInTheDocument()
  })

  it('does not render references when metadata missing', () => {
    render(
      <MemoryRouter>
        <EnhancedMessageContentParser content="Hei" />
      </MemoryRouter>
    )
    expect(screen.queryByText('Refererte artikler')).not.toBeInTheDocument()
  })
})
