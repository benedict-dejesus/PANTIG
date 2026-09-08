/*
 * Pantig - pronunciation.
 *
 * Uses the browser's built-in SpeechSynthesis. No API key, no backend.
 *
 * Three pronunciation styles, best first:
 *
 *   native   a real Filipino voice (fil-PH / tl-PH). Speak the syllable as is.
 *   spanish  a Spanish voice. Filipino's five vowels are essentially Spanish
 *            vowels, so a Spanish voice sounds far closer to Filipino than an
 *            English one. The syllable is rewritten into Spanish spelling so
 *            the voice produces the Filipino sound: "ki" -> "qui", "ha" -> "ja".
 *            Latin American voices are preferred; their "j" is a soft /h/.
 *   english  last resort, used only when the device has no Spanish voice at
 *            all. Respelled phonetically so an English voice says "bah"
 *            rather than "bay". English cannot make Filipino's short vowels,
 *            so installing a Spanish voice is a real improvement.
 *
 * One voice speaks every syllable. Mixing voices to get a few letters closer
 * is more confusing for a child than a consistent approximation.
 *
 * Two rules that matter on phones:
 *
 *   1. speak() must run inside the user gesture that triggered it. iOS Safari
 *      and some Android browsers silently drop speech started from a timer.
 *   2. Never set utterance.lang to a language the device has no voice for -
 *      that can produce silence instead of a fallback voice.
 */
