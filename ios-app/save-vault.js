// iPhone app only: copies the game's saves (every localStorage key starting with "lol") into the keychain through
// the SaveVault plugin, and puts them back after a reinstall, so heroes and bought gems are not lost with the app.
(() => {
  const cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
  const V = cap.registerPlugin ? cap.registerPlugin("SaveVault") : cap.Plugins.SaveVault;
  // App Store installs hide the tester tools; TestFlight keeps them
  window.LOL_RELEASE = true;
  V.env().then(r => { window.LOL_RELEASE = !(r && r.testflight); }).catch(() => {});
  // Apple's rate prompt, which the game asks for once after the first dungeon
  window.lolReview = () => V.review().catch(() => {});
  const snap = () => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith("lol")) o[k] = localStorage.getItem(k); } return o; };
  const hasHero = o => Object.keys(o).some(k => k.startsWith("lol-world"));
  let last = "";
  const backup = () => { try { const s = JSON.stringify(snap()); if (s !== last && hasHero(JSON.parse(s))) { last = s; V.set({ key: "save", value: s }).catch(() => { last = ""; }); } } catch {} };
  V.get({ key: "save" }).then(r => {
    const kept = r && r.value ? JSON.parse(r.value) : null;
    // A fresh install with a vault copy: put the saves back and start again from them
    if (kept && hasHero(kept) && !hasHero(snap())) {
      for (const [k, v] of Object.entries(kept)) localStorage.setItem(k, v);
      sessionStorage.setItem("lol-restored", "1"); location.reload(); return;
    }
    setInterval(backup, 20000);
    document.addEventListener("visibilitychange", () => { if (document.hidden) backup(); });
    addEventListener("pagehide", backup);
    backup();
  }).catch(() => {});
})();
