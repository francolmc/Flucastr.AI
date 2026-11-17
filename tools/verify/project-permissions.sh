# 6. reglas deny del proyecto: instalar.sh y desinstalar.sh reales, con un HOME temporal por escenario
paso 6 "reglas deny del proyecto (instalar, reinstalar, desinstalar, JSON roto)"
T6=$(mktemp -d) || fallo "no pude crear el temporal"
trap '[ -n "${T6:-}" ] && rm -rf "$T6"' EXIT
REGLAS_DENY=("Read(./.env)" "Read(./.env.*)" "Read(./**/.env)" "Read(./**/.env.*)" "Read(./.ssh/**)" "Read(./.aws/**)" "Read(./**/.ssh/**)" "Read(./**/.aws/**)" "Read(~/.ssh/**)" "Read(~/.aws/**)" "Read(./**/*.pem)" "Read(./**/*.key)" "Read(./**/*.p12)" "Read(./**/*.pfx)" "Read(./**/id_rsa)" "Read(./**/id_ed25519)" "Read(./**/id_ecdsa)" "Bash(git commit *)" "Bash(git push *)" "Bash(git merge *)" "Bash(gh pr create *)" "Bash(gh pr merge *)" "Bash(git * commit *)" "Bash(git * push *)" "Bash(bash -c *)" "Bash(sh -c *)" "Bash(zsh -c *)" "Bash(git -c * merge *)")
REGLAS_DENY_NUEVAS=("Read(./**/.env)" "Read(./**/.env.*)" "Read(./.ssh/**)" "Read(./.aws/**)" "Read(./**/.ssh/**)" "Read(./**/.aws/**)" "Read(~/.ssh/**)" "Read(~/.aws/**)" "Read(./**/*.pem)" "Read(./**/*.key)" "Read(./**/*.p12)" "Read(./**/*.pfx)" "Read(./**/id_rsa)" "Read(./**/id_ed25519)" "Read(./**/id_ecdsa)" "Bash(git * commit *)" "Bash(git * push *)" "Bash(bash -c *)" "Bash(sh -c *)" "Bash(zsh -c *)" "Bash(git -c * merge *)")

# Cada escenario: $T6/<nombre>/home (con .claude, para que Claude Code se detecte) y $T6/<nombre>/proj
nuevo_escenario() { mkdir -p "$T6/$1/home/.claude" "$T6/$1/proj/.claude"; }
k6_instalar() { # carpeta del escenario
  ( unset PI_CODING_AGENT_DIR; export HOME="$1/home"; bash instalar.sh --solo claude --proyecto "$1/proj" ) >"$1/log" 2>&1 \
    || { cat "$1/log" >&2; fallo "instalar.sh falló en $1"; }
}
k6_desinstalar() { # carpeta del escenario
  ( unset PI_CODING_AGENT_DIR; export HOME="$1/home"; bash desinstalar.sh --proyecto "$1/proj" ) >"$1/log" 2>&1 \
    || { cat "$1/log" >&2; fallo "desinstalar.sh falló en $1"; }
}
k6_deny_lineas() { grep "^deny"$'\t' "$1/home/.flucastr-ai/manifiesto.txt" 2>/dev/null || true; }

# escenario 1: el proyecto no tiene settings.json
e="$T6/s1"; nuevo_escenario s1
k6_instalar "$e"
node -e 'const fs = require("fs"); const d = JSON.parse(fs.readFileSync(process.argv[1], "utf8")).permissions.deny; const expected = process.argv.slice(2); process.exit(d.length === expected.length && expected.every((r) => d.includes(r)) ? 0 : 1)' "$e/proj/.claude/settings.json" "${REGLAS_DENY[@]}" \
  || fallo "escenario 1: las reglas deny no son exactamente las 28 del kit"
[ "$(k6_deny_lineas "$e" | grep -c .)" = 28 ] || fallo "escenario 1: el manifiesto no tiene 28 líneas deny"
echo "ok escenario 1: sin archivo -> 28 reglas y 28 líneas deny"

