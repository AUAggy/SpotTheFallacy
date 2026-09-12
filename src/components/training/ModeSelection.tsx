import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Layers, 
  Globe2, 
  Zap, 
  BookOpen,
  CalendarCheck,
  Timer,
  ArrowRight
} from "lucide-react";
import { LearningMode, FallacyCategory, ContextTag } from "@/data/types";
import { getAllCategories, getAllContexts } from "@/data/enhancedData";

interface ModeSelectionProps {
  onSelectMode: (
    mode: LearningMode, 
    categoryFilter?: FallacyCategory, 
    contextFilter?: ContextTag
  ) => void;
  answeredCount: number;
  masteredCount: number;
  streak: number;
  /** true when today's daily is already played (ISO date match) */
  dailyDone: boolean;
  dailyScore?: { score: number; total: number };
  onQuickRound: () => void;
}

export function ModeSelection({ onSelectMode, answeredCount, masteredCount, streak, dailyDone, dailyScore, onQuickRound }: ModeSelectionProps) {
  const today = new Date().toISOString().slice(0, 10);
  const categories = getAllCategories();
  const contexts = getAllContexts();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Welcome message */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Spot The Fallacy
        </h1>
        <p className="text-muted-foreground text-lg">
          Train your eye for bad arguments
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <Badge variant="outline" className="text-sm py-1 px-3">
            {answeredCount} answered
          </Badge>
          <Badge variant="outline" className="text-sm py-1 px-3">
            {masteredCount} mastered
          </Badge>
          {streak > 0 && (
            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-sm py-1 px-3">
              🔥 {streak} {streak === 1 ? "day" : "days"} streak
            </Badge>
          )}
        </div>
      </div>

      {/* Main Modes */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Training Mode */}
        <Card
          className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group flex flex-col"
          onClick={() => onSelectMode("training")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  Training Mode
                </CardTitle>
                <CardDescription>Recommended</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground mb-4">
              Questions adapt to your accuracy: answer well and they get
              harder; struggle and they ease off.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              <li>• 10 questions per session</li>
              <li>• An explanation for every answer</li>
              <li>• Extra practice on your weak spots</li>
            </ul>
            <Button className="w-full mt-auto" variant="secondary">
              Start Training
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Challenge Mode */}
        <Card
          className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group flex flex-col"
          onClick={() => onSelectMode("challenge")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  Challenge Mode
                </CardTitle>
                <CardDescription>Hardest questions, timed</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground mb-4">
              Questions you haven't mastered. Timed. One shot. No retries.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              <li>• 30 seconds per question</li>
              <li>• Every session score saved to your history</li>
              <li>• One attempt per question</li>
            </ul>
            <Button className="w-full mt-auto" variant="secondary">
              Take the Challenge
              <Zap className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Daily + Quick rounds */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card
          className={dailyDone ? "opacity-70" : "cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg"}
          onClick={() => { if (!dailyDone) onSelectMode("daily"); }}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Today's 5</p>
              {dailyDone && dailyScore ? (
                <p className="text-xs text-muted-foreground">
                  Done: {dailyScore.score}/{dailyScore.total}. Come back tomorrow!
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  5 questions, same set for everyone, one attempt
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg"
          onClick={onQuickRound}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
              <Timer className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Quick Round</p>
              <p className="text-xs text-muted-foreground">3 questions, about a minute</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Focus */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Category Focus</CardTitle>
              <CardDescription>Master one category at a time</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant="outline"
                className="h-auto min-h-[3rem] py-2 px-2 sm:px-4 text-left justify-start whitespace-normal"
                onClick={() => onSelectMode("category", category)}
              >
                <BookOpen className="h-4 w-4 mr-1 sm:mr-2 shrink-0 self-start mt-0.5" />
                <span className="text-xs sm:text-sm leading-tight">{category}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Context Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Context Focus</CardTitle>
              <CardDescription>Practice fallacies in specific contexts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {contexts.map(context => (
              <Button
                key={context}
                variant="outline"
                className="h-auto py-3 px-4 text-left justify-start"
                onClick={() => onSelectMode("context", undefined, context)}
              >
                <Globe2 className="h-4 w-4 mr-2 shrink-0" />
                <span className="text-sm">{context}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
