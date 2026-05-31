/* store.js — 愛V記帳 狀態管理（Supabase 後端版）
   - 登入後 Store.init() 從 Supabase 載入該使用者所有資料
   - 所有異動樂觀更新記憶體 + 通知畫面，再非同步寫回 Supabase
   - 對外 API 與原版一致，React 元件零修改 */
(function () {
  var FX = { TWD: 1, USD: 32.1, JPY: 0.205, EUR: 34.8, CNY: 4.42 };
  var SYMBOL = { TWD: "NT$", USD: "$", JPY: "¥", EUR: "€", CNY: "¥" };
  var rate = function (from, to) { return (FX[from] || 1) / (FX[to] || 1); };
  var uid = function (p) { return p + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); };
  function sb() { return window.__sb; }

  var userId = null;
  var state = { accounts: [], categories: [], projects: [], tags: [], transactions: [], prefs: { accent: "blue", surface: "warm", font: "round" } };
  var listeners = new Set();
  function commit(next) { state = next; listeners.forEach(function (fn) { fn(state); }); }

  function showError(msg) {
    try {
      var el = document.getElementById("__aiv_toast");
      if (!el) {
        el = document.createElement("div");
        el.id = "__aiv_toast";
        el.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#E5564E;color:#fff;padding:12px 20px;border-radius:999px;font-size:14px;font-weight:600;box-shadow:0 12px 30px -10px rgba(0,0,0,.4);z-index:9999;max-width:90vw;transition:opacity .3s;";
        document.body.appendChild(el);
      }
      el.textContent = msg; el.style.opacity = "1";
      clearTimeout(el.__t); el.__t = setTimeout(function () { el.style.opacity = "0"; }, 3500);
    } catch (e) {}
  }
  function fail(ctx) { return function (res) { if (res && res.error) showError("同步失敗（" + ctx + "）：" + res.error.message); }; }

  // ---- 欄位整理：空字串→null、數字轉型，符合 Postgres 型別 ----
  function dbTxn(t) {
    var o = Object.assign({}, t);
    delete o.user_id;
    ["dueDate", "settledDate", "toAccountId", "categoryId", "projectId", "recurringId", "installmentId", "imageUrl", "name", "merchant", "note"].forEach(function (k) {
      if (o[k] === "" || o[k] === undefined) o[k] = null;
    });
    o.periodNo = (o.periodNo === "" || o.periodNo == null) ? null : Number(o.periodNo);
    ["amount", "fee", "discount", "exchangeRate"].forEach(function (k) { o[k] = Number(o[k]) || (k === "exchangeRate" ? 1 : 0); });
    if (!Array.isArray(o.tags)) o.tags = [];
    return o;
  }
  function dbAccount(a) { var o = Object.assign({}, a); delete o.user_id; o.initial = Number(o.initial) || 0; return o; }

  function normalizeTxn(d) {
    var out = Object.assign({}, d);
    ["amount", "fee", "discount"].forEach(function (k) { if (out[k] != null) out[k] = Number(out[k]) || 0; });
    return out;
  }
  function mkTxn(t) {
    return Object.assign({
      id: uid("t"), currency: t.currency || "TWD", exchangeRate: 1, fee: 0, discount: 0, name: "", note: "",
      imageUrl: null, projectId: "", toAccountId: null, categoryId: null,
      tags: [], dueDate: null, isSettled: false, settledDate: null, recurringId: "", installmentId: "",
      periodNo: null, createdAt: new Date().toISOString()
    }, t);
  }

  // ---- 餘額推導（與原版一致）----
  function accCur(accId) { var a = state.accounts.find(function (x) { return x.id === accId; }); return a ? a.currency : "TWD"; }
  function balances() {
    var bal = {};
    state.accounts.forEach(function (a) { bal[a.id] = Number(a.initial) || 0; });
    state.transactions.forEach(function (t) {
      var amt = Number(t.amount) || 0, fee = Number(t.fee) || 0, disc = Number(t.discount) || 0;
      if (t.type === "EXPENSE" || (t.type === "PAYABLE" && t.isSettled)) {
        if (bal[t.accountId] != null) bal[t.accountId] -= (amt + fee - disc) * rate(t.currency, accCur(t.accountId));
      } else if (t.type === "INCOME" || (t.type === "RECEIVABLE" && t.isSettled)) {
        if (bal[t.accountId] != null) bal[t.accountId] += (amt - fee) * rate(t.currency, accCur(t.accountId));
      } else if (t.type === "TRANSFER") {
        if (bal[t.accountId] != null) bal[t.accountId] -= (amt + fee) * rate(t.currency, accCur(t.accountId));
        if (t.toAccountId && bal[t.toAccountId] != null) bal[t.toAccountId] += amt * rate(t.currency, accCur(t.toAccountId));
      }
    });
    return bal;
  }
  function netWorthTWD() { var bal = balances(); return state.accounts.reduce(function (s, a) { return s + (bal[a.id] || 0) * rate(a.currency, "TWD"); }, 0); }

  // ---- 載入全部 ----
  async function loadAll() {
    var r = await Promise.all([
      sb().from("accounts").select("*").order("createdAt", { ascending: true }),
      sb().from("categories").select("*"),
      sb().from("projects").select("*"),
      sb().from("tags").select("*"),
      sb().from("transactions").select("*").order("date", { ascending: false }),
      sb().from("prefs").select("*").maybeSingle()
    ]);
    for (var i = 0; i < 5; i++) { if (r[i].error) throw r[i].error; }
    var p = (r[5] && r[5].data) || {};
    return {
      accounts: r[0].data || [],
      categories: r[1].data || [],
      projects: r[2].data || [],
      tags: (r[3].data || []).map(function (t) { return t.name; }),
      transactions: r[4].data || [],
      prefs: { accent: p.accent || "blue", surface: p.surface || "warm", font: p.font || "round" }
    };
  }

  // 空白初始化：帳戶 / 交易 / 專案皆為空，僅建立一組標準「類別」與「標籤」
  // 作為記帳時的分類工具（App 目前無新增類別的介面，故保留這組選項）。
  async function seed() {
    var categories = [
      { id: "c1", name: "餐飲", icon: "food", color: "#E5564E", type: "EXPENSE", sortOrder: 0 },
      { id: "c2", name: "交通", icon: "transport", color: "#6C5CE7", type: "EXPENSE", sortOrder: 0 },
      { id: "c3", name: "購物", icon: "shopping", color: "#E08A1E", type: "EXPENSE", sortOrder: 0 },
      { id: "c4", name: "居家", icon: "home", color: "#1FA971", type: "EXPENSE", sortOrder: 0 },
      { id: "c5", name: "娛樂", icon: "entertain", color: "#0E9AA7", type: "EXPENSE", sortOrder: 0 },
      { id: "c6", name: "醫療", icon: "health", color: "#1F6FEB", type: "EXPENSE", sortOrder: 0 },
      { id: "c7", name: "訂閱", icon: "bolt", color: "#9A5BE7", type: "EXPENSE", sortOrder: 0 },
      { id: "i1", name: "薪資", icon: "salary", color: "#1FA971", type: "INCOME", sortOrder: 0 },
      { id: "i2", name: "獎金", icon: "gift", color: "#E08A1E", type: "INCOME", sortOrder: 0 },
      { id: "i3", name: "投資", icon: "invest", color: "#1F6FEB", type: "INCOME", sortOrder: 0 }
    ];
    var tags = ["可報帳", "固定支出", "聚餐", "禮物", "訂閱"].map(function (n) { return { name: n }; });
    await sb().from("categories").insert(categories);
    await sb().from("tags").insert(tags);
    await sb().from("prefs").upsert({ user_id: userId, accent: "blue", surface: "warm", font: "round" });
  }

  async function init() {
    var u = (await sb().auth.getUser()).data.user;
    userId = u ? u.id : null;
    var data = await loadAll();
    if (!data.accounts.length && !data.categories.length && !data.transactions.length) {
      await seed();
      data = await loadAll();
    }
    commit(data);
    return data;
  }

  var Store = {
    FX: FX, SYMBOL: SYMBOL, rate: rate,
    init: init,
    getUserEmail: function () { return (state.__email) || ""; },
    getState: function () { return state; },
    getPrefs: function () { return state.prefs; },
    subscribe: function (fn) { listeners.add(fn); return function () { listeners.delete(fn); }; },

    setPref: function (patch) {
      var prefs = Object.assign({}, state.prefs, patch);
      commit(Object.assign({}, state, { prefs: prefs }));
      sb().from("prefs").upsert(Object.assign({ user_id: userId }, prefs)).then(fail("主題"));
    },
    reset: async function () {
      try {
        await Promise.all(["transactions", "accounts", "categories", "projects", "tags"].map(function (t) { return sb().from(t).delete().eq("user_id", userId); }));
        await sb().from("prefs").delete().eq("user_id", userId);
        await seed();
        commit(await loadAll());
      } catch (e) { showError("重設失敗：" + (e.message || e)); }
    },

    balances: balances, netWorthTWD: netWorthTWD, accCur: accCur,
    fmt: function (amount, currency, signed) {
      currency = currency || "TWD";
      var zeroDec = currency === "TWD" || currency === "JPY" || currency === "CNY";
      var n = Math.round((Number(amount) || 0) * 100) / 100;
      var s = (SYMBOL[currency] || "") + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: zeroDec ? 0 : 2 });
      if (!signed) return s;
      return (n > 0 ? "+" : n < 0 ? "-" : "") + s;
    },

    addTxn: function (data) {
      var t = mkTxn(normalizeTxn(data));
      commit(Object.assign({}, state, { transactions: [t].concat(state.transactions) }));
      sb().from("transactions").insert(dbTxn(t)).then(fail("新增交易"));
      return t;
    },
    updateTxn: function (id, data) {
      var merged = null;
      var txns = state.transactions.map(function (t) { if (t.id === id) { merged = Object.assign({}, t, normalizeTxn(data)); return merged; } return t; });
      commit(Object.assign({}, state, { transactions: txns }));
      if (merged) { var row = dbTxn(merged); delete row.id; sb().from("transactions").update(row).eq("id", id).then(fail("更新交易")); }
    },
    deleteTxn: function (id) {
      commit(Object.assign({}, state, { transactions: state.transactions.filter(function (t) { return t.id !== id; }) }));
      sb().from("transactions").delete().eq("id", id).then(fail("刪除交易"));
    },
    settleTxn: function (id) {
      var merged = null;
      var txns = state.transactions.map(function (t) { if (t.id === id) { merged = Object.assign({}, t, { isSettled: true, settledDate: new Date().toISOString() }); return merged; } return t; });
      commit(Object.assign({}, state, { transactions: txns }));
      if (merged) sb().from("transactions").update({ isSettled: true, settledDate: merged.settledDate }).eq("id", id).then(fail("結清"));
    },

    addAccount: function (a) {
      var acc = Object.assign({ id: uid("a"), currency: "TWD", initial: 0, type: "BANK", icon: "wallet", color: "#1F6FEB", createdAt: new Date().toISOString() }, a);
      acc.initial = Number(acc.initial) || 0;
      commit(Object.assign({}, state, { accounts: state.accounts.concat([acc]) }));
      sb().from("accounts").insert(dbAccount(acc)).then(fail("新增帳戶"));
    },
    updateAccount: function (id, patch) {
      var merged = null;
      var accs = state.accounts.map(function (a) { if (a.id === id) { merged = Object.assign({}, a, patch, { initial: patch.initial != null ? Number(patch.initial) : a.initial }); return merged; } return a; });
      commit(Object.assign({}, state, { accounts: accs }));
      if (merged) { var row = dbAccount(merged); delete row.id; sb().from("accounts").update(row).eq("id", id).then(fail("更新帳戶")); }
    },
    deleteAccount: function (id) {
      commit(Object.assign({}, state, {
        accounts: state.accounts.filter(function (a) { return a.id !== id; }),
        transactions: state.transactions.filter(function (t) { return t.accountId !== id && t.toAccountId !== id; })
      }));
      sb().from("transactions").delete().or("accountId.eq." + id + ",toAccountId.eq." + id).then(function () {
        sb().from("accounts").delete().eq("id", id).then(fail("刪除帳戶"));
      });
    },

    addCategory: function (c) {
      var cat = Object.assign({ id: uid("c"), icon: "tag", color: "#0E9AA7", type: "EXPENSE", sortOrder: 0 }, c);
      commit(Object.assign({}, state, { categories: state.categories.concat([cat]) }));
      sb().from("categories").insert(cat).then(fail("新增類別"));
    },
    deleteCategory: function (id) {
      commit(Object.assign({}, state, { categories: state.categories.filter(function (c) { return c.id !== id; }) }));
      sb().from("categories").delete().eq("id", id).then(fail("刪除類別"));
    }
  };

  window.Store = Store;
})();
