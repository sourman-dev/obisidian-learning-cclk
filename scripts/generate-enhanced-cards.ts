/**
 * Generate Enhanced Cards with MCQ
 *
 * Enhances existing cclk-cards with:
 * - MCQ questions using distractors from semantic matrix
 * - Enhanced frontmatter with confusableWith metadata
 *
 * Usage: npx tsx scripts/generate-enhanced-cards.ts
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Types
// ============================================================================

interface HuyetConcept {
  id: string;
  name: string;
  kinh: string;
  nguHanh: string;
  nguDuHuyet: string;
  sourceFile: string;
}

interface ConfusionPair {
  score: number;
  reasons: string[];
}

interface SemanticMatrix {
  version: number;
  generated: string;
  concepts: HuyetConcept[];
  matrix: Record<string, ConfusionPair>;
}

interface MCQQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  matrixPath: path.resolve(__dirname, "../src/data/semantic-matrix.json"),
  cardsDir: path.resolve(__dirname, "../cclk-cards"),
  outputDir: path.resolve(__dirname, "../cclk-cards"), // Update in-place
  topConfusableCount: 3, // Number of confusable pairs to include in frontmatter
  mcqDistractorCount: 3 // Number of distractors per MCQ
};

// ============================================================================
// Matrix Loading
// ============================================================================

function loadMatrix(): SemanticMatrix {
  try {
    const content = fs.readFileSync(CONFIG.matrixPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load semantic matrix: ${errMsg}`);
  }
}

function getConfusablePairs(
  matrix: SemanticMatrix,
  conceptId: string,
  count: number
): Array<{ id: string; score: number; reason: string }> {
  const pairs: Array<{ id: string; score: number; reason: string }> = [];

  for (const [key, pair] of Object.entries(matrix.matrix)) {
    const [idA, idB] = key.split(":");
    if (idA === conceptId || idB === conceptId) {
      pairs.push({
        id: idA === conceptId ? idB : idA,
        score: pair.score,
        reason: pair.reasons[0] || "unknown"
      });
    }
  }

  return pairs.sort((a, b) => b.score - a.score).slice(0, count);
}

function getConceptByName(
  matrix: SemanticMatrix,
  name: string
): HuyetConcept | undefined {
  return matrix.concepts.find(
    (c) => c.name === name || c.name.toLowerCase() === name.toLowerCase()
  );
}

// ============================================================================
// MCQ Generation
// ============================================================================

/**
 * Generate MCQ questions for a concept
 */
function generateMCQForConcept(
  concept: HuyetConcept,
  matrix: SemanticMatrix
): MCQQuestion[] {
  const questions: MCQQuestion[] = [];
  const confusable = getConfusablePairs(matrix, concept.id, 5);

  // Get concepts from same kinh for distractors
  const sameKinhConcepts = matrix.concepts.filter(
    (c) => c.kinh === concept.kinh && c.id !== concept.id
  );

  // Generate "Which is NOT in kinh X?" question
  if (confusable.length >= 1) {
    const wrongAnswer = confusable[0];
    const wrongConcept = matrix.concepts.find((c) => c.id === wrongAnswer.id);

    if (wrongConcept && wrongConcept.kinh !== concept.kinh) {
      const optionsRaw = [
        concept.name,
        ...sameKinhConcepts.slice(0, 2).map((c) => c.name),
        wrongConcept.name
      ];

      // Deduplicate options
      const options = [...new Set(optionsRaw)];
      if (options.length >= 3) {
        // Shuffle options
        const shuffled = shuffleArray([...options]);
        const correctIndex = shuffled.indexOf(wrongConcept.name);

        questions.push({
          question: `Huyệt nào KHÔNG thuộc kinh ${concept.kinh}?`,
          options: shuffled,
          correctIndex,
          explanation: `${wrongConcept.name} thuộc kinh ${wrongConcept.kinh}, không phải kinh ${concept.kinh}. Dễ nhầm vì ${getReasonText(wrongAnswer.reason)}.`
        });
      }
    }
  }

  // Generate "Which is Tĩnh huyệt of kinh X?" question
  if (concept.nguDuHuyet && sameKinhConcepts.length >= 2) {
    const distractors = sameKinhConcepts
      .filter((c) => c.nguDuHuyet !== concept.nguDuHuyet)
      .slice(0, CONFIG.mcqDistractorCount);

    if (distractors.length >= 2) {
      const optionsRaw = [concept.name, ...distractors.map((c) => c.name)];
      // Deduplicate options
      const options = [...new Set(optionsRaw)];
      if (options.length >= 3) {
        const shuffled = shuffleArray([...options]);
        const correctIndex = shuffled.indexOf(concept.name);

        questions.push({
          question: `Huyệt nào là ${concept.nguDuHuyet} huyệt của kinh ${concept.kinh}?`,
          options: shuffled,
          correctIndex,
          explanation: `${concept.name} là ${concept.nguDuHuyet} huyệt của kinh ${concept.kinh}, mang hành ${concept.nguHanh}.`
        });
      }
    }
  }

  return questions;
}

