/**
 * Confusion Tracker
 *
 * Records and analyzes confusion events between concept pairs.
 * Used by analytics dashboard to show weakness patterns.
 */

/**
 * Single confusion entry between two concepts
 */
export interface ConfusionEntry {
  conceptA: string;
  conceptB: string;
  count: number;
  lastOccurred: string;
  contexts: ("mcq" | "recall")[];
}

/**
 * Serialized confusion data for persistence
 */
export interface ConfusionData {
  version: number;
  entries: ConfusionEntry[];
}

const CONFUSION_VERSION = 1;

/**
 * Confusion Tracker
 *
 * Tracks which concept pairs the user confuses during study sessions.
 */
export class ConfusionTracker {
  private entries: Map<string, ConfusionEntry> = new Map();
  private onDataChange?: () => void;

  constructor(
    initialData?: ConfusionData,
    onChange?: () => void
  ) {
    this.onDataChange = onChange;
    if (initialData?.entries) {
      for (const entry of initialData.entries) {
        const key = this.makeKey(entry.conceptA, entry.conceptB);
        this.entries.set(key, entry);
      }
    }
  }

  /**
   * Create canonical key for concept pair (sorted alphabetically)
   */
  private makeKey(conceptA: string, conceptB: string): string {
    return [conceptA, conceptB].sort().join(":");
  }

  /**
   * Record a confusion event between two concepts
   */
  recordConfusion(
    conceptA: string,
    conceptB: string,
    context: "mcq" | "recall"
  ): void {
    const key = this.makeKey(conceptA, conceptB);
    const existing = this.entries.get(key);

    if (existing) {
      existing.count++;
      existing.lastOccurred = new Date().toISOString();
      if (!existing.contexts.includes(context)) {
        existing.contexts.push(context);
      }
      this.entries.set(key, existing);
    } else {
      this.entries.set(key, {
        conceptA,
        conceptB,
        count: 1,
        lastOccurred: new Date().toISOString(),
        contexts: [context]
      });
    }

    this.notifyChange();
  }

  /**
   * Get all confusion entries sorted by count (descending)
   */
  getAllConfusions(): ConfusionEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get top N confused pairs
   */
  getTopConfusions(limit = 10): ConfusionEntry[] {
    return this.getAllConfusions().slice(0, limit);
  }

  /**
   * Get confusions for a specific concept
   */
  getConfusionsFor(conceptId: string): ConfusionEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.conceptA === conceptId || e.conceptB === conceptId)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get concepts that are most confused (aggregated)
   */
  getMostConfusedConcepts(limit = 10): Array<{ conceptId: string; totalCount: number }> {
    const counts = new Map<string, number>();

    for (const entry of this.entries.values()) {
      counts.set(entry.conceptA, (counts.get(entry.conceptA) || 0) + entry.count);
      counts.set(entry.conceptB, (counts.get(entry.conceptB) || 0) + entry.count);
    }

    return Array.from(counts.entries())
      .map(([conceptId, totalCount]) => ({ conceptId, totalCount }))
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, limit);
  }

  /**
   * Get total confusion count
   */
  getTotalConfusionCount(): number {
    return Array.from(this.entries.values())
      .reduce((sum, e) => sum + e.count, 0);
  }

  /**
   * Get recent confusions (within N days)
   */
  getRecentConfusions(days = 7): ConfusionEntry[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString();

    return Array.from(this.entries.values())
      .filter(e => e.lastOccurred >= cutoffStr)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Clear all confusion data
   */
  clear(): void {
    this.entries.clear();
    this.notifyChange();
  }

  /**
   * Serialize for persistence
   */
  serialize(): ConfusionData {
    return {
      version: CONFUSION_VERSION,
      entries: Array.from(this.entries.values())
    };
  }

  /**
   * Notify listener of data changes
   */
  private notifyChange(): void {
    if (this.onDataChange) {
      this.onDataChange();
    }
  }
}

// Singleton instance
let instance: ConfusionTracker | null = null;

/**
 * Get the singleton ConfusionTracker instance
 */
export function getConfusionTracker(): ConfusionTracker {
  if (!instance) {
    instance = new ConfusionTracker();
  }
  return instance;
}

/**
 * Initialize confusion tracker with saved data
 */
export function initConfusionTracker(
  savedData?: ConfusionData,
  onChange?: () => void
): ConfusionTracker {
  instance = new ConfusionTracker(savedData, onChange);
  return instance;
}
