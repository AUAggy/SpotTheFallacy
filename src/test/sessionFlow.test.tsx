import { useEffect, useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ProgressProvider, useProgress } from "@/hooks/useProgress";
import { useLearningEngine } from "@/hooks/useLearningEngine";
import { TrainingSession } from "@/components/training/TrainingSession";
import { StatsDashboard } from "@/components/stats/StatsDashboard";
import { enhancedQuestions } from "@/data/enhancedData";
import { isFeynmanDue, type EnhancedQuestion, type SubmitResult } from "@/data/types";

const STORAGE_KEY = "fallacy_trainer_progress";
const noop = () => {};

/** The rendered question, identified by matching screen text to the dataset. */
async function findQuestionOnScreen(): Promise<EnhancedQuestion> {
  return waitFor(() => {
    const found = enhancedQuestions.find(q => screen.queryByText(q.question) !== null);
    if (!found) throw new Error("no question rendered yet");
    return found;
  });
}

/** Click whichever option the dataset says is correct for the current question. */
function clickCorrectAnswer(): EnhancedQuestion {
  const question = enhancedQuestions.find(q => screen.queryByText(q.question) !== null);
  if (!question) throw new Error("no question on screen");
  const button = screen
    .getAllByRole("button")
    .find(b => b.textContent?.includes(question.correct_answer));
  if (!button) throw new Error(`no option button for "${question.correct_answer}"`);
  fireEvent.click(button);
  return question;
}

function continueButton(): HTMLElement {
  return screen.getByRole("button", { name: /continue/i });
}

async function advanceThroughFeedback() {
  fireEvent.click(continueButton());
  await waitFor(() =>
    expect(screen.queryByText(/Excellent! First try!/i)).not.toBeInTheDocument()
  );
}

describe("isFeynmanDue (behaviour 1, pure rule)", () => {
  it("is due at multiples of three and never at 0,1,2,4,5,7,8", () => {
    for (const streak of [3, 6, 9, 12]) {
      expect(isFeynmanDue(streak), `streak ${streak}`).toBe(true);
    }
    for (const streak of [0, 1, 2, 4, 5, 7, 8]) {
      expect(isFeynmanDue(streak), `streak ${streak}`).toBe(false);
    }
  });
});

describe("Feynman prompt cadence (behaviour 1, integration)", () => {
  it("fires after the 3rd consecutive first-try correct answer, not the 4th", async () => {
    render(
      <ProgressProvider>
        <TrainingSession mode="training" onExit={noop} />
      </ProgressProvider>
    );

    // Answer 1
    await findQuestionOnScreen();
    clickCorrectAnswer();
    await screen.findByText(/Excellent! First try!/i);
    expect(screen.queryByText(/Feynman Challenge/i)).not.toBeInTheDocument();
    await advanceThroughFeedback();

    // Answer 2
    await findQuestionOnScreen();
    clickCorrectAnswer();
    await screen.findByText(/Excellent! First try!/i);
    expect(screen.queryByText(/Feynman Challenge/i)).not.toBeInTheDocument();
    await advanceThroughFeedback();

    // Answer 3 is where the reflective prompt belongs
    await findQuestionOnScreen();
    clickCorrectAnswer();
    await screen.findByText(/Feynman Challenge/i);
  });
});

describe("duplicate submission (behaviour 2)", () => {
  function DuplicateSubmissionHarness() {
    const { session, currentQuestion, startSession, submitAnswer, isSessionComplete } =
      useLearningEngine();
    const [secondResult, setSecondResult] = useState<SubmitResult | null>(null);

    useEffect(() => {
      startSession("training", undefined, undefined, { count: 1 });
    }, [startSession]);

    if (!session || !currentQuestion) return <div>loading</div>;

    return (
      <div>
        <div data-testid="answers">{session.answers.length}</div>
        <div data-testid="complete">{String(isSessionComplete)}</div>
        <div data-testid="second-duplicate">{String(secondResult?.duplicate ?? false)}</div>
        <button
          onClick={() => {
            // Two submissions from the same render snapshot, exactly like the
            // challenge timer firing while a click lands.
            submitAnswer(currentQuestion.correct_answer);
            const second = submitAnswer(currentQuestion.correct_answer);
            setSecondResult(second);
          }}
        >
          double submit
        </button>
      </div>
    );
  }

  it("records one answer for two same-snapshot submissions and flags the second", async () => {
    render(
      <ProgressProvider>
        <DuplicateSubmissionHarness />
      </ProgressProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: /double submit/i }));

    await waitFor(() => expect(screen.getByTestId("answers").textContent).toBe("1"));
    expect(screen.getByTestId("complete").textContent).toBe("true");
    expect(screen.getByTestId("second-duplicate").textContent).toBe("true");
  });
});