(function (global) {
  'use strict';

  var synth = global.speechSynthesis;
  var supported = typeof global.SpeechSynthesisUtterance === 'function' && !!synth;

  var voice = null;
  var style = 'english';
  var changeHandlers = [];

  /* --- Rewriting a syllable for a non-Filipino voice --------------------- */

  /*
   * Filipino vowels are short and pure. English spellings that look obvious
   * give the long, drifting versions instead, so these are chosen for the
   * sound an English voice actually produces:
   *
   *   a  "ah"   as in half            ("a" alone would be the letter name)
   *   e  "eh"   as in heck
   *   i  "ih"   as in hit             ("ee" gives the long /i:/ of "see")
   *   o  "aw"   as in off             ("oh" gives the "ow" diphthong of "go")
   *   u  "oo"   as in who             (see the note on /ʊ/ below)
   *
   * "oo" is the closest English can get to Filipino "u". English has no word
   * ending in the short vowel of "put", so no spelling elicits it in an open
   * syllable - "oo" has the right quality and is only longer. A Spanish or
   * Filipino voice produces all five correctly and short.
   */
  var EN_VOWELS = { a: 'ah', e: 'eh', i: 'ih', o: 'aw', u: 'oo' };

  /*
   * Spanish spellings that produce the Filipino sound. Everything not listed
   * here (b, d, l, m, n, p, r, s, t, v, f, y) already reads correctly in
   * Spanish, so it is spoken unchanged.
   */
  var ES_ONSETS = {
    k: { a: 'ca',  e: 'que', i: 'qui', o: 'co',  u: 'cu' },   // hard k
    g: { a: 'ga',  e: 'gue', i: 'gui', o: 'go',  u: 'gu' },   // hard g
    w: { a: 'hua', e: 'hue', i: 'hui', o: 'huo', u: 'huu' },  // Spanish has no w

    // Spanish has no /h/ and no clean /dʒ/, so these two are approximations.
    // Spanish "h" is silent, so "ha" must be spelled "ja"; in Latin American
    // voices that j is close to Filipino /h/, which is why those voices are
    // preferred below. "dy" keeps j audibly distinct from the y family - "ya"
    // would collide with Filipino "ya" and blur two letters the child has to
    // tell apart.
    h: { a: 'ja',  e: 'je',  i: 'ji',  o: 'jo',  u: 'ju' },
    j: { a: 'dya', e: 'dye', i: 'dyi', o: 'dyo', u: 'dyu' }
  };

  function respell(syllable, forStyle) {
    var text = syllable.toLowerCase();
    var consonant = text.charAt(0);
    var vowel = text.charAt(1);

    if (forStyle === 'spanish') {
      if (text.length === 1) return text;            // vowels already read correctly
      if (ES_ONSETS[consonant]) return ES_ONSETS[consonant][vowel];
      return text;
    }

    if (text.length === 1) return EN_VOWELS[text] || text;

    // English voices soften "ge"/"gi" into a J sound; "gh" keeps the hard G.
    if (consonant === 'g' && (vowel === 'e' || vowel === 'i')) consonant = 'gh';
    return consonant + (EN_VOWELS[vowel] || vowel);
  }

  /**
   * Decide what to say and which voice says it.
   *
   * @returns {{text: string, voice: (SpeechSynthesisVoice|null)}}
   */
  function plan(syllable) {
    var lower = syllable.toLowerCase();

    // One voice speaks every syllable. Switching voices mid-drill for a few
    // letters is more confusing for a child than an imperfect approximation.
    if (style === 'native') return { text: lower, voice: voice };
    return { text: respell(lower, style), voice: voice };
  }

  function textFor(syllable) {
    return plan(syllable).text;
  }

  /* --- Choosing a voice -------------------------------------------------- */

  function isFilipino(candidate) {
    var lang = (candidate.lang || '').toLowerCase().replace('_', '-');
    var name = (candidate.name || '').toLowerCase();
    return lang.indexOf('fil') === 0 ||
      lang.indexOf('tl') === 0 ||
      name.indexOf('filipino') !== -1 ||
      name.indexOf('tagalog') !== -1;
  }

  function isSpanish(candidate) {
    return (candidate.lang || '').toLowerCase().replace('_', '-').indexOf('es') === 0;
  }

  /*
   * Latin American Spanish first. Its "j" is a soft /h/, close to Filipino
   * "ha"; Castilian "j" is the hard /x/ of "loch". Its "y" is also closer to
   * the Filipino j sound. Anything not listed still counts as Spanish, just
   * lower down.
   */
  var ES_REGIONS = ['es-us', 'es-mx', 'es-419', 'es-co', 'es-pe', 'es-cl', 'es-ve', 'es-ar'];

  function spanishRank(candidate) {
    var lang = (candidate.lang || '').toLowerCase().replace('_', '-');
    var index = ES_REGIONS.indexOf(lang);
    return index === -1 ? ES_REGIONS.length : index;
  }

  function bestSpanish(voices) {
    return voices.filter(isSpanish).sort(function (a, b) {
      return spanishRank(a) - spanishRank(b);
    })[0];
  }

  function selectVoice() {
    if (!supported) return;

    var voices = synth.getVoices() || [];
    if (!voices.length) return;

    var previous = voice;

    var found = voices.filter(isFilipino)[0];

    if (found) {
      voice = found;
      style = 'native';
    } else {
      found = bestSpanish(voices);
      if (found) {
        voice = found;
        style = 'spanish';
      } else {
        voice = voices.filter(function (candidate) { return candidate.default; })[0] || voices[0];
        style = 'english';
      }
    }

    if (voice !== previous) {
      changeHandlers.forEach(function (handler) { handler(); });
    }
  }

  if (supported) {
    selectVoice();
    // Voices load asynchronously in Chrome, Safari and on most phones.
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', selectVoice);
    } else {
      synth.onvoiceschanged = selectVoice;
    }
  }

  /* --- Unlocking the engine on mobile ------------------------------------
   * iOS in particular will not speak until one utterance has been started
   * from a real user gesture. A silent one on the first touch does it.
   */
  var unlocked = !supported;

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    try {
      var silent = new global.SpeechSynthesisUtterance(' ');
      silent.volume = 0;
      synth.speak(silent);
    } catch (error) {
      /* nothing to do - the real speak() below still gets its chance */
    }
  }

  if (supported) {
    global.document.addEventListener('pointerdown', unlock, { once: true });
    global.document.addEventListener('touchend', unlock, { once: true });
    global.document.addEventListener('keydown', unlock, { once: true });
  }

  /* --- Speaking ---------------------------------------------------------- */

  var safetyTimer = null;
  var retryTimer = null;
  var generation = 0;

  /**
   * Speak one syllable. Anything already playing is cancelled first, so
   * repeated taps never build up a queue of overlapping speech.
   *
   * Must be called from within a user gesture handler.
   *
   * @param {string} syllable
   * @param {{onstart: Function, onend: Function}} callbacks
   * @returns {boolean} false when speech synthesis is unavailable
   */
  function speak(syllable, callbacks) {
    callbacks = callbacks || {};
    if (!supported) return false;

    // Anything reporting back from an earlier tap is ignored below.
    generation += 1;
    var mine = generation;

    global.clearTimeout(safetyTimer);
    global.clearTimeout(retryTimer);

    unlock();

    // Always clear the queue first, so repeated taps replace each other
    // instead of stacking up. Chrome can drop an utterance queued straight
    // after a cancel; the watchdog at the bottom covers that.
    synth.cancel();
    if (synth.paused) synth.resume();

    var choice = plan(syllable);
    var utterance = new global.SpeechSynthesisUtterance(choice.text);

    // Only ever name a language we actually have a voice for.
    if (choice.voice) {
      utterance.voice = choice.voice;
      utterance.lang = choice.voice.lang;
    }

    utterance.rate = 0.8;    // slow enough for a beginning reader
    utterance.pitch = 1.05;
    utterance.volume = 1;

    var started = false;
    var finished = false;

    function finish() {
      // A cancelled utterance still reports back; it must not clear the state
      // of the tap that replaced it.
      if (finished || mine !== generation) return;
      finished = true;
      global.clearTimeout(safetyTimer);
      global.clearTimeout(retryTimer);
      if (callbacks.onend) callbacks.onend();
    }

    utterance.onstart = function () {
      started = true;
      // A late start must not re-arm the button after finish() already reset
      // it, or the label would stay on "Nagsasalita" forever.
      if (finished || mine !== generation) return;
      if (callbacks.onstart) callbacks.onstart();
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    // Speak now, in the gesture. Deferring this is what breaks iOS.
    try {
      synth.speak(utterance);
    } catch (error) {
      finish();
      return false;
    }

    // Desktop Chrome can still swallow an utterance queued right after a
    // cancel. If nothing has started shortly after, try that same utterance
    // once more. Harmless where the first attempt worked.
    retryTimer = global.setTimeout(function () {
      if (mine !== generation || started || finished) return;
      if (synth.speaking || synth.pending) return;
      try {
        synth.speak(utterance);
      } catch (error) {
        finish();
      }
    }, 250);

    // Some browsers never fire onend; never leave the button stuck as busy.
    safetyTimer = global.setTimeout(finish, 4000);

    if (callbacks.onstart) callbacks.onstart();
    return true;
  }

  global.PantigSpeech = {
    supported: supported,
    speak: speak,
    respell: respell,
    textFor: textFor,
    planFor: plan,
    style: function () { return style; },
    hasFilipinoVoice: function () { return style === 'native'; },
    voiceName: function () { return voice ? voice.name : null; },
    voiceLang: function () { return voice ? voice.lang : null; },
    onVoiceChange: function (handler) { changeHandlers.push(handler); }
  };
})(window);
