# Login System Setup Guide

A login system has been added to your Flappy Bird game. Users must sign in with Google before they can play.

## ✅ What Was Added

### New Files:
1. **`lib/supabase.js`** - Supabase client configuration
2. **`components/LoginScreen.js`** - Login screen with Google OAuth button

### Modified Files:
1. **`App.js`** - Now handles authentication and shows login before game
2. **`package.json`** - Added @supabase/supabase-js dependency

### Unchanged Files:
- **`FlappyBirdGame.js`** - Game code is completely unchanged
- All game components (Bird, Pipe, Score, GameOver) - Unchanged

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details and wait for it to be created

### Step 3: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 4: Configure Google OAuth in Supabase

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click on it
3. Toggle **Enable Google provider** to ON
4. You'll need Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: Add your Supabase redirect URL:
     ```
     https://xxxxx.supabase.co/auth/v1/callback
     ```
     (Replace `xxxxx` with your Supabase project reference)
   - Copy the **Client ID** and **Client Secret**
5. Back in Supabase, paste:
   - **Client ID (for OAuth)**
   - **Client Secret (for OAuth)**
6. Click **Save**

### Step 5: Configure Redirect URLs

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add these to **Redirect URLs**:
   - `http://localhost:19006` (for local development)
   - `http://localhost:8081` (alternative Expo port)
   - Your production URL (when you deploy)

### Step 6: Add Credentials to Your Project

**Option A: Environment Variables (Recommended)**

1. Create a `.env` file in the project root:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
   ```

2. The code in `lib/supabase.js` will automatically use these

**Option B: Direct Configuration**

1. Open `lib/supabase.js`
2. Replace the placeholder values:
   ```javascript
   const SUPABASE_URL = 'https://xxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...your-anon-key';
   ```

## 🎮 How It Works

### Authentication Flow:

1. **App Starts** → Checks for existing session
2. **No Session** → Shows LoginScreen with "Sign in with Google" button
3. **User Clicks Button** → Redirects to Google for authentication
4. **User Authenticates** → Google redirects back to app
5. **Session Created** → App shows FlappyBirdGame with user's name
6. **Session Persists** → User stays logged in on refresh

### Component Structure:

```
App.js (Auth Wrapper)
├── Loading State → Shows spinner
├── No Session → LoginScreen
└── Has Session → FlappyBirdGame + User Bar
    └── FlappyBirdGame (Original game, unchanged)
```

## 🧪 Testing

### Test Login:
1. Start the app: `npm run web`
2. You should see the login screen
3. Click "Sign in with Google"
4. You'll be redirected to Google
5. Sign in with your Google account
6. You'll be redirected back to the app
7. The game should now be visible with your name at the top

### Test Logout:
1. While logged in, click the "Logout" button in the top right
2. You should be redirected back to the login screen

### Test Session Persistence:
1. Log in to the app
2. Refresh the page (F5 or Cmd+R)
3. You should still be logged in (no need to sign in again)

## 🔍 Key Features

- **Google OAuth**: Secure authentication via Google
- **Session Persistence**: Users stay logged in after page refresh
- **User Name Display**: Shows user's name from Google profile
- **Logout Button**: Easy way to sign out
- **Development Mode**: If Supabase isn't configured, game runs without auth (for testing)

## 🐛 Troubleshooting

### "Failed to sign in" Error:
- Check that Google OAuth is enabled in Supabase
- Verify Client ID and Secret are correct
- Make sure redirect URL is configured in both Google Console and Supabase

### "Invalid API key" Error:
- Verify your Supabase URL and anon key are correct
- Make sure you're using the **anon/public** key, not the service role key

### Session Not Persisting:
- Check that `persistSession: true` is set in supabase.js
- Clear browser cache and try again
- Check browser console for errors

### Redirect Not Working:
- Verify redirect URLs are added in Supabase dashboard
- Make sure the URL matches exactly (including http vs https)
- For local development, use `http://localhost:19006`

## 📝 Important Notes

- **Game Code is Unchanged**: All game mechanics, physics, and UI remain exactly as they were
- **Session Management**: Sessions are automatically managed by Supabase
- **Security**: The anon key is safe to use in client-side code (it's public)
- **Production**: Remember to add your production URL to Supabase redirect URLs before deploying

## 🎯 Development Mode

If Supabase is not configured (URL still has placeholder), the app runs in **development mode**:
- Game is accessible without login
- Shows "Dev Player" as the user name
- No logout button

This allows you to test the game while setting up Supabase.

---

**Need Help?** Check the [Supabase Documentation](https://supabase.com/docs) or [Expo Documentation](https://docs.expo.dev/)
