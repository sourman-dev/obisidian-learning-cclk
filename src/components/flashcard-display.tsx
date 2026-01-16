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
        {card.type === "reverse" && "Reverse "}
        {card.type === "forward" && "Forward "}
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
