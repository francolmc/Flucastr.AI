import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluar } from "../../scripts/hook-decidir.mjs";
import { accionProtegida, esSecreto } from "../../scripts/permissions-hook.mjs";

// Las cadenas de prueba son datos: nunca se ejecutan.
// La tabla es una copia estática de la propuesta aprobada (valores esperados incluidos).
// No se importa nada de changes/.
const TABLA = [
  ["P1", "cat >> notas.md <<'EOF'\nEl git commit, git push y deploy los hace la persona.\nEOF", "normal"],
  ["P2", "cat > notas.md <<EOF\ngh pr create y gh pr merge son de la persona.\nEOF", "normal"],
  ["P3", "cat >> notas.md <<-'FIN'\n\tNunca leas .env\n\tFIN", "normal"],
  ["P4", "mkdir -p changes/x && cat > changes/x/notes.md <<'EOF'\ngit merge queda para la persona\nEOF", "normal"],
  ["P5", "echo \"recuerda: git push lo haces tú\"", "normal"],
  ["P6", "printf '%s\\n' \"pendiente: deploy\" >> notas.txt", "normal"],
  ["P7", "grep -n \"git commit\" AGENTS.md", "normal"],
  ["P8", "rg 'gh pr merge' docs", "normal"],
  ["P9", "grep -c \".env\" AGENTS.md", "normal"],
  ["P10", "cat >> archivo <<'EOF'\ngit commit y git push los hace la persona\nEOF", "deny"],
  ["C1", "cat > x.sh <<'EOF'\ngit push\nEOF", "deny"],
  ["C2", "cat > .git/hooks/pre-push <<'EOF'\ngit push\nEOF", "deny"],
  ["C3", "git log --grep \"merge\"", "deny"],
  ["C4", "cat >> notas.md <<'EOF'\ntexto: git push\nEOF\nnode otro.mjs", "deny"],
  ["C5", "cd docs && cat >> notas.md <<'EOF'\ngit push lo haces tú\nEOF", "deny"],
  ["C6", "ls # luego git push", "deny"],
  ["C7", "grep -r \".env\" .", "deny"],
  ["C8", "grep -n \"git commit\" AGENTS.md > salida.sh", "deny"],
  ["C9", "echo \"git push\" > .git/hooks/pre-commit", "deny"],
  ["N1", "git commit -m x", "deny"],
  ["N2", "git push origin main", "deny"],
  ["N3", "git merge main", "deny"],
  ["N4", "gh pr create --fill", "deny"],
  ["N5", "gh pr merge 5", "deny"],
  ["N6", "cat .env", "deny"],
  ["N7", "bash -c \"git push\"", "deny"],
  ["N8", "git -C . commit -m x", "deny"],
  ["N9", "git -c user.name=x commit -m y", "deny"],
  ["N10", "vercel deploy", "deny"],
  ["N11", "rm -rf build", "deny"],
  ["E1", "ls && git push", "deny"],
  ["E2", "false || git commit -m x", "deny"],
  ["E3", "true; git merge x", "deny"],
  ["E4", "echo x | git commit -F -", "deny"],
  ["E5", "echo ok&&git push", "deny"],
  ["E6", "true;git commit -m x", "deny"],
  ["E7", "(git push)", "deny"],
  ["E8", "echo \"$(git push)\"", "deny"],
  ["E9", "echo `git push`", "deny"],
  ["E10", "x=$(git merge main)", "deny"],
  ["E11", "x=$(cat .env)", "deny"],
  ["E12", "echo $(gh pr create --fill)", "deny"],
  ["E13", "echo $(gh pr merge 5)", "deny"],
  ["E14", "echo $(bash -c 'git push')", "deny"],
  ["E15", "echo $(git -C . push)", "deny"],
  ["E16", "echo $(git -c a.b=c commit)", "deny"],
  ["E17", "echo $(vercel deploy)", "deny"],
  ["E18", "ls && rm -rf build", "normal"],
  ["E19", "ls\ngit push", "deny"],
  ["E20", "diff <(git push) notas.md", "deny"],
  ["X1", "bash <<'EOF'\ngit push\nEOF", "deny"],
  ["X2", "cat <<'EOF' | sh\ngit push\nEOF", "deny"],
  ["X3", "cat <<EOF > notas.md\n$(git push)\nEOF", "deny"],
  ["X4", "cat > x.sh <<'EOF'\ngit push\nEOF\nbash x.sh", "deny"],
  ["X5", "cat >> notas.md <<'EOF'\ntexto\nEOF\ngit push", "deny"],
  ["X6", "echo \"git push\" | bash", "deny"],
  ["X7", "eval \"git push\"", "deny"],
  ["X8", "ssh host \"git push\"", "deny"],
  ["X9", "env git push", "deny"],
  ["X10", "echo .env | xargs cat", "deny"],
  ["X11", "cat $(echo .env)", "deny"],
  ["X12", "find . -exec git push \\;", "deny"],
  ["X13", "bash <<'EOF'\n/usr/bin/git push\nEOF", "deny"],
  ["H1", "cat<.env", "deny"],
  ["H2", "cat \".en\"\"v\"", "deny"],
  ["H3", "/usr/bin/git push", "deny"],
  ["H4", "g\\it push", "deny"],
  ["H5", "gh -R o/r pr create", "deny"],
  ["H6", "git -c alias.ci=commit ci -m x", "deny"],
  ["H7", "bash -c ls", "normal"],
  ["H8", "sh -c 'cat .env'", "deny"],
  ["H9", "zsh -c ls", "normal"],
  ["H10", "$(echo git) push", "ask"],
  ["H11", "x=git; $x push", "ask"],
  ["H12", "git $sub origin", "ask"],
  ["H13", "env /usr/bin/git push", "deny"],
  ["B1", "bash -lc 'git push'", "deny"],
  ["B2", "sh -c \"$cmd\"", "ask"],
  ["B3", "bash -c 'ls && git merge x'", "deny"],
  ["B4", "bash -c 'bash -c \"git push\"'", "deny"],
  ["B5", "zsh -c 'cat .env'", "deny"],
  ["B6", "eval \"$cmd\"", "ask"],
  ["S1", "git -C . status", "normal"],
  ["S2", "git -c core.quotepath=off diff", "normal"],
  ["S3", "grep -n x AGENTS.md | head -5", "normal"],
  ["S4", "for f in a b; do wc -l \"$f\"; done", "normal"],
  ["S5", "npm run deploy:prod", "normal"],
  ["S6", "docker push imagen", "normal"],
  ["R1", "if [ -f a ]; then wc -l a; fi", "normal"],
  ["R2", "echo \"${HOME}/x\" 2>&1 | head", "normal"],
  ["R3", "n=$(ls | wc -l); echo \"$n\"", "normal"],
  ["R4", "while read -r f; do echo \"$f\"; done < lista.txt", "normal"],
  ["R5", "find . -name '*.md' -exec grep -l x {} \\;", "normal"],
  ["R6", "[[ -d docs ]] && ls docs", "normal"],
  ["U1", "echo \"sin cerrar", "ask"],
  ["U2", "cat <<'EOF'\ngit push", "deny"],
  ["U3", "case x in a) ls ;; esac", "ask"],
];

