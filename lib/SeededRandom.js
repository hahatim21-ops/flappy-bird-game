/**
 * SeededRandom
 * 
 * Seeded pseudo-random number generator for synchronized multiplayer pipe generation
 * Based on Linear Congruential Generator (LCG)
 */

class SeededRandom {
  constructor(seed) {
    this.seed = seed || Math.floor(Math.random() * 1000000);
    this.current = this.seed;
  }

  /**
   * Generate next random number between 0 and 1
   */
  next() {
    // LCG: (a * x + c) mod m
    // Using constants: a = 1664525, c = 1013904223, m = 2^32
    this.current = (1664525 * this.current + 1013904223) % 0x100000000;
    return this.current / 0x100000000;
  }

  /**
   * Generate random number between min and max (inclusive)
   */
  random(min = 0, max = 1) {
    return min + this.next() * (max - min);
  }

  /**
   * Reset the generator to initial seed
   */
  reset() {
    this.current = this.seed;
  }
}

export default SeededRandom;
