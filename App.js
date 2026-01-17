import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { supabase } from './lib/supabase';
import LoginScreen from './components/LoginScreen';
import ProfileSetup from './components/ProfileSetup';
import FlappyBirdGame from './FlappyBirdGame';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

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
  const playerName = user?.user_metadata?.player_name || 
                     user?.user_metadata?.full_name || 
                     user?.email?.split('@')[0] || 
                     'Player';

  return (
    <>
      <StatusBar hidden />
      <View style={styles.gameContainer}>
        {/* User info and logout button - improved styling */}
        <View style={styles.userBar} pointerEvents="box-none">
          <Text style={styles.userText}>
            Welcome, {playerName}!
          </Text>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={() => {
              console.log('Logout button pressed');
              handleLogout();
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPressIn={() => console.log('Logout button pressed in')}
            onPressOut={() => console.log('Logout button pressed out')}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* The game component */}
        <FlappyBirdGame />
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
    zIndex: 1, // Lower than user bar
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
    backgroundColor: 'transparent', // Removed white background bar
    zIndex: 10000, // Very high z-index to ensure it's above everything
    pointerEvents: 'box-none', // Allow touches to pass through container but catch on buttons
    elevation: 10, // For Android
  },
  userText: {
    fontSize: 15,
    color: '#000000', // Black color
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  logoutButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10001, // Very high z-index to ensure it's clickable
    pointerEvents: 'auto', // Ensure button can receive touches
    elevation: 11, // For Android
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
