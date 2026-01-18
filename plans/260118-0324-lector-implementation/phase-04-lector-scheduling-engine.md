# Phase 4: LECTOR Scheduling Engine

## Context
- [SM-2 Algorithm](../../src/core/sm2-algorithm.ts) - Current implementation
- [LECTOR Paper](../../2508.03275.pdf) - Algorithm reference
- [Semantic Matrix](./phase-01-precompute-semantic-matrix.md) - Pre-computed data

## Overview
- **Priority:** P0
- **Status:** Pending (blocked by Phase 1)
- **Effort:** 4h

Replace SM-2 with LECTOR algorithm that uses semantic interference for smarter scheduling.

## Key Insights

### SM-2 Limitations
- Treats cards independently
- Only considers ease factor and interval
- No awareness of confusable concepts

### LECTOR Improvements
From paper analysis:
1. **Semantic Interference Factor**: Reduces interval for high-confusion pairs
2. **Personalized Profile**: Tracks learning speed, retention, semantic sensitivity
3. **Effective Half-life**: Modified forgetting curve considering semantics

### Core Formula

```
Interval = BaseInterval × MasteryFactor × (1 - SemanticInterference) × PersonalFactor

Where:
- BaseInterval: From SM-2 calculation
- MasteryFactor: Based on repetition history
- SemanticInterference: From confusion matrix (0-1)
- PersonalFactor: User's semantic sensitivity profile
```

## Requirements

### Functional
- Load semantic matrix at runtime
- Calculate semantic interference for due cards
- Adjust intervals based on confusion history
- Track user's confusion patterns
- Update personal learning profile

### Non-functional
- No perceptible latency vs SM-2
- Memory efficient (lazy load matrix)
- Backward compatible with existing progress.json

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LECTOR ENGINE                             │
├─────────────────────────────────────────────────────────────┤
│  SemanticMatrix         LearnerProfile         Scheduler    │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────┐ │
│  │ confusion     │     │ success_rate  │     │ getDue()  │ │
│  │ pairs         │────>│ semantic_sens │────>│ schedule()│ │
│  │ getScore()    │     │ learning_speed│     │ process() │ │
│  └───────────────┘     └───────────────┘     └───────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files

### To Create
- `src/core/lector-algorithm.ts` - Core LECTOR implementation
- `src/core/semantic-matrix.ts` - Matrix loader and query
- `src/core/learner-profile.ts` - User profile management
- `src/types/lector-types.ts` - Type definitions

### To Modify
- `src/core/card-scheduler.ts` - Use LECTOR instead of SM-2
- `src/core/progress-manager.ts` - Store learner profile
- `src/types/sm2-types.ts` - Extend for LECTOR state

## Data Structures

### LearnerProfile
```typescript
interface LearnerProfile {
  successRate: number;       // 0-1, rolling average
  learningSpeed: number;     // Multiplier, default 1.0
  retention: number;         // 0-1, how well they retain
  semanticSensitivity: number; // 0-1, how affected by confusion
  confusionHistory: ConfusionRecord[];
}

interface ConfusionRecord {
  conceptA: string;
  conceptB: string;
  confusedAt: string;
  context: "mcq" | "recall";
}
```

### LECTORCardState
```typescript
interface LECTORCardState extends SM2CardState {
  semanticInterference: number;  // Current interference level
  confusedWith: string[];        // IDs of recently confused concepts
  masteryLevel: number;          // 0-5 mastery score
}
```

## Implementation Steps

### Step 1: Semantic Matrix Loader

```typescript
// src/core/semantic-matrix.ts
export class SemanticMatrix {
  private matrix: Map<string, ConfusionPair[]>;

  async load(path: string): Promise<void> {
    // Lazy load from bundled JSON
  }

  getInterference(conceptA: string, conceptB: string): number {
    const key = [conceptA, conceptB].sort().join(":");
    return this.matrix.get(key)?.score ?? 0;
  }

  getConfusablePairs(conceptId: string, threshold = 0.5): ConfusionPair[] {
    // Return pairs above threshold
  }
}
```

### Step 2: Learner Profile Manager

