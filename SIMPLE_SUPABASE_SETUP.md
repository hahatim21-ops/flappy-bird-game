# Simple Supabase Connection Guide

This guide shows you how to connect your Flappy Bird game to Supabase **without requiring login**. The game will work normally, and Supabase will be ready for future features like saving scores.

## 🎯 What This Does

- Connects your game to Supabase
- Game works without login (no authentication required)
- Supabase is ready for features like:
  - Saving high scores
  - Creating leaderboards
  - Storing game statistics

---

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign up"**
3. Sign up using GitHub, Email, or Google
4. After signing in, click **"New Project"**
5. Fill in:
   - **Project Name**: `flappy-bird-game` (or any name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
6. Click **"Create new project"**
7. Wait 2-3 minutes for setup

---

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, click **⚙️ Settings** (bottom left)
2. Click **"API"** in the settings menu
3. You'll see two important values:

   **a) Project URL**
   - Looks like: `https://xxxxxxxxxxxxx.supabase.co`
   - Click the **copy icon** 📋 next to it
   - Save this somewhere

   **b) anon public key**
   - A long string starting with `eyJ...`
   - Click the **copy icon** 📋 next to "anon public"
   - Save this somewhere

---

## Step 3: Add Credentials to Your Game

You have two options:

### Option A: Using Environment Variables (Recommended)

1. In your project folder (`C:\Users\Hatim\Downloads\flappy bird`), create a file named `.env`
   - Right-click → New → Text Document
   - Name it exactly `.env` (including the dot at the start)
   - Windows might warn you - click "Yes"

2. Open `.env` in Notepad or any text editor

3. Add these two lines (replace with your actual values):
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REFERENCE.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-actual-anon-key
   ```

4. **Replace the values:**
   - `YOUR_PROJECT_REFERENCE` → Your actual Supabase project reference (the part before `.supabase.co`)
   - `eyJ...your-actual-anon-key` → Your actual anon key from Supabase

5. **Example:**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.example-key-here
   ```

6. Save the file

### Option B: Direct Configuration

1. Open `lib/supabase.js` in your project
2. Find these lines:
   ```javascript
   const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL';
   const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
   ```
3. Replace with your actual values:
   ```javascript
   const SUPABASE_URL = 'https://YOUR_PROJECT_REFERENCE.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...your-actual-anon-key';
   ```
4. Save the file

---

## Step 4: Test the Connection

1. **Restart your development server:**
   - Stop the current server (press `Ctrl+C` in the terminal)
   - Run: `npm run web`

2. **Check the browser console:**
   - Open your browser to `http://localhost:19006`
   - Press `F12` to open Developer Tools
   - Click the "Console" tab
   - You should see: `✅ Supabase connected successfully!` or `ℹ️ Supabase configured but connection test skipped`

3. **Play the game:**
   - The game should work normally
   - No login required
   - Supabase is now connected and ready to use!

---

## ✅ Success Checklist

- [ ] Supabase project created
- [ ] Credentials copied (URL and anon key)
- [ ] Credentials added to project (`.env` file or `lib/supabase.js`)
- [ ] Server restarted
- [ ] Game works normally
- [ ] Console shows Supabase connection message

---

## 🎮 Using Supabase in Your Game (Future)

Now that Supabase is connected, you can add features like:

### Example: Save High Score

```javascript
import { supabase } from './lib/supabase';

// Save a high score
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

### Example: Get Leaderboard

```javascript
// Get top 10 scores
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
  }
};
```

---

## 🐛 Troubleshooting

### Problem: "Invalid API key" Error

**Solution:**
- Check that you copied the **anon/public** key (not service role key)
- Make sure there are no extra spaces or quotes
- Verify the URL is correct

### Problem: Still Shows "Supabase not configured"

**Solution:**
- Make sure you replaced the placeholder values
- If using `.env` file, make sure it's in the project root folder
- Restart the development server after making changes
- Check that the URL doesn't contain "YOUR_" in it

### Problem: Game Not Loading

**Solution:**
- The game should work even if Supabase isn't configured
- Check browser console for errors (F12)
- Make sure all dependencies are installed: `npm install`

---

## 📝 Important Notes

- **No Login Required**: The game works without authentication
- **Optional**: Supabase connection is optional - game works standalone too
- **Security**: The anon key is safe to use in client-side code
- **Future Features**: You can add authentication later if needed

---

## 🎯 Next Steps (Optional)

Once Supabase is connected, you can:
1. Create database tables for scores
2. Add functions to save/load data
3. Build a leaderboard
4. Track game statistics

---

**That's it!** Your game is now connected to Supabase and ready for future features. The game works exactly as before - no login required!
