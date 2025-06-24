
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/6d75701a-c042-4d77-9e90-d34a13694622

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/6d75701a-c042-4d77-9e90-d34a13694622) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/6d75701a-c042-4d77-9e90-d34a13694622) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Environment variables

Create a `.env` file and provide the following variables so the frontend can connect to Supabase and enable AI functionality:

```bash
# Supabase Configuration (Required)
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# AI Functionality (Required for AI-Revi assistant)
OPENAI_API_KEY=<your-openai-api-key>

# Text-to-Speech (Optional)
ELEVENLABS_API_KEY=<your-elevenlabs-api-key>
```

**Important Notes:**
- `SUPABASE_SERVICE_ROLE_KEY` is used in the Supabase edge functions to create a client with elevated permissions required for full-text search across protected tables.
- `OPENAI_API_KEY` is required for the AI-Revi assistant to function properly.
- `ELEVENLABS_API_KEY` is optional and only needed if you want to enable text-to-speech functionality.

## Running Supabase locally (for development)

If you want to run Supabase locally for development:

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Start Supabase locally
supabase start

# Deploy edge functions locally
supabase functions deploy

# View local Supabase dashboard
# Open http://localhost:54323 in your browser
```

The local Supabase instance will provide you with local URLs and keys to use in your `.env` file during development.

## Edge Functions

This project uses several Supabase Edge Functions for AI functionality:

- `revy-ai-chat`: Main AI assistant chat functionality
- `enhanced-pdf-text-extractor`: PDF text extraction
- `document-ai-analyzer`: Document analysis and categorization
- `enhanced-document-ai`: Advanced document processing

These functions are automatically deployed when you make changes through Lovable.
