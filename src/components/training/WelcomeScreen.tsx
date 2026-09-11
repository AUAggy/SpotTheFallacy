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
            Train yourself to spot logical fallacies: the flawed arguments
            that slip past smart people every day.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              How This Works
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>Read a short scenario built on flawed reasoning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>Name the fallacy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>See exactly why each answer is right or wrong</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">4.</span>
                <span>Track which fallacies you have mastered</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-300 text-center">
              Practice, not a test. Wrong answers show the app what to
              teach you next, and you can always try again.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={onStart} size="lg" className="flex-1">
              Start Training
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={onSkipTutorial} variant="outline" size="lg">
              Browse All Modes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
