/* TxnForm.jsx — 記帳表單（新增 / 編輯 / 刪除），寫入 window.Store */
const { useState: useStateLF, useEffect: useEffectLF, useRef: useRefLF, useMemo: useMemoLF } = React;
const { Icon: IconLF } = window;

const LF_TYPES = [
  { id: "EXPENSE", label: "支出", icon: "expense", color: "#E5564E" },
  { id: "INCOME", label: "收入", icon: "income", color: "#1FA971" },
  { id: "TRANSFER", label: "轉帳", icon: "transfer", color: "#6C5CE7" },
  { id: "RECEIVABLE", label: "應收", icon: "receivable", color: "#0E9AA7" },
  { id: "PAYABLE", label: "應付", icon: "payable", color: "#E08A1E" },
];
const LF_TYPE = Object.fromEntries(LF_TYPES.map(t => [t.id, t]));
const CURRENCIES = ["TWD", "USD", "JPY", "EUR", "CNY"];

function toLocalInput(iso) {
  const d = iso ? new Date(iso) : new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
function toDateInput(iso) { if (!iso) return ""; return new Date(iso).toISOString().slice(0, 10); }

function LedgerForm({ onClose, editTxn, defaultType }) {
  const Store = window.Store;
  const st = Store.getState();
  const accounts = st.accounts;
  const projects = st.projects;
  const tagOptions = st.tags;

  const e = editTxn || {};
  const [type, setType] = useStateLF(e.type || defaultType || "EXPENSE");
  const [amount, setAmount] = useStateLF(e.amount != null ? String(e.amount) : "");
  const [currency, setCurrency] = useStateLF(e.currency || "TWD");
  const [catId, setCatId] = useStateLF(e.categoryId || "");
  const [accId, setAccId] = useStateLF(e.accountId || accounts[0]?.id || "");
  const [toAccId, setToAccId] = useStateLF(e.toAccountId || accounts.find(a => a.id !== (e.accountId || accounts[0]?.id))?.id || "");
  const [date, setDate] = useStateLF(toLocalInput(e.date));
  const [dueDate, setDueDate] = useStateLF(toDateInput(e.dueDate));
  const [open, setOpen] = useStateLF(!!(e.note || e.merchant || e.imageUrl || (e.tags && e.tags.length) || e.fee || e.discount || e.projectId));
  const [project, setProject] = useStateLF(e.projectId || "");
  const [fee, setFee] = useStateLF(e.fee ? String(e.fee) : "");
  const [discount, setDiscount] = useStateLF(e.discount ? String(e.discount) : "");
  const [merchant, setMerchant] = useStateLF(e.merchant || "");
  const [tags, setTags] = useStateLF(e.tags || []);
  const [note, setNote] = useStateLF(e.note || "");
  const [image, setImage] = useStateLF(e.imageUrl || null);
  const [submitted, setSubmitted] = useStateLF(false);
  const fileRef = useRefLF(null);

  const t = LF_TYPE[type];
  const isTransfer = type === "TRANSFER";
  const isReceivePay = type === "RECEIVABLE" || type === "PAYABLE";
  const needsCat = type === "EXPENSE" || type === "INCOME";
  const cats = st.categories.filter(c => c.type === (type === "INCOME" ? "INCOME" : "EXPENSE"));
  const acc = accounts.find(a => a.id === accId);
  const effCurrency = isTransfer && acc ? acc.currency : currency;

  useEffectLF(() => { if (needsCat && !cats.find(c => c.id === catId)) setCatId(cats[0]?.id || ""); }, [type]);

  const fx = useMemoLF(() => {
    const v = parseFloat(amount);
    if (!acc || effCurrency === acc.currency || !v) return null;
    const r = Store.rate(effCurrency, acc.currency);
    return { rate: r, value: v * r, target: acc.currency };
  }, [amount, effCurrency, accId]);

  const errors = {};
  const amt = parseFloat(amount);
  if (!amount || isNaN(amt) || amt <= 0) errors.amount = "請輸入大於 0 的金額";
  if (!accId) errors.accId = isTransfer ? "請選擇轉出帳戶" : "請選擇帳戶";
  if (isTransfer) {
    if (!toAccId) errors.toAccId = "請選擇轉入帳戶";
    else if (toAccId === accId) errors.toAccId = "轉入與轉出帳戶不能相同";
  }
  if (needsCat && !catId) errors.catId = "請選擇類別";
  if (isReceivePay && !dueDate) errors.dueDate = "請選擇到期日";
  const showErr = (k) => submitted && errors[k];
  const isValid = Object.keys(errors).length === 0;

  const save = () => {
    setSubmitted(true);
    if (!isValid) return;
    const data = {
      type, amount: amt, currency: effCurrency,
      date: new Date(date).toISOString(),
      merchant: merchant.trim(), note: note.trim(), imageUrl: image,
      fee: parseFloat(fee) || 0, discount: parseFloat(discount) || 0,
      accountId: accId, toAccountId: isTransfer ? toAccId : null,
      categoryId: needsCat ? catId : null, projectId: project,
      tags, dueDate: isReceivePay && dueDate ? new Date(dueDate).toISOString() : null,
    };
    if (editTxn) Store.updateTxn(editTxn.id, data); else Store.addTxn(data);
    onClose(true);
  };

  const remove = () => { Store.deleteTxn(editTxn.id); onClose(true); };
  const onFile = (ev) => {
    const f = ev.target.files?.[0]; if (!f) return;
    if (f.size > 800 * 1024) { alert("圖片請小於 800KB"); return; }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(f);
  };
  const toggleTag = (tg) => setTags(s => s.includes(tg) ? s.filter(x => x !== tg) : [...s, tg]);
  const sym = Store.SYMBOL[effCurrency] || "";

  return (
    <div className="lform">
      <div className="lform__head">
        <h3>{editTxn ? "編輯交易" : "記一筆"}</h3>
        <button className="ledger__close" aria-label="關閉" onClick={() => onClose(false)}><IconLF name="close" /></button>
      </div>

      <div className="lform__body">
        <div className="types">
          {LF_TYPES.map(ty => (
            <button key={ty.id} className="type-btn" aria-selected={type === ty.id}
              onClick={() => setType(ty.id)} style={type === ty.id ? { background: ty.color } : {}}>
              <IconLF name={ty.icon} /><span>{ty.label}</span>
            </button>
          ))}
        </div>

        <div className="amount" style={{ borderColor: showErr("amount") ? "var(--expense)" : undefined }}>
          <div className="amount__label">金額</div>
          <div className="amount__row">
            <span className="amount__cur" style={{ color: t.color }}>{sym}</span>
            <input className="amount__input tnum" inputMode="decimal" placeholder="0" autoFocus
              value={amount} onChange={ev => setAmount(ev.target.value.replace(/[^\d.]/g, ""))} />
          </div>
          {fx && (
            <div className="amount__fx">
              ≈ {Store.SYMBOL[fx.target]}{fx.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} {fx.target}（1 {effCurrency} ≈ {fx.rate.toFixed(3)} {fx.target}）
            </div>
          )}
          {showErr("amount") && <div className="err-msg"><IconLF name="alert" />{errors.amount}</div>}
        </div>

        {needsCat && (
          <div className="field">
            <div className="field__label"><IconLF name="folder" style={{ width: 14, height: 14 }} />類別 <span className="req">*</span></div>
            <div className="catwrap">
              {cats.map(c => (
                <button key={c.id} className="cat" aria-selected={catId === c.id} onClick={() => setCatId(c.id)}>
                  <span className="cat__ic" style={catId === c.id ? { background: c.color, color: "#fff" } : { color: c.color }}>
                    <IconLF name={c.icon} />
                  </span>
                  <span className="cat__name">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isTransfer ? (
          <div className="field">
            <div className="field__label"><IconLF name="transfer" style={{ width: 14, height: 14 }} />轉帳路徑 <span className="req">*</span></div>
            <div className="route">
              <select className={"control" + (showErr("accId") ? " control--err" : "")} value={accId} onChange={ev => setAccId(ev.target.value)}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <div className="route__arrow"><IconLF name="arrowRight" /></div>
              <select className={"control" + (showErr("toAccId") ? " control--err" : "")} value={toAccId} onChange={ev => setToAccId(ev.target.value)}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            {showErr("toAccId") && <div className="err-msg"><IconLF name="alert" />{errors.toAccId}</div>}
          </div>
        ) : (
          <div className="field">
            <div className="field__label"><IconLF name="wallet" style={{ width: 14, height: 14 }} />帳戶 <span className="req">*</span></div>
            <select className={"control" + (showErr("accId") ? " control--err" : "")} value={accId} onChange={ev => setAccId(ev.target.value)}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}（{a.currency}）</option>)}
            </select>
          </div>
        )}

        <div className="grid-2">
          <div className="field">
            <div className="field__label"><IconLF name="calendar" style={{ width: 14, height: 14 }} />日期時間 <span className="req">*</span></div>
            <input type="datetime-local" className="control" value={date} onChange={ev => setDate(ev.target.value)} />
          </div>
          {isReceivePay && (
            <div className="field">
              <div className="field__label"><IconLF name="clock" style={{ width: 14, height: 14 }} />到期日 <span className="req">*</span></div>
              <input type="date" className={"control" + (showErr("dueDate") ? " control--err" : "")} value={dueDate} onChange={ev => setDueDate(ev.target.value)} />
              {showErr("dueDate") && <div className="err-msg"><IconLF name="alert" />{errors.dueDate}</div>}
            </div>
          )}
        </div>

        <button className="accord-toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <IconLF name="chevron" />{open ? "收合細節" : "顯示更多細節"}
        </button>

        <div className="accord" data-open={open}>
          <div className="accord__inner">
            <div className="detail-band">幣別與費用</div>
            <div className="grid-2">
              {!isTransfer && (
                <div className="field">
                  <div className="field__label"><IconLF name="globe" style={{ width: 14, height: 14 }} />幣種</div>
                  <select className="control" value={currency} onChange={ev => setCurrency(ev.target.value)}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <div className="field">
                <div className="field__label"><IconLF name="folder" style={{ width: 14, height: 14 }} />專案</div>
                <select className="control" value={project} onChange={ev => setProject(ev.target.value)}>
                  <option value="">不指定</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <div className="field__label"><IconLF name="percent" style={{ width: 14, height: 14 }} />手續費</div>
                <input className="control tnum" inputMode="decimal" placeholder="0" value={fee} onChange={ev => setFee(ev.target.value.replace(/[^\d.]/g, ""))} />
              </div>
              <div className="field">
                <div className="field__label"><IconLF name="percent" style={{ width: 14, height: 14 }} />折扣</div>
                <input className="control tnum" inputMode="decimal" placeholder="0" value={discount} onChange={ev => setDiscount(ev.target.value.replace(/[^\d.]/g, ""))} />
              </div>
            </div>

            <div className="detail-band">商家與標籤</div>
            <div className="field">
              <div className="field__label"><IconLF name="store" style={{ width: 14, height: 14 }} />商家 / 名稱</div>
              <input className="control" placeholder="例如：星巴克 信義店" value={merchant} onChange={ev => setMerchant(ev.target.value)} />
            </div>
            <div className="field">
              <div className="field__label"><IconLF name="tag" style={{ width: 14, height: 14 }} />標籤</div>
              <div className="tags">
                {tagOptions.map(tg => (
                  <button key={tg} className="tag" aria-selected={tags.includes(tg)} onClick={() => toggleTag(tg)}>
                    {tags.includes(tg) && <IconLF name="check" />}{tg}
                  </button>
                ))}
              </div>
            </div>

            <div className="detail-band">備註與附件</div>
            <div className="field">
              <div className="field__label"><IconLF name="note" style={{ width: 14, height: 14 }} />備註</div>
              <textarea className="control" placeholder="補充說明…" value={note} onChange={ev => setNote(ev.target.value)}></textarea>
            </div>
            <div className="field">
              <div className="field__label"><IconLF name="camera" style={{ width: 14, height: 14 }} />收據圖片（小於 800KB）</div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
              {image ? (
                <div className="preview">
                  <img src={image} alt="收據預覽" />
                  <button className="preview__rm" onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = ""; }} aria-label="移除圖片"><IconLF name="close" /></button>
                </div>
              ) : (
                <button className="upload" onClick={() => fileRef.current?.click()}><IconLF name="camera" />點擊上傳收據或發票</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lform__foot">
        {editTxn && <button className="btn-del" onClick={remove}><IconLF name="close" />刪除</button>}
        <button className="submit" style={{ background: t.color }} onClick={save}>
          {editTxn ? "儲存變更" : "儲存"}{amount ? `　${sym}${amt ? amt.toLocaleString() : ""}` : ""}
        </button>
      </div>
    </div>
  );
}

window.LedgerForm = LedgerForm;
