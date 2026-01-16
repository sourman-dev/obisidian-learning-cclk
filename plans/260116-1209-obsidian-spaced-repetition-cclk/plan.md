---
title: "Obsidian Spaced Repetition Plugin for CCLK"
status: pending
created: 2026-01-16
priority: high
---

# Plan Overview: Obsidian Spaced Repetition Plugin

## Problem Statement
User needs to learn "Châm cứu lục khí" (CCLK) content from PDF with spaced repetition. Key issues:
- Abstract medical concepts hard to remember
- Knowledge forgotten after few days
- Need shuffled, repeated practice across topics

## Context
- **Brainstorm Report:** `reports/brainstorm-260116-1209-obsidian-spaced-repetition-plugin.md`
- **Research Report:** `research/researcher-260116-1309-obsidian-react-plugin.md`
- **Content Source:** `cclk.pdf` (ONLY source - no internet)

## Technical Decisions

| Aspect | Decision |
|--------|----------|
| Tech Stack | React 18 + TypeScript |
| Build Tool | esbuild |
| UI | Sidebar panel (ItemView) |
| Algorithm | SM-2 Classic |
| Card Storage | Markdown files |
| Progress Storage | JSON file |
| Card Types | Forward, Reverse, Matching |
| Study Modes | Single topic + Mixed review |

## Phases

| # | Phase | Status | Est. Files |
|---|-------|--------|------------|
| 1 | [Project Setup](phase-01-project-setup.md) | pending | 8 |
| 2 | [SM-2 Algorithm](phase-02-sm2-algorithm.md) | pending | 4 |
| 3 | [Card Parser + Data Layer](phase-03-card-parser-data-layer.md) | pending | 6 |
| 4 | [React UI Components](phase-04-react-ui-components.md) | pending | 10 |
| 5 | [CCLK Content Extraction](phase-05-cclk-content-extraction.md) | pending | 5 |
| 6 | [Testing + Polish](phase-06-testing-polish.md) | pending | 4 |

## File Structure

```
obsidian-learning-cclk/
├── src/
│   ├── main.tsx
│   ├── settings.ts
│   ├── types/
│   │   ├── card-types.ts
│   │   ├── sm2-types.ts
│   │   └── study-session-types.ts
│   ├── core/
│   │   ├── sm2-algorithm.ts
│   │   ├── card-parser.ts
│   │   ├── card-scheduler.ts
│   │   └── progress-manager.ts
│   ├── views/
│   │   ├── sidebar-view.tsx
│   │   └── components/
│   │       ├── topic-selector.tsx
│   │       ├── flashcard-display.tsx
│   │       ├── matching-pairs-display.tsx
│   │       ├── progress-stats.tsx
│   │       └── rating-buttons.tsx
│   ├── context/
│   │   └── app-context.tsx
│   └── utils/
│       └── file-utils.ts
├── styles.css
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
└── cclk-cards/              # Content cards (in vault)
    ├── 01-luc-khi-co-ban.md
    ├── 02-tam-tieu.md
    └── ...
```

## Success Criteria

- [ ] Plugin loads in Obsidian without errors
- [ ] Sidebar panel opens with topic selector
- [ ] Cards parsed from .md files correctly
- [ ] SM-2 algorithm schedules reviews accurately
- [ ] 3 card types render (Forward, Reverse, Matching)
- [ ] Progress persists across sessions
- [ ] Mixed mode shuffles topics correctly
- [ ] CCLK content extracted and cards created

## Dependencies

- Node.js 18+
- Obsidian 1.4+
- React 18.2+
- esbuild 0.25+

## Risks

| Risk | Mitigation |
|------|------------|
| Complex PDF structure | Manual card creation, script assistance |
| SM-2 edge cases | Unit tests, proven implementation |
| Large card sets | Lazy loading, virtual scrolling |
| Obsidian API changes | Pin API version, test updates |
