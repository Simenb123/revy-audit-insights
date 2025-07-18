import React, { useState, useEffect, useRef, useMemo } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ''
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, visibleRange]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return;

    const handleScrollEvent = () => {
      setScrollTop(scrollElement.scrollTop);
    };

    scrollElement.addEventListener('scroll', handleScrollEvent, { passive: true });
    return () => scrollElement.removeEventListener('scroll', handleScrollEvent);
  }, []);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              height: itemHeight,
              width: '100%',
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Optimized table row component
interface VirtualizedTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    header: string;
    width?: string;
    render?: (value: any, item: T) => React.ReactNode;
  }>;
  rowHeight?: number;
  maxHeight?: number;
  className?: string;
}

export function VirtualizedTable<T>({
  data,
  columns,
  rowHeight = 50,
  maxHeight = 400,
  className = ''
}: VirtualizedTableProps<T>) {
  const renderRow = (item: T, index: number) => (
    <div
      className="flex items-center border-b border-border hover:bg-muted/50 transition-colors"
      style={{ height: rowHeight }}
    >
      {columns.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="px-4 py-2 truncate"
          style={{ width: column.width || 'auto', flex: column.width ? undefined : 1 }}
        >
          {column.render 
            ? column.render(item[column.key], item)
            : String(item[column.key] || '')
          }
        </div>
      ))}
    </div>
  );

  return (
    <div className={`border rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex bg-muted/50 border-b border-border">
        {columns.map((column, index) => (
          <div
            key={index}
            className="px-4 py-3 font-medium truncate"
            style={{ width: column.width || 'auto', flex: column.width ? undefined : 1 }}
          >
            {column.header}
          </div>
        ))}
      </div>
      
      {/* Virtual list */}
      <VirtualizedList
        items={data}
        itemHeight={rowHeight}
        containerHeight={maxHeight}
        renderItem={renderRow}
        className="bg-background"
      />
    </div>
  );
}