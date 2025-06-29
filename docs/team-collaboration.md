# Team Collaboration

Real-time collaboration features are implemented in the `src/components/Communication` folder. These components let team members share files, chat and host video meetings.

## Components

- `CollaborativeWorkspace` – dashboard for a team workspace with tabs for files, tasks, calendar and chat.
- `ChatRoom` and `EnhancedChatRoom` – live message threads based on Supabase realtime.
- `FileSharing` – upload and download shared documents.
- `VideoCallInterface` – simple video meeting UI.
- `OnlineUsers` – shows presence of currently online users.

## Backend Tables

The migration `20250610062722` creates tables that power collaboration:

- `chat_rooms` and `messages` store conversations.
- `user_presence` tracks online status.

Triggers automatically create a team chat room whenever a new `client_team` is added. Row level security allows access only to members of the relevant team, department or firm.
