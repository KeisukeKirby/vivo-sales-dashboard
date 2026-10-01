# Vivo 販売ダッシュボード

BFT と EDV の POS 受注明細から作る、Vivo の販売実績ダッシュボードです。Vercel が `site/index.html` を配信します（ビルド不要）。

- **モデル別の販売数量**（多い順。販売場所ごとに色分けした内訳・構成比つき）と合計の販売数量。色は K Village = 青、K Village PopUp = オレンジ、Terminal21 Asok = 緑、オンライン = 黄（`src/vivo.css` の `--s1`〜）
- **会社**（すべて / BFT / EDV）、**販売場所**（K Village / K Village PopUp / Terminal21 Asok / オンライン・その他、複数選択可）、期間、モデルで絞り込み
- モデル名をクリックすると、その下にカラー × サイズの足数（行の合計 = カラー別、列の合計 = サイズ別）を表示。もう一度クリックで閉じる
- 下の表はモデル × カラー × サイズ × 販売場所の明細（「表をコピー」で Excel に貼り付け）
- 日本語 / English / ไทย、ライト / ダーク表示

## 構成

```
site/index.html        # Vercel が配信するページ (scripts/build.py が生成。直接編集しない)
src/                   # ページの元ファイル (vivo.html, vivo.js, vivo.css, style.css) と集計データ vivo.json
scripts/vivo_sales.py  # 受注明細 (Excel) → src/vivo.json
scripts/build.py       # src/ → site/index.html (データ・CSS・JS を 1 ファイルに埋め込み)
data/sales_raw/        # 受注明細の置き場 (顧客情報を含むため Git 管理外)
vercel.json            # Output Directory: site
```

## データの更新手順

1. POS の受注明細（Orders シートの Excel）を `data/sales_raw/` に置く
2. 変換とビルド

   ```bash
   pip install openpyxl
   python scripts/vivo_sales.py data/sales_raw/vivo_BFT.xlsx data/sales_raw/vivo_EDV.xlsx   # 引数は BFT, EDV の順
   python scripts/build.py
   ```

3. `git add . && git commit -m "Vivo 販売データ更新" && git push` — Vercel が自動で再デプロイします

## 集計ルール

- Category が Vivo の明細行のうち、支払い状態 (Payment status) が Paid のもの。Status が Pending でも Paid なら実績に含める。取消 (Voided) は除外
- 販売場所 = 会社 + Warehouse/Branch。名前は `scripts/vivo_sales.py` の `LOC_NAMES` で付ける
  （EDV の Kvillage → K Village、EDV の Event 1 → K Village PopUp、BFT の Event 1 → Terminal21 Asok、倉庫が空欄 → オンライン・その他）。
  Event 1 / Event 2 は時期によって別の会場になるので、新しいイベントの明細を取り込むときは `LOC_NAMES` を更新する
- モデル・カラー・サイズは商品名から判定（商品コードの番号は BFT と EDV で別のモデルを指すことがあるため使わない）
- 金額 = 明細の Total amount（明細値引き後、注文全体の値引きは含まない）
- `src/vivo.json` と `site/index.html` には顧客情報を含めない

## ローカルで確認

```bash
cd src && python3 -m http.server 8000   # http://localhost:8000/vivo.html
# または site/index.html をブラウザで直接開く
```
