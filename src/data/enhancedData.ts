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
  "Affective Fallacy": "Emotional Manipulation",

  "Appeal to Authority": "False Authority",

  "Appeal to Probability": "Faulty Logic",
  "Gambler's Fallacy": "Faulty Logic",
  "Non Sequitur": "Faulty Logic",
  "Black & White": "Faulty Logic",
  "Begging the Question": "Faulty Logic",
  "Denying the Antecedent": "Faulty Logic",
  "Affirming the Consequent": "Faulty Logic",
  "Fallacy Fallacy": "Faulty Logic",
  "Definist Fallacy": "Faulty Logic",
  "Continuum Fallacy": "Faulty Logic",
  "Fallacy of Composition": "Faulty Logic",
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


  "Scapegoat": `┌──────────────────────┐
│ A problem appears   │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Blame group B for it│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Real cause ignored  │
└─────────────────────┘`,

  "No True Scotsman": `┌──────────────────────┐
│ Always done this way│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Counterexample shown│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Not a TRUE member   │
└─────────────────────┘`,

  "Argument from Motive": `┌──────────────────────┐
│ A argues for claim X│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ A's motive questioned│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ So X is false       │
└─────────────────────┘`,

  "Appeal to Probability": `┌──────────────────────┐
│ X could happen      │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Might treated as will│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ So X will happen    │
└─────────────────────┘`,

  "Appeal to Tradition": `┌──────────────────────┐
│ Always done this way│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Age is the only proof│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ So keep doing it    │
└─────────────────────┘`,

  "Appeal to Popularity": `┌──────────────────────┐
│ Many believe X      │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Popularity as proof │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ So X is true        │
└─────────────────────┘`,

  "Appeal to Novelty": `┌──────────────────────┐
│ X is the newest thing│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Newness as merit    │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ So X is better      │
└─────────────────────┘`,

  "Cherry Picking": `┌──────────────────────┐
│ Evidence: A, B, C   │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Show only what fits │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Skewed conclusion   │
└─────────────────────┘`,

  "Texas Sharpshooter": `┌──────────────────────┐
│ Data scattered widely│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Circle drawn later  │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Called a pattern    │
└─────────────────────┘`,

  "Non Sequitur": `┌──────────────────────┐
│ Premise about A     │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Conclusion about B  │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ No logical bridge   │
└─────────────────────┘`,

  "Magical Thinking": `┌──────────────────────┐
│ A happens, then B   │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ No physical link    │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ A must have caused B│
└─────────────────────┘`,

  "Moving the Goalposts": `┌──────────────────────┐
│ A meets the demand  │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ New, stricter demand│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Never satisfied     │
└─────────────────────┘`,

  "Overgeneralization": `┌──────────────────────┐
│ A few cases seen    │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Assumed true for all│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Sweeping rule issued│
└─────────────────────┘`,

  "Affective Fallacy": `┌──────────────────────┐
│ X feels wrong       │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Feeling as evidence │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ So X is wrong       │
└─────────────────────┘`,

  "Proof of Non-existence": `┌──────────────────────┐
│ Prove X is NOT real │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ No disproof found   │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ So X is real        │
└─────────────────────┘`,

  "Nirvana Fallacy": `┌──────────────────────┐
│ Fix has some flaws  │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Perfect fix imagined│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ So reject the fix   │
└─────────────────────┘`,

  "Denying the Antecedent": `┌──────────────────────┐
│ If P, then Q        │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ P is false          │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ So Q is false       │
└─────────────────────┘`,

  "Affirming the Consequent": `┌──────────────────────┐
│ If P, then Q        │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Q is true           │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ So P is true        │
└─────────────────────┘`,

  "Fallacy Fallacy": `┌──────────────────────┐
│ Argument for X is bad│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Flaw pointed out    │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ So X is false       │
└─────────────────────┘`,

  "Equivocation": `┌──────────────────────┐
│ Term used in sense 1│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Premise accepted    │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Sense 2 in conclusion│
└─────────────────────┘`,

  "Continuum Fallacy": `┌──────────────────────┐
│ A and B differ slowly│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ No exact line drawn │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ So A equals B       │
└─────────────────────┘`,

  "Fallacy of Composition": `┌──────────────────────┐
│ Each part has trait T│
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Parts form a whole  │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Whole has trait T   │
└─────────────────────┘`,

  "Definist Fallacy": `┌──────────────────────┐
│ Term defined to win │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Debate rigged by it │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Opponent can't engage│
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
  "Ad Hominem": ["person", "character", "attack", "irrelevant", "argument", "not the point"],  "Straw Man": ["misrepresent", "distort", "exaggerate", "not what", "twist", "easier to attack"],  "Appeal to Authority": ["expert", "relevant", "qualified", "evidence", "credentials", "field"],  "Red Herring": ["distract", "divert", "irrelevant", "change subject", "avoid", "sidestep"],  "Tu Quoque": ["hypocrisy", "you too", "you also", "doesn't change", "still valid"],  "Appeal to Nature": ["natural", "unnatural", "doesn't mean", "good or bad", "naturalistic"],  "Gambler's Fallacy": ["independent", "probability", "due", "random", "past doesn't affect"],  "Black & White": ["false dilemma", "only two", "other options", "more choices", "spectrum"],  "Begging the Question": ["circular", "assume", "conclusion in premise", "presuppose"],  "Sunk-Cost Fallacy": ["already spent", "past investment", "future value", "cut losses"],  "Scapegoat": ["blame", "deflect", "not responsible", "target", "unfair"],  "No True Scotsman": ["redefine", "move definition", "exclude", "ad hoc", "protect claim"],  "Appeal to Tradition": ["always done", "old", "tradition", "doesn't prove", "past"],  "Appeal to Popularity": ["everyone", "popular", "bandwagon", "many people", "doesn't prove"],  "Cherry Picking": ["select", "ignore", "convenient", "incomplete", "biased sample"],  "Non Sequitur": ["doesn't follow", "unrelated", "no connection", "leap", "random"],  "Appeal to Novelty": ["new", "modern", "latest", "doesn't mean better", "recency"],  "Moving the Goalposts": ["change criteria", "new demand", "never satisfied", "shift"],  "Overgeneralization": ["one case", "all", "hasty", "sample too small", "stereotype"],  "Affective Fallacy": ["feel", "emotion", "gut", "intuition", "not evidence"],  "Nirvana Fallacy": ["perfect", "ideal", "imperfect solution", "better than nothing"],  "Appeal to Probability": ["could happen", "might", "possible", "not inevitable"],  "Texas Sharpshooter": ["pattern", "coincidence", "after the fact", "data mining"],  "Magical Thinking": ["superstition", "luck", "causation", "correlation"],  "Argument from Motive": ["motive", "reason", "doesn't affect truth", "bias"],  "Proof of Non-existence": ["can't prove negative", "absence of evidence", "burden of proof"],  "Denying the Antecedent": ["if then", "inverse", "not valid", "formal fallacy"],  "Affirming the Consequent": ["if then", "converse", "not valid", "formal fallacy"],  "Definist Fallacy": ["define", "rigged definition", "loaded", "circular definition"],  "Fallacy Fallacy": ["bad argument", "still true", "conclusion could be right"],  "Equivocation": ["multiple meanings", "shift meaning", "ambiguous", "word play"],  "Continuum Fallacy": ["no clear line", "gradual", "heap", "sorites"],  "Fallacy of Composition": ["part", "whole", "doesn't transfer", "individual vs group"],};

// Confusion pairs - fallacies often mistaken for each other
const confusionPairs: Record<string, string[]> = {
  "Ad Hominem": ["Tu Quoque", "Argument from Motive"],  "Tu Quoque": ["Ad Hominem", "Red Herring"],  "Straw Man": ["Red Herring", "Ad Hominem"],  "Red Herring": ["Straw Man", "Tu Quoque"],  "Black & White": ["Nirvana Fallacy", "Appeal to Probability"],  "Appeal to Authority": ["Appeal to Popularity", "Argument from Motive"],  "Appeal to Popularity": ["Appeal to Authority", "Appeal to Tradition"],  "Appeal to Tradition": ["Appeal to Nature", "Appeal to Popularity"],  "Appeal to Nature": ["Appeal to Tradition", "Affective Fallacy"],  "Cherry Picking": ["Texas Sharpshooter", "Overgeneralization"],  "Texas Sharpshooter": ["Cherry Picking", "Gambler's Fallacy"],  "Gambler's Fallacy": ["Appeal to Probability", "Texas Sharpshooter"],  "Appeal to Probability": ["Gambler's Fallacy", "Magical Thinking"],  "Denying the Antecedent": ["Affirming the Consequent", "Non Sequitur"],  "Affirming the Consequent": ["Denying the Antecedent", "Non Sequitur"],  "No True Scotsman": ["Definist Fallacy", "Moving the Goalposts"],  "Definist Fallacy": ["No True Scotsman", "Begging the Question"],  "Sunk-Cost Fallacy": ["Appeal to Tradition", "Nirvana Fallacy"],  "Nirvana Fallacy": ["Black & White", "Sunk-Cost Fallacy"],};

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
    "Ad Hominem": "A valid argument would address the actual claims made rather than the person's character. For example: 'Let's examine the specific points in this proposal one at a time.'",
    "Straw Man": "A valid approach would accurately represent the original argument. For example: 'If I understand correctly, you're saying X. Here's why I disagree with X specifically.'",
    "Appeal to Authority": "A valid appeal would cite experts with relevant expertise AND provide supporting evidence. For example: 'Climate scientists have found X, and here's the data that supports this claim.'",
    "Red Herring": "A valid response would directly address the original topic. For example: 'To answer your question about the environmental record specifically, emissions fell for three straight years.'",
    "Tu Quoque": "A valid response would address the criticism on its merits. For example: 'You make a fair point about my behavior. Let me explain or change it.'",
    "Appeal to Nature": "A valid argument would provide evidence about actual benefits or harms, rather than naturalness alone. For example: 'This treatment has been shown in studies to reduce swelling.'",
    "Gambler's Fallacy": "A valid understanding recognizes that each independent event has the same probability. For example: 'Each coin flip has a 50% chance regardless of previous results.'",
    "Black & White": "A valid argument acknowledges the range of options. For example: 'There are several approaches we could take, including A, B, and combinations of them.'",
    "Begging the Question": "A valid argument provides independent support for the conclusion. For example: 'X is true because of evidence Y and Z, which are separate from X.'",
    "Sunk-Cost Fallacy": "A valid decision focuses on future value, not past investment. For example: 'Regardless of what we've spent, what's the best use of our resources going forward?'",
    "Scapegoat": "A valid explanation traces the problem to its actual cause. For example: 'The outage came from the failed upgrade, not from the new team.'",
    "No True Scotsman": "A valid position states its criteria up front and accepts counterexamples. For example: 'By vegetarian I mean no meat at all; one bacon breakfast disproves my rule.'",
    "Argument from Motive": "A valid argument weighs the claim on its evidence. For example: 'Set aside who benefits and look at whether the data supports the claim.'",
    "Appeal to Probability": "A valid argument estimates how likely something is, rather than treating possibility as certainty. For example: 'It could happen; the base rate says roughly once a decade.'",
    "Appeal to Tradition": "A valid case shows the practice still works. For example: 'We keep the checklist because errors drop when we use it, not because it is old.'",
    "Appeal to Popularity": "A valid argument presents evidence rather than headcount. For example: 'Billions once believed the sun circled the earth; the evidence never did.'",
    "Appeal to Novelty": "A valid case names what the new option actually improves. For example: 'The new pipeline cuts our build time in half; here are both timings.'",
    "Cherry Picking": "A valid conclusion accounts for all the evidence. For example: 'Nine studies find no effect and two do; here is how to read that honestly.'",
    "Texas Sharpshooter": "A valid pattern is predicted before the data arrives, or confirmed on fresh data. For example: 'The cluster held when we tested it on next year's records.'",
    "Non Sequitur": "A valid conclusion follows from its premises. For example: 'The bridge failed inspection, so it stays closed to heavy loads until repaired.'",
    "Magical Thinking": "A valid causal claim names a mechanism. For example: 'The plant perked up because we changed the soil; here is the nutrient analysis.'",
    "Moving the Goalposts": "A valid disagreement fixes the standard in advance. For example: 'We agreed 70 percent was the bar, and the result met it.'",
    "Overgeneralization": "A valid generalization matches the size and spread of its sample. For example: 'Ask voters across several regions before claiming a national trend.'",
    "Affective Fallacy": "A valid argument separates feeling from evidence. For example: 'I dislike this plan, and here are two drawbacks it has regardless of my taste.'",
    "Proof of Non-existence": "A claim of absence needs a search that would have found it. For example: 'We checked the full registry; no such patent exists in it.'",
    "Nirvana Fallacy": "A valid comparison weighs real options against each other. For example: 'The policy cuts errors in half; perfection is unavailable, so we take the improvement.'",
    "Denying the Antecedent": "The valid form denies the consequent: 'If P then Q; not Q; therefore not P.' Dry streets really do mean it did not rain.",
    "Affirming the Consequent": "The valid form affirms the antecedent: 'If P then Q; P; therefore Q.' For example: 'It rained, so the street is wet.'",
    "Fallacy Fallacy": "A valid response separates the argument from its conclusion. For example: 'Your proof is weak, yet the claim may still hold; here is independent evidence.'",
    "Equivocation": "A valid argument keeps each term in one sense throughout. For example: 'By free I mean without cost here, not without restrictions.'",
    "Continuum Fallacy": "A valid argument accepts practical boundaries. For example: 'No exact line marks baldness, yet a head with zero hairs is bald.'",
    "Fallacy of Composition": "A valid argument tests the whole on its own terms. For example: 'Every runner is fast, but the relay still needs practice to win.'",
    "Definist Fallacy": "A valid definition is fair to both sides before the debate starts. For example: 'We define income the standard way, then argue the policy on those numbers.'",
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
    const description = (fallacy?.description ?? "").trim();
    if (option === question.correct_answer) {
      explanations[option] = `Correct. This argument is ${option}: ${description}`;
    } else if (fallacy) {
      explanations[option] = `${option} works differently: ${description} That pattern does not match this argument.`;
    } else {
      explanations[option] = "Not this one. Check how the argument supports its claim.";
    }
  });

  return explanations;
}

// Real-world frequency assessment
function assessFrequency(fallacyName: string): "common" | "moderate" | "rare" {
  const common = ["Ad Hominem", "Straw Man", "Appeal to Authority", "Red Herring", "Appeal to Popularity", "Black & White", "Tu Quoque"];
  const rare = ["Continuum Fallacy", "Affirming the Consequent", "Denying the Antecedent"];

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
