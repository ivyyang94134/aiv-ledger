/* themes.js — 主題引擎：主色 / 背景色調 / 字體，套用到 CSS 變數 */
(function () {
  const ACCENTS = {
    blue:     { name: "經典藍", primary: "#1F6FEB", ink: "#1657C2", soft: "#EAF1FE", grad: ["#1F6FEB", "#4B92FF"] },
    emerald:  { name: "森林綠", primary: "#0F8A5F", ink: "#0A6E4B", soft: "#E4F4EE", grad: ["#10915F", "#27B57E"] },
    indigo:   { name: "靛紫",   primary: "#5B57E0", ink: "#4540C2", soft: "#ECEBFC", grad: ["#5B57E0", "#8C7DFF"] },
    teal:     { name: "青碧",   primary: "#0E8E9B", ink: "#0A6F7A", soft: "#E1F4F5", grad: ["#0E94A1", "#1FB9C6"] },
    terra:    { name: "陶土橘", primary: "#D9701E", ink: "#B25712", soft: "#FBEEDF", grad: ["#E0791F", "#F1953F"] },
    rose:     { name: "莓紅",   primary: "#D9466B", ink: "#B43254", soft: "#FCE9EF", grad: ["#E14E72", "#F47393"] },
    graphite: { name: "石墨",   primary: "#3D3630", ink: "#2B2622", soft: "#EFEAE1", grad: ["#3D3630", "#605648"] },
  };
  const SURFACES = {
    warm: { name: "暖米", bg: "#FBF6EF", bg2: "#F4ECE0", surface: "#FFFFFF", surface2: "#F8F3EB", line: "#ECE2D3", lineStrong: "#DED1BD", ink: "#2B2622", ink2: "#6B6258", ink3: "#9A9085" },
    cool: { name: "霧灰", bg: "#F5F7FB", bg2: "#EAEEF6", surface: "#FFFFFF", surface2: "#F1F4FA", line: "#E4E8F1", lineStrong: "#CFD6E3", ink: "#1F2734", ink2: "#5A6477", ink3: "#8A93A5" },
    snow: { name: "純白", bg: "#FFFFFF", bg2: "#F4F5F7", surface: "#FFFFFF", surface2: "#F5F6F8", line: "#EAEBEF", lineStrong: "#D8DAE0", ink: "#1A1C20", ink2: "#5C6068", ink3: "#9298A1" },
  };
  const FONTS = {
    round: { name: "圓潤", head: '"Huninn", "Noto Sans TC", sans-serif' },
    clean: { name: "俐落", head: '"Noto Sans TC", sans-serif' },
  };
  function apply(prefs) {
    const a = ACCENTS[prefs.accent] || ACCENTS.blue;
    const s = SURFACES[prefs.surface] || SURFACES.warm;
    const f = FONTS[prefs.font] || FONTS.round;
    const root = document.documentElement;
    root.classList.add("theme-switching");
    let el = document.getElementById("__theme-vars");
    if (!el) { el = document.createElement("style"); el.id = "__theme-vars"; document.head.appendChild(el); }
    el.textContent = `:root{
      --primary:${a.primary}; --primary-ink:${a.ink}; --primary-soft:${a.soft};
      --grad-1:${a.grad[0]}; --grad-2:${a.grad[1]};
      --bg:${s.bg}; --bg-2:${s.bg2}; --surface:${s.surface}; --surface-2:${s.surface2};
      --line:${s.line}; --line-strong:${s.lineStrong};
      --ink:${s.ink}; --ink-2:${s.ink2}; --ink-3:${s.ink3};
      --round:${f.head};
    }`;
    void document.body.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
  }
  window.THEMES = { ACCENTS, SURFACES, FONTS, apply };
})();
