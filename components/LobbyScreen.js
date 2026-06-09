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

const getPlayerName = (user) =>
  user.user_metadata?.player_name ||
  user.user_metadata?.full_name ||
  user.email?.split('@')[0] ||
  'Player';

const isMissingColumnError = (error) => {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return message.includes('column') || error?.code === 'PGRST204';
};

const createRoomRecord = async (user, code) => {
  const randomSeed = Math.floor(Math.random() * 1000000);
  const attempts = [
    { code, state: 'waiting', host_user_id: user.id, random_seed: randomSeed },
    { code, state: 'waiting', host_user_id: user.id },
    { code, state: 'waiting', host_id: user.id, random_seed: randomSeed },
    { code, state: 'waiting', host_id: user.id },
    { code, state: 'waiting' },
  ];

  let lastError = null;
  for (const payload of attempts) {
    const { data, error } = await supabase.from('rooms').insert(payload).select().single();
    if (!error && data) return data;
    lastError = error;
    if (!isMissingColumnError(error)) break;
  }

  throw lastError || new Error('Failed to create room');
};

const addPlayerRecord = async (roomId, user) => {
  const playerName = getPlayerName(user);
  const attempts = [
    {
      room_id: roomId,
      user_id: user.id,
      player_name: playerName,
      avatar: 'yellow',
      score: 0,
      is_alive: true,
    },
    {
      room_id: roomId,
      user_id: user.id,
      player_name: playerName,
      avatar_color: 'yellow',
      score: 0,
      is_alive: true,
    },
    {
      room_id: roomId,
      user_id: user.id,
      avatar: 'yellow',
      score: 0,
      is_alive: true,
    },
    {
      room_id: roomId,
      user_id: user.id,
      avatar_color: 'yellow',
      score: 0,
      is_alive: true,
    },
    {
      room_id: roomId,
      user_id: user.id,
      score: 0,
      is_alive: true,
    },
  ];

  let lastError = null;
  for (const payload of attempts) {
    const { error } = await supabase.from('room_players').insert(payload);
    if (!error) return;
    lastError = error;
    if (!isMissingColumnError(error)) break;
  }

  throw lastError || new Error('Failed to join room');
};

const LobbyScreen = ({ onJoinRoom, onBack }) => {
  const [roomCode, setRoomCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

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
    if (creating || joining) return;
    try {
      setCreating(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to create a room.');
        setCreating(false);
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

      // Create room (fallback if optional columns are missing in Supabase)
      const room = await createRoomRecord(user, code);

      // Auto-join creator as player
      try {
        await addPlayerRecord(room.id, user);
      } catch (playerError) {
        console.error('Player creation error:', playerError);
        await supabase.from('rooms').delete().eq('id', room.id);
        throw new Error(`Failed to join room: ${playerError.message}`);
      }

      // Navigate to Avatar Picker
      onJoinRoom(room.id, true); // true = is host

    } catch (err) {
      console.error('Error creating room:', err);
      
      let errorMessage = 'Failed to create room';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.toString) {
        errorMessage = err.toString();
      }
      
      if (err.code) {
        errorMessage += ` (Code: ${err.code})`;
      }
      if (err.details) {
        errorMessage += `\nDetails: ${err.details}`;
      }
      if (err.hint) {
        errorMessage += `\nHint: ${err.hint}`;
      }
      
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  /**
   * Join an existing room by code
   */
  const handleJoinRoom = async () => {
    if (creating || joining) return;
    if (!roomCode || roomCode.length !== 6) {
      setError('Please enter a 6-character room code.');
      return;
    }

    try {
      setJoining(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to join a room.');
        setJoining(false);
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
        setError('Room not found or already started.');
        setJoining(false);
        return;
      }

      const room = rooms[0];

      // Check if player already in room
      const { data: players, error: playersError } = await supabase
        .from('room_players')
        .select('id, user_id')
        .eq('room_id', room.id);

      if (playersError) throw playersError;

      const existingPlayer = players?.find(p => p.user_id === user.id);
      if (existingPlayer) {
        // Already in room, go to avatar picker
        const isHost = room.host_user_id === user.id || room.host_id === user.id;
        onJoinRoom(room.id, isHost);
        return;
      }

      // Add player to room
      await addPlayerRecord(room.id, user);

      // Navigate to Avatar Picker
      const isHost = room.host_user_id === user.id || room.host_id === user.id;
      onJoinRoom(room.id, isHost);

    } catch (err) {
      console.error('Error joining room:', err);
      setError(err.message || 'Failed to join room.');
    } finally {
      setJoining(false);
    }
  };

  const isAnyLoading = creating || joining;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Multiplayer Flappy Bird</Text>
        <Text style={styles.subtitle}>Play with friends!</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, styles.createButton, isAnyLoading && styles.buttonDisabled]}
          onPress={handleCreateRoom}
          disabled={isAnyLoading}
        >
          {creating ? (
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
          editable={!isAnyLoading}
        />

        <TouchableOpacity
          style={[styles.button, styles.joinButton, isAnyLoading && styles.buttonDisabled]}
          onPress={handleJoinRoom}
          disabled={isAnyLoading}
        >
          {joining ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Join Room</Text>
          )}
        </TouchableOpacity>

        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            disabled={isAnyLoading}
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
    padding: 24, // Optimized padding for smaller devices
    alignItems: 'center',
    maxWidth: 400,
    width: '90%',
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
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LobbyScreen;
