/**
 * Confusion Tracker Tests
 */

import {
  ConfusionTracker,
  initConfusionTracker,
  getConfusionTracker
} from "./confusion-tracker";

describe("ConfusionTracker", () => {
  describe("recordConfusion", () => {
    it("records a new confusion entry", () => {
      const tracker = new ConfusionTracker();
      tracker.recordConfusion("thieu-phu", "thieu-hai", "mcq");

      const confusions = tracker.getAllConfusions();
      expect(confusions).toHaveLength(1);
      // Concepts are stored as provided (key is sorted for dedup)
      expect(confusions[0].conceptA).toBe("thieu-phu");
      expect(confusions[0].conceptB).toBe("thieu-hai");
      expect(confusions[0].count).toBe(1);
      expect(confusions[0].contexts).toContain("mcq");
    });

    it("increments count for existing pair", () => {
      const tracker = new ConfusionTracker();
      tracker.recordConfusion("thieu-phu", "thieu-hai", "mcq");
      tracker.recordConfusion("thieu-hai", "thieu-phu", "recall");

      const confusions = tracker.getAllConfusions();
      expect(confusions).toHaveLength(1);
      expect(confusions[0].count).toBe(2);
      expect(confusions[0].contexts).toContain("mcq");
      expect(confusions[0].contexts).toContain("recall");
    });

    it("handles multiple pairs", () => {
      const tracker = new ConfusionTracker();
      tracker.recordConfusion("a", "b", "mcq");
      tracker.recordConfusion("c", "d", "mcq");
      tracker.recordConfusion("a", "b", "mcq");

      const confusions = tracker.getAllConfusions();
      expect(confusions).toHaveLength(2);
      expect(confusions[0].count).toBe(2); // a:b is first (sorted by count)
      expect(confusions[1].count).toBe(1);
    });
  });

  describe("getTopConfusions", () => {
    it("returns top N confusions sorted by count", () => {
      const tracker = new ConfusionTracker();
      tracker.recordConfusion("a", "b", "mcq");
      tracker.recordConfusion("c", "d", "mcq");
      tracker.recordConfusion("c", "d", "mcq");
      tracker.recordConfusion("e", "f", "mcq");
      tracker.recordConfusion("e", "f", "mcq");
      tracker.recordConfusion("e", "f", "mcq");

      const top = tracker.getTopConfusions(2);
      expect(top).toHaveLength(2);
      expect(top[0].count).toBe(3); // e:f
      expect(top[1].count).toBe(2); // c:d
    });
  });

  describe("getConfusionsFor", () => {
    it("returns confusions for a specific concept", () => {
      const tracker = new ConfusionTracker();
      tracker.recordConfusion("a", "b", "mcq");
      tracker.recordConfusion("a", "c", "mcq");
      tracker.recordConfusion("d", "e", "mcq");

      const forA = tracker.getConfusionsFor("a");
      expect(forA).toHaveLength(2);

      const forD = tracker.getConfusionsFor("d");
      expect(forD).toHaveLength(1);
    });
  });

  describe("getMostConfusedConcepts", () => {
    it("aggregates confusion counts per concept", () => {
      const tracker = new ConfusionTracker();
      tracker.recordConfusion("a", "b", "mcq");
      tracker.recordConfusion("a", "c", "mcq");
      tracker.recordConfusion("a", "c", "mcq");

      const most = tracker.getMostConfusedConcepts(3);
      expect(most[0].conceptId).toBe("a");
      expect(most[0].totalCount).toBe(3); // 1 + 2
    });
  });

  describe("getTotalConfusionCount", () => {
    it("returns total count across all entries", () => {
      const tracker = new ConfusionTracker();
      tracker.recordConfusion("a", "b", "mcq");
      tracker.recordConfusion("a", "b", "mcq");
      tracker.recordConfusion("c", "d", "mcq");

      expect(tracker.getTotalConfusionCount()).toBe(3);
    });
  });

  describe("serialize/deserialize", () => {
    it("serializes to ConfusionData format", () => {
      const tracker = new ConfusionTracker();
      tracker.recordConfusion("a", "b", "mcq");

      const data = tracker.serialize();
      expect(data.version).toBe(1);
      expect(data.entries).toHaveLength(1);
    });

    it("initializes from saved data", () => {
      const savedData = {
        version: 1,
        entries: [
          {
            conceptA: "a",
            conceptB: "b",
            count: 5,
            lastOccurred: "2026-01-18T00:00:00Z",
            contexts: ["mcq" as const]
          }
        ]
      };

      const tracker = new ConfusionTracker(savedData);
      const confusions = tracker.getAllConfusions();
      expect(confusions).toHaveLength(1);
      expect(confusions[0].count).toBe(5);
    });
  });

  describe("clear", () => {
    it("clears all data", () => {
      const tracker = new ConfusionTracker();
      tracker.recordConfusion("a", "b", "mcq");
      tracker.clear();

      expect(tracker.getAllConfusions()).toHaveLength(0);
    });
  });

  describe("singleton", () => {
    it("initConfusionTracker creates singleton", () => {
      const tracker1 = initConfusionTracker();
      const tracker2 = getConfusionTracker();
      expect(tracker1).toBe(tracker2);
    });
  });
});
