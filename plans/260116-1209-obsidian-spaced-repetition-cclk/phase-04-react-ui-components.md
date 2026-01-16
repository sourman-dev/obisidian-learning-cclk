# Phase 4: React UI Components

**Status:** pending
**Priority:** high

---

## Overview
Build React components for sidebar panel: topic selector, flashcard display, matching pairs, rating buttons, and progress stats.

## Context Links
- [Research: Obsidian React Plugin](research/researcher-260116-1309-obsidian-react-plugin.md)
- [Phase 3: Card Parser](phase-03-card-parser-data-layer.md)

---

## UI Wireframe

```
┌─────────────────────────────┐
│ 📚 CCLK Flashcards         │
├─────────────────────────────┤
│ Mode: [Single] [Mixed]      │
├─────────────────────────────┤
│ Topics:                     │
│ ☑ Lục khí cơ bản    (5/12) │
│ ☑ Tam tiêu          (3/8)  │
│ ☐ Ngũ hành          (0/10) │
├─────────────────────────────┤
│ Due: 8 cards                │
│ [▶ Start Session]           │
├─────────────────────────────┤
│                             │
│   ╔═══════════════════╗     │
│   ║    QUESTION       ║     │
│   ║                   ║     │
│   ║  Thái dương Hàn   ║     │
│   ║  thủy chủ trị     ║     │
│   ║  kinh nào?        ║     │
│   ╚═══════════════════╝     │
│                             │
│       [Show Answer]         │
│                             │
├─────────────────────────────┤
│ [Again] [Hard] [Good] [Easy]│
├─────────────────────────────┤
│ Progress: 3/8               │
│ ████████░░░░░░░░ 37.5%      │
│ 🔥 Streak: 5 days           │
└─────────────────────────────┘
```

---

## Files to Create

### 1. src/types/study-session-types.ts
```typescript
/**
 * Study Session Types
 */

import { CardWithState } from "./card-types";
import { SessionStats } from "../core/card-scheduler";

/** Study mode */
export type StudyMode = "single" | "mixed";

/** Session phase */
export type SessionPhase = "setup" | "studying" | "complete";

/** Card display state */
export type CardPhase = "question" | "answer";

/** Study session state */
export interface StudySession {
  phase: SessionPhase;
  mode: StudyMode;
  selectedTopics: string[];
  cards: CardWithState[];
  currentIndex: number;
  cardPhase: CardPhase;
  stats: SessionStats;
}

/** Initial session state */
export const INITIAL_SESSION: StudySession = {
  phase: "setup",
  mode: "single",
  selectedTopics: [],
  cards: [],
  currentIndex: 0,
  cardPhase: "question",
  stats: {
    totalCards: 0,
    completed: 0,
    correct: 0,
    incorrect: 0,
    accuracy: 0
  }
};
```

### 2. src/hooks/use-study-session.ts
```typescript
/**
 * Study Session Hook
 *
 * Manages study session state and logic.
 */

import { useState, useCallback } from "react";
import { CardWithState } from "../types/card-types";
import { StudySession, StudyMode, INITIAL_SESSION } from "../types/study-session-types";
import { SimpleQuality } from "../types/sm2-types";
import { simpleToQuality, processReview } from "../core/sm2-algorithm";
import { getSessionCards, updateSessionStats } from "../core/card-scheduler";
import { useAppContext } from "../context/app-context";

export function useStudySession(
  allCards: CardWithState[],
  onCardReviewed: (cardId: string, state: any) => Promise<void>
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
```

### 3. src/components/sidebar-app.tsx (Updated)
```typescript
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
  const handleCardReviewed = useCallback(async (cardId: string, state: any) => {
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
        <h2>📚 CCLK Flashcards</h2>
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
```

