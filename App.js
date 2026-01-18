import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, StatusBar, Platform, Modal, Image } from 'react-native';
import { supabase } from './lib/supabase';
import LoginScreen from './components/LoginScreen';
import ProfileSetup from './components/ProfileSetup';
import FlappyBirdGame from './FlappyBirdGame';
import LobbyScreen from './components/LobbyScreen';
import AvatarPicker from './components/AvatarPicker';
import RoomScreen from './components/RoomScreen';
import MultiplayerFlappyBirdGame from './components/MultiplayerFlappyBirdGame';

// Import local penguin, flamingo, red, and mighty eagle avatars
const penguinAvatar = require('./assets/penguin-avatar.png');
const flamingoAvatar = require('./assets/flamingo-avatar.png');
const redAvatar = require('./assets/red-avatar.png');
const mightyEagleAvatar = require('./assets/mighty-eagle-avatar.png');

// Avatar options (same as in ProfileSetup)
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
    url: redAvatar, // For saving to database, webpack will resolve this
  },
  {
    id: 'penguin',
    name: 'Penguin',
    source: penguinAvatar,
    isLocal: true,
    url: penguinAvatar, // For saving to database, webpack will resolve this
  },
  {
    id: 'flamingo',
    name: 'Flamingo',
    source: flamingoAvatar,
    isLocal: true,
    url: flamingoAvatar, // For saving to database, webpack will resolve this
  },
  {
    id: 'mighty-eagle',
    name: 'Mighty Eagle',
    source: mightyEagleAvatar,
    isLocal: true,
    url: mightyEagleAvatar, // For saving to database, webpack will resolve this
  },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  
  // Multiplayer state
  const [gameMode, setGameMode] = useState('single'); // 'single' or 'multiplayer'
  const [multiplayerScreen, setMultiplayerScreen] = useState(null); // null, 'avatar', 'lobby', 'game'
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // Load Google Fonts for pixelated text (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      return () => {
        // Cleanup: remove link when component unmounts
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, []);

  useEffect(() => {
    let loadingTimeout;
    let listenerSubscription = null;

    // Add a timeout to prevent infinite loading (reduced to 3 seconds)
    loadingTimeout = setTimeout(() => {
      console.warn('Loading timeout - forcing loading to false');
      setLoading(false);
    }, 3000); // 3 second timeout

    // Check if Supabase is configured
    const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL';
    const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
    const isConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL' && 
                         !SUPABASE_URL.includes('YOUR_') &&
                         SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
                         !SUPABASE_ANON_KEY.includes('YOUR_');

    if (isConfigured) {
      console.log('✅ Supabase is configured and connected!');
      
      // Get initial session - set loading to false immediately after
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.error('Error getting session:', error);
        }
        setSession(data?.session || null);
        const currentUser = data?.session?.user ?? null;
        setUser(currentUser);
        // Check if user needs profile setup (no name set)
        if (currentUser) {
          const hasName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.player_name;
          setNeedsProfileSetup(!hasName);
        }
        setLoading(false);
        if (loadingTimeout) clearTimeout(loadingTimeout);
      }).catch((err) => {
        console.error('Error getting session:', err);
        setLoading(false);
        if (loadingTimeout) clearTimeout(loadingTimeout);
      });

      // Listen for auth state changes (only updates, doesn't block loading)
      const { data: listener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          // Don't set loading here, just update session
          setSession(session);
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            const hasName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.player_name;
            setNeedsProfileSetup(!hasName);
            
            // Refresh user data in background (non-blocking)
            supabase.auth.getUser().then(({ data: { user: refreshedUser }, error }) => {
              if (!error && refreshedUser) {
                const refreshedHasName = refreshedUser.user_metadata?.full_name || refreshedUser.user_metadata?.player_name;
                setNeedsProfileSetup(!refreshedHasName);
                setUser(refreshedUser);
              }
            }).catch(() => {
              // Ignore errors in background refresh
            });
          } else {
            setNeedsProfileSetup(false);
          }
        }
      );
      
      listenerSubscription = listener?.subscription;

      return () => {
        if (loadingTimeout) clearTimeout(loadingTimeout);
        if (listenerSubscription) {
          listenerSubscription.unsubscribe();
        }
      };
    } else {
      console.log('ℹ️ Supabase not configured - login will not work');
      console.log('Please add your Supabase credentials to .env file');
      setLoading(false);
      if (loadingTimeout) clearTimeout(loadingTimeout);
    }
  }, []);

  const handleLogout = async () => {
    try {
      console.log('Logout button clicked');
      // Clear session immediately for better UX
      setSession(null);
      setUser(null);
      setLoading(true);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        // Even if there's an error, we've cleared the local session
      } else {
        console.log('Logout successful');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error during logout:', err);
      // Clear session even on error
      setSession(null);
      setUser(null);
      setLoading(false);
    }
  };

  const handleAvatarChange = async (avatarId) => {
    try {
      setSavingAvatar(true);
      const avatarData = AVATAR_OPTIONS.find(a => a.id === avatarId);
      
      // For local assets, get the resolved URL from webpack
      let avatarUrl = avatarData?.url;
      if (avatarData?.isLocal && avatarData?.source) {
        // In webpack, require() returns an object with default or the URL directly
        avatarUrl = typeof avatarData.source === 'string' 
          ? avatarData.source 
          : (avatarData.source.default || avatarData.source);
      }
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_id: avatarId,
          avatar_url: avatarUrl || AVATAR_OPTIONS[0].url,
        }
      });

      if (updateError) {
        console.error('Error updating avatar:', updateError);
      } else {
        // Refresh user data
        const { data: { user: refreshedUser } } = await supabase.auth.getUser();
        setUser(refreshedUser);
      }
      
      setSavingAvatar(false);
      setShowAvatarPicker(false);
    } catch (err) {
      console.error('Error changing avatar:', err);
      setSavingAvatar(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <>
        <StatusBar hidden />
        <LoginScreen />
      </>
    );
  }

  // Show profile setup if user doesn't have a name
  if (needsProfileSetup) {
    return (
      <>
        <StatusBar hidden />
        <ProfileSetup 
          onComplete={async () => {
            // Refresh user data after profile setup
            const { data: { user: refreshedUser } } = await supabase.auth.getUser();
            setUser(refreshedUser);
            setNeedsProfileSetup(false);
          }}
        />
      </>
    );
  }

  // Get player name (prefer player_name, then full_name, then email)
  const displayPlayerName = user?.user_metadata?.player_name || 
                            user?.user_metadata?.full_name || 
                            user?.email?.split('@')[0] || 
                            'Player';

  // Get current avatar for display
  const currentAvatarId = user?.user_metadata?.avatar_id || 'bird';
  const currentAvatarData = AVATAR_OPTIONS.find(a => a.id === currentAvatarId) || AVATAR_OPTIONS[0];
  const currentAvatarSource = currentAvatarData.isLocal 
    ? currentAvatarData.source 
    : { uri: currentAvatarData.url };

  // Multiplayer handlers
  const handleJoinRoom = (roomId, isHost) => {
    setCurrentRoom({ id: roomId });
    setIsHost(isHost);
    setMultiplayerScreen('avatar'); // Go to Avatar Picker
  };

  const handleAvatarSelected = () => {
    setMultiplayerScreen('lobby'); // Go to Room Screen (lobby)
  };

  const handleGameStart = () => {
    setMultiplayerScreen('game'); // Go to MultiplayerFlappyBirdGame
  };

  const handleMultiplayerBack = () => {
    setGameMode('single');
    setMultiplayerScreen(null);
    setCurrentRoom(null);
    setIsHost(false);
  };

  return (
    <>
      <StatusBar hidden />
      <View style={styles.gameContainer}>
        {/* User info and logout button - improved styling */}
        <View style={styles.userBar} pointerEvents="box-none">
          <View style={styles.userInfo}>
            <TouchableOpacity 
              style={styles.avatarButton}
              onPress={() => setShowAvatarPicker(true)}
              activeOpacity={0.7}
            >
              <Image 
                source={currentAvatarSource} 
                style={styles.avatarPreview}
                resizeMode="contain"
              />
              <Text style={styles.changeAvatarText}>✏️</Text>
            </TouchableOpacity>
            <Text style={styles.userText}>
              {displayPlayerName}
            </Text>
            {gameMode === 'single' && (
              <TouchableOpacity
                style={styles.multiplayerButton}
                onPress={() => {
                  setGameMode('multiplayer');
                  setMultiplayerScreen(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.multiplayerButtonText}>🎮 Multiplayer</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={() => {
              console.log('Logout button pressed');
              handleLogout();
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Routing: Single-player or Multiplayer */}
        {gameMode === 'single' && (
          <FlappyBirdGame 
            avatarUrl={user?.user_metadata?.avatar_url} 
            avatarId={user?.user_metadata?.avatar_id || 'bird'} 
          />
        )}

        {/* Multiplayer screens */}
        {gameMode === 'multiplayer' && !multiplayerScreen && (
          <LobbyScreen
            onJoinRoom={handleJoinRoom}
            onBack={handleMultiplayerBack}
          />
        )}

        {gameMode === 'multiplayer' && multiplayerScreen === 'avatar' && currentRoom && (
          <AvatarPicker
            roomId={currentRoom.id}
            onAvatarSelected={handleAvatarSelected}
          />
        )}

        {gameMode === 'multiplayer' && multiplayerScreen === 'lobby' && currentRoom && (
          <RoomScreen
            roomId={currentRoom.id}
            isHost={isHost}
            onGameStart={handleGameStart}
            onBack={handleMultiplayerBack}
          />
        )}

        {gameMode === 'multiplayer' && multiplayerScreen === 'game' && currentRoom && user && (
          <MultiplayerFlappyBirdGame
            roomId={currentRoom.id}
            localUserId={user.id}
            onGameEnd={handleMultiplayerBack}
            onBack={handleMultiplayerBack}
          />
        )}

        {/* Avatar Picker Modal */}
        <Modal
          visible={showAvatarPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAvatarPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Your Bird</Text>
              
              <View style={styles.avatarGrid}>
                {AVATAR_OPTIONS.map((avatar) => (
                  <TouchableOpacity
                    key={avatar.id}
                    style={[
                      styles.avatarOption,
                      currentAvatarId === avatar.id && styles.avatarOptionSelected,
                    ]}
                    onPress={() => handleAvatarChange(avatar.id)}
                    disabled={savingAvatar}
                  >
                    <Image
                      source={avatar.isLocal ? avatar.source : { uri: avatar.url }}
                      style={styles.avatarImage}
                      resizeMode="contain"
                    />
                    <Text style={[
                      styles.avatarName,
                      currentAvatarId === avatar.id && styles.avatarNameSelected,
                    ]}>
                      {avatar.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {savingAvatar && (
                <ActivityIndicator size="small" color="#4CAF50" style={{ marginTop: 10 }} />
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAvatarPicker(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#87CEEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#FFFFFF',
  },
  gameContainer: {
    flex: 1,
    zIndex: 1,
  },
  userBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    zIndex: 10000,
    pointerEvents: 'box-none',
    elevation: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    pointerEvents: 'auto',
  },
  avatarButton: {
    position: 'relative',
    marginRight: 10,
  },
  avatarPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  changeAvatarText: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    fontSize: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 2,
  },
  userText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginRight: 10,
  },
  multiplayerButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 10,
  },
  multiplayerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10001,
    pointerEvents: 'auto',
    elevation: 11,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 320,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  avatarOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    width: 90,
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
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
  },
  avatarNameSelected: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: '#666666',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
