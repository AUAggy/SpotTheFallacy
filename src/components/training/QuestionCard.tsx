import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedQuestion } from "@/data/types";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: EnhancedQuestion;
  onAnswer: (answer: string) => { isCorrect: boolean; attempts: number; canRetry: boolean };
  attempts: number;
  mode: "training" | "category" | "context" | "challenge";
  timer?: number;
}

export function QuestionCard({ 
  question, 
  onAnswer, 
  attempts, 
  mode,
  timer 
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    attempts: number;
    canRetry: boolean;
  } | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const handleOptionClick = (option: string) => {
    if (feedback?.isCorrect) return; // Already answered correctly
    
    setSelectedAnswer(option);
    const result = onAnswer(option);
    setFeedback(result);
    
    if (!result.isCorrect && result.canRetry) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return "bg-green-500/20 text-green-700 dark:text-green-300";
      case 2: return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      case 3: return "bg-red-500/20 text-red-700 dark:text-red-300";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getOptionStyle = (option: string) => {
    if (!feedback) {
      return selectedAnswer === option 
        ? "border-primary bg-primary/10" 
        : "border-border hover:border-primary/50 hover:bg-accent";
    }

    if (option === question.correct_answer) {
      return "border-green-500 bg-green-500/20 text-green-700 dark:text-green-300";
    }

    if (option === selectedAnswer && !feedback.isCorrect) {
      return "border-red-500 bg-red-500/20 text-red-700 dark:text-red-300";
    }

    return "border-border opacity-50";
  };

  return (
    <Card className={cn(
      "w-full max-w-3xl mx-auto transition-all duration-300",
      isShaking && "animate-shake"
    )}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
              Level {question.difficulty}
            </Badge>
            {question.contexts.map(ctx => (
              <Badge key={ctx} variant="secondary" className="text-xs">
                {ctx}
              </Badge>
            ))}
          </div>
          {mode === "challenge" && timer !== undefined && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-lg font-mono",
                timer <= 10 ? "text-red-500 animate-pulse" : "text-muted-foreground"
              )}
            >
              {timer}s
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg md:text-xl leading-relaxed font-medium">
          {question.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {question.options.map((option, index) => (
          <Button
            key={option}
            variant="outline"
            className={cn(
              "w-full justify-start text-left h-auto py-4 px-4 text-base whitespace-normal",
              getOptionStyle(option),
              feedback?.isCorrect && option !== question.correct_answer && "pointer-events-none"
            )}
            onClick={() => handleOptionClick(option)}
            disabled={feedback?.isCorrect || (mode === "challenge" && feedback !== null)}
          >
            <span className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm font-medium">
              {String.fromCharCode(65 + index)}
            </span>
            <span>{option}</span>
          </Button>
        ))}
        
        {feedback && !feedback.isCorrect && feedback.canRetry && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Not quite!</strong> {question.optionExplanations[selectedAnswer!]}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Try again! This is practice, not a test. 💪
            </p>
          </div>
        )}

        {attempts > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Attempt {attempts}
          </p>
        )}
      </CardContent>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </Card>
  );
}
