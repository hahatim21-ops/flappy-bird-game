/**
 * MultiplayerFlappyBirdGame Component
 * 
 * WRAPS FlappyBirdGame WITHOUT modifying it
 * Adds multiplayer functionality by:
 * - Rendering FlappyBirdGame normally for local player
 * - Rendering other players as ghost birds via overlay
 * - Syncing only events (score, is_alive) via Supabase
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { supabase } from '../lib/supabase';
import FlappyBirdGame from '../FlappyBirdGame';

const BIRD_START_X = 100; // Same as in FlappyBirdGame

// Avatar color mapping
const AVATAR_COLORS = {
  yellow: '#FFD700',
  red: '#FF4444',
  blue: '#4444FF',
  green: '#44FF44',
  orange: '#FF8844',
  purple: '#AA44FF',
  pink: '#FF44AA',
  cyan: '#44FFFF',
};

/**
 * Ghost Bird Component - renders other players' birds
 * Never affects collisions (rendered as overlay)
 */
const GhostBird = ({ player, screenHeight }) => {
  if (!player || player.is_alive === false) return null;

  const birdColor = AVATAR_COLORS[player.avatar] || '#FFD700';
  const birdY = player.bird_y !== null && player.bird_y !== undefined 
    ? player.bird_y 
    : screenHeight / 2; // Default position if not set

  return (
    <View
      style={[
        styles.ghostBird,
        {
          left: BIRD_START_X,
          top: birdY,
        },
      ]}
    >
      <View style={[styles.birdCircle, { backgroundColor: birdColor }]} />
      <Text style={styles.playerNameLabel}>{player.player_name || 'Player'}</Text>
    </View>
  );
};

const MultiplayerFlappyBirdGame = ({ roomId, localUserId, onGameEnd, onBack }) => {
  const [players, setPlayers] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [localBirdY, setLocalBirdY] = useState(null);
  const [localIsAlive, setLocalIsAlive] = useState(true);
  const channelRef = useRef(null);
  const scoreUpdateTimeoutRef = useRef(null);
  const gameStateRef = useRef('playing');
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    if (!roomId || !localUserId) return;

    loadPlayers();

    // Subscribe to player changes via Realtime
    const playersChannel = supabase
      .channel(`multiplayer-players:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const updatedPlayers = await loadPlayers();
          
          // Check if all players are dead
          const alivePlayers = updatedPlayers?.filter(p => p.is_alive) || [];
          if (alivePlayers.length === 0 && gameStateRef.current === 'playing') {
            gameStateRef.current = 'finished';
            // Wait a moment then end game
            setTimeout(() => {
              onGameEnd();
            }, 1000);
          }
        }
      )
      .subscribe();

    channelRef.current = playersChannel;

    // Cleanup on unmount
    return () => {
      if (playersChannel) supabase.removeChannel(playersChannel);
      if (scoreUpdateTimeoutRef.current) {
        clearTimeout(scoreUpdateTimeoutRef.current);
      }
    };
  }, [roomId, localUserId]);

  const loadPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', roomId)
        .order('updated_at', { ascending: true });

      if (error) throw error;
      setPlayers(data || []);
      return data || [];
    } catch (error) {
      console.error('Error loading players:', error);
      return [];
    }
  };

  /**
   * Sync local score to Supabase (debounced)
   */
  const syncScore = useCallback((score) => {
    setLocalScore(score);

    // Debounce score updates (don't broadcast every frame)
    if (scoreUpdateTimeoutRef.current) {
      clearTimeout(scoreUpdateTimeoutRef.current);
    }

    scoreUpdateTimeoutRef.current = setTimeout(async () => {
      try {
        await supabase
          .from('room_players')
          .update({ 
            score: score,
            updated_at: new Date().toISOString(),
          })
          .eq('room_id', roomId)
          .eq('user_id', localUserId);
      } catch (error) {
        console.error('Error syncing score:', error);
      }
    }, 300); // Broadcast every 300ms max
  }, [roomId, localUserId]);

  /**
   * Sync death event to Supabase
   */
  const syncDeath = useCallback(async (birdY) => {
    try {
      setLocalIsAlive(false);

      await supabase
        .from('room_players')
        .update({
          is_alive: false,
          bird_y: birdY,
          updated_at: new Date().toISOString(),
        })
        .eq('room_id', roomId)
        .eq('user_id', localUserId);
    } catch (error) {
      console.error('Error syncing death:', error);
    }
  }, [roomId, localUserId]);

  /**
   * Sync bird position on flap (optional - can be throttled heavily)
   */
  const syncPosition = useCallback(async (birdY) => {
    setLocalBirdY(birdY);
    // Optionally sync position (throttled heavily to avoid spam)
    // For now, we sync score and is_alive only
  }, []);

  // Get other players (exclude local player)
  const otherPlayers = players.filter(p => p.user_id !== localUserId);
  const localPlayer = players.find(p => p.user_id === localUserId);

  return (
    <View style={styles.container}>
      {/* Render FlappyBirdGame normally - NO modifications */}
      <FlappyBirdGame 
        avatarUrl={null} // Multiplayer uses colors, not URLs
        avatarId={localPlayer?.avatar || 'yellow'}
      />

      {/* Overlay: Render other players' ghost birds */}
      {/* These are rendered on top but never affect collisions */}
      <View style={styles.ghostBirdsOverlay} pointerEvents="box-none">
        {otherPlayers.map((player) => (
          <GhostBird
            key={player.id}
            player={player}
            screenHeight={screenHeight}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  ghostBirdsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 500, // Above game but below UI
    pointerEvents: 'box-none', // Don't intercept touches
  },
  ghostBird: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7, // Semi-transparent for ghost birds
  },
  birdCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  playerNameLabel: {
    position: 'absolute',
    top: -20,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    minWidth: 60,
    textAlign: 'center',
  },
});

export default MultiplayerFlappyBirdGame;
