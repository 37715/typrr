# DevTyper Project Documentation

## CRITICAL UI RULE: EVERYTHING LOWERCASE
**NEVER FORGET**: ALL text on the website must be lowercase. Examples:
- "Enter username" not "Enter Username"  
- "profile" not "Profile"
- "daily challenge" not "Daily Challenge"
- "sign out" not "Sign Out"
- Error messages, placeholders, buttons, headers - EVERYTHING lowercase

## Project Overview
DevTyper is a typing speed practice web application with daily challenges, user profiles, and statistics tracking.

**Tech Stack:**
- Frontend: React + TypeScript + Vite
- Backend: Express.js API server + Supabase (PostgreSQL)
- Deployment: Vercel (frontend), Custom API server
- Authentication: Supabase Auth (Google/GitHub OAuth)
- Styling: Tailwind CSS

## Architecture

### Frontend (React + Vite)
- **Port**: localhost:5173 (development)
- **Build**: Vite with TypeScript
- **Proxy**: API calls proxied to localhost:3002 via vite.config.ts

### Backend API (Express)  
- **Port**: localhost:3002 (development)
- **File**: api/server.js
- **Purpose**: Handles attempt submissions, stats calculations, CORS

### Database (Supabase PostgreSQL)
- **URL**: https://oryoybnvfsqtkftymwwx.supabase.co
- **Auth**: Row Level Security (RLS) enabled
- **Connection**: Direct from frontend for auth/profiles, via API for attempts

## Database Schema

### `profiles` table
```sql
id: UUID (primary key, references auth.users)
username: TEXT (unique, 3-20 chars, alphanumeric + underscores only)
avatar_url: TEXT (base64 encoded images)
created_at: TIMESTAMP
username_changes: INTEGER (default 0, max 2 per month)
last_username_change: TIMESTAMP
```

### `user_stats` table  
```sql
user_id: UUID (references profiles.id)
avg_wpm: DECIMAL
avg_accuracy: DECIMAL  
total_attempts: INTEGER
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### Key Database Functions
- `generate_random_username()`: Creates unique usernames like "swiftcoder12345"
- `check_username_availability()`: Validates usernames with strict rules
- `update_username_with_limits()`: Handles username changes with 2/month limit
- `can_change_username()`: Checks if user can change username

## Authentication System

### User Flow
1. User signs up with Google/GitHub OAuth
2. **Authentication trigger** automatically creates profile with random username
3. User can customize username (2 changes per month max)
4. Profile picture upload stores base64 in database

### Critical Authentication Components
- **Trigger**: `on_auth_user_created` on `auth.users` table
- **Function**: `handle_new_user()` creates profile entry
- **RLS Policies**: Allow authenticated users full access to own data

### Known Auth Issues (SOLVED)
- ✅ Profiles not auto-created (fixed trigger)
- ✅ 406 errors on profile page (fixed .single() to .maybeSingle())
- ✅ Username validation (added strict character rules)

## File Structure

### Key Components
```
src/
├── components/
│   ├── Profile.tsx        # User profile with stats, username editing, avatar
│   ├── DailyChallenge.tsx # Daily typing challenge
│   └── TypingPractice.tsx # Free practice mode
├── hooks/
├── lib/
└── types/
```

### API Routes
```
api/
├── server.js      # Main Express server
├── attempt.ts     # POST /api/attempt - Submit typing results
└── vercel.json    # Vercel deployment config
```

### Configuration Files
```
├── .env.local                    # Supabase keys (not in git)
├── vite.config.ts               # Dev server + API proxy
├── fix_username_validation_strict.sql  # Database setup
└── CLAUDE.md                    # This documentation
```

## Development Workflow

### Starting Development
1. `npm run dev` (starts Vite dev server on :5173)
2. Start API server: `node api/server.js` (runs on :3002)  
3. Both servers must be running for full functionality

### Environment Variables (.env.local)
```
SUPABASE_URL=https://oryoybnvfsqtkftymwwx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Daily Challenge Leaderboard System

### Overview
The daily challenge features a comprehensive leaderboard system with two main components:

**Top10 Component** (`src/components/Top10.tsx`):
- Sidebar leaderboard showing top 10 daily performers
- Table format with rank, user, WPM, accuracy, time, and replay button
- Positioned absolutely to the right of the main content
- Auto-refreshes when new attempts are completed via `refreshTrigger` prop
- Shows gold/silver/bronze medals (🥇🥈🥉) for top 3

**LeaderboardModal Component** (`src/components/ui/leaderboard-modal.tsx`):
- Full-screen modal accessible via trophy button (header) and "leaderboard" button (daily mode)
- Shows same data as Top10 but in detailed modal format
- Includes accuracy column and full user information
- Supports both daily and all-time leaderboards (tabs)

