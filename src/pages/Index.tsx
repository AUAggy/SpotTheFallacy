import { useState } from "react";
import {
  LearningMode,
  FallacyCategory,
  ContextTag
} from "@/data/types";
import { useProgress } from "@/hooks/useProgress";
import { ModeSelection } from "@/components/training/ModeSelection";
import { TrainingSession } from "@/components/training/TrainingSession";
import { WelcomeScreen } from "@/components/training/WelcomeScreen";
import { StatsDashboard } from "@/components/stats/StatsDashboard";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Settings,
  Brain,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "next-themes";

type View = "welcome" | "menu" | "training" | "stats" | "settings";

const Index = () => {
  const { progress, completeOnboarding, getCategoryMastery, getMasteredFallacies } = useProgress();
  const { theme, setTheme } = useTheme();
  
  const [currentView, setCurrentView] = useState<View>(
    progress.isFirstTime ? "welcome" : "menu"
  );
  const [activeMode, setActiveMode] = useState<LearningMode | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<FallacyCategory | undefined>();
  const [contextFilter, setContextFilter] = useState<ContextTag | undefined>();
  const [questionCount, setQuestionCount] = useState<number | undefined>();
  const [fallacyFilter, setFallacyFilter] = useState<string[] | undefined>();
  const today = new Date().toISOString().slice(0, 10);
  const dailyDone = progress.daily.lastPlayedDate === today;
  const dailyToday = progress.daily.history.find(h => h.date === today);

  const handleStartTraining = (
    mode: LearningMode,
    category?: FallacyCategory,
    context?: ContextTag
  ) => {
    setActiveMode(mode);
    setCategoryFilter(category);
    setContextFilter(context);
    setCurrentView("training");
  };

  const handleExitTraining = () => {
    setActiveMode(null);
    setCategoryFilter(undefined);
    setContextFilter(undefined);
    setQuestionCount(undefined);
    setFallacyFilter(undefined);
    setCurrentView("menu");
  };

  const handleQuickRound = () => {
    setQuestionCount(3);
    setFallacyFilter(undefined);
    setActiveMode("training");
    setCurrentView("training");
  };

  const handlePracticeFallacies = (names: string[]) => {
    setQuestionCount(Math.min(10, names.length * 3));
    setFallacyFilter(names);
    setActiveMode("training");
    setCurrentView("training");
  };

  const handleWelcomeStart = () => {
    completeOnboarding();
    handleStartTraining("training");
  };

  const handleWelcomeSkip = () => {
    completeOnboarding();
    setCurrentView("menu");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Render based on current view
  if (currentView === "training" && activeMode) {
    return (
      <TrainingSession
        mode={activeMode}
        categoryFilter={categoryFilter}
        contextFilter={contextFilter}
        questionCount={questionCount}
        fallacyFilter={fallacyFilter}
        onExit={handleExitTraining}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14 px-4">
          <Button
            variant="ghost"
            size="sm"
            className="font-semibold"
            onClick={() => setCurrentView("menu")}
          >
            <Brain className="h-5 w-5 mr-2 text-primary" />
            Spot The Fallacy
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant={currentView === "stats" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCurrentView(currentView === "stats" ? "menu" : "stats")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Stats</span>
            </Button>
            <Button
              variant={currentView === "settings" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCurrentView(currentView === "settings" ? "menu" : "settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8 md:py-12 flex-1">
        {currentView === "welcome" && (
          <WelcomeScreen
            onStart={handleWelcomeStart}
            onSkipTutorial={handleWelcomeSkip}
          />
        )}

        {currentView === "menu" && (
          <ModeSelection
            onSelectMode={handleStartTraining}
            answeredCount={progress.totalQuestionsAnswered}
            masteredCount={getMasteredFallacies().length}
            streak={progress.streak.current}
            dailyDone={dailyDone}
            dailyScore={dailyToday ? { score: dailyToday.score, total: dailyToday.total } : undefined}
            onQuickRound={handleQuickRound}
          />
        )}

        {currentView === "stats" && (
          <StatsDashboard
            progress={progress}
            getCategoryMastery={getCategoryMastery}
            onPracticeFallacies={handlePracticeFallacies}
          />
        )}

        {currentView === "settings" && (
          <SettingsPanel onBack={() => setCurrentView("menu")} />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
