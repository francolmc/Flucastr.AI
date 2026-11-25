// Pruebas del detector de builder pegado (tools/run/pegado.mjs) y del paso asíncrono (tools/run/process.mjs).
// Casos A1–A8 de changes/kit-run-pegado/plan.md. Sin red, sin CLIs reales, funciones puras salvo A6–A8
// que lanzan procesos `node -e` cortos con tiempos pequeños.

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { configuracion, evaluarPegado } from "../../tools/run/pegado.mjs";
import { correr, correrVigilado } from "../../tools/run/process.mjs";

const AHORA = Date.parse("2026-11-25T12:00:00.000Z");
const hace = (minutos) => new Date(AHORA - minutos * 60 * 1000).toISOString();
const inicio = (minutos, cmd, id = null) => ({ t: hace(minutos), tipo: "comando_iniciado", cmd, id });
const fin = (minutos, id = null) => ({ t: hace(minutos), tipo: "comando_terminado", id, exit: 0 });
const avance = (minutos, tipo = "fingerprint_cambió") => ({ t: hace(minutos), tipo });

const config = configuracion({});
const evaluar = (eventos, extra = {}) => evaluarPegado(eventos, { ahora: AHORA, config, ...extra });

describe("configuracion", () => {
  test("defaults: observar, 20 min, 6, 10, 30 s, arranque 5 min", () => {
    const c = configuracion({});
    assert.equal(c.modo, "observar");
    assert.equal(c.sinAvanceMs, 20 * 60 * 1000);
    assert.equal(c.repetidos, 6);
    assert.equal(c.sondeos, 10);
    assert.equal(c.intervaloMs, 30 * 1000);
    assert.equal(c.arranqueMs, 5 * 60 * 1000);
  });

  test("KIT_RUN_PEGADO=0 apaga; cortar y umbrales por variable", () => {
    assert.equal(configuracion({ KIT_RUN_PEGADO: "0" }).modo, "apagado");
    assert.equal(configuracion({ KIT_RUN_PEGADO: "cortar" }).modo, "cortar");
    const c = configuracion({ KIT_RUN_PEGADO_REPETIDOS: "4", KIT_RUN_PEGADO_LARGOS: "pnpm e2e, make all" });
    assert.equal(c.repetidos, 4);
    assert.deepEqual(c.largos, ["pnpm e2e", "make all"]);
  });
});

