/**
 * Flashcard Display Component
 */

import { useState } from "react";
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
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="cclk-flashcard">
      {/* Topic badge */}
      <div className="cclk-card-topic">{card.topic}</div>

      {/* Card type indicator */}
      <div className="cclk-card-type">
        {card.type === "reverse" && "Reverse "}
        {card.type === "forward" && "Forward "}
      </div>

      {/* Question */}
      <div className="cclk-card-question">
        <div className="cclk-card-label">Question</div>
        <div className="cclk-card-content">{card.question}</div>
      </div>

      {/* Hint toggle (only before showing answer) */}
      {!showAnswer && card.hint && (
        <div className="cclk-card-hint">
          {showHint ? (
            <div className="cclk-hint-content">
              <span className="cclk-hint-icon">💡</span> {card.hint}
            </div>
          ) : (
            <button
              className="cclk-hint-button"
              onClick={() => setShowHint(true)}
            >
              Show Hint
            </button>
          )}
        </div>
      )}

      {/* Answer or show button */}
      {showAnswer ? (
        <>
          <div className="cclk-card-answer">
            <div className="cclk-card-label">Answer</div>
            <div className="cclk-card-content">{card.answer}</div>
          </div>

          {/* Context/Why after answer */}
          {card.context && (
            <div className="cclk-card-context">
              <span className="cclk-context-icon">📚</span> {card.context}
            </div>
          )}

          {/* Hint shown in answer view too */}
          {card.hint && (
            <div className="cclk-card-hint-answered">
              <span className="cclk-hint-icon">💡</span> {card.hint}
            </div>
          )}
        </>
      ) : (
        <button className="cclk-show-answer" onClick={onShowAnswer}>
          Show Answer
        </button>
      )}
    </div>
  );
}
