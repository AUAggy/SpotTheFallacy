import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EnhancedQuestion } from "@/data/types";
import { getFallacyByName } from "@/data/enhancedData";
import { CheckCircle2, XCircle, ArrowRight, BookOpen, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackPanelProps {
  question: EnhancedQuestion;
  attempts: number;
  /** Whether the user's submitted answer was correct. */
  isCorrect: boolean;
  /** True when the question was missed because the timer ran out. */
  timedOut?: boolean;
  /** The answer the user picked (null when timed out). */
  selectedAnswer?: string | null;
  onContinue: () => void;
}

export function FeedbackPanel({
  question,
  attempts,
  isCorrect,
  timedOut = false,
  selectedAnswer,
  onContinue
}: FeedbackPanelProps) {
  const fallacy = getFallacyByName(question.fallacy_name);

  if (!fallacy) return null;

  const isFirstTry = isCorrect && attempts === 1;
  const isWrong = !isCorrect;

  const headerTitle = isWrong
    ? timedOut
      ? "Time's up! ⏰"
      : "Not quite! 🤔"
    : isFirstTry
      ? "Excellent! First try! 🎉"
      : `Got it in ${attempts} tries! 💪`;

  const selectedExplanation = isWrong && !timedOut && selectedAnswer
    ? question.optionExplanations[selectedAnswer]
    : undefined;

  return (
    <Card className={cn(
      "w-full max-w-3xl mx-auto border-2 transition-all duration-500",
      isWrong
        ? "border-red-500 bg-red-500/5"
        : isFirstTry
          ? "border-green-500 bg-green-500/5"
          : "border-yellow-500 bg-yellow-500/5"
    )}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            isWrong
              ? "bg-red-500/20"
              : isFirstTry
                ? "bg-green-500/20"
                : "bg-yellow-500/20"
          )}>
            {isWrong ? (
              <XCircle className="h-6 w-6 text-red-600" />
            ) : (
              <CheckCircle2 className={cn(
                "h-6 w-6",
                isFirstTry ? "text-green-600" : "text-yellow-600"
              )} />
            )}
          </div>
          <div>
            <CardTitle className={cn(
              "text-xl",
              isWrong
                ? "text-red-700 dark:text-red-300"
                : isFirstTry
                  ? "text-green-700 dark:text-green-300"
                  : "text-yellow-700 dark:text-yellow-300"
            )}>
              {headerTitle}
            </CardTitle>
            <p className="text-muted-foreground">
              {isWrong ? "The correct answer is " : "This is "}
              <strong>{fallacy.name}</strong>
            </p>
            {fallacy.aliases && fallacy.aliases.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Also known as: {fallacy.aliases.join(", ")}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* What the user picked and why it was wrong */}
        {isWrong && !timedOut && selectedAnswer && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300">
                <XCircle className="h-4 w-4" />
                You selected:
              </div>
              <p className="text-sm text-foreground leading-relaxed bg-red-500/10 border border-red-500/20 p-3 rounded-lg italic">
                "{selectedAnswer}"
              </p>
              {selectedExplanation && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedExplanation}
                </p>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Fallacy Description */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            What is {fallacy.name}?
          </div>
          <p className="text-foreground leading-relaxed">
            {fallacy.description}
          </p>
        </div>

        <Separator />

        {/* Structure Diagram */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Lightbulb className="h-4 w-4" />
            The Pattern
          </div>
          <pre className="bg-muted p-4 rounded-lg text-xs md:text-sm font-mono overflow-x-auto whitespace-pre">
            {fallacy.structureDiagram}
          </pre>
        </div>

        <Separator />

        {/* Valid Version */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-green-700 dark:text-green-300">
            ✓ The fallacy-free version:
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed bg-green-500/10 p-3 rounded-lg">
            {question.validVersion}
          </p>
        </div>

        <Separator />

        {/* Examples */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Other examples of {fallacy.name}:
          </div>
          <ul className="space-y-2">
            {fallacy.examples.map((example, idx) => (
              <li key={idx} className="text-sm text-muted-foreground italic pl-4 border-l-2 border-muted">
                "{example}"
              </li>
            ))}
          </ul>
        </div>

        {/* Context Tags */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">You'll often see this in:</span>
          {question.contexts.map(ctx => (
            <Badge key={ctx} variant="outline">
              {ctx}
            </Badge>
          ))}
        </div>

        {/* Confusion Warning */}
        {fallacy.confusedWith.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              ⚠️ Often confused with: {fallacy.confusedWith.join(", ")}
            </p>
          </div>
        )}

        <Button onClick={onContinue} className="w-full mt-4" size="lg">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
