/**
 * Card Types and Interfaces
 */

import { SM2CardState } from "./sm2-types";

/** Card display type */
export type CardType = "forward" | "reverse" | "matching";

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
