import { createElement } from "react";
import { describe, it, expect } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import { ProgressProvider, useProgress } from "@/hooks/useProgress";

const STORAGE_KEY = "fallacy_trainer_progress";

type ProgressApi = ReturnType<typeof useProgress>;

// Module-level handle to the context value, refreshed on every render so a read
// after `act` always sees the latest progress.
let api: ProgressApi | null = null;

function ApiHarness() {
  api = useProgress();
  return null;
}

function renderStore() {
  api = null;
  render(createElement(ProgressProvider, null, createElement(ApiHarness)));
  if (!api) throw new Error("progress store did not mount");
}

function fallacyStats(seen: number, correctFirstTry = seen) {
  return {
    totalSeen: seen,
    correctFirstTry,
    correctAfterRetry: 0,
    incorrect: seen - correctFirstTry,
    lastSeen: 1,
    attempts: [1],
  };
}

/** A v2-shaped blob: legacy ladder fields, seen ids, theme and merged names. */
function legacyBlob() {
  return {
    schemaVersion: 2,
    fallacyStats: {
      "Black & White": fallacyStats(2, 2),
      "False Dilemma": fallacyStats(3, 2),
    },
    sessionHistory: [],
    streak: { current: 4, longest: 4, lastActiveDate: new Date().toDateString() },
    preferences: { theme: "dark", showOnboarding: false },
    lastUpdated: 1,
    totalQuestionsAnswered: 5,
    sessionsCompleted: 1,
    consecutiveCorrect: 3,
    feynmanStreak: 2,
    currentDifficulty: 2,
    recentResults: [true, false],
    seenQuestionIds: ["q1"],
    lastMasteryUp: "Black & White",
    daily: { lastPlayedDate: null, history: [] },
    isFirstTime: false,
  };
}

describe("importProgress validation (behaviour 5)", () => {
  it("rejects anything that is not a progress record and leaves progress untouched", () => {
    renderStore();
    act(() => api!.recordAnswer("Ad Hominem", true, 1));

    const statsBefore = JSON.stringify(api!.progress.fallacyStats);
    const answeredBefore = api!.progress.totalQuestionsAnswered;

    for (const bad of ["5", "[]", "null", "{}", '"hello"']) {
      let accepted: boolean | undefined;
      act(() => {
        accepted = api!.importProgress(bad);
      });
      expect(accepted, `importProgress(${bad}) must be rejected`).toBe(false);
    }

    expect(JSON.stringify(api!.progress.fallacyStats)).toBe(statsBefore);
    expect(api!.progress.totalQuestionsAnswered).toBe(answeredBefore);
  });

  it("accepts a real export round-trip", () => {
    renderStore();
    act(() => api!.recordAnswer("Ad Hominem", true, 1));
    const exported = api!.exportProgress();

    act(() => api!.resetProgress());
    expect(api!.progress.totalQuestionsAnswered).toBe(0);

    let accepted: boolean | undefined;
    act(() => {
      accepted = api!.importProgress(exported);
    });
    expect(accepted).toBe(true);
    expect(api!.progress.totalQuestionsAnswered).toBe(1);
    expect(api!.progress.fallacyStats["Ad Hominem"].totalSeen).toBe(1);
  });

  it("migrates a legacy v2-shaped blob on import, merging renamed stats", () => {
    renderStore();

    let accepted: boolean | undefined;
    act(() => {
      accepted = api!.importProgress(JSON.stringify(legacyBlob()));
    });
    expect(accepted).toBe(true);

    const progress = api!.progress;
    expect(progress.schemaVersion).toBe(4);
    expect(progress).not.toHaveProperty("currentDifficulty");
    expect(progress).not.toHaveProperty("recentResults");
    expect(progress).not.toHaveProperty("consecutiveCorrect");
    expect(progress).not.toHaveProperty("feynmanStreak");
    expect(progress).not.toHaveProperty("seenQuestionIds");
    expect(progress.correctStreak).toBe(3);
    expect(progress.fallacyStats["Black & White"]).toBeUndefined();
    expect(progress.fallacyStats["False Dilemma"].totalSeen).toBe(5);
    expect(progress.preferences).not.toHaveProperty("theme");
    expect(progress.preferences.showOnboarding).toBe(false);
  });
});

describe("schema v4 load (behaviour 8)", () => {
  it("cleans legacy keys on load, keeps the carried-over streak, reports schema 4", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyBlob()));

    renderStore();

    const progress = api!.progress;
    expect(progress.schemaVersion).toBe(4);
    expect(progress).not.toHaveProperty("currentDifficulty");
    expect(progress).not.toHaveProperty("consecutiveCorrect");
    expect(progress).not.toHaveProperty("recentResults");
    expect(progress).not.toHaveProperty("feynmanStreak");
    expect(progress).not.toHaveProperty("seenQuestionIds");
    expect(progress.correctStreak).toBe(3);
    expect(progress.fallacyStats["Black & White"]).toBeUndefined();
    expect(progress.fallacyStats["False Dilemma"].totalSeen).toBe(5);
    expect(progress.preferences).not.toHaveProperty("theme");
  });
});

describe("persistence hygiene (behaviour 6)", () => {
  it("never persists lastMasteryUp and drops seenQuestionIds", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 3,
        fallacyStats: {
          "Ad Hominem": {
            totalSeen: 9,
            correctFirstTry: 8,
            correctAfterRetry: 0,
            incorrect: 1,
            lastSeen: 1,
            attempts: [1],
          },
        },
        sessionHistory: [],
        streak: { current: 1, longest: 1, lastActiveDate: new Date().toDateString() },
        preferences: { showOnboarding: true },
        lastUpdated: 1,
        totalQuestionsAnswered: 8,
        sessionsCompleted: 1,
        correctStreak: 0,
        lastMasteryUp: "Ad Hominem",
        seenQuestionIds: ["q-old"],
        daily: { lastPlayedDate: null, history: [] },
        isFirstTime: false,
      })
    );

    renderStore();

    // 8/9 correct first try is below 90%; the next first-try correct crosses it.
    act(() => api!.recordAnswer("Ad Hominem", true, 1));
    expect(api!.progress.lastMasteryUp).toBe("Ad Hominem");

    await waitFor(() => {
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).toBeTruthy();
      expect(raw as string).not.toContain("lastMasteryUp");
      expect(raw as string).not.toContain("seenQuestionIds");
    });
  });
});

describe("daily result invariant (behaviour 4, data layer)", () => {
  it("records at most one history entry per date", () => {
    renderStore();

    act(() => {
      api!.recordDailyResult("2024-05-05", 3, 5);
      api!.recordDailyResult("2024-05-05", 4, 5);
    });

    const entries = api!.progress.daily.history.filter(entry => entry.date === "2024-05-05");
    expect(entries).toHaveLength(1);
    expect(entries[0].score).toBe(3);
    expect(api!.progress.daily.lastPlayedDate).toBe("2024-05-05");
  });
});
