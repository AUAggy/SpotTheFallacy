#!/usr/bin/env python3
"""
PWA harness: checks that the built app is installable and works offline.

Run against a production build, because the service worker only exists there:

    npm run build
    npm run preview &
    python3 scripts/pwa_harness.py [base-url]

Output: .critic/<round>/report.json (round defaults to "pwa").
"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173"
ROUND = sys.argv[2] if len(sys.argv) > 2 else "pwa"
# Two levels up from scripts/: artifacts belong at the repo root, not in here.
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / ".critic" / ROUND
OUT.mkdir(parents=True, exist_ok=True)

checks = []
console_errors = []

# Skip onboarding so the harness asserts against the menu. The app reads this
# on first paint; the shape matches the other harnesses and useProgress.tsx.
FRESH = {
    "schemaVersion": 4,
    "fallacyStats": {},
    "sessionHistory": [],
    "streak": {"current": 0, "longest": 0, "lastActiveDate": None},
    "preferences": {"showOnboarding": False},
    "lastUpdated": 0,
    "totalQuestionsAnswered": 0,
    "sessionsCompleted": 0,
    "correctStreak": 0,
    "lastMasteryUp": None,
    "daily": {"lastPlayedDate": None, "history": []},
    "isFirstTime": False,
}


def check(name, cond, detail=""):
    checks.append({"name": name, "pass": bool(cond), "detail": detail})
    print(("PASS " if cond else "FAIL ") + name + (" - " + detail if detail else ""))


def size_of(page, url):
    """Real pixel dimensions of an image URL, as the browser sees it."""
    return page.evaluate(
        """(url) => new Promise((resolve) => {
             const img = new Image();
             img.onload = () => resolve(`${img.naturalWidth}x${img.naturalHeight}`);
             img.onerror = () => resolve(null);
             img.src = url;
           })""",
        url,
    )


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        context = browser.new_context()
        context.add_init_script(
            "localStorage.setItem('fallacy_trainer_progress', "
            f"JSON.stringify({json.dumps(FRESH)}));"
        )
        page = context.new_page()
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(str(e)))

        page.goto(BASE, wait_until="networkidle")

        # --- manifest link and payload -------------------------------------
        href = page.get_attribute('link[rel="manifest"]', "href")
        check("html links a manifest", bool(href), str(href))

        manifest = page.evaluate(
            """async (href) => {
                 const res = await fetch(href);
                 return { status: res.status, type: res.headers.get('content-type'), body: await res.text() };
               }""",
            href,
        )
        check("manifest is served", manifest["status"] == 200, f"status {manifest['status']}")
        check(
            "manifest has a JSON content type",
            "json" in (manifest["type"] or ""),
            str(manifest["type"]),
        )

        data = json.loads(manifest["body"])
        check("manifest is valid JSON with a name", bool(data.get("name")), data.get("name", ""))
        check("short_name is set", bool(data.get("short_name")), data.get("short_name", ""))
        check(
            "display is standalone",
            data.get("display") == "standalone",
            str(data.get("display")),
        )
        check("start_url is set", bool(data.get("start_url")), str(data.get("start_url")))
        check("scope is set", bool(data.get("scope")), str(data.get("scope")))
        for field in ("background_color", "theme_color"):
            value = str(data.get(field, ""))
            check(f"{field} is a hex colour", value.startswith("#") and len(value) == 7, value)

        # --- icons ----------------------------------------------------------
        icons = data.get("icons", [])
        sizes = {i.get("sizes") for i in icons}
        check("manifest declares a 192 icon", "192x192" in sizes, str(sorted(s for s in sizes if s)))
        check("manifest declares a 512 icon", "512x512" in sizes, str(sorted(s for s in sizes if s)))
        check(
            "manifest declares a maskable icon",
            any("maskable" in str(i.get("purpose", "")) for i in icons),
            str([i.get("purpose") for i in icons]),
        )

        for icon in icons:
            src = icon["src"]
            url = src if src.startswith("http") else BASE + src
            check(f"icon {src} resolves to its declared size", size_of(page, url) == icon["sizes"],
                  f"{size_of(page, url)} vs {icon['sizes']}")

        # --- apple / iOS ----------------------------------------------------
        apple = page.get_attribute('link[rel="apple-touch-icon"]', "href")
        check("apple-touch-icon is linked", bool(apple), str(apple))
        if apple:
            url = apple if apple.startswith("http") else BASE + apple
            check("apple-touch-icon is 180x180", size_of(page, url) == "180x180", str(size_of(page, url)))
        check(
            "apple-mobile-web-app-capable is set",
            page.locator('meta[name="apple-mobile-web-app-capable"]').count() > 0,
        )
        check("theme-color meta is set", page.locator('meta[name="theme-color"]').count() > 0)

        # --- service worker -------------------------------------------------
        page.wait_for_timeout(1500)
        state = page.evaluate(
            """async () => {
                 const reg = await navigator.serviceWorker.getRegistration();
                 return { registered: !!reg, active: !!reg?.active, scope: reg?.scope ?? null };
               }"""
        )
        check("service worker registers", state["registered"], str(state))
        check("service worker activates", state["active"], str(state))

        page.reload(wait_until="networkidle")
        controlled = page.evaluate("() => !!navigator.serviceWorker.controller")
        check("service worker controls the page after reload", controlled)

        # --- offline ---------------------------------------------------------
        context.set_offline(True)
        try:
            page.reload(wait_until="domcontentloaded")
            page.wait_for_selector("h1", timeout=10000)
            heading = page.locator("h1").first.inner_text()
            check("app shell is served from cache while offline", "Spot The Fallacy" in heading, heading)
            check(
                "app is interactive while offline (react mounted)",
                page.locator("text=Training Mode").count() > 0,
            )
        except Exception as exc:  # noqa: BLE001 - report, do not raise
            check("offline reload works", False, str(exc)[:200])
        finally:
            context.set_offline(False)

        page.screenshot(path=str(OUT / "pwa-offline-reload.png"), full_page=True)

        check("no console errors", not console_errors, "; ".join(console_errors[:3]))
        browser.close()

    failed = [c for c in checks if not c["pass"]]
    (OUT / "report.json").write_text(
        json.dumps({"round": ROUND, "base": BASE, "checks": checks,
                    "passed": len(checks) - len(failed), "failed": len(failed)}, indent=2)
    )
    print(f"\n=== {len(checks) - len(failed)} passed / {len(failed)} failed ===")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
