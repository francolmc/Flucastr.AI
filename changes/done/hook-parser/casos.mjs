// Reproducción: llama solo a la función del hook; los comandos son texto y nunca se ejecutan.
// Uso: node changes/done/hook-parser/casos.mjs   (imprime la tabla; el recuento va a stderr)
import { accionProtegida } from "../../../scripts/permissions-hook.mjs";

export const CASOS = [
  // Falsos positivos buscados (solo mencionan).
  ["P1", "cat >> notas.md <<'EOF'\nEl git commit, git push y deploy los hace la persona.\nEOF"],
  ["P2", "cat > notas.md <<EOF\ngh pr create y gh pr merge son de la persona.\nEOF"],
  ["P3", "cat >> notas.md <<-'FIN'\n\tNunca leas .env\n\tFIN"],
  ["P4", "mkdir -p changes/x && cat > changes/x/notes.md <<'EOF'\ngit merge queda para la persona\nEOF"],
  ["P5", "echo \"recuerda: git push lo haces tú\""],
  ["P6", "printf '%s\\n' \"pendiente: deploy\" >> notas.txt"],
  ["P7", "grep -n \"git commit\" AGENTS.md"],
  ["P8", "rg 'gh pr merge' docs"],
  ["P9", "grep -c \".env\" AGENTS.md"],
  ["P10", "cat >> archivo <<'EOF'\ngit commit y git push los hace la persona\nEOF"],
  // Conservadores: mencionan, pero no hay prueba de que sean inertes.
  ["C1", "cat > x.sh <<'EOF'\ngit push\nEOF"],
  ["C2", "cat > .git/hooks/pre-push <<'EOF'\ngit push\nEOF"],
  ["C3", "git log --grep \"merge\""],
  ["C4", "cat >> notas.md <<'EOF'\ntexto: git push\nEOF\nnode otro.mjs"],
  ["C5", "cd docs && cat >> notas.md <<'EOF'\ngit push lo haces tú\nEOF"],
  ["C6", "ls # luego git push"],
  ["C7", "grep -r \".env\" ."],
  ["C8", "grep -n \"git commit\" AGENTS.md > salida.sh"],
  ["C9", "echo \"git push\" > .git/hooks/pre-commit"],
  // Protegidos, forma directa.
  ["N1", "git commit -m x"],
  ["N2", "git push origin main"],
  ["N3", "git merge main"],
  ["N4", "gh pr create --fill"],
  ["N5", "gh pr merge 5"],
  ["N6", "cat .env"],
  ["N7", "bash -c \"git push\""],
  ["N8", "git -C . commit -m x"],
  ["N9", "git -c user.name=x commit -m y"],
  ["N10", "vercel deploy"],
  ["N11", "rm -rf build"],
  // Encadenados y sustituciones.
  ["E1", "ls && git push"],
  ["E2", "false || git commit -m x"],
  ["E3", "true; git merge x"],
  ["E4", "echo x | git commit -F -"],
  ["E5", "echo ok&&git push"],
  ["E6", "true;git commit -m x"],
  ["E7", "(git push)"],
  ["E8", "echo \"$(git push)\""],
  ["E9", "echo `git push`"],
  ["E10", "x=$(git merge main)"],
  ["E11", "x=$(cat .env)"],
  ["E12", "echo $(gh pr create --fill)"],
  ["E13", "echo $(gh pr merge 5)"],
  ["E14", "echo $(bash -c 'git push')"],
  ["E15", "echo $(git -C . push)"],
  ["E16", "echo $(git -c a.b=c commit)"],
  ["E17", "echo $(vercel deploy)"],
  ["E18", "ls && rm -rf build"],
  ["E19", "ls\ngit push"],
  ["E20", "diff <(git push) notas.md"],
  // Ejecutores y heredocs que ejecutan.
  ["X1", "bash <<'EOF'\ngit push\nEOF"],
  ["X2", "cat <<'EOF' | sh\ngit push\nEOF"],
  ["X3", "cat <<EOF > notas.md\n$(git push)\nEOF"],
  ["X4", "cat > x.sh <<'EOF'\ngit push\nEOF\nbash x.sh"],
  ["X5", "cat >> notas.md <<'EOF'\ntexto\nEOF\ngit push"],
  ["X6", "echo \"git push\" | bash"],
  ["X7", "eval \"git push\""],
  ["X8", "ssh host \"git push\""],
  ["X9", "env git push"],
  ["X10", "echo .env | xargs cat"],
  ["X11", "cat $(echo .env)"],
  ["X12", "find . -exec git push \\;"],
  ["X13", "bash <<'EOF'\n/usr/bin/git push\nEOF"],
  // Huecos de ofuscación o de forma.
  ["H1", "cat<.env"],
  ["H2", "cat \".en\"\"v\""],
  ["H3", "/usr/bin/git push"],
  ["H4", "g\\it push"],
  ["H5", "gh -R o/r pr create"],
  ["H6", "git -c alias.ci=commit ci -m x"],
  ["H7", "bash -c ls"],
  ["H8", "sh -c 'cat .env'"],
  ["H9", "zsh -c ls"],
  ["H10", "$(echo git) push"],
  ["H11", "x=git; $x push"],
  ["H12", "git $sub origin"],
  ["H13", "env /usr/bin/git push"],
  // Intérprete con -c: se evalúa lo de dentro.
  ["B1", "bash -lc 'git push'"],
  ["B2", "sh -c \"$cmd\""],
  ["B3", "bash -c 'ls && git merge x'"],
  ["B4", "bash -c 'bash -c \"git push\"'"],
  ["B5", "zsh -c 'cat .env'"],
  ["B6", "eval \"$cmd\""],
  // Sin cambio buscado.
  ["S1", "git -C . status"],
  ["S2", "git -c core.quotepath=off diff"],
  ["S3", "grep -n x AGENTS.md | head -5"],
  ["S4", "for f in a b; do wc -l \"$f\"; done"],
  ["S5", "npm run deploy:prod"],
  ["S6", "docker push imagen"],
  // Uso común que no debe empezar a preguntar.
  ["R1", "if [ -f a ]; then wc -l a; fi"],
  ["R2", "echo \"${HOME}/x\" 2>&1 | head"],
  ["R3", "n=$(ls | wc -l); echo \"$n\""],
  ["R4", "while read -r f; do echo \"$f\"; done < lista.txt"],
  ["R5", "find . -name '*.md' -exec grep -l x {} \\;"],
  ["R6", "[[ -d docs ]] && ls docs"],
  // No analizables.
  ["U1", "echo \"sin cerrar"],
  ["U2", "cat <<'EOF'\ngit push"],
  ["U3", "case x in a) ls ;; esac"],
];

