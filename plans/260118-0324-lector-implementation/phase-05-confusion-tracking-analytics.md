# Phase 5: Confusion Tracking & Analytics

## Context
- [LECTOR Engine](./phase-04-lector-scheduling-engine.md) - Core algorithm
- [Current Progress Manager](../../src/core/progress-manager.ts) - Data storage
- [Sidebar App](../../src/components/sidebar-app.tsx) - UI entry point

## Overview
- **Priority:** P1
- **Status:** Pending (blocked by Phase 4)
- **Effort:** 4h

Build UI for confusion tracking and weakness analytics dashboard.

## Key Insights

User requested features:
1. **Confusion Tracking**: Record which concept pairs user confuses
2. **Weakness Analytics**: Dashboard showing problem areas

Design principles:
- Non-intrusive - don't interrupt learning flow
- Actionable - show what to drill more
- Visual - charts/heatmaps for quick understanding

## Requirements

### Functional
- Display confusion history in readable format
- Show top confused concept pairs
- Weakness heatmap by kinh/category
- Drill mode for confused pairs
- Progress over time chart

### Non-functional
- Dashboard loads under 200ms
- Mobile-friendly layout
- Accessible (color-blind safe)

## UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│  CCLK Flashcards - Analytics                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Your Confusion Patterns                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Thiếu Phủ ↔ Thiếu Hải    ████████░░  80%          │   │
│  │  Thái Xung ↔ Thái Khê     ██████░░░░  60%          │   │
│  │  Linh Đạo ↔ Thông Lý      ████░░░░░░  40%          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🔥 Weakness by Kinh                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Tâm      ████████░░  Strong                        │   │
│  │  Phế      ██████░░░░  Moderate                      │   │
│  │  Thận     ████░░░░░░  Weak ⚠️                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [🎯 Drill Weak Points]  [📈 View Progress]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ANALYTICS SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│  ConfusionTracker         AnalyticsEngine       UI          │
│  ┌───────────────┐       ┌───────────────┐    ┌──────────┐ │
│  │ recordMiss()  │──────>│ aggregate()   │───>│ Charts   │ │
│  │ getHistory()  │       │ getWeakness() │    │ Heatmap  │ │
│  │               │       │ getProgress() │    │ DrillBtn │ │
│  └───────────────┘       └───────────────┘    └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files

### To Create
- `src/core/confusion-tracker.ts` - Tracking logic
- `src/core/analytics-engine.ts` - Data aggregation
- `src/components/analytics-view.tsx` - Dashboard UI
- `src/components/confusion-chart.tsx` - Bar chart
- `src/components/weakness-heatmap.tsx` - Heatmap
- `src/components/drill-mode.tsx` - Focused practice

### To Modify
- `src/components/sidebar-app.tsx` - Add analytics tab
- `src/views/sidebar-view.tsx` - Route handling

## Data Structures

### Analytics Data
```typescript
interface ConfusionEntry {
  conceptA: string;
  conceptB: string;
  count: number;
  lastOccurred: string;
  contexts: ("mcq" | "recall")[];
}

interface KinhWeakness {
  kinh: string;
  accuracy: number;  // 0-1
  totalCards: number;
  dueCards: number;
  confusionCount: number;
}

interface ProgressPoint {
  date: string;
  accuracy: number;
  cardsReviewed: number;
  confusionEvents: number;
}
```

## Implementation Steps

### Step 1: Confusion Tracker

```typescript
// src/core/confusion-tracker.ts
export class ConfusionTracker {
  private entries: Map<string, ConfusionEntry> = new Map();

  recordConfusion(conceptA: string, conceptB: string, context: "mcq" | "recall"): void {
    const key = [conceptA, conceptB].sort().join(":");
    const existing = this.entries.get(key) || {
      conceptA,
      conceptB,
      count: 0,
      lastOccurred: "",
      contexts: []
    };

    existing.count++;
    existing.lastOccurred = new Date().toISOString();
    existing.contexts.push(context);

    this.entries.set(key, existing);
  }

  getTopConfusions(limit = 10): ConfusionEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getConfusionsFor(conceptId: string): ConfusionEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.conceptA === conceptId || e.conceptB === conceptId);
  }
}
```

### Step 2: Analytics Engine

