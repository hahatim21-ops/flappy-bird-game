# Fix "Failed to fetch" Login Error - Step by Step

The "Failed to fetch" error means Supabase can't connect for authentication. Follow these steps:

## ✅ Step 1: Enable Email Authentication

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **"Flappy Bird Game"**
3. Click **"Authentication"** in the left sidebar
4. Click **"Providers"** tab
5. Find **"Email"** in the list (should be at the top)
6. Make sure **"Enable Email provider"** toggle is **ON** (green)
7. If it's OFF, click it to turn it ON
8. Click **"Save"** at the bottom

## ✅ Step 2: Configure Site URL

1. Still in Supabase Dashboard → **Authentication**
2. Click **"URL Configuration"** tab
3. Under **"Site URL"**, set it to:
   ```
   http://localhost:19006
   ```
4. Under **"Redirect URLs"**, click **"Add URL"** and add:
   ```
   http://localhost:19006
   ```
5. Also add:
   ```
   http://localhost:8081
   ```
6. Click **"Save"** after adding each URL

## ✅ Step 3: Check Email Settings (Optional)

1. In Supabase → **Authentication** → **Email Templates**
2. Make sure email confirmation is set up (or disable it for testing)

**To disable email confirmation (for testing):**
1. Go to **Authentication** → **Providers** → **Email**
2. Find **"Confirm email"** toggle
3. Turn it **OFF** (for testing - users can login immediately)
4. Click **"Save"**

## ✅ Step 4: Verify Your Credentials

1. Go to **Settings** → **API**
2. Verify your **Project URL** matches your `.env` file:
   - Should be: `https://qyzzlvvqeydmywvpnyis.supabase.co`
3. Verify your **anon public key** is correct

## ✅ Step 5: Restart Your Server

1. Stop your server (Ctrl+C in terminal)
2. Start it again:
   ```bash
   npm run web
   ```
3. Wait 10-15 seconds for compilation

## ✅ Step 6: Test Login

1. Open `http://localhost:19006` in your browser
2. Press **F12** → **Console** tab
3. Try to sign up:
   - Enter an email: `test@example.com`
   - Enter a password: `password123` (at least 6 characters)
   - Click **"Sign Up"**
4. Check the console for errors

## 🐛 Common Issues

### Issue: Still "Failed to fetch"

**Check:**
- [ ] Email provider is enabled
- [ ] Site URL is set to `http://localhost:19006`
- [ ] Redirect URLs include `http://localhost:19006`
- [ ] Server was restarted
- [ ] Browser console shows no CORS errors

**Try:**
- Clear browser cache (Ctrl+Shift+Delete)
- Try in incognito/private window
- Check browser console (F12) for detailed error

### Issue: "Email not confirmed"

**Solution:**
- Disable email confirmation in Authentication → Providers → Email
- Or check your email for confirmation link

### Issue: "Invalid login credentials"

**Solution:**
- Make sure password is at least 6 characters
- Try creating a new account first
- Check that email format is correct

---

## ✅ Quick Checklist

- [ ] Email provider enabled in Supabase
- [ ] Site URL configured: `http://localhost:19006`
- [ ] Redirect URLs added
- [ ] Email confirmation disabled (for testing)
- [ ] Server restarted
- [ ] Browser refreshed
- [ ] Console checked for errors

---

**After completing these steps, login should work!** 🎉
