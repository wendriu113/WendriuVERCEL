const fs = require("fs");
const path = require("path");
const ejs = require("../node_modules/ejs");
const file = path.resolve(__dirname, "../views/site/movimentacaosite.ejs");
const src = fs.readFileSync(file, "utf8");
try {
  const compiled = ejs.compile(src, { client: true, filename: file });
  const out = "/* compiled ejs client */\n" + compiled;
  fs.writeFileSync(
    path.resolve(__dirname, "generated_movimentacaosite.js"),
    out,
    "utf8"
  );
  console.log("Wrote generated_movimentacaosite.js");
  // Try to create function to see if runtime throws
  try {
    new Function(out);
    console.log("Generated code is valid JS");
  } catch (err) {
    console.error("Error when creating Function from generated code:");
    console.error(err.stack);
  }
} catch (err) {
  console.error("ejs.compile error:");
  console.error(err.stack);
}
