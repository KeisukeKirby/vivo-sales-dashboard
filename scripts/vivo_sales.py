"""Vivo の販売実績 (BFT / EDV の受注明細) を集計用データ src/vivo.json に変換する。

Vivo 販売ダッシュボード (src/vivo.html → site/index.html) が読むデータ。

使い方:
    python scripts/vivo_sales.py data/sales_raw/vivo_BFT.xlsx data/sales_raw/vivo_EDV.xlsx [data/manual/*.csv ...]

    引数は「BFT の受注明細」「EDV の受注明細」の順 (POS の Orders シート、order_detail_*.xlsx と同じ形式)。
    受注明細は顧客情報を含むため data/sales_raw/ (Git 管理外) に置く。
    vivo.json には顧客情報を入れない (日付・会社・販売場所・注文番号・商品・数量・金額のみ)。

    3 つ目以降には、受注明細の Excel がまだない日の実績を手入力した CSV を渡せる (data/manual/、レシートの読み取りなど)。
    列: date (YYYY-MM-DD), company (BFT / EDV), warehouse (Event 1 など受注明細の Warehouse/Branch), product_name
        (受注明細と同じ「Vivo <モデル>(<サイズ>, <カラー>)」), qty, amount (明細値引き後の金額)
    同じ会社・日付の明細が Excel にあれば CSV の行は使わない (Excel が正。二重に数えない)。

集計ルール:
  - Category が Vivo の明細行のみ
  - 支払い状態 (Payment status) が Paid の行のみ (Status が Pending でも Paid なら実績に含める)。取消 (Voided) は除外
  - 販売場所 = Warehouse/Branch。会社ごとに別の場所として扱い、LOC_NAMES の名前を付ける
      (EDV の Kvillage → K Village、EDV の Event 1 → K Village PopUp、BFT の Event 1 → Terminal21 Asok)
      Event で始まる → イベント / 空欄・Online・คลังสินค้าหลัก (本社倉庫) → オンライン・その他 / それ以外 → 店舗
  - モデル・カラー・サイズは商品名「Vivo <モデル>(<サイズ>, <カラー>)」から取る
    (商品コードの番号は BFT と EDV で別のモデルを指すことがあるため使わない。表記ゆれは大文字小文字をそろえる)
  - 金額 = 明細の Total amount (明細ごとの値引き後、注文全体の値引きは含まない)
"""
import csv
import datetime
import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "vivo.json"

UPPER = {"ii", "iii", "iv", "fg", "ii", "v"}
SIZE_RE = re.compile(r"^[MW]\d+(?:\.\d+)?$")
ONLINE = {"", "online", "คลังสินค้าหลัก"}
WH_LABEL = {"Kvillage": "K Village", "คลังสินค้าหลัก": "Main warehouse"}
# 会社 + Warehouse/Branch → 画面に出す販売場所の名前。
# Event 1 / Event 2 は会社ごと・時期ごとに別の会場なので、新しいイベントの明細を取り込むときはここを更新する。
LOC_NAMES = {
    ("EDV", "Kvillage"): "K Village",
    ("EDV", "Event 1"): "K Village PopUp",
    ("BFT", "Event 1"): "Terminal21 Asok",
}


def title(s):
    words = []
    for w in s.split():
        if w.lower() in UPPER:
            words.append(w.upper())
        elif "/" in w:
            words.append("/".join(p[:1].upper() + p[1:].lower() for p in w.split("/")))
        else:
            words.append(w[:1].upper() + w[1:].lower())
    return " ".join(words)


def parse_name(name):
    m = re.match(r"^\s*(.*?)\s*\(([^()]*)\)\s*$", name)
    if not m:
        return title(re.sub(r"^vivo\s+", "", name, flags=re.I)), "", ""
    model = title(re.sub(r"^vivo\s+", "", m.group(1), flags=re.I))
    size, color = "", ""
    for p in (x.strip() for x in m.group(2).split(",")):
        if SIZE_RE.match(p):
            size = p
        elif p:
            color = title(p)
    return model, color, size


def loc_type(wh):
    if wh.lower().startswith("event"):
        return "event"
    if wh.lower() in ONLINE:
        return "online"
    return "store"


