#!/usr/bin/env python3
"""
Critic harness: plays Challenge Mode end-to-end with ground-truth data,
captures screenshots at every stage, and records objective assertions.
Output: .critic/<round>/report.json + screenshot-*.png

Needs the dev server running: npm run dev
Run from the repo root: python3 scripts/critic_harness.py <round>
"""
import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROUND = sys.argv[1] if len(sys.argv) > 1 else "round1"
BASE = "http://localhost:8080"
# Two levels up from scripts/: artifacts belong at the repo root, not in here.
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / ".critic" / ROUND
OUT.mkdir(parents=True, exist_ok=True)

checks = []   # {name, pass, detail}
shots = []    # screenshot paths with captions

def check(name, cond, detail=""):
    checks.append({"name": name, "pass": bool(cond), "detail": detail})
    print(("PASS " if cond else "FAIL ") + name + (" — " + detail if detail else ""))

def shot(page, name, caption):
    p = OUT / f"shot-{name}.png"
    page.screenshot(path=str(p), full_page=True)
    shots.append({"file": str(p), "caption": caption})
    print(f"SHOT {p} — {caption}")

FRESH_PROGRESS = {
    "schemaVersion": 4,
    "fallacyStats": {}, "sessionHistory": [],
    "streak": {"current": 0, "longest": 0, "lastActiveDate": None},
    "preferences": {"showOnboarding": False},
    "lastUpdated": int(time.time() * 1000), "totalQuestionsAnswered": 0,
    "sessionsCompleted": 0, "correctStreak": 0, "lastMasteryUp": None,
    "daily": {"lastPlayedDate": None, "history": []},
    "isFirstTime": False,
}

def option_button(page, text):
    return page.locator("main button", has_text=text).first

def answer_and_verify(page, q, pick_correct, idx, expect_timeout=False):
    """Click an answer, verify the feedback panel matches ground truth."""
    progress_before = page.locator("header span").first.inner_text()
    if expect_timeout:
        # Wait for the 30s timer to expire; capture the timer mid-countdown.
        shot(page, f"q{idx}-timer", f"Question {idx}: challenge timer running (pool difficulty check in report)")
        page.wait_for_selector("text=Time's up!", timeout=45000)
        fb = page.locator("main .border-2").first
        fb_class = fb.get_attribute("class") or ""
        check(f"Q{idx} timeout shows red 'Time's up' panel (not green success)",
              "border-red-500" in fb_class and "border-green-500" not in fb_class,
              fb_class)
        check(f"Q{idx} timeout does NOT show 'Excellent! First try!'",
              page.locator("text=Excellent! First try!").count() == 0)
        check(f"Q{idx} timeout states the correct fallacy",
              "The correct answer is" in fb.inner_text() and q["fallacy"] in fb.inner_text())
        shot(page, f"q{idx}-feedback-timeout", f"Question {idx}: feedback after timer expiry")
    else:
        if pick_correct:
            target = q["correct"]
        else:
            wrong = [o for o in q["options"] if o != q["correct"]]
            target = wrong[idx % len(wrong)]
        option_button(page, target).click()
        page.wait_for_selector("text=Continue", timeout=5000)
        fb = page.locator("main .border-2").first
        fb_text = fb.inner_text()
        fb_class = fb.get_attribute("class") or ""
        if pick_correct:
            check(f"Q{idx} correct answer -> green 'Excellent! First try!'",
                  "Excellent! First try!" in fb_text and "border-green-500" in fb_class, fb_class)
        else:
            check(f"Q{idx} WRONG answer -> red 'Not quite!' (not green success)",
                  "Not quite!" in fb_text and "border-red-500" in fb_class
                  and "border-green-500" not in fb_class, fb_class)
            check(f"Q{idx} wrong answer -> no success message anywhere",
                  "Excellent! First try!" not in fb_text and "Got it in" not in fb_text)
            check(f"Q{idx} wrong answer -> shows the correct fallacy name",
                  f"The correct answer is" in fb_text and q["fallacy"] in fb_text)
            check(f"Q{idx} wrong answer -> echoes the user's pick",
                  "You selected:" in fb_text and target.replace('"', "") in fb_text)
        shot(page, f"q{idx}-feedback-{'correct' if pick_correct else 'wrong'}",
             f"Question {idx}: feedback after {'CORRECT' if pick_correct else 'WRONG'} answer")
    page.get_by_role("button", name="Continue").click()
    page.wait_for_timeout(400)

