/**
 * MultiplayerGameOver Component
 * 
 * Leaderboard screen shown after multiplayer game ends
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const AVATAR_COLORS = {
  yellow: '#FFD700',
  red: '#FF4444',
  blue: '#4444FF',
  green: '#44FF44',
  black: '#333333',
};

const MultiplayerGameOver = ({ players, onPlayAgain, onChangeAvatar, onLeave }) => {
  // Sort players by score (highest first)
  const sortedPlayers = [...(players || [])].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  
  const { data: { user } } = supabase.auth.getUser();
  const currentPlayer = sortedPlayers.find(p => p.user_id === user?.id);

  const getRankEmoji = (index) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}.`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Game Over!</Text>
        <Text style={styles.subtitle}>Final Leaderboard</Text>

        <ScrollView style={styles.leaderboard}>
          {sortedPlayers.map((player, index) => {
            const isWinner = index === 0;
            const isCurrentPlayer = player.user_id === user?.id;

            return (
              <View
                key={player.id}
                style={[
                  styles.playerRow,
                  isWinner && styles.winnerRow,
                  isCurrentPlayer && styles.currentPlayerRow,
                ]}
              >
                <Text style={styles.rank}>{getRankEmoji(index)}</Text>
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: AVATAR_COLORS[player.avatar_color] || '#FFD700' },
                    isWinner && styles.winnerAvatar,
                  ]}
                />
                <View style={styles.playerInfo}>
                  <Text style={[styles.playerName, isWinner && styles.winnerName]}>
                    {player.player_name}
                    {isCurrentPlayer && ' (You)'}
                  </Text>
                  {isWinner && <Text style={styles.winnerLabel}>Winner! 🎉</Text>}
                </View>
                <Text style={[styles.score, isWinner && styles.winnerScore]}>
                  {player.score}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.button} onPress={onPlayAgain}>
            <Text style={styles.buttonText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onChangeAvatar}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Change Avatar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.leaveButton} onPress={onLeave}>
            <Text style={styles.leaveButtonText}>Leave Room</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 350,
    maxWidth: 500,
    width: '90%',
    maxHeight: '90%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 20,
  },
  leaderboard: {
    width: '100%',
    maxHeight: 350,
    marginBottom: 20,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  winnerRow: {
    backgroundColor: '#FFF9E6',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  currentPlayerRow: {
    backgroundColor: '#E8F5E9',
  },
  rank: {
    fontSize: 20,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  winnerAvatar: {
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  winnerName: {
    fontSize: 18,
    color: '#FF6B00',
  },
  winnerLabel: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '600',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    minWidth: 60,
    textAlign: 'right',
  },
  winnerScore: {
    fontSize: 24,
    color: '#FF6B00',
  },
  actions: {
    width: '100%',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#4CAF50',
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

export default MultiplayerGameOver;
