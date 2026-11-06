// Validador determinista de la coherencia entre features/ y definitions/BACKLOG.md (definitions/WORKFLOW.md §3 y §5).
// validarCoherencia({ backlog, features }) devuelve un arreglo de mensajes de error en español; vacío = coherente. No lanza.
// backlog: texto de BACKLOG.md. features: arreglo de { carpeta, tareas }, con tareas = arreglo de { archivo, texto }.
// El módulo no lee el disco.

const RE_CARPETA = /^F\d{2}-[a-z0-9-]+$/;
const RE_ARCHIVO_TAREA = /^task-(\d{2})-[a-z0-9-]+\.md$/;
const RE_PRIMERA_TAREA = /^# task-(\d{2}) — /m;
const RE_DEPENDE = /depende_de: (.+?)\s{2,}estado:/;
const RE_ESTADO = /^repo: .*estado: (.+?)\s*$/m;
const ESTADOS_QUE_IMPIDEN_HECHA = ['en curso', 'lista para revisión', 'bloqueada'];

function celdas(linea) {
  return linea.split('|').slice(1, -1).map((c) => c.trim());
}

// Devuelve un mapa ID → Estado a partir de las filas de datos del backlog (| F00 | … | Estado | Siguiente |).
function estadosDelBacklog(backlog) {
  const mapa = new Map();
  for (const linea of String(backlog).replace(/\r\n?/g, '\n').split('\n')) {
    if (!/^\| F\d{2} \|/.test(linea)) continue;
    const c = celdas(linea);
    if (c.length >= 7) mapa.set(c[0], c[6]);
  }
  return mapa;
}

export function validarCoherencia({ backlog, features }) {
  const errores = [];
  const estados = estadosDelBacklog(backlog);

  for (const { carpeta, tareas } of features) {
    const id = carpeta.slice(0, 3);

    // Regla 1: nombre de carpeta válido y feature presente en el backlog.
    if (!RE_CARPETA.test(carpeta)) {
      errores.push(`El nombre de carpeta «${carpeta}» no cumple «F00-nombre» (minúsculas, cifras y guiones).`);
    }
    if (!estados.has(id)) {
      errores.push(`La carpeta «${carpeta}» no tiene fila «${id}» en definitions/BACKLOG.md.`);
    }

    // Regla 2: nombres de archivo, números únicos y consecutivos desde 01, y primera línea acorde.
    const numeros = [];
    for (const { archivo, texto } of tareas) {
      const m = RE_ARCHIVO_TAREA.exec(archivo);
      if (!m) {
        errores.push(`El archivo «${carpeta}/${archivo}» no cumple «task-NN-nombre.md».`);
        continue;
      }
      const numero = m[1];
      numeros.push(numero);
      const primera = RE_PRIMERA_TAREA.exec(String(texto).replace(/\r\n?/g, '\n').split('\n')[0] ?? '');
      if (!primera || primera[1] !== numero) {
        errores.push(`La primera línea de «${carpeta}/${archivo}» debe ser «# task-${numero} — título», con el mismo número que el nombre del archivo.`);
      }
    }
    const repetidos = numeros.filter((n, i) => numeros.indexOf(n) !== i);
    for (const n of new Set(repetidos)) {
      errores.push(`En «${carpeta}» el número task-${n} aparece más de una vez.`);
    }
    const unicos = [...new Set(numeros)].sort();
    unicos.forEach((n, i) => {
      if (n !== String(i + 1).padStart(2, '0')) {
        errores.push(`En «${carpeta}» la numeración de tareas no es consecutiva desde 01: falta task-${String(i + 1).padStart(2, '0')}.`);
      }
    });

    // Reglas 3 a 5 necesitan el estado y las dependencias de cada tarea.
    const info = tareas
      .filter((t) => RE_ARCHIVO_TAREA.test(t.archivo))
      .map((t) => {
        const numero = RE_ARCHIVO_TAREA.exec(t.archivo)[1];
        const dep = RE_DEPENDE.exec(String(t.texto).split('\n')[1] ?? '')?.[1]?.trim() ?? '—';
        const estado = RE_ESTADO.exec(String(t.texto))?.[1]?.trim() ?? '';
        return { archivo: t.archivo, numero, dep, estado };
      });

    // Regla 3: depende_de apunta a tareas de la misma carpeta con número menor.
    for (const t of info) {
      if (t.dep === '—') continue;
      for (const ref of t.dep.split(/,\s*/)) {
        const m = /^task-(\d{2})$/.exec(ref);
        if (!m) {
          errores.push(`«${t.archivo}» en «${carpeta}»: «depende_de» contiene «${ref}», que no tiene la forma «task-NN».`);
          continue;
        }
        const existe = info.some((o) => o.numero === m[1]);
        if (!existe || m[1] >= t.numero) {
          errores.push(`«${t.archivo}» en «${carpeta}» depende de task-${m[1]}, que no existe en la carpeta o no tiene número menor.`);
        }
      }
    }

    const estadoFeature = estados.get(id);

    // Regla 4: feature hecha implica todas sus tareas hechas.
    if (estadoFeature === 'hecha') {
      for (const t of info) {
        if (t.estado !== 'hecha') {
          errores.push(`La feature ${id} está «hecha» en el backlog, pero «${t.archivo}» tiene estado «${t.estado}».`);
        }
      }
    }

    // Regla 5: una tarea en curso, lista para revisión o bloqueada impide que la feature esté hecha.
    if (estadoFeature === 'hecha') {
      for (const t of info) {
        if (ESTADOS_QUE_IMPIDEN_HECHA.includes(t.estado)) {
          errores.push(`«${t.archivo}» está «${t.estado}», pero la feature ${id} figura como «hecha» en el backlog.`);
        }
      }
    }
  }

  return errores;
}
