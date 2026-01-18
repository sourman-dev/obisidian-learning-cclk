/**
 * Card Types and Interfaces
 */

import { SM2CardState } from "./sm2-types";
import { ConfusionReason } from "./lector-types";

/** Card display type */
export type CardType = "forward" | "reverse" | "matching" | "mcq" | "visual";

/** MCQ option for multiple choice cards */
export interface MCQOption {
  text: string;
  isCorrect: boolean;
}

/** Confusable pair reference in frontmatter */
export interface ConfusablePairRef {
  id: string;
  score: number;
  reason: ConfusionReason;
}

/** Base card structure */
export interface Card {
  /** Unique ID: topic::card-number */
  id: string;
  /** Topic name from frontmatter */
  topic: string;
  /** Chapter number */
  chapter: number;
  /** Card type */
  type: CardType;
  /** Question text */
  question: string;
  /** Answer text (for forward/reverse) */
  answer?: string;
  /** Matching pairs (for matching type) */
  pairs?: MatchingPair[];
  /** MCQ options (for mcq type) */
  options?: MCQOption[];
  /** Correct answer explanation (for mcq type) */
  explanation?: string;
  /** Hint to help remember (for Q&A cards) */
  hint?: string;
  /** Context/why this matters */
  context?: string;
  /** Image path (for visual type) */
  imagePath?: string;
  /** Source file path */
  sourceFile: string;
  /** Tags from frontmatter */
  tags: string[];
}

/** Matching pair for matching cards */
export interface MatchingPair {
  term: string;
  definition: string;
}

/** Card with SM-2 state attached */
export interface CardWithState extends Card {
  state: SM2CardState;
}

/** Topic summary */
export interface TopicInfo {
  name: string;
  chapter: number;
  cardCount: number;
  dueCount: number;
  sourceFile: string;
}

/** Frontmatter structure */
export interface CardFrontmatter {
  topic: string;
  chapter?: number;
  tags?: string[];
}

/** Enhanced frontmatter with LECTOR metadata */
export interface EnhancedFrontmatter extends CardFrontmatter {
  /** Unique concept ID */
  id?: string;
  /** Concept name in Vietnamese */
  concept?: string;
  /** Category (e.g., huyet-kinh-tam) */
  category?: string;
  /** Kinh (meridian) name */
  kinh?: string;
  /** Ngũ Hành (element) */
  nguHanh?: string;
  /** Ngũ Du Huyệt type */
  nguDuHuyet?: string;
  /** Top confusable concepts */
  confusableWith?: ConfusablePairRef[];
  /** Image path for visual cards */
  image?: string;
}
