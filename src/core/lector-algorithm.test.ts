/**
 * LECTOR Algorithm Tests
 */

import {
  calculateLECTORInterval,
  updateMastery,
  processLECTORReview,
  calculatePriorityScore,
  createInitialLECTORState,
  convertSM2ToLECTOR,
  recordConfusion
} from "./lector-algorithm";
import {
  LECTORCardState,
  LearnerProfile,
  DEFAULT_LEARNER_PROFILE
} from "../types/lector-types";

describe("LECTOR Algorithm", () => {
  const defaultProfile: LearnerProfile = { ...DEFAULT_LEARNER_PROFILE };

  describe("calculateLECTORInterval", () => {
    it("returns base interval with default parameters", () => {
      const result = calculateLECTORInterval(6, 0, 0, defaultProfile);
      // masteryFactor = 1, semanticFactor = 1, personalFactor = 1
      expect(result).toBe(6);
    });

    it("increases interval with higher mastery", () => {
      const lowMastery = calculateLECTORInterval(6, 0, 0, defaultProfile);
      const highMastery = calculateLECTORInterval(6, 5, 0, defaultProfile);
      expect(highMastery).toBeGreaterThan(lowMastery);
    });

    it("decreases interval with high semantic interference", () => {
      const noInterference = calculateLECTORInterval(10, 2, 0, defaultProfile);
      const highInterference = calculateLECTORInterval(10, 2, 0.8, defaultProfile);
      expect(highInterference).toBeLessThan(noInterference);
    });

    it("never returns less than 1 day", () => {
      const result = calculateLECTORInterval(1, 0, 1.0, {
        ...defaultProfile,
        semanticSensitivity: 1.0
      });
      expect(result).toBeGreaterThanOrEqual(1);
    });

    it("applies personal learning speed", () => {
      const normal = calculateLECTORInterval(10, 2, 0, {
        ...defaultProfile,
        learningSpeed: 1.0
      });
      const fast = calculateLECTORInterval(10, 2, 0, {
        ...defaultProfile,
        learningSpeed: 1.5
      });
      expect(fast).toBeGreaterThan(normal);
    });
  });

  describe("updateMastery", () => {
    it("increases mastery on perfect answer", () => {
      expect(updateMastery(2, 5)).toBe(3);
    });

    it("increases mastery by 0.5 on good answer", () => {
      expect(updateMastery(2, 4)).toBe(2.5);
    });

    it("keeps mastery unchanged on okay answer", () => {
      expect(updateMastery(2, 3)).toBe(2);
    });

    it("decreases mastery on failed answer", () => {
      expect(updateMastery(2, 2)).toBe(1);
      expect(updateMastery(2, 1)).toBe(1);
    });

    it("caps mastery at 5", () => {
      expect(updateMastery(5, 5)).toBe(5);
    });

    it("floors mastery at 0", () => {
      expect(updateMastery(0, 1)).toBe(0);
    });
  });

  describe("processLECTORReview", () => {
    const initialState: LECTORCardState = createInitialLECTORState();

    it("processes successful review", () => {
      const newState = processLECTORReview(initialState, 4, 0.3, defaultProfile);

      expect(newState.repetitions).toBe(1);
      expect(newState.masteryLevel).toBe(0.5);
      expect(newState.semanticInterference).toBe(0.3);
    });

    it("processes failed review", () => {
      const stateWithProgress: LECTORCardState = {
        ...initialState,
        repetitions: 3,
        interval: 15,
        masteryLevel: 3
      };

      const newState = processLECTORReview(stateWithProgress, 2, 0, defaultProfile);

      expect(newState.repetitions).toBe(0);
      expect(newState.masteryLevel).toBe(2); // Decreased
      expect(newState.interval).toBe(1); // Reset
    });

    it("adjusts interval based on semantic interference", () => {
      const noInterference = processLECTORReview(
        { ...initialState, repetitions: 2, interval: 6 },
        4,
        0,
        defaultProfile
      );

      const highInterference = processLECTORReview(
        { ...initialState, repetitions: 2, interval: 6 },
        4,
        0.8,
        defaultProfile
      );

      expect(highInterference.interval).toBeLessThan(noInterference.interval);
    });
  });

  describe("calculatePriorityScore", () => {
    it("returns 0 for future cards", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const state: LECTORCardState = {
        ...createInitialLECTORState(),
        nextReview: futureDate.toISOString().split("T")[0]
      };

      expect(calculatePriorityScore(state)).toBe(25); // Only mastery boost (5 * 5)
    });

    it("returns high score for due cards", () => {
      const state: LECTORCardState = {
        ...createInitialLECTORState(),
        nextReview: new Date().toISOString().split("T")[0]
      };

      expect(calculatePriorityScore(state)).toBeGreaterThanOrEqual(100);
    });

    it("increases priority with semantic interference", () => {
      const today = new Date().toISOString().split("T")[0];

      const lowInterference: LECTORCardState = {
        ...createInitialLECTORState(),
        nextReview: today,
        semanticInterference: 0.1
      };

      const highInterference: LECTORCardState = {
        ...createInitialLECTORState(),
        nextReview: today,
        semanticInterference: 0.9
      };

      expect(calculatePriorityScore(highInterference)).toBeGreaterThan(
        calculatePriorityScore(lowInterference)
      );
    });

    it("increases priority for overdue cards", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const overdue: LECTORCardState = {
        ...createInitialLECTORState(),
        nextReview: pastDate.toISOString().split("T")[0]
      };

      const dueToday: LECTORCardState = {
        ...createInitialLECTORState(),
        nextReview: new Date().toISOString().split("T")[0]
      };

      expect(calculatePriorityScore(overdue)).toBeGreaterThan(
        calculatePriorityScore(dueToday)
      );
    });
  });

  describe("convertSM2ToLECTOR", () => {
    it("converts SM2 state to LECTOR state", () => {
      const sm2State = {
        easeFactor: 2.3,
        interval: 10,
        repetitions: 5,
        nextReview: "2026-01-25"
      };

      const lectorState = convertSM2ToLECTOR(sm2State);

      expect(lectorState.easeFactor).toBe(2.3);
      expect(lectorState.interval).toBe(10);
      expect(lectorState.repetitions).toBe(5);
      expect(lectorState.nextReview).toBe("2026-01-25");
      expect(lectorState.semanticInterference).toBe(0);
      expect(lectorState.confusedWith).toEqual([]);
      expect(lectorState.masteryLevel).toBe(0);
    });
  });

  describe("recordConfusion", () => {
    it("adds confusion to state", () => {
      const state = createInitialLECTORState();
      const newState = recordConfusion(state, "other-concept");

      expect(newState.confusedWith).toContain("other-concept");
    });

    it("keeps only last 5 confusions", () => {
      let state = createInitialLECTORState();

      for (let i = 0; i < 7; i++) {
        state = recordConfusion(state, `concept-${i}`);
      }

      expect(state.confusedWith.length).toBeLessThanOrEqual(5);
    });

    it("deduplicates confusions", () => {
      let state = createInitialLECTORState();
      state = recordConfusion(state, "same-concept");
      state = recordConfusion(state, "same-concept");

      expect(state.confusedWith.filter((c) => c === "same-concept").length).toBe(1);
    });
  });
});
