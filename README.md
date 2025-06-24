
# AI Revy - Intelligent Audit Assistant

AI Revy is an intelligent audit assistant built for Norwegian audit firms, providing AI-powered document analysis, knowledge management, and audit workflow automation.

## Features

- **AI-Powered Audit Assistant**: Chat with AI-Revi for audit guidance and support
- **Document Management**: Upload, categorize, and analyze audit documents
- **Knowledge Base**: Comprehensive audit standards and procedure library
- **Client Management**: Organize and track audit clients and engagements
- **Team Collaboration**: Real-time collaboration tools for audit teams

## Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anonymous_key

# OpenAI API Key (Required for AI features)
OPENAI_API_KEY=your_openai_api_key
```

### Getting Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the "Project URL" for `VITE_SUPABASE_URL`
5. Copy the "anon/public" key for `VITE_SUPABASE_ANON_KEY`

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
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your credentials
4. Start the development server: `npm run dev`

## Deployment

1. Ensure all environment variables are set in your hosting platform
2. Build the project: `npm run build`
3. Deploy the `dist` folder to your hosting provider

## Security Notes

- Never commit actual API keys or credentials to version control
- Use different Supabase projects for development and production
- Regularly rotate API keys for security
- Ensure your `.env` file is listed in `.gitignore`

## Support

For technical support or questions about AI Revy, please contact the development team.
