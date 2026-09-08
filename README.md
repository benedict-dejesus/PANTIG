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

Pantig picks the best of three pronunciation styles, and the note under the buttons names
the voice it actually used:

1. **A Filipino voice** (`fil-PH` or `tl-PH`) — the syllable is spoken as written. This is
   the only genuinely natural option.
2. **A Spanish voice** — Filipino's five vowels are essentially Spanish vowels, so a Spanish
   voice sounds much closer to Filipino than an English one. The syllable is rewritten into
   Spanish spelling so the voice produces the Filipino sound: `ki` → `qui`, `ka` → `ca`,
   `gi` → `gui`, `wa` → `hua`.
3. **Any other voice** — respelled phonetically so an English voice says `bah` rather than
   "bay", and `ghih` rather than "gee".

   The respellings target Filipino's short, pure vowels, not the long English ones the
   obvious spelling would give:

   | | a | e | i | o | u |
   |---|---|---|---|---|---|
   | **spelled** | `ah` | `eh` | `ih` | `aw` | `oo` |
   | **as in** | h**a**lf | h**e**ck | h**i**t | **o**ff | wh**o** |

   So `bi` is `bih`, not `bee`; `bo` is `baw`, not `boh`. One limitation is honest to
   state: English has no word ending in the short vowel of "put", so no spelling elicits
   it in an open syllable. `oo` has the right quality and is only longer. A Spanish or
   Filipino voice produces all five vowels correctly and short.

**The `h` and `j` families are the exception.** Spanish has neither sound — its `h` is
silent and its `j` is the guttural /x/ of "loch" — so no Spanish spelling can produce
Filipino `ha` or `ja`. English has both natively, so those ten syllables are always spoken
by an English voice, even when everything else is using a Spanish one:

| | a | e | i | o | u |
|---|---|---|---|---|---|
| **h** | as in h**a**lf | as in **he**ck | as in **hi**t | as in **ho**logram | as in w**ho** |
| **j** | as in **ja**r | as in **je**t | as in **ji**ngle | as in **jo**y | as in **ju**ice |

On the rare device with a Spanish voice but no English one, they fall back to a rough
Spanish approximation, which is at least audible.

Either way the syllable is spoken as a **sound**, never spelled out. `Ba` is lowercased
before speaking, so it is pronounced "ba" and not "B-A". If the browser has no speech
support at all, the Speak button is disabled with an explanation and Pantig keeps working
as a visual syllable trainer.

### Getting a real Filipino voice

**Android** — this is worth doing; it is the difference between natural and approximate.
Settings → System → Languages & input → **Text-to-speech output** → Google Text-to-speech →
Install voice data → **Filipino**. Reload Pantig afterwards; the note under the buttons
should disappear.

**iPhone and iPad** — Apple does not ship a Filipino or Tagalog voice, so there is nothing
to install. Pantig falls back to a Spanish voice, which is the closest available. Adding a
Spanish voice under Settings → Accessibility → Spoken Content → Voices improves it.

### If you hear nothing on a phone

- Speech must be started by a tap. Pantig does this correctly, but a page left open from an
  older version may need a reload.
- On iPhone, the **silent/ringer switch** mutes speech synthesis in several iOS versions.
- Check the **media** volume specifically, not just the ringer volume.
- The app already requests maximum volume; anything quieter than expected comes from the
  chosen voice or the system output level.

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
