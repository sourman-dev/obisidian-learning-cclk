/**
 * Topic Selector Component
 */

import { useState } from "react";
import { TopicInfo } from "../types/card-types";
import { StudyMode } from "../types/study-session-types";

interface TopicSelectorProps {
  topics: TopicInfo[];
  onStart: (topics: string[], mode: StudyMode) => void;
}

export function TopicSelector({ topics, onStart }: TopicSelectorProps) {
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<StudyMode>("single");

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedTopics(new Set(topics.map((t) => t.name)));
  };

  const deselectAll = () => {
    setSelectedTopics(new Set());
  };

  const totalDue = topics
    .filter((t) => selectedTopics.has(t.name))
    .reduce((sum, t) => sum + t.dueCount, 0);

  const handleStart = () => {
    if (selectedTopics.size === 0) return;
    onStart(Array.from(selectedTopics), mode);
  };

  return (
    <div className="cclk-topic-selector">
      {/* Mode selector */}
      <div className="cclk-mode-selector">
        <span>Mode:</span>
        <button
          className={mode === "single" ? "active" : ""}
          onClick={() => setMode("single")}
        >
          Single
        </button>
        <button
          className={mode === "mixed" ? "active" : ""}
          onClick={() => setMode("mixed")}
        >
          Mixed
        </button>
      </div>

      {/* Topic list */}
      <div className="cclk-topic-list">
        <div className="cclk-topic-header">
          <span>Topics:</span>
          <div className="cclk-topic-actions">
            <button onClick={selectAll}>All</button>
            <button onClick={deselectAll}>None</button>
          </div>
        </div>

        {topics.map((topic) => (
          <label key={topic.name} className="cclk-topic-item">
            <input
              type="checkbox"
              checked={selectedTopics.has(topic.name)}
              onChange={() => toggleTopic(topic.name)}
            />
            <span className="cclk-topic-name">{topic.name}</span>
            <span className="cclk-topic-count">
              ({topic.dueCount}/{topic.cardCount})
            </span>
          </label>
        ))}

        {topics.length === 0 && (
          <p className="cclk-empty">No card files found</p>
        )}
      </div>

      {/* Start button */}
      <div className="cclk-start-section">
        <p className="cclk-due-count">Due: {totalDue} cards</p>
        <button
          className="mod-cta cclk-start-button"
          onClick={handleStart}
          disabled={selectedTopics.size === 0 || totalDue === 0}
        >
          Start Session
        </button>
      </div>
    </div>
  );
}
