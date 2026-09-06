/*
 * Pantig - syllable data.
 *
 * Single source of truth. Everything the app shows is derived from the two
 * arrays below; nothing is typed out twice.
 *
 *   5 vowels + (17 consonants x 5 vowels) = 90 base entries
 *   each base entry also gets a capitalized counterpart  = 180 entries
 */
(function (global) {
  'use strict';

  var VOWELS = ['a', 'e', 'i', 'o', 'u'];

  var CONSONANTS = [
    'b', 'k', 'd', 'g', 'h', 'l', 'm', 'n',
    'p', 'r', 's', 't', 'w', 'y', 'f', 'v', 'j'
  ];

  /**
   * Capitalize an entry. For a single vowel this is exactly toUpperCase()
   * ("a" -> "A"); for a consonant-vowel pair only the first letter is raised
   * ("ba" -> "Ba") so the syllable still reads as one sound.
   */
  function capitalize(syllable) {
    return syllable.charAt(0).toUpperCase() + syllable.slice(1);
  }

  /**
   * Families, in teaching order: the vowels on their own, then each
   * consonant with all five vowels.
   */
  function buildFamilies() {
    var families = [{ key: 'patinig', members: VOWELS.slice() }];

    CONSONANTS.forEach(function (consonant) {
      families.push({
        key: consonant,
        members: VOWELS.map(function (vowel) {
          return consonant + vowel;
        })
      });
    });

    return families;
  }

  var FAMILIES = buildFamilies();

  // 90 lowercase entries.
  var BASE = FAMILIES.reduce(function (all, family) {
    return all.concat(family.members);
  }, []);

  // 180 entries: within each family, the five lowercase forms are followed by
  // their five capitalized forms. Lowercase and capitalized are separate
  // entries and are never paired on screen.
  var ENTRIES = FAMILIES.reduce(function (all, family) {
    return all.concat(family.members, family.members.map(capitalize));
  }, []);

  global.PantigSyllables = {
    VOWELS: VOWELS,
    CONSONANTS: CONSONANTS,
    FAMILIES: FAMILIES,
    BASE: BASE,
    ENTRIES: ENTRIES,
    capitalize: capitalize
  };
})(window);
