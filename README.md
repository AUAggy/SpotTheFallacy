# Spot The Fallacy

**Train your eye for bad arguments.**

SpotTheFallacy.com is a practice tool for learning to spot logical fallacies: the flawed reasoning patterns that show up in politics, advertising, social media, and everyday conversations. You read a short scenario, name the fallacy, and get an instant explanation of why the answer is right or wrong.

## How It Works

### Six ways to practice

1. **Training Mode** (recommended)
   - 10 questions per session, no time pressure
   - Wrong answers can be retried; explanations for every answer
   - Questions you have missed weigh 4x, unseen fallacies 2x

2. **Challenge Mode**
   - Questions only from fallacies you have not yet mastered
   - 30 seconds per question, one attempt, no retries
   - Every score is saved; the summary shows your personal best

3. **Today's 5** (daily challenge)
   - 5 questions, same set for everyone on that date
   - One attempt; replays are locked until tomorrow

4. **Quick Round**
   - 3 questions, about a minute

5. **Category Focus**
   - Practice one category: Personal Attack, Faulty Logic, Emotional Manipulation, Misrepresentation, False Authority, Causal Errors

6. **Context Focus**
   - Practice where fallacies actually appear: Politics, Social Media, Advertising, Science, Relationships, Business, Entertainment, Gaming, School, Everyday life

### Feedback that teaches

Every answer gets an explanation. Wrong answers show what you picked, why it does not fit, and which fallacy the argument actually is. Right answers add the full picture: the pattern as an ASCII flow diagram, a fallacy-free version of the argument, other examples, and the everyday names the fallacy also goes by.

A dry one-liner comes with each fallacy. Two favorites: "The coin has no memory. It's not mad at you." and "Scary music is not evidence."

### The Feynman prompt

After three correct answers in a row, the app asks you to explain the fallacy in your own words. There is no scoring; writing the explanation is the exercise.

### Progress that stays on your device

- Mastery per fallacy: mastered at 90%+, still learning below 70%
- A stamp and a small confetti burst when a fallacy crosses the mastery line
- Day streak, session history, and per-category breakdowns
- Export and import for backups; upgrades migrate saved progress automatically

### Keyboard play

Press 1-4 to answer, Enter to continue. The whole game is playable without a mouse.

## What You Get

- **40+ logical fallacies**, each with a specific pattern diagram, a valid version of the argument, and key terms
- **120+ practice questions**, 3 per fallacy, written for school, work, media, and internet life
- **Wrong options that teach**: distractors are the fallacies each one is most often confused with
- **Mastery-weighted question selection** in Training Mode
- **Works offline** after the first load; nothing leaves your browser
- **Free, no ads, no accounts**

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn-ui
- localStorage for all progress (with schema migrations)
- Vitest for unit tests; Playwright harnesses for end-to-end checks

## For Developers

```bash
npm install        # install dependencies
npm run dev        # dev server on http://localhost:8080
npm run test       # unit + copy-quality tests
npm run lint       # eslint
npm run build      # production build
```

Additional verification tools (need `python3` with Playwright and a running dev server):

- `python3 critic_harness.py <round>` plays Challenge and Training modes end to end and checks feedback, timer expiry, session recording, and tallies
- `python3 copy_harness.py <round>` screenshots 35+ screen and viewport combinations (mobile portrait, tablet, desktop) and fails on any text overflow

## Project Structure

```
src/
├── components/
│   ├── training/    # Session UI: question, feedback, Feynman, summary, modes
│   ├── stats/       # Progress dashboard
│   ├── settings/    # Export / import / reset
│   └── ui/          # shadcn-ui components
├── hooks/
│   ├── useProgress.tsx        # single progress store (context) + localStorage
│   └── useLearningEngine.ts   # sessions, selection, timer, answers
├── data/
│   ├── fallacies.json         # fallacy catalog (names, descriptions, examples)
│   ├── quiz-questions.json    # question scenarios and options
│   ├── enhancedData.ts        # derives categories, diagrams, explanations
│   └── types.ts               # TypeScript definitions
├── test/                      # vitest suites (incl. copy quality gates)
└── pages/Index.tsx            # app shell and navigation
```

## Adding a Fallacy

1. Add the entry to `src/data/fallacies.json` (name, description, 2 examples)
2. Add 3 questions to `src/data/quiz-questions.json` (every option must be a real fallacy name)
3. Wire it through `src/data/enhancedData.ts`: category, pattern diagram, valid version, key terms, confusion pairs
4. `npm run test` enforces the rest: diagram uniqueness and width, explanation integrity, brevity limits, and banned-phrase linting

## Contributing

Found a bug or a mislabeled question? Open an issue or a PR. Content changes run through the copy-quality tests.

## License

MIT

## Credits

Built on Richard Feynman's teaching principle: if you can't explain it simply, you don't understand it well enough.

---

**Start training at [SpotTheFallacy.com](https://spotthefallacy.com)**
