import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EnhancedQuestion } from "@/data/types";
import { getFallacyByName } from "@/data/enhancedData";
import { Brain, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeynmanChallengeProps {
  question: EnhancedQuestion;
  onComplete: (passed: boolean) => void;
  onSkip: () => void;
}

export function FeynmanChallenge({ question, onComplete, onSkip }: FeynmanChallengeProps) {
  const [explanation, setExplanation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    passed: boolean;
    matchedTerms: string[];
    feedback: string;
  } | null>(null);

  const fallacy = getFallacyByName(question.fallacy_name);

  const evaluateExplanation = useMemo(() => {
    if (!fallacy) return () => null;

    return (text: string) => {
      const lowerText = text.toLowerCase();
      const keyTerms = fallacy.keyTerms || [];
      
      const matchedTerms = keyTerms.filter(term => 
        lowerText.includes(term.toLowerCase())
      );
      
      const score = matchedTerms.length / Math.max(keyTerms.length, 1);
      const passed = score >= 0.3 && text.length >= 50;
      
      let feedback = "";
      if (passed) {
        if (score >= 0.6) {
          feedback = "Excellent explanation! You've demonstrated a strong understanding of this fallacy.";
        } else {
          feedback = "Good explanation! You've captured the core concept. Consider also mentioning: " + 
            keyTerms.filter(t => !matchedTerms.includes(t)).slice(0, 2).join(", ");
        }
      } else {
        if (text.length < 50) {
          feedback = "Try to explain in a bit more detail. Why does this type of reasoning fail?";
        } else {
          feedback = "You're on the right track! Key concepts to consider: " + 
            keyTerms.slice(0, 3).join(", ");
        }
      }

      return { passed, matchedTerms, feedback };
    };
  }, [fallacy]);

  const handleSubmit = () => {
    const evaluation = evaluateExplanation(explanation);
    if (evaluation) {
      setResult(evaluation);
      setSubmitted(true);
    }
  };

  const handleContinue = () => {
    if (result) {
      onComplete(result.passed);
    }
  };

  if (!fallacy) return null;

  return (
    <Card className="w-full max-w-3xl mx-auto border-2 border-purple-500/30 bg-purple-500/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
            <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-purple-700 dark:text-purple-300">
              Feynman Challenge! 🧠
            </CardTitle>
            <CardDescription>
              Explain it to truly understand it
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">The scenario was:</p>
          <p className="text-foreground">{question.question}</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            In your own words, explain WHY this is <strong>{fallacy.name}</strong>:
          </label>
          <Textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="The reason this is a fallacy is because..."
            className="min-h-[120px] resize-none"
            disabled={submitted}
          />
          <p className="text-xs text-muted-foreground">
            {explanation.length} characters {explanation.length < 50 && "(aim for at least 50)"}
          </p>
        </div>

        {!submitted ? (
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={explanation.length < 20} className="flex-1">
              Submit Explanation
            </Button>
            <Button variant="ghost" onClick={onSkip}>
              Skip
            </Button>
          </div>
        ) : result && (
          <div className="space-y-4">
            <div className={cn(
              "p-4 rounded-lg border-2",
              result.passed 
                ? "bg-green-500/10 border-green-500/30" 
                : "bg-amber-500/10 border-amber-500/30"
            )}>
              <div className="flex items-start gap-3">
                {result.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-2">
                  <p className={cn(
                    "font-medium",
                    result.passed ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"
                  )}>
                    {result.passed ? "Well explained!" : "Keep learning!"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {result.feedback}
                  </p>
                </div>
              </div>
            </div>

            {result.matchedTerms.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Key concepts you mentioned:</span>
                {result.matchedTerms.map(term => (
                  <Badge key={term} variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-300">
                    ✓ {term}
                  </Badge>
                ))}
              </div>
            )}

            <Button onClick={handleContinue} className="w-full">
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
