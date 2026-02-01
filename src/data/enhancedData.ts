import {
  EnhancedFallacy,
  EnhancedQuestion,
  FallacyCategory,
  ContextTag,
  Difficulty,
  Fallacy,
  QuizQuestion
} from "./types";
import fallaciesData from "./fallacies.json";
import questionsData from "./quiz-questions.json";

// Category mappings based on fallacy characteristics
const categoryMappings: Record<string, FallacyCategory> = {
  "Ad Hominem": "Personal Attack",
  "Tu Quoque": "Personal Attack",
  "Argument from Motive": "Personal Attack",
  "Scapegoat": "Personal Attack",

  "Straw Man": "Misrepresentation",
  "Red Herring": "Misrepresentation",
  "Cherry Picking": "Misrepresentation",
  "Equivocation": "Misrepresentation",
  "Moving the Goalposts": "Misrepresentation",

  "Appeal to Nature": "Emotional Manipulation",
  "Appeal to Tradition": "Emotional Manipulation",
  "Appeal to Popularity": "Emotional Manipulation",
  "Appeal to Novelty": "Emotional Manipulation",
  "Appeal to Closure": "Emotional Manipulation",
  "Affective Fallacy": "Emotional Manipulation",

  "Appeal to Authority": "False Authority",
  "Appeal to Money": "False Authority",

  "Appeal to Probability": "Faulty Logic",
  "Gambler's Fallacy": "Faulty Logic",
  "Non Sequitur": "Faulty Logic",
  "Black & White": "Faulty Logic",
  "Excluded Middle": "Faulty Logic",
  "Begging the Question": "Faulty Logic",
  "Denying the Antecedent": "Faulty Logic",
  "Affirming the Consequent": "Faulty Logic",
  "Conflicting Conditions": "Faulty Logic",
  "Fallacy Fallacy": "Faulty Logic",
  "Definist Fallacy": "Faulty Logic",
  "Suppressed Correlative": "Faulty Logic",
  "Continuum Fallacy": "Faulty Logic",
  "Fallacy of Composition": "Faulty Logic",
  "Homunculus Fallacy": "Faulty Logic",
  "Proof of Non-existence": "Faulty Logic",
  "Nirvana Fallacy": "Faulty Logic",

  "Texas Sharpshooter": "Causal Errors",
  "Magical Thinking": "Causal Errors",
  "Overgeneralization": "Causal Errors",
  "Sunk-Cost Fallacy": "Causal Errors",
  "No True Scotsman": "Misrepresentation",
};

// Structure diagrams for each fallacy
const structureDiagrams: Record<string, string> = {
  "Ad Hominem": `┌─────────────────────┐
│  Person A claims X  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Attack A's character│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ "Therefore X false" │
└─────────────────────┘`,

  "Straw Man": `┌─────────────────────┐
│  Person A claims X  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Distort X into Y    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Attack Y instead  │
└─────────────────────┘`,

  "Appeal to Authority": `┌─────────────────────┐
│ Authority says X    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ No relevant proof   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  "Therefore X true" │
└─────────────────────┘`,

  "Red Herring": `┌─────────────────────┐
│   Topic A raised    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Introduce Topic B   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Topic A forgotten   │
└─────────────────────┘`,

  "Appeal to Nature": `┌─────────────────────┐
│    X is natural     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Natural = Good      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  "Therefore X good" │
└─────────────────────┘`,

  "Tu Quoque": `┌─────────────────────┐
│  A criticizes B     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  "You do it too!"   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Criticism dismissed │
└─────────────────────┘`,

  "Gambler's Fallacy": `┌─────────────────────┐
│ Event happened N    │
│    times in a row   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ "It's due to change"│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Independent events  │
│  wrongly connected  │
└─────────────────────┘`,

  "Black & White": `┌─────────────────────┐
│  Only A or B exist  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Ignore C, D, E...  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Forced false choice│
└─────────────────────┘`,

  "Begging the Question": `┌─────────────────────┐
│    Assume X true    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Use X to prove X    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Circular logic    │
└─────────────────────┘`,

  "Sunk-Cost Fallacy": `┌─────────────────────┐
│  Already invested X │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ "Can't quit now"    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Past cost dictates  │
│  future decisions   │
└─────────────────────┘`,
};

// Default structure diagram for fallacies without specific ones
const defaultDiagram = `┌─────────────────────┐
│   Flawed premise    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Invalid reasoning  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Wrong conclusion    │
└─────────────────────┘`;

