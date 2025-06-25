import { useCallback } from 'react';

export const useDownload = (
  getUrl: (path: string) => Promise<string | null>
) => {
  return useCallback(
    async (filePath: string, fileName: string) => {
      const url = await getUrl(filePath);
      if (!url) return;
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
    },
    [getUrl]
  );
};
