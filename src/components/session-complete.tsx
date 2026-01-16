/**
 * Session Complete Component
 */

import { SessionStats } from "../core/card-scheduler";

interface SessionCompleteProps {
  stats: SessionStats;
  onContinue: () => void;
}

export function SessionComplete({ stats, onContinue }: SessionCompleteProps) {
  const emoji = stats.accuracy >= 0.8 ? "Great!" : stats.accuracy >= 0.5 ? "Good job!" : "Keep practicing!";

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
