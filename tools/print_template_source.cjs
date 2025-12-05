const ejs = require("../node_modules/ejs");
const fs = require("fs");
const path = require("path");
const file = path.resolve(__dirname, "../views/site/movimentacaosite.ejs");
const src = fs.readFileSync(file, "utf8");
try {
  const t = new ejs.Template(src, { filename: file });
  if (t && t.source) {
    fs.writeFileSync(
      path.resolve(__dirname, "tpl_source.js"),
      t.source,
      "utf8"
    );
    console.log("Wrote tpl_source.js");
  } else {
    console.log("Template created but no source property");
  }
} catch (err) {
  console.error("Template ctor error:");
  console.error(err.stack);
}