describe("evaluarPegado", () => {
  test("A1 avance reciente dentro del umbral es ok", () => {
    const eventos = [inicio(30, "npm test"), fin(30), avance(2), inicio(1, "git status")];
    const r = evaluar(eventos);
    assert.equal(r.estado, "ok");
    assert.equal(r.patron, null);
  });

  test("A2 20 min sin avance con comandos no declarados es pegado sin_avance; 19 min es ok", () => {
    const comunes = [inicio(24, "npm test"), inicio(22, "git status"), inicio(21, "rg foo")];
    const pegado = evaluar([avance(25), ...comunes]);
    assert.equal(pegado.estado, "pegado");
    assert.equal(pegado.patron, "sin_avance");
    const ok = evaluar([avance(19), ...comunes]);
    assert.equal(ok.estado, "ok");
  });

  test("A3 seis repeticiones o diez sondeos seguidos cortan; cinco o nueve no", () => {
    const repetidos6 = [avance(10), ...[9, 8, 7, 6, 5, 4].map((m, i) => inicio(m, `node run.js --n ${i + 1}`))];
    const r6 = evaluar(repetidos6);
    assert.equal(r6.estado, "pegado");
    assert.equal(r6.patron, "comando_repetido");

    const repetidos5 = [avance(10), ...[9, 8, 7, 6, 5].map((m, i) => inicio(m, `node run.js --n ${i + 1}`))];
    assert.equal(evaluar(repetidos5).estado, "ok");

    const sondeo = (i) => (i % 2 ? "tail -n 20 build.log" : "sleep 30");
    const sondeos10 = [avance(8), ...Array.from({ length: 10 }, (_, i) => inicio(7 - i * 0.5, sondeo(i)))];
    const s10 = evaluar(sondeos10);
    assert.equal(s10.estado, "pegado");
    assert.equal(s10.patron, "sondeos");

    const sondeos9 = [avance(8), ...Array.from({ length: 9 }, (_, i) => inicio(7 - i * 0.5, sondeo(i)))];
    assert.equal(evaluar(sondeos9).estado, "ok");
  });

  test("A4 un comando declarado largo en curso exime hasta su tope; un sleep suelto no", () => {
    const verify25 = [inicio(25, "./verify")];
    assert.equal(evaluar(verify25).estado, "ok");

    const verify31 = [inicio(31, "./verify")];
    const r31 = evaluar(verify31);
    assert.equal(r31.estado, "pegado");
    assert.equal(r31.patron, "sin_avance");

    const declarado = [inicio(25, "pnpm test:e2e --run")];
    assert.equal(evaluar(declarado, { declarados: ["pnpm test:e2e"] }).estado, "ok");

    const sleepSuelto = [inicio(25, "sleep 60")];
    const rs = evaluar(sleepSuelto);
    assert.equal(rs.estado, "pegado");
  });

  test("A5 sin señal (log vacío, sin comandos, progreso apagado) es no_verificable", () => {
    assert.equal(evaluar([]).estado, "no_verificable");
    assert.equal(evaluar([avance(30, "paso_iniciado")]).estado, "no_verificable");
    const apagado = configuracion({ KIT_PROGRESO: "0" });
    const r = evaluarPegado([inicio(30, "sleep 1")], { ahora: AHORA, config: apagado });
    assert.equal(r.estado, "no_verificable");
  });
});

describe("correrVigilado (A6–A8)", () => {
  const eco = {
    exe: process.execPath,
    args: ["-e", "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>process.stdout.write('eco:'+d))"],
  };
  const dormir = { exe: process.execPath, args: ["-e", "console.log(process.pid);setTimeout(()=>{},60000)"] };

  test("A6 proceso corto: misma salida que correr", async () => {
    const cwd = process.cwd();
    const sincrono = correr(eco, "hola", cwd, false, 10000);
    const asincrono = await correrVigilado(eco, "hola", cwd, {
      tope: 10000,
      intervaloMs: 50,
      vigilar: () => ({ cortar: false }),
    });
    assert.deepEqual(asincrono, sincrono);
    assert.equal(asincrono.status, 0);
    assert.equal(asincrono.stdout, "eco:hola");
  });

  test("A7 vigilar pide cortar: el proceso muere y error lo dice", async () => {
    const t0 = Date.now();
    let llamadas = 0;
    const r = await correrVigilado(dormir, "", process.cwd(), {
      intervaloMs: 100,
      vigilar: () => {
        llamadas += 1;
        return llamadas >= 2 ? { cortar: true, motivo: "pegado (sin_avance)" } : { cortar: false };
      },
    });
    assert.ok(Date.now() - t0 < 3000, "debe cortar antes de 3 s");
    assert.equal(r.error, "cortado: pegado (sin_avance)");
    assert.equal(r.status, null);
    const pid = Number(r.stdout.trim());
    assert.throws(() => process.kill(pid, 0), (e) => e.code === "ESRCH");
  });

  test("A8 tope total: mismo mensaje que correr", async () => {
    const t0 = Date.now();
    const r = await correrVigilado(dormir, "", process.cwd(), { tope: 300 });
    assert.ok(Date.now() - t0 < 3000, "debe cortar por tope antes de 3 s");
    assert.equal(r.error, "superó el tope de 300 ms");
    assert.equal(correr(dormir, "", process.cwd(), false, 300).error, "superó el tope de 300 ms");
  });
});
