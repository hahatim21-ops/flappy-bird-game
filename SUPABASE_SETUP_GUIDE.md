# Complete Supabase Setup Guide for Flappy Bird Game

This guide will walk you through setting up Supabase authentication for your Flappy Bird game step by step.

## 📋 Prerequisites

- A Google account (for Google OAuth)
- A web browser
- Your Flappy Bird game project (already set up)

---

## Step 1: Create a Supabase Account and Project

### 1.1 Sign Up for Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign up"**
3. Sign up using:
   - GitHub (recommended)
   - Email
   - Google

### 1.2 Create a New Project

1. After signing in, click **"New Project"**
2. Fill in the project details:
   - **Organization**: Select or create one
   - **Project Name**: `flappy-bird-game` (or any name you prefer)
   - **Database Password**: 
     - Create a strong password (save it somewhere safe!)
     - You'll need this to access your database later
   - **Region**: Choose the region closest to you
3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to be created

---

## Step 2: Get Your Supabase Credentials

### 2.1 Access API Settings

1. In your Supabase project dashboard, click on the **⚙️ Settings** icon (bottom left)
2. Click **"API"** in the settings menu

### 2.2 Copy Your Credentials

You'll see two important values:

1. **Project URL**
   - Looks like: `https://xxxxxxxxxxxxx.supabase.co`
   - Click the **copy icon** next to it
   - Save this somewhere safe

2. **anon public key**
   - A long string starting with `eyJ...`
   - Click the **copy icon** next to "anon public"
   - Save this somewhere safe

**⚠️ Important**: Keep these credentials secure. The anon key is safe to use in client-side code, but don't share it publicly.

---

## Step 3: Set Up Google OAuth in Google Cloud Console

### 3.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click the project dropdown at the top
4. Click **"New Project"**
5. Enter project name: `Flappy Bird Game` (or any name)
6. Click **"Create"**
7. Wait for the project to be created, then select it from the dropdown

### 3.2 Enable Google+ API

1. In Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and click **"Enable"**

### 3.3 Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace)
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: `Flappy Bird Game`
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **"Save and Continue"**
6. On "Scopes" page, click **"Save and Continue"** (no changes needed)
7. On "Test users" page, click **"Save and Continue"** (no changes needed)
8. Review and click **"Back to Dashboard"**

### 3.4 Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. Choose **"Web application"** as the application type
5. Give it a name: `Flappy Bird Web Client`
6. **Authorized redirect URIs**: Add this URL:
   ```
   https://YOUR_PROJECT_REFERENCE.supabase.co/auth/v1/callback
   ```
   **Replace `YOUR_PROJECT_REFERENCE`** with your Supabase project reference (the part before `.supabase.co` in your Project URL)
   
   Example: If your Project URL is `https://abcdefghijklmnop.supabase.co`, then add:
   ```
   https://abcdefghijklmnop.supabase.co/auth/v1/callback
   ```
7. Click **"Create"**
8. A popup will show your **Client ID** and **Client Secret**
   - **Copy both of these** - you'll need them in the next step
   - ⚠️ **Important**: Copy the Client Secret now - you won't be able to see it again!

---

## Step 4: Configure Google OAuth in Supabase

### 4.1 Enable Google Provider

1. Go back to your Supabase project dashboard
2. Click **"Authentication"** in the left sidebar
3. Click **"Providers"** tab
4. Find **"Google"** in the list and click on it

### 4.2 Enter Google OAuth Credentials

1. Toggle **"Enable Google provider"** to **ON**
2. Paste your **Client ID (for OAuth)** from Google Cloud Console
3. Paste your **Client Secret (for OAuth)** from Google Cloud Console
4. Click **"Save"** at the bottom

---

## Step 5: Configure Redirect URLs in Supabase

### 5.1 Add Redirect URLs

1. In Supabase dashboard, go to **"Authentication"** → **"URL Configuration"**
2. Under **"Redirect URLs"**, click **"Add URL"**
3. Add these URLs one by one:
   - `http://localhost:19006` (for local development)
   - `http://localhost:8081` (alternative Expo port)
   - If you have a production URL, add that too
4. Click **"Save"** after adding each URL

---

