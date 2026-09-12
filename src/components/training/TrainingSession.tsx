import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  LearningMode,
  FallacyCategory,
  ContextTag,
  isFeynmanDue
} from "@/data/types";
import { useLearningEngine } from "@/hooks/useLearningEngine";
import { useProgress } from "@/hooks/useProgress";
import { enhancedFallacies } from "@/data/enhancedData";
import { QuestionCard } from "@/components/training/QuestionCard";
import { FeedbackPanel } from "@/components/training/FeedbackPanel";
import { FeynmanChallenge } from "@/components/training/FeynmanChallenge";
import { SessionSummary } from "@/components/training/SessionSummary";
import { ConfettiBurst } from "@/components/training/ConfettiBurst";
import { ArrowLeft, X } from "lucide-react";

interface TrainingSessionProps {
  mode: LearningMode;
  categoryFilter?: FallacyCategory;
  contextFilter?: ContextTag;
  /** short session (Quick Round) */
  questionCount?: number;
  /** restrict the pool to these fallacies ("practice your weakest") */
  fallacyFilter?: string[];
  onExit: () => void;
}

/**
 * Session phases: question -> (feedback | feynman) -> question -> ... -> summary.
 * The phase is the single source of truth for what is on screen; no boolean
 * combinations, so impossible states cannot be represented.
 */
type Phase = "question" | "feedback" | "feynman" | "summary";

interface AnswerInfo {
  isCorrect: boolean;
  attempts: number;
  selectedAnswer: string | null;
  timedOut: boolean;
}

