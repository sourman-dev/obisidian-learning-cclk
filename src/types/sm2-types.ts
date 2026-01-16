/**
 * SM-2 Algorithm Types
 * Based on SuperMemo-2 spaced repetition algorithm
 */

/** Quality rating for card review (0-5 scale) */
export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;

/** Simplified quality for UI (maps to 0-5) */
export type SimpleQuality = "again" | "hard" | "good" | "easy";

/** SM-2 card state */
export interface SM2CardState {
  /** Ease factor, minimum 1.3 */
  easeFactor: number;
  /** Days until next review */
  interval: number;
  /** Number of successful repetitions */
  repetitions: number;
  /** ISO date string for next review */
  nextReview: string;
}

/** Review history entry */
export interface ReviewEntry {
  date: string;
  quality: QualityRating;
  interval: number;
  easeFactor: number;
}

/** Default initial state for new cards */
export const DEFAULT_SM2_STATE: SM2CardState = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  nextReview: new Date().toISOString().split("T")[0]
};
