import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Text,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import Bird from './components/Bird';
import Pipe from './components/Pipe';
import Score from './components/Score';
import GameOver from './components/GameOver';
import Background from './components/Background';

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
const BACKGROUND_SPEED = 1; // Background scroll speed (slower than pipes for parallax effect)
const PIPE_WIDTH = 90; // Width of each pipe (pixels) - increased thickness
const BIRD_SIZE = 100; // Size of the bird container (width and height in pixels)
// Classic Flappy Bird sprite is ~34x24px, with transparent space around it
// In 100px container with resizeMode="contain", visible bird is ~40-50px
// Use precise collision box (40px) to match the visible bird core
// Collision ONLY when bird's base/body visually touches pipe, not on gaps
const BIRD_COLLISION_SIZE = 40; // Collision box size - matches visible bird core
const BIRD_COLLISION_OFFSET = 30; // Offset to center collision box (100 - 40) / 2 = 30px
const BIRD_START_X = 100; // Starting horizontal position of the bird
const FIRST_PIPE_DELAY = 500; // Delay before first pipe appears (milliseconds)
const MIN_TOP_PIPE_HEIGHT = 60; // Minimum height of top pipe (pixels)
const MIN_BOTTOM_PIPE_HEIGHT = 60; // Minimum height of bottom pipe (pixels)

