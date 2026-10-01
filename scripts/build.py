"""Vivo 販売ダッシュボードを 1 つの HTML ファイル (データ・CSS・JS を埋め込み) にまとめる。

Vercel が配信する site/index.html を作る。

使い方:
    python scripts/build.py                    # -> site/index.html (Vercel 用)
    python scripts/build.py OUT.html --bare    # claude.ai の Artifact 用 (<html>/<head> なし)

src/vivo.html・style.css・vivo.css・vivo.js・vivo.json を読み、
テーマ切り替え (閲覧画面のテーマに従う)・CSV 保存ボタンを外す (表は「表をコピー」で Excel に貼り付け)。
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "src"


def main():
    args = [a for a in sys.argv[1:] if a != "--bare"]
    if len(args) > 1:
        sys.exit(__doc__)
    out_path = Path(args[0]) if args else ROOT / "site" / "index.html"
    full = "--bare" not in sys.argv
    html = (PUB / "vivo.html").read_text(encoding="utf-8")
    body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
    body = re.sub(r"\s*<script[^>]*></script>", "", body)
    body = re.sub(r'\s*<button id="themeToggle".*?</button>', "", body, flags=re.S)
    body = re.sub(r'\s*<button id="dlCsv"[^>]*></button>', "", body)
    css = (PUB / "style.css").read_text(encoding="utf-8") + "\n" + (PUB / "vivo.css").read_text(encoding="utf-8")
    data = (PUB / "vivo.json").read_text(encoding="utf-8").replace("</", "<\\/")
    js = (PUB / "vivo.js").read_text(encoding="utf-8")
    out = (
        "<title>Vivo Sales Dashboard</title>\n"
        f"<style>\n{css}\n</style>\n"
        f"{body.strip()}\n"
        f"<script>window.VIVO_DATA = {data};</script>\n"
        f"<script>\n{js}\n</script>\n"
    )
    if full:
        # Vercel で配信する完全な HTML 文書 (<title> と <style> は <head> に入れる)
        head, rest = out.split("</style>\n", 1)
        out = (
            '<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            f'<meta name="robots" content="noindex">\n{head}</style>\n</head>\n<body>\n{rest}</body>\n</html>\n'
        )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(out, encoding="utf-8")
    print(f"{out_path} ({len(out.encode()) // 1024} KB)")


if __name__ == "__main__":
    main()
