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
