# Brainstorm Report: LECTOR Implementation for CCLK Flashcards

**Date:** 2026-01-18
**Status:** Completed
**Source:** Paper 2508.03275.pdf - LECTOR: LLM-Enhanced Concept-based Test-Oriented Repetition

---

## Problem Statement

Current CCLK flashcards use basic SM-2 spaced repetition:
- Q&A format is "boring" - makes learner sleepy
- No semantic awareness - treats each card independently
- High confusion between similar huyệt names (Thiếu Phủ vs Thiếu Hải)
- No tracking of confusion patterns
- No smart distractors in questions

## LECTOR Core Concepts

From paper analysis, LECTOR improves traditional SR with:

1. **Semantic-Aware Scheduling**: LLM identifies concepts with high confusion risk
2. **Personalized Learning Profiles**: Multi-dimensional tracking (success rate, learning speed, retention, semantic sensitivity)
3. **Multi-Dimensional Optimization**: Considers difficulty, mastery, repetition history + semantic relationships

## Evaluated Approaches

| Approach | Pros | Cons |
|----------|------|------|
| Full LECTOR (LLM runtime) | Most adaptive | Requires API, latency, cost |
| Lite LECTOR (Rule-based) | Fast, offline | Limited semantic understanding |
| **Hybrid (Chosen)** | Best of both - LLM pre-compute, runtime offline | One-time LLM cost |

## Final Agreed Solution

### Architecture: Hybrid LECTOR

```
┌─────────────────────────────────────────────────────┐
│                 PRE-COMPUTE PHASE                    │
│  (Run once with LLM, output saved as JSON)          │
├─────────────────────────────────────────────────────┤
│  1. Semantic Similarity Matrix                       │
│     - Analyze all huyệt pairs for confusion risk     │
│     - Output: confusion-matrix.json                  │
│                                                      │
│  2. Confusion-based Questions                        │
│     - MCQ with smart distractors from matrix         │
│     - Output: enhanced-cards/*.md                    │
│                                                      │
│  3. Visual Cues                                      │
│     - Extract huyệt position images from cclk.pdf    │
│     - Output: assets/images/*.png                    │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                  RUNTIME FEATURES                    │
│  (Obsidian plugin, runs offline)                    │
├─────────────────────────────────────────────────────┤
│  1. LECTOR Scheduling Engine                         │
│     - Uses pre-computed confusion matrix             │
│     - Adaptive intervals based on semantic risk      │
│                                                      │
│  2. Confusion Tracking                               │
│     - Records which pairs user confuses              │
│     - Updates personal semantic sensitivity          │
│                                                      │
│  3. Weakness Analytics Dashboard                     │
│     - Visualize confusion patterns                   │
│     - Highlight concepts needing more drill          │
└─────────────────────────────────────────────────────┘
```

### New Content Format

```yaml
---
id: huyet-thieu-phu
concept: Thiếu Phủ
category: huyet-kinh-tam
kinhlac: Tâm
nguhanha: Hỏa
nguduhuyet: Huỳnh
semanticCluster: huyet-nguyen
confusableWith:
  - id: huyet-thieu-hai
    reason: Tên gần giống (Thiếu X)
    confusionRisk: 0.8
  - id: huyet-lanh-dao
    reason: Cùng kinh Tâm
    confusionRisk: 0.5
difficultyFactors:
  nameComplexity: 0.6
  positionRecall: 0.7
  functionRecall: 0.5
image: assets/images/thieu-phu.png
---

# Thiếu Phủ

## Basic Q&A
Q:: Thiếu Phủ thuộc kinh nào?
A:: Kinh Tâm

## Confusion-based MCQ
MCQ:: Huyệt nào KHÔNG thuộc kinh Tâm?
- [ ] Thiếu Phủ
- [ ] Thần Môn
- [x] Thiếu Hải ← distractor từ confusion matrix
- [ ] Linh Đạo

## Visual
IMG:: assets/images/thieu-phu.png
CAPTION:: Vị trí Thiếu Phủ trên bàn tay
```

## Implementation Phases

### Phase 1: Pre-compute Content (LLM)
- [ ] Extract semantic similarity matrix for all 60+ huyệt
- [ ] Generate confusion-based MCQ questions
- [ ] Extract images from cclk.pdf using ai-multimodal

### Phase 2: New Card Format
- [ ] Define YAML frontmatter schema
- [ ] Convert existing cards to new format
- [ ] Add semantic metadata

### Phase 3: LECTOR Engine
- [ ] Implement adaptive scheduling using confusion matrix
- [ ] Replace SM-2 with LECTOR algorithm
- [ ] Store learner profile (semantic sensitivity)

### Phase 4: Analytics Dashboard
- [ ] Confusion tracking UI
- [ ] Weakness heatmap
- [ ] Learning progress with semantic insights

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| LLM hallucination in similarity matrix | Human review, domain expert validation |
| Image extraction quality from PDF | Manual crop/cleanup for unclear images |
| Plugin complexity increase | Modular architecture, feature flags |
| Backward compatibility | Migration script for existing progress data |

## Success Criteria

1. **Engagement**: Users report cards are more challenging/interesting
2. **Confusion reduction**: Fewer errors on semantically similar pairs after 2 weeks
3. **Analytics utility**: Users actively use weakness dashboard

## Dependencies

- GEMINI_API_KEY for pre-compute phase
- cclk.pdf for image extraction
- Existing plugin codebase understanding

## Next Steps

1. Create detailed implementation plan with phase breakdowns
2. Start with Phase 1: Pre-compute semantic matrix
3. Design new card format schema

---

## Unresolved Questions

1. Should confusion matrix be editable by users (manual override)?
2. How to handle new cards added in future (re-run LLM or manual metadata)?
3. Sync confusion matrix updates across devices?
