/**
 * RoomScreen Component
 * 
 * Pre-game room screen showing players, ready status, and start button
 * Auto-updates via Supabase Realtime
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { supabase } from '../lib/supabase';

// Import local avatars (same as in AvatarPicker and App.js)
const penguinAvatar = require('../assets/penguin-avatar.png');
const flamingoAvatar = require('../assets/flamingo-avatar.png');
const redAvatar = require('../assets/red-avatar.png');
const mightyEagleAvatar = require('../assets/mighty-eagle-avatar.png');

// Avatar options mapping (same as in AvatarPicker)
const AVATAR_OPTIONS = {
  bird: {
    id: 'bird',
    name: 'Flappy Bird',
    url: 'https://www.pngall.com/wp-content/uploads/15/Flappy-Bird-PNG-Free-Image.png',
    isLocal: false,
  },
  red: {
    id: 'red',
    name: 'Red',
    source: redAvatar,
    isLocal: true,
  },
  penguin: {
    id: 'penguin',
    name: 'Penguin',
    source: penguinAvatar,
    isLocal: true,
  },
  flamingo: {
    id: 'flamingo',
    name: 'Flamingo',
    source: flamingoAvatar,
    isLocal: true,
  },
  'mighty-eagle': {
    id: 'mighty-eagle',
    name: 'Mighty Eagle',
    source: mightyEagleAvatar,
    isLocal: true,
  },
};

const RoomScreen = ({ roomId, isHost, onGameStart, onBack }) => {
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const channelRef = React.useRef(null);

  useEffect(() => {
    if (!roomId) return;

    loadRoom();
    loadPlayers();

    // Subscribe to room state changes via Realtime
    const roomChannel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.new) {
            setRoom(payload.new);
            
            // Auto-navigate to game when state changes to 'playing'
            if (payload.new.state === 'playing') {
              onGameStart();
            }
          }
        }
      )
      .subscribe();

    // Subscribe to player changes via Realtime
    const playersChannel = supabase
      .channel(`players:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadPlayers();
        }
      )
      .subscribe();

    channelRef.current = { roomChannel, playersChannel };

    // Cleanup on unmount
    return () => {
      if (roomChannel) supabase.removeChannel(roomChannel);
      if (playersChannel) supabase.removeChannel(playersChannel);
    };
  }, [roomId]);

  const loadRoom = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      setRoom(data);
    } catch (error) {
      console.error('Error loading room:', error);
    }
  };

  const loadPlayers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', roomId)
        .order('updated_at', { ascending: true });

      if (error) throw error;
      setPlayers(data || []);

      // Check if current user is ready
      const currentPlayer = data?.find(p => p.user_id === user?.id);
      if (currentPlayer) {
        setIsReady(currentPlayer.is_ready || false);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const handleToggleReady = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newReadyState = !isReady;

      const { error } = await supabase
        .from('room_players')
        .update({ is_ready: newReadyState, updated_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) throw error;
      setIsReady(newReadyState);
    } catch (error) {
      console.error('Error toggling ready:', error);
      Alert.alert('Error', 'Failed to update ready status');
    }
  };

  const handleStartGame = async () => {
    if (players.filter(p => p.is_ready).length < 2) {
      Alert.alert('Not Enough Players', 'At least 2 players must be ready to start');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('rooms')
        .update({ state: 'playing', updated_at: new Date().toISOString() })
        .eq('id', roomId);

      if (error) throw error;

      // Navigation will happen automatically via Realtime subscription
      // onGameStart() will be called when state changes

    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert('Error', 'Failed to start game');
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Remove player from room
      await supabase
        .from('room_players')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      // Cleanup channels
      if (channelRef.current) {
        if (channelRef.current.roomChannel) supabase.removeChannel(channelRef.current.roomChannel);
        if (channelRef.current.playersChannel) supabase.removeChannel(channelRef.current.playersChannel);
      }

      onBack();
    } catch (error) {
      console.error('Error leaving room:', error);
      onBack(); // Leave anyway
    }
  };

  // Get current user (used in render)
  const [currentUser, setCurrentUser] = React.useState(null);
  
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Room</Text>
          {room && (
            <View style={styles.roomCodeContainer}>
              <Text style={styles.roomCodeLabel}>Room Code:</Text>
              <Text style={styles.roomCode}>{room.code}</Text>
            </View>
          )}
        </View>

        <ScrollView style={styles.playersList}>
          <Text style={styles.sectionTitle}>Players ({players.length}/5)</Text>
          {players.map((player) => {
            const isCurrentPlayer = player.user_id === currentUser?.id;
            return (
              <View key={player.id} style={styles.playerCard}>
                <View style={styles.playerInfo}>
                  {(() => {
                    const avatarData = AVATAR_OPTIONS[player.avatar] || AVATAR_OPTIONS.bird;
                    const avatarSource = avatarData.isLocal 
                      ? avatarData.source 
                      : { uri: avatarData.url };
                    return (
                      <Image
                        source={avatarSource}
                        style={styles.avatarImage}
                        resizeMode="contain"
                      />
                    );
                  })()}
                  <View style={styles.playerDetails}>
                    <Text style={styles.playerName}>
                      {player.player_name || 'Player'}
                      {isCurrentPlayer && ' (You)'}
                    </Text>
                    <Text style={styles.playerStatus}>
                      {player.is_ready ? '✓ Ready' : 'Waiting...'}
                    </Text>
                  </View>
                </View>
                {player.is_ready && <Text style={styles.readyIcon}>✓</Text>}
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.actions}>
          {!isHost && (
            <TouchableOpacity
              style={[styles.button, isReady ? styles.readyButton : styles.notReadyButton]}
              onPress={handleToggleReady}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {isReady ? '✓ Ready' : 'Not Ready'}
              </Text>
            </TouchableOpacity>
          )}

          {isHost && (
            <TouchableOpacity
              style={[
                styles.button,
                styles.startButton,
                players.filter(p => p.is_ready).length < 2 && styles.buttonDisabled,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleStartGame}
              disabled={loading || players.filter(p => p.is_ready).length < 2}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Start Game</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.leaveButton} onPress={handleLeave} disabled={loading}>
            <Text style={styles.leaveButtonText}>Leave Room</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 350,
    maxWidth: 500,
    width: '100%',
    maxHeight: '90%',
  },
  header: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  roomCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  roomCodeLabel: {
    fontSize: 16,
    color: '#666666',
    marginRight: 10,
  },
  roomCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 15,
  },
  playersList: {
    width: '100%',
    maxHeight: 300,
    marginBottom: 20,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarImage: {
    width: 50,
    height: 50,
    marginRight: 15,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  playerStatus: {
    fontSize: 14,
    color: '#666666',
  },
  readyIcon: {
    fontSize: 24,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  actions: {
    width: '100%',
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
  },
  readyButton: {
    backgroundColor: '#4CAF50',
  },
  notReadyButton: {
    backgroundColor: '#999999',
  },
  startButton: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  leaveButton: {
    padding: 12,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#DC3545',
    fontSize: 14,
  },
});

export default RoomScreen;
