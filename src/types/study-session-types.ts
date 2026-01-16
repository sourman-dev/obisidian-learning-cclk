/**
 * Study Session Types
 */

import { CardWithState } from "./card-types";
import { SessionStats } from "../core/card-scheduler";

/** Study mode */
export type StudyMode = "single" | "mixed";

/** Session phase */
export type SessionPhase = "setup" | "studying" | "complete";

/** Card display state */
export type CardPhase = "question" | "answer";

/** Study session state */
export interface StudySession {
  phase: SessionPhase;
  mode: StudyMode;
  selectedTopics: string[];
  cards: CardWithState[];
  currentIndex: number;
  cardPhase: CardPhase;
  stats: SessionStats;
}

/** Initial session state */
export const INITIAL_SESSION: StudySession = {
  phase: "setup",
  mode: "single",
  selectedTopics: [],
  cards: [],
  currentIndex: 0,
  cardPhase: "question",
  stats: {
    totalCards: 0,
    completed: 0,
    correct: 0,
    incorrect: 0,
    accuracy: 0
  }
};
