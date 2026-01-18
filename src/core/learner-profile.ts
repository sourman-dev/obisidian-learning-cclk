/**
 * Learner Profile Manager
 *
 * Tracks user's learning patterns, confusion history, and personal adjustments
 * for LECTOR algorithm personalization.
 */

import {
  LearnerProfile,
  ConfusionRecord,
  DEFAULT_LEARNER_PROFILE
} from "../types/lector-types";

/** Rolling average weight for success rate calculation */
const SUCCESS_RATE_ALPHA = 0.1;

/** Maximum confusion records to keep */
const MAX_CONFUSION_HISTORY = 100;

/** Sensitivity increase per confusion event */
const SENSITIVITY_INCREASE = 0.03;

/** Sensitivity decay per correct answer */
const SENSITIVITY_DECAY = 0.01;

/**
 * Learner Profile Manager
 *
 * Manages personalized learning metrics that adjust LECTOR scheduling.
 */
export class LearnerProfileManager {
  private profile: LearnerProfile;
  private onProfileChange?: (profile: LearnerProfile) => void;

  constructor(
    initialProfile?: Partial<LearnerProfile>,
    onChange?: (profile: LearnerProfile) => void
  ) {
    this.profile = {
      ...DEFAULT_LEARNER_PROFILE,
      ...initialProfile
    };
    this.onProfileChange = onChange;
  }

  /**
   * Get current profile snapshot
   */
  getProfile(): LearnerProfile {
    return { ...this.profile };
  }

  /**
   * Get semantic sensitivity value
   */
  getSemanticSensitivity(): number {
    return this.profile.semanticSensitivity;
  }

  /**
   * Get learning speed multiplier
   */
  getLearningSpeed(): number {
    return this.profile.learningSpeed;
  }

  /**
   * Get current success rate
   */
  getSuccessRate(): number {
    return this.profile.successRate;
  }

  /**
   * Record an answer and update profile
   *
   * @param conceptId - ID of the concept being tested
   * @param correct - Whether the answer was correct
   * @param selectedAnswerId - For MCQ, the ID of the selected (wrong) answer
   * @param context - Type of question
   */
  recordAnswer(
    conceptId: string,
    correct: boolean,
    selectedAnswerId?: string,
    context: "mcq" | "recall" | "matching" = "recall"
  ): void {
    // Update success rate with exponential moving average
    const successValue = correct ? 1 : 0;
    this.profile.successRate =
      (1 - SUCCESS_RATE_ALPHA) * this.profile.successRate +
      SUCCESS_RATE_ALPHA * successValue;

    // Adjust semantic sensitivity
    if (correct) {
      // Decay sensitivity on correct answers
      this.profile.semanticSensitivity = Math.max(
        0.1, // Minimum sensitivity
        this.profile.semanticSensitivity - SENSITIVITY_DECAY
      );
    } else {
      // Increase sensitivity on wrong answers
      this.profile.semanticSensitivity = Math.min(
        1.0, // Maximum sensitivity
        this.profile.semanticSensitivity + SENSITIVITY_INCREASE
      );
    }

    // Record confusion for wrong MCQ answers
    if (!correct && selectedAnswerId && context === "mcq") {
      this.recordConfusion(conceptId, selectedAnswerId, context);
    }

    // Adjust learning speed based on recent performance
    this.adjustLearningSpeed();

    this.notifyChange();
  }

  /**
   * Record a confusion event between two concepts
   */
  recordConfusion(
    conceptA: string,
    conceptB: string,
    context: "mcq" | "recall" | "matching" = "mcq"
  ): void {
    const record: ConfusionRecord = {
      conceptA,
      conceptB,
      confusedAt: new Date().toISOString(),
      context
    };

    this.profile.confusionHistory.push(record);

    // Trim old history
    if (this.profile.confusionHistory.length > MAX_CONFUSION_HISTORY) {
      this.profile.confusionHistory = this.profile.confusionHistory.slice(
        -MAX_CONFUSION_HISTORY
      );
    }

    this.notifyChange();
  }

  /**
   * Get confusion count between two concepts
   */
  getConfusionCount(conceptA: string, conceptB: string): number {
    return this.profile.confusionHistory.filter(
      (r) =>
        (r.conceptA === conceptA && r.conceptB === conceptB) ||
        (r.conceptA === conceptB && r.conceptB === conceptA)
    ).length;
  }

  /**
   * Get most confused concept pairs
   */
  getMostConfusedPairs(limit = 5): Array<{ pair: [string, string]; count: number }> {
    const counts = new Map<string, number>();

    for (const record of this.profile.confusionHistory) {
      const key = [record.conceptA, record.conceptB].sort().join(":");
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([key, count]) => ({
        pair: key.split(":") as [string, string],
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get recent confusion history
   */
  getRecentConfusions(days = 7): ConfusionRecord[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString();

    return this.profile.confusionHistory.filter(
      (r) => r.confusedAt >= cutoffStr
    );
  }

  /**
   * Reset profile to defaults
   */
  reset(): void {
    this.profile = { ...DEFAULT_LEARNER_PROFILE };
    this.notifyChange();
  }

  /**
   * Serialize profile for storage
   */
  serialize(): string {
    return JSON.stringify(this.profile);
  }

  /**
   * Load profile from serialized data
   */
  static deserialize(data: string): LearnerProfileManager {
    try {
      const profile = JSON.parse(data) as LearnerProfile;
      return new LearnerProfileManager(profile);
    } catch {
      return new LearnerProfileManager();
    }
  }

  /**
   * Adjust learning speed based on recent performance
   */
  private adjustLearningSpeed(): void {
    // If success rate is high, increase learning speed slightly
    if (this.profile.successRate > 0.85) {
      this.profile.learningSpeed = Math.min(
        1.5,
        this.profile.learningSpeed + 0.02
      );
    }
    // If success rate is low, decrease learning speed
    else if (this.profile.successRate < 0.6) {
      this.profile.learningSpeed = Math.max(
        0.7,
        this.profile.learningSpeed - 0.02
      );
    }
    // Otherwise, slowly normalize toward 1.0
    else {
      this.profile.learningSpeed =
        this.profile.learningSpeed * 0.99 + 1.0 * 0.01;
    }
  }

  /**
   * Notify listener of profile changes
   */
  private notifyChange(): void {
    if (this.onProfileChange) {
      this.onProfileChange(this.getProfile());
    }
  }
}

// Singleton instance
let instance: LearnerProfileManager | null = null;

/**
 * Get the singleton LearnerProfileManager instance
 */
export function getLearnerProfile(): LearnerProfileManager {
  if (!instance) {
    instance = new LearnerProfileManager();
  }
  return instance;
}

/**
 * Initialize learner profile with saved data
 */
export function initLearnerProfile(
  savedProfile?: Partial<LearnerProfile>,
  onChange?: (profile: LearnerProfile) => void
): LearnerProfileManager {
  instance = new LearnerProfileManager(savedProfile, onChange);
  return instance;
}
