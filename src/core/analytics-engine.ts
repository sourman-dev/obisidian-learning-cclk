/**
 * Analytics Engine
 *
 * Aggregates data from confusion tracker, progress manager, and semantic matrix
 * to provide insights for the analytics dashboard.
 */

import { ProgressManager, ProgressData, SessionRecord } from "./progress-manager";
import { ConfusionTracker, ConfusionEntry } from "./confusion-tracker";
import { SemanticMatrixManager } from "./semantic-matrix";

/**
 * Weakness analysis per kinh (meridian)
 */
export interface KinhWeakness {
  kinh: string;
  accuracy: number;
  totalCards: number;
  dueCards: number;
  confusionCount: number;
}

/**
 * Progress data point for charts
 */
export interface ProgressPoint {
  date: string;
  accuracy: number;
  cardsReviewed: number;
}

/**
 * Overall analytics summary
 */
export interface AnalyticsSummary {
  totalReviews: number;
  averageAccuracy: number;
  totalConfusions: number;
  studyStreak: number;
  weakestKinh: string | null;
  mostConfusedPair: [string, string] | null;
}

/**
 * Analytics Engine
 *
 * Provides aggregated analytics data for the dashboard.
 */
export class AnalyticsEngine {
  constructor(
    private progressManager: ProgressManager,
    private confusionTracker: ConfusionTracker,
    private semanticMatrix: SemanticMatrixManager
  ) {}

  /**
   * Get analytics summary
   */
  async getSummary(): Promise<AnalyticsSummary> {
    const data = await this.progressManager.load();
    const stats = await this.progressManager.getStatistics();
    const topConfusions = this.confusionTracker.getTopConfusions(1);
    const kinhWeakness = await this.getKinhWeakness();

    const totalReviews = data.sessions.reduce((sum, s) => sum + s.cardsReviewed, 0);
    const averageAccuracy = data.sessions.length > 0
      ? data.sessions.reduce((sum, s) => sum + s.accuracy, 0) / data.sessions.length
      : 0;

    return {
      totalReviews,
      averageAccuracy,
      totalConfusions: this.confusionTracker.getTotalConfusionCount(),
      studyStreak: stats.streak,
      weakestKinh: kinhWeakness.length > 0 ? kinhWeakness[0].kinh : null,
      mostConfusedPair: topConfusions.length > 0
        ? [topConfusions[0].conceptA, topConfusions[0].conceptB]
        : null
    };
  }

  /**
   * Get weakness analysis by kinh (meridian)
   */
  async getKinhWeakness(): Promise<KinhWeakness[]> {
    const data = await this.progressManager.load();
    const concepts = this.semanticMatrix.getAllConcepts();
    const confusions = this.confusionTracker.getAllConfusions();
    const today = new Date().toISOString().split("T")[0];

    // Group concepts by kinh
    const kinhMap = new Map<string, {
      totalCards: number;
      dueCards: number;
      totalAccuracy: number;
      reviewedCards: number;
      confusionCount: number;
    }>();

    // Initialize kinh stats
    for (const concept of concepts) {
      if (!kinhMap.has(concept.kinh)) {
        kinhMap.set(concept.kinh, {
          totalCards: 0,
          dueCards: 0,
          totalAccuracy: 0,
          reviewedCards: 0,
          confusionCount: 0
        });
      }
      const stats = kinhMap.get(concept.kinh)!;
      stats.totalCards++;

      // Check if card is due
      const cardState = data.cards[concept.id];
      if (cardState && cardState.nextReview <= today) {
        stats.dueCards++;
      }

      // Calculate accuracy based on ease factor (higher = better)
      if (cardState && cardState.easeFactor) {
        stats.totalAccuracy += (cardState.easeFactor - 1.3) / 1.2; // Normalize 1.3-2.5 to 0-1
        stats.reviewedCards++;
      }
    }

    // Add confusion counts
    for (const entry of confusions) {
      const conceptA = this.semanticMatrix.getConcept(entry.conceptA);
      const conceptB = this.semanticMatrix.getConcept(entry.conceptB);

      if (conceptA && kinhMap.has(conceptA.kinh)) {
        kinhMap.get(conceptA.kinh)!.confusionCount += entry.count;
      }
      if (conceptB && kinhMap.has(conceptB.kinh)) {
        kinhMap.get(conceptB.kinh)!.confusionCount += entry.count;
      }
    }

    // Convert to array and calculate final accuracy
    const results: KinhWeakness[] = [];
    for (const [kinh, stats] of kinhMap.entries()) {
      results.push({
        kinh,
        accuracy: stats.reviewedCards > 0
          ? Math.min(1, Math.max(0, stats.totalAccuracy / stats.reviewedCards))
          : 0.5, // Default to 50% for unreviewed
        totalCards: stats.totalCards,
        dueCards: stats.dueCards,
        confusionCount: stats.confusionCount
      });
    }

    // Sort by accuracy (lowest first = weakest)
    return results.sort((a, b) => a.accuracy - b.accuracy);
  }

  /**
   * Get progress history for chart
   */
  async getProgressHistory(days = 30): Promise<ProgressPoint[]> {
    const data = await this.progressManager.load();

    // Group sessions by date
    const dateMap = new Map<string, { accuracy: number[]; cardsReviewed: number }>();

    for (const session of data.sessions) {
      const date = session.date.split("T")[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, { accuracy: [], cardsReviewed: 0 });
      }
      const entry = dateMap.get(date)!;
      entry.accuracy.push(session.accuracy);
      entry.cardsReviewed += session.cardsReviewed;
    }

    // Generate last N days
    const points: ProgressPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const entry = dateMap.get(dateStr);
      if (entry) {
        points.push({
          date: dateStr,
          accuracy: entry.accuracy.reduce((a, b) => a + b, 0) / entry.accuracy.length,
          cardsReviewed: entry.cardsReviewed
        });
      } else {
        points.push({
          date: dateStr,
          accuracy: 0,
          cardsReviewed: 0
        });
      }
    }

    return points;
  }

  /**
   * Get recommended concepts for drill mode
   */
  getRecommendedDrill(): string[] {
    const confusions = this.confusionTracker.getTopConfusions(5);
    const concepts = new Set<string>();

    for (const entry of confusions) {
      concepts.add(entry.conceptA);
      concepts.add(entry.conceptB);
    }

    return Array.from(concepts);
  }

  /**
   * Get confusion entries with concept names
   */
  getConfusionsWithNames(): Array<ConfusionEntry & { nameA: string; nameB: string }> {
    const confusions = this.confusionTracker.getTopConfusions(20);

    return confusions.map(entry => {
      const conceptA = this.semanticMatrix.getConcept(entry.conceptA);
      const conceptB = this.semanticMatrix.getConcept(entry.conceptB);

      return {
        ...entry,
        nameA: conceptA?.name || entry.conceptA,
        nameB: conceptB?.name || entry.conceptB
      };
    });
  }
}
