# Brainstorm Report: Obsidian Spaced Repetition Plugin for CCLK

**Date:** 2026-01-16
**Status:** Completed

---

## Problem Statement

User needs plugin to learn "Châm cứu lục khí" (CCLK) content from PDF with spaced repetition. Key issues:
- Abstract medical concepts hard to remember
- Knowledge forgotten after few days
- Need shuffled, repeated practice across topics

## Requirements Summary

| Aspect | Decision |
|--------|----------|
| Card Format | Hybrid: Template từ PDF → User edit → Plugin quiz |
| Algorithm | SM-2 Classic (SuperMemo-2) |
| Study Modes | Both: Single topic drill + Mixed topics review |
| Card Types | Forward recall, Reverse recall, Matching pairs |
| Data Storage | Hybrid: Cards in .md, Progress in .json |
| Tech Stack | React + TypeScript |
| Topic Split | Both: Theo chương PDF + Theo chủ đề khái niệm |
| UI | Sidebar panel |

---

## Proposed Architecture

### 1. File Structure

```
obsidian-learning-cclk/
├── src/
│   ├── main.ts                    # Plugin entry
│   ├── settings.ts                # Plugin settings
│   ├── types/
│   │   ├── card-types.ts          # Card interfaces
│   │   ├── sm2-types.ts           # SM-2 algorithm types
│   │   └── study-session-types.ts
│   ├── core/
│   │   ├── sm2-algorithm.ts       # SM-2 implementation
│   │   ├── card-parser.ts         # Parse .md → cards
│   │   ├── card-scheduler.ts      # Due card selection
│   │   └── progress-manager.ts    # JSON read/write
│   ├── views/
│   │   ├── sidebar-view.tsx       # Main sidebar React view
│   │   ├── components/
│   │   │   ├── topic-selector.tsx
│   │   │   ├── flashcard-display.tsx
│   │   │   ├── matching-pairs.tsx
│   │   │   ├── progress-stats.tsx
│   │   │   └── rating-buttons.tsx
│   │   └── hooks/
│   │       ├── use-study-session.ts
│   │       └── use-cards.ts
│   └── utils/
│       └── file-utils.ts
├── styles.css
├── manifest.json
└── package.json
```

### 2. Data Format

**Card Markdown Format** (`vault/cclk-cards/topic-name.md`):

```markdown
---
topic: Lục khí cơ bản
chapter: 1
tags: [luc-khi, co-ban]
---

# Lục khí cơ bản

## Card 1
Q:: Thái dương Hàn thủy chủ trị gì?
A:: Bàng quang, Tiểu trường

## Card 2 (Reverse enabled)
Q::: Kinh Phế thuộc nhành nào?
A::: Thái âm Thấp thổ

## Matching Set
MATCH::
- Thái dương | Hàn thủy
- Thiếu dương | Tướng hỏa
- Dương minh | Táo kim
```

**Progress JSON Format** (`vault/.cclk-data/progress.json`):

```json
{
  "cards": {
    "topic-name::card-1": {
      "easeFactor": 2.5,
      "interval": 4,
      "repetitions": 3,
      "nextReview": "2026-01-20",
      "history": [
        {"date": "2026-01-16", "quality": 4}
      ]
    }
  },
  "sessions": [
    {"date": "2026-01-16", "cardsReviewed": 15, "accuracy": 0.87}
  ]
}
```

### 3. SM-2 Algorithm Implementation

```typescript
interface SM2Card {
  easeFactor: number;  // EF ≥ 1.3
  interval: number;    // Days
  repetitions: number; // Count
  nextReview: Date;
}

function calculateSM2(card: SM2Card, quality: 0|1|2|3|4|5): SM2Card {
  // quality: 0-2 = fail, 3 = hard, 4 = good, 5 = easy

  if (quality < 3) {
    // Reset on fail
    return { ...card, repetitions: 0, interval: 1 };
  }

  const newEF = Math.max(1.3,
    card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  let newInterval: number;
  if (card.repetitions === 0) newInterval = 1;
  else if (card.repetitions === 1) newInterval = 6;
  else newInterval = Math.round(card.interval * newEF);

  return {
    easeFactor: newEF,
    interval: newInterval,
    repetitions: card.repetitions + 1,
    nextReview: addDays(new Date(), newInterval)
  };
}
```

### 4. UI Components

**Sidebar Panel Structure:**

```
┌─────────────────────────┐
│ CCLK Flashcards        │
├─────────────────────────┤
│ Mode: [Single] [Mixed] │
├─────────────────────────┤
│ Topics:                 │
│ ☑ Lục khí cơ bản       │
│ ☑ Tam tiêu             │
│ ☐ Ngũ hành             │
├─────────────────────────┤
│ Due: 15 cards          │
│ [Start Session]         │
├─────────────────────────┤
│                         │
│   ┌───────────────┐     │
│   │   QUESTION    │     │
│   │               │     │
│   │  Thái dương   │     │
│   │  chủ trị gì?  │     │
│   └───────────────┘     │
│                         │
│   [Show Answer]         │
│                         │
├─────────────────────────┤
│ Progress: 5/15          │
│ ████████░░░░░░ 33%      │
└─────────────────────────┘
```

### 5. Study Session Flow

```
1. User selects topics + mode
2. Scheduler fetches due cards (nextReview ≤ today)
3. Cards shuffled based on mode:
   - Single: Only selected topic cards
   - Mixed: All selected topics, randomized
4. Display card (Forward/Reverse/Matching)
5. User responds
6. SM-2 calculates next interval
7. Progress saved to JSON
8. Next card until session complete
9. Show session stats
```

---

## Evaluated Approaches

### Approach A: Vanilla TypeScript (Simpler)
**Pros:** Lightweight, no build complexity, easier maintain
**Cons:** Manual DOM, harder complex UI, not scalable

### Approach B: React + TypeScript (Chosen)
**Pros:** Component-based, Obsidian docs recommend, complex UI manageable, state management clean
**Cons:** Larger bundle, build step required

### Approach C: Svelte
**Pros:** Very small bundle, reactive
**Cons:** Less community support for Obsidian, unfamiliar

**Decision:** Approach B (React) - matches Obsidian official recommendation, suitable for complex flashcard UI with multiple card types.

---

## Implementation Considerations

### Risks

| Risk | Mitigation |
|------|------------|
| PDF parsing complexity | Pre-process PDF → .md manually or with script |
| SM-2 edge cases | Use proven library or well-tested implementation |
| Large card sets slow | Lazy loading, pagination |
| Obsidian API changes | Pin Obsidian API version, test updates |

### Content Strategy

1. **Phase 1:** Manually create .md card files from cclk.pdf content
2. **Phase 2:** Plugin reads .md cards → quiz
3. **Phase 3:** Add card editor UI trong plugin

### Security

- No external API calls (offline-first)
- All data local in vault
- No sensitive data exposure

---

## Success Metrics

- [ ] Parse .md card format correctly
- [ ] SM-2 algorithm passes unit tests
- [ ] 3 card types working (Forward, Reverse, Matching)
- [ ] Progress persists across sessions
- [ ] Sidebar UI responsive
- [ ] Mixed mode shuffles topics correctly

---

## Next Steps

1. Setup Obsidian plugin boilerplate with React
2. Implement SM-2 algorithm + tests
3. Create card parser for .md format
4. Build sidebar view with React components
5. Integrate progress manager
6. Create sample CCLK card content
7. Testing + iteration

---

## Unresolved Questions

1. Có cần export/import progress giữa các devices không?
2. Có cần sync với Obsidian Sync không?
3. Matching pairs: Giới hạn bao nhiêu pairs mỗi set?
