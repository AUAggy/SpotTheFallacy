import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight, BookOpen } from "lucide-react";

interface WelcomeScreenProps {
  onStart: () => void;
  onSkipTutorial: () => void;
}

export function WelcomeScreen({ onStart, onSkipTutorial }: WelcomeScreenProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Brain className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">
            Welcome to Spot The Fallacy
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground text-lg">
            Develop your skill in recognizing logical fallacies; those sneaky 
            errors in reasoning that can fool even the smartest people.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              How This Works
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>You'll see real-world scenarios with flawed reasoning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>Identify which logical fallacy is being used</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>Get immediate feedback with detailed explanations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">4.</span>
                <span>Track your progress as you master each fallacy</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-300 text-center">
              <strong>Remember:</strong> This is practice, not a test. 
              Making mistakes is part of learning! You can always try again.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={onStart} size="lg" className="flex-1">
              Start with a Tutorial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={onSkipTutorial} variant="outline" size="lg">
              Skip to Training
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
