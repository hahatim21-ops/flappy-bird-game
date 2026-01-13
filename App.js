import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { supabase } from './lib/supabase';
import LoginScreen from './components/LoginScreen';
import FlappyBirdGame from './FlappyBirdGame';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if Supabase is configured
    const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL';
    const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
    const isConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL' && 
                         !SUPABASE_URL.includes('YOUR_') &&
                         SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
                         !SUPABASE_ANON_KEY.includes('YOUR_');

    if (isConfigured) {
      console.log('✅ Supabase is configured and connected!');
      
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
      }).catch((err) => {
        console.error('Error getting session:', err);
        setLoading(false);
      });

      const { data: listener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      return () => listener.subscription.unsubscribe();
    } else {
      console.log('ℹ️ Supabase not configured - login will not work');
      console.log('Please add your Supabase credentials to .env file');
      setLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (err) {
      console.error('Error during logout:', err);
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

  return (
    <>
      <StatusBar hidden />
      <View style={styles.gameContainer}>
        {/* User info and logout button */}
        <View style={styles.userBar}>
          <Text style={styles.userText}>
            Welcome, {user?.user_metadata?.full_name || user?.email || 'Player'}!
          </Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  userText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
