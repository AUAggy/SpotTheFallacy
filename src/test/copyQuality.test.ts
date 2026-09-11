import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { enhancedFallacies, enhancedQuestions } from "@/data/enhancedData";

/**
 * Copy quality gate: Richard Feynman clarity + correctness, with room for
 * high-schooler-appropriate humor. Machine-checkable rules live here;
 * humor and diagram-vs-fallacy SEMANTICS are judged by the critic agent
 * (see plans/fallacy-trainer-v2.md, "Copy standard").
 *
 * Word limits are calibrated to current data p100 plus headroom. Tighten
 * them as the copy pass lands; never loosen them to make a test pass.
 */

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

// clear-ink severity-3 vocabulary bans (see ~/.agents/skills/clear-ink/SKILL.md)
const BANNED_PHRASES = [
  "delve",
  "tapestry",
  "it's worth noting",
  "at the end of the day",
  "in today's",
  "let's dive",
  "look no further",
  "stay tuned",
  "game-changing",
  "cutting-edge",
  "state-of-the-art",
  "seamless",
  "leverage",
  "unlock",
  "empower",
  "journey",
  "not just",
  "more than just",
];

const dataCopy: { text: string; where: string }[] = [];
for (const f of enhancedFallacies) {
  dataCopy.push({ text: f.description, where: `${f.name}.description` });
  for (const [i, e] of f.examples.entries()) {
    dataCopy.push({ text: e, where: `${f.name}.example[${i}]` });
  }
  dataCopy.push({ text: f.structureDiagram, where: `${f.name}.structureDiagram` });
}
// validVersion is per-question (derived from the fallacy); take one per fallacy
const validByFallacy = new Map<string, string>();
for (const q of enhancedQuestions) {
  if (!validByFallacy.has(q.fallacy_name)) {
    validByFallacy.set(q.fallacy_name, q.validVersion);
    dataCopy.push({ text: q.validVersion, where: `${q.fallacy_name}.validVersion` });
  }
}
for (const q of enhancedQuestions) {
  dataCopy.push({ text: q.question, where: `${q.id}.question` });
  for (const [opt, exp] of Object.entries(q.optionExplanations)) {
    dataCopy.push({ text: exp, where: `${q.id}.explanation[${opt}]` });
  }
}

function listFiles(dir: string, ext: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p, ext));
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

describe("copy: coverage and correctness", () => {
  const RETIRED_OR_MERGED = [
    "Homunculus Fallacy", "Conflicting Conditions", "Appeal to Closure",
    "Excluded Middle", "Appeal to Money", "Suppressed Correlative",
  ];

  it("retired and merged fallacies are gone from the catalog and every question", () => {
    const names = new Set(enhancedFallacies.map(f => f.name));
    for (const name of RETIRED_OR_MERGED) {
      expect(names.has(name), `${name} is retired but still in the catalog`).toBe(false);
    }
    for (const q of enhancedQuestions) {
      expect(RETIRED_OR_MERGED).not.toContain(q.fallacy_name);
      for (const opt of q.options) {
        expect(RETIRED_OR_MERGED, `${q.id} still offers retired option "${opt}"`).not.toContain(opt);
      }
    }
  });

  it("legacy fallacy names are fully replaced by recognition-friendly names", () => {
    const LEGACY = ["Black & White", "Affective Fallacy", "Proof of Non-existence"];
    const names = new Set(enhancedFallacies.map(f => f.name));
    for (const name of LEGACY) {
      expect(names.has(name), `${name} should be renamed`).toBe(false);
    }
    const allRefs = enhancedQuestions
      .map(q => [q.fallacy_name, ...q.options, q.correct_answer].join("|"))
      .join("|");
    for (const name of LEGACY) {
      expect(allRefs.includes(name), `legacy name "${name}" still referenced in questions`).toBe(false);
    }
    const fd = enhancedFallacies.find(f => f.name === "False Dilemma");
    expect(fd?.aliases).toContain("Black & White");
  });

  it("every fallacy has at least 3 questions", () => {
    for (const f of enhancedFallacies) {
      const n = enhancedQuestions.filter(q => q.fallacy_name === f.name).length;
      expect(n, `${f.name} has ${n} questions`).toBeGreaterThanOrEqual(3);
    }
  });

  it("every answer option resolves to a real fallacy (no phantoms)", () => {
    const names = new Set(enhancedFallacies.map(f => f.name));
    const unknown = new Set<string>();
    for (const q of enhancedQuestions) {
      for (const opt of q.options) {
        if (!names.has(opt)) unknown.add(opt);
      }
    }
    expect([...unknown], "phantom options found").toEqual([]);
  });

  it("every question has exactly one correct answer, present in its options", () => {
    for (const q of enhancedQuestions) {
      expect(q.options).toContain(q.correct_answer);
    }
  });

  it("every option has a generated explanation", () => {
    for (const q of enhancedQuestions) {
      for (const opt of q.options) {
        const exp = q.optionExplanations[opt];
        expect(exp, `${q.id} missing explanation for "${opt}"`).toBeTruthy();
      }
    }
  });

  it("explanations name the right fallacy and contain no template artifacts", () => {
    for (const q of enhancedQuestions) {
      for (const [opt, exp] of Object.entries(q.optionExplanations)) {
        expect(exp).not.toContain("undefined");
        expect(exp, `${q.id} explanation for "${opt}" still has "..."`).not.toContain("...");
        expect(
          exp.toLowerCase().includes(opt.toLowerCase()),
          `${q.id} explanation for "${opt}" does not name it: ${exp}`
        ).toBe(true);
      }
    }
  });
});

