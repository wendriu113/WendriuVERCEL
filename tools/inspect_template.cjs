const ejs = require("../node_modules/ejs");
const fs = require("fs");
const path = require("path");
const file = path.resolve(__dirname, "../views/site/movimentacaosite.ejs");
const src = fs.readFileSync(file, "utf8");
const t = new ejs.Template(src, { filename: file });
console.log(
  "proto props:",
  Object.getOwnPropertyNames(Object.getPrototypeOf(t))
);
console.log("has source?", typeof t.source);
console.log("templateText len", t.templateText && t.templateText.length);
if (t.source) console.log("source len", t.source.length);
// Try compiling/generating source
try {
  if (typeof t.compile === "function") t.compile();
  const gen =
    typeof t.generateSource === "function" ? t.generateSource() : t.source;
  if (gen) {
    fs.writeFileSync(
      path.resolve(__dirname, "tpl_generated_full.js"),
      String(gen),
      "utf8"
    );
    console.log("Wrote tpl_generated_full.js length", String(gen).length);
  } else {
    console.log("No generated source produced (gen is falsy)");
  }
} catch (err) {
  console.error("Error generating source:", err && err.stack ? err.stack : err);
}
