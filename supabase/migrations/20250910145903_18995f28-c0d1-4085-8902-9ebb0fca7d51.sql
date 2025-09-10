-- Update imports bucket file size limit to 1GB to match global settings
UPDATE storage.buckets 
SET file_size_limit = 1073741824 
WHERE name = 'imports';