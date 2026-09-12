#!/usr/bin/env python3
"""
Copy & layout review harness: captures every screen of the app at mobile
portrait, tablet, and desktop viewports, and asserts no text overflows.
Output: .critic/<round>/report.json + screenshot-*.png
"""
import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROUND = sys.argv[1] if len(sys.argv) > 1 else "round1"
BASE = "http://localhost:8080"
OUT = Path(__file__).parent / ".critic" / ROUND
OUT.mkdir(parents=True, exist_ok=True)

VIEWPORTS = [
    ("mobile", 390, 844),
    ("tablet", 768, 1024),
    ("desktop", 1440, 900),
]

results = []   # per-screen: {viewport, screen, shot, overflow, detail}
shots_all = []

FRESH = {
    "currentDifficulty": 1, "fallacyStats": {}, "sessionHistory": [],
    "streak": {"current": 0, "longest": 0, "lastActiveDate": None},
    "preferences": {"theme": "light", "showOnboarding": False},
    "lastUpdated": int(time.time() * 1000), "totalQuestionsAnswered": 0,
    "sessionsCompleted": 0, "consecutiveCorrect": 0, "recentResults": [],
    "seenQuestionIds": [], "correctStreak": 0, "isFirstTime": False,
}

OVERFLOW_JS = """() => {
  const vw = window.innerWidth;
  const doc = document.documentElement;
  const hasHScroll = doc.scrollWidth > vw + 1;
  const hasVScroll = doc.scrollHeight > window.innerHeight + 1;

  const ancestorScrollsX = (el) => {
    let p = el.parentElement;
    while (p && p !== document.body) {
      const ov = getComputedStyle(p).overflowX;
      if (ov === 'auto' || ov === 'scroll' || ov === 'overlay' || ov === 'hidden' || ov === 'clip') return true;
      p = p.parentElement;
    }
    return false;
  };

  const offenders = [];
  document.querySelectorAll('h1,h2,h3,h4,p,span,button,label,li,pre,div').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') return;
    if (r.right > vw + 1 && !ancestorScrollsX(el)) {
      const text = (el.textContent || '').trim().slice(0, 40);
      offenders.push(`${el.tagName}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0,2).join('.') : ''} right=${Math.round(r.right)} "${text}"`);
    }
    // text clipped inside its own box (e.g. white-space:nowrap too long)
    if (el.children.length === 0 && el.scrollWidth > el.clientWidth + 3 && style.overflowX === 'visible' && style.textOverflow !== 'ellipsis') {
      const text = (el.textContent || '').trim().slice(0, 40);
      offenders.push(`CLIPPED ${el.tagName} w=${el.clientWidth} sw=${el.scrollWidth} "${text}"`);
    }
  });
  return { vw, scrollWidth: doc.scrollWidth, hasHScroll, hasVScroll, offenders: [...new Set(offenders)].slice(0, 10) };
}"""

def capture(ctx, seed_overrides=None):
    seed = dict(FRESH)
    if seed_overrides:
        seed.update(seed_overrides)
    ctx.add_init_script(
        f"localStorage.setItem('fallacy_trainer_progress', JSON.stringify({json.dumps(seed)}));"
    )
    return ctx.new_page()

def snap(page, vp, screen, note=""):
    fname = f"{vp}-{screen}.png"
    page.screenshot(path=str(OUT / fname), full_page=True)
    ov = page.evaluate(OVERFLOW_JS)
    rec = {
        "viewport": vp, "screen": screen, "shot": str(OUT / fname),
        "horizontal_scroll": ov["hasHScroll"],
        "overflow_offenders": ov["offenders"],
        "ok": not ov["hasHScroll"] and len(ov["offenders"]) == 0,
        "note": note,
    }
    results.append(rec)
    shots_all.append(rec)
    print(("OK   " if rec["ok"] else "OVFL ") + f"[{vp}] {screen}" +
          ("" if rec["ok"] else f" -> {ov['offenders'][:3]} scrollW={ov['scrollWidth']} vw={ov['vw']}"))
    return rec

