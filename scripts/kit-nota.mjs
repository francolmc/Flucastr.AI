#!/usr/bin/env node
// Anota un evento del builder en changes/<nombre>/progress.jsonl. Solo anexa: nunca edita líneas existentes.
// Uso: node scripts/kit-nota.mjs <plan> blocked|bloqueo "<causa>"   → evento bloqueo
//      node scripts/kit-nota.mjs <plan> doing|nota "<paso>"          → evento nota
// El texto se redacta y se trunca (160). Salida: 0 si anexó; 1 si no pudo escribir; 2 si los argumentos no son válidos.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { anexar, evento } from "../tools/progress/eventos.mjs";
import { frontmatter } from "../tools/run/plan.mjs";

const TIPO = { blocked: "bloqueo", bloqueo: "bloqueo", doing: "nota", nota: "nota" };

function uso(msg) {
  process.stderr.write(`kit-nota: ${msg}\nUso: node scripts/kit-nota.mjs <plan> blocked|bloqueo "<causa>" | doing|nota "<paso>"\n`);
  process.exit(2);
}

const [plan, clase, ...resto] = process.argv.slice(2);
if (!plan || !clase) uso("faltan argumentos");
const tipo = TIPO[clase];
if (!tipo) uso(`clase desconocida: ${clase} (usa blocked o doing)`);
const texto = resto.join(" ").trim();
if (!texto) uso("falta el texto");

const planPath = resolve(process.cwd(), plan);
if (!existsSync(planPath)) uso(`no existe el plan: ${planPath}`);

const meta = frontmatter(readFileSync(planPath, "utf8"));
const seg = /^\d+$/.test(meta.segment ?? "") ? Number(meta.segment) : meta.segment || null;
const ruta = join(dirname(planPath), "progress.jsonl");

if (!anexar(ruta, evento(tipo, { seg, o: "builder", texto }))) process.exit(1);
process.stdout.write(`kit-nota: ${tipo} anotado en ${ruta}\n`);
