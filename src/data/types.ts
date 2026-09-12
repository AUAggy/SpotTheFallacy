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
  | "Business"
  | "Entertainment"
  | "Gaming"
  | "School"
  | "Everyday life";

export type Difficulty = 1 | 2 | 3;

export type LearningMode = "training" | "category" | "context" | "challenge" | "daily";

export interface DailyRecord {
  date: string;
  score: number;
  total: number;
}

export interface Fallacy {
  name: string;
  description: string;
  examples: string[];
}

export interface EnhancedFallacy extends Fallacy {
  category: FallacyCategory;
  aliases?: string[];
  zinger?: string;
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
  /** result of the most recent answer, for weak-spot weighting */
  lastAttemptCorrect?: boolean;
}

export interface UserProgress {
  schemaVersion: number;
  fallacyStats: Record<string, FallacyStats>;
  sessionHistory: SessionRecord[];
  streak: StreakData;
  preferences: UserPreferences;
  lastUpdated: number;
  totalQuestionsAnswered: number;
  sessionsCompleted: number;
  correctStreak: number;
  /**
   * Name of the fallacy that just crossed into mastery, for the stamp.
   * Never persisted: it is cleared before every localStorage write, so a
   * returning player cannot replay last session's celebration.
   */
  lastMasteryUp: string | null;
  daily: { lastPlayedDate: string | null; history: DailyRecord[] };
  isFirstTime: boolean;
}

export interface SessionRecord {
  date: number;
  mode: LearningMode;
  questionsAnswered: number;
  correctFirstTry: number;
  mastered?: number;
  duration: number;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string | null;
}

export interface UserPreferences {
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
  /** one attempt per question (challenge, daily) */
  oneShot?: boolean;
  /** short session: skip the Feynman interstitial */
  quick?: boolean;
  timer?: number;
}

export interface AnswerRecord {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  attempts: number;
  timeSpent?: number;
}

/** Result of one answer submission. `duplicate` means it was ignored. */
export interface SubmitResult {
  isCorrect: boolean;
  attempts: number;
  canRetry: boolean;
  duplicate?: boolean;
}

/**
 * The reflective prompt comes back every third consecutive first-try correct
 * answer. This is the pure rule; evaluate it against the streak INCLUDING the
 * answer just given, never against the pre-answer value.
 */
export function isFeynmanDue(correctStreak: number): boolean {
  return correctStreak >= 3 && correctStreak % 3 === 0;
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
