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
export function resultadoPi({ ts, id, name, error = false, texto = CENTINELA_TEXTO } = {}) {
  return {
    type: 'message',
    timestamp: ts,
    message: {
      role: 'toolResult',
      toolCallId: id,
      toolName: name,
      content: [{ type: 'text', text: texto }],
      isError: Boolean(error),
    },
  };
}

// Une registros en formato .jsonl (una línea JSON por registro, con salto final).
export function unirJsonl(registros) {
  return registros.map((r) => JSON.stringify(r)).join('\n') + '\n';
}

// Meta de una corrida de subagente (<runId>_<agente>_meta.json). `task` lleva CENTINELA_TEXTO para comprobar
// que el encargo no sale en el resultado. `timestamp` son milisegundos, como en el meta real.
export function metaSubagentePi({
  runId,
  parentSessionId = 'sesion-sintetica',
  agent,
  model = 'modelo-sintetico',
  timestamp = Date.parse(TS_POR_DEFECTO),
  turns = 0,
  cost = 0,
} = {}) {
  return {
    runId,
    parentSessionId,
    agent,
    task: CENTINELA_TEXTO,
    exitCode: 0,
    model,
    requestedModel: model,
    usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost, turns },
    transcriptPath: '/ruta-sintetica/transcript.jsonl',
    timestamp,
  };
}

// Transcript de una corrida de subagente (<runId>_<agente>_transcript.jsonl): un texto del asistente con una
// llamada `read` por cada entrada de `lecturas` ({ ruta, bytes, error }), su resultado (texto de exactamente
// `bytes` bytes, con CENTINELA_TEXTO al inicio; bytes >= 24) y un registro tool_start que el parser ignora.
export function transcriptSubagentePi({ lecturas = [] } = {}) {
  const llamadas = lecturas.map((l, i) => ({ type: 'toolCall', id: `s${i}`, name: 'read', arguments: { path: l.ruta } }));  const registros = [
    {
      recordType: 'message',
      sourceEventType: 'message_end',
      message: { role: 'assistant', content: [{ type: 'text', text: CENTINELA_TEXTO }, ...llamadas] },
    },
  ];
  if (lecturas.length > 0) {
    registros.push({ recordType: 'tool_start', sourceEventType: 'tool_execution_start', toolCallId: 's0', toolName: 'read' });
  }
  lecturas.forEach((l, i) => {
    const relleno = 'a'.repeat(Math.max(0, l.bytes - CENTINELA_TEXTO.length));
    registros.push({
      recordType: 'message',
      sourceEventType: 'message_end',
      message: {
        role: 'toolResult',
        toolCallId: `s${i}`,
        toolName: 'read',
        isError: Boolean(l.error),
        content: [{ type: 'text', text: CENTINELA_TEXTO + relleno }],
      },
    });
  });
  return unirJsonl(registros);
}

// ---- task-04: logs de Claude Code (solo campos; el texto de los bloques es CENTINELA_TEXTO) ----

export function registroAgentSettingClaude(agentSetting = 'coordinador') {
  return { type: 'agent-setting', agentSetting, sessionId: 'sesion-sintetica' };
}

// Registro del asistente de Claude Code. Un message.id puede repetirse en varios registros (uno por bloque).
// `llamadas`: [{ id, name, input }] con los nombres originales de Claude Code (Read, Agent, ...).
export function turnoClaude({
  id = 'msg-sintetico',
  ts = TS_POR_DEFECTO,
  model = 'modelo-sintetico',
  input = 0,
  output = 0,
  cacheRead = 0,
  cacheWrite = 0,
  llamadas = [],
} = {}) {
  return {
    type: 'assistant',
    timestamp: ts,
    sessionId: 'sesion-sintetica',
    isSidechain: false,
    message: {
      id,
      model,
      role: 'assistant',
      content: [
        { type: 'text', text: CENTINELA_TEXTO },
        ...llamadas.map((l) => ({ type: 'tool_use', id: l.id, name: l.name, input: l.input ?? {} })),
      ],
      usage: {
        input_tokens: input,
        output_tokens: output,
        cache_read_input_tokens: cacheRead,
        cache_creation_input_tokens: cacheWrite,
      },
    },
  };
}

// Resultado de Read: registro `user` con tool_result y toolUseResult.file.content de exactamente `bytes` bytes
// (bytes >= 29, largo de CENTINELA_TEXTO). Con error, el tool_result lleva is_error:true.
export function resultadoReadClaude({ ts = TS_POR_DEFECTO, toolUseId, ruta, bytes, error = false } = {}) {
  const contenido = CENTINELA_TEXTO + 'a'.repeat(Math.max(0, bytes - CENTINELA_TEXTO.length));
  return {
    type: 'user',
    timestamp: ts,
    sessionId: 'sesion-sintetica',
    isSidechain: false,
    message: {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: toolUseId, content: contenido, is_error: Boolean(error) }],
    },
    toolUseResult: { file: { filePath: ruta, content: contenido, numLines: 1 } },
  };
}

// Meta de una corrida de subagente de Claude Code (agent-<id>.meta.json). `description` lleva CENTINELA_TEXTO
// para comprobar que el parser lo ignora.
export function metaSubagenteClaude({ agentType = 'constructor' } = {}) {
  return { agentType, description: CENTINELA_TEXTO };
}
