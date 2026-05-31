/* ui.jsx — shared primitives: Icon, Tabs, useStore, Modal */
const { useState, useEffect } = React;

const ICONS = {
  expense: "M12 3v18M7 8h7a3 3 0 010 6H6m12 3H9",
  income: "M12 21V3M7 16h7a3 3 0 000-6H6m12-3H9",
  transfer: "M7 7h11l-3-3M17 17H6l3 3",
  receivable: "M3 7l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
  payable: "M16 4h2a2 2 0 012 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 012-2h2M9 9h6M9 13h4",
  food: "M5 3v8m3-8v8m-1.5 0v10M16 3c-1.5 0-2.5 1.5-2.5 4s1 4 2.5 4m0-8v18",
  transport: "M5 17h14M6 17l-1-5 2-6h10l2 6-1 5M7 17a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm13 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z",
  shopping: "M6 7h12l1 13H5L6 7zm3 0a3 3 0 016 0",
  home: "M4 11l8-7 8 7M6 10v9h12v-9",
  entertain: "M4 5h16v11H4zM2 20h20M9 9l4 2-4 2z",
  health: "M12 21s-7-4.6-7-10a4 4 0 018-1 4 4 0 018 1c0 5.4-7 10-7 10z",
  salary: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  gift: "M20 12v8H4v-8M2 7h20v5H2zM12 7v13M12 7S10 3 7.5 3 5 7 7.5 7m4.5 0s2-4 4.5-4S19 7 16.5 7",
  invest: "M4 18l5-5 3 3 7-8M14 8h6v6",
  chevron: "M6 9l6 6 6-6",
  close: "M6 6l12 12M18 6L6 18",
  plus: "M12 5v14M5 12h14",
  camera: "M4 8h3l2-2h6l2 2h3v11H4zM12 16a3 3 0 100-6 3 3 0 000 6z",
  check: "M5 13l4 4L19 7",
  alert: "M12 9v4m0 4h.01M10.3 4l-7 12a2 2 0 001.7 3h14a2 2 0 001.7-3l-7-12a2 2 0 00-3.4 0z",
  tag: "M3 12V5a2 2 0 012-2h7l9 9-7 7-9-9zm5-4h.01",
  wallet: "M3 7h16a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 0V5a1 1 0 011-1h13M17 13h.01",
  calendar: "M4 6h16v15H4zM4 10h16M8 3v4m8-4v4",
  folder: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
  note: "M5 4h11l3 3v13H5zM9 9h6M9 13h6M9 17h3",
  store: "M4 9l1-5h14l1 5M4 9v10h16V9M4 9h16M9 19v-5h6v5",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18zm0 0c-3 3-3 15 0 18m0-18c3 3 3 15 0 18M3 12h18",
  percent: "M19 5L5 19M8.5 8.5a2 2 0 11-3 0 2 2 0 013 0zm10 7a2 2 0 11-3 0 2 2 0 013 0z",
  db: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm16 0v12c0 1.7-3.6 3-8 3s-8-1.3-8-3V6m16 6c0 1.7-3.6 3-8 3s-8-1.3-8-3",
  api: "M8 3H5a2 2 0 00-2 2v3m0 8v3a2 2 0 002 2h3m8 0h3a2 2 0 002-2v-3m0-8V5a2 2 0 00-2-2h-3M9 12h6M12 9v6",
  repeat: "M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4m14 1v2a4 4 0 01-4 4H3",
  layers: "M12 3l9 5-9 5-9-5 9-5zm9 9l-9 5-9-5m18 4l-9 5-9-5",
  clock: "M12 3a9 9 0 100 18 9 9 0 000-18zm0 4v5l3 2",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  palette: "M12 3C8 8 6 11 6 15a6 6 0 0012 0c0-4-2-7-6-12z",
};

function Icon({ name, style }) {
  const d = ICONS[name] || ICONS.note;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" style={style}>
      {d.split("M").filter(Boolean).map((seg, i) => <path key={i} d={"M" + seg} />)}
    </svg>
  );
}

function Tabs({ options, value, onChange, className }) {
  return (
    <div className={"tabs " + (className || "")}>
      {options.map(o => (
        <button key={o.id} aria-selected={value === o.id} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

function useStore() {
  const [, force] = useState(0);
  useEffect(() => window.Store.subscribe(() => force(n => n + 1)), []);
  return window.Store;
}

function Modal({ open, onClose, children, size }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="modal" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={"modal__card " + (size === "sm" ? "modal__card--sm" : "")} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { Icon, Tabs, useStore, Modal });
