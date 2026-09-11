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

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function useLearningEngine() {
  const { progress, getWeakFallacies, getUnseenFallacies } = useProgress();
  const [session, setSession] = useState<SessionState | null>(null);
  const [currentAttempts, setCurrentAttempts] = useState(0);

  // Live reads with a stable identity: selection callbacks must never change,
  // otherwise startSession's identity changes and the session-init effect in
  // TrainingSession resets the session mid-question whenever progress updates.
  const latest = useRef({ progress, getWeakFallacies, getUnseenFallacies });
  latest.current = { progress, getWeakFallacies, getUnseenFallacies };

  const selectSmartQuestions = useCallback((
    mode: LearningMode,
    count: number,
    categoryFilter?: FallacyCategory,
    contextFilter?: ContextTag
  ): EnhancedQuestion[] => {
    const { progress, getWeakFallacies, getUnseenFallacies } = latest.current;
    let pool: EnhancedQuestion[] = [];
    
    switch (mode) {
      case "training":
        pool = [...enhancedQuestions];
        break;
      case "category":
        if (categoryFilter) {
          pool = getQuestionsByCategory(categoryFilter);
        }
        break;
      case "context":
        if (contextFilter) {
          pool = getQuestionsByContext(contextFilter);
        }
        break;
      case "challenge": {
        const hardest = getQuestionsByDifficulty(3);
        if (hardest.length > 0) {
          pool = hardest;
        } else {
          // No level-3 questions exist in the data; fall back to the hardest
          // questions available instead of silently serving every difficulty.
          const maxDifficulty = Math.max(...enhancedQuestions.map(q => q.difficulty));
          pool = enhancedQuestions.filter(q => q.difficulty === maxDifficulty);
        }
        break;
      }
    }

    if (pool.length === 0) {
      pool = [...enhancedQuestions];
    }

    // Filter out recently seen questions (in this session)
    const unseenInSession = pool.filter(
      q => !progress.seenQuestionIds.slice(-50).includes(q.id)
    );
    
    if (unseenInSession.length >= count) {
      pool = unseenInSession;
    }

    // Smart selection for training mode
    if (mode === "training") {
      const weakFallacies = getWeakFallacies();
      const unseenFallacies = getUnseenFallacies();
      
      const selected: EnhancedQuestion[] = [];
      
      // 50% weak spots (fallacies with <70% accuracy)
      const weakSpotCount = Math.floor(count * 0.5);
      const weakQuestions = pool.filter(q => 
        weakFallacies.some(w => w.fallacy.name === q.fallacy_name)
      );
      selected.push(...shuffleArray(weakQuestions).slice(0, weakSpotCount));
      
      // 30% unseen fallacies
      const unseenCount = Math.floor(count * 0.3);
      const unseenQuestions = pool.filter(q =>
        unseenFallacies.some(u => u.name === q.fallacy_name) &&
        !selected.find(s => s.id === q.id)
      );
      selected.push(...shuffleArray(unseenQuestions).slice(0, unseenCount));
      
      // 20% random from appropriate difficulty + fill remaining
      const remaining = count - selected.length;
      const difficultyPool = pool.filter(q => 
        q.difficulty <= progress.currentDifficulty &&
        !selected.find(s => s.id === q.id)
      );
      selected.push(...shuffleArray(difficultyPool).slice(0, remaining));
      
      // If still not enough, add any remaining
      if (selected.length < count) {
        const anyRemaining = pool.filter(q => !selected.find(s => s.id === q.id));
        selected.push(...shuffleArray(anyRemaining).slice(0, count - selected.length));
      }
      
      return shuffleArray(selected);
    }
    
    // For other modes, apply difficulty filter and randomize
    let filteredPool = pool;
    if (mode !== "challenge") {
      filteredPool = pool.filter(q => q.difficulty <= progress.currentDifficulty);
      if (filteredPool.length < count) {
        filteredPool = pool;
      }
    }
    
    return shuffleArray(filteredPool).slice(0, count);
  }, []);

  const startSession = useCallback((
    mode: LearningMode,
    categoryFilter?: FallacyCategory,
    contextFilter?: ContextTag
  ) => {
    const questions = selectSmartQuestions(
      mode,
      QUESTIONS_PER_SESSION,
      categoryFilter,
      contextFilter
    );
    
    setSession({
      mode,
      currentQuestionIndex: 0,
      questions,
      answers: [],
      startTime: Date.now(),
      categoryFilter,
      contextFilter,
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
    
    // In challenge mode, no retries
    const canRetry = session.mode !== "challenge" && !isCorrect;
    
    setCurrentAttempts(newAttempts);

    if (isCorrect || session.mode === "challenge") {
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