function getReasonText(reason: string): string {
  const reasons: Record<string, string> = {
    similar_name: "tên gần giống",
    same_prefix: "có cùng chữ đầu",
    same_suffix: "có cùng chữ cuối",
    same_kinh: "cùng kinh mạch",
    same_nguhanh: "cùng ngũ hành",
    same_ngudu: "cùng loại ngũ du huyệt",
    bieu_ly_pair: "là cặp biểu lý"
  };
  return reasons[reason] || reason;
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ============================================================================
// Card Enhancement
// ============================================================================

interface CardFile {
  path: string;
  content: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

function parseCardFile(filePath: string): CardFile | null {
  const content = fs.readFileSync(filePath, "utf-8");
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) return null;

  try {
    // Simple YAML parsing
    const frontmatter: Record<string, unknown> = {};
    const yamlLines = match[1].split("\n");

    for (const line of yamlLines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        let value: unknown = line.slice(colonIndex + 1).trim();

        // Parse arrays like [tag1, tag2]
        if (typeof value === "string" && value.startsWith("[")) {
          value = value
            .slice(1, -1)
            .split(",")
            .map((s) => s.trim());
        }
        // Parse numbers
        else if (typeof value === "string" && /^\d+$/.test(value)) {
          value = parseInt(value, 10);
        }

        frontmatter[key] = value;
      }
    }

    return {
      path: filePath,
      content,
      frontmatter,
      body: match[2]
    };
  } catch {
    return null;
  }
}

function enhanceCardFile(
  card: CardFile,
  matrix: SemanticMatrix
): string {
  // Skip if already enhanced (has lector: in frontmatter)
  // Note: simple YAML parser stores empty string for "lector:", check presence by key
  if ("lector" in card.frontmatter) {
    return card.content;
  }

  // Find concepts mentioned in this file
  const concepts = findConceptsInCard(card, matrix);

  if (concepts.length === 0) {
    // No concepts found, return original content
    return card.content;
  }

  // Generate MCQs for first concept (main topic of file)
  const mainConcept = concepts[0];
  const mcqs = generateMCQForConcept(mainConcept, matrix);

  // Build enhanced frontmatter - only add lector, preserve existing keys
  const enhancedFrontmatter: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(card.frontmatter)) {
    if (key !== "lector") {
      enhancedFrontmatter[key] = value;
    }
  }

  const confusable = getConfusablePairs(
    matrix,
    mainConcept.id,
    CONFIG.topConfusableCount
  );

  enhancedFrontmatter.lector = {
    conceptId: mainConcept.id,
    confusableWith: confusable
  };

  // Build MCQ blocks
  let mcqBlocks = "";
  mcqs.forEach((mcq, idx) => {
    mcqBlocks += `\n## MCQ ${idx + 1}\n`;
    mcqBlocks += `MCQ:: ${mcq.question}\n`;
    mcq.options.forEach((opt, optIdx) => {
      const marker = optIdx === mcq.correctIndex ? "x" : " ";
      mcqBlocks += `- [${marker}] ${opt}\n`;
    });
    mcqBlocks += `EXPLAIN:: ${mcq.explanation}\n`;
  });

  // Build output
  let output = "---\n";
  output += serializeFrontmatter(enhancedFrontmatter);
  output += "---\n";
  output += card.body;
  output += mcqBlocks;

  return output;
}

