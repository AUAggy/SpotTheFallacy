import { useState, useEffect, useCallback } from "react";
import { 
  UserProgress, 
  FallacyStats, 
  SessionRecord, 
  Difficulty,
  LearningMode,
  UserPreferences,
  MasteryLevel,
  getMasteryInfo
} from "@/data/types";
import { enhancedFallacies } from "@/data/enhancedData";

const STORAGE_KEY = "fallacy_trainer_progress";

const defaultStats: FallacyStats = {
  totalSeen: 0,
  correctFirstTry: 0,
  correctAfterRetry: 0,
  incorrect: 0,
  lastSeen: null,
  attempts: [],
};

const defaultPreferences: UserPreferences = {
  theme: "system",
  showOnboarding: true,
};

const defaultProgress: UserProgress = {
  currentDifficulty: 1,
  fallacyStats: {},
  sessionHistory: [],
  streak: {
    current: 0,
    longest: 0,
    lastActiveDate: null,
  },
  preferences: defaultPreferences,
  lastUpdated: Date.now(),
  totalQuestionsAnswered: 0,
  sessionsCompleted: 0,
  consecutiveCorrect: 0,
  recentResults: [],
  seenQuestionIds: [],
  feynmanStreak: 0,
  isFirstTime: true,
};

function loadProgress(): UserProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Update streak based on last active date
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (parsed.streak.lastActiveDate !== today && parsed.streak.lastActiveDate !== yesterday) {
        // Streak broken
        parsed.streak.current = 0;
      }
      
      return { ...defaultProgress, ...parsed };
    }
  } catch (e) {
    console.error("Error loading progress:", e);
  }
  return defaultProgress;
}

