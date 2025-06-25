# Project Overview

AI Revy aims to streamline Norwegian audit work by combining AI-driven document analysis with a curated knowledge base and client management tools. The assistant "Revy" helps auditors retrieve guidance, analyze files and automate repetitive tasks.

## Architecture

```
src/            # Frontend React application
  components/   # UI components such as AI chat, client documents and knowledge tools
  services/     # Business logic and API wrappers
  integrations/ # Supabase client and other external integrations
  pages/        # Route level components
supabase/
  functions/    # Edge functions powering AI chat and document analysis
```

Key directories:

- **src/components** – React components grouped by domain (e.g. `AI`, `ClientDocuments`, `Knowledge`).
- **src/services** – Application services like `revy` (assistant interaction), `knowledge` utilities and document search helpers.
- **supabase/functions** – Deno edge functions including `revy-ai-chat`, `document-ai-analyzer` and other automation.

## Important Modules

- **Revy Assistant** (`src/services/revy`) – Handles chat history, generates AI responses via the `revy-ai-chat` function and provides contextual tips.
- **Knowledge Management** (`src/components/Knowledge`, `src/services/knowledge`) – Interfaces for editing articles and search diagnostics plus hooks for categorizing content.
- **ClientDocuments Workflow** (`src/components/ClientDocuments`) – Upload, categorize and preview client files with bulk operations and AI-assisted analysis.

Additional details on classifications are available in [docs/classification.md](classification.md). For the Brønnøysundregistrene integration see [docs/brreg.md](brreg.md).
