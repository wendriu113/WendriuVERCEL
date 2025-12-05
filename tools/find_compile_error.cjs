const fs = require("fs");
const path = require("path");
const ejs = require("../node_modules/ejs");
const file = path.resolve(__dirname, "../views/site/movimentacaosite.ejs");
const src = fs.readFileSync(file, "utf8");
const lines = src.split(/\r?\n/);
let accumulated = "";
for (let i = 0; i < lines.length; i++) {
  accumulated += lines[i] + "\n";
  try {
    ejs.compile(accumulated, { filename: file });
  } catch (err) {
    console.error("Compile failed when including up to line", i + 1);
    console.error("Error message:", err.message);
    console.error(err.stack.split("\n").slice(0, 6).join("\n"));
    // print the surrounding lines
    const start = Math.max(0, i - 3);
    const end = Math.min(lines.length - 1, i + 3);
    console.error("Context:");
    for (let j = start; j <= end; j++) {
      console.error((j + 1).toString().padStart(4, " ") + ": " + lines[j]);
    }
    process.exit(1);
  }
}
console.log("Compiled entire file successfully (incremental test)");
