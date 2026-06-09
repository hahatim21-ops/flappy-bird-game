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
import { View, StyleSheet, Text, Image, useWindowDimensions, TouchableOpacity, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import FlappyBirdGame from '../FlappyBirdGame';
import SeededRandom from '../lib/SeededRandom';

// Import local penguin, flamingo, red, and mighty eagle avatars
const penguinAvatar = require('../assets/penguin-avatar.png');
const flamingoAvatar = require('../assets/flamingo-avatar.png');
const redAvatar = require('../assets/red-avatar.png');
const mightyEagleAvatar = require('../assets/mighty-eagle-avatar.png');

const AVATAR_SOURCES = {
  bird: { uri: 'https://www.pngall.com/wp-content/uploads/15/Flappy-Bird-PNG-Free-Image.png' },
  red: redAvatar,
  penguin: penguinAvatar,
  flamingo: flamingoAvatar,
  'mighty-eagle': mightyEagleAvatar,
};

const getBirdSize = (avatarId) => {
  switch (avatarId) {
    case 'penguin': return 120;
    case 'flamingo': return 80;
    case 'red': return 60;
    case 'mighty-eagle': return 140;
    default: return 100;
  }
};

const getAvatarUrl = (avatarId) => {
  const source = AVATAR_SOURCES[avatarId] || AVATAR_SOURCES.bird;
  if (source && source.uri) return source.uri;
  return typeof source === 'string' ? source : (source && (source.default || source));
};

const BIRD_START_X = 100; // Same as in FlappyBirdGame

/**
 * Ghost Bird Component - renders other players' birds
 * Never affects collisions (rendered as overlay)
 */
const GhostBird = ({ player, screenHeight }) => {
  if (!player || player.is_alive === false) return null;

  const avatarId = player.avatar || 'bird';
  const avatarSource = AVATAR_SOURCES[avatarId] || AVATAR_SOURCES.bird;
  const birdSize = getBirdSize(avatarId);

  const birdY = player.bird_y !== null && player.bird_y !== undefined 
    ? player.bird_y 
    : screenHeight / 2; // Default position if not set

  const rotation = player.rotation !== undefined ? player.rotation : 0;

  return (
    <View
      style={[
        styles.ghostBirdContainer,
        {
          width: birdSize,
          height: birdSize,
          left: BIRD_START_X,
          top: birdY,
          transform: [{ rotate: `${rotation}deg` }],
        },
      ]}
    >
      <Image
        source={avatarSource}
        style={styles.ghostBirdImage}
        resizeMode="contain"
      />
      <View style={styles.playerNameLabelContainer}>
        <Text style={styles.playerNameLabel}>{player.player_name || 'Player'}</Text>
      </View>
    </View>
  );
};



const MultiplayerFlappyBirdGame = ({ roomId, localUserId, onGameEnd, onBack }) => {
  const [players, setPlayers] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [localBirdY, setLocalBirdY] = useState(null);
  const [localIsAlive, setLocalIsAlive] = useState(true);
  const [roomSeed, setRoomSeed] = useState(null);
  const [seededRandom, setSeededRandom] = useState(null);
  const channelRef = useRef(null);
  const scoreUpdateTimeoutRef = useRef(null);
  const gameStateRef = useRef('playing');
  
  const [localGameState, setLocalGameState] = useState('start');
  const scoreRef = useRef(0);
  const isAliveRef = useRef(true);
  const lastBroadcastTimeRef = useRef(0);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isLeaderboardExpanded, setIsLeaderboardExpanded] = useState(false);

  // Auto-collapse leaderboard when game starts playing
  useEffect(() => {
    if (localGameState === 'playing') {
      setIsLeaderboardExpanded(false);
    }
  }, [localGameState]);

  useEffect(() => {
    if (!roomId || !localUserId) return;

    loadRoomSeed();
    loadPlayers();

    // Subscribe to player changes via Realtime with Broadcast enabled
    const playersChannel = supabase
      .channel(`multiplayer-players:${roomId}`, {
        config: {
          broadcast: { self: false }
        }
      })
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
      .on('broadcast', { event: 'position' }, ({ payload }) => {
        // payload has: { userId, birdY, rotation, score, isAlive }
        setPlayers((prevPlayers) => {
          return prevPlayers.map((p) => {
            if (p.user_id === payload.userId) {
              return {
                ...p,
                bird_y: payload.birdY,
                rotation: payload.rotation ?? 0,
                score: payload.score ?? p.score,
                is_alive: payload.isAlive ?? p.is_alive
              };
            }
            return p;
          });
        });
      })
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

  const loadRoomSeed = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('random_seed')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      
      if (data && data.random_seed) {
        setRoomSeed(data.random_seed);
        setSeededRandom(new SeededRandom(data.random_seed));
      }
    } catch (error) {
      console.error('Error loading room seed:', error);
    }
  };

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

  const syncScore = useCallback((score) => {
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
   * Handle local score changes and broadcast
   */
  const handleScoreChange = useCallback((score) => {
    scoreRef.current = score;
    setLocalScore(score);

    setPlayers((prevPlayers) => {
      return prevPlayers.map((p) => {
        if (p.user_id === localUserId) {
          return { ...p, score: score };
        }
        return p;
      });
    });

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'position',
        payload: {
          userId: localUserId,
          birdY: localBirdY,
          score: score,
          isAlive: isAliveRef.current
        }
      });
    }

    syncScore(score);
  }, [localUserId, localBirdY, syncScore]);

  /**
   * Handle local position/rotation changes and broadcast
   */
  const handleBirdYChange = useCallback((birdY, rotation) => {
    setLocalBirdY(birdY);

    const now = Date.now();
    if (now - lastBroadcastTimeRef.current >= 50) {
      lastBroadcastTimeRef.current = now;
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'position',
          payload: {
            userId: localUserId,
            birdY: birdY,
            rotation: rotation,
            score: scoreRef.current,
            isAlive: isAliveRef.current
          }
        });
      }
    }
  }, [localUserId]);

  /**
   * Handle local death and broadcast
   */
  const handleDeath = useCallback(async (birdY) => {
    try {
      setLocalIsAlive(false);
      isAliveRef.current = false;

      setPlayers((prevPlayers) => {
        return prevPlayers.map((p) => {
          if (p.user_id === localUserId) {
            return { ...p, is_alive: false, bird_y: birdY };
          }
          return p;
        });
      });

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'position',
          payload: {
            userId: localUserId,
            birdY: birdY,
            score: scoreRef.current,
            isAlive: false
          }
        });
      }

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

  // Get other players (exclude local player)
  const otherPlayers = players.filter(p => p.user_id !== localUserId);
  const localPlayer = players.find(p => p.user_id === localUserId);

  // Sole survivor rule: If there is more than 1 player in the room,
  // and only 1 player remains alive, and that player is the local player,
  // we force the local player's game to end.
  const totalPlayersInRoom = players.length;
  const alivePlayersCount = players.filter(p => p.is_alive).length;
  const shouldForceGameOver = totalPlayersInRoom > 1 && alivePlayersCount === 1 && localIsAlive;

  return (
    <View style={styles.container}>
      {/* Render FlappyBirdGame normally */}
      <FlappyBirdGame 
        avatarUrl={getAvatarUrl(localPlayer?.avatar || 'bird')}
        avatarId={localPlayer?.avatar || 'bird'}
        seededRandom={seededRandom} // Pass seeded random for synchronized coin generation
        onScoreChange={handleScoreChange}
        onBirdYChange={handleBirdYChange}
        onDeath={handleDeath}
        onStateChange={setLocalGameState}
        forceGameOver={shouldForceGameOver}
        isMultiplayer={true}
      />

      {/* Overlay: Render other players' ghost birds only when we are playing */}
      {localGameState === 'playing' && (
        <View style={styles.ghostBirdsOverlay} pointerEvents="box-none">
          {otherPlayers.map((player) => (
            <GhostBird
              key={player.id}
              player={player}
              screenHeight={screenHeight}
            />
          ))}
        </View>
      )}

      {/* Mobile Leaderboard Toggle Button */}
      {screenWidth < 600 && (
        <TouchableOpacity
          style={styles.leaderboardToggleButton}
          onPress={() => setIsLeaderboardExpanded(prev => !prev)}
          activeOpacity={0.8}
        >
          <Text style={styles.leaderboardToggleButtonText}>
            🏆 {isLeaderboardExpanded ? 'Hide' : 'Scores'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Live Scoreboard Overlay */}
      {((screenWidth >= 600) || isLeaderboardExpanded) && (
        <View style={[
          styles.scoreboardContainer,
          screenWidth < 600 && styles.scoreboardContainerMobile
        ]}>
          <Text style={styles.scoreboardTitle}>LEADERBOARD</Text>
          {[...players]
            .sort((a, b) => {
              if (b.score !== a.score) {
                return b.score - a.score;
              }
              if (a.is_alive && !b.is_alive) return -1;
              if (!a.is_alive && b.is_alive) return 1;
              return 0;
            })
            .map((player, index) => {
              const isSelf = player.user_id === localUserId;
              const avatarId = player.avatar || 'bird';
              const avatarSource = AVATAR_SOURCES[avatarId] || AVATAR_SOURCES.bird;
              
              return (
                <View 
                  key={player.id} 
                  style={[
                    styles.scoreboardRow,
                    isSelf && styles.scoreboardRowSelf
                  ]}
                >
                  <Text style={styles.scoreboardRank}>#{index + 1}</Text>
                  <Image 
                    source={avatarSource} 
                    style={styles.scoreboardAvatar}
                    resizeMode="contain"
                  />
                  <Text 
                    numberOfLines={1} 
                    style={[
                      styles.scoreboardName,
                      isSelf && styles.scoreboardNameSelf
                    ]}
                  >
                    {player.player_name || 'Player'}
                  </Text>
                  <View style={styles.statusAndScore}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: player.is_alive ? '#4CAF50' : '#F44336' }
                    ]} />
                    <Text style={styles.scoreboardScore}>{player.score || 0}</Text>
                  </View>
                </View>
              );
            })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },

  scoreboardContainer: {
    position: 'absolute',
    top: 20, // Moved up since userBar is hidden during play
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 12,
    width: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1000,
  },
  scoreboardContainerMobile: {
    top: 60, // Positioned below the toggle button on mobile
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Higher opacity on mobile
    width: 180, // Slightly narrower on small screens
  },
  leaderboardToggleButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    zIndex: 1001,
    elevation: 5,
  },
  leaderboardToggleButtonText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Press Start 2P", monospace' : 'monospace',
  },
  scoreboardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700', // Gold color for retro title
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  scoreboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  scoreboardRowSelf: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  scoreboardRank: {
    color: '#AAA',
    fontSize: 11,
    marginRight: 6,
    fontWeight: '600',
  },
  scoreboardAvatar: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  scoreboardName: {
    color: '#FFF',
    fontSize: 12,
    flex: 1,
  },
  scoreboardNameSelf: {
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusAndScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  scoreboardScore: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  ghostBirdContainer: {
    position: 'absolute',
    backgroundColor: 'transparent',
    overflow: 'visible',
    opacity: 0.5, // Semi-transparent for ghost birds
  },
  ghostBirdImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  playerNameLabelContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  playerNameLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
  },
});

export default MultiplayerFlappyBirdGame;
