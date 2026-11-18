# 1. models.json <-> core/agents/*.md
paso 1 "models.json parsea y agentes coinciden"
node -e '
const fs = require("fs");
let m;
try { m = JSON.parse(fs.readFileSync("models.json", "utf8")); }
catch (e) { console.error("FALLO: models.json no es JSON válido: " + e.message); process.exit(1); }
const claves = Object.keys(m.agents || {}).sort();
const archivos = fs.readdirSync("core/agents").filter(f => f.endsWith(".md")).map(f => f.slice(0, -3)).sort();
const sobran = claves.filter(c => !archivos.includes(c));
const faltan = archivos.filter(a => !claves.includes(a));
if (sobran.length || faltan.length) {
  console.error("FALLO: agentes sin correspondencia. En models.json sin archivo: " + (sobran.join(", ") || "-") + "; archivo sin entrada en models.json: " + (faltan.join(", ") || "-"));
  process.exit(1);
}
console.log("agentes: " + archivos.join(", "));
'
