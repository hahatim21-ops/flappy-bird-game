# Debug Supabase Connection - Step by Step

## 🔍 Step 1: Check Browser Console

1. Open your game: `http://localhost:19006`
2. Press **F12** to open Developer Tools
3. Click **"Console"** tab
4. Look for these messages:
   - ✅ **"Supabase client initialized"** = Good!
   - ✅ **"Supabase connection test passed"** = Connected!
   - ❌ **"Supabase connection test failed"** = Problem!
   - ❌ **"Failed to fetch"** = Connection issue

## 🔍 Step 2: Check Network Tab

1. In Developer Tools, click **"Network"** tab
2. Try to sign up again
3. Look for requests to `supabase.co`
4. Check if they show:
   - ✅ **Status 200** = Success
   - ❌ **Status 0 or Failed** = Connection blocked
   - ❌ **CORS error** = URL configuration issue

## 🔍 Step 3: Verify Supabase URL Configuration

Go to Supabase Dashboard:

1. **Authentication** → **URL Configuration**
2. Check **"Site URL"** is: `http://localhost:19006`
3. Check **"Redirect URLs"** includes: `http://localhost:19006`
4. If missing, add them and **Save**

## 🔍 Step 4: Check Email Provider Settings

1. **Authentication** → **Providers** → **Email**
2. Verify:
   - ✅ **"Enable Email provider"** is **ON**
   - ✅ **"Confirm email"** is **OFF** (for testing)
3. Click **"Save"**

## 🔍 Step 5: Test Connection Directly

In browser console (F12 → Console), paste this:

```javascript
// Test Supabase connection
const testUrl = 'https://qyzzlvvqeydmywvpnyis.supabase.co';
fetch(testUrl + '/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5enpsdnZxZXlkbXl3dnBueWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDU0NzEsImV4cCI6MjA4MzQyMTQ3MX0.OzvenQU3FmMhq4STaCREG3Ev_41FGLA5Rok6luPqFXE'
  }
})
.then(r => console.log('✅ Connection OK:', r.status))
.catch(e => console.error('❌ Connection Failed:', e));
```

## 🔍 Step 6: Check Server Logs

Look at your terminal where `npm run web` is running:
- Check for any errors
- Make sure it says "Compiled successfully"

## 🐛 Common Issues

### Issue: "Failed to fetch" in Console

**Possible causes:**
1. **CORS Error** → Check URL Configuration in Supabase
2. **Network Error** → Check internet connection
3. **Wrong URL** → Verify .env file has correct URL
4. **Server not running** → Restart server

**Solution:**
- Check browser console for exact error
- Verify Supabase URL Configuration
- Restart server: `npm run web`

### Issue: "Invalid API key"

**Solution:**
- Check .env file has correct key
- Restart server after changing .env
- Verify key in Supabase Dashboard → Settings → API

### Issue: "Email provider not enabled"

**Solution:**
- Go to Supabase → Authentication → Providers → Email
- Enable Email provider
- Save

---

## ✅ Quick Checklist

- [ ] Browser console shows "Supabase client initialized"
- [ ] Browser console shows "Supabase connection test passed"
- [ ] No CORS errors in Network tab
- [ ] Supabase URL Configuration has `http://localhost:19006`
- [ ] Email provider is enabled
- [ ] Server is running and compiled successfully
- [ ] .env file has correct credentials

---

**After checking these, tell me what you see in the browser console!**