// Decisión propuesta (pendiente de aprobación): todo lo no listado queda en deny.
const NORMAL = new Set("P1 P2 P3 P4 P5 P6 P7 P8 P9 E18 H7 H9 S1 S2 S3 S4 S5 S6 R1 R2 R3 R4 R5 R6".split(" "));
const ASK = new Set("H10 H11 H12 B2 B6 U1 U3".split(" "));
export const propuesta = (id) => (NORMAL.has(id) ? "normal" : ASK.has(id) ? "ask" : "deny");

if (process.argv[1]?.endsWith("casos.mjs")) {
  const celda = (c) => `<code>${c.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll("|", "&#124;").replaceAll("`", "&#96;").replaceAll("\\", "&#92;").replaceAll("*", "&#42;")
    .replaceAll("$", "&#36;").replaceAll("\n", "⏎").replaceAll("\t", "⇥")}</code>`;
  console.log("# Decisiones del hook: antes y después\n");
  console.log("`normal`: el hook no decide (rigen los permisos de Claude Code y las reglas deny, que no cambian). `⏎`: salto de línea. En negrita, lo que cambia. «Hoy» está medido con la función actual; «Propuesta» aún no está implementada.\n");
  console.log("| Id | Comando | Hoy | Propuesta |\n|---|---|---|---|");
  const cuenta = {};
  for (const [id, c] of CASOS) {
    const hoy = accionProtegida(c) ? "deny" : "normal";
    const despues = propuesta(id);
    (cuenta[`${hoy}→${despues}`] ??= []).push(id);
    console.log(`| ${id} | ${celda(c)} | ${hoy} | ${hoy === despues ? despues : `**${despues}**`} |`);
  }
  console.error(`casos: ${CASOS.length}`);
  for (const [k, v] of Object.entries(cuenta)) console.error(`${k} (${v.length}): ${v.join(" ")}`);
}
