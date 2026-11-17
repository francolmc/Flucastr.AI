# 4. skills: SKILL.md con name (= carpeta) y description
paso 4 "skills con SKILL.md, name y description"
for dir in skills/*/; do
  dir=${dir%/}
  nombre=$(basename "$dir")
  arch="$dir/SKILL.md"
  [ -f "$arch" ] || fallo "$dir no tiene SKILL.md"
  node -e '
const fs = require("fs");
const [arch, carpeta] = process.argv.slice(1);
const t = fs.readFileSync(arch, "utf8");
const m = t.match(/^---\r?\n([\s\S]*?)\r?\n---/);
const fail = c => { console.error("FALLO: " + arch + ": " + c); process.exit(1); };
if (!m) fail("sin frontmatter");
const campo = k => {
  const r = m[1].match(new RegExp("^" + k + ":[ \\t]*(.*)$", "m"));
  return r ? r[1].trim().replace(/^(["\x27])(.*)\1$/, "$2").trim() : null;
};
const name = campo("name"), desc = campo("description");
if (!name) fail("falta name");
if (name !== carpeta) fail("name \"" + name + "\" distinto de la carpeta \"" + carpeta + "\"");
if (!desc) fail("falta description o está vacía");
console.log("ok " + carpeta);
' "$arch" "$nombre"
done

