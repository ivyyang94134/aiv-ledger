/* app.jsx — 登入閘門 + 應用外殼（導覽 / 頁面切換 / 記帳 Modal） */
const { useState: useStateApp, useEffect: useEffectApp } = React;
const { Icon: IconApp, Modal: ModalApp, useStore: useStoreApp, LedgerForm: LedgerFormApp, Dashboard, Transactions, Accounts, ThemeControls } = window;

const NAV = [
  { id: "dashboard", label: "總覽", icon: "layers" },
  { id: "transactions", label: "交易", icon: "note" },
  { id: "accounts", label: "帳戶", icon: "wallet" },
];

/* ---------------- 登入畫面 ---------------- */
function Auth() {
  const [mode, setMode] = useStateApp("login");
  const [email, setEmail] = useStateApp("");
  const [pw, setPw] = useStateApp("");
  const [msg, setMsg] = useStateApp("");
  const [busy, setBusy] = useStateApp(false);

  const submit = async () => {
    setMsg(""); setBusy(true);
    const sb = window.__sb;
    try {
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pw });
        if (error) throw error;
      } else {
        const { data, error } = await sb.auth.signUp({ email: email.trim(), password: pw });
        if (error) throw error;
        if (!data.session) { setMsg("註冊成功！請到信箱點擊確認信後再登入。"); setMode("login"); setBusy(false); return; }
      }
      // 成功 → onAuthStateChange 會接手
    } catch (e) {
      setMsg(translate(e.message || String(e)));
      setBusy(false);
    }
  };

  function translate(m) {
    if (/Invalid login credentials/i.test(m)) return "帳號或密碼錯誤";
    if (/already registered/i.test(m)) return "此 Email 已註冊，請直接登入";
    if (/Password should be at least/i.test(m)) return "密碼至少需 6 個字元";
    if (/valid email/i.test(m)) return "請輸入有效的 Email";
    return m;
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__brand"><span className="brand__mark">愛</span><span>愛V記帳</span></div>
        <h2 className="auth__title">{mode === "login" ? "登入" : "註冊新帳號"}</h2>
        <p className="auth__sub">{mode === "login" ? "用 Email 登入，多裝置同步你的記帳。" : "建立帳號開始記帳，資料只有你看得到。"}</p>

        <div className="field">
          <div className="field__label">Email</div>
          <input className="control" type="email" autoComplete="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
        <div className="field">
          <div className="field__label">密碼</div>
          <input className="control" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="至少 6 個字元"
            value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
        </div>

        {msg && <div className="auth__msg">{msg}</div>}

        <button className="submit" style={{ background: "var(--primary)" }} disabled={busy} onClick={submit}>
          {busy ? "請稍候…" : (mode === "login" ? "登入" : "註冊")}
        </button>

        <div className="auth__switch">
          {mode === "login"
            ? <span>還沒有帳號？<button onClick={() => { setMode("register"); setMsg(""); }}>註冊一個</button></span>
            : <span>已經有帳號？<button onClick={() => { setMode("login"); setMsg(""); }}>去登入</button></span>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 主應用 ---------------- */
function MainApp() {
  const Store = useStoreApp();
  const [page, setPage] = useStateApp("dashboard");
  const [modal, setModal] = useStateApp(null);
  const [resetArmed, setResetArmed] = useStateApp(false);
  const [themeOpen, setThemeOpen] = useStateApp(false);
  const prefs = Store.getPrefs();
  useEffectApp(() => { window.THEMES.apply(prefs); }, [prefs.accent, prefs.surface, prefs.font]);

  const onReset = () => {
    if (resetArmed) { Store.reset(); setResetArmed(false); }
    else { setResetArmed(true); setTimeout(() => setResetArmed(false), 2600); }
  };
  const logout = async () => { await window.__sb.auth.signOut(); location.reload(); };

  const openAdd = (defaultType) => setModal({ defaultType });
  const openEdit = (txn) => setModal({ editTxn: txn });
  const openTransfer = () => setModal({ defaultType: "TRANSFER" });
  const closeModal = () => setModal(null);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__brand"><span className="brand__mark">愛</span><span className="sidebar__name">愛V記帳</span></div>
        <nav className="sidebar__nav">
          {NAV.map(n => (
            <button key={n.id} className="navitem" aria-selected={page === n.id} onClick={() => setPage(n.id)}>
              <IconApp name={n.icon} /><span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar__bottom">
          <details className="theme-acc">
            <summary><IconApp name="palette" />外觀主題</summary>
            <ThemeControls />
          </details>
          <button className="sidebar__add" onClick={() => openAdd()}><IconApp name="plus" />記一筆</button>
          <button className={"sidebar__reset" + (resetArmed ? " sidebar__reset--armed" : "")} onClick={onReset} title="重設範例資料"><IconApp name="repeat" />{resetArmed ? "再按一次確認" : "重設資料"}</button>
          <button className="sidebar__reset" onClick={logout} title="登出"><IconApp name="close" />登出</button>
        </div>
      </aside>

      <main className="main">
        {page === "dashboard" && <Dashboard onAdd={openAdd} onEdit={openEdit} goto={setPage} />}
        {page === "transactions" && <Transactions onAdd={openAdd} onEdit={openEdit} />}
        {page === "accounts" && <Accounts onTransfer={openTransfer} />}
      </main>

      <nav className="botnav">
        {NAV.map(n => (
          <button key={n.id} className="botnav__item" aria-selected={page === n.id} onClick={() => setPage(n.id)}>
            <IconApp name={n.icon} /><span>{n.label}</span>
          </button>
        ))}
        <button className="botnav__item" onClick={() => setThemeOpen(true)}>
          <IconApp name="palette" /><span>外觀</span>
        </button>
      </nav>

      <button className="fab" onClick={() => openAdd()} aria-label="記一筆"><IconApp name="plus" /></button>

      <ModalApp open={!!modal} onClose={closeModal}>
        {modal && <LedgerFormApp editTxn={modal.editTxn} defaultType={modal.defaultType} onClose={closeModal} />}
      </ModalApp>

      <ModalApp open={themeOpen} onClose={() => setThemeOpen(false)} size="sm">
        <div className="lform">
          <div className="lform__head"><h3>外觀主題</h3><button className="ledger__close" onClick={() => setThemeOpen(false)} aria-label="關閉"><IconApp name="close" /></button></div>
          <div className="lform__body"><ThemeControls /></div>
        </div>
      </ModalApp>
    </div>
  );
}

/* ---------------- 進入點：判斷登入狀態 ---------------- */
function Splash({ text }) {
  return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: "#9A9085", fontFamily: "'Noto Sans TC',sans-serif" }}>{text || "載入中…"}</div>;
}

function Root() {
  const [phase, setPhase] = useStateApp("checking"); // checking | auth | loading | ready | error
  const [err, setErr] = useStateApp("");

  useEffectApp(() => {
    const sb = window.__sb;
    let done = false;
    async function boot() {
      if (done) return; done = true;
      setPhase("loading");
      try {
        await window.Store.init();
        window.THEMES.apply(window.Store.getPrefs());
        setPhase("ready");
      } catch (e) {
        setErr(e.message || String(e)); setPhase("error");
      }
    }
    sb.auth.getSession().then(({ data }) => {
      if (data.session) boot(); else setPhase("auth");
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (session) boot(); else { done = false; setPhase("auth"); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (phase === "auth") return <Auth />;
  if (phase === "error") return <Splash text={"載入失敗：" + err} />;
  if (phase !== "ready") return <Splash text="載入資料中…" />;
  return <MainApp />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