### 4. src/components/topic-selector.tsx
```typescript
/**
 * Topic Selector Component
 */

import { useState } from "react";
import { TopicInfo } from "../types/card-types";
import { StudyMode } from "../types/study-session-types";

interface TopicSelectorProps {
  topics: TopicInfo[];
  onStart: (topics: string[], mode: StudyMode) => void;
}

export function TopicSelector({ topics, onStart }: TopicSelectorProps) {
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<StudyMode>("single");

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedTopics(new Set(topics.map((t) => t.name)));
  };

  const deselectAll = () => {
    setSelectedTopics(new Set());
  };

  const totalDue = topics
    .filter((t) => selectedTopics.has(t.name))
    .reduce((sum, t) => sum + t.dueCount, 0);

  const handleStart = () => {
    if (selectedTopics.size === 0) return;
    onStart(Array.from(selectedTopics), mode);
  };

  return (
    <div className="cclk-topic-selector">
      {/* Mode selector */}
      <div className="cclk-mode-selector">
        <span>Mode:</span>
        <button
          className={mode === "single" ? "active" : ""}
          onClick={() => setMode("single")}
        >
          Single
        </button>
        <button
          className={mode === "mixed" ? "active" : ""}
          onClick={() => setMode("mixed")}
        >
          Mixed
        </button>
      </div>

      {/* Topic list */}
      <div className="cclk-topic-list">
        <div className="cclk-topic-header">
          <span>Topics:</span>
          <div className="cclk-topic-actions">
            <button onClick={selectAll}>All</button>
            <button onClick={deselectAll}>None</button>
          </div>
        </div>

        {topics.map((topic) => (
          <label key={topic.name} className="cclk-topic-item">
            <input
              type="checkbox"
              checked={selectedTopics.has(topic.name)}
              onChange={() => toggleTopic(topic.name)}
            />
            <span className="cclk-topic-name">{topic.name}</span>
            <span className="cclk-topic-count">
              ({topic.dueCount}/{topic.cardCount})
            </span>
          </label>
        ))}

        {topics.length === 0 && (
          <p className="cclk-empty">No card files found</p>
        )}
      </div>

      {/* Start button */}
      <div className="cclk-start-section">
        <p className="cclk-due-count">Due: {totalDue} cards</p>
        <button
          className="mod-cta cclk-start-button"
          onClick={handleStart}
          disabled={selectedTopics.size === 0 || totalDue === 0}
        >
          ▶ Start Session
        </button>
      </div>
    </div>
  );
}
```

### 5. src/components/flashcard-display.tsx
```typescript
/**
 * Flashcard Display Component
 */

import { CardWithState } from "../types/card-types";

interface FlashcardDisplayProps {
  card: CardWithState;
  showAnswer: boolean;
  onShowAnswer: () => void;
}

export function FlashcardDisplay({
  card,
  showAnswer,
  onShowAnswer
}: FlashcardDisplayProps) {
  return (
    <div className="cclk-flashcard">
      {/* Topic badge */}
      <div className="cclk-card-topic">{card.topic}</div>

      {/* Card type indicator */}
      <div className="cclk-card-type">
        {card.type === "reverse" && "🔄 "}
        {card.type === "forward" && "➡️ "}
      </div>

      {/* Question */}
      <div className="cclk-card-question">
        <div className="cclk-card-label">Question</div>
        <div className="cclk-card-content">{card.question}</div>
      </div>

      {/* Answer or show button */}
      {showAnswer ? (
        <div className="cclk-card-answer">
          <div className="cclk-card-label">Answer</div>
          <div className="cclk-card-content">{card.answer}</div>
        </div>
      ) : (
        <button className="cclk-show-answer" onClick={onShowAnswer}>
          Show Answer
        </button>
      )}
    </div>
  );
}
```

### 6. src/components/matching-pairs-display.tsx
```typescript
/**
 * Matching Pairs Display Component
 */

import { useState, useMemo, useEffect } from "react";
import { MatchingPair } from "../types/card-types";

interface MatchingPairsDisplayProps {
  pairs: MatchingPair[];
  onComplete: (allCorrect: boolean) => void;
}

interface SelectionState {
  selectedTerm: number | null;
  selectedDef: number | null;
  matched: Set<number>;
  incorrect: Set<number>;
}

export function MatchingPairsDisplay({
  pairs,
  onComplete
}: MatchingPairsDisplayProps) {
  const [state, setState] = useState<SelectionState>({
    selectedTerm: null,
    selectedDef: null,
    matched: new Set(),
    incorrect: new Set()
  });

  // Shuffle definitions
  const shuffledDefs = useMemo(() => {
    const indices = pairs.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [pairs]);

  // Check for completion
  useEffect(() => {
    if (state.matched.size === pairs.length) {
      const hadErrors = state.incorrect.size > 0;
      onComplete(!hadErrors);
    }
  }, [state.matched, state.incorrect, pairs.length, onComplete]);

  const selectTerm = (index: number) => {
    if (state.matched.has(index)) return;
    setState((prev) => ({ ...prev, selectedTerm: index }));
    checkMatch(index, state.selectedDef);
  };

  const selectDef = (shuffledIndex: number) => {
    const actualIndex = shuffledDefs[shuffledIndex];
    if (state.matched.has(actualIndex)) return;
    setState((prev) => ({ ...prev, selectedDef: actualIndex }));
    checkMatch(state.selectedTerm, actualIndex);
  };

  const checkMatch = (termIdx: number | null, defIdx: number | null) => {
    if (termIdx === null || defIdx === null) return;

    if (termIdx === defIdx) {
      // Correct match
      setState((prev) => ({
        ...prev,
        matched: new Set([...prev.matched, termIdx]),
        selectedTerm: null,
        selectedDef: null
      }));
    } else {
      // Incorrect
      setState((prev) => ({
        ...prev,
        incorrect: new Set([...prev.incorrect, termIdx]),
        selectedTerm: null,
        selectedDef: null
      }));
    }
  };

  return (
    <div className="cclk-matching">
      <div className="cclk-matching-label">Match the pairs:</div>

      <div className="cclk-matching-columns">
        {/* Terms column */}
        <div className="cclk-matching-terms">
          {pairs.map((pair, i) => (
            <button
              key={`term-${i}`}
              className={`cclk-match-item ${
                state.matched.has(i) ? "matched" : ""
              } ${state.selectedTerm === i ? "selected" : ""}`}
              onClick={() => selectTerm(i)}
              disabled={state.matched.has(i)}
            >
              {pair.term}
            </button>
          ))}
        </div>

        {/* Definitions column */}
        <div className="cclk-matching-defs">
          {shuffledDefs.map((actualIdx, shuffledIdx) => (
            <button
              key={`def-${shuffledIdx}`}
              className={`cclk-match-item ${
                state.matched.has(actualIdx) ? "matched" : ""
              } ${state.selectedDef === actualIdx ? "selected" : ""}`}
              onClick={() => selectDef(shuffledIdx)}
              disabled={state.matched.has(actualIdx)}
            >
              {pairs[actualIdx].definition}
            </button>
          ))}
        </div>
      </div>

      <div className="cclk-matching-progress">
        {state.matched.size}/{pairs.length} matched
      </div>
    </div>
  );
}
```

