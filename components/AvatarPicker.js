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
  Alert,
  Platform,
  Share,
  TextInput,
  Linking,
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

const AvatarPicker = ({ roomId, roomCode, onAvatarSelected }) => {
  const [selectedAvatar, setSelectedAvatar] = useState('bird'); // Default to Flappy Bird
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const getInviteLink = () => {
    // For web: use current origin/path. For native, fall back to just sharing the code.
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(
        (roomCode || '').toUpperCase()
      )}`;
    }
    return null;
  };

  const handleInvite = async () => {
    const code = (roomCode || '').toUpperCase();
    const link = getInviteLink();
    const message = link
      ? `Join my Flappy Bird room!\n\nRoom Code: ${code}\nLink: ${link}`
      : `Join my Flappy Bird room!\n\nRoom Code: ${code}`;

    // 1) Try native share (mobile) / supported platforms
    try {
      await Share.share({ message });
      return;
    } catch {
      // continue to clipboard fallback
    }

    // 2) Web clipboard fallback
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link || code);
        Alert.alert('Invite copied', 'Invite link copied to clipboard.');
        return;
      }
    } catch {
      // continue to final fallback
    }

    // 3) Final fallback: show the code/link so user can manually copy
    Alert.alert('Invite', message);
  };

  const handleInviteEmail = async () => {
    const code = (roomCode || '').toUpperCase();
    const link = getInviteLink();
    const email = (inviteEmail || '').trim();

    if (!email || !email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    const subject = `Flappy Bird Invite (Room ${code})`;
    const body = link
      ? `Join my Flappy Bird game!\n\nRoom Code: ${code}\nInvite Link: ${link}\n\nIf the link doesn’t open, paste the room code into Multiplayer > Join Room.`
      : `Join my Flappy Bird game!\n\nRoom Code: ${code}\n\nPaste the room code into Multiplayer > Join Room.`;

    const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailto);
      if (!canOpen) {
        Alert.alert('Email app not available', `Send this code to your friend: ${code}`);
        return;
      }
      await Linking.openURL(mailto);
      setInviteEmail('');
    } catch (e) {
      Alert.alert('Could not open email', `Send this code to your friend: ${code}`);
    }
  };

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

        {!!roomCode && (
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={handleInvite}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.inviteButtonText}>Invite</Text>
            <Text style={styles.inviteButtonSubtext}>Room Code: {String(roomCode).toUpperCase()}</Text>
          </TouchableOpacity>
        )}

        {!!roomCode && (
          <View style={styles.inviteEmailRow}>
            <TextInput
              style={styles.inviteEmailInput}
              placeholder="Friend's email"
              placeholderTextColor="#7A7A7A"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.inviteEmailButton}
              onPress={handleInviteEmail}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.inviteEmailButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}

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
  inviteButton: {
    width: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  inviteButtonSubtext: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  inviteEmailRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  inviteEmailInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inviteEmailButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  inviteEmailButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
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
