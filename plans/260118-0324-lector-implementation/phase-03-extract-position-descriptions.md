# Phase 3: Extract Position Descriptions

## Context
- [cclk.pdf](../../cclk.pdf) - Source PDF with huyệt position descriptions
- [ai-multimodal skill](~/.claude/skills/ai-multimodal/) - PDF text extraction
- [semantic-matrix.json](../../src/data/semantic-matrix.json) - Target to enhance

## Overview
- **Priority:** P2
- **Status:** Pending
- **Effort:** 1.5h

Extract relative position descriptions from cclk.pdf to add to semantic matrix. Text descriptions help memorize huyệt locations for finding on real body models.

## Key Insights

- Images không hiệu quả cho học huyệt vị - cần thực hành trên người thật
- Mô tả vị trí tương đối (landmarks, nearby points) giúp ghi nhớ và định vị
- Text-based approach tiết kiệm tài nguyên hơn image extraction
- MCQ về vị trí: "Huyệt nào nằm ở góc móng ngón cái?"

## Requirements

### Functional
- Extract position descriptions from cclk.pdf for each huyệt
- Add `position` field to semantic-matrix.json concepts
- Include: landmark, relative description, nearby huyệt

### Non-functional
- Vietnamese descriptions for consistency
- Keep descriptions under 100 chars for card display
- Structured format for MCQ generation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│            POSITION EXTRACTION PIPELINE                      │
├─────────────────────────────────────────────────────────────┤
│  1. Extract text from cclk.pdf using ai-multimodal          │
│  2. Parse position info for each huyệt                      │
│  3. Structure into position schema                          │
│  4. Merge into semantic-matrix.json                         │
│  5. Generate position-based MCQ questions                   │
└─────────────────────────────────────────────────────────────┘
```

## Position Schema

```typescript
interface HuyetPosition {
  landmark: string;     // "góc móng ngón cái", "mu bàn tay"
  relative: string;     // mô tả chi tiết vị trí
  depth?: string;       // độ sâu châm (optional)
  nearby?: string[];    // huyệt lân cận (for confusion tracking)
}
```

## Enhanced Concept Example

```json
{
  "id": "thieu-thuong",
  "name": "Thiếu Thương",
  "kinh": "Phế",
  "nguHanh": "Tĩnh",
  "position": {
    "landmark": "ngón tay cái",
    "relative": "Góc móng ngoài ngón cái, cách móng 0.1 thốn",
    "nearby": ["Ngư Tế", "Thái Uyên"]
  },
  "sourceFile": "08a-huyet-kinh-phe.md"
}
```

## Related Code Files

### To Modify
- `src/data/semantic-matrix.json` - Add position field
- `src/types/lector-types.ts` - Add HuyetPosition interface

### To Create
- `scripts/extract-positions.ts` - Extraction script

## Implementation Steps

### Step 1: Extract PDF Text
```bash
python ~/.claude/skills/ai-multimodal/scripts/gemini_batch_process.py \
  --files cclk.pdf \
  --task analyze \
  --prompt "For each huyệt mentioned, extract: name, position landmark, relative description, nearby huyệt. Return as JSON array."
```

### Step 2: Parse and Structure
```typescript
// scripts/extract-positions.ts
interface ExtractedPosition {
  name: string;
  position: HuyetPosition;
}

// Match extracted names to existing concepts in matrix
```

### Step 3: Merge into Semantic Matrix
```typescript
// Add position field to each concept
concepts.forEach(c => {
  const pos = extractedPositions.find(p => p.name === c.name);
  if (pos) c.position = pos.position;
});
```

### Step 4: Update Types
```typescript
// src/types/lector-types.ts
export interface HuyetPosition {
  landmark: string;
  relative: string;
  depth?: string;
  nearby?: string[];
}
```

## Todo List

- [ ] Extract position text from cclk.pdf
- [ ] Parse into structured format
- [ ] Add HuyetPosition interface to types
- [ ] Merge positions into semantic-matrix.json
- [ ] Verify all huyệt have position data
- [ ] Test position-based MCQ generation

## Success Criteria

- At least 80% of huyệt have position descriptions
- Descriptions are clear and memorable
- MCQ can ask "Huyệt nào nằm ở [landmark]?"
- No breaking changes to existing card format

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| PDF text extraction unclear | Medium | Manual review/correction |
| Missing position info | Low | Mark as optional field |
| Inconsistent naming | Medium | Fuzzy match with existing names |

## Security Considerations

- PDF is local, no external access needed
- No sensitive data in position descriptions

## Next Steps

After completion:
- Generate position-based MCQ questions
- Move to Phase 4: LECTOR Engine
