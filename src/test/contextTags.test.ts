import { describe, expect, it } from "vitest";
import { enhancedQuestions } from "@/data/enhancedData";
import type { ContextTag } from "@/data/types";

// Word-bounded token patterns mirroring detectContexts() in enhancedData.ts.
// Kept in sync deliberately: these lock in that substring matches such as
// "exam" in "example" or "app" in "happy" never tag a context.
const CONTEXT_PATTERNS: Record<Exclude<ContextTag, "Everyday life">, RegExp> = {
  Politics:
    /\b(politician|politicians|vote|votes|voted|voter|voters|senator|senators|government|campaign|campaigns|election|elections|policy|policies)\b/,
  "Social Media":
    /\b(social media|online|forum|forums|post|posts|posted|viral|influencer|influencers)\b/,
  Advertising:
    /\b(advertis\w*|commercial|commercials|marketing|product|products|brand|brands|slogan|slogans|company|companies)\b/,
  Science: /\b(scientist|scientists|study|studies|research|evidence|expert|experts|doctor|doctors)\b/,
  Relationships:
    /\b(friend|friends|family|families|parent|parents|relationship|relationships|partner|partners|sibling|siblings)\b/,
  Entertainment:
    /\b(movie|movies|film|films|band|bands|concert|concerts|album|albums|streamer|streamers|celebrity|celebrities|tv)\b/,
  Gaming:
    /\b(game|games|gaming|gamer|gamers|console|consoles|stream|streams|streaming|streamer|streamers|app|apps|crypto)\b/,
  School:
    /\b(school|schools|student|students|teacher|teachers|exam|exams|examination|homework|class|classes|test|tests|testing)\b/,
  Business:
    /\b(business|businesses|company|companies|ceo|employee|employees|manager|managers|profit|profits|investment|investments)\b/,
};

const REAL_CONTEXTS = Object.keys(CONTEXT_PATTERNS) as Array<Exclude<ContextTag, "Everyday life">>;

describe("context tags", () => {
  it("keeps every real context under 25% of the question bank", () => {
    const cap = enhancedQuestions.length * 0.25;
    for (const context of REAL_CONTEXTS) {
      const count = enhancedQuestions.filter((q) => q.contexts.includes(context)).length;
      expect(
        count,
        `${context} tags ${count}/${enhancedQuestions.length} questions (cap ${cap})`
      ).toBeLessThanOrEqual(cap);
    }
  });

  it("does not tag School just because a question says 'example'", () => {
    const exampleOnly = enhancedQuestions.filter((q) => {
      const text = q.question.toLowerCase();
      return /\bexamples?\b/.test(text) && !CONTEXT_PATTERNS.School.test(text);
    });

    expect(exampleOnly.length).toBeGreaterThan(0);
    for (const q of exampleOnly) {
      expect(q.contexts, q.question).not.toContain("School");
    }
  });

  it("does not tag Gaming from substrings like 'happy' or 'apparently'", () => {
    const substringOnly = enhancedQuestions.filter(
      (q) => /\b(happy|happier|happily|apparently|appeal|appeals|appealing)\b/.test(q.question.toLowerCase())
    );

    expect(substringOnly.length).toBeGreaterThan(0);
    for (const q of substringOnly) {
      const text = q.question.toLowerCase();
      // Only assert for questions with no genuine Gaming word of their own.
      if (!CONTEXT_PATTERNS.Gaming.test(text)) {
        expect(q.contexts, q.question).not.toContain("Gaming");
      }
    }
  });

  it("gives every question at least one and at most three contexts", () => {
    for (const q of enhancedQuestions) {
      expect(q.contexts.length, q.question).toBeGreaterThanOrEqual(1);
      expect(q.contexts.length, q.question).toBeLessThanOrEqual(3);
    }
  });

  it("uses Everyday life only as the fallback when no other context matches", () => {
    const fallbackOnly = enhancedQuestions.filter(
      (q) => q.contexts.length === 1 && q.contexts[0] === "Everyday life"
    );

    expect(fallbackOnly.length).toBeGreaterThan(0);
    for (const q of fallbackOnly) {
      const text = q.question.toLowerCase();
      for (const context of REAL_CONTEXTS) {
        expect(CONTEXT_PATTERNS[context].test(text), `${context} should not match: ${q.question}`).toBe(false);
      }
    }
  });
});
