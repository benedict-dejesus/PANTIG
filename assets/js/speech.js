/*
 * Pantig - pronunciation.
 *
 * Uses the browser's built-in SpeechSynthesis. No API key, no backend.
 *
 * Filipino voices (fil-PH / tl-PH) ship with most Android devices and some
 * Windows installs, but plenty of browsers have none. When one is missing we
 * fall back to the best available voice and respell the syllable phonetically,
 * so an English voice still says "bah" instead of "bay" and "ghee" instead of
 * the soft "gee". Text is always lowercased first, so "Ba" is pronounced as a
 * syllable and never spelled out as "B-A".
 */
(function (global) {
  'use strict';

  var synth = global.speechSynthesis;
  var supported = typeof global.SpeechSynthesisUtterance === 'function' && !!synth;

  var voice = null;
  var hasFilipinoVoice = false;
  var changeHandlers = [];

  // How each vowel should sound to a non-Filipino voice.
  var VOWEL_SOUNDS = { a: 'ah', e: 'eh', i: 'ee', o: 'oh', u: 'oo' };

  function respell(syllable) {
    var text = syllable.toLowerCase();

    if (text.length === 1) {
      return VOWEL_SOUNDS[text] || text;
    }

    var consonant = text.charAt(0);
    var vowel = text.charAt(1);

    // English voices soften "ge"/"gi" into a J sound; "gh" keeps the hard G.
    if (consonant === 'g' && (vowel === 'e' || vowel === 'i')) {
      consonant = 'gh';
    }

    return consonant + (VOWEL_SOUNDS[vowel] || vowel);
  }

  function isFilipino(candidate) {
    var lang = (candidate.lang || '').toLowerCase();
    var name = (candidate.name || '').toLowerCase();
    return lang.indexOf('fil') === 0 ||
      lang.indexOf('tl') === 0 ||
      name.indexOf('filipino') !== -1 ||
      name.indexOf('tagalog') !== -1;
  }

  function selectVoice() {
    if (!supported) return;

    var voices = synth.getVoices() || [];
    if (!voices.length) return;

    var previous = voice;

    // 1. A real Filipino voice.
    var found = voices.filter(isFilipino)[0];

    if (found) {
      voice = found;
      hasFilipinoVoice = true;
    } else {
      // 2. A Philippine-locale voice (en-PH) - closest vowel sounds.
      // 3. Otherwise the browser default.
      voice = voices.filter(function (candidate) {
        return (candidate.lang || '').toLowerCase().indexOf('-ph') !== -1;
      })[0] || voices.filter(function (candidate) {
        return candidate.default;
      })[0] || voices[0];
      hasFilipinoVoice = false;
    }

    if (voice !== previous) {
      changeHandlers.forEach(function (handler) { handler(); });
    }
  }

  if (supported) {
    selectVoice();
    // Voices load asynchronously in Chrome and Safari.
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', selectVoice);
    } else {
      synth.onvoiceschanged = selectVoice;
    }
  }

  var safetyTimer = null;
  var startTimer = null;
  var generation = 0;

  /**
   * Speak one syllable. Any syllable already playing is cancelled first, so
   * repeated taps never build up a queue of overlapping speech.
   *
   * @param {string} syllable
   * @param {{onstart: Function, onend: Function}} callbacks
   * @returns {boolean} false when speech synthesis is unavailable
   */
  function speak(syllable, callbacks) {
    callbacks = callbacks || {};
    if (!supported) return false;

    // Drop everything still pending from an earlier tap: the queued utterance,
    // the timer that would have started one, and the safety timer. Anything
    // that reports back late is ignored by the generation check below.
    generation += 1;
    var mine = generation;

    global.clearTimeout(safetyTimer);
    global.clearTimeout(startTimer);
    synth.cancel();

    var utterance = new global.SpeechSynthesisUtterance(
      hasFilipinoVoice ? syllable.toLowerCase() : respell(syllable)
    );

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'fil-PH';
    }

    utterance.rate = 0.75;   // slow enough for a beginning reader
    utterance.pitch = 1.05;
    utterance.volume = 1;

    var finished = false;
    function finish() {
      // A cancelled utterance still reports back; it must not clear the state
      // of the tap that replaced it.
      if (finished || mine !== generation) return;
      finished = true;
      global.clearTimeout(safetyTimer);
      if (callbacks.onend) callbacks.onend();
    }

    utterance.onstart = function () {
      if (mine === generation && callbacks.onstart) callbacks.onstart();
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    // Some browsers never fire onend; never leave the button stuck as busy.
    safetyTimer = global.setTimeout(finish, 4000);

    // Chrome occasionally drops a speak() issued in the same tick as cancel().
    startTimer = global.setTimeout(function () {
      if (mine !== generation) return;
      try {
        synth.speak(utterance);
      } catch (error) {
        finish();
      }
    }, 60);

    if (callbacks.onstart) callbacks.onstart();
    return true;
  }

  global.PantigSpeech = {
    supported: supported,
    speak: speak,
    respell: respell,
    hasFilipinoVoice: function () { return hasFilipinoVoice; },
    voiceName: function () { return voice ? voice.name : null; },
    onVoiceChange: function (handler) { changeHandlers.push(handler); }
  };
})(window);
