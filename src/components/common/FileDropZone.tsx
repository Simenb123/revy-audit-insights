import React from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: DropzoneOptions['accept'];
  className?: string;
  children: React.ReactNode | ((isDragActive: boolean) => React.ReactNode);
}

/**
 * Drag-and-drop wrapper for selecting files.
 *
 * @param {FileDropZoneProps} props - Component properties.
 * @param {(files: File[]) => void} props.onFilesSelected - Callback invoked when files are chosen.
 * @param {DropzoneOptions['accept']} [props.accept] - Allowed MIME types for uploads.
 * @param {string} [props.className] - Optional additional CSS classes.
 * @param {React.ReactNode | ((isDragActive: boolean) => React.ReactNode)} props.children - Render prop or node shown inside the drop zone.
 * @returns {JSX.Element} Styled container that handles file selection.
 */
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
