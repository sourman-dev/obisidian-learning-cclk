/**
 * Study Session Hook
 *
 * Manages study session state and logic.
 */

import { useState, useCallback } from "react";
import { CardWithState } from "../types/card-types";
import { SM2CardState } from "../types/sm2-types";
import { StudySession, StudyMode, INITIAL_SESSION } from "../types/study-session-types";
import { SimpleQuality } from "../types/sm2-types";
import { simpleToQuality, processReview } from "../core/sm2-algorithm";
import { getSessionCards, updateSessionStats } from "../core/card-scheduler";

export function useStudySession(
  allCards: CardWithState[],
  onCardReviewed: (cardId: string, state: SM2CardState) => Promise<void>
) {
  const [session, setSession] = useState<StudySession>(INITIAL_SESSION);

  /** Start new session */
  const startSession = useCallback((topics: string[], mode: StudyMode) => {
    const cards = getSessionCards(allCards, topics, mode === "mixed");

    setSession({
      phase: "studying",
      mode,
      selectedTopics: topics,
      cards,
      currentIndex: 0,
      cardPhase: "question",
      stats: {
        totalCards: cards.length,
        completed: 0,
        correct: 0,
        incorrect: 0,
        accuracy: 0
      }
    });
  }, [allCards]);

  /** Show answer */
  const showAnswer = useCallback(() => {
    setSession((prev) => ({ ...prev, cardPhase: "answer" }));
  }, []);

  /** Rate card and move to next */
  const rateCard = useCallback(async (rating: SimpleQuality) => {
    const currentCard = session.cards[session.currentIndex];
    if (!currentCard) return;

    const quality = simpleToQuality(rating);
    const newState = processReview(currentCard.state, quality);

    // Update progress
    await onCardReviewed(currentCard.id, newState);

    // Update stats
    const newStats = updateSessionStats(session.stats, quality);

    // Move to next card or complete
    const nextIndex = session.currentIndex + 1;
    const isComplete = nextIndex >= session.cards.length;

    setSession((prev) => ({
      ...prev,
      currentIndex: nextIndex,
      cardPhase: "question",
      stats: newStats,
      phase: isComplete ? "complete" : "studying"
    }));
  }, [session, onCardReviewed]);

  /** Reset session */
  const resetSession = useCallback(() => {
    setSession(INITIAL_SESSION);
  }, []);

  /** Get current card */
  const currentCard = session.cards[session.currentIndex] || null;

  return {
    session,
    currentCard,
    startSession,
    showAnswer,
    rateCard,
    resetSession
  };
}