// Key terms for Feynman technique evaluation
const keyTermsMap: Record<string, string[]> = {
  "Ad Hominem": ["person", "character", "attack", "irrelevant", "argument", "not the point"],
  "Straw Man": ["misrepresent", "distort", "exaggerate", "not what", "twist", "easier to attack"],
  "Appeal to Authority": ["expert", "relevant", "qualified", "evidence", "credentials", "field"],
  "Red Herring": ["distract", "divert", "irrelevant", "change subject", "avoid", "sidestep"],
  "Tu Quoque": ["hypocrisy", "you too", "you also", "doesn't change", "still valid"],
  "Appeal to Nature": ["natural", "unnatural", "doesn't mean", "good or bad", "naturalistic"],
  "Gambler's Fallacy": ["independent", "probability", "due", "random", "past doesn't affect"],
  "Black & White": ["false dilemma", "only two", "other options", "more choices", "spectrum"],
  "Begging the Question": ["circular", "assume", "conclusion in premise", "presuppose"],
  "Sunk-Cost Fallacy": ["already spent", "past investment", "future value", "cut losses"],
  "Scapegoat": ["blame", "deflect", "not responsible", "target", "unfair"],
  "No True Scotsman": ["redefine", "move definition", "exclude", "ad hoc", "protect claim"],
  "Appeal to Tradition": ["always done", "old", "tradition", "doesn't prove", "past"],
  "Appeal to Popularity": ["everyone", "popular", "bandwagon", "many people", "doesn't prove"],
  "Cherry Picking": ["select", "ignore", "convenient", "incomplete", "biased sample"],
  "Non Sequitur": ["doesn't follow", "unrelated", "no connection", "leap", "random"],
  "Appeal to Money": ["expensive", "wealthy", "cost", "price", "doesn't mean quality"],
  "Appeal to Novelty": ["new", "modern", "latest", "doesn't mean better", "recency"],
  "Moving the Goalposts": ["change criteria", "new demand", "never satisfied", "shift"],
  "Overgeneralization": ["one case", "all", "hasty", "sample too small", "stereotype"],
  "Affective Fallacy": ["feel", "emotion", "gut", "intuition", "not evidence"],
  "Nirvana Fallacy": ["perfect", "ideal", "imperfect solution", "better than nothing"],
  "Appeal to Probability": ["could happen", "might", "possible", "not inevitable"],
  "Appeal to Closure": ["decide now", "uncertainty", "rush", "premature"],
  "Texas Sharpshooter": ["pattern", "coincidence", "after the fact", "data mining"],
  "Magical Thinking": ["superstition", "luck", "causation", "correlation"],
  "Argument from Motive": ["motive", "reason", "doesn't affect truth", "bias"],
  "Conflicting Conditions": ["contradiction", "self-refuting", "paradox", "inconsistent"],
  "Excluded Middle": ["false dilemma", "spectrum", "middle ground", "nuance"],
  "Proof of Non-existence": ["can't prove negative", "absence of evidence", "burden of proof"],
  "Denying the Antecedent": ["if then", "inverse", "not valid", "formal fallacy"],
  "Affirming the Consequent": ["if then", "converse", "not valid", "formal fallacy"],
  "Definist Fallacy": ["define", "rigged definition", "loaded", "circular definition"],
  "Suppressed Correlative": ["eliminate distinction", "false equivalence", "deny difference"],
  "Fallacy Fallacy": ["bad argument", "still true", "conclusion could be right"],
  "Equivocation": ["multiple meanings", "shift meaning", "ambiguous", "word play"],
  "Continuum Fallacy": ["no clear line", "gradual", "heap", "sorites"],
  "Fallacy of Composition": ["part", "whole", "doesn't transfer", "individual vs group"],
  "Homunculus Fallacy": ["explain with itself", "infinite regress", "circular explanation"],
};