### 7. src/components/rating-buttons.tsx
```typescript
/**
 * Rating Buttons Component
 */

import { SimpleQuality } from "../types/sm2-types";

interface RatingButtonsProps {
  onRate: (rating: SimpleQuality) => void;
}

const ratings: { key: SimpleQuality; label: string; color: string }[] = [
  { key: "again", label: "Again", color: "red" },
  { key: "hard", label: "Hard", color: "orange" },
  { key: "good", label: "Good", color: "green" },
  { key: "easy", label: "Easy", color: "blue" }
];

export function RatingButtons({ onRate }: RatingButtonsProps) {
  return (
    <div className="cclk-rating-buttons">
      {ratings.map((r) => (
        <button
          key={r.key}
          className={`cclk-rating-btn cclk-rating-${r.color}`}
          onClick={() => onRate(r.key)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
```

### 8. src/components/progress-stats.tsx
```typescript
/**
 * Progress Stats Component
 */

interface ProgressStatsProps {
  completed: number;
  total: number;
  accuracy: number;
}

export function ProgressStats({ completed, total, accuracy }: ProgressStatsProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="cclk-progress-stats">
      <div className="cclk-progress-text">
        Progress: {completed}/{total}
      </div>
      <div className="cclk-progress-bar">
        <div
          className="cclk-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {completed > 0 && (
        <div className="cclk-accuracy">
          Accuracy: {(accuracy * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
}
```

### 9. src/components/session-complete.tsx
```typescript
/**
 * Session Complete Component
 */

import { SessionStats } from "../core/card-scheduler";

interface SessionCompleteProps {
  stats: SessionStats;
  onContinue: () => void;
}

export function SessionComplete({ stats, onContinue }: SessionCompleteProps) {
  const emoji = stats.accuracy >= 0.8 ? "🎉" : stats.accuracy >= 0.5 ? "👍" : "💪";

  return (
    <div className="cclk-session-complete">
      <div className="cclk-complete-emoji">{emoji}</div>
      <h3>Session Complete!</h3>

      <div className="cclk-complete-stats">
        <div className="cclk-stat">
          <span className="cclk-stat-value">{stats.completed}</span>
          <span className="cclk-stat-label">Cards Reviewed</span>
        </div>
        <div className="cclk-stat">
          <span className="cclk-stat-value">{(stats.accuracy * 100).toFixed(0)}%</span>
          <span className="cclk-stat-label">Accuracy</span>
        </div>
        <div className="cclk-stat">
          <span className="cclk-stat-value">{stats.correct}</span>
          <span className="cclk-stat-label">Correct</span>
        </div>
      </div>

      <button className="mod-cta" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
```

