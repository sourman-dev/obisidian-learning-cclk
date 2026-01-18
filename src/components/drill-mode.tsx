/**
 * Drill Mode Component
 *
 * Focused practice session on weak concepts.
 * Shows cards from confused concept pairs more frequently.
 */

import { useState, useEffect } from "react";
import { CardWithState } from "../types/card-types";
import { FlashcardDisplay } from "./flashcard-display";
import { RatingButtons } from "./rating-buttons";
import { RatingType } from "../types/study-session-types";

interface DrillModeProps {
  conceptIds: string[];
  cards: CardWithState[];
  onRateCard: (cardId: string, rating: RatingType) => Promise<void>;
  onComplete: () => void;
}

export function DrillMode({ conceptIds, cards, onRateCard, onComplete }: DrillModeProps) {
  const [drillCards, setDrillCards] = useState<CardWithState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    // Filter cards that match the concept IDs
    const filtered = cards.filter(card => {
      // Match by card ID prefix or topic
      return conceptIds.some(
        id => card.id.includes(id) || card.topic.toLowerCase().includes(id)
      );
    });

    // Shuffle for variety
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setDrillCards(shuffled);
  }, [conceptIds, cards]);

  const currentCard = drillCards[currentIndex];
  const total = drillCards.length;

  async function handleRate(rating: RatingType) {
    if (!currentCard) return;

    await onRateCard(currentCard.id, rating);

    const isCorrect = rating === "good" || rating === "easy";
    setCompleted(prev => prev + 1);
    if (isCorrect) {
      setCorrect(prev => prev + 1);
    }

    // Move to next card
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // Drill complete
      onComplete();
    }
  }

  if (drillCards.length === 0) {
    return (
      <div className="cclk-drill-mode">
        <div className="cclk-drill-empty">
          <h3>No cards to drill</h3>
          <p>No cards found matching the weak concepts.</p>
          <button className="cclk-button" onClick={onComplete}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cclk-drill-mode">
      <div className="cclk-drill-header">
        <h3>Drill Mode</h3>
        <span className="cclk-drill-progress">
          {completed}/{total} · {correct} correct
        </span>
      </div>

      <div className="cclk-drill-concepts">
        Focusing on: {conceptIds.slice(0, 3).join(", ")}
        {conceptIds.length > 3 && ` +${conceptIds.length - 3} more`}
      </div>

      {currentCard && (
        <>
          <FlashcardDisplay
            card={currentCard}
            showAnswer={showAnswer}
            onShowAnswer={() => setShowAnswer(true)}
          />
          {showAnswer && <RatingButtons onRate={handleRate} />}
        </>
      )}

      <button className="cclk-drill-exit" onClick={onComplete}>
        Exit Drill
      </button>
    </div>
  );
}
