# Spot The Fallacy

**Train your brain to recognize flawed reasoning in real-time.**

SpotTheFallacy.com is an intelligent training simulator that teaches you to identify logical fallacies, not through rote memorization, but through practice and adaptive learning. Think of it like Duolingo for critical thinking.

## Why This Exists

Every day, you encounter arguments in politics, advertising, social media, and personal conversations. Many of these arguments are built on faulty reasoning; logical fallacies. Most people know *about* fallacies but can't spot them when they appear in the wild.

This app solves that problem. It treats fallacy recognition as a **skill to develop**, not just knowledge to memorize. Like learning to identify bird species, you start with obvious examples, learn the distinguishing features, practice with similar cases, and track which ones you still confuse.

## How It Works

### Four Training Modes

1. **Training Mode** (Recommended)
   - Starts easy, gets harder as you improve
   - 10 questions per session, no time pressure
   - Focuses 50% on your weak spots, 30% on new fallacies, 20% on review
   - Detailed explanations for every answer

2. **Category Focus**
   - Practice one type of fallacy at a time
   - Six categories: Personal Attack, Faulty Logic, Emotional Manipulation, Misrepresentation, False Authority, Causal Errors

3. **Context Training**
   - Filter by where you want to spot fallacies: Politics, Social Media, Advertising, Science, Relationships, Business
   - "Train me for election season" or "Help me spot advertising tricks"

4. **Challenge Mode**
   - Only the hardest questions
   - 30-second timer per question
   - No retries; for users who've mastered the basics

### Adaptive Learning System

The app watches how you perform:
- Get 8 out of 10 questions right first try? Level increases.
- Struggling? Level adjusts down (framed positively - "optimizing for your learning").
- It remembers which fallacies trip you up and serves more practice on those.

### Rich Feedback

When you get an answer **wrong**: You see why it's wrong and can try again. This is practice, not a test.

When you get it **right**: You get a deep dive; the fallacy's structure, why it's flawed, where you'll see it in real life, and both correct and incorrect examples.

### The Feynman Challenge

After three correct answers in a row, the app asks: "In your own words, explain WHY this is [fallacy name]."

If you can't explain it, you don't really understand it. This technique, inspired by physicist Richard Feynman, forces you to think deeply rather than pattern-match superficially.

### Progress Tracking

Your browser remembers everything:
- Which fallacies you've mastered (90%+ accuracy)
- Which ones you're still learning (<70% accuracy)
- Your daily streak
- Session history
- Complete stats for all 40 fallacies

All data stays on your device. Export/import available for backup.

## What You Get

- **40 logical fallacies** covering all major types
- **120+ practice questions** from real-world contexts
- **Adaptive difficulty** that adjusts to your skill level
- **Smart question selection** that focuses on your weak spots
- **Visual diagrams** showing each fallacy's structure
- **Valid argument versions** showing how the reasoning should work
- **Mobile-friendly** design that works on any device
- **Dark/light theme** for comfortable reading
- **Completely free** with no ads or tracking

## The Philosophy

This app is built on principles from educational psychology:

1. **Spaced repetition**: You see fallacies you struggle with more often
2. **Active recall**: You must retrieve information, not just recognize it
3. **Immediate feedback**: You learn why you're right or wrong instantly
4. **Adaptive difficulty**: Always challenging but never overwhelming
5. **Mastery-based progression**: You advance when ready, not on a schedule

Think of it as a patient, tireless tutor that remembers everything about your learning journey and uses that to optimize your training.

## Tech Stack

Built with modern web technologies for speed and reliability:

- **React + TypeScript** - Type-safe, maintainable code
- **Vite** - Lightning-fast development and builds
- **Tailwind CSS** - Responsive, accessible design
- **shadcn-ui** - Beautiful, accessible components
- **localStorage** - All your progress stays on your device

## Getting Started (For Developers)

```bash
# Install dependencies
npm install

# Run development server (http://localhost:8080)
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run linter
npm run lint
```

## Project Structure

```
src/
├── components/
│   ├── training/    # Core training UI
│   ├── stats/       # Progress dashboard
│   └── ui/          # Reusable components
├── hooks/
│   ├── useLearningEngine.ts  # Question selection & sessions
│   └── useProgress.ts         # Progress tracking & localStorage
├── data/
│   ├── enhancedData.ts        # 40 fallacies + 120 questions
│   └── types.ts               # TypeScript definitions
└── pages/
    └── Index.tsx              # Main app page
```

## How the Learning Algorithm Works

Simple explanation: The app picks questions that help you learn fastest.

**For each training session:**
1. Look at your past performance
2. Find fallacies where you score below 70% (weak spots)
3. Find fallacies you've never seen (unseen)
4. Weight the mix: 50% weak spots, 30% unseen, 20% random review
5. Never repeat questions within the same session
6. Prioritize fallacies you haven't seen in a while

This isn't random; it's intelligent sequencing designed to maximize learning efficiency.

## Contributing

Found a bug? Have an idea? Open an issue or submit a PR.

## License

MIT - Use it however you want.

## Credits

Built with principles from cognitive science, educational psychology, and Richard Feynman's teaching philosophy: "If you can't explain it simply, you don't understand it well enough."

---

**Start training at [SpotTheFallacy.com](https://spotthefallacy.com)**

Learn to see through faulty reasoning. Become a clearer thinker.
