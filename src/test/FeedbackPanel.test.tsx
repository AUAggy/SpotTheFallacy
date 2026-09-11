import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { FeedbackPanel } from "@/components/training/FeedbackPanel";
import { enhancedQuestions } from "@/data/enhancedData";

// Use a real question from the dataset so getFallacyByName resolves.
const question = enhancedQuestions[0];
const wrongOption =
  question.options.find(o => o !== question.correct_answer) ?? "Some wrong answer";

describe("FeedbackPanel", () => {
  it("shows the green first-try state for a correct first attempt", () => {
    render(
      <FeedbackPanel
        question={question}
        attempts={1}
        isCorrect={true}
        selectedAnswer={question.correct_answer}
        onContinue={() => {}}
      />
    );

    expect(screen.getByText(/Excellent! First try!/i)).toBeInTheDocument();
    expect(screen.queryByText(/Not quite!/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Time's up!/i)).not.toBeInTheDocument();
  });

  it("shows the retry state for a correct answer after multiple attempts", () => {
    render(
      <FeedbackPanel
        question={question}
        attempts={3}
        isCorrect={true}
        selectedAnswer={question.correct_answer}
        onContinue={() => {}}
      />
    );

    expect(screen.getByText(/Got it in 3 tries!/i)).toBeInTheDocument();
    expect(screen.queryByText(/Excellent! First try!/i)).not.toBeInTheDocument();
  });

  // Regression test: in challenge mode a wrong answer also has attempts === 1,
  // which used to render the green "Excellent! First try!" success screen.
  it("shows the red wrong-answer state (not success) for a wrong first attempt", () => {
    render(
      <FeedbackPanel
        question={question}
        attempts={1}
        isCorrect={false}
        selectedAnswer={wrongOption}
        onContinue={() => {}}
      />
    );

    expect(screen.getByText(/Not quite!/i)).toBeInTheDocument();
    expect(screen.queryByText(/Excellent! First try!/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Got it in/i)).not.toBeInTheDocument();

    // It must state the correct fallacy, not celebrate.
    expect(screen.getByText(/The correct answer is/i)).toBeInTheDocument();

    // It must show what the user picked.
    expect(screen.getByText(/You selected:/i)).toBeInTheDocument();
    expect(screen.getByText(`"${wrongOption}"`)).toBeInTheDocument();
  });

  it("shows the time's-up state when the timer expires", () => {
    render(
      <FeedbackPanel
        question={question}
        attempts={1}
        isCorrect={false}
        timedOut={true}
        selectedAnswer={null}
        onContinue={() => {}}
      />
    );

    expect(screen.getByText(/Time's up!/i)).toBeInTheDocument();
    expect(screen.queryByText(/Excellent! First try!/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/You selected:/i)).not.toBeInTheDocument();
  });

  it("never shows success styling for a wrong answer", () => {
    const { container } = render(
      <FeedbackPanel
        question={question}
        attempts={1}
        isCorrect={false}
        selectedAnswer={wrongOption}
        onContinue={() => {}}
      />
    );

    const card = container.querySelector("[data-slot=card], .border-2") as HTMLElement;
    expect(card.className).toContain("border-red-500");
    expect(card.className).not.toContain("border-green-500");

    const heading = screen.getByText(/Not quite!/i);
    expect(heading.className).toContain("text-red-700");
    expect(heading.className).not.toContain("text-green-700");

    // Sanity: exactly one of the state headers is rendered.
    const cardText = within(card);
    expect(cardText.getByText(/Not quite!/i)).toBeInTheDocument();
  });
});
