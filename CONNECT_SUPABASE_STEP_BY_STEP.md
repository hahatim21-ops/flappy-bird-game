# Step-by-Step Guide: Connect Supabase to Your Flappy Bird Game

## ✅ Current Status

Your Supabase credentials are already configured! You just need to restart the server to activate the connection.

---

## Step 1: Verify Your Supabase Credentials

Your `.env` file should look like this:

```env
EXPO_PUBLIC_SUPABASE_URL=https://qyzzlvvqeydmywvpnyis.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **Your credentials are already set up!**

---

## Step 2: Restart Your Development Server

The server needs to be restarted to load the environment variables from `.env`.

### 2.1 Stop the Current Server

1. Open your terminal/command prompt
2. If the server is running, press `Ctrl+C` to stop it
3. Wait for it to fully stop

### 2.2 Start the Server Again

1. Make sure you're in your project folder:
   ```bash
   cd "C:\Users\Hatim\Downloads\flappy bird"
   ```

2. Start the server:
   ```bash
   npm run web
   ```

3. Wait 10-15 seconds for it to compile

---

## Step 3: Verify the Connection

### 3.1 Open Your Game

1. Open your browser
2. Go to: `http://localhost:19006`
3. The game should load normally

### 3.2 Check Browser Console

1. **Press F12** to open Developer Tools
2. Click the **"Console"** tab
3. Look for one of these messages:

   ✅ **"Supabase connected successfully!"**
   - This means Supabase is fully connected and working!

   ℹ️ **"Supabase configured but connection test skipped"**
   - This is also good! Supabase is configured (this message appears because the test table doesn't exist, which is normal)

   ❌ **"Supabase not configured - game works in standalone mode"**
   - This means the `.env` file isn't being loaded. Make sure you restarted the server.

---

## Step 4: Test Supabase Connection (Optional)

You can test if Supabase is working by adding this code temporarily to your game.

### 4.1 Quick Test in Browser Console

1. Open the game in your browser
2. Press F12 → Console tab
3. Type this and press Enter:
   ```javascript
   // This will test if Supabase is accessible
   console.log('Testing Supabase...');
   ```

### 4.2 Check the Connection Status

Look at the console messages when the page loads. You should see a message about Supabase connection status.

---

## ✅ Success Checklist

After completing the steps above, verify:

- [ ] `.env` file exists with correct format
- [ ] Server restarted after creating/updating `.env`
- [ ] Game loads at `http://localhost:19006`
- [ ] Browser console shows Supabase connection message
- [ ] No errors in the browser console

---

## 🎮 What You Can Do Now

Now that Supabase is connected, you can:

### 1. Save High Scores

Create a function to save scores to Supabase:

```javascript
import { supabase } from './lib/supabase';

const saveHighScore = async (score) => {
  const { data, error } = await supabase
    .from('scores')
    .insert([{ score: score, created_at: new Date().toISOString() }]);
  
  if (error) {
    console.error('Error saving score:', error);
  } else {
    console.log('Score saved!', data);
  }
};
```

### 2. Create a Leaderboard

Get top scores from Supabase:

```javascript
const getLeaderboard = async () => {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .order('score', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error getting leaderboard:', error);
  } else {
    console.log('Leaderboard:', data);
    return data;
  }
};
```

### 3. Store Game Statistics

Track how many games played, total score, etc.

---

## 🗄️ Setting Up Database Tables (If Needed)

If you want to save data, you'll need to create tables in Supabase:

### Create a Scores Table

1. Go to your Supabase dashboard
2. Click **"Table Editor"** in the left sidebar
3. Click **"New Table"**
4. Name it: `scores`
5. Add columns:
   - `id` (type: uuid, default: auto-generate)
   - `score` (type: int8)
   - `created_at` (type: timestamp, default: now())
6. Click **"Save"**

Now you can use the `saveHighScore` function above!

---

## 🐛 Troubleshooting

### Problem: Console shows "Supabase not configured"

**Solution:**
1. Check that `.env` file exists in your project root
2. Verify the format is correct (see Step 1)
3. Make sure you restarted the server after creating/updating `.env`
4. Try stopping the server completely and starting again

### Problem: Game doesn't load

**Solution:**
1. Check browser console (F12) for errors
2. Make sure server is running on port 19006
3. Try refreshing the page (Ctrl+R or F5)
4. Check terminal for compilation errors

### Problem: Environment variables not loading

**Solution:**
1. Make sure `.env` file is in the project root (same folder as `package.json`)
2. Restart the server completely
3. Check that variable names start with `EXPO_PUBLIC_`
4. Make sure there are no spaces around the `=` sign

---

## 📝 Quick Reference

**Your Supabase Project:**
- URL: `https://qyzzlvvqeydmywvpnyis.supabase.co`
- Status: ✅ Configured

**To Use Supabase in Your Code:**
```javascript
import { supabase } from './lib/supabase';

// Example: Save data
await supabase.from('table_name').insert([{ data: 'value' }]);

// Example: Get data
const { data } = await supabase.from('table_name').select('*');
```

---

## 🎯 Next Steps

1. ✅ Supabase is connected
2. 🎮 Game works normally
3. 📊 You can now add features like:
   - High score saving
   - Leaderboards
   - User statistics
   - Game history

**Your Supabase is ready to use!** 🚀
