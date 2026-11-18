#!/usr/bin/env node
/* Smoke test d'instanciation des moteurs games.js sur un mini-DOM synthétique.
   Usage : node tools/test_dom_smoke.js */
'use strict';

// ---------- mini-DOM ----------
function makeClassList(el) {
  return {
    add: function () { for (var i = 0; i < arguments.length; i++) el._classes[arguments[i]] = 1; },
    remove: function (c) { delete el._classes[c]; },
    toggle: function (c, force) {
      var want = force === undefined ? !el._classes[c] : !!force;
      if (want) el._classes[c] = 1; else delete el._classes[c];
      return want;
    },
    contains: function (c) { return !!el._classes[c]; }
  };
}

function El(tag) {
  this.tagName = (tag || 'div').toUpperCase();
  this.children = [];
  this.attributes = {};
  this._classes = {};
  this.classList = makeClassList(this);
  this.listeners = {};
  this.parentNode = null;
  this._text = '';
  this.value = '';
  this.tabIndex = -1;
  this.type = '';
  this.maxLength = 0;
}
Object.defineProperty(El.prototype, 'className', {
  get: function () { return Object.keys(this._classes).join(' '); },
  set: function (v) { this._classes = {}; String(v).split(/\s+/).forEach(c => { if (c) this._classes[c] = 1; }); }
});
Object.defineProperty(El.prototype, 'textContent', {
  get: function () {
    if (this.children.length === 0) return this._text;
    return this._text + this.children.map(c => c.textContent).join('');
  },
  set: function (v) { this.children = []; this._text = String(v); }
});
Object.defineProperty(El.prototype, 'firstChild', { get: function () { return this.children[0] || null; } });
Object.defineProperty(El.prototype, 'nextSibling', {
  get: function () {
    if (!this.parentNode) return null;
    var i = this.parentNode.children.indexOf(this);
    return this.parentNode.children[i + 1] || null;
  }
});
El.prototype.setAttribute = function (k, v) { this.attributes[k] = String(v); };
Object.defineProperty(El.prototype, 'rows', { get: function () { return this.children.filter(c => c.tagName === 'TR'); } });
Object.defineProperty(El.prototype, 'cells', { get: function () { return this.children.filter(c => c.tagName === 'TD' || c.tagName === 'TH'); } });
El.prototype.getAttribute = function (k) { return (k in this.attributes) ? this.attributes[k] : null; };
El.prototype.appendChild = function (c) { c.parentNode = this; this.children.push(c); return c; };
El.prototype.insertBefore = function (n, ref) {
  n.parentNode = this;
  var i = ref ? this.children.indexOf(ref) : -1;
  if (i < 0) this.children.push(n); else this.children.splice(i, 0, n);
  return n;
};
El.prototype.removeChild = function (c) {
  var i = this.children.indexOf(c);
  if (i >= 0) this.children.splice(i, 1);
  c.parentNode = null;
  return c;
};
El.prototype.addEventListener = function (t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); };
El.prototype.dispatch = function (t, ev) {
  ev = ev || {};
  ev.preventDefault = ev.preventDefault || function () {};
  ev.key = ev.key || '';
  (this.listeners[t] || []).forEach(f => f(ev));
};
El.prototype.click = function () { this.dispatch('click'); };

function matches(el, part) {
  // part: 'tag.cls.cls[attr]' ou '.cls' ou 'tag' ou '[attr]'
  var m = part.match(/^([a-zA-Z0-9]*)((?:\.[A-Za-z0-9_-]+)*)(\[[^\]]+\])?$/);
  if (!m) return false;
  var tag = m[1], cls = m[2] || '', attr = m[3] || '';
  if (tag && el.tagName !== tag.toUpperCase()) return false;
  if (cls) {
    var parts = cls.split('.').filter(Boolean);
    for (var i = 0; i < parts.length; i++) if (!el._classes[parts[i]]) return false;
  }
  if (attr) {
    var am = attr.match(/^\[([A-Za-z0-9_-]+)\]$/);
    if (am && !(am[1] in el.attributes)) return false;
  }
  return true;
}
function queryAll(root, sel) {
  var parts = sel.trim().split(/\s+/);
  var current = [root];
  for (var p = 0; p < parts.length; p++) {
    var next = [];
    current.forEach(function (node) {
      (function walk(n) {
        n.children.forEach(function (c) {
          if (matches(c, parts[p])) next.push(c);
          walk(c);
        });
      })(node);
    });
    current = next;
  }
  return current;
}
El.prototype.querySelectorAll = function (sel) { return queryAll(this, sel); };
El.prototype.querySelector = function (sel) { var r = queryAll(this, sel); return r[0] || null; };

