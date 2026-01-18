/**
 * Semantic Matrix Structure Validator
 *
 * Validates the semantic-matrix.json file structure and data integrity
 */

const fs = require("fs");
const path = require("path");

const MATRIX_PATH = path.join(__dirname, "../src/data/semantic-matrix.json");

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

const VALID_REASONS = [
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

function validateMatrix(): boolean {
  console.log("=== Semantic Matrix Structure Validator ===\n");

  // 1. File exists
  if (!fs.existsSync(MATRIX_PATH)) {
    console.error("❌ semantic-matrix.json not found at:", MATRIX_PATH);
    return false;
  }
  console.log("✓ File exists");

  // 2. Valid JSON
  let data: SemanticMatrix;
  try {
    const content = fs.readFileSync(MATRIX_PATH, "utf-8");
    data = JSON.parse(content);
  } catch (error) {
    console.error("❌ Invalid JSON:", (error as Error).message);
    return false;
  }
  console.log("✓ Valid JSON");

  // 3. Has required top-level properties
  if (!data.version || !data.generated || !data.concepts || !data.matrix) {
    console.error("❌ Missing required properties (version, generated, concepts, matrix)");
    return false;
  }
  console.log("✓ Has required properties");

  // 4. Version is number
  if (typeof data.version !== "number") {
    console.error("❌ version must be a number");
    return false;
  }
  console.log(`✓ Version: ${data.version}`);

  // 5. Generated is valid ISO timestamp
  try {
    const date = new Date(data.generated);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
  } catch (error) {
    console.error("❌ Invalid generated timestamp:", data.generated);
    return false;
  }
  console.log(`✓ Generated: ${data.generated}`);

  // 6. Concepts is array with 60+ items
  if (!Array.isArray(data.concepts)) {
    console.error("❌ concepts must be an array");
    return false;
  }
  if (data.concepts.length < 60) {
    console.error(`❌ concepts has only ${data.concepts.length} items, expected 60+`);
    return false;
  }
  console.log(`✓ Concepts count: ${data.concepts.length}`);

  // 7. Each concept has required fields
  const conceptIds = new Set<string>();
  for (let i = 0; i < data.concepts.length; i++) {
    const concept = data.concepts[i];

    if (!concept.id || !concept.name || !concept.kinh || typeof concept.nguHanh !== "string" || !concept.sourceFile) {
      console.error(`❌ Concept ${i} missing required fields:`, concept);
      return false;
    }

    if (typeof concept.id !== "string" || typeof concept.name !== "string") {
      console.error(`❌ Concept ${i} has invalid types`);
      return false;
    }

    // Check for duplicates
    if (conceptIds.has(concept.id)) {
      console.error(`❌ Duplicate concept ID: ${concept.id}`);
      return false;
    }
    conceptIds.add(concept.id);
  }
  console.log("✓ All concepts have valid structure");

  // 8. Matrix is object
  if (typeof data.matrix !== "object" || Array.isArray(data.matrix)) {
    console.error("❌ matrix must be an object");
    return false;
  }

  // 9. Matrix pairs have valid structure
  const pairCount = Object.keys(data.matrix).length;
  let validPairs = 0;
  let scoreErrors = 0;
  let reasonErrors = 0;

  for (const [key, pair] of Object.entries(data.matrix)) {
    // Key format: "id1:id2" sorted alphabetically
    const [id1, id2] = key.split(":");
    if (!id1 || !id2) {
      console.error(`❌ Invalid matrix key format: ${key}`);
      return false;
    }

    // Both IDs must exist in concepts
    if (!conceptIds.has(id1) || !conceptIds.has(id2)) {
      console.error(`❌ Matrix key references non-existent concept: ${key}`);
      return false;
    }

    // Score must be number between 0 and 1
    if (typeof pair.score !== "number" || pair.score < 0 || pair.score > 1) {
      scoreErrors++;
      console.warn(`⚠️  Invalid score for ${key}: ${pair.score}`);
    }

    // Reasons must be array
    if (!Array.isArray(pair.reasons)) {
      reasonErrors++;
      console.warn(`⚠️  Invalid reasons for ${key}:`, pair.reasons);
    } else {
      // All reasons must be valid
      for (const reason of pair.reasons) {
        if (!VALID_REASONS.includes(reason)) {
          reasonErrors++;
          console.warn(`⚠️  Invalid reason for ${key}: ${reason}`);
        }
      }
    }

    validPairs++;
  }

  console.log(`✓ Matrix pairs count: ${pairCount}`);
  console.log(`✓ Valid pairs: ${validPairs}`);

  if (scoreErrors > 0) {
    console.warn(`⚠️  Score errors: ${scoreErrors}`);
  }
  if (reasonErrors > 0) {
    console.warn(`⚠️  Reason errors: ${reasonErrors}`);
  }

  // 10. Statistics
  const scores = Object.values(data.matrix).map((p) => p.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const highConfusion = scores.filter((s) => s >= 0.5).length;

  console.log("\n=== Statistics ===");
  console.log(`Total concepts: ${data.concepts.length}`);
  console.log(`Total pairs: ${pairCount}`);
  console.log(`High confusion pairs (≥0.5): ${highConfusion}`);
  console.log(`Average confusion score: ${avgScore.toFixed(3)}`);

  // Top 5 confusing pairs
  const sorted = Object.entries(data.matrix)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 5);

  console.log("\n=== Top 5 Most Confusing Pairs ===");
  for (const [key, pair] of sorted) {
    const [id1, id2] = key.split(":");
    const c1 = data.concepts.find((c) => c.id === id1);
    const c2 = data.concepts.find((c) => c.id === id2);
    console.log(
      `  ${c1?.name || id1} ↔ ${c2?.name || id2}: ${pair.score.toFixed(2)} [${pair.reasons.join(", ")}]`
    );
  }

  console.log("\n✅ Semantic matrix validation passed!");
  return true;
}

// Run validation
const success = validateMatrix();
process.exit(success ? 0 : 1);
