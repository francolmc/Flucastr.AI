# 1. modelos.json <-> agentes/*.md
paso 1 "modelos.json parsea y agentes coinciden"
node -e '
const fs = require("fs");
let m;
try { m = JSON.parse(fs.readFileSync("modelos.json", "utf8")); }
catch (e) { console.error("FALLO: modelos.json no es JSON válido: " + e.message); process.exit(1); }
const claves = Object.keys(m.agentes || {}).sort();
const archivos = fs.readdirSync("agentes").filter(f => f.endsWith(".md")).map(f => f.slice(0, -3)).sort();
const sobran = claves.filter(c => !archivos.includes(c));
const faltan = archivos.filter(a => !claves.includes(a));
if (sobran.length || faltan.length) {
  console.error("FALLO: agentes sin correspondencia. En modelos.json sin archivo: " + (sobran.join(", ") || "-") + "; archivo sin entrada en modelos.json: " + (faltan.join(", ") || "-"));
  process.exit(1);
}
console.log("agentes: " + archivos.join(", "));
'

node tools/verify/core-compatibility.mjs || fallo "1: copias de compatibilidad de core distintas"

