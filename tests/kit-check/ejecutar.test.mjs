// Pruebas de ejecutarFila (segmento 2, A1–A5). Sin shell; cada caso usa node -e o un archivo testigo en un directorio temporal.
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { ejecutarFila } from "../../tools/check/ejecutar.mjs";

const dir = mkdtempSync(join(tmpdir(), "ejecutar-"));
after(() => rmSync(dir, { recursive: true, force: true }));

const MS = 5000;
const fila = (esperado, comando, extra = {}) => ({ id: "A1", esperado, comando, ...extra });

test("pasa: código esperado exit 3 da pasa (A1)", () => {
  const r = ejecutarFila(fila("exit 3", 'node -e "process.exit(3)"'), { timeoutMs: MS });
  assert.equal(r.estado, "pasa");
  assert.equal(r.codigo, 3);
  assert.equal(r.comando, 'node -e "process.exit(3)"');
});

test("pasa: contiene «listo» con una salida que lo incluye (A1)", () => {
  const r = ejecutarFila(fila("contiene «listo»", `node -e "console.log('listo')"`), { timeoutMs: MS });
  assert.equal(r.estado, "pasa");
});

test("falla: otro código da falla con el código real (A2)", () => {
  const r = ejecutarFila(fila("exit 0", 'node -e "process.exit(2)"'), { timeoutMs: MS });
  assert.equal(r.estado, "falla");
  assert.equal(r.codigo, 2);
});

test("falla: el tiempo agotado da falla con motivo de tiempo (A2)", () => {
  const r = ejecutarFila(fila("exit 0", 'node -e "setTimeout(() => {}, 10000)"'), { timeoutMs: 300 });
  assert.equal(r.estado, "falla");
  assert.match(r.motivo, /tiempo/);
});

test("bloqueado: acción protegida no se ejecuta (A3)", () => {
  const testigo = join(dir, "protegido.txt");
  writeFileSync(testigo, "x");
  const r = ejecutarFila(fila("exit 0", `rm ${testigo}`, { cwd: dir }), { timeoutMs: MS });
  assert.equal(r.estado, "bloqueado");
  assert.equal(r.comando, `rm ${testigo}`);
  assert.equal(existsSync(testigo), true);
});

test("bloqueado: git commit no se ejecuta (A3)", () => {
  const r = ejecutarFila(fila("exit 0", "git commit -m x", { cwd: dir }), { timeoutMs: MS });
  assert.equal(r.estado, "bloqueado");
});

test("bloqueado: operador de shell no se ejecuta (A3)", () => {
  const testigo = join(dir, "operador.txt");
  const comando = `node -e "require('fs').writeFileSync('${testigo}', 'x')" | cat`;
  const r = ejecutarFila(fila("exit 0", comando, { cwd: dir }), { timeoutMs: MS });
  assert.equal(r.estado, "bloqueado");
  assert.equal(existsSync(testigo), false);
});

test("ambiguo: esperado no automatizable da no-automatizable sin ejecutar (A4)", () => {
  const testigo = join(dir, "ambiguo.txt");
  const comando = `node -e "require('fs').writeFileSync('${testigo}', 'x')"`;
  const r = ejecutarFila(fila("debe quedar bien a ojo", comando, { cwd: dir }), { timeoutMs: MS });
  assert.equal(r.estado, "no-automatizable");
  assert.equal(existsSync(testigo), false);
});

test("ambiguo: falta comando da no-automatizable (A4)", () => {
  const r = ejecutarFila(fila("exit 0", null), { timeoutMs: MS });
  assert.equal(r.estado, "no-automatizable");
});

test("salida: redactada y recortada a la cola de 20 líneas (A5)", () => {
  const codigo = "for (let i = 1; i <= 30; i++) console.log(i === 30 ? 'API_KEY=supersecreto123' : 'linea ' + i)";
  const r = ejecutarFila(fila("exit 0", `node -e "${codigo}"`, { cwd: dir }), { timeoutMs: MS });
  assert.equal(r.estado, "pasa");
  const lineas = r.salida.split("\n");
  assert.equal(lineas.length, 20);
  assert.equal(lineas[0], "linea 11");
  assert.equal(lineas[19], "API_KEY=[redactado]");
  assert.equal(r.salida.includes("supersecreto123"), false);
});

test("salida: una línea enorme se trunca con puntos suspensivos (A5)", () => {
  const r = ejecutarFila(fila("exit 0", `node -e "console.log('x'.repeat(5000))"`, { cwd: dir }), { timeoutMs: MS });
  assert.equal(r.estado, "pasa");
  assert.ok(r.salida.length <= 2000);
  assert.ok(r.salida.endsWith("…"));
});
