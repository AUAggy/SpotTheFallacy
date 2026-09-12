import { useState, useEffect, useCallback, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  LearningMode,
  FallacyCategory,
  ContextTag
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
    shouldShowFeynmanChallenge,
    getMasteredFallacies,
  } = useProgress();
  const totalFallacies = enhancedFallacies.length;

  const [phase, setPhase] = useState<Phase>("question");
  const [lastAnswer, setLastAnswer] = useState<AnswerInfo | null>(null);
  const [questionForFeynman, setQuestionForFeynman] = useState(currentQuestion);
  const [burst, setBurst] = useState(0);
  const celebratedRef = useRef<string | null>(null);

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
    startSession(mode, categoryFilter, contextFilter);
    updateStreak();
  }, [mode, categoryFilter, contextFilter, startSession, updateStreak]);

  const handleAnswer = useCallback((selectedAnswer: string, timedOut = false) => {
    const result = submitAnswer(selectedAnswer);
    setLastAnswer({
      isCorrect: result.isCorrect,
      attempts: result.attempts,
      selectedAnswer,
      timedOut,
    });

    if (result.isCorrect || mode === "challenge") {
      if (currentQuestion) {
        recordAnswer(
          currentQuestion.fallacy_name,
          currentQuestion.id,
          result.isCorrect,
          result.attempts
        );
      }

      // Feynman interstitial on hot streaks (never in challenge mode)
      if (result.isCorrect && mode !== "challenge" && shouldShowFeynmanChallenge()) {
        setQuestionForFeynman(currentQuestion);
        setPhase("feynman");
      } else {
        setPhase("feedback");
      }
    }
    // In non-challenge modes a wrong answer stays on the question for retry.
    return result;
  }, [submitAnswer, currentQuestion, mode, recordAnswer, shouldShowFeynmanChallenge]);

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
      }
    } else {
      nextQuestion();
      setPhase("question");
    }
  }, [isSessionComplete, sessionStats, mode, getMasteredFallacies, recordSession, nextQuestion]);

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

  const handleRestart = useCallback(() => {
    endSession();
    startSession(mode, categoryFilter, contextFilter);
    setPhase("question");
    setLastAnswer(null);
  }, [endSession, startSession, mode, categoryFilter, contextFilter]);

  const progressInfo = getProgressInSession();

  if (phase === "summary" && sessionStats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <SessionSummary
          stats={sessionStats}
          mode={mode}
          onRestart={handleRestart}
          onHome={handleExit}
          streak={progress.streak.current}
          masteredCount={getMasteredFallacies().length}
          totalFallacies={totalFallacies}
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
            timer={session.timer}
          />
        )}
      </main>
    </div>
  );
}
