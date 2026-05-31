/* Transactions.jsx — 交易明細 */
const { useState: useStateTx, useMemo: useMemoTx } = React;
const { Icon: IconTx, useStore: useStoreTx, TxnList: TxnListTx } = window;

const TX_FILTERS = [
  { id: "ALL", label: "全部" }, { id: "EXPENSE", label: "支出" }, { id: "INCOME", label: "收入" },
  { id: "TRANSFER", label: "轉帳" }, { id: "RECEIVABLE", label: "應收" }, { id: "PAYABLE", label: "應付" },
];

function dayLabel(d) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dd = new Date(d); dd.setHours(0, 0, 0, 0);
  const diff = Math.round((today - dd) / 86400000);
  if (diff === 0) return "今天";
  if (diff === 1) return "昨天";
  return dd.toLocaleDateString("zh-TW", { month: "long", day: "numeric", weekday: "short" });
}

function Transactions({ onAdd, onEdit }) {
  const Store = useStoreTx();
  const st = Store.getState();
  const accMap = Object.fromEntries(st.accounts.map(a => [a.id, a]));
  const catMap = Object.fromEntries(st.categories.map(c => [c.id, c]));

  const [filter, setFilter] = useStateTx("ALL");
  const [acc, setAcc] = useStateTx("ALL");
  const [q, setQ] = useStateTx("");
  const [month, setMonth] = useStateTx(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });

  const shiftMonth = (delta) => setMonth(({ y, m }) => { const d = new Date(y, m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  const { groups, count, income, expense } = useMemoTx(() => {
    const start = new Date(month.y, month.m, 1), end = new Date(month.y, month.m + 1, 1);
    let list = st.transactions.filter(t => { const d = new Date(t.date); return d >= start && d < end; });
    if (filter !== "ALL") list = list.filter(t => t.type === filter);
    if (acc !== "ALL") list = list.filter(t => t.accountId === acc || t.toAccountId === acc);
    if (q.trim()) {
      const k = q.trim().toLowerCase();
      list = list.filter(t => (t.merchant || "").toLowerCase().includes(k) || (t.note || "").toLowerCase().includes(k) || (catMap[t.categoryId]?.name || "").includes(k));
    }
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    let inc = 0, exp = 0;
    list.forEach(t => { const twd = (Number(t.amount) || 0) * Store.rate(t.currency, "TWD"); if (t.type === "INCOME") inc += twd; if (t.type === "EXPENSE") exp += twd; });
    const g = {};
    list.forEach(t => { const key = new Date(t.date).toDateString(); (g[key] = g[key] || []).push(t); });
    return { groups: Object.entries(g), count: list.length, income: inc, expense: exp };
  }, [st, filter, acc, q, month]);

  const monthLabel = new Date(month.y, month.m, 1).toLocaleDateString("zh-TW", { year: "numeric", month: "long" });

  return (
    <div className="page">
      <div className="page__head">
        <div><div className="page__eyebrow">共 {count} 筆 · 收 {Store.fmt(income, "TWD")} · 支 {Store.fmt(expense, "TWD")}</div><h1 className="page__title">交易明細</h1></div>
        <button className="addbtn" onClick={() => onAdd()}><IconTx name="plus" />記一筆</button>
      </div>

      <div className="monthnav">
        <button className="monthnav__btn" onClick={() => shiftMonth(-1)} aria-label="上個月"><IconTx name="chevron" style={{ transform: "rotate(90deg)" }} /></button>
        <span className="monthnav__label">{monthLabel}</span>
        <button className="monthnav__btn" onClick={() => shiftMonth(1)} aria-label="下個月"><IconTx name="chevron" style={{ transform: "rotate(-90deg)" }} /></button>
      </div>

      <div className="filters">
        <div className="search">
          <IconTx name="api" style={{ width: 16, height: 16, color: "var(--ink-3)" }} />
          <input placeholder="搜尋商家、備註、類別…" value={q} onChange={e => setQ(e.target.value)} />
          {q && <button onClick={() => setQ("")} aria-label="清除"><IconTx name="close" style={{ width: 14, height: 14 }} /></button>}
        </div>
        <div className="fchips">
          {TX_FILTERS.map(f => (
            <button key={f.id} className="fchip" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
        <select className="control control--inline" value={acc} onChange={e => setAcc(e.target.value)}>
          <option value="ALL">所有帳戶</option>
          {st.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {groups.length === 0 ? (
        <div className="empty">
          <div className="empty__ic"><IconTx name="note" /></div>
          <h3>這個月還沒有交易</h3>
          <p>點「記一筆」開始記錄你的收支吧。</p>
          <button className="addbtn" onClick={() => onAdd()}><IconTx name="plus" />記一筆</button>
        </div>
      ) : (
        <div className="day-groups">
          {groups.map(([key, items]) => {
            const daySum = items.reduce((s, t) => { const twd = (Number(t.amount) || 0) * Store.rate(t.currency, "TWD"); return s + (t.type === "INCOME" ? twd : t.type === "EXPENSE" ? -twd : 0); }, 0);
            return (
              <div className="day-group" key={key}>
                <div className="day-head"><span>{dayLabel(key)}</span><span className="day-sum tnum">{Store.fmt(daySum, "TWD", true)}</span></div>
                <div className="card card--flush">
                  <TxnListTx items={items} accMap={accMap} catMap={catMap} onEdit={onEdit} Store={Store} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

window.Transactions = Transactions;
