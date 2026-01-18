/**
 * MultiplayerService
 * 
 * Handles all multiplayer functionality:
 * - Room creation and joining
 * - Real-time synchronization via Supabase Realtime
 * - Player state management
 * - Event broadcasting (flap, score, hit)
 */

import { supabase } from './supabase';

class MultiplayerService {
  constructor() {
    this.roomId = null;
    this.userId = null;
    this.roomSubscription = null;
    this.playersSubscription = null;
    this.onRoomStateChange = null;
    this.onPlayersChange = null;
    this.onPlayerEvent = null;
  }

  /**
   * Initialize the service with user ID
   */
  async initialize(userId) {
    this.userId = userId;
  }

  /**
   * Generate a 6-character alphanumeric room code
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create a new room
   */
  async createRoom(roomCode) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate random seed for synchronized pipe generation
      const randomSeed = Math.floor(Math.random() * 1000000);

      const { data: room, error } = await supabase
        .from('rooms')
        .insert({
          code: roomCode,
          host_id: user.id,
          state: 'waiting',
          random_seed: randomSeed,
        })
        .select()
        .single();

      if (error) throw error;

      this.roomId = room.id;
      this.setupSubscriptions();
      return { success: true, room };
    } catch (error) {
      console.error('Error creating room:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Join an existing room by code
   */
  async joinRoom(roomCode) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Find room by code
      const { data: rooms, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode.toUpperCase())
        .eq('state', 'waiting')
        .limit(1);

      if (roomError) throw roomError;
      if (!rooms || rooms.length === 0) {
        return { success: false, error: 'Room not found or already started' };
      }

      const room = rooms[0];

      // Check if room is full (max 5 players)
      const { data: players, error: playersError } = await supabase
        .from('room_players')
        .select('id')
        .eq('room_id', room.id);

      if (playersError) throw playersError;
      if (players && players.length >= 5) {
        return { success: false, error: 'Room is full (maximum 5 players)' };
      }

      // Check if player already in room
      const existingPlayer = players?.find(p => p.user_id === user.id);
      if (existingPlayer) {
        this.roomId = room.id;
        this.setupSubscriptions();
        return { success: true, room };
      }

      this.roomId = room.id;
      this.setupSubscriptions();
      return { success: true, room };
    } catch (error) {
      console.error('Error joining room:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add current user as a player to the room
   */
  async addPlayer(playerName, avatarColor) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !this.roomId) throw new Error('Not authenticated or no room');

      const { error } = await supabase
        .from('room_players')
        .upsert({
          room_id: this.roomId,
          user_id: user.id,
          player_name: playerName,
          avatar_color: avatarColor,
          is_ready: false,
          is_alive: true,
          score: 0,
        }, {
          onConflict: 'room_id,user_id',
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error adding player:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set player ready status
   */
  async setReady(isReady) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !this.roomId) throw new Error('Not authenticated or no room');

      const { error } = await supabase
        .from('room_players')
        .update({ is_ready: isReady })
        .eq('room_id', this.roomId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error setting ready:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start the game (host only)
   */
  async startGame() {
    try {
      if (!this.roomId) throw new Error('No room');

      const { error } = await supabase
        .from('rooms')
        .update({ state: 'starting' })
        .eq('id', this.roomId);

      if (error) throw error;

      // After countdown, set to 'playing'
      setTimeout(async () => {
        await supabase
          .from('rooms')
          .update({ state: 'playing' })
          .eq('id', this.roomId);
      }, 3000); // 3 second countdown

      return { success: true };
    } catch (error) {
      console.error('Error starting game:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update player score
   */
  async updateScore(score) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !this.roomId) return;

      await supabase
        .from('room_players')
        .update({ score })
        .eq('room_id', this.roomId)
        .eq('user_id', user.id);

      // Also broadcast as event
      await this.broadcastEvent('score', { score });
    } catch (error) {
      console.error('Error updating score:', error);
    }
  }

  /**
   * Broadcast player death
   */
  async broadcastHit(birdY) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !this.roomId) return;

      await supabase
        .from('room_players')
        .update({
          is_alive: false,
          bird_y: birdY,
        })
        .eq('room_id', this.roomId)
        .eq('user_id', user.id);

      await this.broadcastEvent('hit', { birdY });
    } catch (error) {
      console.error('Error broadcasting hit:', error);
    }
  }

  /**
   * Broadcast flap event
   */
  async broadcastFlap(birdY) {
    try {
      if (!this.roomId) return;
      await this.broadcastEvent('flap', { birdY });
    } catch (error) {
      console.error('Error broadcasting flap:', error);
    }
  }

  /**
   * Generic event broadcaster (using a separate events table or just player updates)
   * For simplicity, we'll use player updates as events
   */
  async broadcastEvent(eventType, data) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !this.roomId) return;

      // Update player's bird_y to broadcast position change
      if (data.birdY !== undefined) {
        await supabase
          .from('room_players')
          .update({ bird_y: data.birdY, updated_at: new Date().toISOString() })
          .eq('room_id', this.roomId)
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error broadcasting event:', error);
    }
  }

  /**
   * Get room data
   */
  async getRoom() {
    try {
      if (!this.roomId) return null;

      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', this.roomId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting room:', error);
      return null;
    }
  }

  /**
   * Get all players in the room
   */
  async getPlayers() {
    try {
      if (!this.roomId) return [];

      const { data, error } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', this.roomId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting players:', error);
      return [];
    }
  }

  /**
   * Setup Supabase Realtime subscriptions
   */
  setupSubscriptions() {
    if (!this.roomId) return;

    // Subscribe to room state changes
    this.roomSubscription = supabase
      .channel(`room:${this.roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${this.roomId}`,
        },
        (payload) => {
          if (this.onRoomStateChange) {
            this.onRoomStateChange(payload.new);
          }
        }
      )
      .subscribe();

    // Subscribe to player changes
    this.playersSubscription = supabase
      .channel(`players:${this.roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${this.roomId}`,
        },
        async () => {
          const players = await this.getPlayers();
          if (this.onPlayersChange) {
            this.onPlayersChange(players);
          }

          // Check for player events (bird_y changes indicate flap)
          players.forEach((player) => {
            if (player.user_id !== this.userId && player.bird_y !== null) {
              if (this.onPlayerEvent) {
                this.onPlayerEvent({
                  playerId: player.user_id,
                  type: 'position',
                  birdY: player.bird_y,
                });
              }
            }
          });
        }
      )
      .subscribe();
  }

  /**
   * Leave the room
   */
  async leaveRoom() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !this.roomId) return;

      // Remove player from room
      await supabase
        .from('room_players')
        .delete()
        .eq('room_id', this.roomId)
        .eq('user_id', user.id);

      // Clean up subscriptions
      this.cleanup();

      return { success: true };
    } catch (error) {
      console.error('Error leaving room:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up subscriptions
   */
  cleanup() {
    if (this.roomSubscription) {
      supabase.removeChannel(this.roomSubscription);
      this.roomSubscription = null;
    }
    if (this.playersSubscription) {
      supabase.removeChannel(this.playersSubscription);
      this.playersSubscription = null;
    }
    this.roomId = null;
    this.onRoomStateChange = null;
    this.onPlayersChange = null;
    this.onPlayerEvent = null;
  }

  /**
   * Finish the game
   */
  async finishGame() {
    try {
      if (!this.roomId) return;

      await supabase
        .from('rooms')
        .update({ state: 'finished' })
        .eq('id', this.roomId);

      return { success: true };
    } catch (error) {
      console.error('Error finishing game:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new MultiplayerService();
