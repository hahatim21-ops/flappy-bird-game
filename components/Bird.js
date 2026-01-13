import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Bird Component
 * 
 * This component represents the player's bird in the game.
 * It's a simple colored rectangle that moves up and down based on velocity.
 * 
 * Props:
 * - position: { x: number, y: number } - The position of the bird
 * - size: number - The size (width/height) of the bird
 */
const Bird = ({ position, size }) => {
  return (
    <View
      style={[
        styles.bird,
        {
          width: size,
          height: size,
          left: position.x,
          top: position.y,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  bird: {
    position: 'absolute',
    backgroundColor: '#FFD700', // Gold color for the bird
    borderRadius: 5,
    // Add a simple shadow effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // For Android shadow
  },
});

export default Bird;
