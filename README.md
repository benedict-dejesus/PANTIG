# Pantig

A Filipino syllable reading trainer for young children.

**See a syllable → try to read it → tap Pakinggan to hear it → tap Susunod for the next one.**

Pantig shows one syllable at a time in a large, friendly typeface and pronounces it out loud
using the browser's own speech engine. There are no scores, timers, or levels — just the
reading loop.

**Developed by Benedict de Jesus.**

---

## What's inside

```
index.html                 the whole page
assets/css/styles.css      styles, including the six colour themes
assets/js/syllables.js     the syllable data (single source of truth)
assets/js/speech.js        pronunciation via the Web Speech API
assets/js/app.js           the deck, the themes, the list, the buttons
assets/favicon.svg         browser tab icon
.nojekyll                  tells GitHub Pages to serve the files as-is
```

No build step, no framework, no backend, no database, no API key. It is plain HTML, CSS,
and JavaScript, and every path in the page is relative — so it works from a plain folder,
from a web server, and from any GitHub Pages sub-path without configuration.

## The syllables

`assets/js/syllables.js` is the only place syllables are defined:

- 5 vowels: `a e i o u`
- 17 consonants: `b k d g h l m n p r s t w y f v j`
- each consonant × each vowel → **90 lowercase entries**
- each of those capitalized programmatically → **90 more entries**

**180 learning entries in total.** Lowercase and capitalized forms are separate entries —
`ba` and `Ba` are two different cards, and they are never shown together on the reading
screen. Nothing is typed out twice; the capitalized set is generated in code.

Syllables are drawn from a shuffled deck rather than picked at random, so a child meets all
180 before any of them comes round again, and the same entry never appears twice in a row.

## Run it on your computer

Double-click `index.html`. That's it — it opens in your browser and works.

If you'd rather serve it (closer to how GitHub Pages will behave):

```bash
npx serve .
```

## Publish it on GitHub Pages

1. Create a repository on GitHub and push this folder to it:

   ```bash
   git add .
   git commit -m "Add Pantig"
   git push -u origin main
   ```

2. On GitHub, open your repository and go to **Settings → Pages**.

3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`, folder `/ (root)`
   - Click **Save**.

4. Wait about a minute, then refresh the Settings → Pages screen. Your link appears at the
   top:

   ```
   https://<your-username>.github.io/<your-repository>/
   ```

That's the whole deployment. Because the app uses relative paths, it runs correctly at that
sub-path — there is no base path to configure and nothing to rebuild. To publish a change,
commit and push again; GitHub Pages updates on its own.

> Open the link over **https**. Some browsers only allow speech on secure pages. GitHub
> Pages is https by default.

## About the pronunciation

Pantig uses `SpeechSynthesis`, the speech engine already built into the browser. It is free
and works offline once the page has loaded, but the available voices are decided by the
device, not by the app. This is worth knowing before you test it:

- **If a Filipino voice is installed** (`fil-PH` or `tl-PH`), Pantig uses it and speaks the
  syllable directly. Most Android phones have one, and so do many Windows installs.
- **If there isn't one**, Pantig picks the best available voice and respells the syllable
  phonetically first — `ba` → `bah`, `bi` → `bee`, `bu` → `boo`, and `gi` → `ghee` to keep
  the hard *g*. An English voice then produces a close Filipino sound instead of saying
  "bay". The app says so, quietly, under the buttons when this happens.
- Either way the syllable is spoken as a **sound**, never spelled out. `Ba` is lowercased
  before speaking, so it is pronounced "ba" and not "B-A".
- **If the browser has no speech support at all**, the Speak button is disabled with an
  explanation and Pantig keeps working as a visual syllable trainer.

For the most accurate pronunciation, use an Android phone with the Filipino language pack,
or add Filipino under your system's text-to-speech settings.

## Notes on the design

- The syllable sits in a **capiz pane** — the pearl-shell window of an old Filipino house.
  The pane stays the same on every card so the child always knows where to look; only the
  light around it changes.
- Six themes named for familiar things — *mangga, kalamansi, ube, langit, rosas, dalandan* —
  rotate as the syllables change. The tint lives in the background and accents; the syllable
  ink is always a deep shade of the theme against a pearl pane, so contrast stays around
  7:1 no matter which theme is showing.
- The syllable is set in **Andika**, a typeface SIL designed for beginning readers. Its
  single-storey `a` and `g` match the print handwriting taught in Philippine schools, so the
  letters on screen look like the letters a child is learning to write.
- Accessibility: semantic HTML, real `<button>` elements, a skip link, visible focus rings,
  labels in Filipino and English, an `aria-live` region announcing each new syllable, and
  full support for `prefers-reduced-motion`. State is never signalled by colour alone.

## Licence

Free to use for teaching. Please keep the developer credit.