### Key Implementation Details
- **Daily-specific**: Each day has its own leaderboard that resets at midnight UTC
- **Best attempt only**: Users get 3 attempts per day, but only their best WPM is shown
- **Real-time updates**: Both components refresh automatically after attempt completion
- **Data flow**: API endpoint (`/api/leaderboard/daily`) → formatted for both components
- **Layout**: Code snippet stays centered, Top10 positioned absolutely to avoid layout shift

### Critical Layout Rules
- **Code snippet centering**: Use `max-w-4xl mx-auto` to keep code perfectly centered
- **Top10 positioning**: Use `absolute` positioning so it doesn't affect main content
- **No layout interference**: Top10 should never push or move the main typing interface

## Component Details

### Profile.tsx
**Features:**
- Real-time username availability checking
- Visual validation feedback (green=available, red=taken, yellow=checking)
- Avatar upload (base64 storage, 5MB limit)
- XP calculation and level system with icons
- Username change limits (2 per month)

**Level System:**
```javascript
const levels = [
  { name: 'novice', icon: Zap, threshold: 0, color: 'text-gray-500' },
  { name: 'intermediate', icon: Target, threshold: 100, color: 'text-blue-500' },
  { name: 'advanced', icon: Trophy, threshold: 500, color: 'text-purple-500' },
  { name: 'expert', icon: Crown, threshold: 2500, color: 'text-orange-500' },
  { name: 'master', icon: Star, threshold: 5000, color: 'text-yellow-500' },
  { name: 'legend', icon: Gem, threshold: 12500, color: 'text-pink-500' }
];
```

**Critical Code Patterns:**
- Use `.maybeSingle()` not `.single()` for optional queries
- All database calls wrapped in try-catch
- Toast notifications for user feedback
- Real-time validation with 500ms debounce

## API Endpoints

### POST /api/attempt
**Purpose**: Submit typing results and update stats
**Body:**
```json
{
  "user_id": "uuid",
  "wpm": 65,
  "accuracy": 95.5,
  "mode": "practice" | "daily"
}
```

**Critical Fix Applied**: Changed `auth.user.id` to `user.id` (was causing 500 errors)

## Username Validation Rules

### Strict Requirements
- **Length**: 3-20 characters
- **Characters**: Only letters, numbers, single underscores
- **Format**: Must start/end with letter or number
- **No consecutive underscores**: `user__name` ❌
- **No spaces**: `user name` ❌  
- **No special chars**: `user{}`, `user@domain.com`, `user-name` ❌
- **Reserved words**: `admin`, `root`, `api` ❌
- **Case-insensitive uniqueness**: `User123` = `user123`

### Random Username Generation
- Format: `adjective` + `noun` + `number` (e.g., "swiftcoder12345")
- Guaranteed uniqueness with 50 retry attempts
- Fallback: adds timestamp if needed

## Styling Patterns

### UI Guidelines
- **Colors**: Zinc palette for neutral elements
- **Borders**: `rounded-2xl` for main containers, `rounded-md` for inputs
- **Background**: Semi-transparent overlays (`bg-white/60`, `bg-zinc-900/60`)
- **Icons**: Lucide React icons throughout
- **Responsive**: `max-w-3xl mx-auto` for main content

### Dark Mode Support
- Full dark mode implementation with `dark:` classes
- Toggle between light/dark themes
- Proper contrast ratios maintained

## Known Issues & Solutions

### ✅ SOLVED Issues
1. **Profile creation failures** → Fixed authentication trigger
2. **406 errors on profile page** → Changed `.single()` to `.maybeSingle()`
3. **Username validation** → Added strict character validation
4. **JSON parsing errors in API** → Fixed `auth.user.id` reference
5. **Duplicate usernames** → Added unique constraint + case-insensitive checks

### Development Notes
- Always test both practice and daily challenge modes
- Verify username changes work with validation feedback
- Check that stats update correctly after attempts
- Test authentication flow end-to-end

## Deployment

### Frontend (Vercel)
- Automatically deploys from git pushes
- Environment variables set in Vercel dashboard
- Build command: `npm run build`

### API Server
- Needs separate hosting (not on Vercel functions)
- CORS configured for frontend domain
- Express server handles attempt processing

## Testing Checklist
When making changes, always verify:
- [ ] Sign up flow creates profile automatically
- [ ] Username editing shows real-time validation
- [ ] Both practice and daily challenge submit correctly  
- [ ] Profile page loads without 406 errors
- [ ] Stats calculate and display properly
- [ ] Avatar upload works (5MB limit)
- [ ] All text is lowercase throughout UI
- [ ] Dark mode works correctly
- [ ] Username change limits enforced (2/month)

## Quick Reference Commands
```bash
# Start development
npm run dev

# Start API server  
node api/server.js

# Check Supabase connection
node -e "console.log('Test')"

# Build for production
npm run build
```

---

**Remember**: This is a typing practice app focused on clean UI, accurate stats, and user customization. Keep everything simple, fast, and lowercase!