def opt_btn(page, text):
    return page.locator("button", has_text=text).first

def get_truth(page):
    return page.evaluate(
        "async () => { const m = await import('/src/data/enhancedData.ts');"
        "return m.enhancedQuestions.map(q => ({question: q.question, options: q.options,"
        "correct: q.correct_answer, fallacy: q.fallacy_name,"
        "keyTerms: (m.getFallacyByName(q.fallacy_name)?.keyTerms) || []})); }"
    )

def challenge_flow(browser, vp, w, h, truth):
    ctx = browser.new_context(viewport={"width": w, "height": h})
    page = capture(ctx)
    page.goto(BASE, wait_until="networkidle")
    opt_btn(page, "Take the Challenge").click()
    page.wait_for_selector("header span", timeout=5000)
    page.wait_for_timeout(500)
    tmap = {t["question"]: t for t in truth}

    # Q1: wrong answer
    qtext = page.locator("main h3").first.inner_text()
    q = tmap[qtext]
    wrong = [o for o in q["options"] if o != q["correct"]][0]
    snap(page, vp, "challenge-question", qtext[:60])
    opt_btn(page, wrong).click()
    page.wait_for_selector("text=Continue", timeout=5000)
    snap(page, vp, "feedback-wrong", f"picked '{wrong}'")
    page.get_by_role("button", name="Continue").click(); page.wait_for_timeout(300)

    # Q2: correct answer
    qtext = page.locator("main h3").first.inner_text()
    q = tmap[qtext]
    opt_btn(page, q["correct"]).click()
    page.wait_for_selector("text=Continue", timeout=5000)
    snap(page, vp, "feedback-correct")
    page.get_by_role("button", name="Continue").click(); page.wait_for_timeout(300)

    # Q3-Q8: alternate to reach the summary quickly (truth-verified)
    pattern = [True, False, True, False, True, False]
    for i, pick in enumerate(pattern):
        qtext = page.locator("main h3").first.inner_text()
        q = tmap[qtext]
        target = q["correct"] if pick else [o for o in q["options"] if o != q["correct"]][i % 3]
        opt_btn(page, target).click()
        page.wait_for_selector("text=Continue", timeout=5000)
        page.get_by_role("button", name="Continue").click(); page.wait_for_timeout(250)

    # Q9: let timer expire (once, on the mobile viewport only to save time)
    if vp == "mobile":
        page.wait_for_selector("text=Time's up!", timeout=45000)
        snap(page, vp, "feedback-timeout")
        page.get_by_role("button", name="Continue").click(); page.wait_for_timeout(300)
        # Q10 wrong to finish
        qtext = page.locator("main h3").first.inner_text()
        q = tmap[qtext]
        opt_btn(page, [o for o in q["options"] if o != q["correct"]][0]).click()
        page.wait_for_selector("text=Continue", timeout=5000)
        page.get_by_role("button", name="Continue").click()
    else:
        # finish remaining questions quickly
        remaining = 10 - (2 + len(pattern) + 1)  # after 8 answered, 2 left; Q9,Q10
        for i in range(remaining + 1):
            qtext = page.locator("main h3").first.inner_text()
            if not qtext:
                break
            q = tmap[qtext]
            target = q["correct"] if i % 2 == 0 else [o for o in q["options"] if o != q["correct"]][0]
            opt_btn(page, target).click()
            page.wait_for_selector("text=Continue", timeout=5000)
            page.get_by_role("button", name="Continue").click(); page.wait_for_timeout(250)
            if page.locator("text=Complete").count() > 0:
                break

    page.wait_for_selector("text=Complete", timeout=8000)
    page.wait_for_timeout(400)
    snap(page, vp, "session-summary")
    ctx.close()

