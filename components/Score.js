import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Score Component
 * 
 * Displays the current score at the top of the screen.
 * 
 * Props:
 * - score: number - The current score to display
 */
const Score = ({ score }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.scoreText}>{score}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10, // Make sure score appears above other elements
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});

export default Score;
