/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Implementation of SuperMemo-2 algorithm for scheduling flashcard reviews.
 * Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

import {
  SM2CardState,
  QualityRating,
  SimpleQuality,
  DEFAULT_SM2_STATE
} from "../types/sm2-types";

/** Minimum ease factor allowed */
const MIN_EASE_FACTOR = 1.3;

/** Default initial ease factor */
const DEFAULT_EASE_FACTOR = 2.5;

/**
 * Maps simple quality labels to SM-2 numeric ratings
 */
export function simpleToQuality(simple: SimpleQuality): QualityRating {
  const mapping: Record<SimpleQuality, QualityRating> = {
    again: 1, // Complete blackout
    hard: 3, // Correct with serious difficulty
    good: 4, // Correct with some hesitation
    easy: 5 // Perfect response
  };
  return mapping[simple];
}

/**
 * Calculate new ease factor based on quality rating
 *
 * Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 */
export function calculateEaseFactor(
  currentEF: number,
  quality: QualityRating
): number {
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const newEF = currentEF + delta;
  return Math.max(MIN_EASE_FACTOR, newEF);
}

/**
 * Calculate next interval in days
 *
 * Rules:
 * - quality < 3: Reset to 1 day (failed)
 * - repetitions = 0: 1 day
 * - repetitions = 1: 6 days
 * - repetitions >= 2: previous_interval × ease_factor
 */
export function calculateInterval(
  state: SM2CardState,
  quality: QualityRating
): number {
  // Failed review resets progress
  if (quality < 3) {
    return 1;
  }

  // First successful review
  if (state.repetitions === 0) {
    return 1;
  }

  // Second successful review
  if (state.repetitions === 1) {
    return 6;
  }

  // Subsequent reviews
  return Math.round(state.interval * state.easeFactor);
}

/**
 * Calculate new repetition count
 */
export function calculateRepetitions(
  currentReps: number,
  quality: QualityRating
): number {
  // Failed review resets count
  if (quality < 3) {
    return 0;
  }
  return currentReps + 1;
}

/**
 * Add days to a date and return ISO date string
 */
export function addDaysToDate(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split("T")[0];
}

/**
 * Process a review and calculate new SM-2 state
 *
 * @param state Current card state
 * @param quality Quality rating for this review
 * @returns New card state
 */
export function processReview(
  state: SM2CardState,
  quality: QualityRating
): SM2CardState {
  const newEaseFactor = calculateEaseFactor(state.easeFactor, quality);
  const newInterval = calculateInterval(state, quality);
  const newRepetitions = calculateRepetitions(state.repetitions, quality);
  const nextReview = addDaysToDate(new Date(), newInterval);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview
  };
}

/**
 * Check if a card is due for review
 *
 * @param state Card state
 * @param today Today's date (ISO string, defaults to current date)
 */
export function isDue(state: SM2CardState, today?: string): boolean {
  const todayStr = today || new Date().toISOString().split("T")[0];
  return state.nextReview <= todayStr;
}

/**
 * Create initial state for a new card
 */
export function createInitialState(): SM2CardState {
  return { ...DEFAULT_SM2_STATE };
}

/**
 * Get human-readable description of next review
 */
export function getReviewDescription(state: SM2CardState): string {
  const today = new Date().toISOString().split("T")[0];

  if (state.nextReview <= today) {
    return "Due now";
  }

  const nextDate = new Date(state.nextReview);
  const diffDays = Math.ceil(
    (nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 1) return "Due tomorrow";
  if (diffDays < 7) return `Due in ${diffDays} days`;
  if (diffDays < 30) return `Due in ${Math.ceil(diffDays / 7)} weeks`;
  return `Due in ${Math.ceil(diffDays / 30)} months`;
}
