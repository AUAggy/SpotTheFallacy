import { describe, it, expect } from "vitest";
import { migrateFallacyKeys } from "@/hooks/useProgress";

const stats = (seen: number) => ({
  totalSeen: seen, correctFirstTry: seen, correctAfterRetry: 0,
  incorrect: 0, lastSeen: 1, attempts: [1],
});

describe("fallacy stats migration (schema v2)", () => {
  it("merges merged-away fallacies into their survivor", () => {
    const out = migrateFallacyKeys({
      "Black & White": stats(3),
      "Excluded Middle": stats(2),
    });
    expect(Object.keys(out)).toEqual(["Black & White"]);
    expect(out["Black & White"].totalSeen).toBe(5);
  });

  it("drops retired fallacies", () => {
    const out = migrateFallacyKeys({
      "Homunculus Fallacy": stats(3),
      "Appeal to Closure": stats(2),
      "Conflicting Conditions": stats(1),
      "Straw Man": stats(4),
    });
    expect(Object.keys(out).sort()).toEqual(["Straw Man"]);
  });

  it("follows rename chains to their final target", () => {
    // Phase 3 will map "Black & White" -> "False Dilemma"; the loop must resolve
    // "Excluded Middle" all the way through. Today it must land on "Black & White".
    const out = migrateFallacyKeys({ "Excluded Middle": stats(2) });
    expect(Object.keys(out)).toEqual(["Black & White"]);
  });

  it("handles empty and undefined input", () => {
    expect(migrateFallacyKeys(undefined)).toEqual({});
    expect(migrateFallacyKeys({})).toEqual({});
  });
});
