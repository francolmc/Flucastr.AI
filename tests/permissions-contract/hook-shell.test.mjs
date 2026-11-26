import assert from "node:assert/strict";
import { test } from "node:test";
import { analizar } from "../../scripts/hook-shell.mjs";

// Las cadenas de prueba son datos: nunca se ejecutan.

function textos(palabras) {
  return palabras.map((p) => p.texto).join(" ");
}

function nodos(texto) {
  const r = analizar(texto);
  assert.equal(r.ok, true, `debía analizarse: ${JSON.stringify(texto)} (${r.motivo ?? ""})`);
  return r.comandos;
}

// A1: nodos, palabras, redirecciones, heredocs y `plano`

test("A1: un comando dentro de comillas dobles es nodo y el texto citado no es comando", () => {
  const r = analizar('echo "$(git push)"');
  assert.equal(r.ok, true);
  assert.equal(r.plano, false);
  assert.equal(r.comandos.length, 2);
  assert.equal(r.comandos[0].palabras[0].texto, "echo");
  assert.equal(textos(r.comandos[1].palabras), "git push");
});

test("A1: heredoc citado con cuerpo que menciona un comando no crea nodo", () => {
  const r = analizar("cat >> a.md <<'EOF'\ngit push\nEOF\n");
  assert.equal(r.ok, true);
  assert.equal(r.comandos.length, 1);
  assert.equal(r.comandos[0].palabras[0].texto, "cat");
  assert.equal(r.comandos[0].redirecciones.length, 1);
  assert.equal(r.comandos[0].redirecciones[0].op, ">>");
  assert.equal(r.comandos[0].redirecciones[0].destino.texto, "a.md");
  assert.equal(r.comandos[0].heredocs.length, 1);
  assert.equal(r.comandos[0].heredocs[0].citado, true);
  assert.equal(r.comandos[0].heredocs[0].cuerpo.trim(), "git push");
});

test("A1: heredoc sin comillas con sustitución crea nodos para la sustitución", () => {
  const r = analizar("cat <<EOF\n$(git push)\nEOF\n");
  assert.equal(r.ok, true);
  assert.equal(r.comandos.length, 2);
  assert.equal(r.comandos[0].heredocs[0].citado, false);
  assert.equal(textos(r.comandos[1].palabras), "git push");
});

test("A1: el delimitador con barra invertida cuenta como citado", () => {
  const r = analizar("cat <<\\EOF\ngit push\nEOF\n");
  assert.equal(r.ok, true);
  assert.equal(r.comandos.length, 1);
  assert.equal(r.comandos[0].heredocs[0].citado, true);
});

test("A1: varios heredocs en una línea se cuentan todos", () => {
  const r = analizar("cat <<A <<B\nx\nA\ny\nB\n");
  assert.equal(r.ok, true);
  assert.equal(r.comandos.length, 1);
  assert.equal(r.comandos[0].heredocs.length, 2);
});

test("A1: palabras con comillas y barras se unen sin separador", () => {
  const r = nodos('cat ".en""v" g\\it');
  assert.equal(r[0].palabras[1].texto, ".env");
  assert.equal(r[0].palabras[2].texto, "git");
});

test("A1: expansiones y globs se clasifican", () => {
  const [n] = nodos("echo $HOME *.md {a,b} {1..3} ~ '*' [ [[ {}");
  const [, home, md, llaves, rango, tilde, comillas, corchete, dobleCorchete, llavesVacias] = n.palabras;
  assert.equal(home.expansion, true);
  assert.equal(md.glob, true);
  assert.equal(llaves.glob, true);
  assert.equal(rango.glob, true);
  assert.equal(tilde.glob, true);
  assert.equal(comillas.glob, false);
  assert.equal(corchete.glob, false);
  assert.equal(dobleCorchete.glob, false);
  assert.equal(llavesVacias.glob, false);
});

test("A1: baseDinamica es la expansión o glob tras la última barra literal", () => {
  const [n] = nodos("cp src/$DIR/*.md destino/fijo/x");
  assert.equal(n.palabras[1].baseDinamica, true);
  assert.equal(n.palabras[2].baseDinamica, false);
});

test("A1: operadores separan nodos", () => {
  const r = nodos("a; b && c || d | e |& f & g\nh");
  assert.deepEqual(r.map((c) => c.palabras[0].texto), ["a", "b", "c", "d", "e", "f", "g", "h"]);
});

test("A1: redirecciones con descriptor y here-string", () => {
  const [n] = nodos("cmd 2>&1 &>out <<< texto");
  assert.equal(n.redirecciones[0].op, ">&");
  assert.equal(n.redirecciones[0].destino.texto, "1");
  assert.equal(n.redirecciones[1].op, "&>");
  assert.equal(n.redirecciones[2].op, "<<<");
  assert.equal(n.redirecciones[2].destino.texto, "texto");
});

test("A1: palabras reservadas en posición de comando; el encabezado de for no es nodo", () => {
  const r = analizar("if true; then rm x; fi");
  assert.equal(r.ok, true);
  assert.equal(r.plano, false);
  assert.deepEqual(r.comandos.map((c) => c.palabras[0].texto), ["true", "rm"]);
  const f = analizar("for i in a b; do echo $i; done");
  assert.equal(f.ok, true);
  assert.deepEqual(f.comandos.map((c) => c.palabras[0].texto), ["echo"]);
});

test("A1: [[ ... ]] es un solo nodo con sus operadores como palabras", () => {
  const r = analizar("[[ -f x && y ]]");
  assert.equal(r.ok, true);
  assert.equal(r.comandos.length, 1);
  assert.equal(r.comandos[0].palabras[0].texto, "[[");
  assert.ok(r.comandos[0].palabras.some((p) => p.texto === "&&"));
  assert.equal(r.plano, false);
});