const decidir = (comando) => evaluar(comando, { textual: accionProtegida, secreto: esSecreto });

// A3: la decisión sigue la tabla aprobada

test("A3: cada caso de la tabla recibe la decisión aprobada", () => {
  const fallos = [];
  for (const [id, comando, esperado] of TABLA) {
    const obtenido = decidir(comando);
    if (obtenido !== esperado) fallos.push(`${id}: esperado ${esperado}, obtenido ${obtenido}`);
  }
  assert.equal(fallos.length, 0, fallos.join("\n"));
});

test("A3: solo P1–P9 dejan de bloquearse frente a la regla textual actual", () => {
  const aliviados = TABLA.filter(([, c]) => accionProtegida(c) && decidir(c) !== "deny").map(([id]) => id);
  assert.equal(aliviados.join(" "), "P1 P2 P3 P4 P5 P6 P7 P8 P9");
});

test("A3: un comando sin acción protegida y sin nada peligroso sigue normal", () => {
  assert.equal(evaluar("ls", { textual: accionProtegida, secreto: esSecreto }), "normal");
});

// A4: una acción protegida se deniega sola o dentro de cualquier forma de encadenado

const PROTEGIDAS = [
  "git commit -m x",
  "git push origin main",
  "git merge main",
  "gh pr create --fill",
  "gh pr merge 5",
  "cat .env",
  "bash -c 'git push'",
  "git -C . push",
  "git -c a.b=c commit -m x",
  "vercel deploy",
];

