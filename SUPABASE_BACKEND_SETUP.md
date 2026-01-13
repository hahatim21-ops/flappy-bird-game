# Complete Supabase Backend Setup Guide

This guide will help you set up your Supabase database to store game data like scores, statistics, and leaderboards.

---

## 📋 Step-by-Step Setup

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"** button

### Step 2: Run the Setup SQL

1. Open the file `supabase_setup.sql` in your project folder
2. Copy **ALL** the SQL code from that file
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** button (or press Ctrl+Enter)
5. Wait for it to complete (should take a few seconds)

**✅ You should see:** "Success. No rows returned"

### Step 3: Verify Tables Were Created

1. In Supabase dashboard, click **"Table Editor"** in the left sidebar
2. You should see two new tables:
   - ✅ **scores** - Stores individual game scores
   - ✅ **game_stats** - Stores user statistics

---

## 📊 What Was Created

### Tables

1. **scores** - Stores each game score
   - `id` - Unique score ID
   - `user_id` - User who got the score
   - `score` - The score value
   - `created_at` - When the score was achieved

2. **game_stats** - Stores aggregated statistics
   - `id` - Unique stat ID
   - `user_id` - User ID
   - `total_games` - Total games played
   - `total_score` - Sum of all scores
   - `best_score` - Highest score achieved
   - `total_pipes_passed` - Total pipes passed
   - `updated_at` - Last update time
   - `created_at` - When stats were created

### Views

- **leaderboard** - Shows top scores with user information

### Functions

- **save_score_and_update_stats()** - Saves a score and updates stats automatically
- **get_user_stats()** - Gets current user's statistics
- **get_top_scores()** - Gets top scores for leaderboard

### Security

- **Row Level Security (RLS)** enabled
- Users can only modify their own data
- Anyone can view leaderboards

---

## 🎮 How to Use in Your Game

### Example 1: Save a Score

```javascript
import { supabase } from './lib/supabase';

const saveScore = async (score, pipesPassed = 0) => {
  try {
    const { data, error } = await supabase.rpc('save_score_and_update_stats', {
      p_score: score,
      p_pipes_passed: pipesPassed
    });

    if (error) {
      console.error('Error saving score:', error);
      return null;
    }

    console.log('Score saved!', data);
    return data;
  } catch (err) {
    console.error('Error:', err);
    return null;
  }
};

// Use it in your game:
// saveScore(25, 10); // Score: 25, Pipes passed: 10
```

### Example 2: Get User Statistics

```javascript
const getUserStats = async () => {
  try {
    const { data, error } = await supabase.rpc('get_user_stats');

    if (error) {
      console.error('Error getting stats:', error);
      return null;
    }

    return data[0]; // Returns: { total_games, total_score, best_score, total_pipes_passed }
  } catch (err) {
    console.error('Error:', err);
    return null;
  }
};
```

### Example 3: Get Leaderboard

```javascript
const getLeaderboard = async (limit = 10) => {
  try {
    const { data, error } = await supabase.rpc('get_top_scores', {
      p_limit: limit
    });

    if (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }

    return data; // Array of top scores
  } catch (err) {
    console.error('Error:', err);
    return [];
  }
};
```

### Example 4: Get User's Recent Scores

```javascript
const getUserScores = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting scores:', error);
      return [];
    }

    return data;
  } catch (err) {
    console.error('Error:', err);
    return [];
  }
};
```

---

## 🔧 Integrating with Your Game

### Save Score When Game Ends

Add this to your `FlappyBirdGame.js` component:

```javascript
import { supabase } from './lib/supabase';

// In your handleRestart or game over handler:
const saveGameScore = async (finalScore) => {
  try {
    // Count pipes passed (same as score)
    const pipesPassed = finalScore;
    
    const { data, error } = await supabase.rpc('save_score_and_update_stats', {
      p_score: finalScore,
      p_pipes_passed: pipesPassed
    });

    if (error) {
      console.error('Error saving score:', error);
    } else {
      console.log('✅ Score saved to Supabase!');
    }
  } catch (err) {
    console.error('Error saving score:', err);
  }
};

// Call it when game ends:
// saveGameScore(score);
```

---

## 📊 View Your Data

### In Supabase Dashboard

1. Go to **"Table Editor"** in Supabase
2. Click on **"scores"** table to see all scores
3. Click on **"game_stats"** to see user statistics
4. Click on **"SQL Editor"** → Run: `SELECT * FROM leaderboard LIMIT 10;`

---

## 🧪 Test Your Setup

### Test 1: Save a Score

1. Login to your game
2. Play and get a score
3. Check Supabase → Table Editor → scores
4. You should see your score!

### Test 2: Check Statistics

1. After playing a few games
2. Check Supabase → Table Editor → game_stats
3. You should see your total games, best score, etc.

### Test 3: View Leaderboard

1. In Supabase SQL Editor, run:
   ```sql
   SELECT * FROM leaderboard LIMIT 10;
   ```
2. You should see top scores!

---

## 🎯 Next Steps

Now you can:
- ✅ Save scores automatically when game ends
- ✅ Show user statistics in the game
- ✅ Create a leaderboard component
- ✅ Track game history
- ✅ Show personal best scores

---

## 🐛 Troubleshooting

**Error: "function does not exist"**
- Make sure you ran the SQL setup script completely
- Check SQL Editor for any errors

**Error: "permission denied"**
- Make sure RLS policies were created
- Check that user is authenticated

**Error: "relation does not exist"**
- Make sure tables were created
- Check Table Editor to verify tables exist

---

## 📝 Quick Reference

**Save Score:**
```javascript
await supabase.rpc('save_score_and_update_stats', { p_score: 25, p_pipes_passed: 10 });
```

**Get User Stats:**
```javascript
const { data } = await supabase.rpc('get_user_stats');
```

**Get Leaderboard:**
```javascript
const { data } = await supabase.rpc('get_top_scores', { p_limit: 10 });
```

**Get User Scores:**
```javascript
const { data } = await supabase.from('scores').select('*').order('score', { ascending: false });
```

---

**Your Supabase backend is now ready to store game data!** 🎉
