#!/usr/bin/env node
/* Tests unitaires du gameplay : règles pures de games.js + cohérence des pages générées.
   Usage : node tools/test_games.js  (à lancer après python3 tools/split_pages.py) */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const G = require(path.join(ROOT, 'assets/js/games.js'));
const rules = G.rules;

let failures = 0, count = 0;
function ok(cond, msg) {
  count++;
  if (!cond) { failures++; console.error('ECHEC: ' + msg); }
}
function eq(a, b, msg) { ok(a === b, msg + ' (attendu ' + JSON.stringify(b) + ', reçu ' + JSON.stringify(a) + ')'); }

// ---------- table officielle attendue ----------
const EXPECTED = {
  1: ['binero', '13', 'M'], 2: ['binero', '15', 'O'], 3: ['binero', '14', 'N'],
  4: ['binero', '16', 'P'], 5: ['binero', '12', 'L'], 6: ['binero', '21', 'U'],
  7: ['binero', '19', 'S'], 8: ['binero', '2', 'B'], 9: ['binero', '5', 'E'],
  10: ['binero', '1', 'A'], 11: ['binero', '21', 'U'], 12: ['binero', '22', 'V'],
  13: ['binero', '15', 'O'], 14: ['binero', '25', 'Y'], 15: ['binero', '1', 'A'],
  16: ['binero', '7', 'G'], 17: ['binero', '5', 'E'], 18: ['binero', '3', 'C'],
  19: ['binero', '5', 'E'], 20: ['binero', '19', 'S'], 21: ['binero', '20', 'T'],
  22: ['binero', '20', 'T'], 23: ['binero', '15', 'O'], 24: ['binero', '9', 'I']
};

// ---------- conversions ----------
eq(G.numToLetter(13), 'M', 'numToLetter 13');
eq(G.numToLetter(1), 'A', 'numToLetter 1');
eq(G.letterToNum('U'), 21, 'letterToNum U');

// ---------- règles pures ----------
eq(rules.bineroLineOk(['0','1','0','1','1','0','0','1']), true, 'bineroLineOk valide');
eq(rules.bineroLineOk(['0','1','1','1','0','1','0','1']), false, 'bineroLineOk triple 111');
eq(rules.bineroLineOk(['0','0','0','1','1','1','0','1']), false, 'bineroLineOk triple 000');
eq(rules.bineroLineOk(['0','1','0','1','0','1','0','0']), false, 'bineroLineOk pas 4/4');
eq(rules.visibleCount(['4','6','3','1','2','5']), 2, 'visibleCount 463125');
eq(rules.visibleCount(['1','2','3','4','5','6']), 6, 'visibleCount croissant');
eq(rules.visibleCount(['6','5','4','3','2','1']), 1, 'visibleCount décroissant');
eq(rules.permOk(['1','2','3','4','5','6'], 6), true, 'permOk 1..6');
eq(rules.permOk(['1','2','2','4','5','6'], 6), false, 'permOk doublon');
eq(rules.nonogramLine(['#','#','x','x','#'], [2, 1]), 'done', 'nonogram done');
eq(rules.nonogramLine(['#','x','#','x','x'], [2]), 'err', 'nonogram trop de groupes');
eq(rules.nonogramLine(['#','','','',''], [2]), 'open', 'nonogram open');
eq(rules.nonogramLine(['','','','',''], []), 'open', 'nonogram ligne vide non déterminée');
eq(rules.nonogramLine(['x','x','x','x','x'], []), 'done', 'nonogram ligne pleine sans indice');
eq(rules.caesarDecode('IJZG', 21), 'NOEL', 'caesar IJZG -21');
eq(rules.caesarDecode('VWGVGD', 21), 'ABLALI', 'caesar VWGVGD -21');
eq(rules.cryptCheck(['SEND', 'MORE'], 'MONEY', { S: '9', E: '5', N: '6', D: '7', M: '1', O: '0', R: '8', Y: '2' }).ok, true, 'crypt SEND+MORE=MONEY');
eq(rules.cryptCheck(['SEND', 'MORE'], 'MONEY', { S: '9', E: '5', N: '6', D: '7', M: '0', O: '0', R: '8', Y: '2' }).ok, false, 'crypt doublon 0');
eq(rules.cryptCheck(['CROSS', 'ROADS'], 'DANGER', { C: '9', R: '6', O: '2', S: '3', A: '5', D: '1', N: '8', G: '7', E: '4' }).ok, true, 'crypt CROSS+ROADS=DANGER');
eq(rules.magicValidate([['19','6','5','16'],['8','13','14','11'],['12','9','10','15'],['7','18','17','4']]).ok, true, 'magic carré 46');
eq(rules.magicValidate([['20','6','5','16'],['8','13','14','11'],['12','9','10','15'],['7','18','17','4']]).ok, false, 'magic mauvaise case');
eq(rules.pyramidValidate([['18'],['9','9'],['6','3','6'],['4','2','1','5']]).ok, true, 'pyramid valide');
eq(rules.pyramidValidate([['18'],['9','9'],['6','3','6'],['4','2','2','5']]).ok, false, 'pyramid fausse');
eq(rules.latinValidate([['M','V','H','C','S'],['S','C','V','H','M'],['V','M','C','S','H'],['H','S','M','V','C'],['C','H','S','M','V']], ['M','V','H','C','S'], 'MVHCSSCVHMVMCSHHSMVCCHSMV').ok, true, 'latin valide');

