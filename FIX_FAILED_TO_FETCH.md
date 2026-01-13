# Fix "Failed to fetch" Error

The "Failed to fetch" error means Supabase can't connect. Here's how to fix it:

## ✅ Quick Fix Steps

### Step 1: Enable Email Authentication in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"Authentication"** in the left sidebar
4. Click **"Providers"** tab
5. Find **"Email"** in the list
6. Make sure **"Enable Email provider"** is **ON** (toggle it on if it's off)
7. Click **"Save"**

### Step 2: Check Site URL Configuration

1. In Supabase dashboard → **Authentication** → **URL Configuration**
2. Under **"Site URL"**, make sure it's set to:
   ```
   http://localhost:19006
   ```
3. Under **"Redirect URLs"**, add:
   ```
   http://localhost:19006
   ```
4. Click **"Save"**

### Step 3: Verify Your Credentials

1. In Supabase dashboard → **Settings** → **API**
2. Make sure your **Project URL** matches what's in your `.env` file:
   ```
   https://qyzzlvvqeydmywvpnyis.supabase.co
   ```
3. Make sure your **anon public key** matches

### Step 4: Restart Your Server

1. Stop your server (Ctrl+C in terminal)
2. Start it again:
   ```bash
   npm run web
   ```
3. Wait for it to compile
4. Refresh your browser

---

## 🔍 Check Browser Console

1. Open your game: `http://localhost:19006`
2. Press **F12** to open Developer Tools
3. Click **"Console"** tab
4. Look for:
   - ✅ **"Supabase client initialized"** = Good!
   - ❌ **"Failed to fetch"** = Connection issue
   - ❌ **"Invalid API key"** = Wrong credentials

---

## 🐛 Common Issues & Solutions

### Issue 1: Email Auth Not Enabled

**Error:** "Failed to fetch" or "Email provider is disabled"

**Solution:**
- Go to Supabase → Authentication → Providers → Email
- Toggle "Enable Email provider" to ON
- Click Save

### Issue 2: Wrong Site URL

**Error:** CORS errors or connection refused

**Solution:**
- Go to Supabase → Authentication → URL Configuration
- Set Site URL to: `http://localhost:19006`
- Add redirect URL: `http://localhost:19006`

### Issue 3: Invalid Credentials

**Error:** "Invalid API key" or "Invalid credentials"

**Solution:**
- Check your `.env` file has correct values
- Verify in Supabase dashboard → Settings → API
- Make sure you're using the **anon/public** key (not service role key)

### Issue 4: Network/CORS Issues

**Error:** "Failed to fetch" or CORS errors

**Solution:**
- Check your internet connection
- Make sure Supabase project is active (not paused)
- Try clearing browser cache
- Check browser console for detailed error

---

## ✅ Test After Fixing

1. Refresh your browser
2. Try signing up with a new email
3. Check browser console (F12) for any errors
4. If it works, you'll see the game after login!

---

## 📝 Still Not Working?

Check these:
- [ ] Email provider is enabled in Supabase
- [ ] Site URL is set to `http://localhost:19006`
- [ ] Redirect URLs include `http://localhost:19006`
- [ ] `.env` file has correct credentials
- [ ] Server was restarted after changing `.env`
- [ ] Browser console shows no CORS errors
- [ ] Internet connection is working

If all checked and still not working, check the browser console (F12) for the exact error message.
