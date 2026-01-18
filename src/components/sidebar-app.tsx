/**
 * Main Sidebar Application
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAppContext } from "../context/app-context";
import { TopicSelector } from "./topic-selector";
import { FlashcardDisplay } from "./flashcard-display";
import { MatchingPairsDisplay } from "./matching-pairs-display";
import { RatingButtons } from "./rating-buttons";
import { ProgressStats } from "./progress-stats";
import { SessionComplete } from "./session-complete";
import { AnalyticsView } from "./analytics-view";
import { DrillMode } from "./drill-mode";
import { MCQDisplay } from "./mcq-display";
import { GamificationStats } from "./gamification-stats";
import { useStudySession } from "../hooks/use-study-session";
import { CardLoader } from "../core/card-loader";
import { ProgressManager } from "../core/progress-manager";
import { ConfusionTracker, initConfusionTracker } from "../core/confusion-tracker";
import { AnalyticsEngine } from "../core/analytics-engine";
import { getSemanticMatrix } from "../core/semantic-matrix";
import { TopicInfo, CardWithState } from "../types/card-types";
import { SM2CardState } from "../types/sm2-types";
import { StudyMode, RatingType } from "../types/study-session-types";

type ViewMode = "main" | "analytics" | "drill";

export function SidebarApp() {
  const { app, plugin } = useAppContext();

  // Core managers
  const [progressManager] = useState(
    () => new ProgressManager(app, plugin.settings.dataFolder)
  );
  const [cardLoader] = useState(
    () => new CardLoader(app, plugin.settings.cardsFolder, progressManager)
  );
  const [confusionTracker] = useState(() => initConfusionTracker());

  // Analytics engine
  const analyticsEngine = useMemo(() => {
    return new AnalyticsEngine(
      progressManager,
      confusionTracker,
      getSemanticMatrix()
    );
  }, [progressManager, confusionTracker]);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("main");
  const [drillConcepts, setDrillConcepts] = useState<string[]>([]);

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

  // Handle starting drill mode
  const handleStartDrill = useCallback((conceptIds: string[]) => {
    setDrillConcepts(conceptIds);
    setViewMode("drill");
  }, []);

  // Handle drill card rating
  const handleDrillRate = useCallback(async (cardId: string, rating: RatingType) => {
    // Use the same rating logic
    const qualityMap: Record<RatingType, number> = {
      again: 1,
      hard: 2,
      good: 4,
      easy: 5
    };
    const quality = qualityMap[rating];

    // Update card state (simplified for drill mode)
    const card = cards.find(c => c.id === cardId);
    if (card) {
      const newState = { ...card.state };
      // Update next review based on rating
      const daysToAdd = rating === "again" ? 0 : rating === "hard" ? 1 : rating === "good" ? 3 : 7;
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      newState.nextReview = nextDate.toISOString().split("T")[0];
      await progressManager.updateCardState(cardId, newState);
    }
  }, [cards, progressManager]);

  // Handle drill complete
  const handleDrillComplete = useCallback(() => {
    setViewMode("main");
    setDrillConcepts([]);
  }, []);

  if (loading) {
    return <div className="cclk-loading">Loading cards...</div>;
  }

  // Analytics view
  if (viewMode === "analytics") {
    return (
      <div className="cclk-sidebar">
        <AnalyticsView
          analytics={analyticsEngine}
          onStartDrill={handleStartDrill}
          onClose={() => setViewMode("main")}
        />
      </div>
    );
  }

  // Drill mode view
  if (viewMode === "drill") {
    return (
      <div className="cclk-sidebar">
        <DrillMode
          conceptIds={drillConcepts}
          cards={cards}
          onRateCard={handleDrillRate}
          onComplete={handleDrillComplete}
        />
      </div>
    );
  }

  // Setup phase
  if (session.phase === "setup") {
    return (
      <div className="cclk-sidebar">
        <div className="cclk-header">
          <h2>CCLK Flashcards</h2>
          <button
            className="cclk-analytics-button"
            onClick={() => setViewMode("analytics")}
            title="View Analytics"
          >
            Analytics
          </button>
        </div>
        <GamificationStats progressManager={progressManager} />
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
      ) : currentCard && currentCard.type === "mcq" ? (
        <MCQDisplay
          card={currentCard}
          onAnswer={(correct, selectedIndex) => {
            rateCard(correct ? "good" : "again");
          }}
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
