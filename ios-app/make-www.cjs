// Builds www/index.html for the iPhone app from the web game (../index.html):
// the font is bundled so the game runs offline, and the home-screen web-app links are dropped.
const fs = require("fs"), path = require("path");
let html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
html = html.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="fonts/fonts.css">')
  .replace(/<link rel="(apple-touch-icon|manifest)"[^>]*>\n?/g, "")
  .replace(/<meta name="(apple-mobile-web-app-[a-z-]+|mobile-web-app-capable)"[^>]*>\n?/g, "");
if (/https?:\/\/fonts\.g/.test(html)) throw new Error("web font link still in the page");
// Saves are copied to the keychain (save-vault.js) so a reinstall keeps them.
// App Store purchases: iap.js talks to RevenueCat. Its public iOS key comes from the RC_IOS_KEY secret; without it purchases stay off
const rc = (process.env.RC_IOS_KEY || "").trim();
for (const f of ["iap.js", "save-vault.js"]) fs.copyFileSync(path.join(__dirname, f), path.join(__dirname, "www", f));
fs.writeFileSync(path.join(__dirname, "www", "iap-config.js"), `window.LOL_RC_KEY = ${JSON.stringify(rc)};\n`);
const at = html.includes('<meta charset="utf-8">') ? '<meta charset="utf-8">' : "<head>";
if (!html.includes(at)) throw new Error("no <head> to add the purchase scripts to");
html = html.replace(at, at + '\n<script src="iap-config.js"></script><script src="iap.js"></script><script src="save-vault.js"></script>');
console.log(rc ? "purchases on (RevenueCat key set)" : "purchases off (no RC_IOS_KEY)");
fs.writeFileSync(path.join(__dirname, "www", "index.html"), html);
console.log("www/index.html", (html.length / 1024 | 0) + " KB");
