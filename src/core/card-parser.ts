/**
 * Card Parser
 *
 * Parses Markdown files into Card objects.
 * Supports three formats: forward (Q::A::), reverse (Q:::A:::), matching (MATCH::)
 */

import { TFile, parseYaml } from "obsidian";
import { Card, CardType, MatchingPair, CardFrontmatter } from "../types/card-types";

/** Regex patterns for card parsing */
const FORWARD_PATTERN = /^Q::\s*(.+)$/m;
const ANSWER_PATTERN = /^A::\s*(.+)$/m;
const REVERSE_Q_PATTERN = /^Q:::\s*(.+)$/m;
const REVERSE_A_PATTERN = /^A:::\s*(.+)$/m;
const MATCHING_PATTERN = /^MATCH::$/m;
const MATCHING_ITEM_PATTERN = /^-\s*(.+?)\s*\|\s*(.+)$/gm;

/**
 * Extract frontmatter from markdown content
 */
export function parseFrontmatter(content: string): CardFrontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  try {
    const yaml = parseYaml(match[1]);
    return {
      topic: yaml.topic || "Unknown",
      chapter: yaml.chapter || 0,
      tags: yaml.tags || []
    };
  } catch {
    return null;
  }
}

/**
 * Parse a single card block (between ## headers)
 */
export function parseCardBlock(
  block: string,
  frontmatter: CardFrontmatter,
  sourceFile: string,
  cardIndex: number
): Card[] {
  const cards: Card[] = [];
  const baseId = `${frontmatter.topic.toLowerCase().replace(/\s+/g, "-")}::${cardIndex}`;

  // Check for matching cards first
  if (MATCHING_PATTERN.test(block)) {
    const pairs = parseMatchingPairs(block);
    if (pairs.length >= 2) {
      cards.push({
        id: `${baseId}-matching`,
        topic: frontmatter.topic,
        chapter: frontmatter.chapter || 0,
        type: "matching",
        question: "Match the following pairs:",
        pairs,
        sourceFile,
        tags: frontmatter.tags || []
      });
    }
    return cards;
  }

  // Check for reverse cards (Q:::)
  const reverseQ = block.match(REVERSE_Q_PATTERN);
  const reverseA = block.match(REVERSE_A_PATTERN);
  if (reverseQ && reverseA) {
    // Create forward card
    cards.push({
      id: `${baseId}-forward`,
      topic: frontmatter.topic,
      chapter: frontmatter.chapter || 0,
      type: "forward",
      question: reverseQ[1].trim(),
      answer: reverseA[1].trim(),
      sourceFile,
      tags: frontmatter.tags || []
    });

    // Create reverse card
    cards.push({
      id: `${baseId}-reverse`,
      topic: frontmatter.topic,
      chapter: frontmatter.chapter || 0,
      type: "reverse",
      question: reverseA[1].trim(),
      answer: reverseQ[1].trim(),
      sourceFile,
      tags: frontmatter.tags || []
    });
    return cards;
  }

  // Check for forward cards (Q::)
  const forwardQ = block.match(FORWARD_PATTERN);
  const forwardA = block.match(ANSWER_PATTERN);
  if (forwardQ && forwardA) {
    cards.push({
      id: baseId,
      topic: frontmatter.topic,
      chapter: frontmatter.chapter || 0,
      type: "forward",
      question: forwardQ[1].trim(),
      answer: forwardA[1].trim(),
      sourceFile,
      tags: frontmatter.tags || []
    });
  }

  return cards;
}

/**
 * Parse matching pairs from MATCH:: block
 */
export function parseMatchingPairs(block: string): MatchingPair[] {
  const pairs: MatchingPair[] = [];
  let match;

  // Reset regex lastIndex
  MATCHING_ITEM_PATTERN.lastIndex = 0;

  while ((match = MATCHING_ITEM_PATTERN.exec(block)) !== null) {
    pairs.push({
      term: match[1].trim(),
      definition: match[2].trim()
    });
  }

  return pairs;
}

/**
 * Parse entire markdown file into cards
 */
export function parseMarkdownFile(content: string, filePath: string): Card[] {
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    console.warn(`No frontmatter found in ${filePath}`);
    return [];
  }

  // Split by ## headers
  const blocks = content.split(/(?=^## )/m);
  const cards: Card[] = [];

  blocks.forEach((block, index) => {
    // Skip frontmatter block
    if (block.startsWith("---")) return;

    const parsedCards = parseCardBlock(block, frontmatter, filePath, index);
    cards.push(...parsedCards);
  });

  return cards;
}

/**
 * Generate unique card ID
 */
export function generateCardId(topic: string, index: number, type: CardType): string {
  const slug = topic.toLowerCase().replace(/\s+/g, "-");
  return `${slug}::${index}-${type}`;
}
