import { transliterate } from 'transliteration';

const leetspeakDictionary = {
  'a': ['4', '@', '/\\', '/-\\', '^'],
  'b': ['8', '|3', '13', '!3'],
  'c': ['(', '<', '[', '{'],
  'd': ['|)', '[)', '|>'],
  'e': ['3'],
  'f': ['|='],
  'g': ['6', '9', '&'],
  'h': ['#', '|-|', ']-[', '/-/', '}{', '}-{'],
  'i': ['1', '!', '|', ']['],
  'j': ['_|', '_/'],
  'k': ['|<', '|{'],
  'l': ['|_'],
  'm': ['/\\/\\', '|v|', '[V]', '^^'],
  'n': ['|\\|', '^/'],
  'o': ['0', '()', '[]', '<>', '*'],
  'p': ['|o', '|d', '|*', '?'],
  'q': ['0_', '(,)', 'o_'],
  'r': ['|2', '12', '.-'],
  's': ['5', '$'],
  't': ['7', '+', '-|-'],
  'u': ['|_|', '(_)'],
  'v': ['\\/'],
  'w': ['\\/\\/', '\\|/', 'vv'],
  'x': ['><', '}{'],
  'y': ['`/', '¥'],
  'z': ['2', '7_', '>_']
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const compiledReplacements = [];
for (const [letter, leets] of Object.entries(leetspeakDictionary)) {
  for (const leet of leets) {
    compiledReplacements.push({
      leet,
      letter,
      regex: new RegExp(escapeRegExp(leet), 'g')
    });
  }
}
compiledReplacements.sort((a, b) => b.leet.length - a.leet.length);

export function normalizeString(input) {
  if (!input || typeof input !== 'string') return '';

  let normalized = transliterate(input);
  normalized = normalized.toLowerCase();

  for (const { regex, letter } of compiledReplacements) {
    normalized = normalized.replace(regex, letter);
  }

  return normalized;
}

export function filterTracksBySearchTerm(tracks, searchTerm) {
  return tracks.filter(track => {
    if (!searchTerm.trim()) return true;

    const searchLower = normalizeString(searchTerm);
    const trackName = normalizeString(track.name || "");
    const artistName = normalizeString(track.creator || "");

    return trackName.includes(searchLower) || artistName.includes(searchLower);
  });
}
