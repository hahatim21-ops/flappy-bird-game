import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, ImageBackground, Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Serve from /public on web to avoid webpack image compression
const loginBackground = Platform.OS === 'web'
  ? { uri: '/login-background.png' }
  : require('../assets/login-background.png');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleForgotPassword = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase is not configured for this deployment. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy.'
        );
      }

      if (!email) {
        throw new Error('Please enter your email address');
      }

      const redirectTo = Platform.OS === 'web' ? window.location.origin : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });

      if (error) throw error;

      setError('✅ Password reset link sent! Check your email.');
      setLoading(false);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send reset link.');
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase is not configured for this deployment. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy.'
        );
      }

      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      // Check if password is at least 6 characters
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      if (isSignUp) {
        // Sign up
        console.log('Attempting to sign up with:', email);
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        });

        if (error) {
          console.error('Sign up error details:', {
            message: error.message,
            status: error.status,
            error: error
          });
          throw error;
        }

        console.log('Sign up successful!', data);
        
        // If email confirmation is disabled, user is automatically signed in
        if (data.user && data.session) {
          // User is logged in immediately
          setError('✅ Account created! Logging you in...');
        } else {
          // Email confirmation required
          setError('✅ Account created! Check your email to verify, or try signing in now.');
        }
        setLoading(false);
      } else {
        // Sign in
        console.log('Attempting to sign in with:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) {
          console.error('Sign in error details:', {
            message: error.message,
            status: error.status,
            error: error
          });
          throw error;
        }

        console.log('Sign in successful!', data);
        // Success - user will be redirected automatically via onAuthStateChange
      }
    } catch (err) {
      console.error('Error:', err);
      
      // Better error messages
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error_description) {
        errorMessage = err.error_description;
      } else if (err.toString().includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to Supabase. Please check your internet connection and Supabase configuration.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={loginBackground}
      style={styles.container}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.title}>Flappy Bird Game</Text>
        <Text style={styles.subtitle}>
          {isForgotPassword 
            ? 'Reset password' 
            : (isSignUp ? 'Create an account' : 'Sign in to play')}
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        {!isForgotPassword && (
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
          />
        )}

        {!isForgotPassword && !isSignUp && (
          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={() => {
              setIsForgotPassword(true);
              setError(null);
            }}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={isForgotPassword ? handleForgotPassword : handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Sign Up' : 'Login')}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => {
            if (isForgotPassword) {
              setIsForgotPassword(false);
            } else {
              setIsSignUp(!isSignUp);
            }
            setError(null);
          }}
        >
          <Text style={styles.switchText}>
            {isForgotPassword 
              ? 'Back to Login' 
              : (isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up")}
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 15,
    padding: 24, // Optimized padding for smaller devices
    alignItems: 'center',
    maxWidth: 400,
    width: '90%',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
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
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    backgroundColor: '#4CAF50', // Green color for login
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 10,
  },
  switchText: {
    color: '#4285F4',
    fontSize: 14,
    textDecorationLine: 'underline',
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 15,
    marginTop: -5,
  },
  forgotPasswordText: {
    color: '#4285F4',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
