/* Accounts.jsx — 帳戶管理 */
const { useState: useStateAcc } = React;
const { Icon: IconAcc, useStore: useStoreAcc, Modal: ModalAcc } = window;

const ACC_TYPES = [
  { id: "CASH", label: "現金", icon: "wallet" }, { id: "BANK", label: "銀行", icon: "home" },
  { id: "CREDIT_CARD", label: "信用卡", icon: "wallet" }, { id: "E_WALLET", label: "電子錢包", icon: "bolt" },
];
const ACC_COLORS = ["#1F6FEB", "#1FA971", "#6C5CE7", "#E08A1E", "#E5564E", "#0E9AA7"];
const ACC_ICONS = ["wallet", "home", "globe", "shield", "store", "gift"];
const ACC_CURRENCIES = ["TWD", "USD", "JPY", "EUR", "CNY"];

function AccountForm({ editAcc, onClose }) {
  const Store = window.Store;
  const a = editAcc || {};
  const [name, setName] = useStateAcc(a.name || "");
  const [type, setType] = useStateAcc(a.type || "BANK");
  const [currency, setCurrency] = useStateAcc(a.currency || "TWD");
  const [initial, setInitial] = useStateAcc(a.initial != null ? String(a.initial) : "");
  const [color, setColor] = useStateAcc(a.color || ACC_COLORS[0]);
  const [icon, setIcon] = useStateAcc(a.icon || "wallet");
  const [confirmDel, setConfirmDel] = useStateAcc(false);
  const [err, setErr] = useStateAcc(false);

  const save = () => {
    if (!name.trim()) { setErr(true); return; }
    const data = { name: name.trim(), type, currency, initial: parseFloat(initial) || 0, color, icon };
    if (editAcc) Store.updateAccount(editAcc.id, data); else Store.addAccount(data);
    onClose();
  };

  return (
    <div className="lform">
      <div className="lform__head">
        <h3>{editAcc ? "編輯帳戶" : "新增帳戶"}</h3>
        <button className="ledger__close" onClick={onClose} aria-label="關閉"><IconAcc name="close" /></button>
      </div>
      <div className="lform__body">
        <div className="field">
          <div className="field__label">帳戶名稱 <span className="req">*</span></div>
          <input className={"control" + (err && !name.trim() ? " control--err" : "")} placeholder="例如：玉山現金回饋卡" value={name} onChange={e => { setName(e.target.value); setErr(false); }} />
          {err && !name.trim() && <div className="err-msg"><IconAcc name="alert" />請輸入帳戶名稱</div>}
        </div>
        <div className="field">
          <div className="field__label">帳戶類型</div>
          <div className="seg-types">
            {ACC_TYPES.map(t => <button key={t.id} className="seg-type" aria-selected={type === t.id} onClick={() => setType(t.id)}><IconAcc name={t.icon} />{t.label}</button>)}
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <div className="field__label">主幣別</div>
            <select className="control" value={currency} onChange={e => setCurrency(e.target.value)}>{ACC_CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="field">
            <div className="field__label">起始餘額</div>
            <input className="control tnum" inputMode="decimal" placeholder="0" value={initial} onChange={e => setInitial(e.target.value.replace(/[^\d.-]/g, ""))} />
          </div>
        </div>
        <div className="field">
          <div className="field__label">顏色</div>
          <div className="swatches">{ACC_COLORS.map(c => <button key={c} className="swatch" aria-selected={color === c} style={{ background: c }} onClick={() => setColor(c)}>{color === c && <IconAcc name="check" />}</button>)}</div>
        </div>
        <div className="field">
          <div className="field__label">圖示</div>
          <div className="icon-pick">{ACC_ICONS.map(ic => <button key={ic} className="icon-opt" aria-selected={icon === ic} style={icon === ic ? { borderColor: color, color } : {}} onClick={() => setIcon(ic)}><IconAcc name={ic} /></button>)}</div>
        </div>
      </div>
      <div className="lform__foot">
        {editAcc && (
          <button className={"btn-del" + (confirmDel ? " btn-del--armed" : "")} onClick={() => { if (confirmDel) { Store.deleteAccount(editAcc.id); onClose(); } else setConfirmDel(true); }}>
            <IconAcc name="close" />{confirmDel ? "確定刪除？" : "刪除"}
          </button>
        )}
        <button className="submit" style={{ background: "var(--primary)" }} onClick={save}>{editAcc ? "儲存變更" : "建立帳戶"}</button>
      </div>
    </div>
  );
}

function Accounts({ onTransfer }) {
  const Store = useStoreAcc();
  const st = Store.getState();
  const bal = Store.balances();
  const [modal, setModal] = useStateAcc(null);
  const total = Store.netWorthTWD();

  return (
    <div className="page">
      <div className="page__head">
        <div><div className="page__eyebrow">總淨資產約當 {Store.fmt(total, "TWD")}</div><h1 className="page__title">帳戶</h1></div>
        <div className="head-actions">
          <button className="addbtn addbtn--ghost" onClick={onTransfer}><IconAcc name="transfer" />轉帳</button>
          <button className="addbtn" onClick={() => setModal({})}><IconAcc name="plus" />新增帳戶</button>
        </div>
      </div>

      <div className="acc-cards">
        {st.accounts.map(a => (
          <div className="acc-card" key={a.id} onClick={() => setModal(a)} style={{ "--c": a.color }}>
            <div className="acc-card__bar"></div>
            <div className="acc-card__top">
              <span className="acc-card__ic" style={{ background: a.color, color: "#fff" }}><IconAcc name={a.icon} /></span>
              <span className="acc-card__type">{ACC_TYPES.find(t => t.id === a.type)?.label || a.type}</span>
            </div>
            <div className="acc-card__name">{a.name}</div>
            <div className="acc-card__bal tnum" style={{ color: (bal[a.id] || 0) < 0 ? "var(--expense)" : "var(--ink)" }}>{Store.fmt(bal[a.id], a.currency)}</div>
            <div className="acc-card__cur">{a.currency}{a.currency !== "TWD" ? ` · 約 ${Store.fmt((bal[a.id] || 0) * Store.rate(a.currency, "TWD"), "TWD")}` : ""}</div>
          </div>
        ))}
        <button className="acc-card acc-card--add" onClick={() => setModal({})}>
          <IconAcc name="plus" /><span>新增帳戶</span>
        </button>
      </div>

      <ModalAcc open={!!modal} onClose={() => setModal(null)} size="sm">
        {modal && <AccountForm editAcc={modal.id ? modal : null} onClose={() => setModal(null)} />}
      </ModalAcc>
    </div>
  );
}

window.Accounts = Accounts;
