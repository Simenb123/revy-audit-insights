import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Settings2, Bookmark, Plus, RotateCcw, Pencil, Trash, GripHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ColumnManager, { ColumnState as CMState } from '@/components/ui/column-manager';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
export interface DataTableColumn<T = any> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => any);
  sortable?: boolean;
  searchable?: boolean;
  format?: (value: any, row: T) => string | React.ReactNode;
  sortAccessor?: (row: T) => any;
  align?: 'left' | 'right' | 'center';
  className?: string;
  required?: boolean;
}

export interface DataTableProps<T = any> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  data: T[];
  columns: DataTableColumn<T>[];
  isLoading?: boolean;
  error?: Error | null;
  searchPlaceholder?: string;
  enableExport?: boolean;
  exportFileName?: string;
  enablePagination?: boolean;
  pageSize?: number;
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  showTotals?: boolean;
  totalRow?: React.ReactNode;
  emptyMessage?: string;
  // New optional features
  enableColumnManager?: boolean;
  preferencesKey?: string;
  defaultColumnState?: { key: string; visible: boolean; pinnedLeft?: boolean }[];
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string | undefined;
  wrapInCard?: boolean; // default true
  showSearch?: boolean; // default true
  stickyHeader?: boolean; // make header stick to top while scrolling
  maxBodyHeight?: string | number; // e.g., '70vh' or 480
}