function findConceptsInCard(
  card: CardFile,
  matrix: SemanticMatrix
): HuyetConcept[] {
  const found: HuyetConcept[] = [];

  for (const concept of matrix.concepts) {
    if (card.content.includes(concept.name)) {
      found.push(concept);
    }
  }

  return found;
}

function serializeFrontmatter(fm: Record<string, unknown>): string {
  let output = "";

  for (const [key, value] of Object.entries(fm)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      output += `${key}: [${value.join(", ")}]\n`;
    } else if (typeof value === "object") {
      output += `${key}:\n`;
      output += serializeNestedObject(value as Record<string, unknown>, 2);
    } else {
      output += `${key}: ${value}\n`;
    }
  }

  return output;
}

function serializeNestedObject(
  obj: Record<string, unknown>,
  indent: number
): string {
  let output = "";
  const spaces = " ".repeat(indent);

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      output += `${spaces}${key}:\n`;
      for (const item of value) {
        if (typeof item === "object") {
          output += `${spaces}  -\n`;
          for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
            output += `${spaces}    ${k}: ${v}\n`;
          }
        } else {
          output += `${spaces}  - ${item}\n`;
        }
      }
    } else if (typeof value === "object") {
      output += `${spaces}${key}:\n`;
      output += serializeNestedObject(value as Record<string, unknown>, indent + 2);
    } else {
      output += `${spaces}${key}: ${value}\n`;
    }
  }

  return output;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("=== Enhanced Cards Generator ===\n");

  // Load matrix
  console.log("Step 1: Loading semantic matrix...");
  const matrix = loadMatrix();
  console.log(`Loaded ${matrix.concepts.length} concepts\n`);

  // Ensure output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // Process card files
  console.log("Step 2: Enhancing card files...");
  const files = fs
    .readdirSync(CONFIG.cardsDir)
    .filter((f) => f.endsWith(".md") && f.includes("huyet-kinh"));

  let enhanced = 0;
  let mcqCount = 0;

  for (const file of files) {
    const inputPath = path.join(CONFIG.cardsDir, file);
    const outputPath = path.join(CONFIG.outputDir, file);

    const card = parseCardFile(inputPath);
    if (!card) {
      console.log(`  Skipping ${file} (parse error)`);
      continue;
    }

    // Skip if already enhanced
    if ("lector" in card.frontmatter) {
      console.log(`  ✓ ${file}: already enhanced`);
      continue;
    }

    const concepts = findConceptsInCard(card, matrix);
    if (concepts.length === 0) {
      // Copy as-is
      if (inputPath !== outputPath) {
        fs.copyFileSync(inputPath, outputPath);
      }
      continue;
    }

    const output = enhanceCardFile(card, matrix);
    fs.writeFileSync(outputPath, output);

    const mcqs = generateMCQForConcept(concepts[0], matrix);
    mcqCount += mcqs.length;
    enhanced++;

    console.log(`  ✓ ${file}: +${mcqs.length} MCQs`);
  }

  // Also copy non-huyệt files
  const otherFiles = fs
    .readdirSync(CONFIG.cardsDir)
    .filter((f) => f.endsWith(".md") && !f.includes("huyet-kinh"));

  for (const file of otherFiles) {
    fs.copyFileSync(
      path.join(CONFIG.cardsDir, file),
      path.join(CONFIG.outputDir, file)
    );
  }

  console.log("\n=== Summary ===");
  console.log(`Enhanced files: ${enhanced}`);
  console.log(`Total MCQs added: ${mcqCount}`);
  console.log(`Output directory: ${CONFIG.outputDir}`);
  console.log("\n✓ Done!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