const ENVOLTURAS = [
  (c) => c,
  (c) => `ls && ${c}`,
  (c) => `false || ${c}`,
  (c) => `true; ${c}`,
  (c) => `ls | ${c}`,
  (c) => `ls\n${c}`,
  (c) => `ls&&${c}`,
  (c) => `echo $(${c})`,
  (c) => `echo "$(${c})"`,
  (c) => `echo \`${c}\``,
  (c) => `(${c})`,
  (c) => `diff <(${c}) notas.md`,
];

test("A4: cada acción protegida se deniega sola y encadenada, sustituida o agrupada", () => {
  const fallos = [];
  for (const protegida of PROTEGIDAS) {
    for (const envolver of ENVOLTURAS) {
      const comando = envolver(protegida);
      const d = decidir(comando);
      if (d !== "deny") fallos.push(`${JSON.stringify(comando)} → ${d}`);
    }
  }
  assert.equal(fallos.length, 0, fallos.join("\n"));
});

// A5: un fallo de análisis o de una función inyectada nunca da normal

const NO_ANALIZABLES = [
  'echo "sin cerrar',
  "cat <<'EOF'\ngit push",
  "case x in a) ls ;; esac",
  "if true; then ls",
  "echo ${",
  "ls &&",
  "a[1]=3",
];

test("A5: un análisis fallido nunca da normal", () => {
  for (const comando of NO_ANALIZABLES) {
    const d = decidir(comando);
    assert.notEqual(d, "normal", `${JSON.stringify(comando)} no debe ser normal`);
  }
});

test("A5: si textual lanza, la decisión no es normal", () => {
  const lanza = () => {
    throw new Error("fallo inyectado");
  };
  assert.notEqual(evaluar("ls", { textual: lanza, secreto: esSecreto }), "normal");
  assert.notEqual(evaluar("cat notas.md", { textual: lanza, secreto: esSecreto }), "normal");
});

test("A5: si secreto lanza, la decisión no es normal", () => {
  const lanza = () => {
    throw new Error("fallo inyectado");
  };
  assert.notEqual(evaluar("grep -c x AGENTS.md", { textual: accionProtegida, secreto: lanza }), "normal");
  assert.notEqual(evaluar("cat notas.md", { textual: accionProtegida, secreto: lanza }), "normal");
  assert.notEqual(evaluar("ls && git push", { textual: accionProtegida, secreto: lanza }), "normal");
});

// Casos devueltos en la revisión 2 del planner (A3, A4). Cadenas de datos: no se ejecutan.
const DEVUELTOS = [
  ["grep con patrón .env sobre carpeta", 'grep ".env" .', "deny"],
  ["grep con patrón .env sin ruta", 'grep ".env"', "deny"],
  ["grep -c con patrón .env sobre config", 'grep -c ".env" config', "deny"],
  ["rg con patrón .env sobre carpeta", 'rg ".env" docs', "deny"],
  ["grep -c con acción protegida sobre carpeta", 'grep -c "git push" .', "deny"],
  ["env bash -c con barra en la acción", "env bash -c 'g\\it push'", "deny"],
  ["find -exec sh -c con git push", "find . -exec sh -c '/usr/bin/git push' \\;", "deny"],
  ["command eval con git push", 'command eval "/usr/bin/git push"', "deny"],
  ["bash -o pipefail -c con git push", "bash -o pipefail -c '/usr/bin/git push'", "deny"],
  ["sudo gh pr create", "sudo /usr/bin/gh pr create", "deny"],
  ["timeout sh -c con expansión", 'timeout 5 sh -c "$cmd"', "ask"],
  ["bash -O extglob -c con expansión", 'bash -O extglob -c "$cmd"', "ask"],
  ["escritura a .md absoluta sin segmento oculto", 'echo "git push" > /home/u/p/notas.md', "normal"],
  ["escritura a .md absoluta con segmento oculto", 'echo "git push" > /home/u/.git/x.md', "deny"],
  ["escritura absoluta a extensión no textual", 'echo "git push" > /home/u/p/notas.sh', "deny"],
];

for (const [nombre, comando, esperado] of DEVUELTOS) {
  test(`A3/A4 devuelto: ${nombre}`, () => {
    assert.equal(decidir(comando), esperado, JSON.stringify(comando));
  });
}
