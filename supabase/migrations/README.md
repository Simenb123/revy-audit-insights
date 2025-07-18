# Database Migrations

This directory contains database migration files for AI Revy platform.

## Security Migrations

### 20250718_001_critical_security_fixes.sql
- **Purpose**: Critical security fixes for Phase 1
- **Changes**:
  - Fixed all database functions with proper `search_path = ''` to prevent schema-injection attacks
  - Secured all SECURITY DEFINER functions
  - Added proper permissions and grants for authenticated users
  
## Existing Migrations (Backup Documentation)

The following migrations were previously applied directly to Supabase and are documented here for reference:

### AI Cache System
- Created `ai_cache` table for caching AI responses
- Implemented cache hit tracking functionality
- Added RLS policies for user-specific cache access

### Enhanced Knowledge Management
- Created linking tables for improved content organization:
  - `content_types` - Content type management
  - `audit_action_subject_areas` - Action-subject area relationships
  - `document_type_subject_areas` - Document-subject area relationships
  - `tags` - Standardized tagging system
  - `knowledge_article_tags` - Article tagging relationships
  - `audit_action_tags` - Action tagging relationships

## Security Notes

- All SECURITY DEFINER functions now use `SET search_path = ''` for security
- RLS policies are enabled on all user-data tables
- Functions have proper permission grants for authenticated users
- Password security and MFA should be configured in Supabase dashboard

## Next Steps

1. Enable password strength validation in Supabase Auth settings
2. Configure MFA options (TOTP recommended)
3. Review and test all RLS policies
4. Monitor function execution logs for security issues