/*
 * Pantig - application logic.
 *
 * The loop: see a syllable, try to read it, tap Pakinggan to hear it,
 * tap Susunod for the next one.
 */
(function (global) {
  'use strict';

  var document = global.document;
  var ENTRIES = global.PantigSyllables.ENTRIES;
  var Speech = global.PantigSpeech;

  var THEMES = ['mangga', 'kalamansi', 'ube', 'langit', 'rosas', 'dalandan'];
  var SIZES = ['s', 'm', 'l'];

  var el = {
    root: document.documentElement,
    pane: document.getElementById('pane'),
    syllable: document.getElementById('syllable'),
    speak: document.getElementById('speak-button'),
    speakFil: document.getElementById('speak-label-fil'),
    speakEn: document.getElementById('speak-label-en'),
    next: document.getElementById('next-button'),
    note: document.getElementById('speech-note'),
    grid: document.getElementById('syllable-grid'),
    count: document.getElementById('list-count')
  };

  var current = null;
  var chips = {};

  /* --- Shuffled deck ---------------------------------------------------
   * A deck rather than plain random picking, so the child meets every one of
   * the 180 entries before any of them comes round again. On reshuffle, the
   * new first card is never the card just shown.
   */

  function Deck(cards) {
    this.cards = cards;
    this.pile = [];
    this.last = null;
  }

  Deck.prototype.shuffle = function () {
    var pile = this.cards.slice();

    for (var i = pile.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var swap = pile[i];
      pile[i] = pile[j];
      pile[j] = swap;
    }

    // Never repeat the previous card across the seam between two decks.
    if (pile.length > 1 && pile[pile.length - 1] === this.last) {
      pile[pile.length - 1] = pile[0];
      pile[0] = this.last;
    }

    this.pile = pile;
  };

  Deck.prototype.draw = function () {
    if (!this.pile.length) this.shuffle();
    this.last = this.pile.pop();
    return this.last;
  };

  var syllableDeck = new Deck(ENTRIES);
  var themeDeck = new Deck(THEMES);

  /* --- Rendering -------------------------------------------------------- */

  function show(entry) {
    if (current && chips[current]) {
      chips[current].removeAttribute('data-current');
    }

    current = entry;
    el.syllable.textContent = entry;

    el.root.setAttribute('data-theme', themeDeck.draw());
    el.pane.setAttribute('data-size', SIZES[Math.floor(Math.random() * SIZES.length)]);

    if (chips[entry]) {
      chips[entry].setAttribute('data-current', 'true');
    }

    // Restart the swap animation.
    el.pane.classList.remove('is-swapping');
    void el.pane.offsetWidth;
    el.pane.classList.add('is-swapping');
  }

  function nextSyllable() {
    show(syllableDeck.draw());
  }

  /* --- Speaking --------------------------------------------------------- */

  function setSpeaking(isSpeaking) {
    el.speak.setAttribute('data-speaking', isSpeaking ? 'true' : 'false');
    el.speak.setAttribute('aria-busy', isSpeaking ? 'true' : 'false');
    el.speakFil.textContent = isSpeaking ? 'Nagsasalita' : 'Pakinggan';
    el.speakEn.textContent = isSpeaking ? 'Speaking' : 'Speak';
  }

  function say(entry) {
    Speech.speak(entry, {
      onstart: function () { setSpeaking(true); },
      onend: function () { setSpeaking(false); }
    });
  }

  function describeVoice() {
    if (!Speech.supported) {
      el.note.textContent =
        'Hindi sinusuportahan ng browser na ito ang pagsasalita. Gamitin pa rin ang Pantig para sa pagbasa. ' +
        'This browser cannot speak; Pantig still works as a visual syllable trainer.';
      el.note.hidden = false;
      el.speak.disabled = true;
      return;
    }

    // A real Filipino voice needs no explanation.
    if (Speech.style() === 'native') {
      el.note.hidden = true;
      return;
    }

    // Honest about the limitation, quiet about it, and only when it applies.
    // The voice is named so an adult can tell what the phone actually used.
    var using = Speech.voiceName()
      ? ' Ginagamit: ' + Speech.voiceName() + '.'
      : '';

    el.note.textContent = Speech.style() === 'spanish'
      ? 'Walang Filipino voice dito, kaya boses na Espanyol ang ginagamit - halos pareho ang patinig.' + using
      : 'Walang Filipino o Espanyol na boses dito. Mag-install ng Spanish voice para mas natural ang tunog. ' +
        '(Install a Spanish voice for natural Filipino vowels.)' + using;

    el.note.hidden = false;
  }

  /* --- Syllable list ---------------------------------------------------- */

  function buildList() {
    var fragment = document.createDocumentFragment();

    ENTRIES.forEach(function (entry) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = entry;
      chip.setAttribute('role', 'listitem');
      chip.setAttribute('aria-label', 'Pakinggan ang ' + entry);
      chip.addEventListener('click', function () { say(entry); });

      chips[entry] = chip;
      fragment.appendChild(chip);
    });

    el.grid.appendChild(fragment);
    el.count.textContent = String(ENTRIES.length);
  }

  /* --- Start ------------------------------------------------------------ */

  buildList();
  describeVoice();
  Speech.onVoiceChange(describeVoice);

  el.speak.addEventListener('click', function () { say(current); });
  el.next.addEventListener('click', nextSyllable);

  nextSyllable();
})(window);
