---
title: "LECTOR Implementation for CCLK Flashcards"
description: "Implement LLM-Enhanced Concept-based Test-Oriented Repetition (LECTOR) algorithm with semantic awareness, confusion tracking, and weakness analytics"
status: pending
priority: P1
effort: 16h
branch: feat/lector-implementation
tags: [lector, spaced-repetition, semantic-learning, obsidian-plugin]
created: 2026-01-18
---

# LECTOR Implementation Plan

## Overview

Transform boring Q&A flashcards into engaging, semantically-aware learning system using LECTOR algorithm from paper 2508.03275.pdf.

**Core improvements:**
- Semantic similarity matrix for confusion-aware scheduling
- MCQ questions with smart distractors
- Visual cues from cclk.pdf
- Confusion tracking per user
- Weakness analytics dashboard

## Architecture

```
PRE-COMPUTE (LLM, one-time)          RUNTIME (Plugin, offline)
┌──────────────────────────┐         ┌──────────────────────────┐
│ semantic-matrix.json     │────────>│ LECTOR Scheduler         │
│ enhanced-cards/*.md      │         │ Confusion Tracker        │
│ assets/images/*.png      │         │ Analytics Dashboard      │
└──────────────────────────┘         └──────────────────────────┘
```

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Pre-compute Semantic Matrix | Done | 3h | [phase-01](./phase-01-precompute-semantic-matrix.md) |
| 2 | Generate Enhanced Cards | Pending | 3h | [phase-02](./phase-02-generate-enhanced-cards.md) |
| 3 | Extract Position Descriptions | Pending | 1.5h | [phase-03](./phase-03-extract-position-descriptions.md) |
| 4 | LECTOR Scheduling Engine | Pending | 4h | [phase-04](./phase-04-lector-scheduling-engine.md) |
| 5 | Confusion Tracking & Analytics | Pending | 4h | [phase-05](./phase-05-confusion-tracking-analytics.md) |

## Dependencies

- GEMINI_API_KEY for pre-compute phases (1-3)
- cclk.pdf for image extraction
- Current plugin codebase: `src/core/sm2-algorithm.ts`, `src/core/card-parser.ts`

## Key Files to Modify

```
src/
├── core/
│   ├── sm2-algorithm.ts      → Replace with lector-algorithm.ts
│   ├── card-parser.ts        → Extend for new format
│   ├── confusion-tracker.ts  → NEW
│   └── semantic-matrix.ts    → NEW
├── types/
│   ├── card-types.ts         → Extend with semantic metadata
│   └── lector-types.ts       → NEW
├── components/
│   ├── mcq-display.tsx       → NEW
│   └── analytics-view.tsx    → NEW
└── data/
    └── semantic-matrix.json  → Pre-computed, bundled
```

## Success Criteria

1. Cards feel more challenging with smart MCQ distractors
2. System tracks which huyệt pairs user confuses
3. Dashboard shows weakness patterns
4. Backward compatible with existing progress data

## Risks

| Risk | Mitigation |
|------|------------|
| LLM hallucination in similarity matrix | Human review before deployment |
| Plugin size increase | Lazy load semantic matrix |
| Breaking changes | Feature flags, migration script |
