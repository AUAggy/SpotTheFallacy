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
// Category mappings based on fallacy characteristics
const categoryMappings: Record<string, FallacyCategory> = {
  "Ad Hominem": "Personal Attack",
  "Straw Man": "Misrepresentation",
  "Scapegoat": "Personal Attack",
  "No True Scotsman": "Misrepresentation",
  "Tu Quoque": "'You do it too' is not a counterargument; it's a complaint about hypocrisy.",
  "Argument from Motive": "Personal Attack",
  "Red Herring": "Misrepresentation",
  "Appeal to Nature": "Emotional Manipulation",
  "Appeal to Authority": "False Authority",
  "Appeal to Probability": "Faulty Logic",
  "Appeal to Tradition": "Emotional Manipulation",
  "Appeal to Popularity": "Half the planet once thought the sun orbited us. Majority vote lost.",
  "Appeal to Novelty": "Emotional Manipulation",
  "Cherry Picking": "Misrepresentation",
  "Gambler's Fallacy": "Faulty Logic",
  "Texas Sharpshooter": "Causal Errors",
  "Non Sequitur": "Faulty Logic",
  "Magical Thinking": "Causal Errors",
  "Moving the Goalposts": "Misrepresentation",
  "Overgeneralization": "Causal Errors",
  "Appeal to Emotion": "Emotional Manipulation",
  "False Dilemma": "Faulty Logic",
  "Appeal to Ignorance": "You searched the attic and found nothing. That proves the attic is empty, right?",
  "Sunk-Cost Fallacy": "Causal Errors",
  "Nirvana Fallacy": "Faulty Logic",
  "Begging the Question": "Faulty Logic",
  "Denying the Antecedent": "No rain means dry streets. It doesn't mean the sky swore off water forever.",
  "Definist Fallacy": "Faulty Logic",
  "Affirming the Consequent": "Faulty Logic",
  "Fallacy Fallacy": "Faulty Logic",
  "Equivocation": "Misrepresentation",
  "Continuum Fallacy": "Faulty Logic",
  "Fallacy of Composition": "Faulty Logic",
  "Slippery Slope": "Causal Errors",
  "Appeal to Fear": "Emotional Manipulation",
  "Argument to Moderation": "Faulty Logic",
  "Post Hoc": "Causal Errors",
  "Loaded Question": "Faulty Logic",
  "Guilt by Association": "Personal Attack",
  "Motte-and-Bailey": "Misrepresentation",
  "Appeal to AI Authority": "False Authority",
  "Manufactured Consensus": "Emotional Manipulation",
  "Fallacy of Division": "Faulty Logic",
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
  "Appeal to Emotion": `┌──────────────────────┐
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
  "False Dilemma": `┌─────────────────────┐
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
  "Appeal to Ignorance": `┌──────────────────────┐
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
  "Slippery Slope": `┌────────────────────────┐
│ One small step taken  │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Unproven event chain  │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Disaster declared     │
└───────────────────────┘`,
  "Appeal to Fear": `┌────────────────────────┐
│ Scary outcome painted │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Fear replaces evidence│
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Claim accepted        │
└───────────────────────┘`,
  "Argument to Moderation": `┌────────────────────────┐
│ Two sides argued      │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Split the difference  │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Midpoint called true  │
└───────────────────────┘`,
  "Post Hoc": `┌────────────────────────┐
│ A happens, then B     │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Other causes ignored  │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ A blamed for B        │
└───────────────────────┘`,
  "Loaded Question": `┌────────────────────────┐
│ Question hides a claim│
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Any answer looks guilty│
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Assumption 'proven'   │
└───────────────────────┘`,
  "Guilt by Association": `┌────────────────────────┐
│ Group B backs X       │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ B is disliked         │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ So X is rejected      │
└───────────────────────┘`,
  "Motte-and-Bailey": `┌────────────────────────┐
│ Bold claim made       │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Pressed for evidence  │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Retreat to safe claim │
└───────────────────────┘`,
  "Appeal to AI Authority": `┌────────────────────────┐
│ The AI says X         │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Reliability unproven  │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ X treated as fact     │
└───────────────────────┘`,
  "Manufactured Consensus": `┌────────────────────────┐
│ Fake crowd created    │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Agreement looks huge  │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Doubters give in      │
└───────────────────────┘`,
  "Fallacy of Division": `┌────────────────────────┐
│ Whole has trait T     │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Parts examined        │
└────┬──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Each part called T    │
└───────────────────────┘`,
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
  "Ad Hominem": [
    "person",
    "character",
    "attack",
    "irrelevant",
    "argument",
    "not the point"
],
  "Straw Man": [
    "misrepresent",
    "distort",
    "exaggerate",
    "not what",
    "twist",
    "easier to attack"
],
  "Scapegoat": [
    "blame",
    "deflect",
    "not responsible",
    "target",
    "unfair"
],
  "No True Scotsman": [
    "redefine",
    "move definition",
    "exclude",
    "ad hoc",
    "protect claim"
],
  "Tu Quoque": [
    "hypocrisy",
    "you too",
    "you also",
    "doesn't change",
    "still valid"
],
  "Argument from Motive": [
    "motive",
    "reason",
    "doesn't affect truth",
    "bias"
],
  "Red Herring": [
    "distract",
    "divert",
    "irrelevant",
    "change subject",
    "avoid",
    "sidestep"
],
  "Appeal to Nature": [
    "natural",
    "unnatural",
    "doesn't mean",
    "good or bad",
    "naturalistic"
],
  "Appeal to Authority": [
    "expert",
    "relevant",
    "qualified",
    "evidence",
    "credentials",
    "field"
],
  "Appeal to Probability": [
    "could happen",
    "might",
    "possible",
    "not inevitable"
],
  "Appeal to Tradition": [
    "always done",
    "old",
    "tradition",
    "doesn't prove",
    "past"
],
  "Appeal to Popularity": [
    "everyone",
    "popular",
    "bandwagon",
    "many people",
    "doesn't prove"
],
  "Appeal to Novelty": [
    "new",
    "modern",
    "latest",
    "doesn't mean better",
    "recency"
],
  "Cherry Picking": [
    "select",
    "ignore",
    "convenient",
    "incomplete",
    "biased sample"
],
  "Gambler's Fallacy": [
    "independent",
    "probability",
    "due",
    "random",
    "past doesn't affect"
],
  "Texas Sharpshooter": [
    "pattern",
    "coincidence",
    "after the fact",
    "data mining"
],
  "Non Sequitur": [
    "doesn't follow",
    "unrelated",
    "no connection",
    "leap",
    "random"
],
  "Magical Thinking": [
    "superstition",
    "luck",
    "causation",
    "correlation"
],
  "Moving the Goalposts": [
    "change criteria",
    "new demand",
    "never satisfied",
    "shift"
],
  "Overgeneralization": [
    "one case",
    "all",
    "hasty",
    "sample too small",
    "stereotype"
],
  "Appeal to Emotion": [
    "feel",
    "emotion",
    "gut",
    "intuition",
    "not evidence"
],
  "False Dilemma": [
    "false dilemma",
    "only two",
    "other options",
    "more choices",
    "spectrum"
],
  "Appeal to Ignorance": [
    "can't prove negative",
    "absence of evidence",
    "burden of proof"
],
  "Sunk-Cost Fallacy": [
    "already spent",
    "past investment",
    "future value",
    "cut losses"
],
  "Nirvana Fallacy": [
    "perfect",
    "ideal",
    "imperfect solution",
    "better than nothing"
],
  "Begging the Question": [
    "circular",
    "assume",
    "conclusion in premise",
    "presuppose"
],
  "Denying the Antecedent": [
    "if then",
    "inverse",
    "not valid",
    "formal fallacy"
],
  "Definist Fallacy": [
    "define",
    "rigged definition",
    "loaded",
    "circular definition"
],
  "Affirming the Consequent": [
    "if then",
    "converse",
    "not valid",
    "formal fallacy"
],
  "Fallacy Fallacy": [
    "bad argument",
    "still true",
    "conclusion could be right"
],
  "Equivocation": [
    "multiple meanings",
    "shift meaning",
    "ambiguous",
    "word play"
],
  "Continuum Fallacy": [
    "no clear line",
    "gradual",
    "heap",
    "sorites"
],
  "Fallacy of Composition": [
    "part",
    "whole",
    "doesn't transfer",
    "individual vs group"
],
  "Slippery Slope": [
    "chain reaction",
    "small step",
    "cascade",
    "extreme outcome",
    "unproven chain"
],
  "Appeal to Fear": [
    "fear",
    "threat",
    "scare tactic",
    "danger",
    "intimidation"
],
  "Argument to Moderation": [
    "middle ground",
    "compromise",
    "moderation",
    "halfway",
    "split the difference"
],
  "Post Hoc": [
    "after this",
    "cause",
    "sequence",
    "coincidence",
    "because of"
],
  "Loaded Question": [
    "presuppose",
    "assumption",
    "trap",
    "loaded",
    "entrapment"
],
  "Guilt by Association": [
    "association",
    "guilt",
    "group",
    "company keeps",
    "linked to"
],
  "Motte-and-Bailey": [
    "retreat",
    "bold claim",
    "safe claim",
    "walk back",
    "reposition"
],
  "Appeal to AI Authority": [
    "AI",
    "algorithm",
    "chatbot",
    "automation",
    "model"
],
  "Manufactured Consensus": [
    "bots",
    "fake reviews",
    "astroturf",
    "paid actors",
    "artificial support"
],
  "Fallacy of Division": [
    "whole to part",
    "each member",
    "division",
    "distribute",
    "parts share"
],
};

// Confusion pairs - fallacies often mistaken for each other
const confusionPairs: Record<string, string[]> = {
  "Ad Hominem": [
    "Tu Quoque",
    "Argument from Motive",
    "Guilt by Association"
],
  "Straw Man": [
    "Red Herring",
    "Ad Hominem"
],
  "No True Scotsman": [
    "Definist Fallacy",
    "Moving the Goalposts"
],
  "Tu Quoque": [
    "Ad Hominem",
    "Red Herring"
],
  "Red Herring": [
    "Straw Man",
    "Tu Quoque"
],
  "Appeal to Nature": [
    "Appeal to Tradition",
    "Appeal to Emotion"
],
  "Appeal to Authority": [
    "Appeal to Popularity",
    "Argument from Motive",
    "Appeal to AI Authority"
],
  "Appeal to Probability": [
    "Gambler's Fallacy",
    "Magical Thinking",
    "Slippery Slope"
],
  "Appeal to Tradition": [
    "Appeal to Nature",
    "Appeal to Popularity"
],
  "Appeal to Popularity": [
    "Appeal to Authority",
    "Appeal to Tradition",
    "Manufactured Consensus"
],
  "Cherry Picking": [
    "Texas Sharpshooter",
    "Overgeneralization"
],
  "Gambler's Fallacy": [
    "Appeal to Probability",
    "Texas Sharpshooter"
],
  "Texas Sharpshooter": [
    "Cherry Picking",
    "Gambler's Fallacy"
],
  "Appeal to Emotion": [
    "Appeal to Fear",
    "Appeal to Nature"
],
  "False Dilemma": [
    "Nirvana Fallacy",
    "Appeal to Probability"
],
  "Sunk-Cost Fallacy": [
    "Appeal to Tradition",
    "Nirvana Fallacy"
],
  "Nirvana Fallacy": [
    "False Dilemma",
    "Sunk-Cost Fallacy"
],
  "Denying the Antecedent": [
    "Affirming the Consequent",
    "Non Sequitur"
],
  "Definist Fallacy": [
    "No True Scotsman",
    "Begging the Question"
],
  "Affirming the Consequent": [
    "Denying the Antecedent",
    "Non Sequitur"
],
  "Slippery Slope": [
    "Appeal to Probability",
    "Post Hoc",
    "Appeal to Fear"
],
  "Appeal to Fear": [
    "Appeal to Emotion",
    "Manufactured Consensus"
],
  "Argument to Moderation": [
    "False Dilemma",
    "Nirvana Fallacy"
],
  "Post Hoc": [
    "Magical Thinking",
    "Texas Sharpshooter",
    "Slippery Slope"
],
  "Loaded Question": [
    "Begging the Question",
    "Straw Man"
],
  "Guilt by Association": [
    "Ad Hominem",
    "Argument from Motive",
    "Scapegoat"
],
  "Motte-and-Bailey": [
    "Equivocation",
    "Moving the Goalposts"
],
  "Appeal to AI Authority": [
    "Appeal to Authority",
    "Appeal to Novelty"
],
  "Manufactured Consensus": [
    "Appeal to Popularity",
    "Appeal to Fear"
],
  "Fallacy of Division": [
    "Fallacy of Composition",
    "Overgeneralization"
],
};

// Colloquial and historical alternate names so recognition transfers both ways

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
  if (q.includes("movie") || q.includes("film") || q.includes("band") || q.includes("concert") || q.includes("album") || q.includes("streamer") || q.includes("celebrity") || q.includes("tv")) {
    contexts.push("Entertainment");
  }
  if (q.includes("game") || q.includes("gaming") || q.includes("console") || q.includes("stream") || q.includes("app") || q.includes("crypto")) {
    contexts.push("Gaming");
  }
  if (q.includes("school") || q.includes("student") || q.includes("teacher") || q.includes("exam") || q.includes("homework") || q.includes("class") || q.includes("test")) {
    contexts.push("School");
  }
  if (q.includes("business") || q.includes("company") || q.includes("ceo") || q.includes("employee") || q.includes("manager") || q.includes("profit") || q.includes("investment")) {
    contexts.push("Business");
  }

  return contexts.length > 0 ? contexts : ["Everyday life"]; // honest neutral fallback
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
    "False Dilemma": "A valid argument acknowledges the range of options. For example: 'There are several approaches we could take, including A, B, and combinations of them.'",
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
    "Appeal to Emotion": "A valid argument separates feeling from evidence. For example: 'I dislike this plan, and here are two drawbacks it has regardless of my taste.'",
    "Appeal to Ignorance": "A claim of absence needs a search that would have found it. For example: 'We checked the full registry; no such patent exists in it.'",
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
  const common = ["Ad Hominem", "Straw Man", "Appeal to Authority", "Red Herring", "Appeal to Popularity", "False Dilemma", "Tu Quoque", "Slippery Slope", "Appeal to Fear"];
  const rare = ["Continuum Fallacy", "Affirming the Consequent", "Denying the Antecedent"];

  if (common.includes(fallacyName)) return "common";
  if (rare.includes(fallacyName)) return "rare";
  return "moderate";
}

// Colloquial and historical alternate names so recognition transfers both ways
const aliasMap: Record<string, string[]> = {
  "False Dilemma": ["Black & White", "Excluded Middle", "False Dichotomy"],
  "Appeal to Emotion": ["Affective Fallacy"],
  "Tu Quoque": ["Whataboutism"],
  "Appeal to Popularity": ["Bandwagon Fallacy", "Appeal to the People"],
  "Appeal to Ignorance": ["Proof of Non-existence", "Argument from Ignorance"],
  "Begging the Question": ["Circular Reasoning"],

};

// One-liners for the feedback panel: dry, teen-friendly, and kept away from
// definitions so the teaching text stays precise.
const zingersMap: Record<string, string> = {
  "Ad Hominem": "Insulting the chef has never once changed how the food tastes.",
  "Tu Quoque": "'You do it too' has never cleaned up a single park.",
  "Argument from Motive": "Even people with motives are occasionally right about umbrellas.",
  "Scapegoat": "The blamed group is rarely holding the actual smoking gun.",
  "Straw Man": "If you need a scarecrow version, the real argument already won.",
  "Red Herring": "Fresh herring: red, slippery, and zero percent relevant.",
  "Cherry Picking": "The other nine data points would like a word.",
  "Equivocation": "Switching meanings mid-argument should cost a penalty flag.",
  "Moving the Goalposts": "The goalposts are bolted down for a reason.",
  "Appeal to Nature": "Poison ivy is 100% natural. Nature is not a safety report.",
  "Appeal to Tradition": "'We've always done it this way' is a history fact, not a reason.",
  "Appeal to Popularity": "Everyone once thought the Sun revolved around a stationary Earth. Everyone was wrong.",
  "Appeal to Novelty": "'New' describes age, not quality.",
  "Appeal to Emotion": "Feelings are real; they're just not evidence.",
  "Appeal to Authority": "Even the smartest expert should still show their work.",
  "Appeal to Probability": "'It could happen' and 'it will happen' live on different streets.",
  "Gambler's Fallacy": "The coin has no memory. It's not mad at you.",
  "Non Sequitur": "That conclusion didn't follow; it took the stairs.",
  "False Dilemma": "Somewhere between your two options, a third one is waving.",
  "Begging the Question": "A claim vouching for itself is favoritism, not proof.",
  "Denying the Antecedent": "Dry streets prove no rain, not a world without water.",
  "Affirming the Consequent": "Wet streets don't prove rain; sprinklers exist.",
  "Fallacy Fallacy": "A bad defense doesn't send the claim to jail.",
  "Definist Fallacy": "Winning by rewriting the dictionary isn't winning the debate.",
  "Continuum Fallacy": "No exact line for 'bald' doesn't mean hair is imaginary.",
  "Fallacy of Composition": "What works for one player doesn't work for the whole team.",
  "Appeal to Ignorance": "Not finding ghosts is not the same as finding ghosts.",
  "Nirvana Fallacy": "The perfect option doesn't exist, so stop firing the good one.",
  "Texas Sharpshooter": "Drawing the target after shooting is bold; it's just not a pattern.",
  "Magical Thinking": "Your socks did not score those goals.",
  "Overgeneralization": "One bad pizzeria is a story about one pizzeria.",
  "Sunk-Cost Fallacy": "The ticket money is gone either way. Don't lose the two hours too.",
  "No True Scotsman": "Redefining 'Scotsman' mid-argument is cheating with extra steps.",
  "Slippery Slope": "That's not a slope; it's a staircase of guesses.",
  "Appeal to Fear": "Scary music is not evidence.",
  "Argument to Moderation": "If one side says 2+2=4 and the other says 6, the answer isn't 5.",
  "Post Hoc": "The rooster is not holding the sunrise hostage.",
  "Loaded Question": "That question came with baggage you never agreed to carry.",
  "Guilt by Association": "Guilty by company only works in heist movies.",
  "Motte-and-Bailey": "That's not a defense; it's a retreat with confetti.",
  "Appeal to AI Authority": "The chatbot is confident. The chatbot is always confident.",
  "Manufactured Consensus": "Applause from a laugh track is not an audience.",
  "Fallacy of Division": "The team is fast; that doesn't make the mascot fast.",
};

// Main enhancement functions
export function enhanceFallacies(fallacies: Fallacy[]): EnhancedFallacy[] {
  return fallacies.map(fallacy => ({
    ...fallacy,
    category: categoryMappings[fallacy.name] || "Faulty Logic",
    aliases: aliasMap[fallacy.name] || [],
    zinger: zingersMap[fallacy.name],
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
  return ["Politics", "Social Media", "Advertising", "Science", "Relationships", "Business", "Entertainment", "Gaming", "School", "Everyday life"];
}
