import { esEntero, esObjeto, tiene } from "../../tools/resolver/object.mjs";

// Defecto de reserveTokens en Pi: un umbral que dé menos que esto es peor que el defecto.
const RESERVA_MINIMA_PI = 16384;

// Modelos de Pi de todos los perfiles con herramienta "pi", sin repetidos, en orden del archivo. Valor: su perfil.
export function candidatosPi(c) {
  const vistos = new Map();
  for (const perfil of Object.values(c.profiles ?? {})) {
    if (perfil.tool !== "pi") continue;
    for (const modelo of Object.values(perfil.models ?? {})) {
      if (!vistos.has(modelo)) vistos.set(modelo, perfil);
    }
  }
  return vistos;
}

// Decide, sin escribir, qué pasa con cada modelo. Devuelve las líneas de salida y los pares [modelo, reserve] a fijar.
export function planFijarPi(ajustes, candidatos, c, creado) {
  const sufijo = creado ? ":creado" : "";
  const comp = ajustes.compaction;
  const usuarioGlobal =
    comp !== undefined &&
    (!esObjeto(comp) ||
      tiene(comp, "enabled") ||
      tiene(comp, "reserveTokens") ||
      (tiene(comp, "modelOverrides") && !esObjeto(comp.modelOverrides)));
  if (usuarioGlobal) return { lineas: ["omitido-usuario:*"], cambios: [] };

  const overrides = comp?.modelOverrides ?? {};
  const lineas = [];
  const cambios = [];
  for (const [modelo, perfil] of candidatos) {
    if (tiene(overrides, modelo)) {
      lineas.push(`omitido-usuario:${modelo}`);
      continue;
    }
    if (!esEntero(perfil.windows?.[modelo])) {
      lineas.push(`omitido-ventana:${modelo}`);
      continue;
    }
    const compactar = perfil.compact_at ?? c.compact_at;
    if (!esEntero(compactar)) {
      lineas.push(`omitido-umbral:${modelo}`);
      continue;
    }
    const reserve = perfil.windows[modelo] - compactar;
    if (reserve < RESERVA_MINIMA_PI) {
      lineas.push(`omitido-umbral:${modelo}`);
      continue;
    }
    lineas.push(`fijado:${modelo}=${reserve}${sufijo}`);
    cambios.push([modelo, reserve]);
  }
  return { lineas, cambios };
}

export function aplicarFijarPi(ajustes, cambios) {
  ajustes.compaction ??= {};
  ajustes.compaction.modelOverrides ??= {};
  for (const [modelo, reserve] of cambios) {
    ajustes.compaction.modelOverrides[modelo] = { reserveTokens: reserve };
  }
}

// Quita el override solo si es exactamente { reserveTokens: reserve }; poda lo que quede vacío.
export function quitarOverridePi(ajustes, modelo, reserve) {
  const comp = ajustes.compaction;
  if (!esObjeto(comp) || !esObjeto(comp.modelOverrides) || !tiene(comp.modelOverrides, modelo)) return false;
  const valor = comp.modelOverrides[modelo];
  const claves = esObjeto(valor) ? Object.keys(valor) : [];
  if (claves.length !== 1 || claves[0] !== "reserveTokens" || valor.reserveTokens !== reserve) return false;
  delete comp.modelOverrides[modelo];
  if (Object.keys(comp.modelOverrides).length === 0) delete comp.modelOverrides;
  if (Object.keys(comp).length === 0) delete ajustes.compaction;
  return true;
}
