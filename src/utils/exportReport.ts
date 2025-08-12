import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import type { Widget, WidgetLayout } from '@/contexts/WidgetManagerContext';

function getTheme(): 'light' | 'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function exportReportToPDF(widgets: Widget[], layouts: WidgetLayout[]): void {
  const theme = getTheme();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const bgColor = theme === 'dark' ? '#000000' : '#ffffff';

  layouts.forEach((layout, idx) => {
    if (idx > 0) {
      doc.addPage();
    }
    doc.setFillColor(bgColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setTextColor(textColor);

    const widget = widgets.find(w => w.id === layout.widgetId || w.id === layout.i);
    doc.text(`Widget: ${widget?.title ?? layout.i}`, 40, 40);
  });

  doc.save('report.pdf');
}

export function exportReportToExcel(widgets: Widget[], layouts: WidgetLayout[]): void {
  const theme = getTheme();
  const rows = layouts.map((layout, index) => {
    const widget = widgets.find(w => w.id === layout.widgetId || w.id === layout.i);
    return {
      page: index + 1,
      widget: widget?.title ?? layout.i,
      x: layout.x,
      y: layout.y,
      w: layout.w,
      h: layout.h,
      theme,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, 'report.xlsx');
}
