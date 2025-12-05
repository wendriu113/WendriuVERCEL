const ejs = require("../node_modules/ejs");
const fs = require("fs");
const path = require("path");
const file = path.resolve(__dirname, "../views/site/movimentacaosite.ejs");
const src = fs.readFileSync(file, "utf8");
const t = new ejs.Template(src, { filename: file });
console.log("templateText length", t.templateText && t.templateText.length);
if (t.source) {
  fs.writeFileSync(
    path.resolve(__dirname, "tpl_full_source.js"),
    String(t.source),
    "utf8"
  );
  console.log("Wrote tpl_full_source.js (length", String(t.source).length, ")");
} else {
  console.log("no t.source");
}
