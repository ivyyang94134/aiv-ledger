# 愛V記帳（Web 版 · Supabase 後端）

純前端記帳網頁（React + Babel，免 build），資料存 **Supabase**（Postgres），支援 **Email 登入 + 多裝置同步**。
可放任何靜態主機（GitHub Pages / Netlify / Vercel），不需要 Google Apps Script。

## 🌐 已上線
- **網址**：https://ivyyang94134.github.io/aiv-ledger/
- **GitHub repo**：https://github.com/ivyyang94134/aiv-ledger （Public）
- **Supabase 專案**：cxbszxaiffhyuzqbxzpt（6 張表 + RLS 已建好並驗證）

### 之後要修改怎麼更新？
改本資料夾的檔案 → 到 repo 網頁「Add file → Upload files」上傳覆蓋並 Commit（或用 git push）→ 約 1~2 分鐘網站自動更新，同一個網址。

---

## 一、設定 Supabase

### 1. 建立資料表 ✅（已完成）
6 張表（accounts / categories / projects / tags / transactions / prefs）與 Row Level Security 已於 2026-05-31 由 Claude 透過瀏覽器建立並驗證通過。
（若日後要重建：SQL Editor 貼上 `schema.sql` → Run。）

### 2. 開啟 Email 登入、關閉「Email 確認」（讓註冊立即可用）
1. 左側 **Authentication → Providers → Email** → 確認是 **Enabled**
2. 左側 **Authentication → Sign In / Providers**（或 Settings）→ 找到 **Confirm email** → **關閉**
   - 關閉後：註冊完直接就能用，不必收確認信（個人使用最方便）
   - 若你想保留確認信，留著也可以，但註冊後要先去信箱點連結才能登入

> 連線金鑰已經填在 `config.js`（你的 Project URL + anon public key）。anon key 放前端是正常且安全的，真正的資料保護靠上面的 RLS。

---

## 二、部署到 GitHub Pages（免費）

1. 在 GitHub 建一個新的 repo（例如 `aiv-ledger`），可設 Public 或 Private
2. 把這個資料夾**所有檔案**上傳（push）到 repo
3. repo → **Settings → Pages** → Source 選 **Deploy from a branch** → 分支選 `main`、資料夾選 `/ (root)` → Save
4. 等 1–2 分鐘，會給你一個網址：`https://你的帳號.github.io/aiv-ledger/`
5. 打開網址 → 註冊 / 登入 → 開始記帳！

> 第一次登入後，系統會自動幫你的帳號建立一組範例資料（帳戶 / 類別 / 交易），可在側欄「重設資料」清空重來。

### 用 git 指令上傳（範例）
```bash
cd aiv-ledger-web
git init
git add .
git commit -m "愛V記帳 web 版"
git branch -M main
git remote add origin https://github.com/你的帳號/aiv-ledger.git
git push -u origin main
```

---

## 三、檔案結構

| 檔案 | 用途 |
|---|---|
| `index.html` | 進入點，載入函式庫與各模組 |
| `config.js` | Supabase URL + anon key |
| `supabase-init.js` | 建立 Supabase client |
| `store.js` | 狀態管理 + 與 Supabase 讀寫（含登入後載入、種子資料） |
| `app.jsx` | 登入畫面 + 應用外殼（導覽 / Modal / 登出） |
| `ui.jsx` | Icon / Modal / useStore 等共用元件 |
| `TxnForm.jsx` | 記帳表單 |
| `Dashboard.jsx` / `Transactions.jsx` / `Accounts.jsx` | 三個主頁面 |
| `ThemePicker.jsx` | 外觀設定 |
| `themes.js` | 主題引擎 |
| `styles.css` / `app.css` | 樣式 |
| `schema.sql` | Supabase 建表 SQL |

---

## 四、功能
- Email 註冊 / 登入 / 登出，多裝置以同帳號同步
- 總覽（淨資產 / 本月收支 / 支出分析 / 近期交易）
- 交易（月份切換 / 篩選 / 搜尋 / 分日列表 / 編輯）
- 帳戶（新增 / 編輯 / 刪除 / 轉帳 / 多幣別換算）
- 記帳表單（5 種類型 / 外幣即時換算 / 手續費折扣 / 專案 / 標籤 / 收據圖片）
- 7 種主色 × 3 種背景 × 2 種字體，即時套用並雲端記住

> 註：收據圖片目前以 base64 直接存進資料庫（限 800KB/張），個人使用足夠；未來要省空間可改接 Supabase Storage。
