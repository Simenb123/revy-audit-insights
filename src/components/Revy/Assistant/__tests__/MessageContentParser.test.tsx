import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MessageContentParser } from '../MessageContentParser';

describe('MessageContentParser advanced mode', () => {
  it('renders knowledge article references when metadata is present', () => {
    const articles = [{ slug: 'test-article', title: 'Test Article', reference_code: 'REF-1' }];
    const content = `Svar...\n\n<!-- KNOWLEDGE_ARTICLES: ${JSON.stringify(articles)} -->`;
    render(
      <MemoryRouter>
        <MessageContentParser content={content} advanced />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: 'Test Article' });
    expect(link).toHaveAttribute('href', '/fag/artikkel/test-article');
    expect(screen.getByText('(REF-1)')).toBeInTheDocument();
  });

  it('does not render reference section when metadata is absent', () => {
    render(
      <MemoryRouter>
        <MessageContentParser content="Bare tekst" advanced />
      </MemoryRouter>
    );
    expect(screen.queryByText('Refererte artikler:')).not.toBeInTheDocument();
  });

  it('continues rendering when variant info is invalid', () => {
    const content = 'Svar...\n\n<!-- VARIANT_INFO: {invalid json} -->';
    render(
      <MemoryRouter>
        <MessageContentParser content={content} advanced />
      </MemoryRouter>
    );
    expect(screen.getByText('Svar...')).toBeInTheDocument();
    expect(screen.queryByText('•')).not.toBeInTheDocument();
  });
});
