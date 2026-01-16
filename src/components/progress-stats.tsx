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
