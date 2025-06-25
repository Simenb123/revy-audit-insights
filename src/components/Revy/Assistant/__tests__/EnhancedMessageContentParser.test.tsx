import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EnhancedMessageContentParser from '../EnhancedMessageContentParser';

describe('EnhancedMessageContentParser', () => {
  it('renders knowledge article references when metadata is present', () => {
    const articles = [{ slug: 'test-article', title: 'Test Article', reference_code: 'REF-1' }];
    const content = `Svar...\n\n<!-- KNOWLEDGE_ARTICLES: ${JSON.stringify(articles)} -->`;
    render(
      <MemoryRouter>
        <EnhancedMessageContentParser content={content} />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: 'Test Article' });
    expect(link).toHaveAttribute('href', '/fag/artikkel/test-article');
    expect(screen.getByText('(REF-1)')).toBeInTheDocument();
  });

  it('does not render reference section when metadata is absent', () => {
    render(
      <MemoryRouter>
        <EnhancedMessageContentParser content="Bare tekst" />
      </MemoryRouter>
    );
    expect(screen.queryByText('Refererte artikler:')).not.toBeInTheDocument();
  });
});