def training_feynman_flow(browser, vp, w, h, truth):
    ctx = browser.new_context(viewport={"width": w, "height": h})
    page = capture(ctx, seed_overrides={"correctStreak": 3})
    page.goto(BASE, wait_until="networkidle")
    opt_btn(page, "Start Training").click()
    page.wait_for_selector("header span", timeout=5000)
    page.wait_for_timeout(500)
    tmap = {t["question"]: t for t in truth}
    qtext = page.locator("main h3").first.inner_text()
    q = tmap[qtext]
    wrong = [o for o in q["options"] if o != q["correct"]][0]

    # wrong attempt -> retry box
    opt_btn(page, wrong).click()
    page.wait_for_timeout(400)
    snap(page, vp, "training-retry")
    # correct answer -> Feynman challenge (seeded streak)
    opt_btn(page, q["correct"]).click()
    page.wait_for_selector("text=Feynman Challenge", timeout=5000)
    snap(page, vp, "feynman-prompt")
    # write an explanation rich in key terms
    terms = " ".join(q["keyTerms"][:4]) or "the argument attacks the person"
    explanation = (f"This is {q['fallacy']} because the reasoning {terms} and "
                   f"never addresses the actual claim being made.")
    page.locator("textarea").fill(explanation)
    page.get_by_role("button", name="Submit Explanation").click()
    page.wait_for_timeout(400)
    snap(page, vp, "feynman-result")
    page.get_by_role("button", name="Continue").click()
    page.wait_for_timeout(300)
    snap(page, vp, "feedback-correct-after-retry")
    ctx.close()

def static_flows(browser, vp, w, h, first_time=False):
    ctx = browser.new_context(viewport={"width": w, "height": h})
    seed = {"isFirstTime": True} if first_time else None
    page = capture(ctx, seed_overrides=seed)
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(400)
    if first_time:
        snap(page, vp, "welcome")
        opt_btn(page, "Browse All Modes").click()
        page.wait_for_timeout(300)
    else:
        page.locator("body").screenshot if False else None
    snap(page, vp, "menu")
    # stats with some progress seeded
    page.evaluate("""() => {
      const p = JSON.parse(localStorage.getItem('fallacy_trainer_progress'));
      p.totalQuestionsAnswered = 84; p.sessionsCompleted = 9;
      p.streak = { current: 1, longest: 6, lastActiveDate: new Date().toDateString() };
      p.fallacyStats['Ad Hominem'] = { totalSeen: 12, correctFirstTry: 9, correctAfterRetry: 2, incorrect: 1, lastSeen: Date.now(), attempts: [1,1,2] };
      p.fallacyStats['Straw Man'] = { totalSeen: 10, correctFirstTry: 3, correctAfterRetry: 2, incorrect: 5, lastSeen: Date.now(), attempts: [1,2,3] };
      localStorage.setItem('fallacy_trainer_progress', JSON.stringify(p));
    }""")
    opt_btn(page, "Stats").click()
    page.wait_for_timeout(500)
    snap(page, vp, "stats")
    opt_btn(page, "Settings").click()
    page.wait_for_timeout(400)
    snap(page, vp, "settings")
    ctx.close()


def check(name, cond, detail=""):
    results.append({"viewport": "-", "screen": "CHECK: " + name, "shot": "",
                    "horizontal_scroll": False, "overflow_offenders": [],
                    "ok": bool(cond), "note": detail})
    print(("PASS " if cond else "FAIL ") + name + ((" - " + detail) if detail else ""))

