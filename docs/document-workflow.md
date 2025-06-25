# Document Analysis Workflow

This workflow explains how uploaded files are processed and enriched with AI-generated data.

## 1. Upload to `client-documents` storage
- Users upload documents through the UI or API.
- Files are stored in the `client-documents` bucket and a record is created in the `client_documents_files` table.

## 2. Extract text with `pdf-text-extractor`
- The `pdf-text-extractor` edge function is invoked with the document ID.
- It downloads the file from storage and attempts to read text (PDF, text, Excel, etc.).
- The extracted text and `text_extraction_status` are saved back to `client_documents_files`.

## 3. Analyze and categorize
- After extraction completes, the `document-ai-analyzer` function generates an AI summary and updates `ai_analysis_summary`.
- The `document-ai-categorizer` function suggests a category and confidence score, updating the document record accordingly.

These steps allow uploaded documents to be searchable and organized for further audit work.
