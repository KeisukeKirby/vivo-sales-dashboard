/* Vivo 販売ダッシュボード。データは vivo.json (scripts/vivo_sales.py で受注明細から作成) */
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const COS = ["BFT", "EDV"];
  // 販売場所の色 (vivo.json の locations の順に --s1, --s2, ...)
  let SLOT = {};
  const sw = (id) => `<i class="sw" style="background:var(--s${(SLOT[id] ?? 0) + 1})"></i>`;

  /* ---------- 言語 (在庫ダッシュボードと同じ localStorage "lang") ---------- */
  const DICT = {
    ja: {
      "doc.title": "Vivo 販売ダッシュボード",
      h1: "Vivo 販売実績",
      loading: "読み込み中…",
      "link.stock": "← 在庫ダッシュボード",
      "lang.aria": "言語",
      "theme.aria": "表示テーマの切り替え",
      "theme.auto": "自動", "theme.light": "ライト", "theme.dark": "ダーク",
      "f.aria": "絞り込み",
      "f.company": "会社",
      "f.from": "開始日",
      "f.to": "終了日",
      "f.model": "モデル",
      "f.loc": "販売場所",
      "f.locHint": "（複数選択可・数字は足数）",
      all: "すべて",
      "all.models": "すべてのモデル",
      "all.locs": "すべての場所",
      reset: "条件をリセット",
      "loc.online": "オンライン・その他 (LINE 等)",
      "loc.onlineShort": "オンライン",
      "kpi.qty": "販売数量（足）",
      "m.title": "モデル別の販売数量",
      "m.hint": "モデル名をクリックすると、カラー × サイズの内訳を表示",
      "m.pairs": "足数",
      "m.share": "構成比",
      "m.models": "{n} モデル",
      "m.amount": "売上 ฿{a}",
      "t.title": "カラー・サイズ別の明細",
      "t.items": "{n} 品目",
      "t.model": "モデル", "t.color": "カラー", "t.size": "サイズ", "t.total": "合計", "t.amount": "金額 (฿)",
      "t.sum": "合計",
      csv: "CSV で保存",
      copy: "表をコピー",
      copied: "コピーしました",
      empty: "条件に合う販売がありません",
      pairs: "{n} 足",
      period: "期間: {f} 〜 {t}",
      src: "元データ: BFT {b} / EDV {e}",
      foot: "受注明細の Category が Vivo で、支払い状態が Paid の行を集計（Pending でも Paid なら含む。取消 Voided は除外）。販売場所は EDV の Kvillage = K Village、EDV の Event 1 = K Village PopUp、BFT の Event 1 = Terminal21 Asok、倉庫が空欄の注文（LINE 等）= オンライン・その他。モデル・カラー・サイズは商品名から判定しています。データ作成: {d}",
    },
    en: {
      "doc.title": "Vivo Sales Dashboard",
      h1: "Vivo sales",
      loading: "Loading…",
      "link.stock": "← Stock dashboard",
      "lang.aria": "Language",
      "theme.aria": "Toggle theme",
      "theme.auto": "Auto", "theme.light": "Light", "theme.dark": "Dark",
      "f.aria": "Filters",
      "f.company": "Company",
      "f.from": "From",
      "f.to": "To",
      "f.model": "Model",
      "f.loc": "Sales location",
      "f.locHint": "(multiple allowed; numbers are pairs)",
      all: "All",
      "all.models": "All models",
      "all.locs": "All locations",
      reset: "Reset filters",
      "loc.online": "Online / other (LINE etc.)",
      "loc.onlineShort": "Online",
      "kpi.qty": "Pairs sold",
      "m.title": "Pairs sold by model",
      "m.hint": "Click a model to see its pairs by colour and size",
      "m.pairs": "Pairs",
      "m.share": "Share",
      "m.models": "{n} models",
      "m.amount": "Sales ฿{a}",
      "t.title": "Detail by colour and size",
      "t.items": "{n} items",
      "t.model": "Model", "t.color": "Colour", "t.size": "Size", "t.total": "Total", "t.amount": "Amount (฿)",
      "t.sum": "Total",
      csv: "Save CSV",
      copy: "Copy table",
      copied: "Copied",
      empty: "No sales match the filters",
      pairs: "{n} pairs",
      period: "Period: {f} – {t}",
      src: "Source: BFT {b} / EDV {e}",
      foot: "Order-detail lines with Category = Vivo and payment status Paid (pending orders count once paid; voided orders excluded). Locations: EDV Kvillage = K Village, EDV Event 1 = K Village PopUp, BFT Event 1 = Terminal21 Asok, orders with no branch (LINE etc.) = Online / other. Model, colour and size are read from the product name. Generated: {d}",
    },
    th: {
      "doc.title": "แดชบอร์ดยอดขาย Vivo",
      h1: "ยอดขาย Vivo",
      loading: "กำลังโหลด…",
      "link.stock": "← แดชบอร์ดสต็อก",
      "lang.aria": "ภาษา",
      "theme.aria": "สลับธีม",
      "theme.auto": "อัตโนมัติ", "theme.light": "สว่าง", "theme.dark": "มืด",
      "f.aria": "ตัวกรอง",
      "f.company": "บริษัท",
      "f.from": "ตั้งแต่",
      "f.to": "ถึง",
      "f.model": "รุ่น",
      "f.loc": "จุดขาย",
      "f.locHint": "(เลือกได้หลายจุด ตัวเลขคือจำนวนคู่)",
      all: "ทั้งหมด",
      "all.models": "ทุกรุ่น",
      "all.locs": "ทุกจุดขาย",
      reset: "ล้างตัวกรอง",
      "loc.online": "ออนไลน์ / อื่นๆ (LINE ฯลฯ)",
      "loc.onlineShort": "ออนไลน์",
      "kpi.qty": "จำนวนที่ขาย (คู่)",
      "m.title": "จำนวนที่ขายตามรุ่น",
      "m.hint": "คลิกที่รุ่นเพื่อดูจำนวนตามสีและไซซ์",
      "m.pairs": "คู่",
      "m.share": "สัดส่วน",
      "m.models": "{n} รุ่น",
      "m.amount": "ยอดขาย ฿{a}",
      "t.title": "รายละเอียดตามสีและไซซ์",
      "t.items": "{n} รายการ",
      "t.model": "รุ่น", "t.color": "สี", "t.size": "ไซซ์", "t.total": "รวม", "t.amount": "ยอดเงิน (฿)",
      "t.sum": "รวม",
      csv: "บันทึก CSV",
      copy: "คัดลอกตาราง",
      copied: "คัดลอกแล้ว",
      empty: "ไม่มียอดขายที่ตรงกับเงื่อนไข",
      pairs: "{n} คู่",
      period: "ช่วงเวลา: {f} – {t}",
      src: "ข้อมูล: BFT {b} / EDV {e}",
      foot: "รวมรายการที่ Category = Vivo และสถานะการชำระเงินเป็น Paid จากรายละเอียดคำสั่งซื้อ (Pending ที่ชำระแล้วนับรวม ไม่รวมรายการที่ยกเลิก Voided) จุดขาย: EDV Kvillage = K Village, EDV Event 1 = K Village PopUp, BFT Event 1 = Terminal21 Asok, คำสั่งซื้อที่ไม่มีสาขา (LINE ฯลฯ) = ออนไลน์ / อื่นๆ รุ่น สี และไซซ์อ่านจากชื่อสินค้า สร้างข้อมูล: {d}",
    },
  };
  const LOCALE = { ja: "ja-JP", en: "en-GB", th: "th-TH" };
  let lang = null;
  try { lang = localStorage.getItem("lang"); } catch (_) {}
  if (!DICT[lang]) {
    const nav = (navigator.languages || [navigator.language || ""]).map((l) => l.slice(0, 2).toLowerCase());
    lang = nav.find((l) => DICT[l]) || "en";
  }
  const t = (k, p = {}) => (DICT[lang][k] ?? DICT.en[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => p[x] ?? `{${x}}`);
  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t("doc.title");
    document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === lang));
  }
  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
    lang = b.dataset.lang;
    try { localStorage.setItem("lang", lang); } catch (_) {}
    applyLang();
    applyTheme();
    if (data) { fillModels(); render(); }
  }));

  /* ---------- テーマ (在庫ダッシュボードと同じ localStorage "theme") ---------- */
  const THEMES = ["auto", "light", "dark"];
  let theme = "auto";
  try { theme = localStorage.getItem("theme") || "auto"; } catch (_) {}
  function applyTheme() {
    if (!$("themeToggle")) return;
    if (theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
    if ($("themeLabel")) $("themeLabel").textContent = t(`theme.${theme}`);
  }
  // 単体版 (公開ページ) ではテーマ切り替えボタンがなく、閲覧画面のテーマに従う
  if ($("themeToggle")) $("themeToggle").addEventListener("click", () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    try { localStorage.setItem("theme", theme); } catch (_) {}
    applyTheme();
  });
  applyLang();
  applyTheme();

  /* ---------- データ ---------- */
  let data = null;
  let LOC = {};          // id -> location
  let lines = [];        // {date, loc, co, type, order, model, color, size, qty, amount}
  const state = { company: "", locs: new Set(), from: "", to: "", model: "" };
  let sort = { key: "total", dir: -1 };
  const openModels = new Set();  // 内訳を開いているモデル

  const locName = (l) => (l.type === "online" && !l.name ? t("loc.online") : l.name);
  const locLabelHtml = (l) => `<span class="co">${l.company}</span>${esc(locName(l))}`;
  const shortLoc = (l) => (l.type === "online" && !l.name ? t("loc.onlineShort") : l.name.replace("Terminal21 Asok", "Terminal21").replace("K Village PopUp", "PopUp"));
  const locLabelText = (l) => `${l.company} ${locName(l)}`;
  const sizeKey = (s) => { const m = /^([A-Z]+)(\d+(?:\.\d+)?)$/.exec(s); return m ? [m[1], +m[2]] : [s, 0]; };
  const bySize = (a, b) => { const x = sizeKey(a), y = sizeKey(b); return x[0] < y[0] ? 1 : x[0] > y[0] ? -1 : x[1] - y[1]; }; // W → M の順
  const fmtDate = (iso, long) => {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString(LOCALE[lang], long ? { year: "numeric", month: "short", day: "numeric" } : { month: "numeric", day: "numeric" });
  };

  // 場所の候補 (会社・種類で絞ったもの)
  const availLocs = () => data.locations.filter((l) => (!state.company || l.company === state.company));
  const activeLocIds = () => {
    const av = availLocs().map((l) => l.id);
    const sel = av.filter((id) => state.locs.has(id));
    return new Set(sel.length ? sel : av);
  };

  // loc 以外の条件
  const passBase = (r) => (!state.from || r.date >= state.from) && (!state.to || r.date <= state.to) && (!state.model || r.model === state.model);

  /* ---------- フィルター UI ---------- */
  function syncSeg(id, v) { $(id).querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === v)); }
  $("segCompany").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    state.company = b.dataset.v; render();
  });
  $("locChips").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.id === "") state.locs.clear();
    else if (state.locs.has(b.dataset.id)) state.locs.delete(b.dataset.id);
    else state.locs.add(b.dataset.id);
    render();
  });
  $("dFrom").addEventListener("change", (e) => { state.from = e.target.value; render(); });
  $("dTo").addEventListener("change", (e) => { state.to = e.target.value; render(); });
  $("fModel").addEventListener("change", (e) => { state.model = e.target.value; render(); });
  $("reset").addEventListener("click", () => {
    Object.assign(state, { company: "", from: data.from, to: data.to, model: "" });
    state.locs.clear();
    $("dFrom").value = data.from; $("dTo").value = data.to;
    render();
  });

  function fillModels() {
    const models = [...new Set(lines.map((r) => r.model))].sort();
    $("fModel").innerHTML = `<option value="">${esc(t("all.models"))}</option>` + models.map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join("");
    $("fModel").value = state.model;
  }

  function renderLocChips() {
    const av = availLocs();
    const qty = {};
    lines.forEach((r) => { if (passBase(r)) qty[r.loc] = (qty[r.loc] || 0) + r.qty; });
    const anySel = av.some((l) => state.locs.has(l.id));
    $("locChips").innerHTML =
      `<button type="button" class="loc-chip all" data-id="" aria-pressed="${!anySel}">${esc(t("all.locs"))}</button>` +
      av.map((l) => `<button type="button" class="loc-chip" data-id="${esc(l.id)}" aria-pressed="${state.locs.has(l.id)}">` +
        `${sw(l.id)}${esc(locName(l))}<span class="n">${fmt(qty[l.id] || 0)}</span></button>`).join("");
  }

  /* ---------- モデル別の販売数量 (このダッシュボードの主役) ---------- */
  function renderModels(rows) {
    const m = new Map();
    rows.forEach((r) => {
      let g = m.get(r.model);
      if (!g) m.set(r.model, (g = { model: r.model, qty: 0, by: {} }));
      g.qty += r.qty; g.by[r.loc] = (g.by[r.loc] || 0) + r.qty;
    });
    const list = [...m.values()].sort((a, b) => b.qty - a.qty || a.model.localeCompare(b.model));
    const total = list.reduce((s, g) => s + g.qty, 0);
    // 販売のある販売場所ごとに色分けし、足数の列を出す (1 か所だけなら列は出さない)
    const locs = data.locations.filter((l) => rows.some((r) => r.loc === l.id));
    const cols = locs.length > 1 ? locs : [];
    $("modelList").style.setProperty("--co-cols", cols.length);
    if (!list.length) { $("modelList").innerHTML = `<p class="empty-note">${esc(t("empty"))}</p>`; return; }
    const max = list[0].qty;
    const head = `<div class="mrow mhead" aria-hidden="true"><span></span><span>${esc(t("t.model"))}</span><span></span>` +
      cols.map((l) => `<span class="mnum co-h" title="${esc(locName(l))}">${sw(l.id)}${esc(shortLoc(l))}</span>`).join("") +
      `<span class="mnum">${esc(t("m.pairs"))}</span><span class="mnum mshare">${esc(t("m.share"))}</span></div>`;
    $("modelList").innerHTML = head + list.map((g, i) => {
      const segs = locs.filter((l) => g.by[l.id] > 0)
        .map((l) => `<span class="mfill" style="width:${(g.by[l.id] / max) * 100}%;background:var(--s${SLOT[l.id] + 1})" title="${esc(locName(l))}: ${g.by[l.id]}"></span>`).join("");
      const open = openModels.has(g.model);
      return `<button type="button" class="mrow${open ? " open" : ""}${state.model === g.model ? " active" : ""}" data-model="${esc(g.model)}" aria-expanded="${open}">` +
        `<span class="mrank">${i + 1}</span><span class="mname"><span class="mchev" aria-hidden="true"></span>${esc(g.model)}</span>` +
        `<span class="mbar">${segs}</span>` +
        cols.map((l) => `<span class="mnum co-n">${g.by[l.id] ? fmt(g.by[l.id]) : "-"}</span>`).join("") +
        `<span class="mnum mqty">${fmt(g.qty)}</span><span class="mnum mshare">${Math.round((g.qty / total) * 100)}%</span></button>` +
        (open ? modelDetail(rows.filter((r) => r.model === g.model)) : "");
    }).join("");
    $("modelList").querySelectorAll(".mrow[data-model]").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.model;
      if (openModels.has(k)) openModels.delete(k); else openModels.add(k);
      renderModels(rows);
    }));
  }

  // モデルの内訳: カラー × サイズの足数 (行の合計 = カラー別、列の合計 = サイズ別)
  function modelDetail(rows) {
    const colors = new Map(), sizes = new Map(), cell = new Map();
    rows.forEach((r) => {
      const c = r.color || "-", z = r.size || "-";
      colors.set(c, (colors.get(c) || 0) + r.qty);
      sizes.set(z, (sizes.get(z) || 0) + r.qty);
      cell.set(`${c}\t${z}`, (cell.get(`${c}\t${z}`) || 0) + r.qty);
    });
    const cs = [...colors.keys()].sort((a, b) => colors.get(b) - colors.get(a) || a.localeCompare(b));
    const zs = [...sizes.keys()].sort(bySize);
    const total = rows.reduce((s, r) => s + r.qty, 0);
    const max = Math.max(...cell.values());
    const td = (v) => (v ? `<td class="num" style="--h:${Math.round((v / max) * 100)}%">${fmt(v)}</td>` : `<td class="num zero"></td>`);
    return `<div class="mdetail"><div class="mmatrix-wrap"><table class="mmatrix">` +
      `<thead><tr><th>${esc(t("t.color"))} / ${esc(t("t.size"))}</th>${zs.map((z) => `<th class="num">${esc(z)}</th>`).join("")}<th class="num">${esc(t("t.total"))}</th></tr></thead>` +
      `<tbody>${cs.map((c) => `<tr><th>${esc(c)}</th>${zs.map((z) => td(cell.get(`${c}\t${z}`) || 0)).join("")}<td class="num tot">${fmt(colors.get(c))}</td></tr>`).join("")}</tbody>` +
      `<tfoot><tr><th>${esc(t("t.total"))}</th>${zs.map((z) => `<td class="num">${fmt(sizes.get(z))}</td>`).join("")}<td class="num tot">${fmt(total)}</td></tr></tfoot>` +
      `</table></div></div>`;
  }

  /* ---------- 描画 ---------- */
  let current = [];
  function render() {
    syncSeg("segCompany", state.company);
    renderLocChips();
    const locIds = activeLocIds();
    const base = lines.filter((r) => (!state.from || r.date >= state.from) && (!state.to || r.date <= state.to) && locIds.has(r.loc));
    const rows = base.filter((r) => !state.model || r.model === state.model);
    current = rows;

    // 合計 (モデル一覧はモデルの絞り込みに関係なく全モデルを出し、選んだモデルを強調する)
    const qty = base.reduce((s, r) => s + r.qty, 0);
    const amt = base.reduce((s, r) => s + r.amount, 0);
    const models = new Set(base.map((r) => r.model)).size;
    $("kQty").textContent = fmt(qty);
    $("kQtyNote").innerHTML = (state.company ? [state.company] : COS)
      .map((c) => `<span class="co-split">${c} ${fmt(base.reduce((s, r) => s + (r.co === c ? r.qty : 0), 0))}</span>`).join("") +
      `<span class="co-split">${esc(t("m.models", { n: models }))}</span><span class="co-split">${esc(t("m.amount", { a: fmt(amt) }))}</span>`;
    renderModels(base);

    renderTable(rows, locIds);
    $("tTitleModel").textContent = state.model ? `: ${state.model}` : "";

    $("period").textContent = t("period", { f: fmtDate(data.from, true), t: fmtDate(data.to, true) });
    $("source").textContent = t("src", { b: data.sources.BFT, e: data.sources.EDV });
    $("foot").textContent = t("foot", { d: data.generated.replace("T", " ").slice(0, 16) });
  }

  /* ---------- 明細表 (モデル × カラー × サイズ、販売場所ごとの列) ---------- */
  let tableCache = null;
  function renderTable(rows, locIds) {
    const locs = data.locations.filter((l) => locIds.has(l.id) && rows.some((r) => r.loc === l.id));
    const m = new Map();
    rows.forEach((r) => {
      const k = `${r.model}\t${r.color}\t${r.size}`;
      let g = m.get(k);
      if (!g) m.set(k, (g = { model: r.model, color: r.color, size: r.size, total: 0, amount: 0, by: {} }));
      g.total += r.qty; g.amount += r.amount; g.by[r.loc] = (g.by[r.loc] || 0) + r.qty;
    });
    const items = [...m.values()];
    const cols = [
      { key: "model", label: t("t.model") },
      { key: "color", label: t("t.color") },
      { key: "size", label: t("t.size") },
      ...locs.map((l) => ({ key: `loc:${l.id}`, label: locLabelText(l), loc: l, num: true })),
      { key: "total", label: t("t.total"), num: true },
      { key: "amount", label: t("t.amount"), num: true },
    ];
    if (!cols.some((c) => c.key === sort.key)) sort = { key: "total", dir: -1 };
    const val = (it, key) => (key.startsWith("loc:") ? it.by[key.slice(4)] || 0 : it[key]);
    items.sort((a, b) => {
      let d;
      if (sort.key === "size") d = bySize(a.size, b.size);
      else { const x = val(a, sort.key), y = val(b, sort.key); d = typeof x === "number" ? x - y : String(x).localeCompare(String(y)); }
      return d * sort.dir || b.total - a.total || a.model.localeCompare(b.model) || bySize(a.size, b.size);
    });
    tableCache = { cols, items, val };

    $("tCount").textContent = t("t.items", { n: items.length });
    $("tHead").innerHTML = `<tr>${cols.map((c) => `<th class="${c.num ? "num" : ""}" data-key="${esc(c.key)}"${sort.key === c.key ? ` aria-sort="${sort.dir > 0 ? "ascending" : "descending"}"` : ""}>` +
      `${c.loc ? sw(c.loc.id) : ""}${esc(c.label)}</th>`).join("")}</tr>`;
    $("tBody").innerHTML = items.length
      ? items.map((it) => `<tr>${cols.map((c) => {
        const v = val(it, c.key);
        if (!c.num) return `<td>${esc(v)}</td>`;
        return `<td class="num${v ? "" : " zero"}">${v ? fmt(v) : "-"}</td>`;
      }).join("")}</tr>`).join("")
      : `<tr><td colspan="${cols.length}" class="empty-note">${esc(t("empty"))}</td></tr>`;
    $("tFoot").innerHTML = items.length ? `<tr>${cols.map((c, i) => {
      if (i === 0) return `<td>${esc(t("t.sum"))}</td>`;
      if (!c.num) return "<td></td>";
      return `<td class="num">${fmt(items.reduce((s, it) => s + val(it, c.key), 0))}</td>`;
    }).join("")}</tr>` : "";
  }
  $("tHead").addEventListener("click", (e) => {
    const th = e.target.closest("th"); if (!th) return;
    const k = th.dataset.key;
    sort = sort.key === k ? { key: k, dir: -sort.dir } : { key: k, dir: ["model", "color", "size"].includes(k) ? 1 : -1 };
    renderTable(current, activeLocIds());
  });
  // 表をタブ区切りでコピー (Excel・スプレッドシートにそのまま貼り付けできる)
  $("copyTable").addEventListener("click", () => {
    if (!tableCache) return;
    const { cols, items, val } = tableCache;
    const tsv = [cols.map((c) => c.label).join("\t"), ...items.map((it) => cols.map((c) => (c.num ? Math.round(val(it, c.key) * 100) / 100 : val(it, c.key))).join("\t"))].join("\n");
    const done = () => { $("copyTable").textContent = t("copied"); setTimeout(() => ($("copyTable").textContent = t("copy")), 1600); };
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = tsv; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (_) {}
      ta.remove();
    };
    if (navigator.clipboard) navigator.clipboard.writeText(tsv).then(done, fallback); else fallback();
  });
  if ($("dlCsv")) $("dlCsv").addEventListener("click", () => {
    if (!tableCache) return;
    const { cols, items, val } = tableCache;
    const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const csv = [cols.map((c) => q(c.label)).join(","), ...items.map((it) => cols.map((c) => (c.num ? Math.round(val(it, c.key) * 100) / 100 : q(val(it, c.key)))).join(","))].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
    a.download = `vivo_sales_${state.from || data.from}_${state.to || data.to}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  // 単体版は window.VIVO_DATA にデータを埋め込む
  (window.VIVO_DATA ? Promise.resolve(window.VIVO_DATA) : fetch("vivo.json", { cache: "no-store" }).then((r) => r.json()))
    .then((d) => {
      data = d;
      LOC = Object.fromEntries(d.locations.map((l) => [l.id, l]));
      SLOT = Object.fromEntries(d.locations.map((l, i) => [l.id, i % 6]));
      const ix = Object.fromEntries(d.fields.map((f, i) => [f, i]));
      lines = d.lines.map((x) => {
        const l = LOC[x[ix.loc]];
        return { date: x[ix.date], loc: l.id, co: l.company, type: l.type, order: x[ix.order], model: x[ix.model], color: x[ix.color],
          size: x[ix.size], qty: x[ix.qty], amount: x[ix.amount] };
      });
      state.from = d.from; state.to = d.to;
      $("dFrom").value = d.from; $("dTo").value = d.to;
      $("dFrom").min = $("dTo").min = d.from; $("dFrom").max = $("dTo").max = d.to;
      fillModels();
      render();
    })
    .catch(() => { $("period").textContent = "vivo.json could not be loaded"; });
})();
