# Revy Assistant Details

This guide explains the pieces that make the Revy chat assistant work. It is written for beginners who want to understand the flow without reading all the code.

## 1. Chat Interface

- Located under `src/components/Revy`. These React components show the chat window and handle user input.
- Messages are sent using the helper hooks in `src/components/Revy/Assistant/useRevyMessageHandling.ts`.

## 2. Client-side Service

- The components call `generateEnhancedAIResponseWithVariant` from `src/services/revy/enhancedAiInteractionService.ts`.
- This service collects the message, chat history and optional client data. It then calls a Supabase function.
- Responses are cached for a few minutes to avoid unnecessary calls.

## 3. Supabase Function

- The function is located in `supabase/functions/revy-ai-chat`.
- It builds a system prompt, fetches knowledge articles, and selects the best OpenAI model.
- After generating a reply, it logs usage and returns the text to the frontend.

## 4. Database Tables

- `revy_chat_sessions` and `revy_chat_messages` (created in `supabase/migrations`) store chat history.
- `ai_revy_variants` holds different AI personalities used by the enhanced service.

## 5. Flow Summary

1. User types a message in the chat component.
2. The message is sent to the client service, which forwards it to the Supabase function.
3. The function generates a reply using OpenAI and returns it.
4. The client updates the chat window and saves the message.

This overview should make it easier to draw a flow chart of how Revy works.
