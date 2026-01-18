/**
 * Confusion Chart Component
 *
 * Displays bar chart of most confused concept pairs.
 */

import { ConfusionEntry } from "../core/confusion-tracker";

interface ConfusionChartProps {
  entries: Array<ConfusionEntry & { nameA: string; nameB: string }>;
  maxItems?: number;
}

export function ConfusionChart({ entries, maxItems = 10 }: ConfusionChartProps) {
  const displayEntries = entries.slice(0, maxItems);
  const maxCount = Math.max(...displayEntries.map(e => e.count), 1);

  return (
    <div className="cclk-confusion-chart">
      {displayEntries.map((entry, index) => {
        const percentage = (entry.count / maxCount) * 100;
        const isHigh = percentage >= 70;
        const isMedium = percentage >= 40 && percentage < 70;

        return (
          <div
            key={`${entry.conceptA}-${entry.conceptB}`}
            className="cclk-chart-row"
          >
            <span className="cclk-chart-rank">{index + 1}</span>
            <div className="cclk-chart-content">
              <span className="cclk-chart-label">
                {entry.nameA} ↔ {entry.nameB}
              </span>
              <div className="cclk-bar-container">
                <div
                  className={`cclk-bar ${isHigh ? "high" : isMedium ? "medium" : "low"}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            <span className="cclk-chart-count">{entry.count}</span>
          </div>
        );
      })}
    </div>
  );
}
