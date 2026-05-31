/* Dashboard.jsx — 總覽 */
const { useMemo: useMemoDash } = React;
const { Icon: IconDash, useStore: useStoreDash } = window;

function monthRange(d = new Date()) {
  return [new Date(d.getFullYear(), d.getMonth(), 1), new Date(d.getFullYear(), d.getMonth() + 1, 1)];
}

function Dashboard({ onAdd, onEdit, goto }) {
  const Store = useStoreDash();
  const st = Store.getState();
  const bal = Store.balances();
  const accMap = Object.fromEntries(st.accounts.map(a => [a.id, a]));
  const catMap = Object.fromEntries(st.categories.map(c => [c.id, c]));

  const data = useMemoDash(() => {
    const [s, e] = monthRange();
    const inMonth = st.transactions.filter(t => { const d = new Date(t.date); return d >= s && d < e; });
    let income = 0, expense = 0; const byCat = {};
    inMonth.forEach(t => {
      const twd = (Number(t.amount) || 0) * Store.rate(t.currency, "TWD");
      if (t.type === "INCOME") income += twd;
      if (t.type === "EXPENSE") { expense += twd; byCat[t.categoryId] = (byCat[t.categoryId] || 0) + twd; }
    });
    const cats = Object.entries(byCat).map(([id, v]) => ({ cat: catMap[id], value: v })).filter(x => x.cat).sort((a, b) => b.value - a.value).slice(0, 5);
    return { income, expense, cats, maxCat: cats[0]?.value || 1 };
  }, [st]);

  const recent = st.transactions.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const net = Store.netWorthTWD();
  const monthName = new Date().toLocaleDateString("zh-TW", { month: "long" });

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__eyebrow">{new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</div>
          <h1 className="page__title">總覽</h1>
        </div>
        <button className="addbtn" onClick={() => onAdd()}><IconDash name="plus" />記一筆</button>
      </div>

      <div className="dash-top">
        <div className="networth">
          <div className="networth__label">總淨資產（約當 TWD）</div>
          <div className="networth__amt tnum">{Store.fmt(net, "TWD")}</div>
          <div className="networth__sub">{st.accounts.length} 個帳戶 · {st.transactions.length} 筆交易</div>
          <div className="networth__glow"></div>
        </div>
        <div className="msum">
          <div className="msum__card">
            <div className="msum__top"><span className="dot" style={{ background: "var(--income)" }}></span>{monthName}收入</div>
            <div className="msum__amt tnum" style={{ color: "var(--income)" }}>{Store.fmt(data.income, "TWD")}</div>
          </div>
          <div className="msum__card">
            <div className="msum__top"><span className="dot" style={{ background: "var(--expense)" }}></span>{monthName}支出</div>
            <div className="msum__amt tnum" style={{ color: "var(--expense)" }}>{Store.fmt(data.expense, "TWD")}</div>
          </div>
          <div className="msum__card msum__card--net">
            <div className="msum__top"><span className="dot" style={{ background: "var(--primary)" }}></span>{monthName}結餘</div>
            <div className="msum__amt tnum" style={{ color: data.income - data.expense >= 0 ? "var(--ink)" : "var(--expense)" }}>{Store.fmt(data.income - data.expense, "TWD", true)}</div>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card__head"><h3>我的帳戶</h3><button className="link" onClick={() => goto("accounts")}>管理<IconDash name="arrowRight" /></button></div>
          <div className="acc-list">
            {st.accounts.map(a => (
              <div className="acc-row" key={a.id}>
                <span className="acc-row__ic" style={{ background: a.color + "1f", color: a.color }}><IconDash name={a.icon} /></span>
                <div className="acc-row__info">
                  <div className="acc-row__name">{a.name}</div>
                  <div className="acc-row__type">{a.currency}</div>
                </div>
                <span className="acc-row__bal tnum" style={{ color: (bal[a.id] || 0) < 0 ? "var(--expense)" : "var(--ink)" }}>{Store.fmt(bal[a.id], a.currency)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card__head"><h3>{monthName}支出分析</h3></div>
          {data.cats.length === 0 ? (
            <div className="empty-mini">本月尚無支出紀錄</div>
          ) : (
            <div className="bars">
              {data.cats.map(({ cat, value }) => (
                <div className="bar-row" key={cat.id}>
                  <span className="bar-row__ic" style={{ background: cat.color + "1f", color: cat.color }}><IconDash name={cat.icon} /></span>
                  <div className="bar-row__main">
                    <div className="bar-row__top"><span>{cat.name}</span><span className="tnum">{Store.fmt(value, "TWD")}</span></div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: (value / data.maxCat * 100) + "%", background: cat.color }}></div></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card__head"><h3>近期交易</h3><button className="link" onClick={() => goto("transactions")}>看全部<IconDash name="arrowRight" /></button></div>
        <TxnList items={recent} accMap={accMap} catMap={catMap} onEdit={onEdit} Store={Store} />
      </div>
    </div>
  );
}

function TxnList({ items, accMap, catMap, onEdit, Store }) {
  if (!items.length) return <div className="empty-mini">沒有符合的交易</div>;
  const TYPE_META = {
    EXPENSE: { sign: "-", color: "var(--expense)", icon: "expense", label: "支出" },
    INCOME: { sign: "+", color: "var(--income)", icon: "income", label: "收入" },
    TRANSFER: { sign: "", color: "var(--transfer)", icon: "transfer", label: "轉帳" },
    RECEIVABLE: { sign: "+", color: "var(--receivable)", icon: "receivable", label: "應收" },
    PAYABLE: { sign: "-", color: "var(--payable)", icon: "payable", label: "應付" },
  };
  return (
    <div className="txn-list">
      {items.map(t => {
        const m = TYPE_META[t.type];
        const cat = catMap[t.categoryId];
        const color = cat ? cat.color : m.color;
        const icon = cat ? cat.icon : m.icon;
        const acc = accMap[t.accountId];
        const sub = t.type === "TRANSFER"
          ? `${acc?.name} → ${accMap[t.toAccountId]?.name || ""}`
          : `${m.label} · ${cat ? cat.name + " · " : ""}${acc?.name || ""}`;
        const title = t.merchant || (cat ? cat.name : m.label);
        const pending = (t.type === "RECEIVABLE" || t.type === "PAYABLE") && !t.isSettled;
        return (
          <div className="txn" key={t.id} onClick={() => onEdit(t)}>
            <span className="txn__ic" style={{ background: color + "1f", color }}><IconDash name={icon} /></span>
            <div className="txn__main">
              <div className="txn__title">{title}{pending && <span className="txn__pending">未結清</span>}</div>
              <div className="txn__sub">{sub}</div>
            </div>
            <div className="txn__right">
              <span className="txn__amt tnum" style={{ color: m.sign === "+" ? "var(--income)" : m.sign === "-" ? "var(--ink)" : "var(--transfer)" }}>
                {m.sign}{Store.SYMBOL[t.currency]}{(Number(t.amount) || 0).toLocaleString()}
              </span>
              <span className="txn__time">{new Date(t.date).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" })}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { Dashboard, TxnList });