export function TrainingSession({
  mode,
  categoryFilter,
  contextFilter,
  questionCount,
  fallacyFilter,
  onExit
}: TrainingSessionProps) {
  const {
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
  } = useLearningEngine();

  const {
    progress,
    updateStreak,
    recordAnswer,
    recordSession,
    getMasteredFallacies,
    recordDailyResult,
  } = useProgress();
  const totalFallacies = enhancedFallacies.length;

  const [phase, setPhase] = useState<Phase>("question");
  const [lastAnswer, setLastAnswer] = useState<AnswerInfo | null>(null);
  const [questionForFeynman, setQuestionForFeynman] = useState(currentQuestion);
  const [burst, setBurst] = useState(0);
  const celebratedRef = useRef<string | null>(null);

  // One definition of "this session's options", shared by the init effect and
  // Restart, so a restart cannot silently change the pool, the length, or the
  // daily seed.
  const today = new Date().toISOString().slice(0, 10);
  const sessionOptions = useMemo(() => ({
    count: questionCount,
    fallacies: fallacyFilter,
    seed: mode === "daily" ? today : undefined,
  }), [questionCount, fallacyFilter, mode, today]);

  // celebrate a fresh mastery crossing exactly once
  useEffect(() => {
    const up = progress.lastMasteryUp;
    if (up && up !== celebratedRef.current) {
      celebratedRef.current = up;
      setBurst(b => b + 1);
    }
    if (!up) celebratedRef.current = null;
  }, [progress.lastMasteryUp]);

  // celebrate strong sessions once, when the summary appears
  useEffect(() => {
    if (phase === "summary" && sessionStats && sessionStats.accuracy >= 80) {
      setBurst(b => b + 1);
    }
  }, [phase, sessionStats]);

  // Initialize session
  useEffect(() => {
    startSession(mode, categoryFilter, contextFilter, sessionOptions);
    updateStreak();
  }, [mode, categoryFilter, contextFilter, sessionOptions, startSession, updateStreak]);

  const handleAnswer = useCallback((selectedAnswer: string, timedOut = false) => {
    const result = submitAnswer(selectedAnswer);

    // Another caller (typically the challenge timer) already recorded this
    // question. Ignore it instead of overwriting the real feedback.
    if (result.duplicate) return result;

    setLastAnswer({
      isCorrect: result.isCorrect,
      attempts: result.attempts,
      selectedAnswer,
      timedOut,
    });

    if (result.isCorrect || session?.oneShot) {
      if (currentQuestion) {
        recordAnswer(
          currentQuestion.fallacy_name,
          result.isCorrect,
          result.attempts
        );
      }

      // recordAnswer only queues the streak update, so the streak that
      // includes this answer is the current value plus one for a first-try
      // correct. Reading the pre-answer value would fire the prompt one
      // answer late.
      const streakAfter = result.isCorrect && result.attempts === 1
        ? progress.correctStreak + 1
        : 0;

      // Feynman interstitial on hot streaks (never in one-shot or quick modes)
      if (result.isCorrect && !session?.oneShot && !session?.quick && isFeynmanDue(streakAfter)) {
        setQuestionForFeynman(currentQuestion);
        setPhase("feynman");
      } else {
        setPhase("feedback");
      }
    }
    // In non-challenge modes a wrong answer stays on the question for retry.
    return result;
  }, [submitAnswer, currentQuestion, recordAnswer, session?.oneShot, session?.quick, progress.correctStreak]);

  // Challenge timer: runs only while a question is on screen. Expiry fires
  // exactly once because the timeout transition leaves the question phase.
  useEffect(() => {
    if (mode !== "challenge" || phase !== "question") return;
    if (!session || session.timer === undefined || !currentQuestion) return;

    if (session.timer <= 0) {
      handleAnswer("", true);
      return;
    }

    const interval = setInterval(() => {
      updateTimer(session.timer! - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, phase, session, currentQuestion, handleAnswer, updateTimer]);

  const handleContinue = useCallback(() => {
    setLastAnswer(null);
    if (isSessionComplete) {
      setPhase("summary");
      if (sessionStats) {
        recordSession({
          mode,
          questionsAnswered: sessionStats.totalAnswered,
          correctFirstTry: sessionStats.correctFirstTry,
          mastered: getMasteredFallacies().length,
          duration: sessionStats.duration,
        });
        if (mode === "daily") {
          // The store keeps one daily entry per date, so this is safe even
          // if a stale tab or a replay path gets here twice.
          recordDailyResult(today, sessionStats.totalCorrect, sessionStats.totalQuestions);
        }
      }
    } else {
      nextQuestion();
      setPhase("question");
    }
  }, [isSessionComplete, sessionStats, mode, getMasteredFallacies, recordSession, recordDailyResult, nextQuestion, today]);

  const handleFeynmanComplete = useCallback(() => {
    setPhase("feedback");
  }, []);

  const handleFeynmanSkip = useCallback(() => {
    setPhase("feedback");
  }, []);

  const handleExit = useCallback(() => {
    endSession();
    onExit();
  }, [endSession, onExit]);

  // Personal best among previously recorded challenge sessions
  const personalBest = useMemo(() => {
    const past = progress.sessionHistory.filter(s => s.mode === "challenge");
    if (past.length === 0) return undefined;
    return Math.max(...past.map(s => s.correctFirstTry));
  }, [progress.sessionHistory]);

  // Focus-next takeaway: the fallacy missed most in this session
  const takeaway = useMemo(() => {
    if (!session || phase !== "summary") return null;
    const wrong = new Map<string, number>();
    for (const a of session.answers) {
      if (a.isCorrect) continue;
      const q = session.questions.find(x => x.id === a.questionId);
      if (q) wrong.set(q.fallacy_name, (wrong.get(q.fallacy_name) ?? 0) + 1);
    }
    if (wrong.size === 0) return null;
    const [name] = [...wrong.entries()].sort((a, b) => b[1] - a[1])[0];
    return name;
  }, [phase, session]);

  const handleRestart = useCallback(() => {
    endSession();
    startSession(mode, categoryFilter, contextFilter, sessionOptions);
    setPhase("question");
    setLastAnswer(null);
  }, [endSession, startSession, mode, categoryFilter, contextFilter, sessionOptions]);

  const progressInfo = getProgressInSession();

  if (phase === "summary" && sessionStats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <SessionSummary
          stats={sessionStats}
          mode={mode}
          onRestart={handleRestart}
          onHome={handleExit}
          allowRestart={mode !== "daily"}
          streak={progress.streak.current}
          masteredCount={getMasteredFallacies().length}
          totalFallacies={totalFallacies}
          personalBest={personalBest !== undefined ? Math.max(personalBest, sessionStats?.totalCorrect ?? 0) : undefined}
          takeaway={takeaway}
        />
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ConfettiBurst trigger={burst} />
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="sm" onClick={handleExit}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit
          </Button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {progressInfo.current} / {progressInfo.total}
            </span>
            <div className="w-32 md:w-48">
              <Progress
                value={(progressInfo.current / progressInfo.total) * 100}
                className="h-2"
              />
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={handleExit}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        {phase === "feynman" && questionForFeynman ? (
          <FeynmanChallenge
            question={questionForFeynman}
            onComplete={handleFeynmanComplete}
            onSkip={handleFeynmanSkip}
          />
        ) : phase === "feedback" ? (
          <FeedbackPanel
            question={currentQuestion}
            attempts={lastAnswer?.attempts || 0}
            isCorrect={lastAnswer?.isCorrect ?? false}
            timedOut={lastAnswer?.timedOut ?? false}
            selectedAnswer={lastAnswer?.selectedAnswer ?? null}
            masteryUp={lastAnswer?.isCorrect ? progress.lastMasteryUp : null}
            onContinue={handleContinue}
          />
        ) : (
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
            attempts={currentAttempts}
            mode={mode}
            oneShot={session.oneShot ?? false}
            timer={session.timer}
          />
        )}
      </main>
    </div>
  );
}
