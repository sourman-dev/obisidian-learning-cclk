/**
 * Semantic Matrix Loader
 *
 * Loads and queries the pre-computed semantic confusion matrix.
 * Used by LECTOR algorithm for semantic-aware scheduling.
 */

import {
  SemanticMatrix,
  HuyetConcept,
  ConfusionPair
} from "../types/lector-types";

// Import the pre-computed matrix
// This will be bundled with the plugin
import matrixData from "../data/semantic-matrix.json";

/**
 * Semantic Matrix Manager
 *
 * Provides efficient access to confusion scores between huyệt pairs.
 */
export class SemanticMatrixManager {
  private matrix: SemanticMatrix;
  private conceptMap: Map<string, HuyetConcept>;

  constructor() {
    this.matrix = matrixData as SemanticMatrix;
    this.conceptMap = new Map();

    // Build concept lookup map
    for (const concept of this.matrix.concepts) {
      this.conceptMap.set(concept.id, concept);
    }
  }

  /**
   * Get matrix version
   */
  getVersion(): number {
    return this.matrix.version;
  }

  /**
   * Get generation timestamp
   */
  getGeneratedAt(): string {
    return this.matrix.generated;
  }

  /**
   * Get total concept count
   */
  getConceptCount(): number {
    return this.matrix.concepts.length;
  }

  /**
   * Get all concepts
   */
  getAllConcepts(): HuyetConcept[] {
    return [...this.matrix.concepts];
  }

  /**
   * Get concept by ID
   */
  getConcept(id: string): HuyetConcept | undefined {
    return this.conceptMap.get(id);
  }

  /**
   * Get confusion score between two concepts
   *
   * @returns ConfusionPair or null if no confusion data
   */
  getConfusion(idA: string, idB: string): ConfusionPair | null {
    // Matrix keys are sorted alphabetically
    const key = [idA, idB].sort().join(":");
    return this.matrix.matrix[key] || null;
  }

  /**
   * Get confusion score value only
   */
  getConfusionScore(idA: string, idB: string): number {
    const pair = this.getConfusion(idA, idB);
    return pair?.score ?? 0;
  }

  /**
   * Get all confusable pairs for a concept
   *
   * @param conceptId - Concept to find confusable pairs for
   * @param threshold - Minimum confusion score (default 0.3)
   * @returns Array of [otherId, ConfusionPair] sorted by score descending
   */
  getConfusablePairs(
    conceptId: string,
    threshold = 0.3
  ): Array<[string, ConfusionPair]> {
    const results: Array<[string, ConfusionPair]> = [];

    for (const [key, pair] of Object.entries(this.matrix.matrix)) {
      if (pair.score < threshold) continue;

      const [idA, idB] = key.split(":");
      if (idA === conceptId) {
        results.push([idB, pair]);
      } else if (idB === conceptId) {
        results.push([idA, pair]);
      }
    }

    return results.sort((a, b) => b[1].score - a[1].score);
  }

  /**
   * Get top N confusable concepts for a given concept
   */
  getTopConfusable(conceptId: string, n = 3): string[] {
    return this.getConfusablePairs(conceptId)
      .slice(0, n)
      .map(([id]) => id);
  }

  /**
   * Get maximum semantic interference for a concept
   * Used for LECTOR interval adjustment
   */
  getMaxInterference(conceptId: string): number {
    const pairs = this.getConfusablePairs(conceptId, 0);
    if (pairs.length === 0) return 0;
    return pairs[0][1].score;
  }

  /**
   * Get concepts in same kinh
   */
  getConceptsByKinh(kinh: string): HuyetConcept[] {
    return this.matrix.concepts.filter((c) => c.kinh === kinh);
  }

  /**
   * Get concepts with same ngũ hành
   */
  getConceptsByNguHanh(nguHanh: string): HuyetConcept[] {
    return this.matrix.concepts.filter((c) => c.nguHanh === nguHanh);
  }

  /**
   * Get statistics about the matrix
   */
  getStatistics(): {
    totalConcepts: number;
    totalPairs: number;
    highConfusionPairs: number;
    averageScore: number;
  } {
    const pairs = Object.values(this.matrix.matrix);
    const scores = pairs.map((p) => p.score);

    return {
      totalConcepts: this.matrix.concepts.length,
      totalPairs: pairs.length,
      highConfusionPairs: scores.filter((s) => s >= 0.5).length,
      averageScore:
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0
    };
  }
}

// Singleton instance for easy access
let instance: SemanticMatrixManager | null = null;

/**
 * Get the singleton SemanticMatrixManager instance
 */
export function getSemanticMatrix(): SemanticMatrixManager {
  if (!instance) {
    instance = new SemanticMatrixManager();
  }
  return instance;
}
