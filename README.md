# Vivo 販売ダッシュボード

BFT と EDV の POS 受注明細から作る、Vivo の販売実績ダッシュボードです。Vercel が `site/index.html` を配信します（ビルド不要）。

- 合計の販売数量・売上金額・注文数・平均販売単価（BFT / EDV の内訳つき）
- **会社**（すべて / BFT / EDV）、**販売場所の種類**（店舗 / イベント / オンライン・その他）、**販売場所**（複数選択）、期間、モデルで絞り込み
- BFT のイベントと EDV のイベントは、同じ「Event 1」でも別の販売場所として扱う
- 日別・販売場所別・モデル別・サイズ別・カラー別のグラフと、商品別（モデル × カラー × サイズ）× 販売場所の表（「表をコピー」で Excel に貼り付け）
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

- Category が Vivo の明細行のみ。取消 (Voided) は除外、Pending は含む（画面のチェックで除外可）
- 販売場所 = Warehouse/Branch（Event〜 → イベント、空欄・Online・本社倉庫 → オンライン・その他、それ以外 → 店舗）
- モデル・カラー・サイズは商品名から判定（商品コードの番号は BFT と EDV で別のモデルを指すことがあるため使わない）
- 金額 = 明細の Total amount（明細値引き後、注文全体の値引きは含まない）
- `src/vivo.json` と `site/index.html` には顧客情報を含めない

## ローカルで確認

```bash
cd src && python3 -m http.server 8000   # http://localhost:8000/vivo.html
# または site/index.html をブラウザで直接開く
```
