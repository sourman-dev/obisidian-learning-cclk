/**
 * Card Parser Tests
 *
 * Tests MCQ and visual card parsing functionality
 */

import {
  parseFrontmatter,
  parseCardBlock,
  parseMCQOptions,
  parseMatchingPairs,
  parseMarkdownFile
} from "./card-parser";
import { CardFrontmatter } from "../types/card-types";

describe("Card Parser", () => {
  const defaultFrontmatter: CardFrontmatter = {
    topic: "Test Topic",
    chapter: 1,
    tags: ["test"]
  };

  describe("parseFrontmatter", () => {
    it("should parse valid frontmatter", () => {
      const content = `---
topic: Huyệt Kinh Phế
chapter: 8
tags: [huyet-vi, kinh-phe]
---
# Content`;

      const result = parseFrontmatter(content);
      expect(result).toEqual({
        topic: "Huyệt Kinh Phế",
        chapter: 8,
        tags: ["huyet-vi", "kinh-phe"]
      });
    });

    it("should return null for missing frontmatter", () => {
      const content = "# No frontmatter here";
      expect(parseFrontmatter(content)).toBeNull();
    });
  });

  describe("parseMCQOptions", () => {
    it("should parse MCQ options with checkbox format", () => {
      const block = `MCQ:: Huyệt nào KHÔNG thuộc kinh Phế?
- [ ] Thiếu Thương
- [ ] Ngư Tế
- [x] Thiếu Trạch
- [ ] Thái Uyên`;

      const options = parseMCQOptions(block);
      expect(options).toHaveLength(4);
      expect(options[0]).toEqual({ text: "Thiếu Thương", isCorrect: false });
      expect(options[2]).toEqual({ text: "Thiếu Trạch", isCorrect: true });
    });

    it("should handle multiple correct answers", () => {
      const block = `MCQ:: Which are Tĩnh huyệt?
- [x] Thiếu Thương
- [ ] Ngư Tế
- [x] Thiếu Xung`;

      const options = parseMCQOptions(block);
      const correctCount = options.filter(o => o.isCorrect).length;
      expect(correctCount).toBe(2);
    });
  });

  describe("parseCardBlock - MCQ", () => {
    it("should parse MCQ block correctly", () => {
      const block = `## MCQ Test
MCQ:: Huyệt nào là Tĩnh huyệt của kinh Phế?
- [x] Thiếu Thương
- [ ] Ngư Tế
- [ ] Thái Uyên
EXPLAIN:: Thiếu Thương là Tĩnh huyệt mang hành Thủy.`;

      const cards = parseCardBlock(block, defaultFrontmatter, "test.md", 1);
      expect(cards).toHaveLength(1);
      expect(cards[0].type).toBe("mcq");
      expect(cards[0].question).toBe("Huyệt nào là Tĩnh huyệt của kinh Phế?");
      expect(cards[0].options).toHaveLength(3);
      expect(cards[0].explanation).toBe(
        "Thiếu Thương là Tĩnh huyệt mang hành Thủy."
      );
    });

    it("should skip MCQ with less than 2 options", () => {
      const block = `## MCQ Test
MCQ:: Question?
- [x] Only one option`;

      const cards = parseCardBlock(block, defaultFrontmatter, "test.md", 1);
      expect(cards).toHaveLength(0);
    });
  });

  describe("parseCardBlock - Visual", () => {
    it("should parse visual card with image", () => {
      const block = `## Visual Test
IMG:: images/thieu-thuong.png
Q:: Identify this huyệt
A:: Thiếu Thương`;

      const cards = parseCardBlock(block, defaultFrontmatter, "test.md", 1);
      expect(cards).toHaveLength(1);
      expect(cards[0].type).toBe("visual");
      expect(cards[0].imagePath).toBe("images/thieu-thuong.png");
      expect(cards[0].question).toBe("Identify this huyệt");
      expect(cards[0].answer).toBe("Thiếu Thương");
    });

    it("should use default question when Q:: is missing", () => {
      const block = `## Visual Test
IMG:: images/test.png`;

      const cards = parseCardBlock(block, defaultFrontmatter, "test.md", 1);
      expect(cards[0].question).toBe("Identify this huyệt");
    });
  });

  describe("parseMatchingPairs", () => {
    it("should parse matching pairs correctly", () => {
      const block = `MATCH::
- Thiếu Thương | Tĩnh
- Ngư Tế | Vinh
- Thái Uyên | Du + Nguyên`;

      const pairs = parseMatchingPairs(block);
      expect(pairs).toHaveLength(3);
      expect(pairs[0]).toEqual({ term: "Thiếu Thương", definition: "Tĩnh" });
    });
  });

  describe("parseCardBlock - Forward/Reverse", () => {
    it("should parse forward card", () => {
      const block = `## Forward Test
Q:: What is the Tĩnh huyệt of Phế?
A:: Thiếu Thương`;

      const cards = parseCardBlock(block, defaultFrontmatter, "test.md", 1);
      expect(cards).toHaveLength(1);
      expect(cards[0].type).toBe("forward");
    });

    it("should parse reverse card creating both directions", () => {
      const block = `## Reverse Test
Q::: What is the Tĩnh huyệt of Phế?
A::: Thiếu Thương`;

      const cards = parseCardBlock(block, defaultFrontmatter, "test.md", 1);
      expect(cards).toHaveLength(2);
      expect(cards[0].type).toBe("forward");
      expect(cards[1].type).toBe("reverse");
      expect(cards[1].question).toBe("Thiếu Thương");
      expect(cards[1].answer).toBe("What is the Tĩnh huyệt of Phế?");
    });
  });

  describe("parseMarkdownFile", () => {
    it("should parse complete markdown file", () => {
      const content = `---
topic: Test Topic
chapter: 1
tags: [test]
---

# Test File

## Card 1
Q:: Question 1
A:: Answer 1

## Card 2
MCQ:: MCQ Question
- [x] Correct
- [ ] Wrong
EXPLAIN:: Explanation`;

      const cards = parseMarkdownFile(content, "test.md");
      expect(cards.length).toBeGreaterThanOrEqual(2);
    });

    it("should return empty array for file without frontmatter", () => {
      const content = "# No frontmatter\nJust content";
      const cards = parseMarkdownFile(content, "test.md");
      expect(cards).toEqual([]);
    });
  });

  describe("Card ID generation", () => {
    it("should generate correct ID format", () => {
      const block = `## Test
Q:: Question
A:: Answer`;

      const cards = parseCardBlock(block, defaultFrontmatter, "test.md", 5);
      expect(cards[0].id).toBe("test-topic::5");
    });

    it("should append type suffix for MCQ", () => {
      const block = `## MCQ
MCQ:: Question?
- [x] A
- [ ] B`;

      const cards = parseCardBlock(block, defaultFrontmatter, "test.md", 3);
      expect(cards[0].id).toBe("test-topic::3-mcq");
    });

    it("should append visual suffix for visual cards", () => {
      const block = `## Visual
IMG:: test.png`;

      const cards = parseCardBlock(block, defaultFrontmatter, "test.md", 7);
      expect(cards[0].id).toBe("test-topic::7-visual");
    });

    it("should append matching suffix for matching cards", () => {
      const block = `## Matching
MATCH::
- Term1 | Def1
- Term2 | Def2`;

      const cards = parseCardBlock(block, defaultFrontmatter, "test.md", 2);
      expect(cards[0].id).toBe("test-topic::2-matching");
    });
  });
});