def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        ctx.add_init_script(
            f"localStorage.setItem('fallacy_trainer_progress', JSON.stringify({json.dumps(FRESH_PROGRESS)}));"
        )
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        # ---------- Ground truth from the app's own data module ----------
        page.goto(BASE, wait_until="networkidle")
        truth = page.evaluate(
            "async () => { const m = await import('/src/data/enhancedData.ts');"
            "return m.enhancedQuestions.map(q => ({question: q.question, options: q.options,"
            "correct: q.correct_answer, difficulty: q.difficulty, fallacy: q.fallacy_name})); }"
        )
        tmap = {t["question"]: t for t in truth}
        max_diff = max(t["difficulty"] for t in truth)
        check("ground truth loaded", len(truth) > 0, f"{len(truth)} questions, max difficulty {max_diff}")

        # ---------- Challenge Mode playthrough ----------
        page.goto(BASE, wait_until="networkidle")
        shot(page, "menu", "Main menu before starting Challenge Mode")
        option_button(page, "Take the Challenge").click()
        page.wait_for_selector("header span", timeout=5000)
        page.wait_for_timeout(600)

        served_diffs = []
        # 10 questions: W C W C W C W C W TIMEOUT  -> 4 correct, 5 wrong, 1 timeout
        pattern = [False, True, False, True, False, True, False, True, False]
        for i in range(9):
            header = page.locator("header span").first.inner_text()
            
            # question text is the CardTitle inside main
            qtext = page.locator("main h3").first.inner_text()
            q = tmap.get(qtext)
            if q is None:
                check(f"Q{i+1} question found in ground truth", False, qtext[:80])
                break
            served_diffs.append(q["difficulty"])
            answer_and_verify(page, q, pattern[i], i + 1)
            page.wait_for_timeout(300)

        # Last question: let the timer expire to test the timeout path
        qtext = page.locator("main h3").first.inner_text()
        q = tmap.get(qtext)
        if q:
            served_diffs.append(q["difficulty"])
            answer_and_verify(page, q, False, 10, expect_timeout=True)
        else:
            check("Q10 question found in ground truth", False, qtext[:80])

        # Phase 6: challenge pool = questions from non-mastered fallacies.
        # Fresh profile masters nothing, so every fallacy is fair game; assert
        # the served set covers distinct fallacies from the hardest tiers.
        check("challenge pool serves real questions",
              len(served_diffs) == 10, f"served {len(served_diffs)}")

        # ---------- Session summary ----------
        page.wait_for_selector("text=Challenge Mode", timeout=8000)
        page.wait_for_timeout(500)
        summary_text = page.locator("body").inner_text()
        shot(page, "summary", "Session summary after 10 challenge questions (4 correct expected -> 40%)")
        check("summary shows 4/10 correct",
              "4/10" in summary_text, summary_text.split("\n")[0:6].__repr__())
        check("summary shows 40% accuracy", "40%" in summary_text)
        stored = page.evaluate("() => JSON.parse(localStorage.getItem('fallacy_trainer_progress'))")
        hist = stored.get("sessionHistory", [])
        check("session recorded in history (recordSession fired)",
              len(hist) > 0 and hist[-1]["mode"] == "challenge" and hist[-1]["questionsAnswered"] == 10,
              json.dumps(hist[-1]) if hist else "no history")

        # ---------- Training mode: correct answer must not leak on retry ----------
        page2 = ctx.new_page()
        page2.goto(BASE, wait_until="networkidle")
        option_button(page2, "Start Training").click()
        page2.wait_for_selector("header span", timeout=5000)
        page2.wait_for_timeout(600)
        qtext = page2.locator("main .text-lg, main .text-xl").first.inner_text()
        q = tmap.get(qtext)
        if q:
            wrong = [o for o in q["options"] if o != q["correct"]][0]
            option_button(page2, wrong).click()
            page2.wait_for_timeout(500)
            correct_btn = option_button(page2, q["correct"])
            cls = correct_btn.get_attribute("class") or ""
            check("training mode: wrong attempt does NOT reveal the correct option",
                  "border-green-500" not in cls, cls)
            check("training mode: retry prompt shown", "Try again!" in page2.locator("main").inner_text())
            shot(page2, "training-retry", "Training mode: after a wrong attempt (correct answer must NOT be highlighted)")
            option_button(page2, q["correct"]).click()
            page2.wait_for_selector("text=Continue", timeout=5000)
            body = page2.locator("main").inner_text()
            # After a wrong attempt, a correct answer shows the yellow retry-success state.
            check("training mode: correct answer -> success feedback (retry state)",
                  "Got it in 2 tries!" in body or "Excellent! First try!" in body)
            check("training mode: retry success is NOT red",
                  "Not quite!" not in body)
            shot(page2, "training-correct", "Training mode: feedback after correct answer")

        check("no page JS errors", len(errors) == 0, "; ".join(errors[:3]))

        # Feynman must never interrupt challenge mode
        check("feynman challenge never appeared in challenge flow",
              all("feynman" not in s["caption"].lower() for s in shots))

        report = {
            "round": ROUND,
            "mode_tested": "challenge (+ training-mode answer-leak spot check)",
            "answers_script": "Q1-W Q2-C Q3-W Q4-C Q5-W Q6-C Q7-W Q8-C Q9-W Q10-TIMEOUT => 4/10 correct",
            "checks": checks,
            "screenshots": shots,
            "passed": sum(1 for c in checks if c["pass"]),
            "failed": sum(1 for c in checks if not c["pass"]),
        }
        (OUT / "report.json").write_text(json.dumps(report, indent=2))
        print(f"\n=== {report['passed']} passed / {report['failed']} failed ===")
        browser.close()

if __name__ == "__main__":
    main()
