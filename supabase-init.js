/* supabase-init.js — 建立 Supabase client，掛到 window.__sb */
(function () {
  var c = window.AIV_CONFIG || {};
  if (!c.SUPABASE_URL || !c.SUPABASE_ANON_KEY) {
    alert("尚未設定 Supabase 連線（config.js）");
    return;
  }
  // supabase-js v2 UMD 全域名稱為 supabase
  window.__sb = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
})();
