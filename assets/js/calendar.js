(function () {
  'use strict';

  var TIMEZONE = 'Europe/Paris';
  var LAST_DAY = 24;

  function overrideDate() {
    try {
      var v = new URLSearchParams(window.location.search).get('date');
      if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
        var p = v.split('-');
        var d = { y: +p[0], m: +p[1], d: +p[2] };
        if (d.m >= 1 && d.m <= 12 && d.d >= 1 && d.d <= 31) return d;
      }
    } catch (e) { /* paramètre absent ou invalide : on ignore */ }
    return null;
  }

  function parisToday() {
    var o = overrideDate();
    if (o) return o;
    var parts = new Intl.DateTimeFormat('fr-FR', {
      timeZone: TIMEZONE, year: 'numeric', month: 'numeric', day: 'numeric'
    }).formatToParts(new Date());
    var map = {};
    for (var i = 0; i < parts.length; i++) map[parts[i].type] = parts[i].value;
    return { y: +map.year, m: +map.month, d: +map.day };
  }

  function unlockedDays(t) {
    if (t.m === 12) return Math.min(t.d, LAST_DAY);
    return 0;
  }

  function testMode() {
    try {
      var v = new URLSearchParams(window.location.search).get('test');
      return v !== null && v !== '' && v !== '0' && v.toLowerCase() !== 'false';
    } catch (e) { return false; }
  }

  function propagateTestParam() {
    if (!testMode()) return;
    var raw;
    try { raw = new URLSearchParams(window.location.search).get('test'); } catch (e) { return; }
    if (raw === null) return;
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') continue;
      if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.indexOf('//') === 0) continue;
      var hash = '';
      var hi = href.indexOf('#');
      if (hi >= 0) { hash = href.slice(hi); href = href.slice(0, hi); }
      if (/(?:^|[?&])test=/.test(href)) continue;
      var sep = href.indexOf('?') >= 0 ? '&' : '?';
      a.setAttribute('href', href + sep + 'test=' + encodeURIComponent(raw) + hash);
    }
  }

  function dayLabel(n) {
    return (n === 1 ? '1er' : String(n)) + ' décembre';
  }

  function todayLabel(t) {
    if (overrideDate()) {
      var dt = new Date(Date.UTC(t.y, t.m - 1, t.d, 12));
      return new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }).format(dt);
    }
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: TIMEZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());
  }

  function storageGet(k) {
    try { return window.localStorage.getItem(k); } catch (e) { return null; }
  }

  function storageSet(k, v) {
    try { window.localStorage.setItem(k, v); } catch (e) { /* navigation privée */ }
  }

  function init() {
    var t = parisToday();
    var unlocked = testMode() ? LAST_DAY : unlockedDays(t);
    propagateTestParam();
    var pageDay = parseInt(document.body.getAttribute('data-day') || '0', 10);
    var lockDay = parseInt(document.body.getAttribute('data-lock-day') || '0', 10);

    var todayLine = document.getElementById('today-line');
    if (todayLine) todayLine.textContent = 'Aujourd’hui (heure de Paris) : ' + todayLabel(t) + '.';

    var gate = pageDay || lockDay;
    if (gate && gate > unlocked) {
      var gated = document.querySelector('.gated');
      var notice = document.querySelector('.locked-notice');
      if (gated) gated.hidden = true;
      if (notice) {
        notice.hidden = false;
        var ld = notice.querySelector('.lock-date');
        if (ld) ld.textContent = dayLabel(gate);
      }
    }

    if (pageDay && pageDay <= unlocked) storageSet('avent:visited:' + pageDay, '1');

    var dayLinks = document.querySelectorAll('a[data-day]');
    for (var i = 0; i < dayLinks.length; i++) {
      (function (el) {
        var n = parseInt(el.getAttribute('data-day'), 10);
        var state = el.querySelector('.state');
        if (n <= unlocked) {
          el.classList.add('open');
          if (n === unlocked && t.m === 12 && t.d <= LAST_DAY) {
            el.classList.add('today');
            if (state) state.textContent = 'Aujourd’hui !';
          } else if (state && storageGet('avent:solved:' + n)) {
            state.textContent = '\u2605';
          } else if (state && storageGet('avent:visited:' + n) === '1') {
            state.textContent = '✓';
          }
        } else {
          el.classList.add('locked');
          el.removeAttribute('href');
          el.setAttribute('aria-disabled', 'true');
          el.title = 'S’ouvre le ' + dayLabel(n);
          if (state) state.textContent = '🔒';
          else el.textContent = '🔒 ' + el.textContent;
        }
      })(dayLinks[i]);
    }

    var lockLinks = document.querySelectorAll('a[data-lock-day]');
    for (var j = 0; j < lockLinks.length; j++) {
      (function (el) {
        var n = parseInt(el.getAttribute('data-lock-day'), 10);
        if (n > unlocked) {
          el.hidden = true;
          el.removeAttribute('href');
        }
      })(lockLinks[j]);
    }

    var banner = document.getElementById('season-banner');
    if (banner) {
      if (testMode()) {
        banner.textContent = '🧪 Mode test (?test=1) : les 24 cases sont ouvertes, quelle que soit la date.';
      } else if (unlocked === 0) {
        banner.textContent = '🎄 Rendez-vous le 1er décembre : les cases s’ouvriront une par une, jour après jour (heure de Paris).';
      } else if (unlocked < LAST_DAY) {
        banner.textContent = '🎁 Case du jour : ' + dayLabel(unlocked) + ' — encore ' + (LAST_DAY - unlocked) + ' case(s) à découvrir.';
      } else {
        banner.textContent = '🎉 Les 24 cases sont ouvertes. Joyeux Noël, Mélanie !';
      }
    }
  }

  window.AventCalendar = {
    TIMEZONE: TIMEZONE,
    parisToday: parisToday,
    unlockedDays: unlockedDays,
    testMode: testMode,
    propagateTestParam: propagateTestParam,
    dayLabel: dayLabel
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})();
