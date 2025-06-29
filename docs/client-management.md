# Client Management

The client management module keeps track of audit clients, their teams and related departments. UI components live under `src/components/Clients`.

## Key Features

- **Client List & Filters** – `ClientsTable` and `ClientsHeader` display all clients with search and department filters.
- **Client Details** – `ClientDetails` shows engagement info and statistics.
- **Team Assignment** – clients belong to a `department` and can have multiple `client_teams` with members stored in `team_members`.
- **Brønnøysund Refresh** – the header component can update client data by calling the `brreg` edge function to sync registry information.

## Database Tables

The Supabase migrations create the following tables relevant for client management:

- `clients` – basic client info such as name and organisation number.
- `departments` – departments within an audit firm.
- `client_teams` – teams assigned to a client.
- `team_members` – users belonging to a team.

Row level security policies ensure users only see clients in their department or teams. See the migration beginning `20250609205220` for the table definitions and policies.