describe("Quick Round restart (behaviour 3)", () => {
  it("restarts a 3-question Quick Round as 1 / 3, not 1 / 10", async () => {
    render(
      <ProgressProvider>
        <TrainingSession mode="training" questionCount={3} onExit={noop} />
      </ProgressProvider>
    );

    for (let i = 0; i < 3; i++) {
      await findQuestionOnScreen();
      clickCorrectAnswer();
      await screen.findByText(/Excellent! First try!/i);
      await advanceThroughFeedback();
    }

    fireEvent.click(await screen.findByRole("button", { name: /Train Again/i }));

    await waitFor(() => expect(screen.getByText("1 / 3")).toBeInTheDocument());
    expect(screen.queryByText("1 / 10")).not.toBeInTheDocument();
  });
});

describe("Daily Challenge lock (behaviour 4, UI)", () => {
  it("does not offer Train Again and stores exactly one result for today", async () => {
    render(
      <ProgressProvider>
        <TrainingSession mode="daily" onExit={noop} />
      </ProgressProvider>
    );

    // Daily is one-shot and five questions; correctness does not matter for the
    // lock, but answering correctly keeps the run deterministic.
    for (let i = 0; i < 5; i++) {
      await findQuestionOnScreen();
      clickCorrectAnswer();
      await screen.findByText(/Excellent! First try!/i);
      await advanceThroughFeedback();
    }

    await screen.findByText(/Daily Challenge/i);
    expect(screen.queryByRole("button", { name: /Train Again/i })).not.toBeInTheDocument();
    expect(screen.getByText(/That was today/i)).toBeInTheDocument();

    const today = new Date().toISOString().slice(0, 10);
    await waitFor(() => {
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw as string);
      const todayEntries = parsed.daily.history.filter(
        (entry: { date: string }) => entry.date === today
      );
      expect(todayEntries).toHaveLength(1);
    });
  });
});

// The weak-spot weighting rule lives inside selectSmartQuestions. It is
// observable through session selection: with Math.random pinned, a weighted
// weak fallacy wins the first slot instead of an unseen fallacy.
const WEAK = "Ad Hominem"; // first fallacy in the question bank
const STRONG = "Straw Man"; // an unseen control

function WeakSpotHarness() {
  const { recordAnswer, progress } = useProgress();
  const { session, startSession } = useLearningEngine();

  return (
    <div>
      <div data-testid="attempts">{progress.fallacyStats[WEAK]?.attempts.join(",") ?? ""}</div>
      <button onClick={() => recordAnswer(WEAK, true, 2)}>
        record retry-correct
      </button>
      <button
        onClick={() =>
          startSession("training", undefined, undefined, {
            fallacies: [WEAK, STRONG],
          })
        }
      >
        start
      </button>
      <div data-testid="picked">{session?.questions[0]?.fallacy_name ?? ""}</div>
      <div data-testid="pool">
        {session ? [...new Set(session.questions.map(q => q.fallacy_name))].sort().join(",") : ""}
      </div>
    </div>
  );
}

describe("weak spots (behaviour 7)", () => {
  it("records a training retry-correct as attempts [2]", async () => {
    render(
      <ProgressProvider>
        <WeakSpotHarness />
      </ProgressProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /record retry-correct/i }));
    await waitFor(() => expect(screen.getByTestId("attempts").textContent).toBe("2"));
  });

  it("weights that fallacy 4x so it wins selection over an unseen one", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.6);
    try {
      render(
        <ProgressProvider>
          <WeakSpotHarness />
        </ProgressProvider>
      );

      fireEvent.click(screen.getByRole("button", { name: /record retry-correct/i }));
      await waitFor(() => expect(screen.getByTestId("attempts").textContent).toBe("2"));

      fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
      await waitFor(() => expect(screen.getByTestId("picked").textContent).toBe(WEAK));
      // Guard against a vacuous pass: both fallacies really were in the pool.
      expect(screen.getByTestId("pool").textContent).toBe(`${WEAK},${STRONG}`);
    } finally {
      randomSpy.mockRestore();
    }
  });

  it("surfaces a retry-correct as a struggle in the stats dashboard", () => {
    let progressApi: ReturnType<typeof useProgress> | null = null;
    function ProgressApiHarness() {
      progressApi = useProgress();
      return null;
    }

    render(
      <ProgressProvider>
        <ProgressApiHarness />
      </ProgressProvider>
    );

    act(() => {
      progressApi!.recordAnswer(WEAK, true, 2);
    });

    render(
      <StatsDashboard
        progress={progressApi!.progress}
        getCategoryMastery={progressApi!.getCategoryMastery}
        onPracticeFallacies={noop}
      />
    );

    expect(screen.getByText("Common Confusions")).toBeInTheDocument();
    expect(screen.getAllByText(WEAK).length).toBeGreaterThan(0);
  });
});
