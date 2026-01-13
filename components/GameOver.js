import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * GameOver Component
 * 
 * Displays the game over screen with final score and restart button.
 * 
 * Props:
 * - score: number - The final score
 * - onRestart: function - Callback function to restart the game
 */
const GameOver = ({ score, onRestart }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Game Over!</Text>
        <Text style={styles.scoreLabel}>Final Score</Text>
        <Text style={styles.scoreValue}>{score}</Text>
        <TouchableOpacity style={styles.button} onPress={onRestart}>
          <Text style={styles.buttonText}>Play Again</Text>
        </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100, // Make sure it appears above everything
  },
  content: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 250,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default GameOver;
