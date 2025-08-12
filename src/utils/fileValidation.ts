const DEFAULT_MAX_FILE_SIZE = 5_000_000; // 5MB

export function validateFile(
  file: File,
  allowedExtensions: string[],
  maxFileSize = DEFAULT_MAX_FILE_SIZE
): void {
  if (file.size > maxFileSize) {
    throw new Error(
      `File too large. Maximum size is ${maxFileSize / 1_000_000}MB`
    );
  }

  const hasValidExtension = allowedExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidExtension) {
    throw new Error(
      `Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed`
    );
  }
}

export function validateXmlFile(
  file: File,
  maxFileSize = DEFAULT_MAX_FILE_SIZE
): void {
  validateFile(file, ['.xml'], maxFileSize);
}
