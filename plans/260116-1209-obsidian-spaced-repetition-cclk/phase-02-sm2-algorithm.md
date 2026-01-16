# Phase 2: SM-2 Algorithm

**Status:** pending
**Priority:** high

---

## Overview
Implement SuperMemo-2 spaced repetition algorithm with comprehensive unit tests.

## Context Links
- [SM-2 Algorithm Paper](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Brainstorm Report](reports/brainstorm-260116-1209-obsidian-spaced-repetition-plugin.md)

---

## Key Insights

### SM-2 Formula
```
EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
```
Where:
- EF = Ease Factor (≥ 1.3)
- q = Quality rating (0-5)

### Interval Calculation
- q < 3: Reset to 1 day (failed)
- rep = 0: 1 day
- rep = 1: 6 days
- rep ≥ 2: prev_interval × EF

---

## Files to Create

### 1. src/types/sm2-types.ts
```typescript
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
```

### 2. src/core/sm2-algorithm.ts
```typescript
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
```

### 3. src/core/sm2-algorithm.test.ts
```typescript
/**
 * Unit tests for SM-2 Algorithm
 */

import {
  calculateEaseFactor,
  calculateInterval,
  calculateRepetitions,
  processReview,
  isDue,
  simpleToQuality
} from "./sm2-algorithm";
import { SM2CardState } from "../types/sm2-types";

describe("SM-2 Algorithm", () => {
  describe("calculateEaseFactor", () => {
    it("should decrease EF for quality 3 (hard)", () => {
      const newEF = calculateEaseFactor(2.5, 3);
      expect(newEF).toBeLessThan(2.5);
      expect(newEF).toBeCloseTo(2.36, 2);
    });

    it("should maintain EF for quality 4 (good)", () => {
      const newEF = calculateEaseFactor(2.5, 4);
      expect(newEF).toBeCloseTo(2.5, 2);
    });

    it("should increase EF for quality 5 (easy)", () => {
      const newEF = calculateEaseFactor(2.5, 5);
      expect(newEF).toBeGreaterThan(2.5);
      expect(newEF).toBeCloseTo(2.6, 2);
    });

    it("should not go below minimum 1.3", () => {
      const newEF = calculateEaseFactor(1.3, 0);
      expect(newEF).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe("calculateInterval", () => {
    const baseState: SM2CardState = {
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: "2026-01-16"
    };

    it("should return 1 day for failed review", () => {
      const state = { ...baseState, repetitions: 5, interval: 30 };
      expect(calculateInterval(state, 2)).toBe(1);
    });

    it("should return 1 day for first success", () => {
      expect(calculateInterval(baseState, 4)).toBe(1);
    });

    it("should return 6 days for second success", () => {
      const state = { ...baseState, repetitions: 1, interval: 1 };
      expect(calculateInterval(state, 4)).toBe(6);
    });

    it("should multiply by EF for subsequent reviews", () => {
      const state = { ...baseState, repetitions: 2, interval: 6 };
      expect(calculateInterval(state, 4)).toBe(15); // 6 * 2.5 = 15
    });
  });

  describe("processReview", () => {
    it("should reset on failed review", () => {
      const state: SM2CardState = {
        easeFactor: 2.5,
        interval: 30,
        repetitions: 5,
        nextReview: "2026-01-16"
      };

      const result = processReview(state, 1);
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    it("should progress normally on success", () => {
      const state: SM2CardState = {
        easeFactor: 2.5,
        interval: 6,
        repetitions: 1,
        nextReview: "2026-01-16"
      };

      const result = processReview(state, 4);
      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(6);
    });
  });

  describe("isDue", () => {
    it("should return true for past dates", () => {
      const state: SM2CardState = {
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: "2020-01-01"
      };
      expect(isDue(state)).toBe(true);
    });

    it("should return false for future dates", () => {
      const state: SM2CardState = {
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: "2099-01-01"
      };
      expect(isDue(state)).toBe(false);
    });
  });

  describe("simpleToQuality", () => {
    it("should map simple ratings to SM-2 scale", () => {
      expect(simpleToQuality("again")).toBe(1);
      expect(simpleToQuality("hard")).toBe(3);
      expect(simpleToQuality("good")).toBe(4);
      expect(simpleToQuality("easy")).toBe(5);
    });
  });
});
```

### 4. src/core/card-scheduler.ts
```typescript
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
```

---

## Implementation Steps

1. [ ] Create src/types/sm2-types.ts
2. [ ] Create src/core/sm2-algorithm.ts
3. [ ] Create src/core/card-scheduler.ts
4. [ ] Create test file (if Jest configured)
5. [ ] Verify calculations with manual examples
6. [ ] Build and check for type errors

---

## Test Cases (Manual Verification)

| Scenario | Input | Expected Output |
|----------|-------|-----------------|
| First review, good | rep=0, EF=2.5, q=4 | interval=1, rep=1 |
| Second review, good | rep=1, int=1, EF=2.5, q=4 | interval=6, rep=2 |
| Third review, good | rep=2, int=6, EF=2.5, q=4 | interval=15, rep=3 |
| Failed after 5 reps | rep=5, int=30, q=1 | interval=1, rep=0 |
| Hard response | EF=2.5, q=3 | EF≈2.36 |
| Easy response | EF=2.5, q=5 | EF≈2.6 |

---

## Success Criteria

- [ ] All type definitions compile without errors
- [ ] SM-2 calculations match expected values
- [ ] Edge cases handled (min EF, failed reviews)
- [ ] Scheduler filters due cards correctly
- [ ] Shuffle produces random order

---

## Next Phase
→ [Phase 3: Card Parser + Data Layer](phase-03-card-parser-data-layer.md)