// Confusion pairs - fallacies often mistaken for each other
const confusionPairs: Record<string, string[]> = {
  "Ad Hominem": ["Tu Quoque", "Argument from Motive"],
  "Tu Quoque": ["Ad Hominem", "Red Herring"],
  "Straw Man": ["Red Herring", "Ad Hominem"],
  "Red Herring": ["Straw Man", "Tu Quoque"],
  "Black & White": ["Excluded Middle", "Nirvana Fallacy"],
  "Excluded Middle": ["Black & White", "False Dilemma"],
  "Appeal to Authority": ["Appeal to Popularity", "Argument from Motive"],
  "Appeal to Popularity": ["Appeal to Authority", "Appeal to Tradition"],
  "Appeal to Tradition": ["Appeal to Nature", "Appeal to Popularity"],
  "Appeal to Nature": ["Appeal to Tradition", "Affective Fallacy"],
  "Cherry Picking": ["Texas Sharpshooter", "Overgeneralization"],
  "Texas Sharpshooter": ["Cherry Picking", "Gambler's Fallacy"],
  "Gambler's Fallacy": ["Appeal to Probability", "Texas Sharpshooter"],
  "Appeal to Probability": ["Gambler's Fallacy", "Magical Thinking"],
  "Denying the Antecedent": ["Affirming the Consequent", "Non Sequitur"],
  "Affirming the Consequent": ["Denying the Antecedent", "Non Sequitur"],
  "No True Scotsman": ["Definist Fallacy", "Moving the Goalposts"],
  "Definist Fallacy": ["No True Scotsman", "Begging the Question"],
  "Sunk-Cost Fallacy": ["Appeal to Tradition", "Nirvana Fallacy"],
  "Nirvana Fallacy": ["Black & White", "Sunk-Cost Fallacy"],
};

// Context detection based on question content
function detectContexts(question: string): ContextTag[] {
  const contexts: ContextTag[] = [];
  const q = question.toLowerCase();

  if (q.includes("politician") || q.includes("vote") || q.includes("senator") || q.includes("government") || q.includes("campaign") || q.includes("election") || q.includes("policy")) {
    contexts.push("Politics");
  }
  if (q.includes("social media") || q.includes("online") || q.includes("forum") || q.includes("post") || q.includes("viral") || q.includes("influencer")) {
    contexts.push("Social Media");
  }
  if (q.includes("advertis") || q.includes("commercial") || q.includes("marketing") || q.includes("product") || q.includes("brand") || q.includes("slogan") || q.includes("company")) {
    contexts.push("Advertising");
  }
  if (q.includes("scientist") || q.includes("study") || q.includes("research") || q.includes("evidence") || q.includes("expert") || q.includes("doctor")) {
    contexts.push("Science");
  }
  if (q.includes("friend") || q.includes("family") || q.includes("parent") || q.includes("relationship") || q.includes("partner") || q.includes("sibling")) {
    contexts.push("Relationships");
  }
  if (q.includes("business") || q.includes("company") || q.includes("ceo") || q.includes("employee") || q.includes("manager") || q.includes("profit") || q.includes("investment")) {
    contexts.push("Business");
  }

  return contexts.length > 0 ? contexts : ["Business"]; // Default to Business if no context detected
}

// Difficulty assessment based on question complexity
function assessDifficulty(question: QuizQuestion): Difficulty {
  const q = question.question.toLowerCase();
  const wordCount = q.split(/\s+/).length;

  // Check for complexity indicators
  const hasMultiplePeople = (q.match(/person [a-z]:|senator [a-z]:/gi) || []).length > 1;
  const hasNuancedScenario = wordCount > 50;
  const hasSimilarOptions = question.options.filter(opt =>
    opt.includes("Appeal") || opt.includes("Fallacy")
  ).length > 2;

  let score = 0;
  if (hasMultiplePeople) score++;
  if (hasNuancedScenario) score++;
  if (hasSimilarOptions) score++;
  if (wordCount > 40) score++;

  if (score >= 3) return 3;
  if (score >= 1) return 2;
  return 1;
}

// Generate valid argument version
function generateValidVersion(fallacy: Fallacy, question: string): string {
  const validVersionTemplates: Record<string, string> = {
    "Ad Hominem": "A valid argument would address the actual claims made rather than the person's character. For example: 'Let's examine the specific points in this proposal...'",
    "Straw Man": "A valid approach would accurately represent the original argument. For example: 'If I understand correctly, you're saying X. Here's why I disagree with X specifically...'",
    "Appeal to Authority": "A valid appeal would cite experts with relevant expertise AND provide supporting evidence. For example: 'Climate scientists have found X, and here's the data that supports this...'",
    "Red Herring": "A valid response would directly address the original topic. For example: 'To answer your question about the environmental record specifically...'",
    "Tu Quoque": "A valid response would address the criticism on its merits. For example: 'You make a fair point about my behavior. Let me explain or change it...'",
    "Appeal to Nature": "A valid argument would provide evidence about actual benefits or harms, not just naturalness. For example: 'This treatment has been shown in studies to...'",
    "Gambler's Fallacy": "A valid understanding recognizes that each independent event has the same probability. For example: 'Each coin flip has a 50% chance regardless of previous results.'",
    "Black & White": "A valid argument acknowledges the range of options. For example: 'There are several approaches we could take: A, B, C, or even combinations...'",
    "Begging the Question": "A valid argument provides independent support for the conclusion. For example: 'X is true because of evidence Y and Z, which are separate from X.'",
    "Sunk-Cost Fallacy": "A valid decision focuses on future value, not past investment. For example: 'Regardless of what we've spent, what's the best use of our resources going forward?'",
  };

  return validVersionTemplates[fallacy.name] ||
    `A valid argument would provide relevant evidence and sound reasoning rather than relying on ${fallacy.name.toLowerCase()}.`;
}

