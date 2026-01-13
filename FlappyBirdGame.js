import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Text,
  StatusBar,
} from 'react-native';
import Bird from './components/Bird';
import Pipe from './components/Pipe';
import Score from './components/Score';
import GameOver from './components/GameOver';

/**
 * FlappyBirdGame Component
 * 
 * This is the complete game component with all game logic.
 * This component manages:
 * - Game state (start, playing, game over)
 * - Physics (gravity, velocity)
 * - Pipe generation and movement
 * - Collision detection
 * - Scoring
 * - Game loop using requestAnimationFrame
 */

// Game constants - these control the game's behavior
const GRAVITY = 0.5; // How fast the bird falls (pixels per frame)
const FLAP_STRENGTH = -8; // How much the bird jumps when tapped (negative = up)
const PIPE_SPEED = 3; // How fast pipes move left (pixels per frame)
const PIPE_SPACING = 200; // Horizontal distance between pipes (pixels)
const PIPE_GAP = 150; // Vertical gap between top and bottom pipes (pixels)
const PIPE_WIDTH = 60; // Width of each pipe (pixels)
const BIRD_SIZE = 40; // Size of the bird (width and height in pixels)
const BIRD_START_X = 100; // Starting horizontal position of the bird

const FlappyBirdGame = () => {
  // Get screen dimensions for responsive design
  const screenData = Dimensions.get('window');
  const screenWidth = screenData.width;
  const screenHeight = screenData.height;

  // Game state management
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameOver'
  const [birdPosition, setBirdPosition] = useState({ x: BIRD_START_X, y: screenHeight / 2 });
  const [birdVelocity, setBirdVelocity] = useState(0); // Vertical velocity of the bird
  const [pipes, setPipes] = useState([]); // Array of pipe objects
  const [score, setScore] = useState(0);
  const [nextPipeId, setNextPipeId] = useState(0); // Unique ID for each pipe

  // Refs to track animation frame and game loop
  const gameLoopRef = useRef(null);
  const lastPipeXRef = useRef(screenWidth); // Track the rightmost pipe position

  /**
   * Initialize the game - reset all values to starting state
   */
  const initGame = useCallback(() => {
    setBirdPosition({ x: BIRD_START_X, y: screenHeight / 2 });
    setBirdVelocity(0);
    setPipes([]);
    setScore(0);
    setNextPipeId(0);
    lastPipeXRef.current = screenWidth;
    setGameState('start');
  }, [screenHeight, screenWidth]);

  /**
   * Start the game - called when user taps on start screen
   */
  const startGame = useCallback(() => {
    setGameState('playing');
    setBirdVelocity(FLAP_STRENGTH); // Give initial upward velocity
  }, []);

  /**
   * Handle bird flap - called when user taps/clicks anywhere
   * This makes the bird jump upward
   */
  const handleFlap = useCallback(() => {
    if (gameState === 'start') {
      startGame();
    } else if (gameState === 'playing') {
      // Apply upward force to the bird
      setBirdVelocity(FLAP_STRENGTH);
    } else if (gameState === 'gameOver') {
      // Restart game if tapping during game over
      initGame();
      startGame();
    }
  }, [gameState, startGame, initGame]);

  /**
   * Generate a new pipe at the right edge of the screen
   * Each pipe has a random gap position
   */
  const generatePipe = useCallback(() => {
    // Calculate random gap position
    // Gap should be at least 100px from top and bottom
    const minGapY = 100;
    const maxGapY = screenHeight - PIPE_GAP - 100;
    const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

    const newPipe = {
      id: nextPipeId,
      x: screenWidth,
      topHeight: gapY,
      passed: false, // Track if bird has passed this pipe (for scoring)
    };

    setPipes((prevPipes) => [...prevPipes, newPipe]);
    setNextPipeId((prevId) => prevId + 1);
    lastPipeXRef.current = screenWidth;
  }, [screenWidth, screenHeight, nextPipeId]);

  /**
   * Check if the bird collides with a pipe or screen boundaries
   * Returns true if collision detected
   */
  const checkCollision = useCallback((birdPos, currentPipes) => {
    // Check if bird hits top or bottom of screen
    if (birdPos.y <= 0 || birdPos.y + BIRD_SIZE >= screenHeight) {
      return true;
    }

    // Check collision with each pipe
    for (const pipe of currentPipes) {
      // Check if bird is within pipe's horizontal range
      if (
        birdPos.x < pipe.x + PIPE_WIDTH &&
        birdPos.x + BIRD_SIZE > pipe.x
      ) {
        // Check if bird hits top pipe
        if (birdPos.y < pipe.topHeight) {
          return true;
        }
        // Check if bird hits bottom pipe
        if (birdPos.y + BIRD_SIZE > pipe.topHeight + PIPE_GAP) {
          return true;
        }
      }
    }

    return false;
  }, [screenHeight]);

  /**
   * Main game loop - runs every frame using requestAnimationFrame
   * This function updates:
   * - Bird position based on velocity and gravity
   * - Pipe positions (moving them left)
   * - Generates new pipes when needed
   * - Checks for collisions
   * - Updates score when bird passes pipes
   */
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') {
      return;
    }

    // Update bird velocity (apply gravity)
    setBirdVelocity((prevVel) => {
      const newVelocity = prevVel + GRAVITY;
      
      // Update bird position based on new velocity
      setBirdPosition((prevPos) => {
        const newY = prevPos.y + newVelocity;

        // Update pipes
        setPipes((prevPipes) => {
          let newPipes = prevPipes.map((pipe) => {
            // Move pipe left
            const newX = pipe.x - PIPE_SPEED;

            // Check if bird passed this pipe (for scoring)
            let passed = pipe.passed;
            if (!passed && pipe.x + PIPE_WIDTH < prevPos.x) {
              passed = true;
              setScore((prevScore) => prevScore + 1);
            }

            return { ...pipe, x: newX, passed };
          });

          // Remove pipes that are off-screen
          newPipes = newPipes.filter((pipe) => pipe.x + PIPE_WIDTH > 0);

          // Generate new pipe if needed
          // Check if the rightmost pipe is far enough to the left
          const rightmostPipe = newPipes.length > 0
            ? Math.max(...newPipes.map((p) => p.x))
            : 0;

          if (rightmostPipe < screenWidth - PIPE_SPACING) {
            // Generate new pipe
            const minGapY = 100;
            const maxGapY = screenHeight - PIPE_GAP - 100;
            const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

            newPipes.push({
              id: nextPipeId,
              x: screenWidth,
              topHeight: gapY,
              passed: false,
            });
            setNextPipeId((prevId) => prevId + 1);
          }

          // Check for collisions with updated pipes
          if (checkCollision({ x: prevPos.x, y: newY }, newPipes)) {
            setGameState('gameOver');
            return newPipes;
          }

          return newPipes;
        });

        return { ...prevPos, y: newY };
      });

      return newVelocity;
    });

    // Continue the game loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, screenWidth, screenHeight, checkCollision, nextPipeId]);

  /**
   * Start the game loop when game state changes to 'playing'
   */
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      // Stop the game loop
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }

    // Cleanup: cancel animation frame when component unmounts
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  /**
   * Initialize pipes when game starts
   */
  useEffect(() => {
    if (gameState === 'playing' && pipes.length === 0) {
      // Generate initial pipes
      const initialPipes = [];
      for (let i = 0; i < 3; i++) {
        const minGapY = 100;
        const maxGapY = screenHeight - PIPE_GAP - 100;
        const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

        initialPipes.push({
          id: i,
          x: screenWidth + i * PIPE_SPACING,
          topHeight: gapY,
          passed: false,
        });
      }
      setPipes(initialPipes);
      setNextPipeId(3);
    }
  }, [gameState, screenWidth, screenHeight, pipes.length]);

  /**
   * Render the start screen
   */
  const renderStartScreen = () => (
    <View style={styles.startScreen}>
      <Text style={styles.startTitle}>Flappy Bird</Text>
      <Text style={styles.startInstruction}>Tap anywhere to start!</Text>
    </View>
  );

  /**
   * Render the restart button handler
   */
  const handleRestart = useCallback(() => {
    initGame();
    startGame();
  }, [initGame, startGame]);

  return (
    <TouchableWithoutFeedback onPress={handleFlap}>
      <View style={styles.container}>
        <StatusBar hidden />
        
        {/* Sky background with gradient effect */}
        <View style={styles.background} />

        {/* Render pipes */}
        {pipes.map((pipe) => (
          <Pipe
            key={pipe.id}
            x={pipe.x}
            topHeight={pipe.topHeight}
            gap={PIPE_GAP}
            screenHeight={screenHeight}
            width={PIPE_WIDTH}
          />
        ))}

        {/* Render bird */}
        {gameState !== 'start' && (
          <Bird position={birdPosition} size={BIRD_SIZE} />
        )}

        {/* Render score (only during gameplay) */}
        {gameState === 'playing' && <Score score={score} />}

        {/* Render start screen */}
        {gameState === 'start' && renderStartScreen()}

        {/* Render game over screen */}
        {gameState === 'gameOver' && (
          <GameOver score={score} onRestart={handleRestart} />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB', // Sky blue background
    overflow: 'hidden', // Prevent elements from going outside screen
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#87CEEB', // Sky blue
  },
  startScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(135, 206, 235, 0.9)', // Semi-transparent sky blue
  },
  startTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  startInstruction: {
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default FlappyBirdGame;
