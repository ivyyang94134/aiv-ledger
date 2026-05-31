/* ThemePicker.jsx — 外觀設定 */
const { Icon: IconTheme, useStore: useStoreTheme } = window;

function ThemeControls() {
  const Store = useStoreTheme();
  const prefs = Store.getPrefs();
  const T = window.THEMES;
  const set = (patch) => Store.setPref(patch);

  return (
    <div className="theme">
      <div className="theme__group">
        <div className="theme__label">主色調</div>
        <div className="theme__accents">
          {Object.entries(T.ACCENTS).map(([id, a]) => (
            <button key={id} className="acc-dot" aria-selected={prefs.accent === id}
              title={a.name} style={{ background: a.primary }} onClick={() => set({ accent: id })}>
              {prefs.accent === id && <IconTheme name="check" />}
            </button>
          ))}
        </div>
      </div>
      <div className="theme__group">
        <div className="theme__label">背景色調</div>
        <div className="theme__seg">
          {Object.entries(T.SURFACES).map(([id, s]) => (
            <button key={id} aria-selected={prefs.surface === id} onClick={() => set({ surface: id })}>
              <span className="theme__chip" style={{ background: s.bg, borderColor: s.lineStrong }}></span>{s.name}
            </button>
          ))}
        </div>
      </div>
      <div className="theme__group">
        <div className="theme__label">字體風格</div>
        <div className="theme__seg">
          {Object.entries(T.FONTS).map(([id, f]) => (
            <button key={id} aria-selected={prefs.font === id} onClick={() => set({ font: id })}>{f.name}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

window.ThemeControls = ThemeControls;
