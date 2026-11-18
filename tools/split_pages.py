#!/usr/bin/env python3
"""Génère le site statique à partir du livret HTML imprimable (assets/source/).

Produit : index.html, a-propos.html, solutions.html, jours/1.html … jours/24.html.
Usage : python3 tools/split_pages.py
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "source" / "calendrier-de-l-avent-source.html"
JOURS = ROOT / "jours"
LAST_DAY = 24

SECTION_RE = re.compile(r'<section class="page[^"]*">.*?</section>', re.S)
INNER_RE = re.compile(r'^<section class="page[^"]*">(.*)</section>$', re.S)

KEY_RE = re.compile(r'<tr><td>(\d+)</td><td>(\d+)</td><td>([A-Z])</td></tr>')
SOLITEM_RE = re.compile(r'<div class="solitem"><h3>Jour (\d+) &mdash; ([^<]*)</h3>(.*?)</div>', re.S)
SC_RE = re.compile(r'<td class="sc">([^<]*)</td>')

CRYPT_EXPR = {4: "L+A+T+T+E", 13: "S+E+N"}


def detect_game(inner_html):
    if 'class="bgrid"' in inner_html:
        return "binero"
    if 'class="sgrid"' in inner_html:
        return "skyscraper"
    if 'class="ngrid"' in inner_html:
        return "nonogram"
    if 'class="lgrid"' in inner_html:
        return "latin"
    if 'class="pyr"' in inner_html:
        return "pyramid"
    if 'class="mgrid"' in inner_html:
        return "magic"
    if 'class="crypt"' in inner_html:
        return "cryptarithm"
    if 'class="syllo"' in inner_html:
        return "syllogism"
    if 'class="fgrid"' in inner_html:
        return "final"
    if 'class="bigseq"' in inner_html:
        if "C&eacute;sar" in inner_html or "César" in inner_html:
            return "caesar"
        return "sequence"
    return "zebra"


def parse_answers(section_html):
    out = {}
    for m in KEY_RE.finditer(section_html):
        out[int(m.group(1))] = (m.group(2), m.group(3))
    return out


def parse_solutions(section_html):
    out = {}
    for m in SOLITEM_RE.finditer(section_html):
        day = int(m.group(1))
        body = m.group(3)
        scs = SC_RE.findall(body)
        if scs:
            out[day] = "".join(scs)
        else:
            text = re.sub(r"<[^>]+>", "", body)
            text = re.sub(r"&nbsp;?", " ", text)
            out[day] = "".join(ch for ch in text if ch in "#.0-9A-Za-z")
    return out


def parse_latin_values(inner_html):
    vals = {}
    for m in re.finditer(r"([A-Z]) \([^)]*\) = (\d+)", inner_html):
        vals[m.group(1)] = m.group(2)
    return vals


def game_attrs(n, inner_html, answers, solutions):
    game = detect_game(inner_html)
    num, letter = answers.get(n, ("", ""))
    attrs = {"data-game": game, "data-answer": num, "data-letter": letter}
    if n in solutions:
        attrs["data-solution"] = solutions[n]
    if game == "latin":
        attrs["data-values"] = json.dumps(parse_latin_values(inner_html))
    if game == "cryptarithm" and n in CRYPT_EXPR:
        attrs["data-expr"] = CRYPT_EXPR[n]
    return game, attrs


def attrs_str(attrs):
    return "".join(
        f' {k}="{html.escape(str(v), quote=True)}"' for k, v in attrs.items()
    )

HEAD = """<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>@TITLE@</title>
<link rel="stylesheet" href="@ROOT@assets/css/style.css"/>
<script src="@ROOT@assets/js/calendar.js" defer></script>
<script src="@ROOT@assets/js/games.js" defer></script>
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


def build_day(n, stars, title, inner_html, attrs):
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
        + f'<div class="gated"{attrs_str(attrs)}>\n{inner_html}\n</div>\n'
        "</main>"
    )
    return render_page(f"Jour {n} — {title} — Calendrier de l’Avent", main, "../", f' data-day="{n}"')


def main():
    sections = load_sections()
    answers = parse_answers(sections[26][1])
    solutions = parse_solutions(sections[27][1])
    if len(answers) != LAST_DAY:
        sys.exit(f"ERREUR : {LAST_DAY} reponses attendues, {len(answers)} trouvees")
    JOURS.mkdir(exist_ok=True)
    (ROOT / "index.html").write_text(build_index(sections), encoding="utf-8")
    (ROOT / "a-propos.html").write_text(build_about(sections), encoding="utf-8")
    (ROOT / "solutions.html").write_text(build_solutions(sections), encoding="utf-8")
    count = 0
    games = []
    for raw, inner_html in sections[2:26]:
        n, stars, title = day_info(inner_html)
        game, attrs = game_attrs(n, inner_html, answers, solutions)
        if not attrs["data-answer"]:
            sys.exit(f"ERREUR : pas de reponse pour le jour {n}")
        (JOURS / f"{n}.html").write_text(build_day(n, stars, title, inner_html, attrs), encoding="utf-8")
        games.append(f"{n}:{game}")
        count += 1
    print("Jeux : " + " ".join(games))
    print(f"OK : index.html, a-propos.html, solutions.html, {count} pages de jours générées")


if __name__ == "__main__":
    main()
