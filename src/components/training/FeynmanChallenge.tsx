import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EnhancedQuestion } from "@/data/types";
import { getFallacyByName } from "@/data/enhancedData";
import { Brain, ArrowRight } from "lucide-react";

interface FeynmanChallengeProps {
  question: EnhancedQuestion;
  /** fired when the player has written their explanation and continues */
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * Reflective interstitial: explain the fallacy in your own words.
 * There is deliberately no scoring. Writing the explanation is the exercise.
 */
export function FeynmanChallenge({ question, onComplete, onSkip }: FeynmanChallengeProps) {
  const [explanation, setExplanation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const fallacy = getFallacyByName(question.fallacy_name);

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
              Feynman Challenge
            </CardTitle>
            <CardDescription>
              Explaining it simply is the test of understanding
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
            In your own words, why is this <strong>{fallacy.name}</strong>?
          </label>
          <Textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="This is a fallacy because..."
            className="min-h-[120px] resize-none"
            disabled={submitted}
          />
          <p className="text-xs text-muted-foreground">
            {explanation.length} characters {explanation.length < 50 && "(aim for at least 50 characters)"}
          </p>
        </div>

        {!submitted ? (
          <div className="flex gap-2">
            <Button onClick={() => setSubmitted(true)} disabled={explanation.length < 20} className="flex-1">
              Submit Explanation
            </Button>
            <Button variant="ghost" onClick={onSkip}>
              Skip
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border-2 bg-purple-500/10 border-purple-500/30">
              <p className="text-sm text-foreground">
                Logged. Saying it in your own words is what makes it stick;
                come back to this one if it felt shaky.
              </p>
            </div>
            <Button onClick={onComplete} className="w-full">
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
