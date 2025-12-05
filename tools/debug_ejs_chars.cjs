const fs = require("fs");
const path = require("path");
const file = path.resolve(__dirname, "../views/site/movimentacaosite.ejs");
const src = fs.readFileSync(file, "utf8");
const lines = src.split(/\r?\n/);
console.log("Analyzing file:", file);
let found = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const codes = [];
  for (let j = 0; j < line.length; j++) {
    const code = line.charCodeAt(j);
    if (code === 0 || code === 65279 || code > 127)
      codes.push({ pos: j, code });
  }
  if (codes.length) {
    found = true;
    console.log(`Line ${i + 1} (len ${line.length}):`);
    console.log(line);
    console.log("Non-ascii/control char codes:", codes.slice(0, 20));
  }
}
if (!found) console.log("No non-ascii/control characters found.");
else console.log("Check the printed lines for unexpected characters.");
