// Core data types for the Logical Fallacy Training Simulator

export type FallacyCategory = 
  | "Personal Attack"
  | "Faulty Logic"
  | "Emotional Manipulation"
  | "Misrepresentation"
  | "False Authority"
  | "Causal Errors";

export type ContextTag = 
  | "Politics"
  | "Social Media"
  | "Advertising"
  | "Science"
  | "Relationships"
  | "Business";

export type Difficulty = 1 | 2 | 3;

export type LearningMode = "training" | "category" | "context" | "challenge";

export interface Fallacy {
  name: string;
  description: string;
  examples: string[];
}

export interface EnhancedFallacy extends Fallacy {
  category: FallacyCategory;
  structureDiagram: string;
  realWorldFrequency: "common" | "moderate" | "rare";
  keyTerms: string[];
  confusedWith: string[];
}

export interface QuizQuestion {
  fallacy_name: string;
  question: string;
  options: string[];
  correct_answer: string;
}

export interface EnhancedQuestion extends QuizQuestion {
  id: string;
  difficulty: Difficulty;
  contexts: ContextTag[];
  validVersion: string;
  optionExplanations: Record<string, string>;
}

// User progress and statistics
export interface FallacyStats {
  totalSeen: number;
  correctFirstTry: number;
  correctAfterRetry: number;
  incorrect: number;
  lastSeen: number | null;
  attempts: number[];
}

export interface UserProgress {
  currentDifficulty: Difficulty;
  fallacyStats: Record<string, FallacyStats>;
  sessionHistory: SessionRecord[];
  streak: StreakData;
  preferences: UserPreferences;
  lastUpdated: number;
  totalQuestionsAnswered: number;
  sessionsCompleted: number;
  correctStreak: number;
  recentResults: boolean[];
  seenQuestionIds: string[];
  isFirstTime: boolean;
}

export interface SessionRecord {
  date: number;
  mode: LearningMode;
  questionsAnswered: number;
  correctFirstTry: number;
  difficultyLevel: Difficulty;
  duration: number;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string | null;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  showOnboarding: boolean;
}

// Session state
export interface SessionState {
  mode: LearningMode;
  currentQuestionIndex: number;
  questions: EnhancedQuestion[];
  answers: AnswerRecord[];
  startTime: number;
  categoryFilter?: FallacyCategory;
  contextFilter?: ContextTag;
  timer?: number;
}

export interface AnswerRecord {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  attempts: number;
  timeSpent?: number;
}

// Feynman challenge
export interface FeynmanChallenge {
  question: EnhancedQuestion;
  userExplanation: string;
  keywordMatches: string[];
  score: number;
  feedback: string;
}

// Mastery levels
export type MasteryLevel = "master" | "proficient" | "learning" | "unseen";

export interface MasteryInfo {
  level: MasteryLevel;
  percentage: number;
  emoji: string;
}

export function getMasteryInfo(stats: FallacyStats | undefined): MasteryInfo {
  if (!stats || stats.totalSeen === 0) {
    return { level: "unseen", percentage: 0, emoji: "❓" };
  }
  
  const percentage = ((stats.correctFirstTry + stats.correctAfterRetry * 0.5) / stats.totalSeen) * 100;
  
  if (percentage >= 90) {
    return { level: "master", percentage, emoji: "🏆" };
  } else if (percentage >= 70) {
    return { level: "proficient", percentage, emoji: "✅" };
  } else {
    return { level: "learning", percentage, emoji: "📖" };
  }
}
