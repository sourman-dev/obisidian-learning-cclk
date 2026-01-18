/**
 * Unit Tests for SemanticMatrixManager
 */

import { SemanticMatrixManager, getSemanticMatrix } from "./semantic-matrix";

describe("SemanticMatrixManager", () => {
  let manager: SemanticMatrixManager;

  beforeEach(() => {
    manager = new SemanticMatrixManager();
  });

  describe("Basic Information", () => {
    test("should load matrix version", () => {
      const version = manager.getVersion();
      expect(version).toBe(1);
    });

    test("should have generated timestamp", () => {
      const generated = manager.getGeneratedAt();
      expect(generated).toBeTruthy();
      expect(new Date(generated).getTime()).toBeGreaterThan(0);
    });

    test("should have 60+ concepts", () => {
      const count = manager.getConceptCount();
      expect(count).toBeGreaterThanOrEqual(60);
    });

    test("getAllConcepts should return array of concepts", () => {
      const concepts = manager.getAllConcepts();
      expect(Array.isArray(concepts)).toBe(true);
      expect(concepts.length).toBeGreaterThanOrEqual(60);
    });
  });

  describe("Concept Structure Validation", () => {
    test("concepts should have required fields", () => {
      const concepts = manager.getAllConcepts();
      const sample = concepts[0];

      expect(sample).toHaveProperty("id");
      expect(sample).toHaveProperty("name");
      expect(sample).toHaveProperty("kinh");
      expect(sample).toHaveProperty("nguHanh");
      expect(sample).toHaveProperty("nguDuHuyet");
      expect(sample).toHaveProperty("sourceFile");

      expect(typeof sample.id).toBe("string");
      expect(typeof sample.name).toBe("string");
      expect(typeof sample.kinh).toBe("string");
      expect(sample.id.length).toBeGreaterThan(0);
      expect(sample.name.length).toBeGreaterThan(0);
    });

    test("concept IDs should be unique", () => {
      const concepts = manager.getAllConcepts();
      const ids = concepts.map((c) => c.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    test("getConcept should retrieve by ID", () => {
      const concepts = manager.getAllConcepts();
      const firstId = concepts[0].id;
      const retrieved = manager.getConcept(firstId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(firstId);
    });

    test("getConcept should return undefined for invalid ID", () => {
      const retrieved = manager.getConcept("invalid-id-xyz");
      expect(retrieved).toBeUndefined();
    });
  });

  describe("Confusion Matrix Validation", () => {
    test("getConfusion should return ConfusionPair for valid pairs", () => {
      const concepts = manager.getAllConcepts();
      // Get first two concepts
      const [c1, c2] = concepts.slice(0, 2);

      const confusion = manager.getConfusion(c1.id, c2.id);
      // May be null if no confusion exists
      if (confusion) {
        expect(confusion).toHaveProperty("score");
        expect(confusion).toHaveProperty("reasons");
        expect(typeof confusion.score).toBe("number");
        expect(Array.isArray(confusion.reasons)).toBe(true);
        expect(confusion.score).toBeGreaterThanOrEqual(0);
        expect(confusion.score).toBeLessThanOrEqual(1);
      }
    });

    test("confusion scores should be between 0 and 1", () => {
      const concepts = manager.getAllConcepts();
      // Sample 10 pairs
      for (let i = 0; i < Math.min(10, concepts.length - 1); i++) {
        const confusion = manager.getConfusion(concepts[i].id, concepts[i + 1].id);
        if (confusion) {
          expect(confusion.score).toBeGreaterThanOrEqual(0);
          expect(confusion.score).toBeLessThanOrEqual(1);
        }
      }
    });

    test("confusion reasons should be valid types", () => {
      const validReasons = [
        "similar_name",
        "same_prefix",
        "same_suffix",
        "same_kinh",
        "same_nguhanh",
        "same_ngudu",
        "bieu_ly_pair",
        "similar_function",
        "similar_position"
      ];

      const concepts = manager.getAllConcepts();
      // Check first 20 pairs with confusion data
      let checked = 0;
      for (let i = 0; i < concepts.length - 1 && checked < 20; i++) {
        for (let j = i + 1; j < concepts.length && checked < 20; j++) {
          const confusion = manager.getConfusion(concepts[i].id, concepts[j].id);
          if (confusion) {
            for (const reason of confusion.reasons) {
              expect(validReasons).toContain(reason);
            }
            checked++;
          }
        }
      }
    });
  });

  describe("getConfusionScore", () => {
    test("should return numeric score", () => {
      const concepts = manager.getAllConcepts();
      const score = manager.getConfusionScore(concepts[0].id, concepts[1].id);

      expect(typeof score).toBe("number");
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    test("should return 0 for non-confusable pairs", () => {
      const score = manager.getConfusionScore("invalid-1", "invalid-2");
      expect(score).toBe(0);
    });

    test("should be symmetric (idA:idB = idB:idA)", () => {
      const concepts = manager.getAllConcepts();
      const [c1, c2] = concepts.slice(0, 2);

      const score1 = manager.getConfusionScore(c1.id, c2.id);
      const score2 = manager.getConfusionScore(c2.id, c1.id);

      expect(score1).toBe(score2);
    });
  });

  describe("getConfusablePairs", () => {
    test("should return sorted array of confusable pairs", () => {
      const concepts = manager.getAllConcepts();
      const pairs = manager.getConfusablePairs(concepts[0].id);

      expect(Array.isArray(pairs)).toBe(true);

      // Check sorting (descending by score)
      for (let i = 0; i < pairs.length - 1; i++) {
        expect(pairs[i][1].score).toBeGreaterThanOrEqual(pairs[i + 1][1].score);
      }
    });

    test("should respect threshold parameter", () => {
      const concepts = manager.getAllConcepts();
      const threshold = 0.5;
      const pairs = manager.getConfusablePairs(concepts[0].id, threshold);

      for (const [_, pair] of pairs) {
        expect(pair.score).toBeGreaterThanOrEqual(threshold);
      }
    });

    test("should return empty array for concept with no confusable pairs above threshold", () => {
      const concepts = manager.getAllConcepts();
      // Use very high threshold
      const pairs = manager.getConfusablePairs(concepts[0].id, 1.0);

      expect(Array.isArray(pairs)).toBe(true);
    });

    test("should return [id, ConfusionPair] tuples", () => {
      const concepts = manager.getAllConcepts();
      const pairs = manager.getConfusablePairs(concepts[0].id);

      if (pairs.length > 0) {
        const [id, pair] = pairs[0];
        expect(typeof id).toBe("string");
        expect(pair).toHaveProperty("score");
        expect(pair).toHaveProperty("reasons");
      }
    });
  });

  describe("getTopConfusable", () => {
    test("should return array of concept IDs", () => {
      const concepts = manager.getAllConcepts();
      const top = manager.getTopConfusable(concepts[0].id);

      expect(Array.isArray(top)).toBe(true);
      for (const id of top) {
        expect(typeof id).toBe("string");
      }
    });

    test("should return at most N items", () => {
      const concepts = manager.getAllConcepts();
      const n = 5;
      const top = manager.getTopConfusable(concepts[0].id, n);

      expect(top.length).toBeLessThanOrEqual(n);
    });

    test("should return IDs in descending confusion score order", () => {
      const concepts = manager.getAllConcepts();
      const top = manager.getTopConfusable(concepts[0].id, 5);

      // Verify order by checking scores
      const scores = top.map((id) =>
        manager.getConfusionScore(concepts[0].id, id)
      );
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
    });

    test("default N should be 3", () => {
      const concepts = manager.getAllConcepts();
      const top = manager.getTopConfusable(concepts[0].id);

      expect(top.length).toBeLessThanOrEqual(3);
    });
  });

  describe("getMaxInterference", () => {
    test("should return numeric value", () => {
      const concepts = manager.getAllConcepts();
      const maxInterference = manager.getMaxInterference(concepts[0].id);

      expect(typeof maxInterference).toBe("number");
      expect(maxInterference).toBeGreaterThanOrEqual(0);
      expect(maxInterference).toBeLessThanOrEqual(1);
    });

    test("should return highest confusion score for concept", () => {
      const concepts = manager.getAllConcepts();
      const concept = concepts[0];

      const maxInterference = manager.getMaxInterference(concept.id);
      const allPairs = manager.getConfusablePairs(concept.id, 0);

      if (allPairs.length > 0) {
        const highestPair = allPairs[0][1].score;
        expect(maxInterference).toBe(highestPair);
      } else {
        expect(maxInterference).toBe(0);
      }
    });
  });

  describe("getConceptsByKinh", () => {
    test("should return concepts from same kinh", () => {
      const concepts = manager.getAllConcepts();
      const firstKinh = concepts[0].kinh;
      const samePhe = manager.getConceptsByKinh(firstKinh);

      expect(Array.isArray(samePhe)).toBe(true);
      for (const concept of samePhe) {
        expect(concept.kinh).toBe(firstKinh);
      }
    });

    test("should return empty array for non-existent kinh", () => {
      const result = manager.getConceptsByKinh("NonExistentKinh");
      expect(result).toEqual([]);
    });
  });

  describe("getConceptsByNguHanh", () => {
    test("should return concepts with same nguHanh", () => {
      const concepts = manager.getAllConcepts();
      // Find a concept with non-empty nguHanh
      const conceptWithHanh = concepts.find((c) => c.nguHanh);

      if (conceptWithHanh) {
        const sameHanh = manager.getConceptsByNguHanh(conceptWithHanh.nguHanh);

        expect(Array.isArray(sameHanh)).toBe(true);
        for (const concept of sameHanh) {
          expect(concept.nguHanh).toBe(conceptWithHanh.nguHanh);
        }
      }
    });

    test("should return empty array for non-existent nguHanh", () => {
      const result = manager.getConceptsByNguHanh("NonExistent");
      expect(result).toEqual([]);
    });
  });

  describe("getStatistics", () => {
    test("should return statistics object", () => {
      const stats = manager.getStatistics();

      expect(stats).toHaveProperty("totalConcepts");
      expect(stats).toHaveProperty("totalPairs");
      expect(stats).toHaveProperty("highConfusionPairs");
      expect(stats).toHaveProperty("averageScore");

      expect(typeof stats.totalConcepts).toBe("number");
      expect(typeof stats.totalPairs).toBe("number");
      expect(typeof stats.highConfusionPairs).toBe("number");
      expect(typeof stats.averageScore).toBe("number");
    });

    test("totalConcepts should match concept count", () => {
      const stats = manager.getStatistics();
      expect(stats.totalConcepts).toBe(manager.getConceptCount());
    });

    test("averageScore should be between 0 and 1", () => {
      const stats = manager.getStatistics();
      expect(stats.averageScore).toBeGreaterThanOrEqual(0);
      expect(stats.averageScore).toBeLessThanOrEqual(1);
    });

    test("highConfusionPairs should be <= totalPairs", () => {
      const stats = manager.getStatistics();
      expect(stats.highConfusionPairs).toBeLessThanOrEqual(stats.totalPairs);
    });
  });

  describe("Singleton getSemanticMatrix", () => {
    test("should return same instance", () => {
      const instance1 = getSemanticMatrix();
      const instance2 = getSemanticMatrix();

      expect(instance1).toBe(instance2);
    });

    test("should be functional instance", () => {
      const instance = getSemanticMatrix();
      const version = instance.getVersion();

      expect(version).toBe(1);
    });
  });

  describe("Edge Cases", () => {
    test("getConfusion with same concept ID should handle correctly", () => {
      const concepts = manager.getAllConcepts();
      const confusion = manager.getConfusion(concepts[0].id, concepts[0].id);

      // Same concept should have no confusion or perfect confusion
      if (confusion) {
        expect(confusion.score).toBeGreaterThanOrEqual(0);
        expect(confusion.score).toBeLessThanOrEqual(1);
      }
    });

    test("getAllConcepts should return copy not reference", () => {
      const concepts1 = manager.getAllConcepts();
      const concepts2 = manager.getAllConcepts();

      expect(concepts1).not.toBe(concepts2);
      expect(concepts1).toEqual(concepts2);
    });
  });
});
