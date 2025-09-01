# GitHub OAuth Setup for DevTyper

To get the simple GitHub OAuth flow working, you need to:

## 1. Create a GitHub OAuth App
1. Go to GitHub.com → Settings → Developer settings → OAuth Apps → New OAuth App
2. Fill in:
   - **Application name**: DevTyper
   - **Homepage URL**: `http://localhost:5173` (for dev) or your production domain
   - **Authorization callback URL**: `http://localhost:5173/profile`
3. Click "Register application"
4. Copy the **Client ID** and **Client Secret**

## 2. Add to Supabase Auth Providers
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable GitHub provider
3. Paste the Client ID and Client Secret from step 1
4. Make sure the redirect URL is set correctly

## 3. Update Environment Variables
Add to your `.env.local`:
```
VITE_GITHUB_CLIENT_ID=your_github_client_id_here
```

## Why This Is Needed
- Supabase needs the OAuth credentials to handle GitHub authentication
- Without this setup, the GitHub OAuth button will fail silently
- This is the standard way to implement GitHub OAuth in any application

This should take about 5 minutes to set up and will give you the simple "Connect with GitHub" flow you want.