def num(v):
    if v in (None, ""):
        return 0.0
    return float(str(v).replace(",", ""))


def read(path, company, locs, out):
    ws = openpyxl.load_workbook(path, data_only=True, read_only=True).worksheets[0]
    rows = ws.iter_rows(values_only=True)
    next(rows)  # 1 行目はグループ見出し (Orders / Payments / Product data)
    head = next(rows)
    ix = {h: i for i, h in enumerate(head) if h}
    n = voided = unpaid = 0
    for r in rows:
        if (r[ix["Category"]] or "") != "Vivo":
            continue
        status = r[ix["Status"]] or ""
        if status == "Voided":
            voided += 1
            continue
        if (r[ix["Payment status"]] or "") != "Paid":
            unpaid += 1
            continue
        wh = (r[ix["Warehouse/Branch"]] or "").strip()
        lid = add_loc(locs, company, wh)
        d = datetime.datetime.strptime(str(r[ix["Date"]]).strip(), "%d/%m/%Y").date().isoformat()
        model, color, size = parse_name(str(r[ix["Product name"]] or ""))
        out.append([d, lid, str(r[ix["Sales order No."]] or ""), model, color, size,
                    int(num(r[ix["Quantity"]])), round(num(r[ix["Total amount"]]), 2)])
        n += 1
    print(f"{company}: {n} 行 (取消 {voided} 行・未払い {unpaid} 行を除外) ← {Path(path).name}")


def add_loc(locs, company, wh):
    lid = f"{company}:{wh}"
    if lid not in locs:
        locs[lid] = {"id": lid, "company": company, "type": loc_type(wh), "wh": wh,
                     "name": LOC_NAMES.get((company, wh), WH_LABEL.get(wh, wh))}
    return lid


def read_manual(path, locs, out):
    """手入力の CSV (受注明細がまだない日の実績)。Excel に同じ会社・日付があれば使わない。"""
    have = {(locs[x[1]]["company"], x[0]) for x in out}
    n = skipped = 0
    with open(path, encoding="utf-8-sig", newline="") as f:
        for i, r in enumerate(csv.DictReader(f)):
            company, d = r["company"].strip(), r["date"].strip()
            datetime.date.fromisoformat(d)
            if (company, d) in have:
                skipped += 1
                continue
            lid = add_loc(locs, company, r["warehouse"].strip())
            model, color, size = parse_name(r["product_name"])
            out.append([d, lid, f"manual:{Path(path).stem}:{i + 1}", model, color, size, int(r["qty"]), round(float(r["amount"]), 2)])
            n += 1
    note = f" (受注明細にある日付の {skipped} 行は使わない)" if skipped else ""
    print(f"手入力: {n} 行{note} ← {Path(path).name}")


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    locs, lines = {}, []
    read(sys.argv[1], "BFT", locs, lines)
    read(sys.argv[2], "EDV", locs, lines)
    for p in sys.argv[3:]:
        read_manual(p, locs, lines)
    lines.sort()
    rank = {k: i for i, k in enumerate(LOC_NAMES)}
    data = {
        "generated": datetime.datetime.now().isoformat(timespec="seconds"),
        "sources": {"BFT": Path(sys.argv[1]).name, "EDV": Path(sys.argv[2]).name,
                    "manual": [Path(p).name for p in sys.argv[3:]]},
        "from": lines[0][0],
        "to": lines[-1][0],
        # LOC_NAMES に書いた順 → その他の場所 → オンライン・その他
        "locations": sorted(locs.values(), key=lambda l: (
            l["type"] == "online", rank.get((l["company"], l["wh"]), len(rank)), l["company"], l["name"])),
        "fields": ["date", "loc", "order", "model", "color", "size", "qty", "amount"],
        "lines": lines,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    for l in data["locations"]:
        q = sum(x[6] for x in lines if x[1] == l["id"])
        print(f"  {l['company']} {l['type']:6} {l['wh'] or '(空欄)'} → {l['name'] or 'オンライン・その他'}: {q} 足")
    print(f"合計 {sum(x[6] for x in lines)} 足 ({data['from']} 〜 {data['to']}) → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
