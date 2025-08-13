import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import type { Widget, WidgetLayout } from '@/contexts/WidgetManagerContext';

function getTheme(): 'light' | 'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

async function captureWidget(widgetId: string): Promise<HTMLCanvasElement> {
  const element = document.querySelector(`[data-widget-id="${widgetId}"]`) as HTMLElement | null;
  if (!element) throw new Error(`Widget element not found: ${widgetId}`);
  return await html2canvas(element, { scale: 2, backgroundColor: null, useCORS: true });
}

async function uploadFile(blob: Blob, fileName: string, contentType: string): Promise<string | null> {
  const { error } = await supabase.storage
    .from('reports')
    .upload(fileName, blob, { contentType, upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from('reports').getPublicUrl(fileName);
  return data?.publicUrl ?? null;
}

export async function exportReportToPDF(widgets: Widget[], layouts: WidgetLayout[]): Promise<void> {
  const theme = getTheme();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const bgColor = theme === 'dark' ? '#000000' : '#ffffff';

  for (let idx = 0; idx < layouts.length; idx++) {
    const layout = layouts[idx];
    const widget = widgets.find(w => w.id === layout.widgetId || w.id === layout.i);
    const canvas = await captureWidget(widget?.id ?? layout.i);
    const imgData = canvas.toDataURL('image/png');

    if (idx > 0) doc.addPage();
    doc.setFillColor(bgColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setTextColor(textColor);
    doc.text(widget?.title ?? layout.i, 40, 30);

    const imgWidth = pageWidth - 80;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    doc.addImage(imgData, 'PNG', 40, 40, imgWidth, Math.min(imgHeight, pageHeight - 80));
  }

  const blob = doc.output('blob');
  const fileName = `report-${Date.now()}.pdf`;
  const url = await uploadFile(blob, fileName, 'application/pdf');
  if (url) window.open(url, '_blank');
}

async function fetchWidgetData(widget: Widget): Promise<any[]> {
  const clientId = widget.config?.clientId;
  const selectedVersion = widget.config?.selectedVersion;
  if (!clientId) return [];
  let query = supabase
    .from('trial_balances')
    .select('account_number, account_name, closing_balance')
    .eq('client_id', clientId);
  if (selectedVersion) {
    query = query.eq('version', selectedVersion);
  }
  const { data } = await query;
  return data ?? [];
}

export async function exportReportToExcel(widgets: Widget[], layouts: WidgetLayout[]): Promise<void> {
  const workbook = XLSX.utils.book_new();

  for (const widget of widgets) {
    if (widget.type === 'table' || widget.type === 'chart') {
      const data = await fetchWidgetData(widget);
      if (data.length > 0) {
        const sheet = XLSX.utils.json_to_sheet(data);
        const sheetName = widget.title.substring(0, 31) || 'Sheet';
        XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
      }
    }
  }

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fileName = `report-${Date.now()}.xlsx`;
  const url = await uploadFile(blob, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  if (url) window.open(url, '_blank');
}

