"""Capture README screenshots: mid-game play in tablet + mobile portrait.
Output: docs/screenshots/*.png (2x scale for crisp rendering on GitHub)."""
import json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8080"
OUT = Path("docs/screenshots")
OUT.mkdir(parents=True, exist_ok=True)

FRESH = {
    "schemaVersion": 4,
    "fallacyStats": {
        "Ad Hominem": {"totalSeen": 6, "correctFirstTry": 5, "correctAfterRetry": 1, "incorrect": 0, "lastSeen": int(time.time()*1000), "attempts": [1,1,2,1]},
        "Straw Man": {"totalSeen": 5, "correctFirstTry": 4, "correctAfterRetry": 1, "incorrect": 0, "lastSeen": int(time.time()*1000), "attempts": [1,1,1,2]},
        "Slippery Slope": {"totalSeen": 4, "correctFirstTry": 2, "correctAfterRetry": 1, "incorrect": 1, "lastSeen": int(time.time()*1000), "attempts": [1,2,1]},
        "Appeal to Fear": {"totalSeen": 3, "correctFirstTry": 1, "correctAfterRetry": 1, "incorrect": 1, "lastSeen": int(time.time()*1000), "attempts": [1,2]},
        "Sunk-Cost Fallacy": {"totalSeen": 3, "correctFirstTry": 2, "correctAfterRetry": 0, "incorrect": 1, "lastSeen": int(time.time()*1000), "attempts": [1,1]},
        "False Dilemma": {"totalSeen": 4, "correctFirstTry": 3, "correctAfterRetry": 1, "incorrect": 0, "lastSeen": int(time.time()*1000), "attempts": [1,1,2]},
    },
    "sessionHistory": [
        {"date": int(time.time()*1000) - 86400000, "mode": "challenge", "questionsAnswered": 10, "correctFirstTry": 7, "mastered": 3, "duration": 300000},
        {"date": int(time.time()*1000) - 172800000, "mode": "daily", "questionsAnswered": 5, "correctFirstTry": 4, "mastered": 3, "duration": 140000},
    ],
    "streak": {"current": 4, "longest": 9, "lastActiveDate": time.ctime()},
    "preferences": {"showOnboarding": False},
    "lastUpdated": int(time.time()*1000), "totalQuestionsAnswered": 47,
    "sessionsCompleted": 11, "correctStreak": 0, "lastMasteryUp": None,
    "daily": {"lastPlayedDate": None, "history": []},
    "isFirstTime": False,
}

def run(vp_name, width, height, dsf, tablet=False):
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        ctx = b.new_context(viewport={"width": width, "height": height},
                            device_scale_factor=dsf, reduced_motion="reduce")
        ctx.add_init_script(f"localStorage.setItem('fallacy_trainer_progress', JSON.stringify({json.dumps(FRESH)}));")
        page = ctx.new_page()
        page.goto(BASE, wait_until="networkidle")
        truth = page.evaluate("""async () => {
            const m = await import('/src/data/enhancedData.ts');
            return m.enhancedQuestions.map(q => ({question: q.question, options: q.options,
                correct: q.correct_answer, fallacy: q.fallacy_name, id: q.id}));
        }""")
        tmap = {t["question"]: t for t in truth}

        page.locator("button", has_text="Start Training").first.click()
        page.wait_for_selector("header span")

        # answer three questions to reach a believable mid-session state (4/10)
        for i in range(3):
            qtext = page.locator("main h3").first.inner_text()
            t = tmap[qtext]
            pick_correct = (i != 1)  # one miss mid-session for the retry path
            if pick_correct:
                page.locator("button", has_text=t["correct"]).first.click()
            else:
                wrong = [o for o in t["options"] if o != t["correct"]][0]
                page.locator("button", has_text=wrong).first.click()
                page.wait_for_timeout(400)
                # retry until correct (training mode allows it)
                page.locator("button", has_text=t["correct"]).first.click()
            page.wait_for_selector("text=Continue", timeout=5000)
            page.get_by_role("button", name="Continue").click()
            page.wait_for_timeout(250)

        if tablet:
            # land on the rich feedback panel for the screenshot
            qtext = page.locator("main h3").first.inner_text()
            t = tmap[qtext]
            page.locator("button", has_text=t["correct"]).first.click()
            page.wait_for_selector("text=Continue", timeout=5000)
            page.screenshot(path=str(OUT / "tablet-feedback.png"), full_page=True)
        else:
            page.screenshot(path=str(OUT / "mobile-question.png"))
        print(f"captured {vp_name}")
        b.close()

run("mobile-portrait", 390, 844, 2, tablet=False)
run("tablet", 820, 1180, 2, tablet=True)