const FlappyBirdGame = () => {
  // Get screen dimensions for responsive design
  const screenData = Dimensions.get('window');
  const screenWidth = screenData.width;
  const screenHeight = screenData.height;

  // Get initial image index from localStorage, or default to 0
  // On each refresh, switch to the other image
  const getInitialImageIndex = () => {
    if (typeof window !== 'undefined') {
      const lastIndex = localStorage.getItem('flappyBirdStartImageIndex');
      if (lastIndex !== null) {
        // Switch to the other image
        const newIndex = (parseInt(lastIndex, 10) + 1) % 2;
        localStorage.setItem('flappyBirdStartImageIndex', newIndex.toString());
        return newIndex;
      } else {
        // First time - start with image 0 and save it
        localStorage.setItem('flappyBirdStartImageIndex', '0');
        return 0;
      }
    }
    return 0; // Default to first image on first load
  };

  // Game state management
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameOver'
  const [birdPosition, setBirdPosition] = useState({ x: BIRD_START_X, y: screenHeight / 2 });
  const [birdVelocity, setBirdVelocity] = useState(0); // Vertical velocity of the bird
  const [pipes, setPipes] = useState([]); // Array of pipe objects
  const [score, setScore] = useState(0);
  const [nextPipeId, setNextPipeId] = useState(0); // Unique ID for each pipe
  const [startScreenImageIndex] = useState(getInitialImageIndex); // Use localStorage to persist and switch on refresh
  const [backgroundScrollX, setBackgroundScrollX] = useState(0); // Background scroll position

  // Refs to track animation frame and game loop
  const gameLoopRef = useRef(null);
  const lastPipeXRef = useRef(screenWidth); // Track the rightmost pipe position
  const gameStartTimeRef = useRef(null); // Track when game started playing
  const firstPipeSpawnedRef = useRef(false); // Track if first pipe has been spawned

  // Calculate dynamic pipe gap (at least 180px or 28% of screen height, whichever is larger)
  const PIPE_GAP = Math.max(180, screenHeight * 0.28);
  
  // Calculate dynamic pipe spacing (15% of screen width)
  const PIPE_SPACING = screenWidth * 0.15;

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
    gameStartTimeRef.current = null;
    firstPipeSpawnedRef.current = false;
    setBackgroundScrollX(0); // Reset background scroll
    setGameState('start');
  }, [screenHeight, screenWidth]);

  /**
   * Start the game - called when user taps on start screen
   */
  const startGame = useCallback(() => {
    setGameState('playing');
    setBirdVelocity(FLAP_STRENGTH); // Give initial upward velocity
    gameStartTimeRef.current = Date.now(); // Record when game started
    firstPipeSpawnedRef.current = true; // Mark that pipes can spawn immediately
    
    // Generate initial pipes immediately when game starts
    const pipeGap = Math.max(180, screenHeight * 0.28);
    const pipeSpacing = screenWidth * 0.15;
    const minGapY = MIN_TOP_PIPE_HEIGHT;
    const maxGapY = screenHeight - pipeGap - MIN_BOTTOM_PIPE_HEIGHT;
    const validMaxGapY = Math.max(minGapY, maxGapY);
    
    const initialPipes = [];
    // Generate enough pipes to fill the entire screen and beyond when game starts
    // First pipe starts with more space from bird
    const initialPipeOffset = 300; // Fixed distance: 300px from bird (increased)
    
    // Calculate how many pipes we need to fill the entire screen
    // We want pipes to extend from the first pipe position to well beyond the screen width
    const firstPipeX = BIRD_START_X + initialPipeOffset;
    
    // Generate enough pipes to cover the entire visible screen plus many extra off-screen
    // Calculate pipes needed: from first pipe to beyond screen width
    const visibleArea = screenWidth - firstPipeX; // Visible area from first pipe to screen edge
    const pipesForVisibleArea = Math.ceil(visibleArea / pipeSpacing) + 1; // Pipes needed for visible area
    const extraPipes = 10; // Extra pipes off-screen to ensure continuous flow
    const pipesNeeded = pipesForVisibleArea + extraPipes; // Total pipes needed
    
    // Generate all pipes at once - they will all be visible/ready at start
    for (let i = 0; i < pipesNeeded; i++) {
      const gapY = Math.random() * (validMaxGapY - minGapY) + minGapY;
      initialPipes.push({
        id: i,
        x: firstPipeX + (i * pipeSpacing), // Start from first pipe position, spaced evenly
        topHeight: gapY,
        passed: false,
      });
    }
    setPipes(initialPipes);
    setNextPipeId(pipesNeeded);
    lastPipeXRef.current = firstPipeX + ((pipesNeeded - 1) * pipeSpacing);
  }, [screenWidth, screenHeight]);

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
   * Each pipe has a random gap position that is always passable
   */
  const generatePipe = useCallback(() => {
    // Calculate dynamic pipe gap (at least 180px or 28% of screen height, whichever is larger)
    const pipeGap = Math.max(180, screenHeight * 0.28);
    
    // Calculate valid gap position range
    // Top pipe must be at least MIN_TOP_PIPE_HEIGHT from top
    // Bottom pipe must be at least MIN_BOTTOM_PIPE_HEIGHT from bottom
    // So: minGapY = MIN_TOP_PIPE_HEIGHT, maxGapY = screenHeight - pipeGap - MIN_BOTTOM_PIPE_HEIGHT
    const minGapY = MIN_TOP_PIPE_HEIGHT;
    const maxGapY = screenHeight - pipeGap - MIN_BOTTOM_PIPE_HEIGHT;
    
    // Ensure maxGapY is valid (must be >= minGapY)
    const validMaxGapY = Math.max(minGapY, maxGapY);
    const gapY = Math.random() * (validMaxGapY - minGapY) + minGapY;

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
   * PRECISE collision detection - game ends ONLY when bird's base visually touches pipe
   */
  const checkCollision = useCallback((birdPos, currentPipes) => {
    // Collision box matches the visible bird core
    // Collision box (40px) centered in 100px bird = matches visible bird core
    const collisionX = birdPos.x + BIRD_COLLISION_OFFSET;
    const collisionY = birdPos.y + BIRD_COLLISION_OFFSET;
    
    // Check if bird hits top or bottom of screen
    if (collisionY <= 0 || collisionY + BIRD_COLLISION_SIZE >= screenHeight) {
      return true;
    }

    // Calculate dynamic pipe gap (at least 180px or 28% of screen height, whichever is larger)
    const pipeGap = Math.max(180, screenHeight * 0.28);

    // Check collision with each pipe - ONLY when bird's base visually touches pipe
    // NO false collisions - collision ONLY on actual visual contact
    for (const pipe of currentPipes) {
      // Check if bird's collision box horizontally overlaps with the pipe
      // Use precise boundaries - collision only when collision box actually enters pipe area
      const horizontalOverlap = (
        collisionX + BIRD_COLLISION_SIZE > pipe.x && // Bird's right edge is past pipe's left edge
        collisionX < pipe.x + PIPE_WIDTH // Bird's left edge is before pipe's right edge
      );
      
      if (horizontalOverlap) {
        // Check if bird's collision box vertically overlaps with top pipe
        // Top pipe goes from 0 to pipe.topHeight
        // Collision ONLY when bird's base/body actually touches or enters top pipe
        // Check if bird's bottom edge (base) is below pipe bottom OR bird's top is above pipe top
        if (collisionY + BIRD_COLLISION_SIZE > 0 && collisionY < pipe.topHeight) {
          // Bird is actually inside/touching the top pipe
          return true;
        }
        
        // Check if bird's collision box vertically overlaps with bottom pipe
        // Bottom pipe starts at pipe.topHeight + pipeGap
        // Collision ONLY when bird's base/body actually touches or enters bottom pipe
        const bottomPipeTop = pipe.topHeight + pipeGap;
        if (collisionY < screenHeight && collisionY + BIRD_COLLISION_SIZE > bottomPipeTop) {
          // Bird is actually inside/touching the bottom pipe
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

    // Update background scroll position (continuous scrolling)
    setBackgroundScrollX((prevScroll) => prevScroll + BACKGROUND_SPEED);

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

          // Generate new pipe if needed (no delay - pipes spawn immediately)
          // Check if the rightmost pipe is far enough to the left to spawn a new one
          const rightmostPipe = newPipes.length > 0
            ? Math.max(...newPipes.map((p) => p.x))
            : screenWidth; // Default to screenWidth if no pipes exist

          // Calculate dynamic pipe spacing (15% of screen width) - consistent for all pipes
          const pipeSpacing = screenWidth * 0.15;

          // Generate new pipe when rightmost pipe is within spawn range
          // Spawn new pipe at rightmostPipe + pipeSpacing to maintain equal spacing
          // Keep enough pipes ahead to fill the screen (at least 8-10 pipes to prevent one-by-one appearance)
          if ((rightmostPipe <= screenWidth - pipeSpacing) && newPipes.length < 10) {
            // Calculate dynamic pipe gap (at least 180px or 28% of screen height, whichever is larger)
            const pipeGap = Math.max(180, screenHeight * 0.28);
            
            // Calculate valid gap position range
            // Top pipe must be at least MIN_TOP_PIPE_HEIGHT from top
            // Bottom pipe must be at least MIN_BOTTOM_PIPE_HEIGHT from bottom
            const minGapY = MIN_TOP_PIPE_HEIGHT;
            const maxGapY = screenHeight - pipeGap - MIN_BOTTOM_PIPE_HEIGHT;
            
            // Ensure maxGapY is valid (must be >= minGapY)
            const validMaxGapY = Math.max(minGapY, maxGapY);
            const gapY = Math.random() * (validMaxGapY - minGapY) + minGapY;

            // Spawn new pipe at exactly pipeSpacing distance from the rightmost pipe
            // This ensures equal spacing between all pipes (same as initial pipes)
            const newPipeX = rightmostPipe + pipeSpacing;
            
            newPipes.push({
              id: nextPipeId,
              x: newPipeX,
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
   * Pipes are now generated in the gameLoop with a 2.5 second delay
   * This useEffect is removed to prevent immediate pipe spawning
   */

  /**
   * Add keyboard support for SPACE key
   * Works on web platform
   */
  useEffect(() => {
    // Only add keyboard listener on web
    if (typeof window === 'undefined') {
      return;
    }

    const handleKeyPress = (event) => {
      // Check if SPACE key is pressed (keyCode 32 or key === ' ')
      if (event.key === ' ' || event.keyCode === 32) {
        event.preventDefault(); // Prevent page scroll when spacebar is pressed
        handleFlap();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Cleanup: remove event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleFlap]);

  /**
   * Render the start screen
   * Alternates between two images on each refresh
   */
  const renderStartScreen = () => {
    // Two images to alternate between
    const imageSources = [
      { 
        uri: 'https://playgama.com/cdn-cgi/imagedelivery/LN2S-4p3-GgZvEx3IPaKUA/d1b2cd7d-f05c-44f6-ec64-87100c024e00/original'
      },
      { 
        uri: 'https://cdn1.epicgames.com/spt-assets/36082ce08c3f402f8155bb3a2fd8afeb/flappy-bird-wnu7w.png' 
      }
    ];

    // Toggle image index on each render/mount
    const currentImage = imageSources[startScreenImageIndex];

    return (
      <View style={styles.startScreen}>
        <Image
          source={currentImage}
          style={styles.titleImage}
          resizeMode="cover"
        />
        <View style={styles.instructionOverlay}>
          <Text style={styles.startInstruction}>Tap anywhere or press SPACE to start!</Text>
        </View>
      </View>
    );
  };

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
        
        {/* Scrolling background (parallax effect) - show during playing and gameOver */}
        {(gameState === 'playing' || gameState === 'gameOver') && (
          <Background scrollX={backgroundScrollX} gameState={gameState} />
        )}
        
        {/* Sky background fallback (only if Background component fails) */}
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

        {/* Render bird - always visible during gameplay and game over */}
        {(gameState === 'playing' || gameState === 'gameOver') && (
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
    zIndex: 1, // Lower z-index so user bar is above it
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent', // Transparent so background image shows through
  },
  startScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  titleImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  instructionOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startInstruction: {
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: 20,
  },
});

export default FlappyBirdGame;