describe("copy: Feynman brevity (clarity needs short sentences)", () => {
  const LIMITS: [string, number, (f: (typeof enhancedFallacies)[number]) => string[]][] = [
    // [label, maxWords, extractor] - limits = current p100 + small headroom
    ["description", 55, f => [f.description]],
    ["example", 35, f => f.examples],
  ];

  for (const [label, max, get] of LIMITS) {
    it(`every ${label} is at most ${max} words`, () => {
      for (const f of enhancedFallacies) {
        for (const [i, text] of get(f).entries()) {
          expect(
            wordCount(text),
            `${f.name} ${label}[${i}] is ${wordCount(text)} words (max ${max}): "${text.slice(0, 60)}..."`
          ).toBeLessThanOrEqual(max);
        }
      }
    });
  }

  it("every question is at most 60 words", () => {
    for (const q of enhancedQuestions) {
      expect(
        wordCount(q.question),
        `${q.id} question is ${wordCount(q.question)} words`
      ).toBeLessThanOrEqual(60);
    }
  });

  it("every valid version is at most 55 words", () => {
    for (const [name, version] of validByFallacy) {
      expect(
        wordCount(version),
        `${name} valid version is ${wordCount(version)} words`
      ).toBeLessThanOrEqual(55);
    }
  });
});

describe("copy: ASCII flow diagrams match their fallacy's structure", () => {
  const diagrams = enhancedFallacies.map(f => ({
    name: f.name,
    diagram: f.structureDiagram,
  }));

  it("every fallacy has a diagram", () => {
    for (const { name, diagram } of diagrams) {
      expect(diagram, `${name} has no diagram`).toBeTruthy();
    }
  });

  it("no two fallacies share a diagram (a shared diagram is the generic placeholder)", () => {
    const byDiagram = new Map<string, string[]>();
    for (const { name, diagram } of diagrams) {
      byDiagram.set(diagram, [...(byDiagram.get(diagram) ?? []), name]);
    }
    const shared = [...byDiagram.entries()].filter(([, names]) => names.length > 1);
    expect(
      shared.map(([, names]) => names.join(" + ")),
      "these fallacies share one diagram - write each a specific pattern"
    ).toEqual([]);
  });

  it("each diagram is a 3-step flow (3 boxes, 2 arrows) in the house style", () => {
    for (const { name, diagram } of diagrams) {
      expect(
        (diagram.match(/┌/g) ?? []).length,
        `${name} diagram box count`
      ).toBe(3);
      expect(
        (diagram.match(/▼/g) ?? []).length,
        `${name} diagram arrow count`
      ).toBe(2);
      expect(diagram.trimStart()).toMatch(/^┌/);
    }
  });

  it("every diagram line fits a 390px mobile screen (max 30 chars)", () => {
    for (const { name, diagram } of diagrams) {
      const widest = Math.max(...diagram.split("\n").map(l => l.length));
      expect(widest, `${name} diagram widest line is ${widest} chars`).toBeLessThanOrEqual(30);
    }
  });
});

describe("copy: voice lint (no machine-textured or puffed-up language)", () => {
  it("data copy contains no banned phrases", () => {
    const offenders: string[] = [];
    for (const { text, where } of dataCopy) {
      const lower = text.toLowerCase();
      for (const phrase of BANNED_PHRASES) {
        if (lower.includes(phrase)) offenders.push(`${where}: "${phrase}"`);
      }
    }
    expect(offenders, "banned phrases found").toEqual([]);
  });

  it("component copy contains no banned phrases", () => {
    const offenders: string[] = [];
    for (const path of listFiles(join(process.cwd(), "src/components"), ".tsx")) {
      const src = readFileSync(path, "utf-8");
      const lower = src.toLowerCase();
      for (const phrase of BANNED_PHRASES) {
        if (lower.includes(phrase)) offenders.push(`${path}: "${phrase}"`);
      }
    }
    expect(offenders, "banned phrases found").toEqual([]);
  });

  it("no em-dashes anywhere in data copy (colons and periods do that job)", () => {
    const offenders = dataCopy.filter(({ text }) => text.includes("—"));
    expect(offenders.map(o => o.where)).toEqual([]);
  });

  it("no ellipsis artifacts in explanations or valid versions (dialogue in questions is exempt)", () => {
    const offenders: string[] = [];
    for (const [name, version] of validByFallacy) {
      if (version.includes("...")) offenders.push(`${name}.validVersion`);
    }
    for (const q of enhancedQuestions) {
      for (const [opt, exp] of Object.entries(q.optionExplanations)) {
        if (exp.includes("...")) offenders.push(`${q.id}[${opt}]`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("copy: humor gate (human-judged; enforced via critic agent rounds)", () => {
  // These become hard tests once the copy voice pass lands the planned
  // optional `zinger` field (see plans/fallacy-trainer-v2.md, Phase "Copy voice pass").
  it.todo("every fallacy carries a light, teen-appropriate zinger (planned `zinger` field, <= 120 chars)");
  it.todo("humor lives in examples and zingers; definition and diagram sentences stay plain and precise");
  it.todo("critic agent (Feynman persona, teen-humor rubric) scores all copy 8 or higher");
});
