# Quick Guide: Enable Google Login

Your login system is ready! You just need to enable Google OAuth in Supabase.

## ⚡ Quick Setup (5 minutes)

### Step 1: Enable Google OAuth in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"Authentication"** in the left sidebar
4. Click **"Providers"** tab
5. Find **"Google"** and click on it
6. Toggle **"Enable Google provider"** to **ON**

### Step 2: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Go to **"APIs & Services"** → **"Credentials"**
4. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. Choose **"Web application"**
6. Name it: `Flappy Bird Web Client`
7. **Authorized redirect URIs**: Add this:
   ```
   https://qyzzlvvqeydmywvpnyis.supabase.co/auth/v1/callback
   ```
8. Click **"Create"**
9. **Copy the Client ID and Client Secret** (save them!)

### Step 3: Add Credentials to Supabase

1. Back in Supabase dashboard → **Authentication** → **Providers** → **Google**
2. Paste your **Client ID (for OAuth)**
3. Paste your **Client Secret (for OAuth)**
4. Click **"Save"**

### Step 4: Add Redirect URLs

1. In Supabase → **Authentication** → **URL Configuration**
2. Under **"Redirect URLs"**, add:
   - `http://localhost:19006`
   - `http://localhost:8081`
3. Click **"Save"** after each

### Step 5: Test Login

1. Restart your server: `npm run web`
2. Open `http://localhost:19006`
3. You should see the login screen
4. Click **"Sign in with Google"**
5. Sign in with your Google account
6. You'll be redirected back and the game will appear!

---

## ✅ That's It!

Once Google OAuth is enabled, users will:
1. See the login screen when they open the game
2. Click "Sign in with Google"
3. Be redirected to Google to sign in
4. Be redirected back to the game
5. See their name at the top
6. Can click "Logout" to sign out

---

## 🐛 Troubleshooting

**"Failed to sign in" error:**
- Make sure Google OAuth is enabled in Supabase
- Verify Client ID and Secret are correct
- Check that redirect URL is added in both Google Console and Supabase

**Redirect not working:**
- Make sure redirect URL in Supabase matches: `http://localhost:19006`
- Verify redirect URL in Google Console: `https://qyzzlvvqeydmywvpnyis.supabase.co/auth/v1/callback`
