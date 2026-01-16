/**
 * Main Sidebar Application
 */

import { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../context/app-context";
import { TopicSelector } from "./topic-selector";
import { FlashcardDisplay } from "./flashcard-display";
import { MatchingPairsDisplay } from "./matching-pairs-display";
import { RatingButtons } from "./rating-buttons";
import { ProgressStats } from "./progress-stats";
import { SessionComplete } from "./session-complete";
import { useStudySession } from "../hooks/use-study-session";
import { CardLoader } from "../core/card-loader";
import { ProgressManager } from "../core/progress-manager";
import { TopicInfo, CardWithState } from "../types/card-types";
import { SM2CardState } from "../types/sm2-types";
import { StudyMode } from "../types/study-session-types";

export function SidebarApp() {
  const { app, plugin } = useAppContext();

  // Core managers
  const [progressManager] = useState(
    () => new ProgressManager(app, plugin.settings.dataFolder)
  );
  const [cardLoader] = useState(
    () => new CardLoader(app, plugin.settings.cardsFolder, progressManager)
  );

  // Data state
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [cards, setCards] = useState<CardWithState[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const loadedTopics = await cardLoader.getTopics();
      const loadedCards = await cardLoader.loadCardsWithState();
      setTopics(loadedTopics);
      setCards(loadedCards);
      setLoading(false);
    }
    loadData();
  }, [cardLoader]);

  // Card review handler
  const handleCardReviewed = useCallback(async (cardId: string, state: SM2CardState) => {
    await progressManager.updateCardState(cardId, state);
  }, [progressManager]);

  // Study session hook
  const {
    session,
    currentCard,
    startSession,
    showAnswer,
    rateCard,
    resetSession
  } = useStudySession(cards, handleCardReviewed);

  // Handle session start
  const handleStart = useCallback((selectedTopics: string[], mode: StudyMode) => {
    startSession(selectedTopics, mode);
  }, [startSession]);

  // Handle session end
  const handleSessionEnd = useCallback(async () => {
    await progressManager.recordSession(session.stats, session.selectedTopics);
    // Reload data
    cardLoader.clearCache();
    const loadedTopics = await cardLoader.getTopics();
    const loadedCards = await cardLoader.loadCardsWithState();
    setTopics(loadedTopics);
    setCards(loadedCards);
    resetSession();
  }, [progressManager, cardLoader, session, resetSession]);

  if (loading) {
    return <div className="cclk-loading">Loading cards...</div>;
  }

  // Setup phase
  if (session.phase === "setup") {
    return (
      <div className="cclk-sidebar">
        <h2>CCLK Flashcards</h2>
        <TopicSelector topics={topics} onStart={handleStart} />
      </div>
    );
  }

  // Complete phase
  if (session.phase === "complete") {
    return (
      <div className="cclk-sidebar">
        <SessionComplete stats={session.stats} onContinue={handleSessionEnd} />
      </div>
    );
  }

  // Studying phase
  return (
    <div className="cclk-sidebar">
      <ProgressStats
        completed={session.stats.completed}
        total={session.stats.totalCards}
        accuracy={session.stats.accuracy}
      />

      {currentCard && currentCard.type === "matching" ? (
        <MatchingPairsDisplay
          pairs={currentCard.pairs || []}
          onComplete={(correct) => rateCard(correct ? "good" : "again")}
        />
      ) : currentCard ? (
        <>
          <FlashcardDisplay
            card={currentCard}
            showAnswer={session.cardPhase === "answer"}
            onShowAnswer={showAnswer}
          />
          {session.cardPhase === "answer" && (
            <RatingButtons onRate={rateCard} />
          )}
        </>
      ) : null}
    </div>
  );
}