# escenario 2: el proyecto ya tiene allow, otra clave y deny propios (incluida Bash(git push *))
e="$T6/s2"; nuevo_escenario s2
cat > "$e/proj/.claude/settings.json" <<'EOF'
{
  "permissions": {
    "allow": ["Bash(ls)"],
    "deny": ["Bash(git push *)", "Bash(rm -rf *)"]
  },
  "otra": true
}
EOF
cp "$e/proj/.claude/settings.json" "$e/original.json"
k6_instalar "$e"
node -e 'const fs = require("fs"); const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); const d = j.permissions.deny; const reglas = process.argv.slice(2); const ok = reglas.every((r) => d.includes(r)) && d.includes("Bash(rm -rf *)") && JSON.stringify(j.permissions.allow) === "[\"Bash(ls)\"]" && j.otra === true && d.length === reglas.length + 1; process.exit(ok ? 0 : 1)' "$e/proj/.claude/settings.json" "${REGLAS_DENY[@]}" \
  || fallo "escenario 2: no se conservó lo del usuario o no se agregaron las reglas que faltaban"
[ "$(k6_deny_lineas "$e" | grep -c .)" = 27 ] || fallo "escenario 2: el manifiesto debe tener 27 líneas deny (solo Bash(git push *) de las 28 reglas ya era del usuario)"
grep -qF $'\tBash(git push *)' "$e/home/.flucastr-ai/manifiesto.txt" && fallo "escenario 2: el manifiesto registró una regla que ya tenía el usuario"
echo "ok escenario 2: se conservan allow, otra clave y deny propios; solo se registran las agregadas"

# escenario 3: instalar dos veces no cambia el archivo ni las líneas deny del manifiesto
e="$T6/s3"; nuevo_escenario s3
k6_instalar "$e"
cp "$e/proj/.claude/settings.json" "$e/primera.json"
k6_deny_lineas "$e" > "$e/deny1.txt"
k6_instalar "$e"
cmp -s "$e/primera.json" "$e/proj/.claude/settings.json" || fallo "escenario 3: el archivo cambió al reinstalar"
k6_deny_lineas "$e" > "$e/deny2.txt"
cmp -s "$e/deny1.txt" "$e/deny2.txt" || fallo "escenario 3: las líneas deny del manifiesto cambiaron al reinstalar"
echo "ok escenario 3: reinstalar deja el archivo y las líneas deny iguales"

# escenario 4: desinstalar deja el archivo original del usuario, o no deja archivo si no existía
k6_desinstalar "$T6/s2"
node -e 'const fs = require("fs"); const r = (f) => JSON.stringify(JSON.parse(fs.readFileSync(f, "utf8"))); process.exit(r(process.argv[1]) === r(process.argv[2]) ? 0 : 1)' "$T6/s2/proj/.claude/settings.json" "$T6/s2/original.json" \
  || fallo "escenario 4: al desinstalar no quedó el archivo original del usuario"
k6_desinstalar "$T6/s1"
[ ! -e "$T6/s1/proj/.claude/settings.json" ] || fallo "escenario 4: quedó un settings.json que no existía antes"
echo "ok escenario 4: desinstalar devuelve el archivo original (con su Bash(git push *)) o no deja archivo"

# escenario 5: JSON del proyecto inválido: no se toca, se avisa y la instalación no aborta
e="$T6/s5"; nuevo_escenario s5
printf '{"permissions":' > "$e/proj/.claude/settings.json"
cp "$e/proj/.claude/settings.json" "$e/original.json"
k6_instalar "$e"
grep -q "AVISO: no se tocó" "$e/log" || fallo "escenario 5: no se avisó del JSON inválido"
cmp -s "$e/original.json" "$e/proj/.claude/settings.json" || fallo "escenario 5: se tocó un settings.json inválido"
[ "$(k6_deny_lineas "$e" | grep -c .)" = 0 ] || fallo "escenario 5: el manifiesto tiene líneas deny sin haber agregado nada"
k6_desinstalar "$e"
cmp -s "$e/original.json" "$e/proj/.claude/settings.json" || fallo "escenario 5: desinstalar tocó un settings.json inválido"
echo "ok escenario 5: JSON inválido -> no se toca, se avisa, no aborta"

