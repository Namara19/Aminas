# Aminas: Light & Shadow (v0.1 playable PWA)

An original creature-collection game: restore a ruined island sanctuary, befriend Aminas, battle through the Overgrown Reliquary, breed and hatch new ones, and notice that The Entity is not telling you everything. Plain HTML/CSS/JS, no build step, no dependencies, no ads, no tracking, works offline.

## Publish it (about 5 minutes, free)

Any static HTTPS host works. The folder you upload is this folder (the one containing `index.html`).

**Easiest: Netlify Drop**
1. Go to https://app.netlify.com/drop (free account).
2. Drag this whole folder onto the page. You get an `https://something.netlify.app` URL.

**Or GitHub Pages**
1. Create a repo, upload these files (keep `.github` and `.nojekyll`).
2. Settings → Pages → Source: **GitHub Actions**. Push to `main`. Your URL is `https://<user>.github.io/<repo>/`.

**Or Cloudflare Pages / Vercel**: connect the repo, no build command, output directory `.`.

## Add to iPhone Home Screen
1. Open your URL in **Safari** on the iPhone (not inside another app).
2. **Play it once while online** so everything caches.
3. Tap **Share** → **Add to Home Screen** → **Add**.
4. Launch **Aminas** from the Home Screen. Rotate to landscape. Turn off Airplane Mode after testing offline if you like.

## Before you publish a change
Run `node tools/stamp.js` (rewrites `sw.js` with a new version and file list so phones fetch updates). The GitHub workflow does this for you. A "new version ready, Reload" banner appears in the game when an update is waiting.

## Play-test checklist
1. Launch → Title → **New Game** → skim or **Skip** the intro cards.
2. Read The Entity's arrival, pick **Lumifern** (Light) or **Umbrit** (Dark).
3. Tap the glowing **Sunlit Hollow** → Restore (40 gold). Tap **Snack** to feed; watch the xp bar; keep feeding for a level-up banner.
4. Open **Tasks**, claim rewards. Follow the pill at top-left.
5. **Explore** → Sunlit Meadow, tap Explore a couple of times, **Offer food** to befriend a new Amina. Check **Creatures** (28 entries, silhouettes explain how to find them).
6. Restore the **Tide Gate** → tap the pulsing **ring of stones** on the east shore (World Resonance event 1: Resonyx appears, Ember Ridge opens, sky changes).
7. Reach level 5, restore the **Reliquary Gate**, open **Dungeon**, pick up to 3 Aminas, win all 5 battles (elements: Fire>Nature>Water>Fire, Light⇄Dark).
8. Back on the island the **Dormant Spire awakens** (World Resonance event 2): new areas, the other starter appears, a **Silent Stone** stands in the middle. Tap it, finish the chapter.
9. Restore the **Old Hatchery**, breed two level-5+ Aminas (20-second test egg timer in Settings), hatch.
10. Close the app, reopen: everything is still there. Settings → Reset progress starts over.
Hidden test panel: Settings → tap the version line 7 times (resources, level-up, finish egg, befriend all).

## Tests
- `node tests/rules.test.js` : 38 rule/data/save tests (no dependencies).
- `node tests/browser.test.js` : drives the real UI in Chromium via Playwright (needs `npm i playwright`). Includes offline relaunch.
Neither runs on iOS Safari. Test on a real iPhone.

## Known limits
See the end of the delivery message. In short: only the Overgrown Reliquary is playable; Hollow Veil and Resonance Scar are defined and shown as sealed. Art is procedural placeholder, audio is synthesised, and nothing has been tested on real iOS yet.
