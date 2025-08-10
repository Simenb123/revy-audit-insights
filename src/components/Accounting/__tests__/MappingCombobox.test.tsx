/* @vitest-environment jsdom */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, expect, it, describe, beforeEach } from 'vitest';
import MappingCombobox from '../MappingCombobox';

// Minimal ResizeObserver polyfill for JSDOM
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-ignore
global.ResizeObserver = ResizeObserver;

function createOptions(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    standard_number: `${1000 + i}`,
    standard_name: `Konto ${i + 1}`,
  }));
}

describe('MappingCombobox', () => {
  const options = [
    { id: '1', standard_number: '1000', standard_name: 'Salg' },
    { id: '2', standard_number: '2000', standard_name: 'Kostnad' },
    { id: '3', standard_number: '3000', standard_name: 'Diverse' },
  ];

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('opens popover and exposes ARIA correctly', async () => {
    render(
      <MappingCombobox value={undefined} onChange={() => {}} options={options} />
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeTruthy();
    expect(combobox.getAttribute('aria-controls')).toBeTruthy();

    const listId = combobox.getAttribute('aria-controls')!;
    const listbox = screen.getByRole('listbox');
    expect(listbox.id).toBe(listId);
    expect(combobox.getAttribute('aria-expanded')).toBe('true');
  });

  it('filters options based on input value', async () => {
    render(
      <MappingCombobox value={undefined} onChange={() => {}} options={options} />
    );

    await userEvent.click(screen.getByRole('button'));
    const combobox = screen.getByRole('combobox');
    await userEvent.type(combobox, 'salg');

    // Should see "Salg" and not "Kostnad"
    expect(screen.getByRole('option', { name: /1000.*Salg/i })).toBeTruthy();
    expect(screen.queryByRole('option', { name: /2000.*Kostnad/i })).toBeNull();
  });

  it('supports keyboard navigation and selection', async () => {
    const onChange = vi.fn();
    render(<MappingCombobox value={undefined} onChange={onChange} options={options} />);

    await userEvent.click(screen.getByRole('button'));
    const combobox = screen.getByRole('combobox');
    await userEvent.type(combobox, '2000');

    // Move to first result and select
    await userEvent.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('2000');
  });

  it('virtualizes large lists (renders fewer DOM items than total)', async () => {
    const bigOptions = createOptions(200);
    render(<MappingCombobox value={undefined} onChange={() => {}} options={bigOptions} />);

    await userEvent.click(screen.getByRole('button'));

    const listbox = screen.getByRole('listbox');
    // Only virtualized subset should be in DOM
    const optionEls = within(listbox).queryAllByRole('option');
    expect(optionEls.length).toBeGreaterThan(0);
    expect(optionEls.length).toBeLessThan(bigOptions.length);
  });
  it('shows loading state and ARIA when loading is true', async () => {
    const { rerender } = render(
      <MappingCombobox value={undefined} onChange={() => {}} options={options} loading={false} />
    );

    // Open the popover first
    await userEvent.click(screen.getByRole('button'));

    // Toggle loading on
    rerender(
      <MappingCombobox value={undefined} onChange={() => {}} options={options} loading={true} />
    );

    // Trigger should be disabled and busy
    const trigger = screen.getByRole('button');
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute('aria-busy', 'true');

    // Listbox reflects loading state and shows a polite status
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-busy', 'true');
    expect(within(listbox).getByRole('status')).toBeTruthy();
    expect(screen.getByText(/Laster\.\.\./i)).toBeTruthy();
  });
  it('supports fuzzy search when enabled', async () => {
    const fuzzyOptions = [
      { id: '1', standard_number: '1920', standard_name: 'Bankinnskudd' },
      { id: '2', standard_number: '2400', standard_name: 'Leverandørgjeld' },
      { id: '3', standard_number: '1500', standard_name: 'Kundefordringer' },
    ];
    render(<MappingCombobox value={undefined} onChange={() => {}} options={fuzzyOptions} fuzzy />);

    await userEvent.click(screen.getByRole('button'));
    const combobox = screen.getByRole('combobox');
    await userEvent.type(combobox, 'bnk');

    const opt = screen.getByRole('option', { name: /1920.*Bankinnskudd/i });
    expect(opt).toBeTruthy();
    expect(opt.querySelectorAll('mark').length).toBeGreaterThan(0);
  });

  it('limits results when maxResults is set and announces the count', async () => {
    const manyOptions = [
      { id: '1', standard_number: '1920', standard_name: 'Bankinnskudd' },
      { id: '2', standard_number: '1921', standard_name: 'Bank driftskonto' },
      { id: '3', standard_number: '1922', standard_name: 'Bank skattetrekkskonto' },
      { id: '4', standard_number: '1923', standard_name: 'Valutakonto' },
      { id: '5', standard_number: '1924', standard_name: 'Sparekonto' },
      { id: '6', standard_number: '1925', standard_name: 'Andre bankinnskudd' },
      { id: '7', standard_number: '1926', standard_name: 'Bankinnskudd prosjekt' },
    ];

    const labels = {
      resultsCountAnnouncement: (count: number) => `${count}`,
    } as any;

    render(
      <MappingCombobox
        value={undefined}
        onChange={() => {}}
        options={manyOptions}
        fuzzy
        maxResults={3}
        labels={labels}
      />
    );

    await userEvent.click(screen.getByRole('button'));
    const combobox = screen.getByRole('combobox');
    await userEvent.type(combobox, 'bank');

    const status = screen.getByRole('status');
    expect(status.textContent).toBe('3');
  });
});
