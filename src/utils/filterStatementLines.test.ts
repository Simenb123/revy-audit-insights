import { describe, it, expect } from 'vitest';
import { filterStatementLines, StatementNode } from './filterStatementLines';

describe('filterStatementLines - showOnlyUnmapped', () => {
  const getAccountsForLine = (num: string): string[] => {
    switch (num) {
      case '10':
        return ['4000', '4001']; // income root
      case '11':
        return ['4000']; // mapped income
      case '12':
        return ['4001']; // unmapped income
      case '20':
        return ['5000', '5001']; // balance root
      case '21':
        return ['5000']; // mapped balance
      case '22':
        return ['5001']; // unmapped balance
      default:
        return [];
    }
  };
  const unmappedSet = new Set(['4001', '5001']);
  const hasChange = () => true;
  const opts = {
    showOnlyChanges: false,
    hasChange,
    alwaysShowTopHeaders: false,
    showOnlyUnmapped: true,
    searchQuery: '',
    getAccountsForLine,
    unmappedSet,
  };

  it('filters income statement lines', () => {
    const nodes: StatementNode[] = [
      {
        standard_number: '10',
        standard_name: 'Income Root',
        children: [
          { standard_number: '11', standard_name: 'Mapped Income', children: [] },
          { standard_number: '12', standard_name: 'Unmapped Income', children: [] },
        ],
      },
    ];
    const result = filterStatementLines(nodes, opts);
    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].standard_number).toBe('12');
  });

  it('filters balance statement lines', () => {
    const nodes: StatementNode[] = [
      {
        standard_number: '20',
        standard_name: 'Balance Root',
        children: [
          { standard_number: '21', standard_name: 'Mapped Balance', children: [] },
          { standard_number: '22', standard_name: 'Unmapped Balance', children: [] },
        ],
      },
    ];
    const result = filterStatementLines(nodes, opts);
    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].standard_number).toBe('22');
  });
});
