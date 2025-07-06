# Module Overview

This document explains the main parts of the AI Revy project in everyday language. It is meant for readers without a deep IT background.

## Frontend (`src`)

The `src` folder holds the user interface of the application. It is built with React.

- **components** – small building blocks that show buttons, forms and pages. Important areas include:
  - **Revy** – chat interface for talking with the assistant.
  - **ClientDocuments** – tools for uploading and analysing client files.
  - **Knowledge** – editing and searching articles in the knowledge base. The search testing panel lets you run synthetic queries and download diagnostic history as CSV.
  - **Dashboard, Organization, Teams** – screens for managing firms and team members.
- **hooks** – helper functions used by the components to fetch data and keep track of state.
- **pages** – the main screens a user can open, such as the dashboard or the knowledge base.
- **services** – logic that connects the UI to Supabase and the AI functions. For example `revy` handles the assistant chat and `documentAIService` analyses documents.
- **integrations** – setup for connecting to Supabase.
- **store** – small storage for UI state, like whether the chat window is open.
- **utils** and **lib** – various utility functions (date formatting, network helpers, etc.).

## Backend (`supabase`)

The `supabase/functions` folder contains serverless functions written in Deno. They run on Supabase and perform tasks such as:

- **revy-ai-chat** – generates responses from the AI assistant.
- **pdf-text-extractor** and **pdf-converter** – read text from uploaded files.
- **document-ai-analyzer** and **document-ai-categorizer** – summarise and categorise documents.
- **knowledge-search** – searches knowledge articles for relevant information.

Database changes live in `supabase/migrations` as SQL scripts.
These scripts include enum definitions, table creation, row level security
policies and triggers for automatically updating timestamps. Running them sets up
the complete schema for the project.

## Other folders

- **cypress** – automated tests that ensure the user interface works correctly.
- **docs** – documentation for developers and auditors.
- For how the right sidebar chooses its content see [sidebar-overview.md](sidebar-overview.md).
- For a list of the audit phases and how templates use them see [audit-phases.md](audit-phases.md).
- For how to manage audit actions see [manage-audit-actions.md](manage-audit-actions.md).
- For guidelines on the form layout see [audit-action-editor-ui.md](audit-action-editor-ui.md).

## Voice Features

Two edge functions provide basic voice capabilities:

- `text-to-speech` converts Revy's text replies to audio (uses ElevenLabs or OpenAI).
- `voice-to-text` transcribes recordings to text using OpenAI Whisper.

In the frontend these functions are used in the training tools found under `src/components/Training`. The
`AICharacterSimulator` calls `text-to-speech` for spoken responses and `VoiceTrainingModule` uses
`voice-to-text` to analyse user recordings. The regular chat interface has a placeholder button for future
voice input.

This overview should help you navigate the project without needing to read the code in detail.
