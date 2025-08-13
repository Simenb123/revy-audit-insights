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

  // Group layouts by section while preserving first-seen order
  type SectionGroup = { id: string; title: string; layouts: WidgetLayout[] };
  const sectionOrder: string[] = [];
  const sectionMap = new Map<string, SectionGroup>();
  const getSectionTitle = (id: string) => (id === 'none' ? 'Uten seksjon' : `Seksjon ${id.substring(0, 6)}`);

  for (const l of layouts) {
    const sid = l.sectionId || 'none';
    if (!sectionMap.has(sid)) {
      sectionMap.set(sid, { id: sid, title: getSectionTitle(sid), layouts: [] });
      sectionOrder.push(sid);
    }
    sectionMap.get(sid)!.layouts.push(l);
  }

  let isFirstPage = true;
  for (const sid of sectionOrder) {
    const section = sectionMap.get(sid)!;

    // Section cover page
    if (!isFirstPage) doc.addPage();
    isFirstPage = false;
    doc.setFillColor(bgColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setTextColor(textColor);
    doc.setFontSize(16);
    doc.text(section.title, 40, 40);

    // Render each widget in the section on its own page
    for (let i = 0; i < section.layouts.length; i++) {
      const layout = section.layouts[i];
      const widget = widgets.find(w => w.id === layout.widgetId || w.id === layout.i);
      if (!widget) continue;

      doc.addPage();
      doc.setFillColor(bgColor);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      doc.setTextColor(textColor);
      doc.setFontSize(12);
      doc.text(widget.title || layout.i, 40, 30);

      try {
        const canvas = await captureWidget(widget.id || layout.i);
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 80;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addImage(imgData, 'PNG', 40, 40, imgWidth, Math.min(imgHeight, pageHeight - 80));
      } catch (e) {
        // If capture fails, still leave the title as a placeholder
        doc.setTextColor(textColor);
        doc.text('(Kunne ikke fange widget-innhold)', 40, 60);
      }
    }
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

  // Group layouts by section while preserving order
  type SectionGroup = { id: string; title: string; layouts: WidgetLayout[] };
  const sectionOrder: string[] = [];
  const sectionMap = new Map<string, SectionGroup>();
  const getSectionTitle = (id: string) => (id === 'none' ? 'Uten seksjon' : `Seksjon ${id.substring(0, 6)}`);

  for (const l of layouts) {
    const sid = l.sectionId || 'none';
    if (!sectionMap.has(sid)) {
      sectionMap.set(sid, { id: sid, title: getSectionTitle(sid), layouts: [] });
      sectionOrder.push(sid);
    }
    sectionMap.get(sid)!.layouts.push(l);
  }

  for (const sid of sectionOrder) {
    const section = sectionMap.get(sid)!;
    const rows: any[][] = [];

    // Section heading
    rows.push([section.title]);
    rows.push([]);

    for (const layout of section.layouts) {
      const widget = widgets.find(w => w.id === layout.widgetId || w.id === layout.i);
      if (!widget) continue;
      if (widget.type !== 'table' && widget.type !== 'chart') continue;

      const data = await fetchWidgetData(widget);
      if (!data || data.length === 0) continue;

      // Widget title row
      rows.push([widget.title || layout.i]);

      // Convert JSON rows to AOA
      const headers = Object.keys(data[0]);
      rows.push(headers);
      for (const r of data) {
        rows.push(headers.map(h => (r as any)[h]));
      }
      rows.push([]); // Blank spacer
    }

    const sheet = XLSX.utils.aoa_to_sheet(rows.length > 0 ? rows : [[section.title]]);
    const safeName = (section.title || 'Seksjon').substring(0, 31) || 'Seksjon';
    XLSX.utils.book_append_sheet(workbook, sheet, safeName);
  }

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fileName = `report-${Date.now()}.xlsx`;
  const url = await uploadFile(blob, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  if (url) window.open(url, '_blank');
}

