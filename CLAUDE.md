# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Logical Fallacy Training Simulator** - an educational web application designed to develop the skill of recognizing logical fallacies through adaptive learning, not just quiz-based testing. Built as a Lovable project using React, TypeScript, Vite, shadcn-ui, and Tailwind CSS.

The core philosophy: Treat fallacy recognition as a **skill to develop** (like learning to identify bird species), not knowledge to test. Users start with obvious fallacies, learn distinguishing features, practice with similar ones, get immediate feedback, and track which ones they still confuse.

## Development Commands

```bash
# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build in development mode
npm run build:dev

# Run linter
npm run lint

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Preview production build
npm run preview
```

## Architecture Overview

### Core Learning System

The app implements an **adaptive learning engine** with intelligent question selection:

1. **`useLearningEngine` hook** (`src/hooks/useLearningEngine.ts`) - Manages training sessions
   - Smart question selection algorithm (50% weak spots, 30% unseen, 20% random)
   - Adaptive difficulty system based on recent performance
   - Session state management with support for 4 learning modes

2. **`useProgress` hook** (`src/hooks/useProgress.ts`) - Tracks user progress in localStorage
   - Detailed per-fallacy statistics (total seen, correct first try, correct after retry)
   - Streak tracking (consecutive days)
   - Session history (last 50 sessions)
   - Mastery level calculations (Master 90%+, Proficient 70-89%, Learning <70%, Unseen)
   - Adaptive difficulty adjustment based on last 10 questions

### Learning Modes

Four distinct training modes accessible from mode selection:

- **Training Mode** (default): Adaptive difficulty, no time pressure, detailed explanations
- **Category Focus**: Practice specific fallacy categories (Personal Attack, Faulty Logic, etc.)
- **Context Mode**: Filter by real-world contexts (Politics, Social Media, Advertising, etc.)
- **Challenge Mode**: Difficulty 3 only, 30-second timer, no retries

### Data Structure

Enhanced data stored in `src/data/enhancedData.ts`:

- **40 fallacies** with categories, structure diagrams, real-world frequency
- **120+ questions** with difficulty ratings (1-3), context tags, valid argument versions, and explanations for all answer options
- Base data files: `fallacies.json` and `quiz-questions.json`

Key types defined in `src/data/types.ts`:
- `EnhancedFallacy` - Fallacy with category, structure diagram, key terms
- `EnhancedQuestion` - Question with difficulty, contexts, valid version, explanations
- `UserProgress` - Complete learning profile stored in localStorage
- `FallacyStats` - Per-fallacy performance tracking

### Component Organization

```
src/
├── components/
│   ├── training/          # Core training UI components
│   │   ├── TrainingSession.tsx     # Main session orchestrator
│   │   ├── QuestionCard.tsx        # Question display with options
│   │   ├── FeedbackPanel.tsx       # Rich feedback after answers
│   │   ├── FeynmanChallenge.tsx    # "Explain it" challenge (Feynman technique)
│   │   ├── ModeSelection.tsx       # Learning mode selector
│   │   ├── SessionSummary.tsx      # Post-session results
│   │   └── WelcomeScreen.tsx       # First-time user onboarding
│   ├── stats/             # Statistics dashboard components
│   ├── settings/          # Settings and preferences
│   └── ui/                # shadcn-ui components
├── hooks/
│   ├── useLearningEngine.ts  # Session management & question selection
│   └── useProgress.ts         # Progress tracking & localStorage
├── data/
│   ├── enhancedData.ts        # Enhanced fallacy & question data
│   ├── types.ts               # TypeScript type definitions
│   ├── fallacies.json         # Base fallacy definitions
│   └── quiz-questions.json    # Base question set
└── pages/
    └── Index.tsx              # Main app page
```

### Path Aliases

The project uses `@/` as an alias for `src/`:
```typescript
import { useProgress } from "@/hooks/useProgress";
import { Button } from "@/components/ui/button";
```

## Key Features to Understand

### Adaptive Difficulty System

- Tracks last 10 questions (stored in `progress.recentResults`)
- Levels up when user gets 8+ correct first-try out of last 10
- Levels down when 3 or fewer correct (framed positively)
- Difficulty range: 1-3
- Implementation in `useProgress.ts:recordAnswer()`

### Feynman Technique Challenge

After 3 consecutive correct answers (tracked in `progress.feynmanStreak`):
1. Show the question again
2. Ask user to explain WHY it's the fallacy
3. Use keyword detection to evaluate understanding
4. Provide targeted feedback

Implemented in `FeynmanChallenge.tsx` component.

### Rich Feedback System

When user answers:
- **Wrong**: Red highlight, explanation of why, option to retry (except Challenge mode)
- **Correct (first try)**: Green highlight, full fallacy deep-dive with structure diagram
- **Correct (after attempts)**: Same feedback but weighted differently in mastery calculation

Feedback includes:
- Visual structure diagram (ASCII-style)
- Valid version of the argument
- Real-world contexts where it appears
- Both examples from the fallacy data

### localStorage Schema

All progress persisted in localStorage key: `"fallacy_trainer_progress"`

Structure includes:
- `currentDifficulty`: Current adaptive difficulty level (1-3)
- `fallacyStats`: Per-fallacy performance record (object keyed by fallacy name)
- `sessionHistory`: Last 50 session records
- `streak`: Current streak, longest streak, last active date
- `totalQuestionsAnswered`, `sessionsCompleted`
- `seenQuestionIds`: Track which questions user has encountered
- `feynmanStreak`: Consecutive correct for Feynman challenge trigger
- `isFirstTime`: Whether to show onboarding

## Testing

The project uses Vitest with React Testing Library. Test setup in `src/test/setup.ts`.

## Styling

- **Tailwind CSS** for utility-first styling
- **shadcn-ui** for pre-built accessible components
- **Dark/light theme** support via `next-themes`
- Theme preference stored in `progress.preferences.theme`

## Important Development Patterns

### When adding new fallacy categories:
1. Update `FallacyCategory` type in `src/data/types.ts`
2. Ensure fallacies in `enhancedData.ts` use the new category
3. Update mode selection UI if needed

### When modifying question selection logic:
- Main algorithm in `useLearningEngine.ts:selectSmartQuestions()`
- Consider the 50/30/20 distribution (weak/unseen/random)
- Avoid repeating questions within same session (check `seenQuestionIds`)

### When updating progress tracking:
- Always use `useProgress` hook methods to ensure localStorage sync
- Updates trigger automatically via `useEffect` in the hook
- Export/import functionality available for backup

### When working with mastery levels:
- Calculated via `getMasteryInfo()` in `types.ts`
- Master: 90%+, Proficient: 70-89%, Learning: <70%
- Weighted calculation: first-try correct (1.0) + retry correct (0.5)

## Design Philosophy

The app emphasizes:
- **Learning over testing**: Retries allowed (except Challenge mode)
- **Immediate feedback**: Rich explanations for every answer
- **Adaptive difficulty**: Automatically adjusts to user performance
- **Skill development**: Tracks mastery over time, not just scores
- **Active recall**: Feynman technique forces explanation
- **Intelligent sequencing**: Focuses on weak spots and unseen material
