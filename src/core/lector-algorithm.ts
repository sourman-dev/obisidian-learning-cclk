/**
 * LECTOR Algorithm - Semantic-Aware Spaced Repetition
 *
 * Implementation of LECTOR (LLM-Enhanced Concept-based Test-Oriented Repetition)
 * algorithm that considers semantic interference between similar concepts.
 *
 * Key improvements over SM-2:
 * - Semantic interference reduces intervals for confusable pairs
 * - Mastery level tracks concept understanding depth
 * - Personalized adjustments based on learner profile
 */

import { SM2CardState, QualityRating } from "../types/sm2-types";
import {
  LECTORCardState,
  LearnerProfile,
  DEFAULT_LEARNER_PROFILE,
  DEFAULT_LECTOR_STATE
} from "../types/lector-types";
import {
  calculateEaseFactor,
  calculateInterval,
  calculateRepetitions,
  addDaysToDate
} from "./sm2-algorithm";

/** Minimum mastery level */
const MIN_MASTERY = 0;
/** Maximum mastery level */
const MAX_MASTERY = 5;

/**
 * Calculate LECTOR-adjusted interval
 *
 * Formula: Interval = BaseInterval × MasteryFactor × (1 - SemanticPenalty) × PersonalFactor
 *
 * @param baseInterval - SM-2 calculated interval
 * @param masteryLevel - Current mastery level (0-5)
 * @param semanticInterference - Max interference score from confusable pairs (0-1)
 * @param profile - Learner profile with personal adjustments
 */
export function calculateLECTORInterval(
  baseInterval: number,
  masteryLevel: number,
  semanticInterference: number,
  profile: LearnerProfile
): number {
  // Mastery scaling: higher mastery = longer intervals
  // Level 0: 1.0x, Level 5: 2.0x
  const masteryFactor = 1 + masteryLevel * 0.2;

  // Semantic penalty: high interference reduces interval
  // semanticSensitivity controls how much interference affects user
  const semanticPenalty = semanticInterference * profile.semanticSensitivity;
  const semanticFactor = Math.max(0.3, 1 - semanticPenalty); // Never reduce below 30%

  // Personal learning speed adjustment
  const personalFactor = profile.learningSpeed;

  const adjustedInterval =
    baseInterval * masteryFactor * semanticFactor * personalFactor;

  // Minimum 1 day, round to nearest day
  return Math.max(1, Math.round(adjustedInterval));
}

/**
 * Update mastery level based on quality rating
 *
 * - Quality 5: +1 mastery
 * - Quality 4: +0.5 mastery
 * - Quality 3: no change
 * - Quality < 3: -1 mastery (reset progress)
 */
export function updateMastery(
  currentMastery: number,
  quality: QualityRating
): number {
  let delta = 0;

  if (quality >= 5) {
    delta = 1;
  } else if (quality >= 4) {
    delta = 0.5;
  } else if (quality < 3) {
    delta = -1;
  }

  const newMastery = currentMastery + delta;
  return Math.max(MIN_MASTERY, Math.min(MAX_MASTERY, newMastery));
}

/**
 * Process a review using LECTOR algorithm
 *
 * @param state - Current LECTOR card state
 * @param quality - Quality rating for this review
 * @param semanticInterference - Max interference from confusable concepts
 * @param profile - Learner profile
 * @returns New LECTOR card state
 */
export function processLECTORReview(
  state: LECTORCardState,
  quality: QualityRating,
  semanticInterference: number,
  profile: LearnerProfile
): LECTORCardState {
  // Calculate base SM-2 values
  const newEaseFactor = calculateEaseFactor(state.easeFactor, quality);
  const baseInterval = calculateInterval(state, quality);
  const newRepetitions = calculateRepetitions(state.repetitions, quality);

  // Apply LECTOR adjustments
  const newMastery = updateMastery(state.masteryLevel, quality);
  const lectorInterval = calculateLECTORInterval(
    baseInterval,
    newMastery,
    semanticInterference,
    profile
  );

  const nextReview = addDaysToDate(new Date(), lectorInterval);

  return {
    easeFactor: newEaseFactor,
    interval: lectorInterval,
    repetitions: newRepetitions,
    nextReview,
    semanticInterference,
    confusedWith: state.confusedWith,
    masteryLevel: newMastery
  };
}

/**
 * Record confusion between concepts
 *
 * When user selects wrong answer in MCQ, track the confusion
 */
export function recordConfusion(
  state: LECTORCardState,
  confusedWithId: string
): LECTORCardState {
  const existing = new Set(state.confusedWith);
  existing.add(confusedWithId);

  // Keep only last 5 confusions
  const confusedWith = [...existing].slice(-5);

  return {
    ...state,
    confusedWith
  };
}

/**
 * Calculate priority score for card scheduling
 *
 * Higher priority = should be shown sooner
 *
 * Factors:
 * - Due status (base 100 if due)
 * - Semantic interference (high interference = priority boost)
 * - Overdue days (more overdue = higher priority)
 * - Low mastery (less mastered = higher priority)
 */
export function calculatePriorityScore(
  state: LECTORCardState,
  today?: string
): number {
  const todayStr = today || new Date().toISOString().split("T")[0];

  // Base priority: 100 if due, 0 if not
  const isDue = state.nextReview <= todayStr;
  let priority = isDue ? 100 : 0;

  // Semantic interference boost (0-20 points)
  priority += state.semanticInterference * 20;

  // Overdue boost (5 points per day overdue, max 50)
  if (isDue) {
    const dueDate = new Date(state.nextReview);
    const todayDate = new Date(todayStr);
    const overdueDays = Math.floor(
      (todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    priority += Math.min(50, overdueDays * 5);
  }

  // Low mastery boost (0-25 points for mastery 0)
  priority += (MAX_MASTERY - state.masteryLevel) * 5;

  return priority;
}

/**
 * Create initial LECTOR state for a new card
 */
export function createInitialLECTORState(): LECTORCardState {
  return {
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: new Date().toISOString().split("T")[0],
    ...DEFAULT_LECTOR_STATE
  };
}

/**
 * Convert SM2 state to LECTOR state
 *
 * Used for migrating existing progress data
 */
export function convertSM2ToLECTOR(sm2State: SM2CardState): LECTORCardState {
  return {
    ...sm2State,
    ...DEFAULT_LECTOR_STATE
  };
}

/**
 * Get effective interval description for UI
 */
export function getIntervalDescription(
  baseInterval: number,
  lectorInterval: number
): string {
  if (lectorInterval < baseInterval) {
    const reduction = Math.round(
      ((baseInterval - lectorInterval) / baseInterval) * 100
    );
    return `${lectorInterval}d (${reduction}% shorter due to confusion risk)`;
  }
  if (lectorInterval > baseInterval) {
    const increase = Math.round(
      ((lectorInterval - baseInterval) / baseInterval) * 100
    );
    return `${lectorInterval}d (${increase}% longer due to mastery)`;
  }
  return `${lectorInterval}d`;
}