```typescript
// src/core/learner-profile.ts
export class LearnerProfileManager {
  private profile: LearnerProfile;

  recordAnswer(cardId: string, correct: boolean, selectedAnswer?: string): void {
    // Update success rate with exponential moving average
    this.profile.successRate = 0.9 * this.profile.successRate + 0.1 * (correct ? 1 : 0);

    // Track confusion if wrong MCQ
    if (!correct && selectedAnswer) {
      this.recordConfusion(cardId, selectedAnswer);
    }
  }

  recordConfusion(conceptA: string, conceptB: string): void {
    this.profile.confusionHistory.push({
      conceptA,
      conceptB,
      confusedAt: new Date().toISOString(),
      context: "mcq"
    });

    // Increase semantic sensitivity
    this.profile.semanticSensitivity = Math.min(1,
      this.profile.semanticSensitivity + 0.05
    );
  }

  getSemanticSensitivity(): number {
    return this.profile.semanticSensitivity;
  }
}
```

### Step 3: LECTOR Algorithm Core

```typescript
// src/core/lector-algorithm.ts
export function calculateLECTORInterval(
  baseInterval: number,
  masteryLevel: number,
  semanticInterference: number,
  learnerProfile: LearnerProfile
): number {
  // Mastery scaling (higher mastery = longer intervals)
  const masteryFactor = 1 + (masteryLevel * 0.2);

  // Semantic interference reduces interval
  const semanticFactor = 1 - (semanticInterference * learnerProfile.semanticSensitivity);

  // Personal learning speed adjustment
  const personalFactor = learnerProfile.learningSpeed;

  return Math.max(1, Math.round(
    baseInterval * masteryFactor * semanticFactor * personalFactor
  ));
}

export function processLECTORReview(
  state: LECTORCardState,
  quality: QualityRating,
  semanticMatrix: SemanticMatrix,
  learnerProfile: LearnerProfile
): LECTORCardState {
  // Calculate base interval using SM-2 logic
  const baseInterval = calculateInterval(state, quality);

  // Get max semantic interference from confusable pairs
  const confusablePairs = semanticMatrix.getConfusablePairs(state.conceptId);
  const maxInterference = Math.max(
    ...confusablePairs.map(p => p.score),
    0
  );

  // Apply LECTOR adjustments
  const lectorInterval = calculateLECTORInterval(
    baseInterval,
    state.masteryLevel,
    maxInterference,
    learnerProfile
  );

  // Update mastery based on quality
  const newMastery = updateMastery(state.masteryLevel, quality);

  return {
    ...processReview(state, quality), // Base SM-2 state
    interval: lectorInterval,
    semanticInterference: maxInterference,
    masteryLevel: newMastery
  };
}
```

### Step 4: Priority Scheduling

```typescript
// Cards with high semantic interference get higher priority
export function getPriorityScore(card: CardWithState, matrix: SemanticMatrix): number {
  const basePriority = isDue(card.state) ? 100 : 0;
  const confusionBoost = card.state.semanticInterference * 20;
  const overdueBoost = getOverdueDays(card.state) * 5;

  return basePriority + confusionBoost + overdueBoost;
}
```

### Step 5: Integration with Scheduler

```typescript
// src/core/card-scheduler.ts
export class CardScheduler {
  private semanticMatrix: SemanticMatrix;
  private learnerProfile: LearnerProfileManager;

  async getNextCards(count: number): Promise<CardWithState[]> {
    const dueCards = await this.getDueCards();

    // Sort by LECTOR priority
    const prioritized = dueCards
      .map(card => ({
        card,
        priority: getPriorityScore(card, this.semanticMatrix)
      }))
      .sort((a, b) => b.priority - a.priority);

    return prioritized.slice(0, count).map(p => p.card);
  }
}
```

## Todo List

- [ ] Create `src/types/lector-types.ts` with interfaces
- [ ] Implement `src/core/semantic-matrix.ts` loader
- [ ] Implement `src/core/learner-profile.ts` manager
- [ ] Implement `src/core/lector-algorithm.ts` core
- [ ] Modify `src/core/card-scheduler.ts` for LECTOR
- [ ] Extend `src/core/progress-manager.ts` for profile
- [ ] Add feature flag for LECTOR vs SM-2
- [ ] Write unit tests for algorithm
- [ ] Test with real card set

## Success Criteria

- Cards with high confusion get reviewed more often
- User profile updates with each answer
- Interval calculations match LECTOR paper formula
- No performance regression

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Algorithm too aggressive | Medium | Tune semantic sensitivity |
| Memory usage from matrix | Low | Lazy loading |
| Backward compatibility | High | Feature flag, migration |

## Security Considerations

- Profile data stored locally only
- No PII in confusion tracking

## Next Steps

After completion:
- Phase 5: Analytics Dashboard
- User testing and tuning
