const fs = require("fs");
const path = require("path");
const ejs = require("../node_modules/ejs");
const file = path.resolve(__dirname, "../views/site/movimentacaosite.ejs");
const src = fs.readFileSync(file, "utf8");
const lines = src.split(/\r?\n/);
let accumulated = "";
let lastGood = null;
for (let i = 0; i < lines.length; i++) {
  accumulated += lines[i] + "\n";
  try {
    const compiled = ejs.compile(accumulated, { client: true, filename: file });
    lastGood = { i, compiled };
  } catch (err) {
    console.error("Compile failed when including up to line", i + 1);
    if (lastGood) {
      fs.writeFileSync(
        path.resolve(__dirname, "last_good_compiled.js"),
        String(lastGood.compiled),
        "utf8"
      );
      console.log(
        "Wrote last_good_compiled.js for inspection (up to line",
        lastGood.i + 1,
        ")"
      );
    }
    console.error(err.stack);
    process.exit(1);
  }
}
console.log("Compiled entire file successfully");
fs.writeFileSync(
  path.resolve(__dirname, "full_compiled.js"),
  String(ejs.compile(src, { client: true, filename: file })),
  "utf8"
);
console.log("Wrote full_compiled.js");
