import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Coin Component
 * 
 * This component represents a collectible coin in the game.
 * Coins appear in the gap between pipes and can be collected for bonus points.
 * 
 * Props:
 * - x: number - Horizontal position of the coin
 * - y: number - Vertical position of the coin (center of the gap)
 * - size: number - Size of the coin (width and height)
 */
const Coin = ({ x, y, size = 40 }) => {
  const coinRadius = size / 2;
  const coinX = x - coinRadius;
  const coinY = y - coinRadius;

  return (
    <View
      style={[
        styles.coinContainer,
        {
          left: coinX,
          top: coinY,
          width: size,
          height: size,
          borderRadius: coinRadius,
        },
      ]}
    >
      {/* Outer golden ring */}
      <View style={[styles.coinOuter, { borderRadius: coinRadius }]} />
      {/* Inner golden circle */}
      <View style={[styles.coinInner, { borderRadius: coinRadius * 0.7 }]} />
      {/* Highlight for 3D effect */}
      <View style={[styles.coinHighlight, { borderRadius: coinRadius * 0.3 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  coinContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinOuter: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFD700', // Gold color
    borderWidth: 2,
    borderColor: '#FFA500', // Orange border for depth
  },
  coinInner: {
    position: 'absolute',
    width: '70%',
    height: '70%',
    backgroundColor: '#FFED4E', // Lighter gold
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  coinHighlight: {
    position: 'absolute',
    width: '30%',
    height: '30%',
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
    top: '20%',
    left: '20%',
  },
});

export default Coin;
