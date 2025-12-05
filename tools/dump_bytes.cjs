const fs = require("fs");
const path = require("path");
const file = path.resolve(__dirname, "../views/site/movimentacaosite.ejs");
const buf = fs.readFileSync(file);
console.log("File size", buf.length, "bytes");
let hex = buf.toString("hex");
// print hex in groups of 16 bytes per line with offsets
for (let i = 0; i < Math.min(buf.length, 400); i += 16) {
  const slice = buf.slice(i, i + 16);
  const hexline = slice
    .toString("hex")
    .match(/.{1,2}/g)
    .join(" ");
  let ascii = "";
  for (let j = 0; j < slice.length; j++) {
    const ch = slice[j];
    ascii += ch >= 32 && ch < 127 ? String.fromCharCode(ch) : ".";
  }
  console.log(i.toString().padStart(4, "0"), hexline.padEnd(48, " "), ascii);
}