// ---------- helpers de parsing HTML ----------
function attr(html, name) {
  const m = html.match(new RegExp(name + '="([^"]*)"'));
  if (!m) return null;
  return m[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}
function table(html, cls) {
  const m = html.match(new RegExp('<table class="' + cls + '">([\\s\\S]*?)</table>'));
  if (!m) return null;
  const rows = [];
  const rowRe = /<tr>([\s\S]*?)<\/tr>/g;
  let rm;
  while ((rm = rowRe.exec(m[1]))) {
    const cells = [];
    const cellRe = /<td class="([^"]*)">([\s\S]*?)<\/td>/g;
    let cm;
    while ((cm = cellRe.exec(rm[1]))) {
      const text = cm[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&#9733;/g, '★').trim();
      cells.push({ cls: cm[1], text: text });
    }
    rows.push(cells);
  }
  return rows;
}
function page(n) { return fs.readFileSync(path.join(ROOT, 'jours', n + '.html'), 'utf-8'); }

// ---------- cohérence des 24 pages ----------
const letters = [];
for (let n = 1; n <= 24; n++) {
  const html = page(n);
  const exp = EXPECTED[n];
  eq(attr(html, 'data-game'), exp[0], 'jour ' + n + ' data-game');
  eq(attr(html, 'data-answer'), exp[1], 'jour ' + n + ' data-answer');
  eq(attr(html, 'data-letter'), exp[2], 'jour ' + n + ' data-letter');
  ok(html.includes('assets/js/games.js'), 'jour ' + n + ' charge games.js');
  letters.push(exp[2]);
}
eq(letters.join(''), 'MONPLUSBEAUVOYAGECESTTOI', 'phrase finale reconstituée');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
ok(indexHtml.includes('assets/js/games.js'), 'index charge games.js');

// ---------- validation des solutions embarquées ----------
// binéro (les 24 jours) : data-solution doit valider + extraction des étoiles = data-answer
for (let n = 1; n <= 24; n++) {
  const html = page(n);
  const sol = attr(html, 'data-solution');
  const rows = table(html, 'bgrid');
  const n0 = rows.length;
  const g = [];
  for (let r = 0; r < n0; r++) { g.push([]); for (let c = 0; c < n0; c++) g[r].push(sol.charAt(r * n0 + c)); }
  ok(rules.bineroValidate(g).ok, 'jour ' + n + ' solution binéro valide');
  let bits = '';
  for (let r = 0; r < n0; r++) for (let c = 0; c < n0; c++) {
    if (rows[r][c].cls.includes('star')) bits += sol.charAt(r * n0 + c);
  }
  eq(String(parseInt(bits, 2)), attr(html, 'data-answer'), 'jour ' + n + ' extraction binaire des étoiles');
}

console.log('---');
console.log(count + ' tests, ' + failures + ' échec(s)');
process.exit(failures ? 1 : 0);
