// Builds www/index.html for the iPhone app from the web game (../index.html):
// the font is bundled so the game runs offline, and the home-screen web-app links are dropped.
const fs = require("fs"), path = require("path");
let html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
html = html.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="fonts/fonts.css">')
  .replace(/<link rel="(apple-touch-icon|manifest)"[^>]*>\n?/g, "")
  .replace(/<meta name="(apple-mobile-web-app-[a-z-]+|mobile-web-app-capable)"[^>]*>\n?/g, "");
if (/https?:\/\/fonts\.g/.test(html)) throw new Error("web font link still in the page");
fs.writeFileSync(path.join(__dirname, "www", "index.html"), html);
console.log("www/index.html", (html.length / 1024 | 0) + " KB");