```typescript
// src/core/analytics-engine.ts
export class AnalyticsEngine {
  constructor(
    private progressManager: ProgressManager,
    private confusionTracker: ConfusionTracker,
    private semanticMatrix: SemanticMatrix
  ) {}

  async getKinhWeakness(): Promise<KinhWeakness[]> {
    const stats = await this.progressManager.getStatistics();
    const confusions = this.confusionTracker.getTopConfusions(100);

    // Group by kinh
    const kinhMap = new Map<string, KinhWeakness>();

    // Aggregate accuracy and confusion per kinh
    // ...

    return Array.from(kinhMap.values())
      .sort((a, b) => a.accuracy - b.accuracy);
  }

  async getProgressHistory(days = 30): Promise<ProgressPoint[]> {
    const data = await this.progressManager.load();
    const sessions = data.sessions.slice(-days);

    return sessions.map(s => ({
      date: s.date.split("T")[0],
      accuracy: s.accuracy,
      cardsReviewed: s.cardsReviewed,
      confusionEvents: 0 // TODO: track per session
    }));
  }

  getRecommendedDrill(): string[] {
    // Return concept IDs that need most practice
    const confusions = this.confusionTracker.getTopConfusions(5);
    const concepts = new Set<string>();

    confusions.forEach(c => {
      concepts.add(c.conceptA);
      concepts.add(c.conceptB);
    });

    return Array.from(concepts);
  }
}
```

### Step 3: Analytics Dashboard UI

```tsx
// src/components/analytics-view.tsx
export function AnalyticsView({
  analytics,
  onStartDrill
}: {
  analytics: AnalyticsEngine;
  onStartDrill: (conceptIds: string[]) => void;
}) {
  const [confusions, setConfusions] = useState<ConfusionEntry[]>([]);
  const [weakness, setWeakness] = useState<KinhWeakness[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setConfusions(analytics.confusionTracker.getTopConfusions());
    setWeakness(await analytics.getKinhWeakness());
  }

  return (
    <div className="cclk-analytics">
      <h2>📊 Your Confusion Patterns</h2>
      <ConfusionChart entries={confusions} />

      <h2>🔥 Weakness by Kinh</h2>
      <WeaknessHeatmap data={weakness} />

      <button
        className="cclk-drill-button"
        onClick={() => onStartDrill(analytics.getRecommendedDrill())}
      >
        🎯 Drill Weak Points
      </button>
    </div>
  );
}
```

### Step 4: Confusion Chart Component

```tsx
// src/components/confusion-chart.tsx
export function ConfusionChart({ entries }: { entries: ConfusionEntry[] }) {
  const maxCount = Math.max(...entries.map(e => e.count));

  return (
    <div className="cclk-confusion-chart">
      {entries.map(entry => (
        <div key={`${entry.conceptA}-${entry.conceptB}`} className="chart-row">
          <span className="label">
            {entry.conceptA} ↔ {entry.conceptB}
          </span>
          <div className="bar-container">
            <div
              className="bar"
              style={{ width: `${(entry.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="count">{entry.count}</span>
        </div>
      ))}
    </div>
  );
}
```

### Step 5: Drill Mode

```tsx
// src/components/drill-mode.tsx
export function DrillMode({
  conceptIds,
  scheduler,
  onComplete
}: {
  conceptIds: string[];
  scheduler: CardScheduler;
  onComplete: () => void;
}) {
  // Filter cards to only those in conceptIds
  // Focus session on weak points
  // Higher frequency of confused pairs

  return (
    <div className="cclk-drill-mode">
      <h2>🎯 Focused Drill: {conceptIds.length} concepts</h2>
      {/* Card display with emphasis on confused pairs */}
    </div>
  );
}
```

## CSS Additions

```css
/* styles.css additions */
.cclk-analytics {
  padding: 16px;
}

.cclk-confusion-chart .chart-row {
  display: flex;
  align-items: center;
  margin: 8px 0;
}

.cclk-confusion-chart .bar-container {
  flex: 1;
  background: var(--background-modifier-border);
  border-radius: 4px;
  height: 20px;
  margin: 0 8px;
}

.cclk-confusion-chart .bar {
  background: var(--interactive-accent);
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.cclk-drill-button {
  background: var(--interactive-accent);
  color: var(--text-on-accent);
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  margin-top: 16px;
}
```

## Todo List

- [ ] Implement `src/core/confusion-tracker.ts`
- [ ] Implement `src/core/analytics-engine.ts`
- [ ] Create `src/components/analytics-view.tsx`
- [ ] Create `src/components/confusion-chart.tsx`
- [ ] Create `src/components/weakness-heatmap.tsx`
- [ ] Create `src/components/drill-mode.tsx`
- [ ] Add analytics tab to sidebar
- [ ] Persist confusion data in progress.json
- [ ] Add CSS styles
- [ ] Test with real usage data

## Success Criteria

- Dashboard shows top 10 confusion pairs
- Weakness by kinh displays correctly
- Drill mode focuses on weak concepts
- Data persists across sessions

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Empty state UX | Low | Show helpful onboarding |
| Performance with large history | Medium | Limit to recent data |
| Chart accessibility | Low | Use patterns + colors |

## Security Considerations

- All data local, no analytics sent externally
- No PII exposed in UI

## Next Steps

After completion:
- User testing
- Tune algorithm parameters
- Consider export/import of progress