// ---------- document/window stubs ----------
var store = {};
global.window = {
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  }
};
var body = new El('body');
global.document = {
  readyState: 'loading',
  body: body,
  createElement: t => new El(t),
  createTextNode: t => { var e = new El('#text'); e._text = String(t); return e; },
  querySelectorAll: sel => queryAll(body, sel),
  querySelector: sel => { var r = queryAll(body, sel); return r[0] || null; },
  addEventListener: function () {}
};

var G = require('../assets/js/games.js');

var failures = 0, count = 0;
function ok(c, msg) { count++; if (!c) { failures++; console.error('ECHEC: ' + msg); } }

// ---------- construction d'une page synthétique ----------
function buildPage(day, game, attrs, build) {
  body.children = [];
  body.attributes = { 'data-day': String(day) };
  var gated = new El('div');
  gated.className = 'gated';
  gated.setAttribute('data-game', game);
  Object.keys(attrs || {}).forEach(k => gated.setAttribute(k, attrs[k]));
  body.appendChild(gated);
  if (build) build(gated);
  return gated;
}

function run(name, fn) { try { fn(); } catch (e) { failures++; console.error('ECHEC (exception) ' + name + ': ' + e.stack); } }

// --- test 1 : Sequence (jour 2) ---
run('sequence', function () {
  store = {};
  var gated = buildPage(2, 'sequence', { 'data-answer': '15', 'data-letter': 'O' }, function (g) {
    var seq = new El('div'); seq.className = 'bigseq';
    var blank = new El('span'); blank.className = 'blank';
    seq.appendChild(blank); g.appendChild(seq);
    var ex = new El('p'); ex.className = 'extract'; g.appendChild(ex);
  });
  G.mountAll();
  var toolbar = gated.querySelector('.toolbar');
  ok(toolbar, 'sequence: toolbar créée');
  ok(gated.querySelector('.game-status'), 'sequence: status créé');
  var inp = gated.querySelector('.blank input');
  ok(inp, 'sequence: input dans le blanc');
  inp.value = '15';
  inp.dispatch('input');
  gated.querySelector('.tbtn-check').click();
  ok(store['avent:solved:2'] === 'O', 'sequence: résolu -> avent:solved:2=O (reçu ' + store['avent:solved:2'] + ')');
  ok(gated.classList.contains('solved'), 'sequence: classe solved');
  ok(gated.querySelector('.game-status').textContent.indexOf('15') >= 0, 'sequence: status affiche le nombre');
});

// --- test 2 : Binero 4x4 ---
run('binero', function () {
  store = {};
  var sol = ['0110', '1001', '0101', '1010'];
  var stars = [[0, 0], [0, 1], [1, 0], [2, 2]]; // bits: 0,1,1,0 -> 6
  var gated = buildPage(1, 'binero', { 'data-answer': '6', 'data-letter': 'F', 'data-solution': sol.join('') }, function (g) {
    var t = new El('table'); t.className = 'bgrid';
    for (var r = 0; r < 4; r++) {
      var tr = new El('tr');
      for (var c = 0; c < 4; c++) {
        var td = new El('td');
        var cls = 'bcell';
        var isStar = stars.some(s => s[0] === r && s[1] === c);
        if (isStar) cls += ' star';
        td.className = cls;
        if (r === 0 && c === 0) td._text = '0'; // une case donnée
        if (isStar) { var sp = new El('span'); sp.className = 'star'; sp._text = '★'; td.appendChild(sp); }
        tr.appendChild(td);
      }
      t.appendChild(tr);
    }
    g.appendChild(t);
    var ex = new El('p'); ex.className = 'extract'; g.appendChild(ex);
  });
  G.mountAll();
  var tds = gated.querySelectorAll('table.bgrid td');
  ok(tds.length === 16, 'binero: 16 cellules');
  ok(tds.filter(td => td._classes['play']).length === 15, 'binero: 15 cases jouables');
  ok(tds.filter(td => td._classes['locked']).length === 1, 'binero: 1 case verrouillée');
  // remplir via clics: simuler en posant l'état via clics serait long; on pose via le moteur interne
  // on retrouve l'instance via un nouveau mountAll ? Non : on rejoue via clics sur chaque case vide
  // plus simple: cliquer jusqu'à obtenir la valeur voulue
  var want = sol;
  var rows = gated.querySelectorAll('table.bgrid tr');
  for (var r = 0; r < 4; r++) {
    for (var c = 0; c < 4; c++) {
      var td = rows[r].children[c];
      if (td._classes['locked']) continue;
      var target = want[r][c];
      var guard = 0;
      while (td.textContent.replace(/★/g, '') !== target && guard++ < 5) td.click();
      if (td.textContent.replace(/★/g, '') !== target) { ok(false, 'binero clic cycle case ' + r + ',' + c); }
    }
  }
  ok(store['avent:solved:1'] === 'F', 'binero: résolu -> avent:solved:1=F (reçu ' + store['avent:solved:1'] + ')');
  ok(gated.querySelector('.game-status').textContent.indexOf('6') >= 0, 'binero: status affiche 6');
  // persistance
  ok((store['avent:game:1'] || '').length > 0, 'binero: état sauvegardé');
});

