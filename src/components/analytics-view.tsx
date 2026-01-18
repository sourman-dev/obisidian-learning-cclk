/**
 * Analytics View Component
 *
 * Main dashboard for viewing confusion patterns and weakness analytics.
 */

import { useState, useEffect } from "react";
import { AnalyticsEngine, AnalyticsSummary, KinhWeakness } from "../core/analytics-engine";
import { ConfusionEntry } from "../core/confusion-tracker";
import { ConfusionChart } from "./confusion-chart";
import { WeaknessHeatmap } from "./weakness-heatmap";

interface AnalyticsViewProps {
  analytics: AnalyticsEngine;
  onStartDrill: (conceptIds: string[]) => void;
  onClose: () => void;
}

export function AnalyticsView({ analytics, onStartDrill, onClose }: AnalyticsViewProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [confusions, setConfusions] = useState<Array<ConfusionEntry & { nameA: string; nameB: string }>>([]);
  const [weakness, setWeakness] = useState<KinhWeakness[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [summaryData, weaknessData] = await Promise.all([
        analytics.getSummary(),
        analytics.getKinhWeakness()
      ]);
      setSummary(summaryData);
      setConfusions(analytics.getConfusionsWithNames());
      setWeakness(weaknessData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
    setLoading(false);
  }

  function handleDrill() {
    const conceptIds = analytics.getRecommendedDrill();
    if (conceptIds.length > 0) {
      onStartDrill(conceptIds);
    }
  }

  if (loading) {
    return <div className="cclk-loading">Loading analytics...</div>;
  }

  return (
    <div className="cclk-analytics">
      <div className="cclk-analytics-header">
        <h2>Analytics</h2>
        <button className="cclk-close-button" onClick={onClose}>
          Back
        </button>
      </div>

      {summary && (
        <div className="cclk-analytics-summary">
          <div className="summary-stat">
            <span className="stat-value">{summary.totalReviews}</span>
            <span className="stat-label">Total Reviews</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">{Math.round(summary.averageAccuracy * 100)}%</span>
            <span className="stat-label">Avg Accuracy</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">{summary.studyStreak}</span>
            <span className="stat-label">Day Streak</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">{summary.totalConfusions}</span>
            <span className="stat-label">Confusions</span>
          </div>
        </div>
      )}

      <section className="cclk-analytics-section">
        <h3>Confusion Patterns</h3>
        {confusions.length > 0 ? (
          <ConfusionChart entries={confusions} />
        ) : (
          <p className="cclk-empty-state">
            No confusion data yet. Start studying to see patterns!
          </p>
        )}
      </section>

      <section className="cclk-analytics-section">
        <h3>Weakness by Kinh</h3>
        {weakness.length > 0 ? (
          <WeaknessHeatmap data={weakness} />
        ) : (
          <p className="cclk-empty-state">
            No review data yet. Complete some sessions to see weakness analysis.
          </p>
        )}
      </section>

      {confusions.length > 0 && (
        <button className="cclk-drill-button" onClick={handleDrill}>
          Drill Weak Points
        </button>
      )}
    </div>
  );
}
