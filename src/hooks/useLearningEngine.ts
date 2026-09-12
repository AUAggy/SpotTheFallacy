import { useState, useCallback, useMemo, useRef } from "react";
import { 
  EnhancedQuestion, 
  SessionState, 
  AnswerRecord,
  LearningMode,
  FallacyCategory,
  ContextTag,
  Difficulty
} from "@/data/types";
import { 
  enhancedQuestions, 
  getQuestionsByCategory, 
  getQuestionsByContext,
  getQuestionsByDifficulty,
  enhancedFallacies
} from "@/data/enhancedData";
import { useProgress } from "./useProgress";

const QUESTIONS_PER_SESSION = 10;
const CHALLENGE_TIME_LIMIT = 30;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleQuestions<T>(array: T[], rng: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function useLearningEngine() {
  const { progress, getWeakFallacies, getUnseenFallacies, getMasteredFallacies } = useProgress();
  const [session, setSession] = useState<SessionState | null>(null);
  const [currentAttempts, setCurrentAttempts] = useState(0);

  // Live reads with a stable identity: selection callbacks must never change,
  // otherwise startSession's identity changes and the session-init effect in
  // TrainingSession resets the session mid-question whenever progress updates.
  const latest = useRef({ progress, getWeakFallacies, getUnseenFallacies, getMasteredFallacies });
  latest.current = { progress, getWeakFallacies, getUnseenFallacies, getMasteredFallacies };

  const selectSmartQuestions = useCallback((
    mode: LearningMode,
    count: number,
    categoryFilter?: FallacyCategory,
    contextFilter?: ContextTag,
    options?: { count?: number; seed?: string; fallacies?: string[] }
  ): EnhancedQuestion[] => {
    const { progress, getMasteredFallacies } = latest.current;
    const mastered = new Set(getMasteredFallacies().map(f => f.name));

    let pool: EnhancedQuestion[] = [];
    switch (mode) {
      case "training":
      case "category":
      case "context": {
        if (mode === "category" && categoryFilter) {
          const names = enhancedFallacies.filter(f => f.category === categoryFilter).map(f => f.name);
          pool = enhancedQuestions.filter(q => names.includes(q.fallacy_name));
        } else if (mode === "context" && contextFilter) {
          pool = getQuestionsByContext(contextFilter);
        } else {
          pool = [...enhancedQuestions];
        }
        break;
      }
      case "challenge": {
        // questions from fallacies the player has not yet mastered
        pool = enhancedQuestions.filter(q => !mastered.has(q.fallacy_name));
        break;
      }
      case "daily": {
        pool = [...enhancedQuestions];
        break;
      }
    }

    if (pool.length === 0) {
      pool = [...enhancedQuestions];
    }

    if (options?.fallacies && options.fallacies.length > 0) {
      pool = pool.filter(q => options.fallacies!.includes(q.fallacy_name));
    }

    // Daily challenge: deterministic set, same for everyone on that date
    if (options?.seed) {
      const seedNum = Array.from(options.seed).reduce((a, c) => a + c.charCodeAt(0) * 31, 7);
      const rng = mulberry32(seedNum);
      const shuffled = shuffleQuestions([...pool], rng);
      return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    // Mastery-weighted sampling without replacement:
    // weak spots weigh 4x, unseen fallacies 2x, everything else 1x.
    const items = [...pool];
    const picked: EnhancedQuestion[] = [];
    const weight = (q: EnhancedQuestion): number => {
      const s = progress.fallacyStats[q.fallacy_name];
      if (!s || s.totalSeen === 0) return 2;
      return s.lastAttemptCorrect === false ? 4 : 1;
    };
    while (picked.length < count && items.length > 0) {
      const weights = items.map(weight);
      let r = Math.random() * weights.reduce((a, b) => a + b, 0);
      let idx = 0;
      for (; idx < weights.length; idx++) {
        r -= weights[idx];
        if (r <= 0) break;
      }
      idx = Math.min(idx, items.length - 1);
      picked.push(items[idx]);
      items.splice(idx, 1);
    }
    return picked;
  }, []);

  const startSession = useCallback((
    mode: LearningMode,
    categoryFilter?: FallacyCategory,
    contextFilter?: ContextTag,
    options?: { count?: number; seed?: string; fallacies?: string[] }
  ) => {
    const questions = selectSmartQuestions(
      mode,
      options?.count ?? (mode === "daily" ? 5 : QUESTIONS_PER_SESSION),
      categoryFilter,
      contextFilter,
      options
    );
    
    setSession({
      mode,
      currentQuestionIndex: 0,
      questions,
      answers: [],
      startTime: Date.now(),
      categoryFilter,
      contextFilter,
      oneShot: mode === "challenge" || mode === "daily",
      quick: mode === "training" && (options?.count ?? QUESTIONS_PER_SESSION) < 10,
      timer: mode === "challenge" ? CHALLENGE_TIME_LIMIT : undefined,
    });
    setCurrentAttempts(0);
  }, [selectSmartQuestions]);

  const currentQuestion = useMemo(() => {
    if (!session) return null;
    return session.questions[session.currentQuestionIndex] || null;
  }, [session]);

  const submitAnswer = useCallback((selectedAnswer: string): { 
    isCorrect: boolean; 
    attempts: number;
    canRetry: boolean;
  } => {
    if (!session || !currentQuestion) {
      return { isCorrect: false, attempts: 0, canRetry: false };
    }

    // Guard against double-submission of the same question (e.g. a click
    // racing the timer-expiry auto-answer).
    const alreadyAnswered = session.answers.some(a => a.questionId === currentQuestion.id);
    if (alreadyAnswered) {
      return { isCorrect: false, attempts: currentAttempts, canRetry: false };
    }

    const newAttempts = currentAttempts + 1;
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    // One-shot modes (challenge, daily): no retries
    const canRetry = !session.oneShot && !isCorrect;
    
    setCurrentAttempts(newAttempts);

    if (isCorrect || session.oneShot) {
      // Record the answer
      const answer: AnswerRecord = {
        questionId: currentQuestion.id,
        selectedAnswer,
        isCorrect,
        attempts: newAttempts,
      };

      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          answers: [...prev.answers, answer],
        };
      });
    }

    return { isCorrect, attempts: newAttempts, canRetry };
  }, [session, currentQuestion, currentAttempts]);

  const nextQuestion = useCallback(() => {
    setSession(prev => {
      if (!prev) return null;
      const nextIndex = prev.currentQuestionIndex + 1;
      if (nextIndex >= prev.questions.length) {
        return prev; // Session complete
      }
      return {
        ...prev,
        currentQuestionIndex: nextIndex,
        timer: prev.mode === "challenge" ? CHALLENGE_TIME_LIMIT : undefined,
      };
    });
    setCurrentAttempts(0);
  }, []);

  const isSessionComplete = useMemo(() => {
    if (!session) return false;
    return session.currentQuestionIndex >= session.questions.length - 1 && 
           session.answers.length === session.questions.length;
  }, [session]);

  const sessionStats = useMemo(() => {
    if (!session) return null;
    
    const correctFirstTry = session.answers.filter(a => a.isCorrect && a.attempts === 1).length;
    const correctAfterRetry = session.answers.filter(a => a.isCorrect && a.attempts > 1).length;
    const totalCorrect = session.answers.filter(a => a.isCorrect).length;
    const totalAnswered = session.answers.length;
    
    return {
      correctFirstTry,
      correctAfterRetry,
      totalCorrect,
      totalAnswered,
      totalQuestions: session.questions.length,
      accuracy: totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0,
      duration: Date.now() - session.startTime,
    };
  }, [session]);

  const endSession = useCallback(() => {
    setSession(null);
    setCurrentAttempts(0);
  }, []);

  const getProgressInSession = useCallback(() => {
    if (!session) return { current: 0, total: 0 };
    return {
      current: session.currentQuestionIndex + 1,
      total: session.questions.length,
    };
  }, [session]);

  // Timer management for challenge mode
  const updateTimer = useCallback((newTime: number) => {
    setSession(prev => {
      if (!prev) return null;
      return { ...prev, timer: newTime };
    });
  }, []);

  return {
    session,
    currentQuestion,
    currentAttempts,
    startSession,
    submitAnswer,
    nextQuestion,
    endSession,
    isSessionComplete,
    sessionStats,
    getProgressInSession,
    updateTimer,
  };
}
