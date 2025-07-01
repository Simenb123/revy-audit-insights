# Knowledge Base and Articles

AI Revy includes a built in knowledge base for storing legislation, standards and internal guidance. This document explains the main features of the knowledge pages and how articles are organised.

## Overview page

The route `/fag` shows the `KnowledgeOverview` component. From here auditors can:

- Search articles by keyword using the search box.
- Filter by content type or subject area with `AdvancedKnowledgeFilter`.
- Browse categories in the sidebar tree (`KnowledgeCategoryTree`).
- Upload new PDFs or create new articles if they have permission.

Users can also enable the knowledge base by clicking **Aktiver kunnskapsbase** which calls `generateEmbeddingsForExistingArticles` to prepare semantic search.

## Article workflow

Articles are stored in the `knowledge_articles` table. They belong to a category, content type and one or more subject areas. Tags may also be attached for free text filtering.

1. Administrators create categories and content types under the admin panel (`/fag/admin`).
2. Authors open **Ny artikkel** to use `ArticleEditor` which supports rich text and AI suggestions for metadata.
3. When an article is saved with status `published`, it becomes available in search results and to AI Revy.
4. The **PDFUploadManager** converts PDF files into articles which can then be edited like normal.

## Searching

The frontend calls the `knowledge-search` edge function via `performEnhancedSearch` in `src/services/knowledge/enhancedSearchLogging.ts`. This performs semantic and keyword search and logs metrics. Health checks and synthetic queries are implemented in `KnowledgeSearchDiagnostics`.

Search results include a list of matching articles as well as a mapping of relevant tags. The assistant adds a hidden HTML comment `<!-- KNOWLEDGE_ARTICLES: [...] -->` to reference articles shown after each answer.

## Personal lists

- **Mine artikler** shows articles the current user has authored or edited.
- **Favoritter** lists articles the user has marked with a star.

## Advanced tools

Set the environment variable `VITE_KNOWLEDGE_ADMIN_ADVANCED=true` to expose extra diagnostics in the admin panel. This allows running synthetic queries and downloading search logs as CSV.

For details on the classification models used to categorise articles see [classification.md](classification.md).

