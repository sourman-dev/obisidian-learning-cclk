# Phase 2: Generate Enhanced Cards

## Context
- [Phase 1: Semantic Matrix](./phase-01-precompute-semantic-matrix.md)
- [Current Card Format](../../cclk-cards/01-su-hinh-thanh-luc-khi.md)

## Overview
- **Priority:** P1
- **Status:** Pending (blocked by Phase 1)
- **Effort:** 3h

Transform existing Q&A cards into enhanced format with MCQ questions using smart distractors from semantic matrix.

## Key Insights

Current format problems:
- Only Q:: A:: (forward) and Q::: A::: (reverse)
- No MCQ, no challenge
- No semantic metadata in frontmatter

LECTOR enhancement:
- MCQ:: with distractors from high-confusion pairs
- Extended frontmatter with confusableWith, difficultyFactors
- Preserved backward compatibility with existing format

## Requirements

### Functional
- Parse existing cards, preserve original Q&A
- Generate MCQ for each concept using semantic matrix
- Add semantic metadata to frontmatter
- Support new card types: mcq, visual

### Non-functional
- Cards remain human-editable markdown
- Backward compatible (old parser still works)
- Valid YAML frontmatter

## New Card Format

```yaml
---
id: huyet-thieu-phu
concept: Thiếu Phủ
category: huyet-kinh-tam
kinh: Tâm
nguHanh: Hỏa
nguDuHuyet: Huỳnh
confusableWith:
  - id: huyet-thieu-hai
    score: 0.85
    reason: similar_name
  - id: huyet-linh-dao
    score: 0.4
    reason: same_kinh
image: assets/images/thieu-phu.png
tags: [kinh-tam, huynh-huyet, hoa]
---

# Thiếu Phủ

## Card 1 - Basic
Q::: Thiếu Phủ thuộc kinh nào?
A::: Kinh Tâm

## Card 2 - MCQ
MCQ:: Huyệt nào KHÔNG thuộc kinh Tâm?
- [ ] Thiếu Phủ
- [ ] Thần Môn
- [x] Thiếu Hải
- [ ] Linh Đạo
CORRECT:: Thiếu Hải
EXPLAIN:: Thiếu Hải thuộc kinh Thận, không phải kinh Tâm. Dễ nhầm vì tên gần giống Thiếu Phủ.

## Card 3 - Visual
IMG:: assets/images/thieu-phu.png
Q:: Đây là huyệt gì?
A:: Thiếu Phủ
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 CARD ENHANCEMENT PIPELINE                    │
├─────────────────────────────────────────────────────────────┤
│  1. Load semantic-matrix.json                               │
│  2. Parse each cclk-cards/*.md                              │
│  3. Extract concept from frontmatter                        │
│  4. Find top confusable pairs from matrix                   │
│  5. Generate MCQ with distractors                           │
│  6. Add semantic metadata to frontmatter                    │
│  7. Write enhanced-cards/*.md                               │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files

### To Create
- `scripts/generate-enhanced-cards.ts` - Enhancement script
- `enhanced-cards/*.md` - Output directory

### To Modify
- `src/core/card-parser.ts` - Add MCQ parsing
- `src/types/card-types.ts` - Add MCQ type

### To Read
- `semantic-matrix.json` (from Phase 1)
- `cclk-cards/*.md` (existing cards)

## Implementation Steps

### Step 1: Extend Card Parser

```typescript
// Add new patterns
const MCQ_PATTERN = /^MCQ::\s*(.+)$/m;
const MCQ_OPTION_PATTERN = /^-\s*\[(x| )\]\s*(.+)$/gm;
const CORRECT_PATTERN = /^CORRECT::\s*(.+)$/m;
const EXPLAIN_PATTERN = /^EXPLAIN::\s*(.+)$/m;
const IMG_PATTERN = /^IMG::\s*(.+)$/m;

// New card type
export type CardType = "forward" | "reverse" | "matching" | "mcq" | "visual";
```

### Step 2: Distractor Selection Algorithm

```typescript
function selectDistractors(
  conceptId: string,
  matrix: SemanticMatrix,
  count: number = 3
): string[] {
  // Get pairs sorted by confusion score
  const pairs = matrix.getPairsFor(conceptId)
    .sort((a, b) => b.score - a.score);

  // Take top N as distractors
  return pairs.slice(0, count).map(p => p.otherId);
}
```

### Step 3: MCQ Generation Prompt

```
Given huyệt: {concept}
Kinh: {kinh}
Confusable with: {confusablePairs}

Generate an MCQ question that tests understanding.
Question types:
1. "Huyệt nào KHÔNG thuộc kinh X?" (negative)
2. "Huyệt nào là Y huyệt của kinh X?" (classification)
3. "Huyệt nào có công dụng Z?" (function)

Include 3 distractors from confusable list.
Provide explanation for why answer is confusing.
```

### Step 4: Frontmatter Enhancement

```typescript
interface EnhancedFrontmatter extends CardFrontmatter {
  id: string;
  concept: string;
  category: string;
  kinh: string;
  nguHanh: string;
  nguDuHuyet: string;
  confusableWith: ConfusablePair[];
  image?: string;
}
```

## Todo List

- [ ] Design MCQ generation prompt
- [ ] Implement distractor selection from matrix
- [ ] Create card enhancement script
- [ ] Extend card-parser.ts for MCQ format
- [ ] Add MCQ type to card-types.ts
- [ ] Generate enhanced-cards/*.md
- [ ] Validate all cards parse correctly
- [ ] Test backward compatibility

## Success Criteria

- Each huyệt card has at least 1 MCQ
- Distractors come from semantic matrix
- Original Q&A preserved
- Parser handles both old and new format

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| MCQ too easy/hard | Medium | Tune distractor count |
| Breaking existing cards | High | Keep old format support |
| LLM generates wrong answers | High | Validate against source |

## Next Steps

After completion:
- Phase 3: Extract visual assets from PDF
- Phase 4: Implement LECTOR scheduler
