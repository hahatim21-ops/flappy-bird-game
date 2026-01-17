import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Pipe Component
 * 
 * This component represents a single pipe obstacle in the game.
 * Each pipe consists of a top pipe and a bottom pipe with a gap between them.
 * Uses pixel-art style green pipe design with vertical strips, dark outline, and cap.
 * 
 * Props:
 * - x: number - Horizontal position of the pipe
 * - topHeight: number - Height of the top pipe
 * - gap: number - Size of the gap between top and bottom pipes
 * - screenHeight: number - Total height of the screen
 * - width: number - Width of the pipe (should be 90px to match original)
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
          styles.pipeContainer,
          {
            left: x,
            top: 0,
            width: width, // Keep original width (90px) - same size
            height: topHeight,
          },
        ]}
      >
        {/* Main pipe body with vertical strips */}
        <View style={styles.pipeBody} />
        {/* Left strip - lightest green */}
        <View style={styles.pipeLeftStrip} />
        {/* Center strip - medium green */}
        <View style={styles.pipeCenterStrip} />
        {/* Right strip - darker green (shadow) */}
        <View style={styles.pipeRightStrip} />
        {/* Dark outline */}
        <View style={styles.pipeOutline} />
        {/* Cap at bottom of top pipe */}
        <View style={[styles.pipeCap, { bottom: 0 }]} />
      </View>
      
      {/* Bottom Pipe - flipped vertically */}
      <View
        style={[
          styles.pipeContainer,
          {
            left: x,
            top: bottomY,
            width: width, // Keep original width (90px) - same size
            height: bottomHeight,
          },
        ]}
      >
        {/* Main pipe body with vertical strips */}
        <View style={styles.pipeBody} />
        {/* Left strip - lightest green */}
        <View style={styles.pipeLeftStrip} />
        {/* Center strip - medium green */}
        <View style={styles.pipeCenterStrip} />
        {/* Right strip - darker green (shadow) */}
        <View style={styles.pipeRightStrip} />
        {/* Dark outline */}
        <View style={styles.pipeOutline} />
        {/* Cap at top of bottom pipe (flipped) */}
        <View style={[styles.pipeCap, { top: 0 }]} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  pipeContainer: {
    position: 'absolute',
    overflow: 'hidden',
    // Container maintains exact width (90px) - no size change
  },
  pipeBody: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#7CFC00', // Bright lime green (main color)
  },
  pipeLeftStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '25%', // Leftmost vertical strip
    bottom: 0,
    backgroundColor: '#90EE90', // Lightest green
  },
  pipeCenterStrip: {
    position: 'absolute',
    top: 0,
    left: '25%',
    width: '50%', // Center and widest strip
    bottom: 0,
    backgroundColor: '#7CFC00', // Medium bright green
  },
  pipeRightStrip: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '25%', // Rightmost strip (shadow)
    bottom: 0,
    backgroundColor: '#32CD32', // Slightly darker green for shadow effect
  },
  pipeOutline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#2F4F2F', // Dark gray/charcoal outline
  },
  pipeCap: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8, // Cap height
    backgroundColor: '#7CFC00', // Green cap
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2F4F2F', // Dark outline for cap
  },
});

export default Pipe;