const DataTable = <T extends Record<string, any>>({
  title,
  description,
  icon,
  data,
  columns,
  isLoading = false,
  error = null,
  searchPlaceholder = 'Søk...',
  enableExport = true,
  exportFileName = 'data',
  enablePagination = false,
  pageSize = 100,
  totalCount = 0,
  currentPage = 1,
  onPageChange,
  showTotals = false,
  totalRow,
  emptyMessage = 'Ingen data funnet',
  enableColumnManager = false,
  preferencesKey,
  defaultColumnState,
  onRowClick,
  getRowClassName,
  wrapInCard = true,
  showSearch = true,
  stickyHeader = true,
  maxBodyHeight,
}: DataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Synchronized horizontal scrollbar (top) and body scroll container
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const bodyScrollRef = useRef<HTMLDivElement | null>(null);
  const [topScrollWidth, setTopScrollWidth] = useState(0);

  useEffect(() => {
    const body = bodyScrollRef.current;
    const top = topScrollRef.current;
    if (!body || !top) return;

    const syncFromBody = () => {
      if (top) top.scrollLeft = body.scrollLeft;
    };
    const syncFromTop = () => {
      if (body) body.scrollLeft = top.scrollLeft;
    };

    body.addEventListener('scroll', syncFromBody, { passive: true });
    top.addEventListener('scroll', syncFromTop, { passive: true });

    const measure = () => {
      setTopScrollWidth(body.scrollWidth);
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(body);
    window.addEventListener('resize', measure);

    return () => {
      body.removeEventListener('scroll', syncFromBody);
      top.removeEventListener('scroll', syncFromTop);
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  // Derive initial column state
  const initialCMState: CMState[] = useMemo(() => {
    const mapDefaults = new Map<string, { visible: boolean; pinnedLeft?: boolean }>();
    defaultColumnState?.forEach((c) => mapDefaults.set(c.key, { visible: c.visible, pinnedLeft: c.pinnedLeft }));
    return columns.map((c) => ({
      key: c.key,
      label: c.header,
      visible: mapDefaults.get(c.key)?.visible ?? true,
      required: c.required,
      pinnedLeft: mapDefaults.get(c.key)?.pinnedLeft ?? false,
    }));
  }, [columns, defaultColumnState]);

  const [cmState, setCmState] = useLocalStorage<CMState[]>(preferencesKey, initialCMState);

  // Normalize/sanitize column state to prevent invalid entries
  const safeCmState: CMState[] = useMemo(() => {
    const colsMap = new Map(columns.map((c) => [c.key, c]));
    const base = Array.isArray(cmState) ? (cmState as any[]).filter(Boolean) : [];
    const filtered: CMState[] = base
      .filter((s: any) => s && typeof s.key === 'string' && colsMap.has(s.key))
      .map((s: any) => {
        const def = colsMap.get(s.key)!;
        return {
          key: s.key,
          label: def.header,
          visible: s.visible !== false,
          required: def.required,
          pinnedLeft: s.pinnedLeft ?? false,
        } as CMState;
      });
    // ensure all current columns exist in state
    columns.forEach((c) => {
      if (!filtered.some((s) => s.key === c.key)) {
        filtered.push({
          key: c.key,
          label: c.header,
          visible: true,
          required: c.required,
          pinnedLeft: false,
        });
      }
    });
    return filtered;
  }, [cmState, columns]);

  type TableView = {
    id: string;
    name: string;
    columns: CMState[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    searchTerm?: string;
  };

  const [views, setViews] = useLocalStorage<TableView[]>(preferencesKey ? `${preferencesKey}:views` : undefined, []);
  const [colWidths, setColWidths] = useLocalStorage<Record<string, number>>(preferencesKey ? `${preferencesKey}:widths` : undefined, {});

  const saveCurrentView = () => {
    const name = window.prompt('Navn på visning');
    if (!name) return;
    const id = Date.now().toString(36);
    const view: TableView = { id, name, columns: safeCmState, sortBy, sortOrder, searchTerm: showSearch ? searchTerm : undefined };
    setViews([...(views || []), view]);
  };

  const applyView = (view: TableView) => {
    setCmState(view.columns);
    if (view.sortBy) {
      setSortBy(view.sortBy);
      setSortOrder(view.sortOrder || 'asc');
    }
    if (showSearch && typeof view.searchTerm === 'string') {
      setSearchTerm(view.searchTerm);
    }
  };

  const renameView = (id: string) => {
    const current = (views || []).find((v) => v.id === id);
    if (!current) return;
    const name = window.prompt('Nytt navn på visning', current.name);
    if (!name) return;
    setViews((views || []).map((v) => (v.id === id ? { ...v, name } : v)));
  };

  const deleteView = (id: string) => {
    const current = (views || []).find((v) => v.id === id);
    if (!current) return;
    if (!window.confirm(`Slette visning "${current.name}"?`)) return;
    setViews((views || []).filter((v) => v.id !== id));
  };

  const resetColWidths = () => {
    setColWidths({});
  };

  const ViewsDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Bookmark className="h-4 w-4 mr-2" />
          Visninger
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={saveCurrentView}>
          <Plus className="h-4 w-4 mr-2" />
          Lagre ny visning
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {views && views.length > 0 ? (
          views.map((v) => (
            <DropdownMenuSub key={v.id}>
              <DropdownMenuSubTrigger>{v.name}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => applyView(v)}>
                  <Settings2 className="h-4 w-4 mr-2" />
                  Bruk visning
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => renameView(v.id)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Gi nytt navn
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => deleteView(v.id)}>
                  <Trash className="h-4 w-4 mr-2" />
                  Slett
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))
        ) : (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">Ingen lagrede visninger</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const effectiveColumns = useMemo(() => {
    // order by column manager state; fallback to columns order
    const orderMap = new Map(safeCmState.map((c, i) => [c.key, i] as const));
    const withMeta = columns.map((c) => ({
      def: c,
      st: safeCmState.find((s) => s.key === c.key) || { key: c.key, label: c.header, visible: true, pinnedLeft: false },
      order: orderMap.has(c.key) ? (orderMap.get(c.key) as number) : Number.MAX_SAFE_INTEGER,
    }));
    withMeta.sort((a, b) => a.order - b.order);
    const pinnedLeftKey = withMeta.find((x) => x.st.pinnedLeft)?.def.key;
    return {
      pinnedLeftKey: pinnedLeftKey || null,
      list: withMeta.filter((x) => x.st.visible !== false),
    };
  }, [columns, safeCmState]);

  const filteredAndSortedData = useMemo(() => {
    if (!data) return [];

    // Filter first
    let filtered = data;
    if (searchTerm && showSearch) {
      const searchableColumns = columns.filter((col) => col.searchable !== false);
      filtered = data.filter((item) => {
        return searchableColumns.some((column) => {
          const v = typeof column.accessor === 'function' ? column.accessor(item) : item[column.accessor as keyof T];
          return String(v ?? '').toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }

    // Then sort
    if (sortBy) {
      const column = columns.find((col) => col.key === sortBy);
      if (column) {
        filtered = [...filtered].sort((a, b) => {
          const getVal = (row: T) =>
            column.sortAccessor ? column.sortAccessor(row) : typeof column.accessor === 'function' ? column.accessor(row) : (row[column.accessor as keyof T] as any);
          const aValue = getVal(a);
          const bValue = getVal(b);

          let aCompare: any = aValue;
          let bCompare: any = bValue;

          if (aValue instanceof Date || (typeof aValue === 'string' && !isNaN(Date.parse(aValue)))) {
            aCompare = new Date(aValue as any).getTime();
            bCompare = new Date(bValue as any).getTime();
          } else if (typeof aValue === 'number' || !isNaN(Number(aValue))) {
            aCompare = Number(aValue) || 0;
            bCompare = Number(bValue) || 0;
          } else if (typeof aValue === 'string') {
            aCompare = aValue.toLowerCase();
            bCompare = String(bValue ?? '').toLowerCase();
          }

          if (sortOrder === 'asc') {
            return aCompare < bCompare ? -1 : aCompare > bCompare ? 1 : 0;
          } else {
            return aCompare > bCompare ? -1 : aCompare < bCompare ? 1 : 0;
          }
        });
      }
    }

    return filtered;
  }, [data, searchTerm, sortBy, sortOrder, columns, showSearch]);

  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return null;

    if (sortBy !== columnKey) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleExport = async () => {
    if (!data || data.length === 0) return;

    const exportColumns = effectiveColumns.list.map((c) => c.def).filter((col) => col.key !== 'actions');
    const XLSX = await import('xlsx');

    const excelData = data.map((item) => {
      const row: Record<string, any> = {};
      exportColumns.forEach((column) => {
        const value = typeof column.accessor === 'function' ? column.accessor(item) : (item[column.accessor as keyof T] as any);
        let cleanValue = value;
        if (typeof value === 'string' && value.includes('kr ')) {
          cleanValue = parseFloat(value.replace(/[^\d,-]/g, '').replace(',', '.'));
        }
        row[column.header] = cleanValue;
      });
      return row;
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${exportFileName}_${new Date().getFullYear()}.xlsx`);
  };

  const totalPages = enablePagination ? Math.ceil(totalCount / pageSize) : 1;
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const onResizeStart = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const th = (e.currentTarget as HTMLElement).closest('th') as HTMLElement | null;
    const startWidth = th?.offsetWidth || colWidths[key] || 160;
    resizingRef.current = { key, startX: e.clientX, startWidth };
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = ev.clientX - resizingRef.current.startX;
      const next = Math.max(80, Math.min(600, Math.round(resizingRef.current.startWidth + delta)));
      setColWidths({ ...(colWidths || {}), [resizingRef.current.key]: next });
    };
    const onUp = () => {
      resizingRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const getColStyle = (key: string): React.CSSProperties => {
    const w = colWidths?.[key];
    return w ? { width: w, minWidth: w, maxWidth: 1000 } : {};
  };

const colSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

const onColDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  const visibleKeys = effectiveColumns.list.map(({ def }) => def.key);
  const oldIndex = visibleKeys.indexOf(String(active.id));
  const newIndex = visibleKeys.indexOf(String(over.id));
  if (oldIndex < 0 || newIndex < 0) return;
  const visItems = safeCmState.filter((c) => visibleKeys.includes(c.key));
  const hiddenSet = new Set(safeCmState.filter((c) => !visibleKeys.includes(c.key)).map((c) => c.key));
  const movedVis = arrayMove(visItems, oldIndex, newIndex);
  let v = 0;
  const next = safeCmState.map((c) => (hiddenSet.has(c.key) ? c : movedVis[v++]));
  setCmState(next);
};

const SortableHeader: React.FC<{ def: DataTableColumn<T>; pinned: boolean; sticky: boolean }> = ({ def, pinned, sticky }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: def.key });
  const baseStyle = getColStyle(def.key);
  const style: React.CSSProperties = {
    ...baseStyle,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : undefined,
  };
  return (
    <TableHead
      ref={setNodeRef as any}
      className={`${def.sortable !== false ? 'cursor-pointer hover:bg-muted/50 select-none' : ''} ${def.align === 'right' ? 'text-right' : def.align === 'center' ? 'text-center' : ''} ${def.className || ''} ${pinned ? 'sticky left-0 z-40 bg-background' : ''} relative`}
      style={style}
      onClick={() => def.sortable !== false && handleSort(def.key)}
      {...attributes}
    >
      <div
        className={`flex items-center gap-2 ${
          def.align === 'right' ? 'justify-end' : def.align === 'center' ? 'justify-center' : ''
        }`}
      >
        <button
          className="h-4 w-4 grid place-items-center rounded cursor-grab active:cursor-grabbing"
          aria-label="Dra for å flytte kolonne"
          onClick={(e) => e.stopPropagation()}
          {...listeners}
        >
          <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <span>{def.header}</span>
        {getSortIcon(def.key)}
      </div>
      <span
        role="separator"
        aria-label="Endre kolonnebredde"
        title="Dra for å endre bredde"
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-border"
        onMouseDown={(e) => onResizeStart(def.key, e)}
        onClick={(e) => e.stopPropagation()}
      />
    </TableHead>
  );
};

const TableBlock = (
    <div className="space-y-4">
      <div className="rounded-md border">
        {showSearch && (
          <div className="flex items-center gap-2 p-3 border-b">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        )}
        {/* Synchronized top horizontal scrollbar (visible when table has vertical scroll) */}
        {maxBodyHeight && (
          <div
            ref={topScrollRef}
            className="overflow-x-auto h-3"
            aria-hidden="true"
          >
            <div style={{ width: topScrollWidth, height: 1 }} />
          </div>
        )}
        <div
          ref={bodyScrollRef}
          className={`${maxBodyHeight ? 'relative overflow-auto' : 'overflow-x-auto'}`}
          style={maxBodyHeight ? { maxHeight: typeof maxBodyHeight === 'number' ? `${maxBodyHeight}px` : maxBodyHeight } : undefined}
        >
          <Table noWrapper>
            <TableHeader className={stickyHeader ? 'sticky top-0 z-30 bg-background' : undefined}>
              <DndContext sensors={colSensors} collisionDetection={closestCenter} onDragEnd={onColDragEnd}>
                <SortableContext items={effectiveColumns.list.map(({ def }) => def.key)} strategy={horizontalListSortingStrategy}>
                  <TableRow>
                    {effectiveColumns.list.map(({ def }) => (
                      <SortableHeader key={def.key} def={def} pinned={effectiveColumns.pinnedLeftKey === def.key} sticky={stickyHeader} />
                    ))}
                  </TableRow>
                </SortableContext>
              </DndContext>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.length === 0 ? (
                <>
                  <TableRow>
                    <TableCell colSpan={effectiveColumns.list.length} className="text-center text-muted-foreground">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                  {showTotals && totalRow && totalRow}
                </>
              ) : (
                <>
                  {filteredAndSortedData.map((item, index) => (
                    <TableRow
                      key={(item as any).id ?? index}
                      className={`${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''} ${
                        getRowClassName?.(item) || ''
                      }`}
                      onClick={() => onRowClick?.(item)}
                    >
                      {effectiveColumns.list.map(({ def }) => {
                        const value =
                          typeof def.accessor === 'function'
                            ? def.accessor(item)
                            : (item[def.accessor as keyof T] as any);
                        const formatted = def.format ? def.format(value, item) : value;
                        return (
                          <TableCell
                            key={def.key}
                            className={`${
                              def.align === 'right' ? 'text-right' : def.align === 'center' ? 'text-center' : ''
                            } ${def.className || ''} ${
                              effectiveColumns.pinnedLeftKey === def.key ? 'sticky left-0 z-10 bg-background' : ''
                            }`}
                            style={getColStyle(def.key)}
                          >
                            {formatted}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  {showTotals && totalRow && totalRow}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {searchTerm
            ? `Viser ${filteredAndSortedData.length} filtrerte av ${data?.length || 0} poster`
            : enablePagination
            ? `Side ${currentPage} av ${totalPages}`
            : `${data?.length || 0} poster totalt`}
        </div>

        {enablePagination && !searchTerm && totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
              Forrige
            </Button>
            <span className="text-sm text-muted-foreground px-2">Side {currentPage} av {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
              disabled={!hasNextPage}
            >
              Neste
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Feil ved lasting av data: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!wrapInCard) {
    return (
      <div>
        {/* header toolbar for non-card mode */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {showSearch && (
              <>
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {preferencesKey && <ViewsDropdown />}
            {enableColumnManager && (
              <ColumnManager columns={safeCmState} onChange={setCmState} allowPinLeft title="Tilpass kolonner" triggerLabel="Kolonner" />
            )}
            {preferencesKey && (
              <Button variant="outline" size="sm" onClick={resetColWidths} title="Tilbakestill kolonnebredder">
                <RotateCcw className="h-4 w-4 mr-2" />
                Tilbakestill bredder
              </Button>
            )}
            {enableExport && (
              <Button variant="outline" size="sm" onClick={handleExport} disabled={!data || data.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Eksporter
              </Button>
            )}
          </div>
        </div>
        {TableBlock}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            {enablePagination && totalCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Viser {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} av {totalCount} poster
                {totalPages > 1 && ` • Side ${currentPage} av ${totalPages}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {preferencesKey && <ViewsDropdown />}
            {enableColumnManager && (
              <ColumnManager columns={safeCmState} onChange={setCmState} allowPinLeft title="Tilpass kolonner" triggerLabel="Kolonner" />
            )}
            {preferencesKey && (
              <Button variant="outline" size="sm" onClick={resetColWidths} title="Tilbakestill kolonnebredder">
                <RotateCcw className="h-4 w-4 mr-2" />
                Tilbakestill bredder
              </Button>
            )}
            {enableExport && (
              <Button variant="outline" size="sm" onClick={handleExport} disabled={!data || data.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Eksporter
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {TableBlock}
      </CardContent>
    </Card>
  );
};

export default DataTable;