# escenario 6: actualización: un proyecto instalado con las 7 del kit anterior recibe solo las 21 nuevas
e="$T6/s6"; nuevo_escenario s6
k6_instalar "$e"
# estado viejo: quitar del settings.json las 21 nuevas y sus líneas del manifiesto
node -e 'const fs = require("fs"); const f = process.argv[1]; const quitar = process.argv.slice(2); const j = JSON.parse(fs.readFileSync(f, "utf8")); j.permissions.deny = j.permissions.deny.filter((r) => !quitar.includes(r)); fs.writeFileSync(f, JSON.stringify(j, null, 2) + "\n")' "$e/proj/.claude/settings.json" "${REGLAS_DENY_NUEVAS[@]}"
M="$e/home/.flucastr-ai/manifiesto.txt"
for r in "${REGLAS_DENY_NUEVAS[@]}"; do grep -vF $'\t'"$r" "$M" > "$e/manifiesto.tmp" || true; mv "$e/manifiesto.tmp" "$M"; done
[ "$(k6_deny_lineas "$e" | grep -c .)" = 7 ] || fallo "escenario 6: el estado viejo no quedó con 7 líneas deny"
k6_instalar "$e"
node -e 'const fs = require("fs"); const d = JSON.parse(fs.readFileSync(process.argv[1], "utf8")).permissions.deny; const expected = process.argv.slice(2); process.exit(d.length === expected.length && expected.every((r) => d.includes(r)) ? 0 : 1)' "$e/proj/.claude/settings.json" "${REGLAS_DENY[@]}" \
  || fallo "escenario 6: tras reinstalar, las reglas deny no son exactamente las 28 del kit"
[ "$(k6_deny_lineas "$e" | grep -c .)" = 28 ] || fallo "escenario 6: el manifiesto no tiene 28 líneas deny tras reinstalar"
for r in "${REGLAS_DENY_NUEVAS[@]}"; do grep -qF $'\t'"$r" "$M" || fallo "escenario 6: falta en el manifiesto la regla nueva $r"; done
echo "ok escenario 6: actualización de 7 a 28 reglas; se agregan y registran solo las 21 nuevas"

# escenario 7: las 7 reglas eran del usuario (sin manifiesto): se agregan solo 21 y desinstalar deja las 7
e="$T6/s7"; nuevo_escenario s7
cat > "$e/proj/.claude/settings.json" <<'EOF'
{
  "permissions": {
    "deny": ["Read(./.env)", "Read(./.env.*)", "Bash(git commit *)", "Bash(git push *)", "Bash(git merge *)", "Bash(gh pr create *)", "Bash(gh pr merge *)"]
  }
}
EOF
cp "$e/proj/.claude/settings.json" "$e/original.json"
k6_instalar "$e"
node -e 'const fs = require("fs"); const d = JSON.parse(fs.readFileSync(process.argv[1], "utf8")).permissions.deny; const expected = process.argv.slice(2); process.exit(d.length === expected.length && expected.every((r) => d.includes(r)) ? 0 : 1)' "$e/proj/.claude/settings.json" "${REGLAS_DENY[@]}" \
  || fallo "escenario 7: tras instalar, las reglas deny no son exactamente las 28 del kit"
[ "$(k6_deny_lineas "$e" | grep -c .)" = 21 ] || fallo "escenario 7: el manifiesto debe tener solo 21 líneas deny"
for r in "${REGLAS_DENY_NUEVAS[@]}"; do grep -qF $'\t'"$r" "$e/home/.flucastr-ai/manifiesto.txt" || fallo "escenario 7: falta en el manifiesto la regla nueva $r"; done
k6_desinstalar "$e"
node -e 'const fs = require("fs"); const r = (f) => JSON.stringify(JSON.parse(fs.readFileSync(f, "utf8"))); process.exit(r(process.argv[1]) === r(process.argv[2]) ? 0 : 1)' "$e/proj/.claude/settings.json" "$e/original.json" \
  || fallo "escenario 7: desinstalar no dejó las 7 reglas del usuario"
echo "ok escenario 7: las 7 del usuario sin manifiesto -> se agregan 21; desinstalar deja las 7"

paso 6b "matriz negativa de permisos v2 con archivos y reglas ficticios"
node --test pruebas/permisos-v2.test.mjs || fallo "matriz de permisos v2 falló"

