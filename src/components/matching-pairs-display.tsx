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
    if (state.matched.size === pairs.length && pairs.length > 0) {
      const hadErrors = state.incorrect.size > 0;
      onComplete(!hadErrors);
    }
  }, [state.matched, state.incorrect, pairs.length, onComplete]);

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
