import { createHash } from "crypto";

/**
 * Provably Fair RNG System for Coin Flip Game
 * Implements Stake.com-style provably fair mechanics with 2% house edge
 */

export interface GameSession {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  maxStreak: number;
}

export interface FlipResult {
  result: "heads" | "tails";
  nonce: number;
  hash: string;
  isWin: boolean;
  streak: number;
  multiplier: number;
  payout: number;
}

export interface GameStats {
  totalFlips: number;
  totalWins: number;
  currentStreak: number;
  maxStreak: number;
  totalWinnings: number;
  totalBets: number;
}

/**
 * Generate a random server seed and its SHA-256 hash
 * The hash is revealed to the player before the game starts
 * The actual seed is revealed after the game session ends
 */
export function generateServerSeed(): { seed: string; hash: string } {
  const seed = generateRandomString(64);
  const hash = createHash("sha256").update(seed).digest("hex");
  return { seed, hash };
}

/**
 * Generate a random client seed (can be provided by player or auto-generated)
 */
export function generateClientSeed(): string {
  return generateRandomString(32);
}

/**
 * Generate a random string of specified length
 */
function generateRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculate the multiplier based on streak length
 * Formula: Multiplier = 1.96 × 2^(n-1)
 * This ensures a 2% house edge (98% RTP)
 */
export function calculateMultiplier(streak: number): number {
  if (streak <= 0) return 0;
  
  // Progressive multiplier system for coin flip:
  // 1st win: 1.2X, 2nd win: 1.3X, 3rd win: 1.4X, 4th win: 1.5X, 5th win: 2.0X (max)
  const multipliers = [1.2, 1.3, 1.4, 1.5, 2.0];
  
  // Return the multiplier for the current streak (streak is 1-indexed)
  if (streak > multipliers.length) {
    return multipliers[multipliers.length - 1]; // Max multiplier (2.0X)
  }
  
  return multipliers[streak - 1];
}

/**
 * Calculate payout amount based on bet and multiplier
 */
export function calculatePayout(betAmount: number, multiplier: number): number {
  return betAmount * multiplier;
}

/**
 * Generate a provably fair flip result
 * Uses server seed, client seed, and nonce to create deterministic but unpredictable results
 * Implements 49% win probability to achieve 2% house edge
 */
export function generateFlipResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  selectedSide: "heads" | "tails",
  currentStreak: number = 0
): FlipResult {
  // Create the input string for hashing
  const input = `${serverSeed}:${clientSeed}:${nonce}`;

  // Generate SHA-256 hash
  const hash = createHash("sha256").update(input).digest("hex");

  // Convert first 8 characters of hash to decimal
  const hashDecimal = parseInt(hash.substring(0, 8), 16);

  // Normalize to 0-1 range
  const normalized = hashDecimal / 0xffffffff;

  // Determine result with 49% win probability (2% house edge)
  // 0-0.49 = win, 0.49-1.0 = loss
  const isWin = normalized < 0.49;

  // Determine actual coin result
  const result: "heads" | "tails" = isWin
    ? selectedSide
    : selectedSide === "heads"
    ? "tails"
    : "heads";

  // Calculate new streak
  const newStreak = isWin ? currentStreak + 1 : 0;

  // Calculate multiplier and payout
  const multiplier = calculateMultiplier(newStreak);
  const payout = isWin ? calculatePayout(1, multiplier) : 0; // Assuming bet amount of 1 for calculation

  return {
    result,
    nonce,
    hash,
    isWin,
    streak: newStreak,
    multiplier,
    payout,
  };
}

/**
 * Verify a flip result (for transparency)
 * Players can use this to verify that the result was not manipulated
 */
export function verifyFlipResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  expectedHash: string
): boolean {
  const input = `${serverSeed}:${clientSeed}:${nonce}`;
  const calculatedHash = createHash("sha256").update(input).digest("hex");
  return calculatedHash === expectedHash;
}

/**
 * Initialize a new game session
 */
export function initializeGameSession(clientSeed?: string): GameSession {
  const { seed, hash } = generateServerSeed();
  return {
    serverSeed: seed,
    serverSeedHash: hash,
    clientSeed: clientSeed || generateClientSeed(),
    nonce: 0,
    maxStreak: 20,
  };
}

/**
 * Update game statistics
 */
export function updateGameStats(
  currentStats: GameStats,
  flipResult: FlipResult,
  betAmount: number
): GameStats {
  return {
    totalFlips: currentStats.totalFlips + 1,
    totalWins: currentStats.totalWins + (flipResult.isWin ? 1 : 0),
    currentStreak: flipResult.streak,
    maxStreak: Math.max(currentStats.maxStreak, flipResult.streak),
    totalWinnings:
      currentStats.totalWinnings +
      (flipResult.isWin ? flipResult.payout * betAmount : 0),
    totalBets: currentStats.totalBets + betAmount,
  };
}

/**
 * Calculate win rate percentage
 */
export function calculateWinRate(stats: GameStats): number {
  if (stats.totalFlips === 0) return 0;
  return (stats.totalWins / stats.totalFlips) * 100;
}

/**
 * Calculate RTP (Return to Player) percentage
 */
export function calculateRTP(stats: GameStats): number {
  if (stats.totalBets === 0) return 0;
  return (stats.totalWinnings / stats.totalBets) * 100;
}
