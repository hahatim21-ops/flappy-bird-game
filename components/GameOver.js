import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

/**
 * GameOver Component
 * 
 * Displays the classic Flappy Bird game over screen with scoreboard, medal, and buttons.
 * 
 * Props:
 * - score: number - The final score
 * - onRestart: function - Callback function to restart the game
 */
const GameOver = ({ score, onRestart }) => {
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  useEffect(() => {
    // Get high score from localStorage
    if (typeof window !== 'undefined') {
      const savedHighScore = localStorage.getItem('flappyBirdHighScore');
      const currentHighScore = savedHighScore ? parseInt(savedHighScore, 10) : 0;
      
      if (score > currentHighScore) {
        // New high score!
        setIsNewHighScore(true);
        setHighScore(score);
        localStorage.setItem('flappyBirdHighScore', score.toString());
      } else {
        setHighScore(currentHighScore);
        setIsNewHighScore(false);
      }
    }
  }, [score]);

  // Determine medal based on score
  const getMedal = () => {
    if (score >= 40) return '🥇'; // Gold
    if (score >= 30) return '🥈'; // Silver
    if (score >= 20) return '🥉'; // Bronze
    if (score >= 10) return '⭐'; // Star
    return null; // No medal
  };

  const medal = getMedal();

  return (
    <View style={styles.container}>
      {/* Sky Background */}
      <View style={styles.skyBackground} />
      
      {/* Ground */}
      <View style={styles.ground} />
      
      {/* Bird on Ground (decorative) */}
      <View style={styles.groundBird}>
        <View style={styles.birdBody} />
        <View style={styles.birdEye} />
        <View style={styles.birdBeak} />
      </View>
      
      {/* GAME OVER Title */}
      <Text style={styles.gameOverTitle}>GAME OVER</Text>

      {/* Scoreboard Panel */}
      <View style={styles.scoreboard}>
        {/* Left Side - Medal */}
        <View style={styles.medalSection}>
          <Text style={styles.medalLabel}>MEDAL</Text>
          {medal ? (
            <Text style={styles.medalIcon}>{medal}</Text>
          ) : (
            <View style={styles.noMedal}>
              <Text style={styles.noMedalText}>—</Text>
            </View>
          )}
        </View>

        {/* Right Side - Score */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
          
          <View style={styles.highScoreContainer}>
            {isNewHighScore && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
            <Text style={styles.highScoreLabel} numberOfLines={1}>
              HIGH SCORE
            </Text>
          </View>
          
          <Text style={styles.highScoreValue}>{highScore}</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.playButton} onPress={onRestart}>
          <Text style={styles.buttonText}>PLAY</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.shareButton} 
          onPress={() => {
            // Share functionality (can be implemented later)
            if (navigator.share) {
              navigator.share({
                title: 'Flappy Bird Score',
                text: `I scored ${score} points in Flappy Bird!`,
              });
            } else {
              console.log('Share not available');
            }
          }}
        >
          <Text style={styles.buttonText}>SHARE</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  skyBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#87CEEB', // Light blue sky
    zIndex: 1,
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '15%',
    backgroundColor: '#90EE90', // Light green ground
    borderTopWidth: 3,
    borderTopColor: '#228B22', // Dark green border
    zIndex: 3,
  },
  groundBird: {
    position: 'absolute',
    bottom: '12%',
    left: '20%',
    width: 50,
    height: 50,
    zIndex: 4,
  },
  birdBody: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFD700', // Yellow
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#000000',
  },
  birdEye: {
    position: 'absolute',
    top: '25%',
    left: '30%',
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000000',
  },
  birdBeak: {
    position: 'absolute',
    bottom: '20%',
    right: '10%',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderLeftColor: '#FF4500', // Orange/red
    borderTopWidth: 4,
    borderTopColor: 'transparent',
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
  },
  gameOverTitle: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FF8C00', // Orange color
    marginBottom: 20,
    fontFamily: Platform.OS === 'web' ? '"Press Start 2P", monospace' : 'monospace',
    textShadowColor: '#000000', // Black outline for pixelated look
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    letterSpacing: 3,
    zIndex: 10, // Above background elements
    // Pixelated effect
    ...(Platform.OS === 'web' && {
      WebkitFontSmoothing: 'none',
      MozOsxFontSmoothing: 'unset',
      imageRendering: 'pixelated',
    }),
  },
  scoreboard: {
    backgroundColor: '#90EE90', // Light green
    borderWidth: 4,
    borderColor: '#228B22', // Dark green border
    borderRadius: 8,
    padding: 20,
    minWidth: 280,
    flexDirection: 'row',
    marginBottom: 20,
    zIndex: 10, // Above background image
  },
  medalSection: {
    flex: 1,
    alignItems: 'center',
    paddingRight: 15,
    marginRight: 15,
    borderRightWidth: 2,
    borderRightColor: '#228B22',
  },
  medalLabel: {
    fontSize: 12,
    color: '#228B22',
    marginBottom: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Press Start 2P", monospace' : 'monospace',
    letterSpacing: 1,
    ...(Platform.OS === 'web' && {
      WebkitFontSmoothing: 'none',
      MozOsxFontSmoothing: 'unset',
    }),
  },
  medalIcon: {
    fontSize: 48,
  },
  noMedal: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMedalText: {
    fontSize: 32,
    color: '#999999',
  },
  scoreSection: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#228B22',
    marginBottom: 8,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Press Start 2P", monospace' : 'monospace',
    letterSpacing: 1,
    ...(Platform.OS === 'web' && {
      WebkitFontSmoothing: 'none',
      MozOsxFontSmoothing: 'unset',
    }),
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000', // Changed from white to black
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? '"Press Start 2P", monospace' : 'monospace',
    textShadowColor: '#FFFFFF', // White shadow instead
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    letterSpacing: 2,
    ...(Platform.OS === 'web' && {
      WebkitFontSmoothing: 'none',
      MozOsxFontSmoothing: 'unset',
    }),
  },
  highScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    flexWrap: 'nowrap',
    width: '100%',
  },
  newBadge: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 5,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Press Start 2P", monospace' : 'monospace',
    letterSpacing: 1,
    ...(Platform.OS === 'web' && {
      WebkitFontSmoothing: 'none',
      MozOsxFontSmoothing: 'unset',
    }),
  },
  highScoreLabel: {
    fontSize: 9,
    color: '#FFFFFF',
    marginBottom: 0,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Press Start 2P", monospace' : 'monospace',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' && {
      whiteSpace: 'nowrap',
      WebkitFontSmoothing: 'none',
      MozOsxFontSmoothing: 'unset',
    }),
  },
  highScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000', // Changed from white to black
    fontFamily: Platform.OS === 'web' ? '"Press Start 2P", monospace' : 'monospace',
    textShadowColor: '#FFFFFF', // White shadow instead
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    letterSpacing: 2,
    ...(Platform.OS === 'web' && {
      WebkitFontSmoothing: 'none',
      MozOsxFontSmoothing: 'unset',
    }),
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    zIndex: 10, // Above background image
  },
  playButton: {
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#228B22',
    borderRadius: 8,
    paddingHorizontal: 30,
    paddingVertical: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#228B22',
    borderRadius: 8,
    paddingHorizontal: 30,
    paddingVertical: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Press Start 2P", monospace' : 'monospace',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    letterSpacing: 1,
    ...(Platform.OS === 'web' && {
      WebkitFontSmoothing: 'none',
      MozOsxFontSmoothing: 'unset',
    }),
  },
});

export default GameOver;
