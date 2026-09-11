import { useState, useEffect, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  LearningMode,
  FallacyCategory,
  ContextTag
} from "@/data/types";
import { useLearningEngine } from "@/hooks/useLearningEngine";
import { useProgress } from "@/hooks/useProgress";
import { QuestionCard } from "@/components/training/QuestionCard";
import { FeedbackPanel } from "@/components/training/FeedbackPanel";
import { FeynmanChallenge } from "@/components/training/FeynmanChallenge";
import { SessionSummary } from "@/components/training/SessionSummary";
import { ArrowLeft, X } from "lucide-react";

interface TrainingSessionProps {
  mode: LearningMode;
  categoryFilter?: FallacyCategory;
  contextFilter?: ContextTag;
  onExit: () => void;
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
    resetFeynmanStreak,
  } = useProgress();

  const [showFeedback, setShowFeedback] = useState(false);
  const [showFeynman, setShowFeynman] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{
    isCorrect: boolean;
    attempts: number;
    selectedAnswer: string | null;
    timedOut: boolean;
  } | null>(null);
  const [questionForFeynman, setQuestionForFeynman] = useState(currentQuestion);

  // Initialize session
  useEffect(() => {
    startSession(mode, categoryFilter, contextFilter);
    updateStreak();
  }, [mode, categoryFilter, contextFilter, startSession, updateStreak]);

  // Timer for challenge mode
  useEffect(() => {
    if (mode === "challenge" && session?.timer !== undefined && session.timer > 0 && !showFeedback) {
      const interval = setInterval(() => {
        updateTimer(session.timer! - 1);
      }, 1000);

      return () => clearInterval(interval);
    }

    // Time's up in challenge mode (only while a question is still pending)
    if (
      mode === "challenge" &&
      session?.timer === 0 &&
      !showFeedback &&
      !isSessionComplete &&
      currentQuestion
    ) {
      handleAnswer("", true);
    }
  }, [mode, session?.timer, showFeedback, isSessionComplete, currentQuestion, updateTimer]);

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

      // Check for Feynman challenge
      if (result.isCorrect && shouldShowFeynmanChallenge() && mode !== "challenge") {
        setQuestionForFeynman(currentQuestion);
        setShowFeynman(true);
      } else {
        setShowFeedback(true);
      }
    }

    return result;
  }, [submitAnswer, currentQuestion, mode, recordAnswer, shouldShowFeynmanChallenge]);

  const handleContinue = useCallback(() => {
    setShowFeedback(false);
    setLastAnswer(null);

    if (isSessionComplete) {
      // Record session completion
      if (sessionStats) {
        recordSession({
          mode,
          questionsAnswered: sessionStats.totalAnswered,
          correctFirstTry: sessionStats.correctFirstTry,
          difficultyLevel: progress.currentDifficulty,
          duration: sessionStats.duration,
        });
      }
    } else {
      nextQuestion();
    }
  }, [isSessionComplete, sessionStats, mode, progress.currentDifficulty, recordSession, nextQuestion]);

  const handleFeynmanComplete = useCallback((passed: boolean) => {
    if (!passed) {
      resetFeynmanStreak();
    }
    setShowFeynman(false);
    setShowFeedback(true);
  }, [resetFeynmanStreak]);

  const handleFeynmanSkip = useCallback(() => {
    setShowFeynman(false);
    setShowFeedback(true);
  }, []);

  const handleExit = useCallback(() => {
    endSession();
    onExit();
  }, [endSession, onExit]);

  const handleRestart = useCallback(() => {
    endSession();
    startSession(mode, categoryFilter, contextFilter);
  }, [endSession, startSession, mode, categoryFilter, contextFilter]);

  const progressInfo = getProgressInSession();

  // Show session summary once the last question's feedback has been dismissed
  if (isSessionComplete && sessionStats && !showFeedback && !showFeynman) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <SessionSummary
          stats={sessionStats}
          mode={mode}
          onRestart={handleRestart}
          onHome={handleExit}
          streak={progress.streak.current}
          difficultyLevel={progress.currentDifficulty}
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
        {showFeynman && questionForFeynman ? (
          <FeynmanChallenge
            question={questionForFeynman}
            onComplete={handleFeynmanComplete}
            onSkip={handleFeynmanSkip}
          />
        ) : showFeedback ? (
          <FeedbackPanel
            question={currentQuestion}
            attempts={lastAnswer?.attempts || 0}
            isCorrect={lastAnswer?.isCorrect ?? false}
            timedOut={lastAnswer?.timedOut ?? false}
            selectedAnswer={lastAnswer?.selectedAnswer ?? null}
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
