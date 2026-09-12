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
  UserPreferences,
  getMasteryInfo
} from "@/data/types";
import { enhancedFallacies } from "@/data/enhancedData";

const STORAGE_KEY = "fallacy_trainer_progress";
const SCHEMA_VERSION = 4;

/**
 * Fallacy identity changes (retirements, merges) remap stored stats so
 * player progress survives content updates. Phase 3 appends rename keys.
 */
const FALLACY_KEY_MIGRATION: Record<string, string> = {
  "Excluded Middle": "False Dilemma",
  "Appeal to Money": "Appeal to Authority",
  "Suppressed Correlative": "Definist Fallacy",
  "Black & White": "False Dilemma",
  "Affective Fallacy": "Appeal to Emotion",
  "Proof of Non-existence": "Appeal to Ignorance",
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
        attempts: [...(existing.attempts ?? []), ...(value.attempts ?? [])].slice(-20),
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
  showOnboarding: true,
};

const defaultProgress: UserProgress = {
  schemaVersion: SCHEMA_VERSION,
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
  lastMasteryUp: null,
  daily: { lastPlayedDate: null, history: [] },
  isFirstTime: true,
};

/**
 * Accepts a parsed blob only if it carries the one thing that makes it a
 * progress record. Anything else (a bare number, an array, an unrelated JSON
 * document) is rejected so import cannot silently replace progress with an
 * empty profile while reporting success.
 */
function looksLikeProgress(value: unknown): value is Partial<UserProgress> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const stats = (value as Partial<UserProgress>).fallacyStats;
  return typeof stats === "object" && stats !== null && !Array.isArray(stats);
}

/**
 * Bring any historical blob up to the current schema. Used by both load and
 * import, so a restored backup goes through exactly the same migrations as a
 * normal page load.
 */
function normalizeProgress(input: Partial<UserProgress>): UserProgress {
  const parsed: Record<string, unknown> = { ...input };

  // streak: a gap of more than one day resets the run
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const streak = (parsed.streak ?? {}) as Partial<UserProgress["streak"]>;
  parsed.streak = {
    current: 0,
    longest: 0,
    lastActiveDate: null,
    ...streak,
  } as UserProgress["streak"];
  if (streak.lastActiveDate !== today && streak.lastActiveDate !== yesterday) {
    (parsed.streak as UserProgress["streak"]).current = 0;
  }

  // v2: consecutiveCorrect and feynmanStreak merged into correctStreak
  if (parsed.correctStreak === undefined) {
    parsed.correctStreak = Math.max(
      (parsed.consecutiveCorrect as number) ?? 0,
      (parsed.feynmanStreak as number) ?? 0
    );
  }
  delete parsed.consecutiveCorrect;
  delete parsed.feynmanStreak;
  // v3: difficulty ladder retired
  delete parsed.currentDifficulty;
  delete parsed.recentResults;
  // v4: question ids are no longer tracked (selection is mastery-weighted)
  delete parsed.seenQuestionIds;
  // theme is owned by next-themes, not by this store
  if (parsed.preferences) {
    const stored = parsed.preferences as Partial<UserPreferences>;
    parsed.preferences = { showOnboarding: stored.showOnboarding ?? true };
  }
  // never restore a persisted celebration
  parsed.lastMasteryUp = null;

  // v2: retired and merged fallacies remap onto surviving keys
  parsed.fallacyStats = migrateFallacyKeys(parsed.fallacyStats as Record<string, FallacyStats>);
  parsed.schemaVersion = SCHEMA_VERSION;

  return { ...defaultProgress, ...parsed } as UserProgress;
}

function loadProgress(): UserProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (!looksLikeProgress(parsed)) return defaultProgress;
      return normalizeProgress(parsed);
    }
  } catch (e) {
    console.error("Error loading progress:", e);
  }
  return defaultProgress;
}

function saveProgress(progress: UserProgress): void {
  try {
    // lastMasteryUp is in-memory only: persisting it would replay the
    // celebration on the next visit.
    const { lastMasteryUp: _transient, ...persisted } = progress;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch (e) {
    console.error("Error saving progress:", e);
  }
}

interface ProgressApi {
  progress: UserProgress;
  updateStreak: () => void;
  recordAnswer: (fallacyName: string, isCorrect: boolean, attempts: number) => void;
  recordSession: (session: Omit<SessionRecord, "date">) => void;
  recordDailyResult: (date: string, score: number, total: number) => void;
  completeOnboarding: () => void;
  resetProgress: () => void;
  exportProgress: () => string;
  importProgress: (data: string) => boolean;
  getMasteredFallacies: () => (typeof enhancedFallacies)[number][];
  getCategoryMastery: (category: string) => number;
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
      newStats.lastAttemptCorrect = isCorrect;

      // one-shot celebration marker when a fallacy crosses the mastery line
      const prevPct = getMasteryInfo(currentStats).percentage;
      const newPct = getMasteryInfo(newStats).percentage;
      const lastMasteryUp = prevPct < 90 && newPct >= 90 ? fallacyName : null;

      return {
        ...prev,
        fallacyStats: {
          ...prev.fallacyStats,
          [fallacyName]: newStats,
        },
        totalQuestionsAnswered: prev.totalQuestionsAnswered + 1,
        correctStreak: newCorrectStreak,
        lastMasteryUp,
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

  const recordDailyResult = useCallback((date: string, score: number, total: number) => {
    setProgress(prev => {
      // One daily entry per date. This is an invariant, not a UI rule: the
      // menu, the summary, and a second browser tab all funnel through here.
      if (prev.daily.lastPlayedDate === date) return prev;
      return {
        ...prev,
        daily: {
          lastPlayedDate: date,
          history: [...prev.daily.history, { date, score, total }].slice(-60),
        },
        lastUpdated: Date.now(),
      };
    });
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

  const resetProgress = useCallback(() => {
    setProgress(defaultProgress);
  }, []);

  const exportProgress = useCallback(() => {
    const { lastMasteryUp: _transient, ...persisted } = progress;
    return JSON.stringify(persisted, null, 2);
  }, [progress]);

  const importProgress = useCallback((data: string) => {
    try {
      const parsed: unknown = JSON.parse(data);
      if (!looksLikeProgress(parsed)) return false;
      // stored backups run through the same migration as a normal load
      setProgress(normalizeProgress(parsed));
      return true;
    } catch {
      return false;
    }
  }, []);

  const getMasteredFallacies = useCallback(() => {
    return enhancedFallacies.filter(f => {
      const mastery = getMasteryInfo(progress.fallacyStats[f.name]);
      return mastery.level === "master";
    });
  }, [progress.fallacyStats]);

  const getCategoryMastery = useCallback((category: string) => {
    const fallaciesInCategory = enhancedFallacies.filter(f => f.category === category);
    if (fallaciesInCategory.length === 0) return 0;

    const totalMastery = fallaciesInCategory.reduce((sum, f) => {
      const mastery = getMasteryInfo(progress.fallacyStats[f.name]);
      return sum + mastery.percentage;
    }, 0);

    return totalMastery / fallaciesInCategory.length;
  }, [progress.fallacyStats]);

  const value = useMemo<ProgressApi>(() => ({
    progress,
    updateStreak,
    recordAnswer,
    recordSession,
    recordDailyResult,
    completeOnboarding,
    resetProgress,
    exportProgress,
    importProgress,
    getMasteredFallacies,
    getCategoryMastery,
  }), [
    progress, updateStreak, recordAnswer, recordSession, recordDailyResult,
    completeOnboarding, resetProgress, exportProgress, importProgress,
    getMasteredFallacies, getCategoryMastery,
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
