import {transliterate}  from 'transliteration';

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
const escapeRegExp = function(string) {
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

const normalizeString = function(input) {
    if (!input || typeof input !== 'string') return '';

    let normalized = transliterate(input);
    normalized = normalized.toLowerCase();

    for (const {regex, letter} of compiledReplacements) {
        normalized = normalized.replace(regex, letter);
    }

    return normalized;
}

export default {normalizeString}