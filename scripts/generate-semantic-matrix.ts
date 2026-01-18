/**
 * Generate Semantic Matrix for LECTOR Algorithm
 *
 * Hybrid approach: Rule-based analysis for obvious cases + LLM for complex pairs
 *
 * Usage: npx tsx scripts/generate-semantic-matrix.ts [--llm]
 *   --llm: Enable LLM for complex pair analysis (requires API)
 *
 * Environment:
 *   OPENAI_BASE_URL - API endpoint (default: http://127.0.0.1:8317/api/provider/agy/v1)
 *   OPENAI_API_KEY  - API key (default: ccs-internal-managed)
 *   MODEL_NAME      - Model to use (default: gemini-3-pro-preview)
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

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  baseUrl:
    process.env.OPENAI_BASE_URL ||
    "http://127.0.0.1:8317/api/provider/agy/v1",
  apiKey: process.env.OPENAI_API_KEY || "ccs-internal-managed",
  model: process.env.MODEL_NAME || "gemini-3-pro-preview",
  cardsDir: path.resolve(__dirname, "../cclk-cards"),
  outputPath: path.resolve(__dirname, "../src/data/semantic-matrix.json"),
  useLLM: process.argv.includes("--llm"),
  batchSize: 5,
  retryDelay: 5000,
  maxRetries: 3
};

// ============================================================================
// Card Parser
// ============================================================================

function parseKinhFromFile(filename: string): string {
  const match = filename.match(/huyet-kinh-(.+)\.md$/);
  if (match) {
    const kinhMap: Record<string, string> = {
      phe: "Phế",
      "dai-truong": "Đại Trường",
      "tam-bao": "Tâm Bào",
      "tam-tieu": "Tam Tiêu",
      tam: "Tâm",
      "tieu-truong": "Tiểu Trường",
      ty: "Tỳ",
      vi: "Vị",
      can: "Can",
      dom: "Đởm",
      than: "Thận",
      "bang-quang": "Bàng Quang"
    };
    return kinhMap[match[1]] || match[1];
  }
  return "Unknown";
}

function extractHuyetFromMatch(
  content: string,
  kinh: string,
  sourceFile: string
): HuyetConcept[] {
  const concepts: HuyetConcept[] = [];
  const matchBlocks = content.split(/MATCH::/);

  // First pass: extract huyệt → hành
  for (const block of matchBlocks) {
    if (block.includes("Hành") || block.includes("hành")) {
      const lines = block.split("\n").filter((l) => l.trim().startsWith("-"));
      for (const line of lines) {
        const match = line.match(/^-\s*(.+?)\s*\|\s*(.+)$/);
        if (match) {
          const name = match[1].trim();
          const hanh = match[2].trim();
          if (["Tĩnh", "Vinh", "Du", "Kinh", "Hợp", "Nguyên"].includes(name)) {
            continue;
          }
          const id = name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/\s+/g, "-");
          concepts.push({
            id,
            name,
            kinh,
            nguHanh: hanh,
            nguDuHuyet: "",
            sourceFile
          });
        }
      }
    }
  }

  // Second pass: fill nguDuHuyet from loại
  for (const block of matchBlocks) {
    if (block.includes("Loại") || block.includes("loại")) {
      const lines = block.split("\n").filter((l) => l.trim().startsWith("-"));
      for (const line of lines) {
        const match = line.match(/^-\s*(.+?)\s*\|\s*(.+)$/);
        if (match) {
          const name = match[1].trim();
          const loai = match[2].trim();
          const existing = concepts.find((c) => c.name === name);
          if (existing) {
            existing.nguDuHuyet = loai;
          }
        }
      }
    }
  }

  return concepts;
}

function extractAllConcepts(): HuyetConcept[] {
  const concepts: HuyetConcept[] = [];
  const files = fs
    .readdirSync(CONFIG.cardsDir)
    .filter((f) => f.endsWith(".md") && f.includes("huyet-kinh"));

  for (const file of files) {
    const filePath = path.join(CONFIG.cardsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const kinh = parseKinhFromFile(file);
    const extracted = extractHuyetFromMatch(content, kinh, file);
    concepts.push(...extracted);
  }

  // Deduplicate
  const seen = new Set<string>();
  return concepts.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

// ============================================================================
// Rule-Based Confusion Analysis
// ============================================================================

/**
 * Normalize Vietnamese name for comparison
 */
