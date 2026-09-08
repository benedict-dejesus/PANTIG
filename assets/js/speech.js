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
 *            the voice produces the Filipino sound: "ki" -> "qui".
 *            Latin American voices are preferred; their "j" is a soft /h/.
 *   english  used when the device has no Filipino or Spanish voice. Respelled
 *            phonetically so an English voice says "bah" rather than "bay".
 *
 * The h and j families are the exception to the Spanish style: Spanish has no
 * /h/ (its h is silent) and no clean /dʒ/, so those ten syllables are spoken
 * by an English voice, which has both natively. They then have to sit beside
 * Spanish vowels without clashing - see EN_VOWELS_BESIDE_SPANISH.
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
  var englishVoice = null;
  var style = 'english';
  var changeHandlers = [];

  /* --- Vowels ------------------------------------------------------------ */

  /*
   * For an all-English drill. Filipino vowels are short and pure; the obvious
   * English spellings give the long, drifting versions instead:
   *
   *   a  "ah"   as in half        ("a" alone would be the letter name)
   *   e  "eh"   as in heck
   *   i  "ih"   as in hit         ("ee" gives the long /i:/ of "see")
   *   o  "aw"   as in off         ("oh" gives the "ow" diphthong of "go")
   *   u  "oo"   as in who
   *
   * English has no word ending in the short vowel of "put", so nothing
   * elicits it in an open syllable; "oo" has the right quality, only longer.
   */
  var EN_VOWELS = { a: 'ah', e: 'eh', i: 'ih', o: 'aw', u: 'oo' };

  /*
   * For the h and j families when everything around them is Spanish. These
   * ten syllables are heard next to Spanish vowels, so they are matched to
   * those rather than to the table above.
   *
   * Only "i" differs, and it matters most. Spanish "i" is a short close [i] -
   * "si" sounds like a clipped "see". English "ih" is [ɪ], the different,
   * more open vowel of "hit", so "hih" beside Spanish "bi" would sound like
   * two different vowels. "ee" has the right quality and is merely longer.
   *
   * The rest already sit close enough: "ah" [ɑ] beside Spanish [a], "eh" [ɛ]
   * beside [e], "aw" [ɔ] beside [o] - all monophthongs, no glide. "oh" is
   * avoided here for the same reason as above: it diphthongises to "ow".
   */
  var EN_VOWELS_BESIDE_SPANISH = { a: 'ah', e: 'eh', i: 'ee', o: 'aw', u: 'oo' };

  /* --- Rewriting a syllable for a non-Filipino voice --------------------- */

  /*
   * Spanish spellings that produce the Filipino sound. Everything not listed
   * here (b, d, l, m, n, p, r, s, t, v, f, y) already reads correctly in
   * Spanish, so it is spoken unchanged.
   *
   * h and j appear here only as a last resort, for a device that has a
   * Spanish voice but no English one. Without them Spanish would read "ha"
   * with a silent h and say only "a". "dy" rather than "y" keeps j distinct
   * from the y family, which a reading trainer has to keep apart.
   */
  var ES_ONSETS = {
    k: { a: 'ca',  e: 'que', i: 'qui', o: 'co',  u: 'cu' },   // hard k
    g: { a: 'ga',  e: 'gue', i: 'gui', o: 'go',  u: 'gu' },   // hard g
    w: { a: 'hua', e: 'hue', i: 'hui', o: 'huo', u: 'huu' },  // Spanish has no w
    h: { a: 'ja',  e: 'je',  i: 'ji',  o: 'jo',  u: 'ju' },   // last resort
    j: { a: 'dya', e: 'dye', i: 'dyi', o: 'dyo', u: 'dyu' }   // last resort
  };

  // The two families Spanish cannot make; spoken by an English voice.
  var ENGLISH_ONLY_ONSETS = { h: true, j: true };

  function respellEnglish(text, vowels) {
    if (text.length === 1) return vowels[text] || text;

    var consonant = text.charAt(0);
    var vowel = text.charAt(1);

    // English voices soften "ge"/"gi" into a J sound; "gh" keeps the hard G.
    if (consonant === 'g' && (vowel === 'e' || vowel === 'i')) consonant = 'gh';
    return consonant + (vowels[vowel] || vowel);
  }

  function respell(syllable, forStyle) {
    var text = syllable.toLowerCase();

    if (forStyle === 'spanish') {
      if (text.length === 1) return text;            // vowels already read correctly
      var onset = ES_ONSETS[text.charAt(0)];
      return onset ? onset[text.charAt(1)] : text;
    }

    if (forStyle === 'beside-spanish') {
      return respellEnglish(text, EN_VOWELS_BESIDE_SPANISH);
    }

    return respellEnglish(text, EN_VOWELS);
  }

  /**
   * Decide what to say and which voice says it.
   *
   * @returns {{text: string, voice: (SpeechSynthesisVoice|null)}}
   */
  function plan(syllable) {
    var lower = syllable.toLowerCase();

    if (style === 'native') return { text: lower, voice: voice };

    // Borrow an English voice for the two families Spanish cannot produce,
    // with vowels matched to the Spanish ones they are heard beside.
    if (style === 'spanish' && lower.length > 1 &&
        ENGLISH_ONLY_ONSETS[lower.charAt(0)] && englishVoice) {
      return { text: respell(lower, 'beside-spanish'), voice: englishVoice };
    }

    return { text: respell(lower, style), voice: voice };
  }

  function textFor(syllable) {
    return plan(syllable).text;
  }

  /* --- Choosing a voice -------------------------------------------------- */

  function langOf(candidate) {
    return (candidate.lang || '').toLowerCase().replace('_', '-');
  }

  function isFilipino(candidate) {
    var lang = langOf(candidate);
    var name = (candidate.name || '').toLowerCase();
    return lang.indexOf('fil') === 0 ||
      lang.indexOf('tl') === 0 ||
      name.indexOf('filipino') !== -1 ||
      name.indexOf('tagalog') !== -1;
  }

  function isSpanish(candidate) {
    return langOf(candidate).indexOf('es') === 0;
  }

  function isEnglish(candidate) {
    return langOf(candidate).indexOf('en') === 0;
  }

  /*
   * Latin American Spanish first. Its "j" is a soft /h/, close to Filipino;
   * the Castilian "j" is the hard /x/ of "loch". Anything not listed still
   * counts as Spanish, just lower down.
   */
  var ES_REGIONS = ['es-us', 'es-mx', 'es-419', 'es-co', 'es-pe', 'es-cl', 'es-ve', 'es-ar'];

  function bestSpanish(voices) {
    return voices.filter(isSpanish).sort(function (a, b) {
      var rankA = ES_REGIONS.indexOf(langOf(a));
      var rankB = ES_REGIONS.indexOf(langOf(b));
      return (rankA === -1 ? ES_REGIONS.length : rankA) -
             (rankB === -1 ? ES_REGIONS.length : rankB);
    })[0];
  }

  function selectVoice() {
    if (!supported) return;

    var voices = synth.getVoices() || [];
    if (!voices.length) return;

    var previous = voice;
    var previousEnglish = englishVoice;

    // Held aside for the h and j families when the main voice is Spanish.
    var englishVoices = voices.filter(isEnglish);
    englishVoice = englishVoices.filter(function (candidate) {
      return candidate.default;
    })[0] || englishVoices[0] || null;

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

    if (voice !== previous || englishVoice !== previousEnglish) {
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
    englishVoiceName: function () { return englishVoice ? englishVoice.name : null; },
    onVoiceChange: function (handler) { changeHandlers.push(handler); }
  };
})(window);
