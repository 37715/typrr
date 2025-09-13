# Database Scripts

This directory contains organized database scripts for the DevTyper application.

## Structure

- `functions/` - Reusable database functions
- `schemas/` - Table creation and schema definitions  
- `migrations/` - Historical migration scripts (for reference)

## Important Files

### Functions
- `security_functions.sql` - Security functions for rate limiting and fraud detection
- `fix_github_auth_bug.sql` - Core authentication functions and triggers

### Schemas  
- `keystroke_analytics.sql` - Advanced character-level analytics (future feature)
- `create_friendships_table.sql` - Friend system schema (future feature)

## Security Notes

⚠️ **NEVER commit files containing:**
- Hardcoded user IDs or UUIDs
- Production database URLs or credentials
- Real user data or personal information
- API keys or secrets

✅ **Safe to commit:**
- Generic schema definitions
- Reusable functions
- Migration scripts with placeholder data

## Usage

Run these scripts in your Supabase SQL editor or via the CLI. Always test in development first.