function normalizeVietnamese(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function stringSimilarity(a: string, b: string): number {
  const an = normalizeVietnamese(a);
  const bn = normalizeVietnamese(b);

  if (an === bn) return 1;

  const matrix: number[][] = [];
  for (let i = 0; i <= an.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bn.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= an.length; i++) {
    for (let j = 1; j <= bn.length; j++) {
      const cost = an[i - 1] === bn[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(an.length, bn.length);
  return maxLen === 0 ? 1 : 1 - matrix[an.length][bn.length] / maxLen;
}

/**
 * Check if names share common prefix (e.g., "Thiếu Phủ" vs "Thiếu Hải")
 */
function sharePrefix(a: string, b: string): boolean {
  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);

  if (wordsA.length >= 2 && wordsB.length >= 2) {
    return normalizeVietnamese(wordsA[0]) === normalizeVietnamese(wordsB[0]);
  }
  return false;
}

/**
 * Check if names share common suffix
 */
function shareSuffix(a: string, b: string): boolean {
  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);

  if (wordsA.length >= 2 && wordsB.length >= 2) {
    return (
      normalizeVietnamese(wordsA[wordsA.length - 1]) ===
      normalizeVietnamese(wordsB[wordsB.length - 1])
    );
  }
  return false;
}

/**
 * Rule-based confusion score calculation
 */
function calculateConfusionScore(a: HuyetConcept, b: HuyetConcept): ConfusionPair {
  const reasons: string[] = [];
  let score = 0;

  // Name similarity (highest weight)
  const nameSim = stringSimilarity(a.name, b.name);
  if (nameSim >= 0.7) {
    reasons.push("similar_name");
    score += nameSim * 0.4;
  } else if (sharePrefix(a.name, b.name)) {
    reasons.push("same_prefix");
    score += 0.35;
  } else if (shareSuffix(a.name, b.name)) {
    reasons.push("same_suffix");
    score += 0.25;
  }

  // Same kinh (high weight - same meridian)
  if (a.kinh === b.kinh && a.kinh !== "Unknown") {
    reasons.push("same_kinh");
    score += 0.25;
  }

  // Same ngũ hành (medium weight)
  if (a.nguHanh === b.nguHanh && a.nguHanh) {
    reasons.push("same_nguhanh");
    score += 0.15;
  }

  // Same ngũ du type (medium weight)
  if (a.nguDuHuyet === b.nguDuHuyet && a.nguDuHuyet) {
    reasons.push("same_ngudu");
    score += 0.15;
  }

  // Biểu lý pairs (related meridians get slight confusion boost)
  const bieuLyPairs: Record<string, string> = {
    Phế: "Đại Trường",
    "Đại Trường": "Phế",
    Tâm: "Tiểu Trường",
    "Tiểu Trường": "Tâm",
    "Tâm Bào": "Tam Tiêu",
    "Tam Tiêu": "Tâm Bào",
    Tỳ: "Vị",
    Vị: "Tỳ",
    Can: "Đởm",
    "Đởm": "Can",
    "Thận": "Bàng Quang",
    "Bàng Quang": "Thận"
  };

  if (bieuLyPairs[a.kinh] === b.kinh) {
    reasons.push("bieu_ly_pair");
    score += 0.1;
  }

  // Cap score at 1.0
  score = Math.min(1, score);

  return { score: parseFloat(score.toFixed(2)), reasons };
}

/**
 * Build confusion matrix using rule-based analysis
 */
function buildRuleBasedMatrix(
  concepts: HuyetConcept[]
): Record<string, ConfusionPair> {
  const matrix: Record<string, ConfusionPair> = {};

  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      const key = [concepts[i].id, concepts[j].id].sort().join(":");
      const pair = calculateConfusionScore(concepts[i], concepts[j]);

      // Only store pairs with some confusion potential
      if (pair.score > 0) {
        matrix[key] = pair;
      }
    }
  }

  return matrix;
}

// ============================================================================
// LLM Enhancement (Optional)
// ============================================================================

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  choices: Array<{ message: { content: string } }>;
}

