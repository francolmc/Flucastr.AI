import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluar } from "./oraculos.mjs";

const idsEsperados = ["saludo", "permisos", "totales", "contradiccion"];
const variantesEsperadas = ["actual", "fragmentada", "breve"];
const archivosVariante = {
  actual: ["plan.md", "lecturas.md"],
  fragmentada: ["exploracion.md", "spec.md", "plan.md", "lecturas.md"],
  breve: ["cambio.md", "lecturas.md"],
};

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function rutaInterna(base, relativa) {
  exigir(typeof relativa === "string" && !path.isAbsolute(relativa), `ruta no relativa: ${relativa}`);
  const destino = path.resolve(base, relativa);
  exigir(destino.startsWith(`${path.resolve(base)}${path.sep}`), `ruta fuera del caso: ${relativa}`);
  return destino;
}

async function archivoNoVacio(ruta) {
  const contenido = await readFile(ruta);
  exigir(contenido.length > 0, `archivo vacío: ${ruta}`);
  return contenido;
}

async function hashArchivo(ruta) {
  return createHash("sha256").update(await archivoNoVacio(ruta)).digest("hex");
}

export async function ejecutar(raiz = path.dirname(fileURLToPath(import.meta.url))) {
  const dirCasos = path.join(raiz, "casos");
  const encontrados = (await readdir(dirCasos)).sort();
  exigir(JSON.stringify(encontrados) === JSON.stringify([...idsEsperados].sort()), "se requieren exactamente cuatro casos conocidos");
  const hashes = [];

  for (const id of idsEsperados) {
    const dirCaso = path.join(dirCasos, id);
    const manifiesto = JSON.parse(await archivoNoVacio(path.join(dirCaso, "manifiesto.json")));
    exigir(manifiesto.id === id, `id de manifiesto incorrecto: ${id}`);
    exigir(JSON.stringify(manifiesto.variantes) === JSON.stringify(variantesEsperadas), `variantes incorrectas: ${id}`);

    for (const archivo of manifiesto.base) {
      exigir(archivo.startsWith("base/"), `base debe estar dentro de base/: ${id}/${archivo}`);
      hashes.push({ caso: id, tipo: "base", archivo, sha256: await hashArchivo(rutaInterna(dirCaso, archivo)) });
    }

    for (const variante of variantesEsperadas) {
      const dirVariante = path.join(dirCaso, "variantes", variante);
      const presentes = (await readdir(dirVariante)).sort();
      const requeridos = [...archivosVariante[variante]];
      if (id === "contradiccion" && variante !== "breve") requeridos.push("solicitud.md");
      exigir(requeridos.every((archivo) => presentes.includes(archivo)), `faltan instrucciones en ${id}/${variante}`);
      for (const archivo of requeridos) {
        hashes.push({ caso: id, tipo: `instrucciones:${variante}`, archivo, sha256: await hashArchivo(path.join(dirVariante, archivo)) });
      }
    }

    const controles = JSON.parse(await archivoNoVacio(path.join(dirCaso, "controles.json")));
    exigir(Array.isArray(controles.validos) && controles.validos.length > 0, `faltan controles válidos: ${id}`);
    exigir(Array.isArray(controles.invalidos) && controles.invalidos.length > 0, `faltan controles inválidos: ${id}`);
    for (const control of controles.validos) {
      const r = evaluar(id, rutaInterna(dirCaso, control.ruta), path.join(dirCaso, 'base'));
      exigir(r.ok, `control válido rechazado (${id}/${control.id}): ${r.motivo}`);
    }
    for (const control of controles.invalidos) {
      const r = evaluar(id, rutaInterna(dirCaso, control.ruta), path.join(dirCaso, 'base'));
      exigir(!r.ok, `control inválido aceptado (${id}/${control.id})`);
    }
  }

  console.log(`Autoprueba correcta: 4 casos, 12 combinaciones, ${hashes.length} hashes SHA-256; controles válidos e inválidos aceptados como se esperaba.`);
  for (const hash of hashes) console.log(`${hash.caso} ${hash.tipo} ${hash.archivo} ${hash.sha256}`);
  return { casos: 4, combinaciones: 12, hashes: hashes.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await ejecutar(process.argv[2] ? path.resolve(process.argv[2]) : undefined);
  } catch (error) {
    console.error(`Autoprueba fallida: ${error.message}`);
    process.exitCode = 1;
  }
}
