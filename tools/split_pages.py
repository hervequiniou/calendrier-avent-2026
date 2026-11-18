#!/usr/bin/env python3
"""Génère le site statique à partir du livret HTML imprimable (assets/source/).

Produit : index.html, a-propos.html, solutions.html, jours/1.html … jours/24.html.
Usage : python3 tools/split_pages.py
"""
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "source" / "calendrier-de-l-avent-source.html"
JOURS = ROOT / "jours"
LAST_DAY = 24

SECTION_RE = re.compile(r'<section class="page[^"]*">.*?</section>', re.S)
INNER_RE = re.compile(r'^<section class="page[^"]*">(.*)</section>$', re.S)

HEAD = """<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>@TITLE@</title>
<link rel="stylesheet" href="@ROOT@assets/css/style.css"/>
<script src="@ROOT@assets/js/calendar.js" defer></script>
</head>
<body@BODYATTR@>
<header class="site-head">
<a class="brand" href="@ROOT@index.html">🎄 Calendrier de l&rsquo;Avent</a>
<p class="tagline">Pour M&eacute;lanie, de la part d&rsquo;Herv&eacute; &mdash; &eacute;dition experte</p>
</header>
@MAIN@
<footer class="site-foot">
<p id="today-line"></p>
<p><a href="@ROOT@a-propos.html">Mode d&rsquo;emploi</a> &middot; <a class="foot-sol" href="@ROOT@solutions.html" data-lock-day="24">Solutions</a></p>
</footer>
</body>
</html>
"""

LOCKED_NOTICE = """
<div class="locked-notice" hidden>
<p class="lock-big">&#128274;</p>
<p>Cette page s&rsquo;ouvre le <b class="lock-date"></b> (heure de Paris).</p>
<p><a href="@ROOT@index.html">&larr; Retour au calendrier</a></p>
</div>
"""


def load_sections():
    text = SOURCE.read_text(encoding="utf-8")
    sections = SECTION_RE.findall(text)
    if len(sections) != 29:
        sys.exit(f"ERREUR : 29 sections attendues, {len(sections)} trouvées")
    out = []
    for s in sections:
        m = INNER_RE.match(s.strip())
        if not m:
            sys.exit("ERREUR : section sans balise fermante")
        out.append((s, m.group(1).strip()))
    return out


def day_info(inner_html):
    n = int(re.search(r'<div class="date">(\d+)', inner_html).group(1))
    diff = re.search(r'<div class="diff">([^<]*)</div>', inner_html).group(1)
    stars = "★" * diff.count("&#9733;") + "☆" * diff.count("&#9734;")
    h2 = re.search(r"<h2>(.*?)</h2>", inner_html, re.S).group(1)
    title = html.unescape(re.sub(r"<[^>]+>", "", h2)).strip()
    return n, stars, title


def ordinal(n):
    return "1er" if n == 1 else str(n)


def render_page(title, main, root_prefix, body_attr=""):
    out = HEAD.replace("@ROOT@", root_prefix).replace("@TITLE@", title)
    out = out.replace("@MAIN@", main).replace("@BODYATTR@", body_attr)
    return out


def build_index(sections):
    cover_inner = sections[0][1]
    days = []
    for raw, inner_html in sections[2:26]:
        n, stars, title = day_info(inner_html)
        days.append((n, stars, title))
    days.sort()
    buttons = []
    for n, stars, title in days:
        buttons.append(
            f'<a class="day-btn" data-day="{n}" href="jours/{n}.html" '
            f'title="{html.escape(title, quote=True)}">\n'
            f'<span class="num">{n}</span>\n'
            f'<span class="lbl">{ordinal(n)} d&eacute;c.</span>\n'
            f'<span class="meta"><span class="stars">{stars}</span>'
            f'<span class="state"></span></span>\n</a>'
        )
    main = (
        '<main class="page home">\n'
        f'<div class="cover">{cover_inner}</div>\n'
        '<p class="banner" id="season-banner"></p>\n'
        '<div class="cal-grid">\n' + "\n".join(buttons) + "\n</div>\n"
        '<p class="home-links"><a href="a-propos.html">Comment lire ce calendrier &rarr;</a></p>\n'
        "</main>"
    )
    return render_page("Calendrier de l’Avent — Pour Mélanie", main, "")


def build_about(sections):
    cover_inner = sections[0][1]
    mode_inner = sections[1][1]
    main = (
        '<main class="page about">\n'
        f'<div class="cover">{cover_inner}</div>\n'
        f"{mode_inner}\n"
        '<p class="home-links"><a href="index.html">&larr; Retour au calendrier</a></p>\n'
        "</main>"
    )
    return render_page("Mode d’emploi — Calendrier de l’Avent", main, "")


def build_solutions(sections):
    parts = [sections[i][1] for i in (26, 27, 28)]
    main = (
        '<main class="page solutions">\n'
        + LOCKED_NOTICE.replace("@ROOT@", "")
        + '<div class="gated">\n' + "\n".join(parts) + "\n</div>\n"
        + '<p class="home-links"><a href="index.html">&larr; Retour au calendrier</a></p>\n'
        "</main>"
    )
    return render_page("Solutions — Calendrier de l’Avent", main, "", ' data-lock-day="24"')


def build_day(n, stars, title, inner_html):
    prev_btn = (
        f'<a class="navbtn" data-day="{n - 1}" href="{n - 1}.html">&larr; Jour {n - 1}</a>'
        if n > 1
        else '<span class="navbtn disabled">&larr;</span>'
    )
    next_btn = (
        f'<a class="navbtn" data-day="{n + 1}" href="{n + 1}.html">Jour {n + 1} &rarr;</a>'
        if n < LAST_DAY
        else '<span class="navbtn disabled">&rarr;</span>'
    )
    main = (
        '<main class="page">\n'
        f'<nav class="daynav">{prev_btn}'
        '<a class="navbtn homebtn" href="../index.html">🎄 Calendrier</a>'
        f"{next_btn}</nav>\n"
        + LOCKED_NOTICE.replace("@ROOT@", "../")
        + f'<div class="gated">\n{inner_html}\n</div>\n'
        "</main>"
    )
    return render_page(f"Jour {n} — {title} — Calendrier de l’Avent", main, "../", f' data-day="{n}"')


def main():
    sections = load_sections()
    JOURS.mkdir(exist_ok=True)
    (ROOT / "index.html").write_text(build_index(sections), encoding="utf-8")
    (ROOT / "a-propos.html").write_text(build_about(sections), encoding="utf-8")
    (ROOT / "solutions.html").write_text(build_solutions(sections), encoding="utf-8")
    count = 0
    for raw, inner_html in sections[2:26]:
        n, stars, title = day_info(inner_html)
        (JOURS / f"{n}.html").write_text(build_day(n, stars, title, inner_html), encoding="utf-8")
        count += 1
    print(f"OK : index.html, a-propos.html, solutions.html, {count} pages de jours générées")


if __name__ == "__main__":
    main()