async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(`${CONFIG.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFIG.apiKey}`
    },
    body: JSON.stringify({
      model: CONFIG.model,
      messages,
      temperature: 0.3,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as ChatResponse;
  return data.choices[0]?.message?.content || "";
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = CONFIG.maxRetries
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Retry ${i + 1}/${retries}: ${lastError.message}`);
      await new Promise((r) => setTimeout(r, CONFIG.retryDelay * (i + 1)));
    }
  }
  throw lastError;
}

async function enhanceWithLLM(
  concepts: HuyetConcept[],
  matrix: Record<string, ConfusionPair>
): Promise<Record<string, ConfusionPair>> {
  console.log("\nEnhancing with LLM analysis...");

  // Find pairs with medium scores that might benefit from LLM review
  const uncertainPairs = Object.entries(matrix)
    .filter(([_, pair]) => pair.score >= 0.3 && pair.score <= 0.6)
    .slice(0, 20); // Limit to top 20 uncertain pairs

  if (uncertainPairs.length === 0) {
    console.log("No uncertain pairs to analyze with LLM");
    return matrix;
  }

  console.log(`Analyzing ${uncertainPairs.length} uncertain pairs with LLM...`);

  const systemPrompt = `You are a TCM expert. Analyze huyệt pair confusion risk.
Output JSON only: {"score": 0.X, "reasons": ["factor1"]}
Factors: similar_name, same_kinh, same_nguhanh, same_ngudu, similar_function, similar_position`;

  for (let i = 0; i < uncertainPairs.length; i += CONFIG.batchSize) {
    const batch = uncertainPairs.slice(i, i + CONFIG.batchSize);
    console.log(`LLM batch ${Math.floor(i / CONFIG.batchSize) + 1}...`);

    for (const [key] of batch) {
      const [idA, idB] = key.split(":");
      const a = concepts.find((c) => c.id === idA);
      const b = concepts.find((c) => c.id === idB);

      if (!a || !b) continue;

      try {
        const response = await withRetry(() =>
          chatCompletion([
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `${a.name} (${a.kinh}, ${a.nguHanh}) vs ${b.name} (${b.kinh}, ${b.nguHanh})`
            }
          ])
        );

        const jsonMatch = response.match(/\{[^}]*"score"[^}]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (typeof parsed.score === "number") {
            matrix[key] = {
              score: Math.max(0, Math.min(1, parsed.score)),
              reasons: parsed.reasons || matrix[key].reasons
            };
          }
        }
      } catch (error) {
        console.warn(`Skipping LLM for ${key}: ${(error as Error).message}`);
      }

      await new Promise((r) => setTimeout(r, 1000)); // Rate limit
    }
  }

  return matrix;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("=== LECTOR Semantic Matrix Generator ===");
  console.log(`Mode: ${CONFIG.useLLM ? "Rule-based + LLM" : "Rule-based only"}\n`);

  // Step 1: Extract concepts
  console.log("Step 1: Extracting huyệt concepts from cards...");
  const concepts = extractAllConcepts();
  console.log(`Found ${concepts.length} unique huyệt concepts`);

  if (concepts.length === 0) {
    console.error("No concepts found! Check card files.");
    process.exit(1);
  }

  console.log("\nSample concepts:");
  concepts.slice(0, 5).forEach((c) => {
    console.log(`  - ${c.name} (${c.kinh}, ${c.nguHanh}, ${c.nguDuHuyet || "N/A"})`);
  });

  // Step 2: Build rule-based matrix
  console.log("\nStep 2: Building rule-based confusion matrix...");
  let matrix = buildRuleBasedMatrix(concepts);
  console.log(`Generated ${Object.keys(matrix).length} confusion pairs`);

  // Step 3: Optional LLM enhancement
  if (CONFIG.useLLM) {
    matrix = await enhanceWithLLM(concepts, matrix);
  }

  // Step 4: Build output
  const output: SemanticMatrix = {
    version: 1,
    generated: new Date().toISOString(),
    concepts,
    matrix
  };

  // Step 5: Save
  console.log("\nStep 3: Saving semantic-matrix.json...");
  fs.writeFileSync(CONFIG.outputPath, JSON.stringify(output, null, 2));
  console.log(`Saved to: ${CONFIG.outputPath}`);

  // Stats
  const scores = Object.values(matrix).map((p) => p.score);
  const highConfusion = scores.filter((s) => s >= 0.5).length;
  const avgScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  console.log("\n=== Statistics ===");
  console.log(`Total pairs with confusion: ${scores.length}`);
  console.log(`High confusion (>=0.5): ${highConfusion}`);
  console.log(`Average score: ${avgScore.toFixed(3)}`);

  // Top confusing pairs
  const sorted = Object.entries(matrix)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 15);

  console.log("\nTop 15 Most Confusing Pairs:");
  for (const [key, pair] of sorted) {
    const [id1, id2] = key.split(":");
    const c1 = concepts.find((c) => c.id === id1);
    const c2 = concepts.find((c) => c.id === id2);
    console.log(
      `  ${c1?.name || id1} ↔ ${c2?.name || id2}: ${pair.score.toFixed(2)} [${pair.reasons.join(", ")}]`
    );
  }

  const fileSize = fs.statSync(CONFIG.outputPath).size;
  console.log(`\nOutput size: ${(fileSize / 1024).toFixed(1)} KB`);
  console.log("\n✓ Done!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