// Generate explanations for each option
function generateOptionExplanations(
  question: QuizQuestion,
  fallacies: Fallacy[]
): Record<string, string> {
  const explanations: Record<string, string> = {};
  const fallacyMap = new Map(fallacies.map(f => [f.name, f]));

  question.options.forEach(option => {
    const fallacy = fallacyMap.get(option);
    if (option === question.correct_answer) {
      explanations[option] = `Correct! This is ${option} because the argument ${fallacy?.description.toLowerCase()}...`;
    } else if (fallacy) {
      explanations[option] = `Not quite. ${option} would be if the argument ${fallacy.description.toLowerCase()}... But that's not what's happening here.`;
    } else {
      explanations[option] = `This isn't the right answer. Look more carefully at the structure of the argument.`;
    }
  });

  return explanations;
}

// Real-world frequency assessment
function assessFrequency(fallacyName: string): "common" | "moderate" | "rare" {
  const common = ["Ad Hominem", "Straw Man", "Appeal to Authority", "Red Herring", "Appeal to Popularity", "Black & White", "Tu Quoque"];
  const rare = ["Homunculus Fallacy", "Suppressed Correlative", "Continuum Fallacy", "Affirming the Consequent", "Denying the Antecedent"];

  if (common.includes(fallacyName)) return "common";
  if (rare.includes(fallacyName)) return "rare";
  return "moderate";
}

// Main enhancement functions
export function enhanceFallacies(fallacies: Fallacy[]): EnhancedFallacy[] {
  return fallacies.map(fallacy => ({
    ...fallacy,
    category: categoryMappings[fallacy.name] || "Faulty Logic",
    structureDiagram: structureDiagrams[fallacy.name] || defaultDiagram,
    realWorldFrequency: assessFrequency(fallacy.name),
    keyTerms: keyTermsMap[fallacy.name] || [],
    confusedWith: confusionPairs[fallacy.name] || [],
  }));
}

export function enhanceQuestions(questions: QuizQuestion[], fallacies: Fallacy[]): EnhancedQuestion[] {
  return questions.map((question, index) => ({
    ...question,
    id: `q_${question.fallacy_name.replace(/\s+/g, '_').toLowerCase()}_${index}`,
    difficulty: assessDifficulty(question),
    contexts: detectContexts(question.question),
    validVersion: generateValidVersion(
      fallacies.find(f => f.name === question.fallacy_name) || fallacies[0],
      question.question
    ),
    optionExplanations: generateOptionExplanations(question, fallacies),
  }));
}

// Export pre-enhanced data
export const enhancedFallacies = enhanceFallacies(fallaciesData as Fallacy[]);
export const enhancedQuestions = enhanceQuestions(questionsData as QuizQuestion[], fallaciesData as Fallacy[]);

// Helper functions
export function getFallacyByName(name: string): EnhancedFallacy | undefined {
  return enhancedFallacies.find(f => f.name === name);
}

export function getQuestionsByFallacy(fallacyName: string): EnhancedQuestion[] {
  return enhancedQuestions.filter(q => q.fallacy_name === fallacyName);
}

export function getQuestionsByCategory(category: FallacyCategory): EnhancedQuestion[] {
  const fallaciesInCategory = enhancedFallacies
    .filter(f => f.category === category)
    .map(f => f.name);
  return enhancedQuestions.filter(q => fallaciesInCategory.includes(q.fallacy_name));
}

export function getQuestionsByContext(context: ContextTag): EnhancedQuestion[] {
  return enhancedQuestions.filter(q => q.contexts.includes(context));
}

export function getQuestionsByDifficulty(difficulty: Difficulty): EnhancedQuestion[] {
  return enhancedQuestions.filter(q => q.difficulty === difficulty);
}

export function getAllCategories(): FallacyCategory[] {
  return ["Personal Attack", "Faulty Logic", "Emotional Manipulation", "Misrepresentation", "False Authority", "Causal Errors"];
}

export function getAllContexts(): ContextTag[] {
  return ["Politics", "Social Media", "Advertising", "Science", "Relationships", "Business"];
}
