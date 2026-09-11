import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Trophy, Target, Clock, RotateCcw, Home, TrendingUp, Zap } from "lucide-react";
import { LearningMode } from "@/data/types";

interface SessionSummaryProps {
  stats: {
    correctFirstTry: number;
    correctAfterRetry: number;
    totalCorrect: number;
    totalAnswered: number;
    totalQuestions: number;
    accuracy: number;
    duration: number;
  };
  mode: LearningMode;
  onRestart: () => void;
  onHome: () => void;
  streak: number;
  difficultyLevel: number;
}

export function SessionSummary({ 
  stats, 
  mode, 
  onRestart, 
  onHome,
  streak,
  difficultyLevel
}: SessionSummaryProps) {
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPerformanceMessage = () => {
    const percentage = stats.accuracy;
    if (percentage >= 90) return { message: "Outstanding! 🏆", emoji: "🎉" };
    if (percentage >= 70) return { message: "Great work! 👏", emoji: "💪" };
    if (percentage >= 50) return { message: "Good effort! 📚", emoji: "🌟" };
    return { message: "Keep practicing! 💪", emoji: "📖" };
  };

  const performance = getPerformanceMessage();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 text-6xl">{performance.emoji}</div>
        <CardTitle className="text-2xl">{performance.message}</CardTitle>
        <CardDescription>
          {mode === "challenge" ? "Challenge Mode" : "Training Session"} Complete
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{stats.totalCorrect}/{stats.totalQuestions}</div>
            <div className="text-xs text-muted-foreground">Correct</div>
          </div>
          
          <div className="text-center p-4 bg-muted rounded-lg">
            <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{stats.correctFirstTry}</div>
            <div className="text-xs text-muted-foreground">First Try</div>
          </div>
          
          <div className="text-center p-4 bg-muted rounded-lg">
            <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{formatDuration(stats.duration)}</div>
            <div className="text-xs text-muted-foreground">Duration</div>
          </div>
          
          <div className="text-center p-4 bg-muted rounded-lg">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-amber-500" />
            <div className="text-2xl font-bold">{Math.round(stats.accuracy)}%</div>
            <div className="text-xs text-muted-foreground">Accuracy</div>
          </div>
        </div>

        <Separator />

        {/* Accuracy Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Session Accuracy</span>
            <span className="font-medium">{Math.round(stats.accuracy)}%</span>
          </div>
          <Progress value={stats.accuracy} className="h-3" />
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-primary/10 rounded-lg">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="font-medium">Level {difficultyLevel}</div>
            <div className="text-xs text-muted-foreground">Current Difficulty</div>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-lg">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <div className="font-medium">{streak} {streak === 1 ? "day" : "days"}</div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>
        </div>

        {/* Breakdown */}
        {stats.correctAfterRetry > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            {stats.correctFirstTry} correct on first try, {stats.correctAfterRetry} after retrying
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onRestart} className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            Train Again
          </Button>
          <Button onClick={onHome} variant="outline" className="flex-1">
            <Home className="mr-2 h-4 w-4" />
            Back to Menu
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
