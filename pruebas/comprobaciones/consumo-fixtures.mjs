// Generador de logs sintéticos de Pi para las pruebas de scripts/consumo.mjs (sin modelo ni red).
// Todo el texto de los mensajes es CENTINELA_TEXTO: así una prueba puede comprobar que el texto real
// de una sesión nunca sale en el informe.

export const CENTINELA_TEXTO = 'TEXTO-CENTINELA-NO-DEBE-SALIR';

const TS_POR_DEFECTO = '2026-10-30T10:00:00.000Z';

export function registroSesionPi({ id = 'sesion-sintetica', cwd = '/tmp/proyecto-sintetico', timestamp = TS_POR_DEFECTO } = {}) {
  return { type: 'session', id, cwd, timestamp };
}

// Turno del coordinador: un mensaje del asistente. `contexto` = input + cacheRead + cacheWrite.
// Se reparte: cacheRead = mitad (redondeada hacia abajo), input = el resto.
export function turnoPi({ ts, model = 'modelo-sintetico', contexto = 0, output = 0, costo = 0, llamadas = [] } = {}) {
  const cacheRead = Math.floor(contexto / 2);
  const input = contexto - cacheRead;
  return {
    type: 'message',
    timestamp: ts,
    message: {
      role: 'assistant',
      model,
      content: [
        { type: 'text', text: CENTINELA_TEXTO },
        ...llamadas.map((l) => ({ type: 'toolCall', id: l.id, name: l.name, arguments: l.arguments ?? {} })),
      ],
      usage: {
        input,
        output,
        cacheRead,
        cacheWrite: 0,
        totalTokens: input + output + cacheRead,
        cost: { total: costo },
      },
    },
  };
}

// Resultado de una herramienta (no es turno del asistente; el parser debe ignorarlo).
export function resultadoPi({ ts, id, name, error = false } = {}) {
  return {
    type: 'message',
    timestamp: ts,
    message: {
      role: 'toolResult',
      toolCallId: id,
      toolName: name,
      content: [{ type: 'text', text: CENTINELA_TEXTO }],
      isError: Boolean(error),
    },
  };
}

// Une registros en formato .jsonl (una línea JSON por registro, con salto final).
export function unirJsonl(registros) {
  return registros.map((r) => JSON.stringify(r)).join('\n') + '\n';
}