def daily_quick_flow(browser, vp, w, h, truth):
    ctx = browser.new_context(viewport={"width": w, "height": h})
    page = capture(ctx)
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(300)
    tmap = {t["question"]: t for t in truth}

    # Daily challenge: deterministic 5, one shot
    page.locator("text=Today's 5").first.click()
    page.wait_for_selector("header span", timeout=5000)
    header = page.locator("header span").first.inner_text()
    check(f"[{vp}] daily serves 5 questions", "/ 5" in header, header)
    for i in range(5):
        qtext = page.locator("main h3").first.inner_text()
        q = tmap[qtext]
        pick_correct = i % 2 == 0
        target = q["correct"] if pick_correct else [o for o in q["options"] if o != q["correct"]][0]
        opt_btn(page, target).click()
        page.wait_for_selector("text=Continue", timeout=5000)
        fb = page.locator("main .border-2").first.inner_text()
        if pick_correct:
            check(f"[{vp}] daily Q{i+1} correct -> success", "Excellent! First try!" in fb)
        else:
            check(f"[{vp}] daily Q{i+1} wrong -> red feedback", "Not quite!" in fb)
        page.get_by_role("button", name="Continue").click()
        page.wait_for_timeout(250)
    page.wait_for_selector("text=Daily Challenge Complete", timeout=8000)
    snap(page, vp, "daily-summary")
    daily = page.evaluate("() => JSON.parse(localStorage.getItem('fallacy_trainer_progress')).daily")
    from datetime import date
    today = date.today().isoformat()
    check(f"[{vp}] daily recorded for today", daily["lastPlayedDate"] == today, str(daily))
    page.locator("button", has_text="Back to Menu").click()
    page.wait_for_timeout(400)

    # Replay blocked: card shows done state
    done = page.locator("text=Come back tomorrow").count()
    check(f"[{vp}] daily replay blocked after playing", done > 0)

    # Quick round: 3 questions
    page.locator("text=Quick Round").first.click()
    page.wait_for_selector("header span", timeout=5000)
    header = page.locator("header span").first.inner_text()
    check(f"[{vp}] quick round serves 3 questions", "/ 3" in header, header)
    def wait_new_question(prev_header):
        # wait until either the progress counter changes or the session ends
        for _ in range(40):
            page.wait_for_timeout(150)
            try:
                h = page.locator("header span").first.inner_text()
                if h != prev_header:
                    return h
            except Exception:
                pass
        return page.locator("header span").first.inner_text()

    qtext = page.locator("main h3").first.inner_text()
    q = tmap[qtext]
    opt_btn(page, q["correct"]).click()
    page.wait_for_selector("text=Continue", timeout=5000)
    prev_header = page.locator("header span").first.inner_text()
    page.get_by_role("button", name="Continue").click()
    for i in range(2):
        new_header = wait_new_question(prev_header)
        prev_header = new_header
        qtext = page.locator("main h3").first.inner_text()
        q = tmap[qtext]
        opt_btn(page, q["correct"]).click()
        try:
            page.wait_for_selector("text=Continue", timeout=5000)
        except Exception:
            page.screenshot(path=str(OUT / f"{vp}-quick-stuck.png"), full_page=True)
            print("stuck body:", page.locator("body").inner_text()[:300].replace(chr(10), " | "))
            raise
        prev_header = page.locator("header span").first.inner_text()
        page.get_by_role("button", name="Continue").click()
    page.wait_for_selector("text=Training Session Complete", timeout=8000)
    page.wait_for_timeout(300)
    snap(page, vp, "quick-summary")
    # share button copies without crashing
    page.locator("button", has_text="Copy result").click()
    page.wait_for_timeout(300)
    check(f"[{vp}] share button shows Copied!", page.locator("text=Copied!").count() > 0)
    ctx.close()

def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        truth = None
        # ground truth once (desktop context)
        ctx0 = browser.new_context()
        p0 = ctx0.new_page()
        p0.goto(BASE, wait_until="networkidle")
        truth = get_truth(p0)
        ctx0.close()

        for vp, w, h in VIEWPORTS:
            static_flows(browser, vp, w, h, first_time=(vp == "mobile"))
            challenge_flow(browser, vp, w, h, truth)
            training_feynman_flow(browser, vp, w, h, truth)
            if vp == "mobile":
                daily_quick_flow(browser, vp, w, h, truth)

        browser.close()

    failed = [r for r in results if not r["ok"]]
    report = {
        "round": ROUND,
        "viewports": {v: f"{w}x{h}" for v, w, h in VIEWPORTS},
        "screens": results,
        "passed": len(results) - len(failed),
        "failed": len(failed),
    }
    (OUT / "report.json").write_text(json.dumps(report, indent=2))
    print(f"\n=== {report['passed']} clean screens / {report['failed']} with overflow ===")

if __name__ == "__main__":
    main()
