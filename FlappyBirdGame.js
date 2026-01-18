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

const FlappyBirdGame = ({ avatarUrl, avatarId = 'bird' }) => {
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

  // Game state management - Original Flappy Bird flow
  // States: 'start', 'playing', 'hit', 'gameOver'
  // Flow: READY → PLAYING → HIT → (falling) → GAME_OVER
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'hit', 'gameOver'
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
  const hasHitGroundRef = useRef(false); // Track if bird has hit ground (prevents multiple ground hit triggers)

  // Sound refs
  const wingSoundRef = useRef(null);
  const pointSoundRef = useRef(null);
  const dieSoundRef = useRef(null);
  const hasPlayedDieSoundRef = useRef(false);

  // Calculate dynamic pipe gap (at least 180px or 28% of screen height, whichever is larger)
  const PIPE_GAP = Math.max(180, screenHeight * 0.28);
  
  // Calculate dynamic pipe spacing (15% of screen width)
  const PIPE_SPACING = screenWidth * 0.15;

  /**
   * Initialize sounds - load audio files on component mount
   */
  useEffect(() => {
    if (typeof window === 'undefined' || Platform.OS !== 'web') return;

    // For web: use require() to get bundled asset paths
    const loadSound = async (ref, assetModule) => {
      try {
        // Get the resolved URI from the asset
        const resolved = assetModule;
        ref.current = new Audio(resolved);
        ref.current.preload = 'auto';
        ref.current.volume = 0.5;
        ref.current.load();
        console.log('Sound loaded:', resolved);
      } catch (e) {
        console.log('Could not load sound:', e);
      }
    };

    // Load sounds using require (bundled by webpack)
    loadSound(wingSoundRef, require('./assets/sounds/flappy-birds-wing.mp3'));
    loadSound(pointSoundRef, require('./assets/sounds/flappy-birds-point.mp3'));
    loadSound(dieSoundRef, require('./assets/sounds/flappy-birds-die.mp3'));

    // Cleanup
    return () => {
      [wingSoundRef, pointSoundRef, dieSoundRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current = null;
        }
      });
    };
  }, []);

  /**
   * Play a sound (with overlap prevention)
   */
  const playSound = useCallback((soundRef) => {
    if (soundRef.current) {
      try {
        soundRef.current.currentTime = 0;
        soundRef.current.play().catch(() => {});
      } catch (e) {}
    }
  }, []);

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
    hasHitGroundRef.current = false; // Reset ground hit flag
    hasPlayedDieSoundRef.current = false; // Reset die sound flag
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
      return;
    } else if (gameState === 'playing') {
      // Input is enabled during 'playing' state only
      // Apply upward force to the bird
      setBirdVelocity(FLAP_STRENGTH);
      // Play wing flap sound
      playSound(wingSoundRef);
    } else if (gameState === 'hit') {
      // Input disabled during 'hit' state (bird falling after collision)
      // Do nothing - player cannot control bird after collision
      return;
    } else if (gameState === 'gameOver') {
      // Restart game if tapping during game over
      initGame();
      startGame();
    }
  }, [gameState, startGame, initGame, playSound]);

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
    // Game loop runs during 'playing' and 'hit' states (bird falling after collision)
    if (gameState !== 'playing' && gameState !== 'hit') {
      return;
    }

    const isInHitState = gameState === 'hit';

    // Update background scroll position (continuous scrolling - stop in hit state)
    if (!isInHitState) {
      setBackgroundScrollX((prevScroll) => prevScroll + BACKGROUND_SPEED);
    }

    // Update bird velocity (apply gravity - ALWAYS, even in hit state)
    setBirdVelocity((prevVel) => {
      const newVelocity = prevVel + GRAVITY;
      
      // Update bird position based on new velocity
      setBirdPosition((prevPos) => {
        const newY = prevPos.y + newVelocity;

        // Check for screen boundary collisions (only in 'playing' state)
        if (!isInHitState) {
          const collisionY = newY + BIRD_COLLISION_OFFSET;
          // Check if bird hits top or bottom of screen
          if (collisionY <= 0 || collisionY + BIRD_COLLISION_SIZE >= screenHeight) {
            // Bird hit screen boundary - transition to HIT state
            setGameState('hit');
            // Play die sound (only once)
            if (!hasPlayedDieSoundRef.current && dieSoundRef.current) {
              hasPlayedDieSoundRef.current = true;
              dieSoundRef.current.currentTime = 0;
              dieSoundRef.current.play().catch(() => {});
            }
            
            // In hit state: stop pipe updates (pipes don't move)
            return { ...prevPos, y: newY };
          }
        }
        
        // In HIT state: Check if bird hits ground, then wait 500ms before showing scoreboard
        if (isInHitState) {
          const birdBottom = newY + BIRD_COLLISION_OFFSET + BIRD_COLLISION_SIZE;
          const groundLevel = screenHeight - 50; // Approximate ground level
          
          // Check if bird has hit the ground (only trigger once)
          if (birdBottom >= groundLevel && !hasHitGroundRef.current) {
            hasHitGroundRef.current = true; // Mark as hit ground to prevent retriggering
            
            // Bird hit ground - wait 500ms then show scoreboard
            setTimeout(() => {
              setGameState('gameOver');
            }, 500);
          }
          
          // In hit state: stop pipe updates (pipes don't move)
          return { ...prevPos, y: newY };
        }

        // Update pipes (only in 'playing' state, not in 'hit' state)
        setPipes((prevPipes) => {
          let newPipes = prevPipes.map((pipe) => {
            // Move pipe left
            const newX = pipe.x - PIPE_SPEED;

            // Check if bird passed this pipe (for scoring)
            let passed = pipe.passed;
            if (!passed && pipe.x + PIPE_WIDTH < prevPos.x) {
              passed = true;
              setScore((prevScore) => prevScore + 1);
              // Play point sound
              if (pointSoundRef.current) {
                pointSoundRef.current.currentTime = 0;
                pointSoundRef.current.play().catch(() => {});
              }
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

          // Check for collisions with updated pipes (only in 'playing' state)
          if (!isInHitState && checkCollision({ x: prevPos.x, y: newY }, newPipes)) {
            // Bird hit pillar - transition to HIT state (not gameOver yet)
            // In HIT state: pipes stop, bird continues falling
            setGameState('hit');
            // Play die sound (only once)
            if (!hasPlayedDieSoundRef.current && dieSoundRef.current) {
              hasPlayedDieSoundRef.current = true;
              dieSoundRef.current.currentTime = 0;
              dieSoundRef.current.play().catch(() => {});
            }
            
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
   * Start the game loop when game state changes to 'playing' or 'hit'
   */
  useEffect(() => {
    if (gameState === 'playing' || gameState === 'hit') {
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
        
        {/* Scrolling background (parallax effect) - show during playing, hit, and gameOver */}
        {(gameState === 'playing' || gameState === 'hit' || gameState === 'gameOver') && (
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

        {/* Render bird - visible during gameplay, hit state (falling), and game over */}
        {/* Bird rotation: positive velocity (falling) = rotate down, negative velocity (rising) = rotate up */}
        {(gameState === 'playing' || gameState === 'hit' || gameState === 'gameOver') && (
          <Bird 
            position={birdPosition} 
            size={
              avatarId === 'penguin' ? 120 :
              avatarId === 'flamingo' ? 80 :
              avatarId === 'red' ? 60 :
              avatarId === 'mighty-eagle' ? 140 :
              BIRD_SIZE
            }
            rotation={Math.min(Math.max(birdVelocity * 5, -30), 90)} // Clamp rotation between -30° (max up) and 90° (max down)
            avatarUrl={avatarUrl}
          />
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