### 10. styles.css (Complete)
```css
/* CCLK Flashcards Styles */

.cclk-sidebar {
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.cclk-sidebar h2 {
  margin-bottom: 1rem;
  color: var(--text-accent);
  border-bottom: 1px solid var(--background-modifier-border);
  padding-bottom: 0.5rem;
}

.cclk-loading {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
}

/* Mode Selector */
.cclk-mode-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.cclk-mode-selector button {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.cclk-mode-selector button.active {
  background: var(--interactive-accent);
  color: var(--text-on-accent);
}

/* Topic List */
.cclk-topic-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.cclk-topic-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.cclk-topic-actions {
  display: flex;
  gap: 0.25rem;
}

.cclk-topic-actions button {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
}

.cclk-topic-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.cclk-topic-item:hover {
  background: var(--background-modifier-hover);
}

.cclk-topic-name {
  flex: 1;
}

.cclk-topic-count {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.cclk-empty {
  color: var(--text-muted);
  text-align: center;
  padding: 2rem;
}

/* Start Section */
.cclk-start-section {
  border-top: 1px solid var(--background-modifier-border);
  padding-top: 1rem;
}

.cclk-due-count {
  text-align: center;
  margin-bottom: 0.5rem;
}

.cclk-start-button {
  width: 100%;
}

/* Flashcard */
.cclk-flashcard {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.cclk-card-topic {
  font-size: 0.75rem;
  color: var(--text-accent);
  margin-bottom: 0.5rem;
}

.cclk-card-type {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.cclk-card-question,
.cclk-card-answer {
  background: var(--background-secondary);
  border-radius: 8px;
  padding: 1rem;
  margin: 0.5rem 0;
}

.cclk-card-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.cclk-card-content {
  font-size: 1.1rem;
  line-height: 1.5;
}

.cclk-show-answer {
  margin-top: auto;
  padding: 0.75rem;
}

/* Rating Buttons */
.cclk-rating-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.cclk-rating-btn {
  flex: 1;
  padding: 0.75rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.cclk-rating-red { background: var(--color-red); color: white; }
.cclk-rating-orange { background: var(--color-orange); color: white; }
.cclk-rating-green { background: var(--color-green); color: white; }
.cclk-rating-blue { background: var(--color-blue); color: white; }

/* Progress Stats */
.cclk-progress-stats {
  margin-bottom: 1rem;
}

.cclk-progress-text {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
}

.cclk-progress-bar {
  height: 6px;
  background: var(--background-modifier-border);
  border-radius: 3px;
  overflow: hidden;
}

.cclk-progress-fill {
  height: 100%;
  background: var(--interactive-accent);
  transition: width 0.3s ease;
}

.cclk-accuracy {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: right;
  margin-top: 0.25rem;
}

/* Matching Pairs */
.cclk-matching {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.cclk-matching-label {
  margin-bottom: 1rem;
  font-weight: 500;
}

.cclk-matching-columns {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.cclk-matching-terms,
.cclk-matching-defs {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cclk-match-item {
  padding: 0.5rem;
  border-radius: 4px;
  background: var(--background-secondary);
  text-align: left;
  border: 2px solid transparent;
}

.cclk-match-item.selected {
  border-color: var(--interactive-accent);
}

.cclk-match-item.matched {
  background: var(--color-green);
  color: white;
  opacity: 0.7;
}

.cclk-matching-progress {
  margin-top: 1rem;
  text-align: center;
  color: var(--text-muted);
}

/* Session Complete */
.cclk-session-complete {
  text-align: center;
  padding: 2rem;
}

.cclk-complete-emoji {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.cclk-complete-stats {
  display: flex;
  justify-content: space-around;
  margin: 2rem 0;
}

.cclk-stat {
  display: flex;
  flex-direction: column;
}

.cclk-stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-accent);
}

.cclk-stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}
```

---

## Implementation Steps

1. [ ] Create src/types/study-session-types.ts
2. [ ] Create src/hooks/use-study-session.ts
3. [ ] Update src/components/sidebar-app.tsx
4. [ ] Create src/components/topic-selector.tsx
5. [ ] Create src/components/flashcard-display.tsx
6. [ ] Create src/components/matching-pairs-display.tsx
7. [ ] Create src/components/rating-buttons.tsx
8. [ ] Create src/components/progress-stats.tsx
9. [ ] Create src/components/session-complete.tsx
10. [ ] Update styles.css
11. [ ] Build and test in Obsidian

---

## Success Criteria

- [ ] Topic selector shows topics with due counts
- [ ] Mode toggle works (Single/Mixed)
- [ ] Start session loads due cards
- [ ] Flashcard displays question, then answer
- [ ] Rating buttons update card state
- [ ] Matching pairs interactive and functional
- [ ] Progress bar updates correctly
- [ ] Session complete shows stats
- [ ] Styling matches Obsidian theme

---

## Next Phase
→ [Phase 5: CCLK Content Extraction](phase-05-cclk-content-extraction.md)
