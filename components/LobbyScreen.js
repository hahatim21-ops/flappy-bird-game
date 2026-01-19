/**
 * LobbyScreen Component
 * 
 * Main lobby for creating or joining multiplayer rooms
 * Flow: LobbyScreen → AvatarPicker → RoomScreen → MultiplayerFlappyBirdGame
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

const LobbyScreen = ({ onJoinRoom, onBack }) => {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Generate a 6-character room code
   */
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  /**
   * Create a new room and auto-join creator
   */
  const handleCreateRoom = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to create a room');
        return;
      }

      // Generate unique room code
      let code = generateRoomCode();
      let attempts = 0;
      
      // Ensure code is unique (check if exists)
      // Skip uniqueness check if query fails (table might not have state column)
      try {
        while (attempts < 10) {
          const { data: existing, error: checkError } = await supabase
            .from('rooms')
            .select('id')
            .eq('code', code)
            .limit(1);
          
          // If query fails or no existing room found, code is unique
          if (checkError || !existing || existing.length === 0) break;
          code = generateRoomCode();
          attempts++;
        }
      } catch (checkErr) {
        console.warn('Could not check for existing codes, proceeding anyway:', checkErr);
        // Continue with generated code
      }

      // Create room with host_user_id
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          code: code,
          state: 'waiting',
          host_user_id: user.id, // Required field
        })
        .select()
        .single();

      if (roomError) {
        console.error('Room creation error:', roomError);
        throw new Error(`Failed to create room: ${roomError.message}`);
      }

      if (!room) {
        throw new Error('Room was not created');
      }

      // Auto-join creator as player
      // Only insert fields that exist in the table
      const playerData = {
        room_id: room.id,
        user_id: user.id,
        avatar: 'yellow', // Default avatar, will change in AvatarPicker
        score: 0,
        is_alive: true,
      };

      const { error: playerError } = await supabase
        .from('room_players')
        .insert(playerData);

      if (playerError) {
        console.error('Player creation error:', playerError);
        // Try to delete the room if player creation fails
        await supabase.from('rooms').delete().eq('id', room.id);
        throw new Error(`Failed to join room: ${playerError.message}`);
      }

      // Navigate to Avatar Picker
      onJoinRoom(room.id, true); // true = is host

    } catch (error) {
      console.error('Error creating room:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Show detailed error message
      let errorMessage = 'Failed to create room';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.toString) {
        errorMessage = error.toString();
      }
      
      // Add more context if available
      if (error.code) {
        errorMessage += ` (Code: ${error.code})`;
      }
      if (error.details) {
        errorMessage += `\nDetails: ${error.details}`;
      }
      if (error.hint) {
        errorMessage += `\nHint: ${error.hint}`;
      }
      
      Alert.alert('Error Creating Room', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Join an existing room by code
   */
  const handleJoinRoom = async () => {
    if (!roomCode || roomCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-character room code');
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to join a room');
        return;
      }

      // Find room by code
      const { data: rooms, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode.toUpperCase())
        .eq('state', 'waiting')
        .limit(1);

      if (roomError) throw roomError;
      if (!rooms || rooms.length === 0) {
        Alert.alert('Error', 'Room not found or already started');
        return;
      }

      const room = rooms[0];

      // Check if room is full (max 5 players)
      const { data: players, error: playersError } = await supabase
        .from('room_players')
        .select('id')
        .eq('room_id', room.id);

      if (playersError) throw playersError;
      if (players && players.length >= 5) {
        Alert.alert('Room Full', 'This room already has 5 players');
        return;
      }

      // Check if player already in room
      const existingPlayer = players?.find(p => p.user_id === user.id);
      if (existingPlayer) {
        // Already in room, go to avatar picker
        // Host is determined by host_user_id from room
        const isHost = room.host_user_id === user.id;
        onJoinRoom(room.id, isHost);
        return;
      }

      // Add player to room
      const playerName = user.user_metadata?.player_name || 
                        user.user_metadata?.full_name || 
                        user.email?.split('@')[0] || 
                        'Player';

      const { error: playerError } = await supabase
        .from('room_players')
        .insert({
          room_id: room.id,
          user_id: user.id,
          avatar: 'yellow', // Default avatar, will change in AvatarPicker
          score: 0,
          is_alive: true,
        });

      if (playerError) throw playerError;

      // Navigate to Avatar Picker
      // Host is determined by host_user_id from room
      const isHost = room.host_user_id === user.id;
      onJoinRoom(room.id, isHost);

    } catch (error) {
      console.error('Error joining room:', error);
      Alert.alert('Error', error.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Multiplayer Flappy Bird</Text>
        <Text style={styles.subtitle}>Play with friends!</Text>

        <TouchableOpacity
          style={[styles.button, styles.createButton, loading && styles.buttonDisabled]}
          onPress={handleCreateRoom}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Create Room</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.codeInput}
          placeholder="Enter Room Code"
          placeholderTextColor="#999999"
          value={roomCode}
          onChangeText={(text) => setRoomCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          maxLength={6}
          autoCapitalize="characters"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, styles.joinButton, loading && styles.buttonDisabled]}
          onPress={handleJoinRoom}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Join Room</Text>
          )}
        </TouchableOpacity>

        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>← Back to Game</Text>
          </TouchableOpacity>
        )}
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
    padding: 30,
    alignItems: 'center',
    minWidth: 320,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 30,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 15,
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  joinButton: {
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999999',
    fontSize: 14,
  },
  codeInput: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 15,
    fontFamily: 'monospace',
  },
  backButton: {
    marginTop: 10,
    padding: 10,
  },
  backButtonText: {
    color: '#666666',
    fontSize: 14,
  },
});

export default LobbyScreen;
