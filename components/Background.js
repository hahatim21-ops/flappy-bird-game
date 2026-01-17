import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';

/**
 * Background Component
 * 
 * Displays background image that rotates between 3 images each time a game ends.
 * 
 * Props:
 * - scrollX: number - Not used, kept for compatibility
 * - gameState: string - Current game state ('start', 'playing', 'gameOver')
 */
const Background = ({ scrollX, gameState }) => {
  // Three background images to rotate between
  const backgroundImages = [
    'https://e1.pxfuel.com/desktop-wallpaper/982/569/desktop-wallpaper-flappy-bird-backgrounds-flappy-bird.jpg',
    'https://wallpapers.com/images/hd/flappy-bird-background-gecj5m4a9yhhjp87.jpg',
    'https://framerusercontent.com/images/OFtVkJDGzvUrWhOyI34EOpHcdA.png'
  ];
  
  const fallbackImageUrl = 'https://i.pinimg.com/736x/49/34/11/49341130a18361f74c80532bdd109bca.jpg';
  
  // Get the initial image index from localStorage
  const getInitialImageIndex = () => {
    if (typeof window !== 'undefined') {
      const lastIndex = localStorage.getItem('flappyBirdBackgroundIndex');
      if (lastIndex !== null) {
        return parseInt(lastIndex, 10);
      } else {
        localStorage.setItem('flappyBirdBackgroundIndex', '0');
        return 0;
      }
    }
    return 0;
  };

  const [currentImageIndex, setCurrentImageIndex] = useState(getInitialImageIndex);
  const [useFallback, setUseFallback] = useState(false);
  const previousGameStateRef = useRef(gameState);
  const hasRotatedRef = useRef(false); // Track if we've already rotated for this gameOver
  
  // Rotate background when game ends (transitions from 'playing' to 'gameOver')
  useEffect(() => {
    // Only rotate when transitioning TO 'gameOver' state (game just ended)
    // And we haven't already rotated for this gameOver
    if (gameState === 'gameOver' && previousGameStateRef.current === 'playing' && !hasRotatedRef.current) {
      // Rotate to next image when game ends
      setCurrentImageIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % backgroundImages.length;
        if (typeof window !== 'undefined') {
          localStorage.setItem('flappyBirdBackgroundIndex', newIndex.toString());
        }
        console.log('Background rotated to image:', newIndex, 'after game ended');
        hasRotatedRef.current = true; // Mark that we've rotated
        return newIndex;
      });
    }
    
    // Reset rotation flag when game starts playing again
    if (gameState === 'playing' && previousGameStateRef.current !== 'playing') {
      hasRotatedRef.current = false;
    }
    
    previousGameStateRef.current = gameState;
  }, [gameState, backgroundImages.length]);

  const currentImageUrl = useFallback ? fallbackImageUrl : backgroundImages[currentImageIndex];

  const handleImageError = () => {
    console.log('Background image failed to load, using fallback');
    if (!useFallback) {
      setUseFallback(true);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: currentImageUrl }}
        style={styles.backgroundImage}
        resizeMode="cover"
        onError={handleImageError}
        onLoad={() => console.log('Background image loaded successfully:', currentImageIndex)}
      />
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
    overflow: 'hidden',
    zIndex: 0, // Behind pipes and bird, but above the sky blue background
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderWidth: 0,
    borderColor: 'transparent',
  },
});

export default Background;
