(function () {
  'use strict';

  // ---------- stockage ----------
  function sGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function sSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* navigation privée */ } }

  // ---------- conversions ----------
  function numToLetter(n) {
    n = parseInt(n, 10);
    return (n >= 1 && n <= 26) ? String.fromCharCode(64 + n) : '?';
  }
  function letterToNum(ch) { return ch ? ch.toUpperCase().charCodeAt(0) - 64 : 0; }

  // ---------- règles pures (testables hors navigateur) ----------
  var rules = {
    bineroLineOk: function (arr) {
      var z = 0, o = 0, i;
      for (i = 0; i < arr.length; i++) {
        if (arr[i] === '0') z++; else if (arr[i] === '1') o++; else return false;
      }
      if (z !== o) return false;
      for (i = 0; i + 2 < arr.length; i++) {
        if (arr[i] === arr[i + 1] && arr[i + 1] === arr[i + 2]) return false;
      }
      return true;
    },
    bineroTripleBad: function (arr) {
      for (var i = 0; i + 2 < arr.length; i++) {
        if (arr[i] !== '' && arr[i] === arr[i + 1] && arr[i + 1] === arr[i + 2]) return true;
      }
      return false;
    },
    bineroValidate: function (g) {
      var n = g.length, full = true, err = {}, r, c;
      function mark(rr, cc) { err[rr + ',' + cc] = 1; }
      for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (g[r][c] === '') full = false;
      for (r = 0; r < n; r++) {
        if (rules.bineroTripleBad(g[r])) for (c = 0; c < n; c++) mark(r, c);
        var fl = true;
        for (c = 0; c < n; c++) if (g[r][c] === '') fl = false;
        if (fl && !rules.bineroLineOk(g[r])) for (c = 0; c < n; c++) mark(r, c);
      }
      for (c = 0; c < n; c++) {
        var col = [];
        for (r = 0; r < n; r++) col.push(g[r][c]);
        if (rules.bineroTripleBad(col)) for (r = 0; r < n; r++) mark(r, c);
        var flc = true;
        for (r = 0; r < n; r++) if (col[r] === '') flc = false;
        if (flc && !rules.bineroLineOk(col)) for (r = 0; r < n; r++) mark(r, c);
      }
      var seen = {};
      for (r = 0; r < n; r++) {
        var key = g[r].join(''), flr = true;
        for (c = 0; c < n; c++) if (g[r][c] === '') flr = false;
        if (flr) {
          if (seen[key] !== undefined) { for (c = 0; c < n; c++) { mark(r, c); mark(seen[key], c); } }
          else seen[key] = r;
        }
      }
      var seenC = {};
      for (c = 0; c < n; c++) {
        var keyC = '', flc2 = true;
        for (r = 0; r < n; r++) { keyC += g[r][c]; if (g[r][c] === '') flc2 = false; }
        if (flc2) {
          if (seenC[keyC] !== undefined) { for (r = 0; r < n; r++) { mark(r, c); mark(r, seenC[keyC]); } }
          else seenC[keyC] = c;
        }
      }
      return { full: full, err: err, ok: full && Object.keys(err).length === 0 };
    },

    visibleCount: function (arr) {
      var c = 0, m = 0;
      for (var i = 0; i < arr.length; i++) {
        var v = parseInt(arr[i], 10);
        if (v > m) { m = v; c++; }
      }
      return c;
    },
    permOk: function (arr, n) {
      if (arr.length !== n) return false;
      var seen = {};
      for (var i = 0; i < arr.length; i++) {
        var v = arr[i];
        if (v === '' || v === null || v === undefined) return false;
        var p = parseInt(v, 10);
        if (isNaN(p) || p < 1 || p > n || seen[v]) return false;
        seen[v] = 1;
      }
      return true;
    },
    skyscraperValidate: function (g, clues) {
      var n = g.length, err = {}, full = true, r, c;
      function mark(rr, cc) { err[rr + ',' + cc] = 1; }
      for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (g[r][c] === '') full = false;
      for (r = 0; r < n; r++) {
        var fl = true;
        for (c = 0; c < n; c++) if (g[r][c] === '') fl = false;
        if (fl && !rules.permOk(g[r], n)) for (c = 0; c < n; c++) mark(r, c);
      }
      for (c = 0; c < n; c++) {
        var col = [], flc = true;
        for (r = 0; r < n; r++) { col.push(g[r][c]); if (g[r][c] === '') flc = false; }
        if (flc && !rules.permOk(col, n)) for (r = 0; r < n; r++) mark(r, c);
      }
      function checkClue(cells, clue, coords) {
        if (clue === null || clue === '') return;
        var fl = true;
        for (var k = 0; k < cells.length; k++) if (cells[k] === '') fl = false;
        if (!fl) return;
        if (rules.visibleCount(cells) !== clue) {
          for (var j = 0; j < coords.length; j++) mark(coords[j][0], coords[j][1]);
        }
      }
      for (c = 0; c < n; c++) {
        var col2 = [], coords = [];
        for (r = 0; r < n; r++) { col2.push(g[r][c]); coords.push([r, c]); }
        checkClue(col2, clues.top[c], coords);
        checkClue(col2.slice().reverse(), clues.bottom[c], coords.slice().reverse());
      }
      for (r = 0; r < n; r++) {
        var coords2 = [];
        for (c = 0; c < n; c++) coords2.push([r, c]);
        checkClue(g[r], clues.left[r], coords2);
        checkClue(g[r].slice().reverse(), clues.right[r], coords2.slice().reverse());
      }
      return { full: full, err: err, ok: full && Object.keys(err).length === 0 };
    },

    nonogramLine: function (cells, clues) {
      var groups = [], run = 0, i;
      for (i = 0; i < cells.length; i++) {
        if (cells[i] === '#') run++;
        else if (run > 0) { groups.push(run); run = 0; }
      }
      if (run > 0) groups.push(run);
      if (groups.length > clues.length) return 'err';
      for (i = 0; i < groups.length; i++) if (groups[i] > clues[i]) return 'err';
      if (groups.length > 0 && clues.length > 0) {
        var clueSum = 0;
        for (i = 0; i < clues.length; i++) clueSum += clues[i];
        var minSpace = 0;
        for (i = 0; i < groups.length; i++) minSpace += groups[i];
        minSpace += groups.length - 1;
        if (minSpace > clueSum + clues.length - 1) return 'err';
      }
      var hasEmpty = false;
      for (i = 0; i < cells.length; i++) if (cells[i] === '') hasEmpty = true;
      if (!hasEmpty) {
        if (groups.length !== clues.length) return 'err';
        for (i = 0; i < clues.length; i++) if (groups[i] !== clues[i]) return 'err';
        return 'done';
      }
      return 'open';
    },

    caesarDecode: function (word, key) {
      var out = '', k = ((parseInt(key, 10) || 0) % 26 + 26) % 26;
      for (var i = 0; i < word.length; i++) {
        var c = word.charCodeAt(i);
        if (c >= 65 && c <= 90) out += String.fromCharCode((c - 65 - k + 26) % 26 + 65);
        else out += word.charAt(i);
      }
      return out;
    },

    cryptCheck: function (ops, res, assign) {
      var letters = {}, i, j;
      for (i = 0; i < ops.length; i++) for (j = 0; j < ops[i].length; j++) letters[ops[i].charAt(j)] = 1;
      for (j = 0; j < res.length; j++) letters[res.charAt(j)] = 1;
      var all = Object.keys(letters);
      for (i = 0; i < all.length; i++) {
        var v = assign[all[i]];
        if (v === '' || v === undefined || v === null) {
          return { ok: false, incomplete: true };
        }
      }
      var used = {}, inj = true;
      for (i = 0; i < all.length; i++) {
        var d = assign[all[i]];
        if (used[d]) inj = false; else used[d] = 1;
      }
      var noLead = true;
      for (i = 0; i < ops.length; i++) if (assign[ops[i].charAt(0)] === '0') noLead = false;
      if (assign[res.charAt(0)] === '0') noLead = false;
      function val(w) {
        var s = 0;
        for (var k = 0; k < w.length; k++) s = s * 10 + parseInt(assign[w.charAt(k)], 10);
        return s;
      }
      var sum = 0;
      for (i = 0; i < ops.length; i++) sum += val(ops[i]);
      var sumOk = (sum === val(res));
      return { ok: inj && noLead && sumOk, injective: inj, noLead: noLead, sumOk: sumOk, incomplete: false };
    },

    magicValidate: function (g) {
      var n = g.length, err = {}, full = true, r, c, i;
      for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (g[r][c] === '') full = false;
      var sums = [];
      for (r = 0; r < n; r++) {
        var s = 0;
        for (c = 0; c < n; c++) s += parseInt(g[r][c], 10) || 0;
        sums.push(s);
      }
      for (c = 0; c < n; c++) {
        var s2 = 0;
        for (r = 0; r < n; r++) s2 += parseInt(g[r][c], 10) || 0;
        sums.push(s2);
      }
      var d1 = 0, d2 = 0;
      for (r = 0; r < n; r++) {
        d1 += parseInt(g[r][r], 10) || 0;
        d2 += parseInt(g[r][n - 1 - r], 10) || 0;
      }
      sums.push(d1); sums.push(d2);
      if (full) {
        var ref = sums[0];
        for (i = 0; i < sums.length; i++) {
          if (sums[i] !== ref) {
            if (i < n) { for (c = 0; c < n; c++) err[i + ',' + c] = 1; }
            else if (i < 2 * n) { for (r = 0; r < n; r++) err[r + ',' + (i - n)] = 1; }
            else if (i === 2 * n) { for (r = 0; r < n; r++) err[r + ',' + r] = 1; }
            else { for (r = 0; r < n; r++) err[r + ',' + (n - 1 - r)] = 1; }
          }
        }
      }
      return { full: full, err: err, sums: sums, ok: full && Object.keys(err).length === 0 };
    },

    pyramidValidate: function (rows) {
      var err = {}, full = true, i, j;
      for (i = 0; i < rows.length; i++) {
        for (j = 0; j < rows[i].length; j++) if (rows[i][j] === '') full = false;
      }
      for (i = 0; i + 1 < rows.length; i++) {
        for (j = 0; j < rows[i].length; j++) {
          var a = rows[i][j], b = rows[i + 1][j], c = rows[i + 1][j + 1];
          if (a !== '' && b !== '' && c !== '') {
            if (parseInt(a, 10) !== parseInt(b, 10) + parseInt(c, 10)) {
              err[i + ',' + j] = 1;
              err[(i + 1) + ',' + j] = 1;
              err[(i + 1) + ',' + (j + 1)] = 1;
            }
          }
        }
      }
      return { full: full, err: err, ok: full && Object.keys(err).length === 0 };
    },

    latinValidate: function (g, symbols, solution) {
      var n = g.length, err = {}, full = true, r, c;
      function mark(rr, cc) { err[rr + ',' + cc] = 1; }
      for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (g[r][c] === '') full = false;
      function lineOk(line) {
        var seen = {};
        for (var i = 0; i < line.length; i++) {
          if (symbols.indexOf(line[i]) < 0 || seen[line[i]]) return false;
          seen[line[i]] = 1;
        }
        return true;
      }
      for (r = 0; r < n; r++) {
        var fl = true;
        for (c = 0; c < n; c++) if (g[r][c] === '') fl = false;
        if (fl && !lineOk(g[r])) for (c = 0; c < n; c++) mark(r, c);
      }
      for (c = 0; c < n; c++) {
        var col = [], flc = true;
        for (r = 0; r < n; r++) { col.push(g[r][c]); if (g[r][c] === '') flc = false; }
        if (flc && !lineOk(col)) for (r = 0; r < n; r++) mark(r, c);
      }
      var solOk = true;
      if (solution && solution.length === n * n) {
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) {
          if (g[r][c] !== solution.charAt(r * n + c)) solOk = false;
        }
      }
      return { full: full, err: err, ok: full && Object.keys(err).length === 0 && solOk };
    }
  };

  // ---------- helpers DOM ----------
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function clearNode(nd) { while (nd.firstChild) nd.removeChild(nd.firstChild); }

  function bindCell(td, opts) {
    td.tabIndex = 0;
    td.setAttribute('role', 'button');
    td.addEventListener('click', function () {
      var cur = opts.get();
      var i = opts.values.indexOf(cur);
      var nv = opts.values[(i + 1) % opts.values.length];
      opts.set(nv);
      opts.onChange();
    });
    td.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      if (opts.right !== undefined) { opts.set(opts.right); opts.onChange(); }
    });
    td.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'Backspace' || k === 'Delete' || k === ' ') {
        e.preventDefault();
        opts.set(opts.values[0]);
        opts.onChange();
        return;
      }
      var ku = (k || '').toUpperCase();
      if (ku.length === 1 && opts.values.indexOf(ku) > 0) {
        e.preventDefault();
        opts.set(ku);
        opts.onChange();
      }
    });
  }

  // ---------- base ----------
  function Base(c) {
    this.c = c;
    this.day = parseInt(document.body.getAttribute('data-day') || '0', 10);
    this.game = c.getAttribute('data-game');
    this.answer = c.getAttribute('data-answer');
    this.letter = c.getAttribute('data-letter');
    this.solution = c.getAttribute('data-solution');
    this.hints = 0;
    this._buildToolbar();
    this.init();
    this._restore();
    this.render();
    this._afterLoad();
  }

  Base.prototype._buildToolbar = function () {
    var self = this;
    var extract = this.c.querySelector('.extract');
    var bar = el('div', 'toolbar');
    var bCheck = el('button', 'tbtn tbtn-check', 'Vérifier');
    bCheck.type = 'button';
    var bHint = el('button', 'tbtn tbtn-hint', 'Indice');
    bHint.type = 'button';
    var bReset = el('button', 'tbtn tbtn-reset', 'Réinitialiser');
    bReset.type = 'button';
    bCheck.addEventListener('click', function () { self.check(); });
    bHint.addEventListener('click', function () { self.hint(); });
    bReset.addEventListener('click', function () { self.reset(); });
    bar.appendChild(bCheck);
    bar.appendChild(bHint);
    bar.appendChild(bReset);
    this.statusEl = el('p', 'game-status');
    this.statusEl.setAttribute('role', 'status');
    if (extract && extract.parentNode) {
      extract.parentNode.insertBefore(bar, extract);
      extract.parentNode.insertBefore(this.statusEl, extract);
    } else {
      this.c.appendChild(bar);
      this.c.appendChild(this.statusEl);
    }
    this.toolbarEl = bar;
  };

  Base.prototype.status = function (msg, cls) {
    this.statusEl.textContent = msg;
    this.statusEl.className = 'game-status' + (cls ? ' ' + cls : '');
  };

  Base.prototype.save = function () {
    sSet('avent:game:' + this.day, JSON.stringify({ s: this.serialize(), h: this.hints }));
  };

  Base.prototype._restore = function () {
    var raw = sGet('avent:game:' + this.day);
    if (!raw) return;
    try {
      var o = JSON.parse(raw);
      this.hints = o.h || 0;
      if (o.s) this.deserialize(o.s);
    } catch (e) { /* état illisible : on ignore */ }
  };

  Base.prototype._afterLoad = function () {
    var solvedLetter = sGet('avent:solved:' + this.day);
    if (solvedLetter) {
      this.c.classList.add('solved');
      this.status('✓ Résolu — lettre du jour : ' + solvedLetter + '.', 'ok');
    }
  };

  Base.prototype.solve = function (num) {
    if (this.c.classList.contains('solved')) return;
    var lettre = this.letter || numToLetter(num);
    sSet('avent:solved:' + this.day, lettre);
    this.c.classList.add('solved');
    this.status('✓ Résolu ! Nombre mystère : ' + num + ' → lettre ' + lettre + '.', 'ok');
    this.save();
  };

  Base.prototype.check = function () { this.validate(); };

  Base.prototype.hint = function () {
    this.hints++;
    if (this._hint) {
      this._hint();
    } else {
      this.status('Indice n°' + this.hints + ' : relis la règle encadrée ci-dessus.', '');
    }
    this.save();
  };

  Base.prototype.reset = function () {};
  Base.prototype.serialize = function () { return null; };
  Base.prototype.deserialize = function (s) { /* surchargé */ };
  Base.prototype.render = function () {};
  Base.prototype.validate = function () {};
  Base.prototype.init = function () {};

  Base.prototype._countEmpty = function (g) {
    var n = 0;
    for (var r = 0; r < g.length; r++) for (var c = 0; c < g[r].length; c++) if (g[r][c] === '') n++;
    return n;
  };

  Base.prototype._gridHint = function (flat, g, setCell, renderCell) {
    var n = g.length;
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        var want = flat.charAt(r * n + c);
        if (want && g[r][c] !== want) {
          setCell(r, c, want);
          if (renderCell) renderCell(r, c);
          this.validate();
          this.save();
          this.status('Indice n°' + this.hints + ' : une case a été révélée.', '');
          return true;
        }
      }
    }
    this.status('Indice n°' + this.hints + ' : aucune case à corriger pour l’instant.', '');
    return false;
  };

  // ---------- moteur binéro ----------
  function Binero(c) { Base.call(this, c); }
  Binero.prototype = Object.create(Base.prototype);
  Binero.prototype.constructor = Binero;

  Binero.prototype.init = function () {
    var self = this;
    var table = this.c.querySelector('table.bgrid');
    var rows = table.rows;
    this.n = rows.length;
    this.state = []; this.given = []; this.tds = []; this.star = [];
    for (var r = 0; r < this.n; r++) {
      this.state[r] = []; this.given[r] = []; this.tds[r] = []; this.star[r] = [];
      var cells = rows[r].cells;
      for (var c = 0; c < this.n; c++) {
        var td = cells[c];
        var isStar = td.classList.contains('star');
        var txt = td.textContent.replace(/[★\s]/g, '');
        var given = (txt === '0' || txt === '1');
        this.given[r][c] = given;
        this.state[r][c] = given ? txt : '';
        this.tds[r][c] = td;
        this.star[r][c] = isStar;
        if (given) {
          td.classList.add('locked');
        } else {
          td.classList.add('play');
          td.setAttribute('aria-label', 'case ' + (r + 1) + ',' + (c + 1));
          (function (rr, cc, tdd) {
            bindCell(tdd, {
              values: ['', '0', '1'],
              get: function () { return self.state[rr][cc]; },
              set: function (v) { self.state[rr][cc] = v; },
              onChange: function () { self.renderCell(rr, cc); self.validate(); self.save(); }
            });
          })(r, c, td);
        }
      }
    }
  };

  Binero.prototype.renderCell = function (r, c) {
    var td = this.tds[r][c];
    var star = td.querySelector('.star');
    clearNode(td);
    td.appendChild(document.createTextNode(this.state[r][c]));
    if (star) td.appendChild(star);
  };

  Binero.prototype.render = function () {
    for (var r = 0; r < this.n; r++) for (var c = 0; c < this.n; c++) this.renderCell(r, c);
    this.validate();
  };

  Binero.prototype.validate = function () {
    var res = rules.bineroValidate(this.state);
    for (var r = 0; r < this.n; r++) for (var c = 0; c < this.n; c++) {
      this.tds[r][c].classList.toggle('cell-err', !!res.err[r + ',' + c]);
    }
    if (res.ok) {
      var bits = '';
      for (var r2 = 0; r2 < this.n; r2++) for (var c2 = 0; c2 < this.n; c2++) {
        if (this.star[r2][c2]) bits += this.state[r2][c2];
      }
      this.solve(parseInt(bits, 2));
    }
    return res;
  };

  Binero.prototype.check = function () {
    if (this.c.classList.contains('solved')) { this.status('✓ Déjà résolu.', 'ok'); return; }
    var res = this.validate();
    if (res.ok) return;
    var left = this._countEmpty(this.state);
    this.status(left > 0 ? 'Il reste ' + left + ' case(s) vide(s).' : 'Des cases sont en conflit (surlignées en rouge).', left > 0 ? '' : 'err');
  };

  Binero.prototype.reset = function () {
    for (var r = 0; r < this.n; r++) for (var c = 0; c < this.n; c++) {
      if (!this.given[r][c]) this.state[r][c] = '';
    }
    this.render();
    this.save();
    this.status('Grille réinitialisée.', '');
  };

  Binero.prototype.serialize = function () {
    return this.state.map(function (row) { return row.join(''); }).join('|');
  };
  Binero.prototype.deserialize = function (s) {
    var parts = String(s).split('|');
    for (var r = 0; r < this.n && r < parts.length; r++) {
      for (var c = 0; c < this.n && c < parts[r].length; c++) {
        if (!this.given[r][c]) {
          var ch = parts[r].charAt(c);
          this.state[r][c] = (ch === '0' || ch === '1') ? ch : '';
        }
      }
    }
  };

  Binero.prototype._hint = function () {
    if (!this.solution) { this.status('Indice n°' + this.hints + ' : une ligne presque pleine se complète avec la règle des trois identiques.', ''); return; }
    var self = this;
    this._gridHint(this.solution, this.state, function (r, c, v) { self.state[r][c] = v; }, function (r, c) { self.renderCell(r, c); });
  };

  // ---------- moteur gratte-ciel ----------
  function Skyscraper(c) { Base.call(this, c); }
  Skyscraper.prototype = Object.create(Base.prototype);
  Skyscraper.prototype.constructor = Skyscraper;

  function clueVal(td) {
    var t = td.textContent.replace(/ /g, ' ').trim();
    return t === '' ? null : parseInt(t, 10);
  }

  Skyscraper.prototype.init = function () {
    var self = this;
    var table = this.c.querySelector('table.sgrid');
    var rows = table.rows;
    var first = rows[1].cells;
    var scIdx = [];
    for (var i = 0; i < first.length; i++) if (first[i].classList.contains('scell')) scIdx.push(i);
    this.n = scIdx.length;
    var off = scIdx[0];
    this.clues = { top: [], bottom: [], left: [], right: [] };
    for (var j = 0; j < this.n; j++) {
      this.clues.top[j] = clueVal(rows[0].cells[off + j]);
      this.clues.bottom[j] = clueVal(rows[this.n + 1].cells[off + j]);
    }
    this.state = []; this.given = []; this.tds = []; this.dot = [];
    for (var r = 0; r < this.n; r++) {
      this.clues.left[r] = clueVal(rows[r + 1].cells[0]);
      this.clues.right[r] = clueVal(rows[r + 1].cells[off + this.n + 1]);
      this.state[r] = []; this.given[r] = []; this.tds[r] = []; this.dot[r] = [];
      for (var c = 0; c < this.n; c++) {
        var td = rows[r + 1].cells[off + c];
        var txt = td.textContent.trim();
        var given = txt !== '';
        this.given[r][c] = given;
        this.state[r][c] = given ? txt : '';
        this.tds[r][c] = td;
        this.dot[r][c] = td.classList.contains('dot');
        if (given) td.classList.add('locked');
        else {
          td.classList.add('play');
          td.setAttribute('aria-label', 'case ' + (r + 1) + ',' + (c + 1));
          (function (rr, cc, tdd) {
            var vals = [''];
            for (var k = 1; k <= self.n; k++) vals.push(String(k));
            bindCell(tdd, {
              values: vals,
              get: function () { return self.state[rr][cc]; },
              set: function (v) { self.state[rr][cc] = v; },
              onChange: function () { self.renderCell(rr, cc); self.validate(); self.save(); }
            });
          })(r, c, td);
        }
      }
    }
  };

  Skyscraper.prototype.renderCell = function (r, c) {
    this.tds[r][c].textContent = this.state[r][c];
  };

  Skyscraper.prototype.render = function () {
    for (var r = 0; r < this.n; r++) for (var c = 0; c < this.n; c++) this.renderCell(r, c);
    this.validate();
  };

  Skyscraper.prototype.validate = function () {
    var res = rules.skyscraperValidate(this.state, this.clues);
    for (var r = 0; r < this.n; r++) for (var c = 0; c < this.n; c++) {
      this.tds[r][c].classList.toggle('cell-err', !!res.err[r + ',' + c]);
    }
    if (res.ok) {
      var sum = 0;
      for (var r2 = 0; r2 < this.n; r2++) for (var c2 = 0; c2 < this.n; c2++) {
        if (this.dot[r2][c2]) sum += parseInt(this.state[r2][c2], 10);
      }
      this.solve(sum);
    }
    return res;
  };

  Skyscraper.prototype.check = function () {
    if (this.c.classList.contains('solved')) { this.status('✓ Déjà résolu.', 'ok'); return; }
    var res = this.validate();
    if (res.ok) return;
    var left = this._countEmpty(this.state);
    this.status(left > 0 ? 'Il reste ' + left + ' case(s) vide(s).' : 'Des cases sont en conflit (rouge) : doublon ou nombre visible incompatible.', left > 0 ? '' : 'err');
  };

  Skyscraper.prototype.reset = function () {
    for (var r = 0; r < this.n; r++) for (var c = 0; c < this.n; c++) if (!this.given[r][c]) this.state[r][c] = '';
    this.render(); this.save();
    this.status('Grille réinitialisée.', '');
  };

  Skyscraper.prototype.serialize = function () {
    return this.state.map(function (row) { return row.join(''); }).join('|');
  };
  Skyscraper.prototype.deserialize = function (s) {
    var parts = String(s).split('|');
    for (var r = 0; r < this.n && r < parts.length; r++) {
      for (var c = 0; c < this.n && c < parts[r].length; c++) {
        if (!this.given[r][c]) {
          var ch = parts[r].charAt(c);
          this.state[r][c] = (ch >= '1' && ch <= '9') ? ch : '';
        }
      }
    }
  };

  Skyscraper.prototype._hint = function () {
    if (!this.solution) { this.status('Indice n°' + this.hints + ' : un indice de bord égal à 1 ou au maximum force la case la plus haute.', ''); return; }
    var self = this;
    this._gridHint(this.solution, this.state, function (r, c, v) { self.state[r][c] = v; }, function (r, c) { self.renderCell(r, c); });
  };

  // ---------- moteur nonogramme ----------
  function Nonogram(c) { Base.call(this, c); }
  Nonogram.prototype = Object.create(Base.prototype);
  Nonogram.prototype.constructor = Nonogram;

  function parseClues(td) {
    var t = td.textContent.replace(/ /g, ' ').trim();
    if (t === '') return [];
    return t.split(/\s+/).map(function (x) { return parseInt(x, 10); }).filter(function (x) { return !isNaN(x); });
  }

  Nonogram.prototype.init = function () {
    var self = this;
    var table = this.c.querySelector('table.ngrid');
    var rows = table.rows;
    var first = rows[1].cells;
    var ncIdx = [];
    for (var i = 0; i < first.length; i++) if (first[i].classList.contains('ncell')) ncIdx.push(i);
    this.n = ncIdx.length;
    var off = ncIdx[0];
    this.rowClues = []; this.colClues = [];
    this.rowClueTds = []; this.colClueTds = [];
    for (var j = 0; j < this.n; j++) {
      this.colClues[j] = parseClues(rows[0].cells[off + j]);
      this.colClueTds[j] = rows[0].cells[off + j];
    }
    this.state = []; this.given = []; this.tds = [];
    for (var r = 0; r < this.n; r++) {
      this.rowClues[r] = parseClues(rows[r + 1].cells[0]);
      this.rowClueTds[r] = rows[r + 1].cells[0];
      this.state[r] = []; this.given[r] = []; this.tds[r] = [];
      for (var c = 0; c < this.n; c++) {
        var td = rows[r + 1].cells[off + c];
        var filled = td.classList.contains('filled');
        this.given[r][c] = filled;
        this.state[r][c] = filled ? '#' : '';
        this.tds[r][c] = td;
        if (filled) td.classList.add('locked');
        else {
          td.classList.add('play');
          td.setAttribute('aria-label', 'case ' + (r + 1) + ',' + (c + 1));
          (function (rr, cc, tdd) {
            bindCell(tdd, {
              values: ['', '#', 'x'],
              right: 'x',
              get: function () { return self.state[rr][cc]; },
              set: function (v) { self.state[rr][cc] = v; },
              onChange: function () { self.renderCell(rr, cc); self.validate(); self.save(); }
            });
          })(r, c, td);
        }
      }
    }
  };

  Nonogram.prototype.renderCell = function (r, c) {
    var td = this.tds[r][c];
    var v = this.state[r][c];
    td.classList.toggle('filled', v === '#');
    td.classList.toggle('crossed', v === 'x');
  };

  Nonogram.prototype.render = function () {
    for (var r = 0; r < this.n; r++) for (var c = 0; c < this.n; c++) this.renderCell(r, c);
    this.validate();
  };

  Nonogram.prototype._lineStatus = function (cells, clues) {
    return rules.nonogramLine(cells, clues);
  };

  Nonogram.prototype._colCells = function (c) {
    var col = [];
    for (var r = 0; r < this.n; r++) col.push(this.state[r][c]);
    return col;
  };

  Nonogram.prototype.validate = function () {
    var r, c, allDone = true, anyErr = false;
    for (r = 0; r < this.n; r++) {
      var st = this._lineStatus(this.state[r], this.rowClues[r]);
      this.rowClueTds[r].classList.toggle('done', st === 'done');
      this.rowClueTds[r].classList.toggle('err', st === 'err');
      if (st !== 'done') allDone = false;
      if (st === 'err') anyErr = true;
    }
    for (c = 0; c < this.n; c++) {
      var st2 = this._lineStatus(this._colCells(c), this.colClues[c]);
      this.colClueTds[c].classList.toggle('done', st2 === 'done');
      this.colClueTds[c].classList.toggle('err', st2 === 'err');
      if (st2 !== 'done') allDone = false;
      if (st2 === 'err') anyErr = true;
    }
    for (r = 0; r < this.n; r++) {
      var rowBad = this._lineStatus(this.state[r], this.rowClues[r]) === 'err';
      for (c = 0; c < this.n; c++) {
        var colBad = this._lineStatus(this._colCells(c), this.colClues[c]) === 'err';
        this.tds[r][c].classList.toggle('cell-err', rowBad || colBad);
      }
    }
    var full = this._countEmpty(this.state) === 0;
    if (full && allDone && !anyErr) this.solve(parseInt(this.answer, 10));
    return { full: full, ok: full && allDone && !anyErr };
  };

  Nonogram.prototype.check = function () {
    if (this.c.classList.contains('solved')) { this.status('✓ Déjà résolu.', 'ok'); return; }
    var res = this.validate();
    if (res.ok) return;
    var left = this._countEmpty(this.state);
    this.status(left > 0 ? 'Il reste ' + left + ' case(s) à déterminer (noir ou croix).' : 'Certaines lignes/colonnes sont en conflit (indices en rouge).', left > 0 ? '' : 'err');
  };

  Nonogram.prototype.reset = function () {
    for (var r = 0; r < this.n; r++) for (var c = 0; c < this.n; c++) if (!this.given[r][c]) this.state[r][c] = '';
    this.render(); this.save();
    this.status('Grille réinitialisée.', '');
  };

  Nonogram.prototype.serialize = function () {
    return this.state.map(function (row) { return row.join(''); }).join('|');
  };
  Nonogram.prototype.deserialize = function (s) {
    var parts = String(s).split('|');
    for (var r = 0; r < this.n && r < parts.length; r++) {
      for (var c = 0; c < this.n && c < parts[r].length; c++) {
        var ch = parts[r].charAt(c);
        if (!this.given[r][c]) this.state[r][c] = (ch === '#' || ch === 'x') ? ch : '';
      }
    }
  };

  Nonogram.prototype._hint = function () {
    if (!this.solution) { this.status('Indice n°' + this.hints + ' : un indice égal à la largeur de la grille rend toute la ligne noire.', ''); return; }
    var self = this;
    this._gridHint(this.solution, this.state, function (r, c, v) { self.state[r][c] = v; }, function (r, c) { self.renderCell(r, c); });
  };

  // ---------- moteur placement (latin) ----------
  function Latin(c) { Base.call(this, c); }
  Latin.prototype = Object.create(Base.prototype);
  Latin.prototype.constructor = Latin;

  Latin.prototype.init = function () {
    var self = this;
    var table = this.c.querySelector('table.lgrid');
    var rows = table.rows;
    this.n = rows.length;
    this.state = []; this.given = []; this.tds = []; this.dot = [];
    var symbols = [];
    for (var r0 = 0; r0 < this.n; r0++) {
      var cs0 = rows[r0].cells;
      for (var c0 = 0; c0 < this.n; c0++) {
        var t0 = cs0[c0].textContent.trim();
        if (t0 && symbols.indexOf(t0) < 0) symbols.push(t0);
      }
    }
    this.symbols = symbols;
    var valsAttr = this.c.getAttribute('data-values');
    this.values = {};
    if (valsAttr) { try { this.values = JSON.parse(valsAttr); } catch (e) { this.values = {}; } }
    for (var r = 0; r < this.n; r++) {
      this.state[r] = []; this.given[r] = []; this.tds[r] = []; this.dot[r] = [];
      var cells = rows[r].cells;
      for (var c = 0; c < this.n; c++) {
        var td = cells[c];
        var txt = td.textContent.trim();
        var given = td.classList.contains('given') || txt !== '';
        this.given[r][c] = given;
        this.state[r][c] = given ? txt : '';
        this.tds[r][c] = td;
        this.dot[r][c] = td.classList.contains('dot');
        if (given) td.classList.add('locked');
        else {
          td.classList.add('play');
          td.setAttribute('aria-label', 'case ' + (r + 1) + ',' + (c + 1));
          (function (rr, cc, tdd) {
            var vals = [''].concat(self.symbols);
            bindCell(tdd, {
              values: vals,
              get: function () { return self.state[rr][cc]; },
              set: function (v) { self.state[rr][cc] = v; },
              onChange: function () { self.renderCell(rr, cc); self.validate(); self.save(); }
            });
          })(r, c, td);
        }
      }
    }
    var pal = el('div', 'palette');
    pal.setAttribute('aria-label', 'Palette de symboles');
    for (var s = 0; s < symbols.length; s++) {
      (function (sym) {
        var b = el('button', 'pal-btn', sym);
        b.type = 'button';
        b.title = 'Poser ' + sym + ' dans la première case vide';
        b.addEventListener('click', function () {
          for (var rr = 0; rr < self.n; rr++) {
            for (var cc = 0; cc < self.n; cc++) {
              if (!self.given[rr][cc] && self.state[rr][cc] === '') {
                self.state[rr][cc] = sym;
                self.renderCell(rr, cc);
                self.validate();
                self.save();
                return;
              }
            }
          }
          self.status('Plus de case vide : clique sur une case pour changer son symbole.', '');
        });
        pal.appendChild(b);
      })(symbols[s]);
    }
    if (table.parentNode) table.parentNode.insertBefore(pal, table.nextSibling);
  };

  Latin.prototype.renderCell = function (r, c) {
    this.tds[r][c].textContent = this.state[r][c];
  };

  Latin.prototype.render = function () {
    for (var r = 0; r < this.n; r++) for (var c = 0; c < this.n; c++) this.renderCell(r, c);
    this.validate();
  };

  Latin.prototype.validate = function () {
    var res = rules.latinValidate(this.state, this.symbols, this.solution);
    for (var r = 0; r < this.n; r++) for (var c = 0; c < this.n; c++) {
      this.tds[r][c].classList.toggle('cell-err', !!res.err[r + ',' + c]);
    }
    if (res.ok) {
      var sum = 0;
      for (var r2 = 0; r2 < this.n; r2++) for (var c2 = 0; c2 < this.n; c2++) {
        if (this.dot[r2][c2]) sum += parseInt(this.values[this.state[r2][c2]] || '0', 10);
      }
      this.solve(sum);
    }
    return res;
  };

  Latin.prototype.check = function () {
    if (this.c.classList.contains('solved')) { this.status('✓ Déjà résolu.', 'ok'); return; }
    var res = this.validate();
    if (res.ok) return;
    var left = this._countEmpty(this.state);
    this.status(left > 0 ? 'Il reste ' + left + ' case(s) vide(s).' : 'La grille est pleine mais ne respecte pas toutes les règles/indices.', left > 0 ? '' : 'err');
  };

  Latin.prototype.reset = function () {
    for (var r = 0; r < this.n; r++) for (var c = 0; c < this.n; c++) if (!this.given[r][c]) this.state[r][c] = '';
    this.render(); this.save();
    this.status('Grille réinitialisée.', '');
  };

  Latin.prototype.serialize = function () {
    return this.state.map(function (row) { return row.join(''); }).join('|');
  };
  Latin.prototype.deserialize = function (s) {
    var parts = String(s).split('|');
    for (var r = 0; r < this.n && r < parts.length; r++) {
      for (var c = 0; c < this.n && c < parts[r].length; c++) {
        var ch = parts[r].charAt(c);
        if (!this.given[r][c]) this.state[r][c] = this.symbols.indexOf(ch) >= 0 ? ch : '';
      }
    }
  };

  Latin.prototype._hint = function () {
    if (!this.solution) { this.status('Indice n°' + this.hints + ' : chaque ligne et chaque colonne doit contenir tous les symboles.', ''); return; }
    var self = this;
    this._gridHint(this.solution, this.state, function (r, c, v) { self.state[r][c] = v; }, function (r, c) { self.renderCell(r, c); });
  };

  // ---------- moteur pyramide ----------
  function Pyramid(c) { Base.call(this, c); }
  Pyramid.prototype = Object.create(Base.prototype);
  Pyramid.prototype.constructor = Pyramid;

  Pyramid.prototype.init = function () {
    var self = this;
    var pyr = this.c.querySelector('.pyr');
    var prows = pyr.querySelectorAll('.prow');
    this.m = prows.length;
    this.state = []; this.tds = []; this.inputs = []; this.mark = null;
    for (var i = 0; i < this.m; i++) {
      var pcs = prows[i].querySelectorAll('.pcell');
      this.state[i] = []; this.tds[i] = []; this.inputs[i] = [];
      for (var j = 0; j < pcs.length; j++) {
        var pc = pcs[j];
        var txt = pc.textContent.trim();
        var given = txt !== '' && txt !== '☆';
        this.state[i][j] = given ? txt : '';
        this.tds[i][j] = pc;
        if (pc.classList.contains('mark')) this.mark = [i, j];
        if (given) {
          pc.classList.add('locked');
          this.inputs[i][j] = null;
        } else {
          pc.classList.add('play');
          var inp = el('input', 'pcell-in');
          inp.type = 'text';
          inp.setAttribute('inputmode', 'numeric');
          inp.maxLength = 3;
          inp.setAttribute('aria-label', 'étage ' + (i + 1) + ', case ' + (j + 1));
          clearNode(pc);
          pc.appendChild(inp);
          this.inputs[i][j] = inp;
          (function (ii, jj, ip) {
            ip.addEventListener('input', function () {
              self.state[ii][jj] = ip.value.replace(/\D/g, '').slice(0, 3);
              self.validate();
              self.save();
            });
          })(i, j, inp);
        }
      }
    }
  };

  Pyramid.prototype.render = function () {
    for (var i = 0; i < this.m; i++) {
      for (var j = 0; j < this.state[i].length; j++) {
        if (this.inputs[i][j]) this.inputs[i][j].value = this.state[i][j];
      }
    }
    this.validate();
  };

  Pyramid.prototype.validate = function () {
    var res = rules.pyramidValidate(this.state);
    for (var i = 0; i < this.m; i++) {
      for (var j = 0; j < this.state[i].length; j++) {
        this.tds[i][j].classList.toggle('cell-err', !!res.err[i + ',' + j]);
      }
    }
    if (res.ok && this.mark) {
      this.solve(parseInt(this.state[this.mark[0]][this.mark[1]], 10));
    }
    return res;
  };

  Pyramid.prototype.check = function () {
    if (this.c.classList.contains('solved')) { this.status('✓ Déjà résolu.', 'ok'); return; }
    var res = this.validate();
    if (res.ok) return;
    var left = this._countEmpty(this.state);
    this.status(left > 0 ? 'Il reste ' + left + ' case(s) vide(s).' : 'Certaines sommes ne correspondent pas (rouge).', left > 0 ? '' : 'err');
  };

  Pyramid.prototype.reset = function () {
    for (var i = 0; i < this.m; i++) for (var j = 0; j < this.state[i].length; j++) {
      if (this.inputs[i][j]) { this.state[i][j] = ''; this.inputs[i][j].value = ''; }
    }
    this.validate(); this.save();
    this.status('Pyramide réinitialisée.', '');
  };

  Pyramid.prototype.serialize = function () {
    return this.state.map(function (row) { return row.join(''); }).join('|');
  };
  Pyramid.prototype.deserialize = function (s) {
    var parts = String(s).split('|');
    for (var i = 0; i < this.m && i < parts.length; i++) {
      var digits = parts[i].replace(/\D/g, '');
      for (var j = 0; j < this.state[i].length && j < digits.length; j++) {
        if (this.inputs[i][j]) this.state[i][j] = digits.charAt(j);
      }
    }
  };

  // ---------- moteur carré magique ----------
  function Magic(c) { Base.call(this, c); }
  Magic.prototype = Object.create(Base.prototype);
  Magic.prototype.constructor = Magic;

  Magic.prototype.init = function () {
    var self = this;
    var table = this.c.querySelector('table.mgrid');
    var rows = table.rows;
    this.n = rows.length;
    this.state = []; this.tds = []; this.empty = null; this.input = null;
    for (var r = 0; r < this.n; r++) {
      this.state[r] = []; this.tds[r] = [];
      var cells = rows[r].cells;
      for (var c = 0; c < this.n; c++) {
        var td = cells[c];
        var txt = td.textContent.replace(/ /g, '').trim();
        this.tds[r][c] = td;
        if (txt === '') {
          this.state[r][c] = '';
          this.empty = [r, c];
          td.classList.add('play');
          var inp = el('input', 'mcell-in');
          inp.type = 'text';
          inp.setAttribute('inputmode', 'numeric');
          inp.maxLength = 2;
          inp.setAttribute('aria-label', 'case manquante');
          clearNode(td);
          td.appendChild(inp);
          this.input = inp;
          inp.addEventListener('input', function () {
            self.state[self.empty[0]][self.empty[1]] = inp.value.replace(/\D/g, '').slice(0, 2);
            self.validate();
            self.save();
          });
        } else {
          this.state[r][c] = txt;
          td.classList.add('locked');
        }
      }
    }
  };

  Magic.prototype.render = function () {
    if (this.input && this.empty) this.input.value = this.state[this.empty[0]][this.empty[1]];
    this.validate();
  };

  Magic.prototype.validate = function () {
    var res = rules.magicValidate(this.state);
    for (var r = 0; r < this.n; r++) for (var c = 0; c < this.n; c++) {
      this.tds[r][c].classList.toggle('cell-err', !!res.err[r + ',' + c]);
    }
    if (res.ok && this.empty) {
      this.solve(parseInt(this.state[this.empty[0]][this.empty[1]], 10));
    }
    return res;
  };

  Magic.prototype.check = function () {
    if (this.c.classList.contains('solved')) { this.status('✓ Déjà résolu.', 'ok'); return; }
    var res = this.validate();
    if (res.ok) return;
    if (this.empty && this.state[this.empty[0]][this.empty[1]] === '') this.status('La case manquante est encore vide.', '');
    else this.status('Les sommes ne sont pas toutes égales (lignes/colonnes/diagonales en rouge).', 'err');
  };

  Magic.prototype.reset = function () {
    if (this.empty) this.state[this.empty[0]][this.empty[1]] = '';
    this.render(); this.save();
    this.status('Case vidée.', '');
  };

  Magic.prototype.serialize = function () {
    return this.empty ? this.state[this.empty[0]][this.empty[1]] : '';
  };
  Magic.prototype.deserialize = function (s) {
    if (this.empty) this.state[this.empty[0]][this.empty[1]] = String(s).replace(/\D/g, '').slice(0, 2);
  };

  // ---------- moteurs à réponse ----------
  function AnswerBase(c) { Base.call(this, c); }
  AnswerBase.prototype = Object.create(Base.prototype);
  AnswerBase.prototype.constructor = AnswerBase;

  AnswerBase.prototype._addInput = function (anchor, placeholder) {
    var wrap = el('div', 'controls');
    var inp = el('input', 'ans-input');
    inp.type = 'text';
    inp.setAttribute('inputmode', 'numeric');
    inp.setAttribute('aria-label', placeholder || 'Ta réponse');
    if (placeholder) inp.placeholder = placeholder;
    wrap.appendChild(inp);
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(wrap, anchor);
    else this.c.appendChild(wrap);
    this.input = inp;
    return inp;
  };

  AnswerBase.prototype._checkInput = function () {
    var v = (this.input.value || '').trim();
    if (v === String(this.answer)) { this.solve(parseInt(this.answer, 10)); return true; }
    this.status('Ce n’est pas ça… réessaie.', 'err');
    return false;
  };

  // jour 2 : suite logique
  function Sequence(c) { AnswerBase.call(this, c); }
  Sequence.prototype = Object.create(AnswerBase.prototype);
  Sequence.prototype.constructor = Sequence;

  Sequence.prototype.init = function () {
    var self = this;
    var blank = this.c.querySelector('.bigseq .blank');
    var inp;
    if (blank) {
      inp = el('input', 'ans-input');
      inp.type = 'text';
      inp.setAttribute('inputmode', 'numeric');
      inp.setAttribute('aria-label', 'Le nombre manquant');
      clearNode(blank);
      blank.appendChild(inp);
    } else {
      inp = this._addInput(this.c.querySelector('.extract'), 'Le nombre manquant');
    }
    this.input = inp;
    inp.addEventListener('input', function () { self.save(); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') self.check(); });
  };

  Sequence.prototype.render = function () {};
  Sequence.prototype.check = function () { this._checkInput(); };
  Sequence.prototype.reset = function () { this.input.value = ''; this.save(); this.status('Réponse effacée.', ''); };
  Sequence.prototype.serialize = function () { return this.input ? this.input.value : ''; };
  Sequence.prototype.deserialize = function (s) { if (this.input) this.input.value = String(s); };

  // jour 6 : chiffre de César
  function Caesar(c) { AnswerBase.call(this, c); }
  Caesar.prototype = Object.create(AnswerBase.prototype);
  Caesar.prototype.constructor = Caesar;

  Caesar.prototype.init = function () {
    var self = this;
    var seq = this.c.querySelector('.bigseq');
    this.words = seq ? seq.textContent.trim().split(/\s+/) : [];
    var wrap = el('div', 'controls');
    wrap.appendChild(el('span', 'ctl-label', 'Clé de décalage (1–25) : '));
    var inp = el('input', 'ans-input');
    inp.type = 'text';
    inp.setAttribute('inputmode', 'numeric');
    inp.maxLength = 2;
    inp.setAttribute('aria-label', 'Clé de décalage de César');
    wrap.appendChild(inp);
    this.decoded = el('p', 'decoded');
    wrap.appendChild(this.decoded);
    var extract = this.c.querySelector('.extract');
    if (extract && extract.parentNode) extract.parentNode.insertBefore(wrap, extract);
    else this.c.appendChild(wrap);
    this.input = inp;
    function show() {
      var k = parseInt(inp.value.replace(/\D/g, ''), 10);
      self.decoded.textContent = k ? self.words.map(function (w) { return rules.caesarDecode(w, k); }).join('  ') : '';
    }
    inp.addEventListener('input', function () { show(); self.save(); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') self.check(); });
  };

  Caesar.prototype.render = function () {};
  Caesar.prototype.check = function () {
    var k = parseInt((this.input.value || '').replace(/\D/g, ''), 10);
    if (k && String(k) === String(this.answer)) { this.solve(k); return; }
    this.status('Cette clé ne décode pas en mots français…', 'err');
  };
  Caesar.prototype.reset = function () { this.input.value = ''; this.decoded.textContent = ''; this.save(); this.status('Clé effacée.', ''); };
  Caesar.prototype.serialize = function () { return this.input ? this.input.value : ''; };
  Caesar.prototype.deserialize = function (s) {
    if (this.input) {
      this.input.value = String(s);
      var k = parseInt(String(s).replace(/\D/g, ''), 10);
      if (k) this.decoded.textContent = this.words.map(function (w) { return rules.caesarDecode(w, k); }).join('  ');
    }
  };

  // jours 4 et 13 : cryptarithme
  function Cryptarithm(c) { AnswerBase.call(this, c); }
  Cryptarithm.prototype = Object.create(AnswerBase.prototype);
  Cryptarithm.prototype.constructor = Cryptarithm;

  Cryptarithm.prototype.init = function () {
    var self = this;
    var crypt = this.c.querySelector('.crypt');
    var crows = crypt.querySelectorAll('.crow');
    this.ops = [];
    this.res = '';
    for (var i = 0; i < crows.length; i++) {
      var t = crows[i].textContent.trim();
      if (crows[i].classList.contains('res')) this.res = t;
      else this.ops.push(t);
    }
    var letters = [];
    var all = this.ops.join('') + this.res;
    for (i = 0; i < all.length; i++) {
      var ch = all.charAt(i);
      if (letters.indexOf(ch) < 0) letters.push(ch);
    }
    this.letters = letters;
    this.assign = {};
    this._inputs = {};
    for (i = 0; i < letters.length; i++) this.assign[letters[i]] = '';
    this.expr = this.c.getAttribute('data-expr');
    var wrap = el('div', 'crypt-assign');
    wrap.setAttribute('aria-label', 'Valeurs des lettres');
    for (i = 0; i < letters.length; i++) {
      (function (L) {
        var lab = el('label', 'crypt-lab', L + ' = ');
        var inp = el('input', 'crypt-in');
        inp.type = 'text';
        inp.setAttribute('inputmode', 'numeric');
        inp.maxLength = 1;
        inp.setAttribute('aria-label', 'valeur de ' + L);
        lab.appendChild(inp);
        wrap.appendChild(lab);
        inp.addEventListener('input', function () {
          self.assign[L] = inp.value.replace(/\D/g, '').slice(0, 1);
          self.validate();
          self.save();
        });
        self._inputs[L] = inp;
      })(letters[i]);
    }
    if (crypt.parentNode) crypt.parentNode.insertBefore(wrap, crypt.nextSibling);
    else this.c.appendChild(wrap);
  };

  Cryptarithm.prototype.render = function () {
    for (var i = 0; i < this.letters.length; i++) {
      var L = this.letters[i];
      if (this._inputs[L]) this._inputs[L].value = this.assign[L];
    }
    this.validate();
  };

  Cryptarithm.prototype.validate = function () {
    var res = rules.cryptCheck(this.ops, this.res, this.assign);
    for (var i = 0; i < this.letters.length; i++) {
      var L = this.letters[i];
      if (this._inputs[L]) {
        this._inputs[L].classList.toggle('cell-err', !res.ok && !res.incomplete);
      }
    }
    if (res.ok) {
      var num;
      if (this.expr) {
        num = 0;
        var parts = this.expr.split('+');
        for (i = 0; i < parts.length; i++) num += parseInt(this.assign[parts[i].trim()] || '0', 10);
      } else {
        num = parseInt(this.answer, 10);
      }
      this.solve(num);
    }
    return res;
  };

  Cryptarithm.prototype.check = function () {
    if (this.c.classList.contains('solved')) { this.status('✓ Déjà résolu.', 'ok'); return; }
    var res = this.validate();
    if (res.ok) return;
    if (res.incomplete) this.status('Toutes les lettres n’ont pas encore de chiffre.', '');
    else if (!res.injective) this.status('Deux lettres ont le même chiffre : interdit.', 'err');
    else if (!res.noLead) this.status('Aucun nombre ne commence par zéro.', 'err');
    else this.status('L’addition ne tombe pas juste.', 'err');
  };

  Cryptarithm.prototype.reset = function () {
    for (var i = 0; i < this.letters.length; i++) this.assign[this.letters[i]] = '';
    this.render(); this.save();
    this.status('Valeurs effacées.', '');
  };

  Cryptarithm.prototype.serialize = function () {
    var self = this;
    return this.letters.map(function (L) { return self.assign[L] || '_'; }).join('');
  };
  Cryptarithm.prototype.deserialize = function (s) {
    s = String(s);
    for (var i = 0; i < this.letters.length && i < s.length; i++) {
      var ch = s.charAt(i);
      this.assign[this.letters[i]] = (ch >= '0' && ch <= '9') ? ch : '';
    }
  };

  // jour 8 : syllogismes
  function Syllogism(c) { AnswerBase.call(this, c); }
  Syllogism.prototype = Object.create(AnswerBase.prototype);
  Syllogism.prototype.constructor = Syllogism;

  Syllogism.prototype.init = function () {
    var self = this;
    var lis = this.c.querySelectorAll('.syllo li');
    this.checks = [];
    this.boxes = [];
    for (var i = 0; i < lis.length; i++) {
      this.checks[i] = false;
      var cb = el('input');
      cb.type = 'checkbox';
      cb.setAttribute('aria-label', 'Raisonnement ' + (i + 1) + ' valide');
      (function (idx, box) {
        box.addEventListener('change', function () {
          self.checks[idx] = box.checked;
          self.save();
        });
      })(i, cb);
      lis[i].insertBefore(cb, lis[i].firstChild);
      lis[i].appendChild(document.createTextNode(' valide ?'));
      this.boxes.push(cb);
    }
  };

  Syllogism.prototype.render = function () {
    for (var i = 0; i < this.boxes.length; i++) this.boxes[i].checked = this.checks[i];
  };

  Syllogism.prototype.check = function () {
    if (this.c.classList.contains('solved')) { this.status('✓ Déjà résolu.', 'ok'); return; }
    var n = 0;
    for (var i = 0; i < this.checks.length; i++) if (this.checks[i]) n++;
    if (String(n) === String(this.answer)) this.solve(n);
    else this.status('Tu as compté ' + n + ' raisonnement(s) valide(s) — ce n’est pas le bon total.', 'err');
  };

  Syllogism.prototype.reset = function () {
    for (var i = 0; i < this.checks.length; i++) { this.checks[i] = false; this.boxes[i].checked = false; }
    this.save();
    this.status('Cases décochées.', '');
  };

  Syllogism.prototype.serialize = function () {
    return this.checks.map(function (b) { return b ? '1' : '0'; }).join('');
  };
  Syllogism.prototype.deserialize = function (s) {
    s = String(s);
    for (var i = 0; i < this.checks.length && i < s.length; i++) this.checks[i] = s.charAt(i) === '1';
  };

  // jour 16 : valises (réponse chiffrée)
  function Zebra(c) { AnswerBase.call(this, c); }
  Zebra.prototype = Object.create(AnswerBase.prototype);
  Zebra.prototype.constructor = Zebra;

  Zebra.prototype.init = function () {
    var self = this;
    var inp = this._addInput(this.c.querySelector('.extract'), 'Ta réponse (un nombre)');
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') self.check(); });
    inp.addEventListener('input', function () { self.save(); });
  };

  Zebra.prototype.render = function () {};
  Zebra.prototype.check = function () { this._checkInput(); };
  Zebra.prototype.reset = function () { this.input.value = ''; this.save(); this.status('Réponse effacée.', ''); };
  Zebra.prototype.serialize = function () { return this.input ? this.input.value : ''; };
  Zebra.prototype.deserialize = function (s) { if (this.input) this.input.value = String(s); };

  // jour 24 : assemblage final
  function Final(c) { Base.call(this, c); }
  Final.prototype = Object.create(Base.prototype);
  Final.prototype.constructor = Final;

  Final.prototype.init = function () {
    var self = this;
    var cells = this.c.querySelectorAll('.fgrid .fcell');
    this.n = cells.length;
    this.inputs = [];
    this.state = [];
    for (var i = 0; i < this.n; i++) {
      var fletter = cells[i].querySelector('.fletter');
      var inp = el('input', 'fletter-in');
      inp.type = 'text';
      inp.maxLength = 1;
      inp.setAttribute('aria-label', 'Lettre ' + (i + 1));
      if (fletter) {
        clearNode(fletter);
        fletter.appendChild(inp);
      }
      this.inputs[i] = inp;
      this.state[i] = '';
      (function (idx, ip) {
        ip.addEventListener('input', function () {
          self.state[idx] = ip.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
          ip.value = self.state[idx];
          self._updatePhrase();
          self.validate();
          self.save();
        });
      })(i, inp);
    }
    var grid = this.c.querySelector('.fgrid');
    this.phrase = el('p', 'final-phrase');
    if (grid && grid.parentNode) grid.parentNode.insertBefore(this.phrase, grid.nextSibling);
    else this.c.appendChild(this.phrase);
    for (var d = 1; d <= 23; d++) {
      var L = sGet('avent:solved:' + d);
      if (L && this.inputs[d - 1]) {
        this.inputs[d - 1].value = L;
        this.state[d - 1] = L;
      }
    }
  };

  Final.prototype._updatePhrase = function () {
    var s = this.state.join('');
    this.phrase.textContent = s ? '« ' + s.split('').join(' ') + ' »' : '';
  };

  Final.prototype.render = function () {
    for (var i = 0; i < this.n; i++) this.inputs[i].value = this.state[i];
    this._updatePhrase();
    this.validate();
  };

  Final.prototype.validate = function () {
    var full = true;
    for (var i = 0; i < this.n; i++) if (this.state[i] === '') full = false;
    if (full && this.n > 0 && this.state[this.n - 1] === (this.letter || '').toUpperCase()) {
      this.solve(parseInt(this.answer, 10));
    }
    return { full: full };
  };

  Final.prototype.check = function () {
    if (this.c.classList.contains('solved')) { this.status('✓ Déjà résolu.', 'ok'); return; }
    var res = this.validate();
    if (res.full && this.state[this.n - 1] === (this.letter || '').toUpperCase()) return;
    var left = 0;
    for (var i = 0; i < this.n; i++) if (this.state[i] === '') left++;
    if (left > 0) this.status('Il reste ' + left + ' lettre(s) à trouver (elles se remplissent seules quand un jour est résolu).', '');
    else this.status('La dernière lettre ne convient pas… relis les 23 premières.', 'err');
  };

  Final.prototype.reset = function () {
    for (var i = 0; i < this.n; i++) { this.state[i] = ''; this.inputs[i].value = ''; }
    this._updatePhrase();
    this.save();
    this.status('Grille vidée (les lettres des jours résolus reviendront au rechargement).', '');
  };

  Final.prototype.serialize = function () { return this.state.join(''); };
  Final.prototype.deserialize = function (s) {
    s = String(s).toUpperCase();
    for (var i = 0; i < this.n && i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch >= 'A' && ch <= 'Z') this.state[i] = ch;
    }
  };

  // ---------- registre ----------
  var engines = {
    binero: Binero,
    skyscraper: Skyscraper,
    nonogram: Nonogram,
    latin: Latin,
    pyramid: Pyramid,
    magic: Magic,
    sequence: Sequence,
    caesar: Caesar,
    cryptarithm: Cryptarithm,
    syllogism: Syllogism,
    zebra: Zebra,
    final: Final
  };

  function mountAll() {
    if (!document.querySelectorAll) return;
    var nodes = document.querySelectorAll('.gated[data-game]');
    for (var i = 0; i < nodes.length; i++) {
      var name = nodes[i].getAttribute('data-game');
      var E = engines[name];
      if (E) {
        try {
          new E(nodes[i]);
        } catch (e) {
          if (typeof console !== 'undefined') console.error('AventGames[' + name + ']', e);
        }
      }
    }
  }

  var api = {
    rules: rules,
    engines: engines,
    mountAll: mountAll,
    numToLetter: numToLetter,
    letterToNum: letterToNum,
    version: '1.0.0'
  };

  if (typeof window !== 'undefined') window.AventGames = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
    else mountAll();
  }
})();
