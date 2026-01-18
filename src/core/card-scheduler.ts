/**
 * Card Scheduler
 *
 * Manages card queue for study sessions.
 * Supports both SM-2 (legacy) and LECTOR (semantic-aware) scheduling.
 */

import { SM2CardState, QualityRating } from "../types/sm2-types";
import { LECTORCardState } from "../types/lector-types";
import { isDue, processReview } from "./sm2-algorithm";
import {
  processLECTORReview,
  calculatePriorityScore,
  convertSM2ToLECTOR
} from "./lector-algorithm";
import { getSemanticMatrix } from "./semantic-matrix";
import { getLearnerProfile } from "./learner-profile";
import { Card, CardWithState } from "../types/card-types";

/** Card with LECTOR-enhanced state */
export interface CardWithLECTORState extends Omit<CardWithState, "state"> {
  state: LECTORCardState;
  conceptId?: string;
}

/**
 * Filter cards that are due for review
 */
export function getDueCards(
  cards: CardWithState[],
  today?: string
): CardWithState[] {
  return cards.filter((card) => isDue(card.state, today));
}

/**
 * Sort cards by priority (most overdue first)
 */
export function sortByPriority(cards: CardWithState[]): CardWithState[] {
  const today = new Date().toISOString().split("T")[0];

  return [...cards].sort((a, b) => {
    // Overdue cards first
    const aOverdue = a.state.nextReview <= today;
    const bOverdue = b.state.nextReview <= today;

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Then by next review date
    return a.state.nextReview.localeCompare(b.state.nextReview);
  });
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleCards<T>(cards: T[]): T[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get cards for a study session
 *
 * @param cards All cards with state
 * @param topics Filter by topics (empty = all)
 * @param shuffle Whether to shuffle cards
 * @param limit Maximum cards to return (0 = no limit)
 */
export function getSessionCards(
  cards: CardWithState[],
  topics: string[],
  shuffle: boolean,
  limit: number = 0
): CardWithState[] {
  // Filter by topics
  let filtered = cards;
  if (topics.length > 0) {
    filtered = cards.filter((card) => topics.includes(card.topic));
  }

  // Get due cards
  const due = getDueCards(filtered);

  // Sort by priority
  let sorted = sortByPriority(due);

  // Shuffle if requested
  if (shuffle) {
    sorted = shuffleCards(sorted);
  }

  // Apply limit
  if (limit > 0) {
    sorted = sorted.slice(0, limit);
  }

  return sorted;
}

/**
 * Calculate session statistics
 */
export interface SessionStats {
  totalCards: number;
  completed: number;
  correct: number;
  incorrect: number;
  accuracy: number;
}

export function createSessionStats(): SessionStats {
  return {
    totalCards: 0,
    completed: 0,
    correct: 0,
    incorrect: 0,
    accuracy: 0
  };
}

export function updateSessionStats(
  stats: SessionStats,
  quality: QualityRating
): SessionStats {
  const isCorrect = quality >= 3;
  const newCompleted = stats.completed + 1;
  const newCorrect = isCorrect ? stats.correct + 1 : stats.correct;
  const newIncorrect = !isCorrect ? stats.incorrect + 1 : stats.incorrect;

  return {
    ...stats,
    completed: newCompleted,
    correct: newCorrect,
    incorrect: newIncorrect,
    accuracy: newCompleted > 0 ? newCorrect / newCompleted : 0
  };
}

// =============================================================================
// LECTOR-Enhanced Scheduling
// =============================================================================

/**
 * Sort cards by LECTOR priority score
 *
 * Uses semantic interference and mastery level for smarter ordering.
 */
export function sortByLECTORPriority(
  cards: CardWithLECTORState[]
): CardWithLECTORState[] {
  const today = new Date().toISOString().split("T")[0];

  return [...cards].sort((a, b) => {
    const priorityA = calculatePriorityScore(a.state, today);
    const priorityB = calculatePriorityScore(b.state, today);
    return priorityB - priorityA; // Higher priority first
  });
}

/**
 * Get cards for a LECTOR-enhanced study session
 *
 * Cards with high semantic interference are prioritized.
 */
export function getLECTORSessionCards(
  cards: CardWithLECTORState[],
  topics: string[],
  shuffle: boolean,
  limit: number = 0
): CardWithLECTORState[] {
  // Filter by topics
  let filtered = cards;
  if (topics.length > 0) {
    filtered = cards.filter((card) => topics.includes(card.topic));
  }

  // Get due cards
  const today = new Date().toISOString().split("T")[0];
  const due = filtered.filter((card) => card.state.nextReview <= today);

  // Sort by LECTOR priority
  let sorted = sortByLECTORPriority(due);

  // Shuffle if requested (but keep high-priority cards at front)
  if (shuffle && sorted.length > 3) {
    // Keep top 3 by priority, shuffle the rest
    const top = sorted.slice(0, 3);
    const rest = shuffleCards(sorted.slice(3));
    sorted = [...top, ...rest];
  }

  // Apply limit
  if (limit > 0) {
    sorted = sorted.slice(0, limit);
  }

  return sorted;
}

/**
 * Process a LECTOR review and update learner profile
 *
 * @param card - Card with LECTOR state
 * @param quality - Quality rating
 * @param selectedAnswerId - For MCQ, the selected answer concept ID
 * @returns Updated card state
 */
export function processLECTORCardReview(
  card: CardWithLECTORState,
  quality: QualityRating,
  selectedAnswerId?: string
): LECTORCardState {
  const matrix = getSemanticMatrix();
  const profile = getLearnerProfile();

  // Get semantic interference for this concept
  const semanticInterference = card.conceptId
    ? matrix.getMaxInterference(card.conceptId)
    : 0;

  // Process the review with LECTOR algorithm
  const newState = processLECTORReview(
    card.state,
    quality,
    semanticInterference,
    profile.getProfile()
  );

  // Update learner profile
  const isCorrect = quality >= 3;
  profile.recordAnswer(
    card.conceptId || card.id,
    isCorrect,
    selectedAnswerId,
    card.type === "mcq" ? "mcq" : "recall"
  );

  return newState;
}

/**
 * Convert legacy cards to LECTOR-enhanced cards
 */
export function convertToLECTORCards(
  cards: CardWithState[]
): CardWithLECTORState[] {
  return cards.map((card) => ({
    ...card,
    state: convertSM2ToLECTOR(card.state),
    conceptId: extractConceptId(card)
  }));
}

/**
 * Extract concept ID from card frontmatter or content
 */
function extractConceptId(card: CardWithState): string | undefined {
  // Try to get from card metadata if available
  // This is a simple heuristic - can be enhanced based on card structure
  const match = card.id.match(/^([a-z-]+)-/);
  return match ? match[1] : undefined;
}
