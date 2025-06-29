# Frontend Supabase Flow

This document shows which React hooks and frontend services invoke the main Supabase edge functions. The arrows in the diagram point from the caller to the edge function being executed.

```mermaid
graph TD
  subgraph Hooks
    HUpload[useUploadDocument] --> F1[pdf-text-extractor]
    HRetry[useRetryTextExtraction] --> F1
    HConversions[usePDFConversions] --> F2[enhanced-pdf-text-extractor]
    HClient[useClientTextExtraction] --> F2
    HAdvanced[useAdvancedDocumentAI] --> F3[document-ai-categorizer]
    HSpecial[useSpecializedAIChat] --> F4[revy-ai-chat]
    HClient --> SAnalyze[analyzeDocumentWithAI]
  end

  subgraph Services
    SAnalyze --> F5[enhanced-document-ai]
    SAnalyze --> F6[document-ai-analyzer]
    SAIResponse[generateAIResponse] --> F4
    SSearch[performEnhancedSearch] --> F7[knowledge-search]
    STrigger[triggerEnhancedTextExtraction] --> F2
    SEmbed[generateEmbeddingsForExistingArticles] --> F8[generate-embeddings]
    SDiagnostics[KnowledgeSearchDiagnostics] --> F7
  end
```

### Hooks
- **useUploadDocument** and **useRetryTextExtraction** start background processing by calling `pdf-text-extractor`.
- **usePDFConversions** triggers `enhanced-pdf-text-extractor` for advanced conversions.
- **useClientTextExtraction** first attempts frontend parsing and then calls `enhanced-pdf-text-extractor`; when finished it runs `analyzeDocumentWithAI` for further analysis.
- **useAdvancedDocumentAI** sends files to `document-ai-categorizer`.
- **useSpecializedAIChat** communicates with the `revy-ai-chat` assistant.

### Services
- **analyzeDocumentWithAI** decides between `enhanced-document-ai` and `document-ai-analyzer` based on configuration.
- **generateAIResponse** is the standard chat helper that invokes `revy-ai-chat`.
- **performEnhancedSearch** logs search metrics and queries `knowledge-search`.
- **triggerEnhancedTextExtraction** allows re-running `enhanced-pdf-text-extractor` for a document.
- **generateEmbeddingsForExistingArticles** invokes `generate-embeddings` for knowledge articles.
- **KnowledgeSearchDiagnostics** performs health checks by querying `knowledge-search`.
