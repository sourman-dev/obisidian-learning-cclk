/**
 * LECTOR Algorithm Types
 *
 * Types for semantic-aware spaced repetition using the LECTOR algorithm.
 * Based on paper 2508.03275.pdf
 */

import { SM2CardState } from "./sm2-types";

/**
 * Huyệt position description for memorization
 */
export interface HuyetPosition {
  /** Body landmark (e.g., "ngón tay cái", "khuỷu tay") */
  landmark: string;
  /** Relative position description in Vietnamese */
  relative: string;
  /** Needle depth if applicable */
  depth?: string;
  /** Nearby huyệt names for context */
  nearby?: string[];
}

/**
 * Huyệt concept extracted from cards
 */
export interface HuyetConcept {
  id: string;
  name: string;
  kinh: string;
  nguHanh: string;
  nguDuHuyet: string;
  sourceFile: string;
  /** Position description for locating on real body */
  position?: HuyetPosition;
}

/**
 * Confusion pair analysis result
 */
export interface ConfusionPair {
  score: number;
  reasons: ConfusionReason[];
}

/**
 * Reasons for confusion between concept pairs
 */
export type ConfusionReason =
  | "similar_name"
  | "same_prefix"
  | "same_suffix"
  | "same_kinh"
  | "same_nguhanh"
  | "same_ngudu"
  | "bieu_ly_pair"
  | "similar_function"
  | "similar_position";

/**
 * Pre-computed semantic matrix structure
 */
export interface SemanticMatrix {
  version: number;
  generated: string;
  concepts: HuyetConcept[];
  matrix: Record<string, ConfusionPair>;
}

/**
 * Learner profile for personalized scheduling
 */
export interface LearnerProfile {
  /** Rolling success rate (0-1) */
  successRate: number;
  /** Learning speed multiplier (default 1.0) */
  learningSpeed: number;
  /** Retention capability (0-1) */
  retention: number;
  /** Sensitivity to semantic interference (0-1) */
  semanticSensitivity: number;
  /** History of confusion events */
  confusionHistory: ConfusionRecord[];
}

/**
 * Single confusion event record
 */
export interface ConfusionRecord {
  conceptA: string;
  conceptB: string;
  confusedAt: string;
  context: "mcq" | "recall" | "matching";
}

/**
 * LECTOR-enhanced card state (extends SM2)
 */
export interface LECTORCardState extends SM2CardState {
  /** Current semantic interference level (0-1) */
  semanticInterference: number;
  /** IDs of concepts confused with this one */
  confusedWith: string[];
  /** Mastery level (0-5) */
  masteryLevel: number;
}

/**
 * Default learner profile
 */
export const DEFAULT_LEARNER_PROFILE: LearnerProfile = {
  successRate: 0.7,
  learningSpeed: 1.0,
  retention: 0.8,
  semanticSensitivity: 0.5,
  confusionHistory: []
};

/**
 * Default LECTOR card state
 */
export const DEFAULT_LECTOR_STATE: Omit<LECTORCardState, keyof SM2CardState> = {
  semanticInterference: 0,
  confusedWith: [],
  masteryLevel: 0
};
