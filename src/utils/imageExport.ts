import html2canvas from 'html2canvas';

export interface ImageExportOptions {
  scale?: number;
  format?: 'png' | 'jpeg';
  quality?: number;
  backgroundColor?: string;
}

export async function exportWidgetAsImage(
  widgetId: string, 
  fileName?: string,
  options: ImageExportOptions = {}
): Promise<void> {
  const {
    scale = 2,
    format = 'png',
    quality = 0.95,
    backgroundColor = null
  } = options;

  const element = document.querySelector(`[data-widget-id="${widgetId}"]`) as HTMLElement | null;
  if (!element) {
    throw new Error(`Widget element not found: ${widgetId}`);
  }

  try {
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      useCORS: true,
      allowTaint: true,
      logging: false
    });

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mimeType, quality);
    
    // Create download link
    const link = document.createElement('a');
    link.download = fileName || `widget-${widgetId}-${Date.now()}.${format}`;
    link.href = dataUrl;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to export widget as image:', error);
    throw error;
  }
}

export async function exportFullReportAsImage(
  fileName?: string,
  options: ImageExportOptions = {}
): Promise<void> {
  const {
    scale = 1.5,
    format = 'png',
    quality = 0.95,
    backgroundColor = null
  } = options;

  const reportElement = document.querySelector('[data-report-container]') as HTMLElement | null;
  if (!reportElement) {
    throw new Error('Report container not found');
  }

  try {
    const canvas = await html2canvas(reportElement, {
      scale,
      backgroundColor,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: reportElement.scrollWidth,
      height: reportElement.scrollHeight
    });

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mimeType, quality);
    
    // Create download link
    const link = document.createElement('a');
    link.download = fileName || `rapport-${Date.now()}.${format}`;
    link.href = dataUrl;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to export full report as image:', error);
    throw error;
  }
}

export async function copyWidgetToClipboard(widgetId: string): Promise<void> {
  const element = document.querySelector(`[data-widget-id="${widgetId}"]`) as HTMLElement | null;
  if (!element) {
    throw new Error(`Widget element not found: ${widgetId}`);
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
      logging: false
    });

    canvas.toBlob(async (blob) => {
      if (blob && navigator.clipboard) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
        } catch (clipboardError) {
          console.error('Failed to copy to clipboard:', clipboardError);
          throw clipboardError;
        }
      }
    });
  } catch (error) {
    console.error('Failed to copy widget to clipboard:', error);
    throw error;
  }
}