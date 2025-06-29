
# AI Revy - Intelligent Audit Assistant

AI Revy is an intelligent audit assistant built for Norwegian audit firms, providing AI-powered document analysis, knowledge management, and audit workflow automation.

## Features

- **AI-Powered Audit Assistant**: Chat with AI-Revi for audit guidance and support
- **Document Management**: Upload, categorize, and analyze audit documents
- **Knowledge Base**: Comprehensive audit standards and procedure library
- **Client Management**: Organize and track audit clients and engagements
- **Team Collaboration**: Real-time collaboration tools for audit teams

## Project Overview

For a high-level tour of the architecture and key modules, see [docs/project-overview.md](docs/project-overview.md).
For the document processing pipeline, see [docs/document-workflow.md](docs/document-workflow.md).
For using the AI-driven audit action generator, see [docs/audit-action-generator.md](docs/audit-action-generator.md).
For a beginner friendly summary of the code structure, see [docs/modules-overview.md](docs/modules-overview.md).

## Environment Setup

### Required Environment Variables

Copy `.env.example` to `.env.local` and update the values:

```env
# Supabase Configuration (Required)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anonymous_key
SUPABASE_FUNCTIONS_URL=your_supabase_functions_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here # used for accessing internal knowledge articles


# OpenAI API Key (Required for AI features)
OPENAI_API_KEY=your_openai_api_key
LOG_LEVEL=info # set to 'debug' for more verbose logs
```

**Note**: You must provide `SUPABASE_URL` and `SUPABASE_ANON_KEY` for the application to connect to Supabase. `SUPABASE_SERVICE_ROLE_KEY` is only required for certain edge functions (`syncKunngjoring`, `setup-storage`). See [docs/service-role-functions.md](docs/service-role-functions.md) for details.

### Getting Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the "Project URL" for `SUPABASE_URL`
5. Copy the "anon/public" key for `SUPABASE_ANON_KEY`
6. Copy the "service_role" key (also in Settings > API) for `SUPABASE_SERVICE_ROLE_KEY`

### Getting Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key for `OPENAI_API_KEY`

### Supabase Project Configuration

For the embedded generation trigger to work properly, you may need to set custom configuration variables in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to Settings > Custom Config
3. Add the following variables:
   - `app.supabase_url`: Your Supabase project URL
   - `app.supabase_anon_key`: Your Supabase anonymous key

## Installation

1. Clone the repository
2. Install dependencies: `npm install --legacy-peer-deps`
3. Run the test suite to verify the setup: `npm test`
4. Copy `.env.example` to `.env.local` and fill in your credentials (optional)
5. Start the development server: `npm run dev` (it will automatically load `.env.local`)

The `.env.example` file includes a `VITE_USE_ENHANCED_ANALYSIS` flag. Set this to `true` to use the enhanced document AI functions.

### CI Setup

For automated environments, you can run `scripts/setup-ci.sh` to install dependencies and execute the test suite. This is useful for continuous integration pipelines.

## Deployment

1. Ensure all environment variables are set in your hosting platform
2. Build the project: `npm run build`
3. Deploy the `dist` folder to your hosting provider

## Security Notes

- Never commit actual API keys or credentials to version control
- Use different Supabase projects for development and production
- Regularly rotate API keys for security
- Ensure your `.env` file is listed in `.gitignore`

### Service Role Usage

Most edge functions now rely on the caller's JWT instead of the powerful service role key. Only a few functions still require `SUPABASE_SERVICE_ROLE_KEY` due to privileged operations. See [docs/service-role-functions.md](docs/service-role-functions.md) for details.

## Kilder og sporbarhet

AI-Revi henter automatisk relevante kilder fra kunnskapsartikler og opplastede dokumenter. Etter hvert svar fra assistenten vises disse som klikkbare lenker under overskriften "Kilder og referanser", slik at du enkelt kan åpne kildene og verifisere innholdet.

Når AI-Revi finner relevante artikler legger den til en skjult HTML-kommentar i svaret med metadata: `<!-- KNOWLEDGE_ARTICLES: [...] -->`. Frontend-komponenten leser kommentaren og viser de nevnte artiklene som lenker under svaret.

**Eksempel**:

> Revisor må dokumentere vurderingene i henhold til ISA 230.
>
> Kilder og referanser: [ISA 230](https://example.com/isa-230) | [Internt notat om dokumentasjon](https://example.com/notat.pdf)

Eksempel på respons fra assistenten:

```html
Svar fra AI-Revi...

<!-- KNOWLEDGE_ARTICLES: [{"slug":"isa-315","title":"ISA 315"}] -->
```

```
AI-Revi: Husk å dokumentere risikovurderingen i henhold til ISA 315.

Kilder og referanser:
[ISA 315] [Revisorloven] [balanse_2023.pdf]
```

## Support

For technical support or questions about AI Revy, please contact the development team.
