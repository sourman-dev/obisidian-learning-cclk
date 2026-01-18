/**
 * Gamification Stats Component
 *
 * Displays streak, achievements, and motivational elements.
 */

import { useState, useEffect } from "react";
import { ProgressManager } from "../core/progress-manager";

interface GamificationStatsProps {
  progressManager: ProgressManager;
}

interface Stats {
  totalCards: number;
  dueToday: number;
  reviewedToday: number;
  streak: number;
}

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  earned: boolean;
}

export function GamificationStats({ progressManager }: GamificationStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    async function loadStats() {
      const data = await progressManager.getStatistics();
      setStats(data);
    }
    loadStats();
  }, [progressManager]);

  if (!stats) {
    return null;
  }

  const achievements = getAchievements(stats);
  const earnedCount = achievements.filter(a => a.earned).length;

  return (
    <div className="cclk-gamification">
      {/* Streak Display */}
      <div className="cclk-streak-container">
        <div className="cclk-streak">
          <span className="cclk-streak-fire">{stats.streak > 0 ? "🔥" : "💤"}</span>
          <span className="cclk-streak-count">{stats.streak}</span>
          <span className="cclk-streak-label">day streak</span>
        </div>

        {/* Today's Progress */}
        <div className="cclk-today-stats">
          <div className="cclk-stat-item">
            <span className="cclk-stat-value">{stats.reviewedToday}</span>
            <span className="cclk-stat-label">reviewed</span>
          </div>
          <div className="cclk-stat-item">
            <span className="cclk-stat-value">{stats.dueToday}</span>
            <span className="cclk-stat-label">due</span>
          </div>
        </div>
      </div>

      {/* Achievements Toggle */}
      <button
        className="cclk-achievements-toggle"
        onClick={() => setShowAchievements(!showAchievements)}
      >
        🏆 {earnedCount}/{achievements.length} Achievements
      </button>

      {/* Achievements List */}
      {showAchievements && (
        <div className="cclk-achievements-list">
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`cclk-achievement ${achievement.earned ? "earned" : "locked"}`}
            >
              <span className="cclk-achievement-icon">
                {achievement.earned ? achievement.icon : "🔒"}
              </span>
              <div className="cclk-achievement-info">
                <div className="cclk-achievement-title">{achievement.title}</div>
                <div className="cclk-achievement-desc">{achievement.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Get achievement definitions and check if earned
 */
function getAchievements(stats: Stats): Achievement[] {
  return [
    {
      id: "first-step",
      icon: "👶",
      title: "First Step",
      description: "Review your first card",
      earned: stats.totalCards > 0
    },
    {
      id: "getting-started",
      icon: "🌱",
      title: "Getting Started",
      description: "Review 10 cards total",
      earned: stats.totalCards >= 10
    },
    {
      id: "committed",
      icon: "💪",
      title: "Committed",
      description: "Maintain a 3-day streak",
      earned: stats.streak >= 3
    },
    {
      id: "weekly-warrior",
      icon: "⚔️",
      title: "Weekly Warrior",
      description: "Maintain a 7-day streak",
      earned: stats.streak >= 7
    },
    {
      id: "daily-dozen",
      icon: "📚",
      title: "Daily Dozen",
      description: "Review 12 cards in one day",
      earned: stats.reviewedToday >= 12
    },
    {
      id: "century",
      icon: "💯",
      title: "Century",
      description: "Review 100 cards total",
      earned: stats.totalCards >= 100
    },
    {
      id: "half-way",
      icon: "🎯",
      title: "Half Way There",
      description: "Clear all due cards for today",
      earned: stats.dueToday === 0 && stats.reviewedToday > 0
    },
    {
      id: "master",
      icon: "🧠",
      title: "CCLK Master",
      description: "Maintain a 30-day streak",
      earned: stats.streak >= 30
    }
  ];
}
