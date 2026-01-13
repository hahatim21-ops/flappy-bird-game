import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Pipe Component
 * 
 * This component represents a single pipe obstacle in the game.
 * Each pipe consists of a top pipe and a bottom pipe with a gap between them.
 * 
 * Props:
 * - x: number - Horizontal position of the pipe
 * - topHeight: number - Height of the top pipe
 * - gap: number - Size of the gap between top and bottom pipes
 * - screenHeight: number - Total height of the screen
 * - width: number - Width of the pipe
 */
const Pipe = ({ x, topHeight, gap, screenHeight, width }) => {
  // Calculate bottom pipe height
  // Total screen height minus top pipe height minus gap
  const bottomHeight = screenHeight - topHeight - gap;
  const bottomY = topHeight + gap;

  return (
    <>
      {/* Top Pipe */}
      <View
        style={[
          styles.pipe,
          {
            left: x,
            top: 0,
            width: width,
            height: topHeight,
          },
        ]}
      />
      
      {/* Bottom Pipe */}
      <View
        style={[
          styles.pipe,
          {
            left: x,
            top: bottomY,
            width: width,
            height: bottomHeight,
          },
        ]}
      />
    </>
  );
};

const styles = StyleSheet.create({
  pipe: {
    position: 'absolute',
    backgroundColor: '#228B22', // Forest green color
    borderWidth: 2,
    borderColor: '#006400', // Darker green for border
    // Add a simple shadow
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default Pipe;
