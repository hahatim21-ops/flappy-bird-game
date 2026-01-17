import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';

/**
 * Bird Component
 * 
 * This component represents the player's bird in the game.
 * It displays a bird image that moves up and down based on velocity.
 * 
 * Props:
 * - position: { x: number, y: number } - The position of the bird
 * - size: number - The size (width/height) of the bird
 */
const Bird = ({ position, size }) => {
  return (
    <View
      style={[
        styles.birdContainer,
        {
          width: size,
          height: size,
          left: position.x,
          top: position.y,
        },
      ]}
    >
      <Image
        source={{ uri: 'https://www.pngall.com/wp-content/uploads/15/Flappy-Bird-PNG-Free-Image.png' }}
        style={styles.birdImage}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  birdContainer: {
    position: 'absolute',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  birdImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});

export default Bird;