test("A1: redirecciones tras done dan un nodo sin palabras", () => {
  const r = analizar("while true; do :; done > out");
  assert.equal(r.ok, true);
  const vacio = r.comandos.find((c) => c.palabras.length === 0);
  assert.ok(vacio, "debe haber un nodo sin palabras");
  assert.equal(vacio.redirecciones[0].op, ">");
});

test("A1: # al inicio de palabra es comentario; dentro de una palabra no", () => {
  const c = analizar("ls # rm -rf");
  assert.equal(c.ok, true);
  assert.equal(c.plano, false);
  assert.deepEqual(c.comandos.map((n) => textos(n.palabras)), ["ls"]);
  const d = nodos("echo a#b");
  assert.equal(d[0].palabras[1].texto, "a#b");
});

test("A1: barra invertida y salto de línea unen la línea", () => {
  const [n] = nodos("git \\\npush");
  assert.equal(textos(n.palabras), "git push");
});

test("A1: plano es verdadero solo sin estructuras compuestas, sustituciones, aritmética ni comentarios", () => {
  assert.equal(analizar("ls -la").plano, true);
  assert.equal(analizar("ls; pwd").plano, true);
  assert.equal(analizar("(ls)").plano, false);
  assert.equal(analizar("echo $(ls)").plano, false);
  assert.equal(analizar("echo $((1+2))").plano, false);
  assert.equal(analizar("{ ls; }").plano, false);
});

test("A1: asignaciones se separan de las palabras", () => {
  const [n] = nodos("FOO=bar BAZ=1 env");
  assert.equal(n.palabras.length, 1);
  assert.equal(n.palabras[0].texto, "env");
  assert.equal(n.asignaciones.length, 2);
});

// A2: formas no soportadas o rotas devuelven ok: false sin lanzar

test("A2: formas no soportadas devuelven ok false", () => {
  const casos = [
    "case x in x) ls;; esac",
    "select a in b; do ls; done",
    "coproc ls",
    "f() { ls; }",
    "x=(1 2)",
    "((1))",
    "ls;;",
  ];
  for (const c of casos) {
    const r = analizar(c);
    assert.equal(r.ok, false, `debía ser ok false: ${c}`);
    assert.equal(typeof r.motivo, "string");
  }
});

test("A2: texto roto devuelve ok false", () => {
  const casos = ['echo "abc', "echo $(ls", "cat <<EOF\nlínea", "(ls", "if true; then ls", "ls ) "];
  for (const c of casos) {
    assert.equal(analizar(c).ok, false, `debía ser ok false: ${c}`);
  }
});

test("A2: profundidad mayor de 10 devuelve ok false y 10 se acepta", () => {
  const dentro = "$(".repeat(10) + "ls" + ")".repeat(10);
  const fuera = "$(".repeat(11) + "ls" + ")".repeat(11);
  assert.equal(analizar(dentro).ok, true);
  assert.equal(analizar(fuera).ok, false);
});

test("A2: 20000 $( anidados devuelven ok false sin lanzar", () => {
  const r = analizar("$(".repeat(20000));
  assert.equal(r.ok, false);
});

test("A2: longitud mayor de 100000 devuelve ok false", () => {
  assert.equal(analizar("a".repeat(100001)).ok, false);
  assert.equal(analizar("a".repeat(100000)).ok, true);
});

test("A2: entradas no textuales devuelven ok false sin lanzar", () => {
  assert.equal(analizar(null).ok, false);
  assert.equal(analizar(undefined).ok, false);
});

test("A2: cualquier truncado de una cadena rica no lanza y los cortes dentro de comillas, sustituciones o heredocs dan ok false", () => {
  const completa = 'echo "$(git push)" && cat <<EOF\nx\nEOF\n';
  for (let i = 0; i <= completa.length; i++) {
    const trozo = completa.slice(0, i);
    assert.doesNotThrow(() => analizar(trozo), `lanzó con prefijo ${i}`);
  }
  assert.equal(analizar('echo "$(git').ok, false);
  assert.equal(analizar("cat <<EOF\nx").ok, false);
});

// Casos devueltos por el planner (Revisión 1): la forma no es demostrablemente inerte

test("A2: barra y salto sin blanco antes, `$[` y subíndices en asignación o comando dan ok false", () => {
  const casos = [
    "cat <<EOF\nEO\\\nF\ngit push\nEOF\n",
    "cat <<-EOF\n\tEO\\\nF\ngit push\n\tEOF\n",
    "cat <<\\\n-A\nx\nA\ngit push\n-A\n",
    'echo "$\\\n(git push)"\n',
    "cat <<A >a.md\n$\\\n(git push)\nA\n",
    "echo a\\\nb",
    "echo $[1<<2]\ngit push\n2]\n",
    "echo $[ x<<E ]\ngit push\nE\n",
    "echo $[1]",
    "a[1<<2]=3\ngit push\n2]=3\n",
    "a[ 1 << 2 ]=3\ngit push\n2\n",
    "X=1 a[1<<2]=3\ngit push\n2]=3\n",
    "a[1]=3",
  ];
  for (const c of casos) {
    assert.equal(analizar(c).ok, false, `debía ser ok false: ${JSON.stringify(c)}`);
  }
});

test("A1: el cuerpo de un heredoc citado conserva la barra invertida y el salto de línea", () => {
  const r = analizar("cat <<'EOF'\nEO\\\nF\ngit push\nEOF\n");
  assert.equal(r.ok, true);
  assert.equal(r.comandos.length, 1);
  assert.equal(r.comandos[0].heredocs[0].cuerpo, "EO\\\nF\ngit push\n");
});
