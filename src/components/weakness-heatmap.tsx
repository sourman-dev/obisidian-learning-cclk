/**
 * Weakness Heatmap Component
 *
 * Displays weakness analysis by kinh (meridian) with visual indicators.
 */

import { KinhWeakness } from "../core/analytics-engine";

interface WeaknessHeatmapProps {
  data: KinhWeakness[];
}

/**
 * Get strength label based on accuracy
 */
function getStrengthLabel(accuracy: number): { label: string; className: string } {
  if (accuracy >= 0.8) {
    return { label: "Strong", className: "strong" };
  } else if (accuracy >= 0.6) {
    return { label: "Good", className: "good" };
  } else if (accuracy >= 0.4) {
    return { label: "Moderate", className: "moderate" };
  } else {
    return { label: "Weak", className: "weak" };
  }
}

export function WeaknessHeatmap({ data }: WeaknessHeatmapProps) {
  return (
    <div className="cclk-weakness-heatmap">
      {data.map((item, index) => {
        const { label, className } = getStrengthLabel(item.accuracy);
        const percentage = Math.round(item.accuracy * 100);

        return (
          <div key={item.kinh} className={`cclk-heatmap-row ${className}`}>
            <div className="cclk-heatmap-info">
              <span className="cclk-heatmap-kinh">{item.kinh}</span>
              <span className="cclk-heatmap-stats">
                {item.totalCards} cards · {item.dueCards} due
                {item.confusionCount > 0 && ` · ${item.confusionCount} confusions`}
              </span>
            </div>
            <div className="cclk-heatmap-bar-container">
              <div
                className={`cclk-heatmap-bar ${className}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className={`cclk-heatmap-label ${className}`}>
              {label}
              {index === 0 && item.accuracy < 0.5 && " ⚠️"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