function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error("Error saving progress:", e);
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const updateStreak = useCallback(() => {
    const today = new Date().toDateString();
    
    setProgress(prev => {
      if (prev.streak.lastActiveDate === today) {
        return prev; // Already updated today
      }
      
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newCurrent = prev.streak.lastActiveDate === yesterday 
        ? prev.streak.current + 1 
        : 1;
      
      return {
        ...prev,
        streak: {
          current: newCurrent,
          longest: Math.max(newCurrent, prev.streak.longest),
          lastActiveDate: today,
        },
        lastUpdated: Date.now(),
      };
    });
  }, []);

  const recordAnswer = useCallback((
    fallacyName: string,
    questionId: string,
    isCorrect: boolean,
    attempts: number
  ) => {
    setProgress(prev => {
      const currentStats = prev.fallacyStats[fallacyName] || { ...defaultStats };
      const newStats: FallacyStats = {
        ...currentStats,
        totalSeen: currentStats.totalSeen + 1,
        correctFirstTry: currentStats.correctFirstTry + (isCorrect && attempts === 1 ? 1 : 0),
        correctAfterRetry: currentStats.correctAfterRetry + (isCorrect && attempts > 1 ? 1 : 0),
        incorrect: currentStats.incorrect + (!isCorrect ? 1 : 0),
        lastSeen: Date.now(),
        attempts: [...currentStats.attempts, attempts].slice(-20), // Keep last 20
      };

      const newRecentResults = [...prev.recentResults, isCorrect && attempts === 1].slice(-10);
      const newConsecutiveCorrect = isCorrect && attempts === 1 
        ? prev.consecutiveCorrect + 1 
        : 0;
      
      // Adaptive difficulty
      let newDifficulty = prev.currentDifficulty;
      const recentCorrect = newRecentResults.filter(Boolean).length;
      
      if (recentCorrect >= 8 && prev.currentDifficulty < 3) {
        newDifficulty = (prev.currentDifficulty + 1) as Difficulty;
      } else if (recentCorrect <= 3 && prev.currentDifficulty > 1) {
        newDifficulty = (prev.currentDifficulty - 1) as Difficulty;
      }

      return {
        ...prev,
        fallacyStats: {
          ...prev.fallacyStats,
          [fallacyName]: newStats,
        },
        totalQuestionsAnswered: prev.totalQuestionsAnswered + 1,
        consecutiveCorrect: newConsecutiveCorrect,
        recentResults: newRecentResults,
        seenQuestionIds: [...new Set([...prev.seenQuestionIds, questionId])],
        feynmanStreak: newConsecutiveCorrect,
        currentDifficulty: newDifficulty,
        lastUpdated: Date.now(),
        isFirstTime: false,
      };
    });
  }, []);

  const recordSession = useCallback((session: Omit<SessionRecord, "date">) => {
    setProgress(prev => ({
      ...prev,
      sessionHistory: [
        ...prev.sessionHistory,
        { ...session, date: Date.now() },
      ].slice(-50), // Keep last 50 sessions
      sessionsCompleted: prev.sessionsCompleted + 1,
      lastUpdated: Date.now(),
    }));
  }, []);

  const markQuestionSeen = useCallback((questionId: string) => {
    setProgress(prev => ({
      ...prev,
      seenQuestionIds: [...new Set([...prev.seenQuestionIds, questionId])],
    }));
  }, []);

  const resetFeynmanStreak = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      feynmanStreak: 0,
    }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        showOnboarding: false,
      },
      isFirstTime: false,
    }));
  }, []);

  const setTheme = useCallback((theme: "light" | "dark" | "system") => {
    setProgress(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        theme,
      },
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(defaultProgress);
  }, []);

  const exportProgress = useCallback(() => {
    return JSON.stringify(progress, null, 2);
  }, [progress]);

  const importProgress = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data);
      setProgress({ ...defaultProgress, ...parsed });
      return true;
    } catch {
      return false;
    }
  }, []);

  // Computed values
  const getWeakFallacies = useCallback(() => {
    return enhancedFallacies
      .map(f => ({
        fallacy: f,
        stats: progress.fallacyStats[f.name],
        mastery: getMasteryInfo(progress.fallacyStats[f.name]),
      }))
      .filter(({ mastery }) => mastery.level === "learning")
      .sort((a, b) => a.mastery.percentage - b.mastery.percentage);
  }, [progress.fallacyStats]);

  const getUnseenFallacies = useCallback(() => {
    return enhancedFallacies.filter(
      f => !progress.fallacyStats[f.name] || progress.fallacyStats[f.name].totalSeen === 0
    );
  }, [progress.fallacyStats]);

  const getMasteredFallacies = useCallback(() => {
    return enhancedFallacies.filter(f => {
      const mastery = getMasteryInfo(progress.fallacyStats[f.name]);
      return mastery.level === "master";
    });
  }, [progress.fallacyStats]);

  const getOverallMastery = useCallback(() => {
    const totalFallacies = enhancedFallacies.length;
    const masteredCount = getMasteredFallacies().length;
    return (masteredCount / totalFallacies) * 100;
  }, [getMasteredFallacies]);

  const getCategoryMastery = useCallback((category: string) => {
    const fallaciesInCategory = enhancedFallacies.filter(f => f.category === category);
    if (fallaciesInCategory.length === 0) return 0;

    const totalMastery = fallaciesInCategory.reduce((sum, f) => {
      const mastery = getMasteryInfo(progress.fallacyStats[f.name]);
      return sum + mastery.percentage;
    }, 0);

    return totalMastery / fallaciesInCategory.length;
  }, [progress.fallacyStats]);

  const shouldShowFeynmanChallenge = useCallback(() => {
    return progress.feynmanStreak >= 3 && progress.feynmanStreak % 3 === 0;
  }, [progress.feynmanStreak]);

  return {
    progress,
    updateStreak,
    recordAnswer,
    recordSession,
    markQuestionSeen,
    resetFeynmanStreak,
    completeOnboarding,
    setTheme,
    resetProgress,
    exportProgress,
    importProgress,
    getWeakFallacies,
    getUnseenFallacies,
    getMasteredFallacies,
    getOverallMastery,
    getCategoryMastery,
    shouldShowFeynmanChallenge,
  };
}
