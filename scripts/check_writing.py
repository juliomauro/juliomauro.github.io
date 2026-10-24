#!/usr/bin/env python3
"""
Cross-checks every post registered in writing/index.html's ART_KEY against
the other places a post has to be registered by hand: the standalone page,
the i18n title/desc keys (en/pt/tlh), sitemap.xml, feed.xml, the og/ image,
and the matching file in the sibling sec-notes repo.

Run before publishing a new post, or whenever something "isn't showing up".
Exits non-zero if anything is missing.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEC_NOTES = ROOT.parent / "sec-notes"

def fail(msgs):
    for m in msgs:
        print(f"  MISSING: {m}")

def main():
    html = (ROOT / "writing" / "index.html").read_text(encoding="utf-8")

    art_key_block = re.search(r"const ART_KEY = \{(.*?)\};", html, re.S).group(1)
    pairs = re.findall(r"'([^']+\.md)':\s*'([^']+)'", art_key_block)

    i18n_titles = set(re.findall(r"'title-([a-z0-9]+)':", html))
    i18n_descs = set(re.findall(r"'desc-([a-z0-9]+)':", html))
    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    feed = (ROOT / "feed.xml").read_text(encoding="utf-8") if (ROOT / "feed.xml").exists() else ""

    ok = True
    for path, slug in pairs:
        problems = []

        standalone = ROOT / "writing" / slug / "index.html"
        if not standalone.exists():
            problems.append(f"standalone page writing/{slug}/index.html")

        if slug not in i18n_titles:
            problems.append(f"i18n title-{slug} key")
        if slug not in i18n_descs:
            problems.append(f"i18n desc-{slug} key")

        if f"/writing/{slug}/" not in sitemap:
            problems.append(f"sitemap.xml entry for /writing/{slug}/")

        if feed and f"/writing/{slug}/" not in feed:
            problems.append(f"feed.xml entry for /writing/{slug}/")

        if not (ROOT / "og" / f"{slug}.png").exists():
            problems.append(f"og/{slug}.png")

        sec_note = SEC_NOTES / path
        if SEC_NOTES.exists() and not sec_note.exists():
            problems.append(f"sec-notes/{path}")

        if problems:
            ok = False
            print(f"[{slug}]")
            fail(problems)

    if ok:
        print(f"All {len(pairs)} posts consistent across index.html, sitemap, feed, og/, and sec-notes.")
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