// --- test 3 : Caesar (jour 6) ---
run('caesar', function () {
  store = {};
  var gated = buildPage(6, 'caesar', { 'data-answer': '21', 'data-letter': 'U' }, function (g) {
    var seq = new El('div'); seq.className = 'bigseq'; seq._text = 'IJZG  VWGVGD';
    g.appendChild(seq);
    var ex = new El('p'); ex.className = 'extract'; g.appendChild(ex);
  });
  G.mountAll();
  var inp = gated.querySelector('.controls input');
  ok(inp, 'caesar: input clé créé');
  inp.value = '21';
  inp.dispatch('input');
  ok(gated.querySelector('.decoded').textContent.indexOf('NOEL') === 0, 'caesar: décodage live NOEL… (reçu ' + gated.querySelector('.decoded').textContent + ')');
  gated.querySelector('.tbtn-check').click();
  ok(store['avent:solved:6'] === 'U', 'caesar: résolu -> U');
});

// --- test 4 : Magic (jour 20) ---
run('magic', function () {
  store = {};
  var g = [['', '6', '5', '16'], ['8', '13', '14', '11'], ['12', '9', '10', '15'], ['7', '18', '17', '4']];
  var gated = buildPage(20, 'magic', { 'data-answer': '19', 'data-letter': 'S' }, function (root) {
    var t = new El('table'); t.className = 'mgrid';
    g.forEach(function (row) {
      var tr = new El('tr');
      row.forEach(function (v) { var td = new El('td'); td.className = 'mcell'; td._text = v; tr.appendChild(td); });
      t.appendChild(tr);
    });
    root.appendChild(t);
    var ex = new El('p'); ex.className = 'extract'; root.appendChild(ex);
  });
  G.mountAll();
  var inp = gated.querySelector('table.mgrid td input');
  ok(inp, 'magic: input dans la case vide');
  inp.value = '19';
  inp.dispatch('input');
  ok(store['avent:solved:20'] === 'S', 'magic: résolu -> S (reçu ' + store['avent:solved:20'] + ')');
  // mauvaise valeur d'abord
  store = {}; body.children = [];
});

// --- test 5 : restauration depuis localStorage (binero résolu au rechargement) ---
run('restore', function () {
  store = { 'avent:solved:1': 'F', 'avent:game:1': JSON.stringify({ s: '0110|1001|0101|1010', h: 2 }) };
  var sol = ['0110', '1001', '0101', '1010'];
  var gated = buildPage(1, 'binero', { 'data-answer': '6', 'data-letter': 'F', 'data-solution': sol.join('') }, function (g) {
    var t = new El('table'); t.className = 'bgrid';
    for (var r = 0; r < 4; r++) {
      var tr = new El('tr');
      for (var c = 0; c < 4; c++) {
        var td = new El('td'); td.className = 'bcell';
        if (r === 0 && c === 0) td._text = '0';
        tr.appendChild(td);
      }
      t.appendChild(tr);
    }
    g.appendChild(t);
    var ex = new El('p'); ex.className = 'extract'; g.appendChild(ex);
  });
  G.mountAll();
  ok(gated.classList.contains('solved'), 'restore: classe solved au rechargement');
  ok(gated.querySelector('.game-status').textContent.indexOf('F') >= 0, 'restore: status affiche la lettre F');
  var rows = gated.querySelectorAll('table.bgrid tr');
  ok(rows[1].children[0].textContent === '1', 'restore: état restauré (1,0)=1 (reçu ' + rows[1].children[0].textContent + ')');
});

console.log('---');
console.log(count + ' tests DOM, ' + failures + ' échec(s)');
process.exit(failures ? 1 : 0);
