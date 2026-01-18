# Multiplayer Flappy Bird - Setup Guide

## Overview
This implementation adds real-time multiplayer support to the Flappy Bird game WITHOUT modifying existing single-player mechanics. Multiplayer is an ADD-ON layer that works alongside the existing game.

## Database Setup

1. **Run the SQL schema** in your Supabase SQL Editor:
   - Open `multiplayer_schema.sql`
   - Copy and paste the entire contents into Supabase SQL Editor
   - Click "Run"

2. **Enable Realtime** (if not already enabled):
   - Go to Database > Replication in Supabase Dashboard
   - Ensure `rooms` and `room_players` tables are enabled for Realtime

## Files Created

### Core Multiplayer Files:
- `lib/MultiplayerService.js` - Room management and real-time sync
- `lib/SeededRandom.js` - Seeded random number generator for synchronized pipes

### UI Components:
- `components/multiplayer/RoomScreen.js` - Create/Join room screen
- `components/multiplayer/AvatarSelectScreen.js` - Color-based avatar selection
- `components/multiplayer/LobbyScreen.js` - Pre-game lobby with ready status
- `components/multiplayer/MultiplayerFlappyBirdGame.js` - Multiplayer game wrapper
- `components/multiplayer/MultiplayerGameOver.js` - Leaderboard screen

### Database:
- `multiplayer_schema.sql` - Database schema for rooms and players

## How It Works

### Single-Player Mode (Unchanged)
- Existing `FlappyBirdGame.js` works exactly as before
- No changes to physics, collision, or game logic
- All existing features preserved

### Multiplayer Mode (New)
1. **Room Creation/Join** - User creates or joins a room with 6-character code
2. **Avatar Selection** - Choose bird color (yellow, red, blue, green, black)
3. **Lobby** - Wait for players, ready up (max 5 players)
4. **Game Start** - Host starts game with 3-2-1 countdown
5. **Synchronized Pipes** - All players see identical pipes using shared random seed
6. **Real-time Sync** - Only events are synced (flap, score, hit), not frame-by-frame movement
7. **Game End** - Leaderboard shows when all players are dead or host finishes

## Key Features

✅ **Non-intrusive** - Single-player mode completely unchanged
✅ **Real-time sync** - Uses Supabase Realtime subscriptions
✅ **Synchronized pipes** - Shared random seed ensures identical pipes
✅ **Event-based** - Only syncs meaningful events, not frame updates
✅ **Room system** - 6-character codes for easy room sharing
✅ **Max 5 players** - Prevents overcrowding

## Usage

1. Click "🎮 Multiplayer" button in top bar
2. Create or join a room
3. Select avatar color
4. Wait in lobby, ready up
5. Host starts game
6. Play! (see other players' birds as transparent overlays)
7. Leaderboard at end

## Important Notes

- **Physics remain local** - Each client handles its own physics
- **Collision detection is local** - No server-side collision checks
- **Pipes are synchronized** - Using seeded random number generator
- **Only events sync** - Flap, score, hit events broadcast via Supabase
- **Cleanup on disconnect** - Rooms and subscriptions cleaned up properly

## Testing

1. Open game in multiple browser tabs/windows
2. Each tab = one player
3. One player creates room, others join with code
4. Test ready status, game start, and real-time sync

## Future Enhancements (Optional)

- Spectator mode
- Chat in lobby
- Best-of-3 matches
- Tournament brackets
- Reconnection handling
