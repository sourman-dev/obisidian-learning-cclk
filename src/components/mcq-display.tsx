/**
 * MCQ Display Component
 *
 * Displays multiple choice questions with interactive options.
 * Tracks selection and shows feedback on answer.
 */

import { useState } from "react";
import { CardWithState } from "../types/card-types";
import { MCQOption } from "../types/card-types";

interface MCQDisplayProps {
  card: CardWithState;
  onAnswer: (correct: boolean, selectedOptionIndex: number) => void;
}

export function MCQDisplay({ card, onAnswer }: MCQDisplayProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<Array<MCQOption & { originalIndex: number }>>(() => {
    // Shuffle options on mount
    const indexed = (card.options || []).map((opt, i) => ({ ...opt, originalIndex: i }));
    return shuffleArray(indexed);
  });

  const correctIndex = shuffledOptions.findIndex(opt => opt.isCorrect);

  function handleSelect(index: number) {
    if (answered) return;
    setSelectedIndex(index);
  }

  function handleSubmit() {
    if (selectedIndex === null || answered) return;

    const isCorrect = shuffledOptions[selectedIndex].isCorrect;
    setAnswered(true);
    onAnswer(isCorrect, shuffledOptions[selectedIndex].originalIndex);
  }

  function getOptionClass(index: number): string {
    const base = "cclk-mcq-option";

    if (!answered) {
      return selectedIndex === index ? `${base} selected` : base;
    }

    // After answering
    if (shuffledOptions[index].isCorrect) {
      return `${base} correct`;
    }
    if (selectedIndex === index) {
      return `${base} incorrect`;
    }
    return `${base} dimmed`;
  }

  return (
    <div className="cclk-mcq">
      {/* Topic badge */}
      <div className="cclk-card-topic">{card.topic}</div>

      {/* Question */}
      <div className="cclk-mcq-question">
        <div className="cclk-card-label">Multiple Choice</div>
        <div className="cclk-mcq-question-text">{card.question}</div>
      </div>

      {/* Options */}
      <div className="cclk-mcq-options">
        {shuffledOptions.map((option, index) => (
          <button
            key={index}
            className={getOptionClass(index)}
            onClick={() => handleSelect(index)}
            disabled={answered}
          >
            <span className="cclk-mcq-letter">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="cclk-mcq-text">{option.text}</span>
            {answered && option.isCorrect && (
              <span className="cclk-mcq-check">✓</span>
            )}
            {answered && selectedIndex === index && !option.isCorrect && (
              <span className="cclk-mcq-wrong">✗</span>
            )}
          </button>
        ))}
      </div>

      {/* Submit or Explanation */}
      {!answered ? (
        <button
          className="cclk-mcq-submit"
          onClick={handleSubmit}
          disabled={selectedIndex === null}
        >
          Check Answer
        </button>
      ) : (
        <div className="cclk-mcq-feedback">
          {shuffledOptions[selectedIndex!].isCorrect ? (
            <div className="cclk-mcq-correct-msg">Correct!</div>
          ) : (
            <div className="cclk-mcq-incorrect-msg">
              Incorrect. The answer is {String.fromCharCode(65 + correctIndex)}.
            </div>
          )}
          {card.explanation && (
            <div className="cclk-mcq-explanation">
              <strong>Explanation:</strong> {card.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