## Step 6: Add Credentials to Your Game Project

You have two options:

### Option A: Using Environment Variables (Recommended)

1. In your project folder (`C:\Users\Hatim\Downloads\flappy bird`), create a new file called `.env`
2. Open `.env` in a text editor and add:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REFERENCE.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key-here
   ```
3. Replace:
   - `YOUR_PROJECT_REFERENCE` with your actual Supabase project reference
   - `eyJ...your-anon-key-here` with your actual anon key
4. Save the file

**Example:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.example-key-here
```

### Option B: Direct Configuration

1. Open `lib/supabase.js` in your project
2. Find these lines:
   ```javascript
   const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL';
   const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
   ```
3. Replace the placeholder values:
   ```javascript
   const SUPABASE_URL = 'https://YOUR_PROJECT_REFERENCE.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...your-actual-anon-key';
   ```
4. Save the file

---

## Step 7: Test the Login System

### 7.1 Restart Your Development Server

1. Stop your current server (Ctrl+C in the terminal)
2. If you used Option A (environment variables), restart the server:
   ```bash
   npm run web
   ```
3. If you used Option B (direct configuration), just restart:
   ```bash
   npm run web
   ```

### 7.2 Test the Login Flow

1. Open your browser to `http://localhost:19006`
2. You should see the **login screen** with "Sign in with Google" button
3. Click **"Sign in with Google"**
4. You'll be redirected to Google
5. Sign in with your Google account
6. You'll be redirected back to your game
7. The game should now be visible with your name at the top!

### 7.3 Test Logout

1. Click the **"Logout"** button in the top right
2. You should be redirected back to the login screen

### 7.4 Test Session Persistence

1. Log in to the game
2. Refresh the page (F5)
3. You should still be logged in - no need to sign in again!

---

## 🎉 Success Checklist

- [ ] Supabase project created
- [ ] Credentials copied (URL and anon key)
- [ ] Google OAuth configured in Google Cloud Console
- [ ] Google OAuth enabled in Supabase
- [ ] Redirect URLs added in Supabase
- [ ] Credentials added to your project
- [ ] Login screen appears
- [ ] Can sign in with Google
- [ ] Game appears after login
- [ ] Name displays at the top
- [ ] Logout works
- [ ] Session persists on refresh

---

## 🐛 Troubleshooting

### Problem: "Failed to sign in" Error

**Solutions:**
- Check that Google OAuth is enabled in Supabase
- Verify Client ID and Secret are correct (no extra spaces)
- Make sure redirect URL is added in both Google Console and Supabase
- Check browser console for detailed error messages

### Problem: "Invalid API key" Error

**Solutions:**
- Verify you're using the **anon/public** key, not the service role key
- Check for typos in the URL or key
- Make sure there are no extra spaces or quotes

### Problem: Redirect Not Working

**Solutions:**
- Verify redirect URL in Supabase matches exactly: `http://localhost:19006`
- Check that redirect URL is added in Google Cloud Console
- Make sure you're using `http://` not `https://` for localhost
- Clear browser cache and try again

### Problem: Still Shows Dev Mode

**Solutions:**
- Make sure you replaced the placeholder values in `lib/supabase.js`
- If using `.env` file, make sure it's in the project root
- Restart the development server after making changes
- Check that the URL doesn't contain "YOUR_" in it

### Problem: Can't See Client Secret in Google Console

**Solutions:**
- You can only see it once when you create it
- If you lost it, create a new OAuth client ID
- Update the credentials in Supabase with the new Client ID and Secret

---

## 📝 Important Notes

- **Security**: The anon key is safe to use in client-side code (it's public)
- **Development**: If Supabase isn't configured, the game runs in dev mode (no login required)
- **Production**: Remember to add your production URL to Supabase redirect URLs
- **Sessions**: Sessions are automatically managed by Supabase and persist across page refreshes

---

## 🎯 Next Steps (Optional)

Once login is working, you can:
- Save high scores to Supabase database
- Create a leaderboard
- Track user statistics
- Add user profiles

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Expo Documentation](https://docs.expo.dev/)

---

**Need Help?** If you get stuck, check the error messages in your browser console (F12) and the Supabase dashboard logs.
