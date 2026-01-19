/**
 * AvatarPicker Component
 * 
 * Avatar selection screen for multiplayer
 * Shows the same avatar options as single-player mode
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';

// Import local penguin, flamingo, red, and mighty eagle avatars
const penguinAvatar = require('../assets/penguin-avatar.png');
const flamingoAvatar = require('../assets/flamingo-avatar.png');
const redAvatar = require('../assets/red-avatar.png');
const mightyEagleAvatar = require('../assets/mighty-eagle-avatar.png');

// Avatar options (same as in ProfileSetup and App.js)
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

const AvatarPicker = ({ roomId, onAvatarSelected }) => {
  const [selectedAvatar, setSelectedAvatar] = useState('bird'); // Default to Flappy Bird
  const [loading, setLoading] = useState(false);

  /**
   * Handle avatar selection and update room_players
   */
  const handleConfirm = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !roomId) {
        alert('Error: Not authenticated or no room');
        return;
      }

      // Update player's avatar in room_players
      const { error } = await supabase
        .from('room_players')
        .update({ avatar: selectedAvatar })
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Navigate to Room Screen
      onAvatarSelected();

    } catch (error) {
      console.error('Error updating avatar:', error);
      alert('Failed to update avatar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose Your Bird</Text>
        <Text style={styles.subtitle}>Select your avatar</Text>

        <ScrollView style={styles.avatarContainer} contentContainerStyle={styles.avatarGrid}>
          {AVATAR_OPTIONS.map((avatar) => (
            <TouchableOpacity
              key={avatar.id}
              style={[
                styles.avatarOption,
                selectedAvatar === avatar.id && styles.avatarOptionSelected,
              ]}
              onPress={() => setSelectedAvatar(avatar.id)}
              disabled={loading}
            >
              <Image
                source={avatar.isLocal ? avatar.source : { uri: avatar.url }}
                style={styles.avatarImage}
                resizeMode="contain"
              />
              <Text
                style={[
                  styles.avatarName,
                  selectedAvatar === avatar.id && styles.avatarNameSelected,
                ]}
              >
                {avatar.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
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
    maxWidth: 500,
    width: '100%',
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
  avatarContainer: {
    width: '100%',
    maxHeight: 400,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 25,
    width: '100%',
  },
  avatarOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    width: 100,
    margin: 5,
  },
  avatarOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  avatarImage: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  avatarName: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
  },
  avatarNameSelected: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AvatarPicker;
