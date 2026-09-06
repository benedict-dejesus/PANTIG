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

Three layers, back to front:

1. **A mesh gradient.** Three large blurred colour blobs, cross-fading when the theme
   changes. Six themes named for familiar things — *mangga, kalamansi, ube, langit, rosas,
   dalandan* — and each one carries **two hue families**, not one: amber with dragonfruit
   pink, lime with teal, violet with aqua, sky with coral, pink with amber, orange with
   violet. A faint grain sits over the top so the large gradients do not look plasticky.
2. **A frosted glass pane** holding the syllable, floating above the mesh. The pane is
   always the same shape in the same place, so the child always knows where to look —
   only the light behind it changes.
3. **Tactile controls.** The primary button is a solid slab sitting on a darker edge that
   compresses when pressed, so a tap has a physical response.

Some things this deliberately does *not* do:

- **No neumorphic controls.** Neumorphism gives a button the same colour as its background
  and separates them with faint shadows only. For a five-year-old that destroys the "this
  is a button" signal, and it cannot pass contrast. Glass and soft depth are used for
  *surfaces*; anything tappable stays high-contrast and obviously pressable.
- **No frosted chips.** There are 180 of them in the list, and `backdrop-filter` on each
  would cost far more than it is worth. They use plain translucent white instead.

Contrast was measured, not eyeballed. Across all six themes the syllable sits between
**6.9:1 and 10.1:1** against the glass, taken at the thinnest part of the pane over the most
saturated blob — the worst case. White button labels clear **5.0:1** at every point of every
gradient, so even the small "Speak" sub-label is legible.

The syllable is set in **Andika**, a typeface SIL designed for beginning readers. Its
single-storey `a` and `g` match the print handwriting taught in Philippine schools, so the
letters on screen look like the letters a child is learning to write. **Fredoka** carries the
interface.

Accessibility: semantic HTML, real `<button>` elements, a skip link, visible focus rings,
labels in Filipino and English, an `aria-live` region announcing each new syllable, and full
support for `prefers-reduced-motion`. State is never signalled by colour alone — the Speak
button changes its label and icon as well as its ring.

## Licence

Free to use for teaching. Please keep the developer credit.
