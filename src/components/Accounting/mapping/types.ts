export interface StandardAccountOption {
  id: string;
  standard_number: string;
  standard_name: string;
}

export interface MappingComboboxLabels {
  searchPlaceholder?: string;
  noResults?: string;
  clearSelection?: string;
  listAriaLabel?: string;
  selectedAnnouncement?: (opt: { number: string; name: string }) => string;
  clearedAnnouncement?: string;
  resultsCountAnnouncement?: (count: number, query: string) => string;
  availableCountAnnouncement?: (count: number) => string;
  loadingText?: string;
  clearSearch?: string;
}
