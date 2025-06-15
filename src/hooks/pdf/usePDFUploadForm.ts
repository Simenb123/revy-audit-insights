
import { useState } from 'react';
import { usePDFDocuments } from '@/hooks/usePDFDocuments';

export const usePDFUploadForm = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('isa');
  const [isaNumber, setIsaNumber] = useState('');
  const [nrsNumber, setNrsNumber] = useState('');

  const { uploadDocument } = usePDFDocuments();

  const resetForm = () => {
    setSelectedFiles([]);
    setTitle('');
    setDescription('');
    setIsaNumber('');
    setNrsNumber('');
    setCategory('isa');
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    setSelectedFiles(pdfFiles);
    
    if (pdfFiles.length === 1) {
      const fileName = pdfFiles[0].name;
      const isaMatch = fileName.match(/ISA\s*(\d+)/i);
      const nrsMatch = fileName.match(/NRS\s*([\d\w\s()]+?)(?=\s-|\.pdf|_)/i);

      if (isaMatch) {
        setIsaNumber(isaMatch[1]);
        setTitle(fileName.replace(/\.pdf$/i, ''));
        setCategory('isa');
      } else if (nrsMatch) {
        setNrsNumber(nrsMatch[1].trim());
        setTitle(fileName.replace(/\.pdf$/i, ''));
        setCategory('regnskapsstandarder');
      } else {
        setTitle(fileName.replace(/\.pdf$/i, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !title.trim()) return;

    for (const file of selectedFiles) {
      const isIsa = category === 'isa';
      const isNrs = category === 'regnskapsstandarder';

      await uploadDocument.mutateAsync({
        file,
        title: selectedFiles.length === 1 ? title : file.name.replace(/\.pdf$/i, ''),
        description,
        category,
        isaNumber: isIsa ? isaNumber : undefined,
        nrsNumber: isNrs ? nrsNumber : undefined,
        tags: isIsa ? ['ISA', `ISA ${isaNumber}`] : (isNrs ? ['NRS', `NRS ${nrsNumber}`] : undefined)
      });
    }

    resetForm();
  };

  return {
    selectedFiles,
    title,
    description,
    category,
    isaNumber,
    nrsNumber,
    uploadDocument,
    handleFileSelect,
    handleUpload,
    setTitle,
    setDescription,
    setCategory,
    setIsaNumber,
    setNrsNumber,
  };
};
