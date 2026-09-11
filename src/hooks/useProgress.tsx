import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  UserProgress,
  FallacyStats,
  SessionRecord,
  Difficulty,
  UserPreferences,
  MasteryInfo,
  getMasteryInfo
} from "@/data/types";
import { enhancedFallacies } from "@/data/enhancedData";

const STORAGE_KEY = "fallacy_trainer_progress";
const SCHEMA_VERSION = 2;

/**
 * Fallacy identity changes (retirements, merges) remap stored stats so
 * player progress survives content updates. Phase 3 appends rename keys.
 */
const FALLACY_KEY_MIGRATION: Record<string, string> = {
  "Excluded Middle": "Black & White",
  "Appeal to Money": "Appeal to Authority",
  "Suppressed Correlative": "Definist Fallacy",
};

const RETIRED_FALLACIES = new Set([
  "Homunculus Fallacy",
  "Conflicting Conditions",
  "Appeal to Closure",
]);

export function migrateFallacyKeys(stats: Record<string, FallacyStats> | undefined): Record<string, FallacyStats> {
  const migrated: Record<string, FallacyStats> = {};
  for (const [key, value] of Object.entries(stats ?? {})) {
    if (RETIRED_FALLACIES.has(key)) continue;
    let target = FALLACY_KEY_MIGRATION[key] ?? key;
    // follow rename chains until stable (Phase 3 extends the map)
    while (FALLACY_KEY_MIGRATION[target]) target = FALLACY_KEY_MIGRATION[target];
    const existing = migrated[target];
    if (existing) {
      migrated[target] = {
        totalSeen: existing.totalSeen + value.totalSeen,
        correctFirstTry: existing.correctFirstTry + value.correctFirstTry,
        correctAfterRetry: existing.correctAfterRetry + value.correctAfterRetry,
        incorrect: existing.incorrect + value.incorrect,
        lastSeen: Math.max(existing.lastSeen ?? 0, value.lastSeen ?? 0),
        attempts: [...existing.attempts, ...value.attempts].slice(-20),
      };
    } else {
      migrated[target] = value;
    }
  }
  return migrated;
}

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
  schemaVersion: SCHEMA_VERSION,
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
  correctStreak: 0,
  recentResults: [],
  seenQuestionIds: [],
  isFirstTime: true,
};

function loadProgress(): UserProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      if (parsed.streak.lastActiveDate !== today && parsed.streak.lastActiveDate !== yesterday) {
        parsed.streak.current = 0;
      }

      // v2: consecutiveCorrect and feynmanStreak merged into correctStreak
      if (parsed.correctStreak === undefined) {
        parsed.correctStreak = Math.max(parsed.consecutiveCorrect ?? 0, parsed.feynmanStreak ?? 0);
      }
      delete parsed.consecutiveCorrect;
      delete parsed.feynmanStreak;

      // v2: retired and merged fallacies remap onto surviving keys
      parsed.fallacyStats = migrateFallacyKeys(parsed.fallacyStats);
      parsed.schemaVersion = SCHEMA_VERSION;

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

interface ProgressApi {
  progress: UserProgress;
  updateStreak: () => void;
  recordAnswer: (fallacyName: string, questionId: string, isCorrect: boolean, attempts: number) => void;
  recordSession: (session: Omit<SessionRecord, "date">) => void;
  markQuestionSeen: (questionId: string) => void;
  resetCorrectStreak: () => void;
  completeOnboarding: () => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  resetProgress: () => void;
  exportProgress: () => string;
  importProgress: (data: string) => boolean;
  getWeakFallacies: () => { fallacy: (typeof enhancedFallacies)[number]; stats: FallacyStats | undefined; mastery: MasteryInfo }[];
  getUnseenFallacies: () => (typeof enhancedFallacies)[number][];
  getMasteredFallacies: () => (typeof enhancedFallacies)[number][];
  getOverallMastery: () => number;
  getCategoryMastery: (category: string) => number;
  shouldShowFeynmanChallenge: () => boolean;
}

const ProgressContext = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const updateStreak = useCallback(() => {
    const today = new Date().toDateString();

    setProgress(prev => {
      if (prev.streak.lastActiveDate === today) {
        return prev;
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
        attempts: [...currentStats.attempts, attempts].slice(-20),
      };

      const firstTry = isCorrect && attempts === 1;
      const newCorrectStreak = firstTry ? prev.correctStreak + 1 : 0;

      // Phase 6 retires this ladder; kept for behavior preservation until then.
      const newRecentResults = [...prev.recentResults, firstTry].slice(-10);
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
        correctStreak: newCorrectStreak,
        recentResults: newRecentResults,
        currentDifficulty: newDifficulty,
        seenQuestionIds: [...new Set([...prev.seenQuestionIds, questionId])],
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
      ].slice(-50),
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

  const resetCorrectStreak = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      correctStreak: 0,
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
      // stored backups run through the same migration as loadProgress
      const migrated = migrateFallacyKeys(parsed.fallacyStats);
      setProgress({ ...defaultProgress, ...parsed, fallacyStats: migrated, schemaVersion: SCHEMA_VERSION });
      return true;
    } catch {
      return false;
    }
  }, []);

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
    return (getMasteredFallacies().length / totalFallacies) * 100;
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
    return progress.correctStreak >= 3 && progress.correctStreak % 3 === 0;
  }, [progress.correctStreak]);

  const value = useMemo<ProgressApi>(() => ({
    progress,
    updateStreak,
    recordAnswer,
    recordSession,
    markQuestionSeen,
    resetCorrectStreak,
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
  }), [
    progress, updateStreak, recordAnswer, recordSession, markQuestionSeen,
    resetCorrectStreak, completeOnboarding, setTheme, resetProgress,
    exportProgress, importProgress, getWeakFallacies, getUnseenFallacies,
    getMasteredFallacies, getOverallMastery, getCategoryMastery,
    shouldShowFeynmanChallenge,
  ]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useProgress must be used inside <ProgressProvider>");
  }
  return ctx;
}
