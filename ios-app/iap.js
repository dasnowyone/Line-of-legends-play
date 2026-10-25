// Real App Store purchases for the iPhone app, through RevenueCat (spec: "Line of Legends: In-App Purchase Setup").
// The game never grants anything on its own: it calls LOL_IAP.buy(id) and gives gems or items only when the answer is ok.
// The browser game has no LOL_IAP.available, so its Buy buttons stay disabled.
(() => {
  const PRODUCTS = ["lol.gems.100", "lol.gems.550", "lol.gems.1200", "lol.gems.2600", "lol.gems.7000",
    "lol.firstoffer", "lol.starter", "lol.founder", "lol.inkpass.monthly"];
  const SUBS = ["lol.inkpass.monthly"];
  const cap = window.Capacitor, key = window.LOL_RC_KEY;
  const api = window.LOL_IAP = {
    available: false, products: PRODUCTS, prices: {}, owned: [], subs: [], manageUrl: null, error: null,
    ready: null, buy: async () => ({ ok: false, error: "Purchases work in the iPhone app" }),
    restore: async () => ({ ok: false, error: "Purchases work in the iPhone app" }),
    manage: () => {},
  };
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform() || !key) return;
  const P = cap.registerPlugin ? cap.registerPlugin("Purchases") : cap.Plugins.Purchases;
  const store = {};
  const note = info => {
    if (!info) return;
    api.owned = [...new Set((info.nonSubscriptionTransactions || []).map(t => t.productIdentifier))];
    api.subs = (info.activeSubscriptions || []).filter(id => SUBS.includes(id));
    api.manageUrl = info.managementURL || null;
    window.dispatchEvent(new CustomEvent("lol-iap", { detail: { owned: api.owned, subs: api.subs } }));
  };
  api.ready = (async () => {
    try {
      await P.configure({ apiKey: key });
      // Apple's own price strings, in the player's currency
      const [a, b] = await Promise.all([
        P.getProducts({ productIdentifiers: PRODUCTS, type: "NON_SUBSCRIPTION" }).catch(() => ({ products: [] })),
        P.getProducts({ productIdentifiers: SUBS, type: "SUBSCRIPTION" }).catch(() => ({ products: [] })),
      ]);
      for (const p of [...a.products, ...b.products]) { store[p.identifier] = p; api.prices[p.identifier] = p.priceString; }
      note((await P.getCustomerInfo()).customerInfo);
      api.available = Object.keys(store).length > 0;
      if (!api.available) api.error = "The App Store has no products for this app yet";
    } catch (e) { api.error = String((e && e.message) || e); }
    window.dispatchEvent(new CustomEvent("lol-iap-ready", { detail: { available: api.available, prices: api.prices } }));
    return api.available;
  })();
  // Answers { ok, id, tx } once Apple and RevenueCat confirm, or { ok: false, cancelled, error }
  api.buy = async id => {
    await api.ready;
    const product = store[id];
    if (!product) return { ok: false, error: "That item isn't on the App Store yet" };
    try {
      const r = await P.purchaseStoreProduct({ product });
      note(r.customerInfo);
      return { ok: true, id, tx: r.transaction && r.transaction.transactionIdentifier };
    } catch (e) {
      const cancelled = !!(e && (e.userCancelled || (e.data && e.data.userCancelled) || e.code === "1" || e.code === 1));
      return { ok: false, cancelled, error: cancelled ? null : String((e && e.message) || e) };
    }
  };
  // Answers { ok, owned, subs }: bundles bought before and the Ink Pass if it is active
  api.restore = async () => {
    await api.ready;
    try { const r = await P.restorePurchases(); note(r.customerInfo); return { ok: true, owned: api.owned, subs: api.subs }; }
    catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
  };
  // Apple's subscription page (cancel or change the Ink Pass); the web view hands this link to the App Store
  api.manage = () => { location.href = api.manageUrl || "https://apps.apple.com/account/subscriptions"; };
})();
