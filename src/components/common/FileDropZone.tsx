import React from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: DropzoneOptions['accept'];
  className?: string;
  children: React.ReactNode | ((isDragActive: boolean) => React.ReactNode);
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  accept,
  className = '',
  children,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    onDrop: onFilesSelected,
  });

  const content = typeof children === 'function' ? children(isDragActive) : children;

  return (
    <div
      {...getRootProps()}
      className={
        `border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ` +
        `${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'} ` +
        className
      }
    >
      <input {...getInputProps()} />
      {content}
    </div>
  );
};

export default FileDropZone;
