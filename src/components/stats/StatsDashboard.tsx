import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Trophy, 
  Target,
  Flame,
  Calendar,
  BarChart3,
  AlertTriangle
} from "lucide-react";
import { UserProgress, getMasteryInfo } from "@/data/types";
import { enhancedFallacies, getAllCategories } from "@/data/enhancedData";

interface StatsDashboardProps {
  progress: UserProgress;
  getCategoryMastery: (category: string) => number;
  onPracticeFallacies: (names: string[]) => void;
}

export function StatsDashboard({ progress, getCategoryMastery, onPracticeFallacies }: StatsDashboardProps) {
  const weakest = useMemo(() => {
    return enhancedFallacies
      .map(f => ({ name: f.name, mastery: getMasteryInfo(progress.fallacyStats[f.name]) }))
      .filter(({ mastery }) => mastery.level === "learning")
      .sort((a, b) => a.mastery.percentage - b.mastery.percentage)
      .slice(0, 3);
  }, [progress.fallacyStats]);
  const categories = getAllCategories();
  
  const masteryGroups = useMemo(() => {
    const groups = {
      master: [] as typeof enhancedFallacies,
      proficient: [] as typeof enhancedFallacies,
      learning: [] as typeof enhancedFallacies,
      unseen: [] as typeof enhancedFallacies,
    };

    enhancedFallacies.forEach(fallacy => {
      const mastery = getMasteryInfo(progress.fallacyStats[fallacy.name]);
      groups[mastery.level].push(fallacy);
    });

    return groups;
  }, [progress.fallacyStats]);

  const overallMastery = useMemo(() => {
    const totalFallacies = enhancedFallacies.length;
    return (masteryGroups.master.length / totalFallacies) * 100;
  }, [masteryGroups.master.length]);

  const confusionPairs = useMemo(() => {
    const pairs: { fallacy1: string; fallacy2: string; count: number }[] = [];

    // "Struggle" counts both ways a player shows weakness: a one-shot miss
    // (challenge/daily) and a first attempt that needed a retry (training).
    // Counting only `incorrect` would ignore every training-mode miss.
    const struggles = (stats: UserProgress["fallacyStats"][string]) =>
      (stats.incorrect ?? 0) + (stats.attempts ?? []).filter(a => a > 1).length;

    // Find fallacies that are often confused with each other
    enhancedFallacies.forEach(fallacy => {
      const stats = progress.fallacyStats[fallacy.name];
      if (stats && struggles(stats) > stats.correctFirstTry) {
        fallacy.confusedWith.forEach(confused => {
          const existingPair = pairs.find(
            p => (p.fallacy1 === fallacy.name && p.fallacy2 === confused) ||
                 (p.fallacy1 === confused && p.fallacy2 === fallacy.name)
          );
          if (!existingPair) {
            pairs.push({ fallacy1: fallacy.name, fallacy2: confused, count: struggles(stats) });
          }
        });
      }
    });

    return pairs.sort((a, b) => b.count - a.count).slice(0, 3);
  }, [progress.fallacyStats]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Your Progress</h2>
        <p className="text-muted-foreground">
          Your stats at a glance
        </p>
      </div>

      {/* Next Up */}
      {weakest.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-medium mb-2">Practice these next:</p>
            <div className="flex flex-wrap gap-2">
              {weakest.map(({ name, mastery }) => (
                <button
                  key={name}
                  onClick={() => onPracticeFallacies([name])}
                  className="inline-flex items-center gap-1 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  {mastery.emoji} {name} ({Math.round(mastery.percentage)}%)
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{progress.totalQuestionsAnswered}</div>
            <div className="text-xs text-muted-foreground">Questions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-amber-500" />
            <div className="text-2xl font-bold">{masteryGroups.master.length}</div>
            <div className="text-xs text-muted-foreground">Mastered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{progress.streak.current}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{progress.sessionsCompleted}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Overall Mastery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Fallacies Mastered</span>
              <span className="font-medium">
                {masteryGroups.master.length} / {enhancedFallacies.length}
              </span>
            </div>
            <Progress value={overallMastery} className="h-3" />
          </div>

          <Separator />

          {/* Category Breakdown */}
          <div className="space-y-3">
            <p className="text-sm font-medium">By Category</p>
            {categories.map(category => {
              const mastery = getCategoryMastery(category);
              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{category}</span>
                    <span>{Math.round(mastery)}%</span>
                  </div>
                  <Progress value={mastery} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confusion Alerts */}
      {confusionPairs.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
              Common Confusions
            </CardTitle>
            <CardDescription>
              You might be mixing these up
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {confusionPairs.map((pair, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{pair.fallacy1}</span>
                  <span className="text-muted-foreground">↔</span>
                  <span className="font-medium">{pair.fallacy2}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Fallacy Lists */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fallacy Mastery</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="master" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto gap-1 p-1">
              <TabsTrigger value="master" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-2 leading-tight">
                <span className="flex flex-col items-center gap-0.5">
                  <span>🏆 Master</span>
                  <span className="text-[9px] sm:text-xs">({masteryGroups.master.length})</span>
                </span>
              </TabsTrigger>
              <TabsTrigger value="proficient" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-2 leading-tight">
                <span className="flex flex-col items-center gap-0.5">
                  <span>✅ Proficient</span>
                  <span className="text-[9px] sm:text-xs">({masteryGroups.proficient.length})</span>
                </span>
              </TabsTrigger>
              <TabsTrigger value="learning" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-2 leading-tight">
                <span className="flex flex-col items-center gap-0.5">
                  <span>📖 Learning</span>
                  <span className="text-[9px] sm:text-xs">({masteryGroups.learning.length})</span>
                </span>
              </TabsTrigger>
              <TabsTrigger value="unseen" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-2 leading-tight">
                <span className="flex flex-col items-center gap-0.5">
                  <span>❓ Unseen</span>
                  <span className="text-[9px] sm:text-xs">({masteryGroups.unseen.length})</span>
                </span>
              </TabsTrigger>
            </TabsList>

            {Object.entries(masteryGroups).map(([level, fallacies]) => (
              <TabsContent key={level} value={level}>
                <ScrollArea className="h-[200px] pr-4">
                  {fallacies.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No fallacies in this category yet
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {fallacies.map(fallacy => {
                        const stats = progress.fallacyStats[fallacy.name];
                        const mastery = getMasteryInfo(stats);
                        return (
                          <li 
                            key={fallacy.name}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{mastery.emoji}</span>
                              <span className="font-medium text-sm">{fallacy.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {fallacy.category}
                              </Badge>
                            </div>
                            {stats && stats.totalSeen > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {Math.round(mastery.percentage)}%
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
