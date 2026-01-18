import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Image, ScrollView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Import local penguin, flamingo, red, and mighty eagle avatars
const penguinAvatar = require('../assets/penguin-avatar.png');
const flamingoAvatar = require('../assets/flamingo-avatar.png');
const redAvatar = require('../assets/red-avatar.png');
const mightyEagleAvatar = require('../assets/mighty-eagle-avatar.png');

// Avatar options with their image URLs or local assets
const AVATAR_OPTIONS = [
  {
    id: 'bird',
    name: 'Flappy Bird',
    url: 'https://www.pngall.com/wp-content/uploads/15/Flappy-Bird-PNG-Free-Image.png',
    isLocal: false,
  },
  {
    id: 'red',
    name: 'Red',
    source: redAvatar,
    isLocal: true,
  },
  {
    id: 'penguin',
    name: 'Penguin',
    source: penguinAvatar,
    isLocal: true,
  },
  {
    id: 'flamingo',
    name: 'Flamingo',
    source: flamingoAvatar,
    isLocal: true,
  },
  {
    id: 'mighty-eagle',
    name: 'Mighty Eagle',
    source: mightyEagleAvatar,
    isLocal: true,
  },
];

export default function ProfileSetup({ onComplete }) {
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('bird'); // Default to the classic bird
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!playerName || playerName.trim().length === 0) {
        throw new Error('Please enter your name');
      }

      if (playerName.trim().length < 2) {
        throw new Error('Name must be at least 2 characters');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not found');
      }

      // Find the selected avatar URL
      const avatarData = AVATAR_OPTIONS.find(a => a.id === selectedAvatar);
      
      // For local assets, get the resolved URL from webpack
      let avatarUrl = avatarData?.url;
      if (avatarData?.isLocal && avatarData?.source) {
        // In webpack, require() returns an object with default or the URL directly
        avatarUrl = typeof avatarData.source === 'string' 
          ? avatarData.source 
          : (avatarData.source.default || avatarData.source);
      }

      // Update user metadata with the player name and avatar
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: playerName.trim(),
          player_name: playerName.trim(),
          avatar_id: selectedAvatar,
          avatar_url: avatarUrl || AVATAR_OPTIONS[0].url,
        }
      });

      if (updateError) {
        throw updateError;
      }

      // Call the completion callback
      onComplete();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Flappy Bird!</Text>
        <Text style={styles.subtitle}>Enter your player name</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Your Name"
          placeholderTextColor="#999999"
          value={playerName}
          onChangeText={setPlayerName}
          autoCapitalize="words"
          autoComplete="name"
          maxLength={30}
        />

        <Text style={styles.avatarTitle}>Choose your bird</Text>
        
        <View style={styles.avatarContainer}>
          {AVATAR_OPTIONS.map((avatar) => (
            <TouchableOpacity
              key={avatar.id}
              style={[
                styles.avatarOption,
                selectedAvatar === avatar.id && styles.avatarOptionSelected,
              ]}
              onPress={() => setSelectedAvatar(avatar.id)}
            >
              <Image
                source={avatar.isLocal ? avatar.source : { uri: avatar.url }}
                style={styles.avatarImage}
                resizeMode="contain"
              />
              <Text style={[
                styles.avatarName,
                selectedAvatar === avatar.id && styles.avatarNameSelected,
              ]}>
                {avatar.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSaveProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Start Playing</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    minWidth: 300,
    maxWidth: 500,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  avatarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 25,
    width: '100%',
  },
  avatarOption: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    width: 100,
  },
  avatarOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  avatarImage: {
    width: 60,
    height: 60,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  avatarName: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
  },
  avatarNameSelected: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
