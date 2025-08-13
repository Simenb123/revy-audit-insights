export interface StatementNode {
  standard_number: string;
  standard_name?: string;
  children?: StatementNode[];
  [key: string]: any;
}

interface FilterOptions {
  showOnlyChanges: boolean;
  hasChange: (node: StatementNode) => boolean;
  alwaysShowTopHeaders: boolean;
  showOnlyUnmapped: boolean;
  searchQuery: string;
  getAccountsForLine: (standardNumber: string) => string[];
  unmappedSet: Set<string>;
}

export function filterStatementLines(nodes: StatementNode[], opts: FilterOptions): StatementNode[] {
  const q = (opts.searchQuery || '').trim().toLowerCase();
  const matchesSearch = (n: StatementNode) => {
    if (!q) return true;
    return (
      String(n.standard_name || '').toLowerCase().includes(q) ||
      String(n.standard_number || '').toLowerCase().includes(q)
    );
  };

  const hasUnmapped = (n: StatementNode): boolean => {
    const accs = opts.getAccountsForLine(String(n.standard_number));
    return accs.some((a) => opts.unmappedSet.has(a));
  };

  if (!opts.showOnlyChanges && !opts.showOnlyUnmapped && !q) return nodes;

  const recurse = (arr: StatementNode[], depth = 0): StatementNode[] =>
    arr
      .map((n) => ({
        ...n,
        children: n.children ? recurse(n.children, depth + 1) : [],
      }))
      .filter((n) => {
        const selfMatches =
          (!opts.showOnlyChanges || opts.hasChange(n)) &&
          (!opts.showOnlyUnmapped || hasUnmapped(n)) &&
          matchesSearch(n);
        const keep =
          selfMatches ||
          (n.children && n.children.length > 0) ||
          (opts.alwaysShowTopHeaders && depth === 0);
        return keep;
      });

  return recurse(nodes, 0);
}
