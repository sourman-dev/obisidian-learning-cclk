/**
 * Card Scheduler
 *
 * Manages card queue for study sessions based on SM-2 due dates.
 */

import { SM2CardState, QualityRating } from "../types/sm2-types";
import { isDue, processReview } from "./sm2-algorithm";
import { Card, CardWithState } from "../types/card-types";

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
