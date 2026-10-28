import assert from 'node:assert/strict';

export function comprobar(id, dato) {
  switch (id) {
    case 'I1':
      for (const r of dato) {
        assert.equal(r.status, 0, `${r.herramienta}: resolver falló`);
        assert.ok(r.modelos.includes(r.stdout.trim()), `${r.herramienta}: modelo fuera de modelos.json`);
      }
      break;
    case 'I2':
      for (const r of dato) {
        const cabecera = r.texto.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
        assert.match(cabecera, new RegExp(`^name: ${r.nombre}$`, 'm'), 'name no coincide con archivo');
        assert.match(cabecera, /^model: \S+/m, 'falta model');
        assert.ok(cabecera.includes('flucastr-ai:generado'), 'falta marca de generación');
      }
      break;
    case 'I3':
    case 'I4':
      for (const r of dato) {
        assert.deepEqual(r.despues, r.antes, r.motivo);
        assert.ok(!r.creoTemporal, 'la simulación ejecutó mktemp y creó un archivo temporal');
      }
      break;
    case 'I5':
      for (const r of dato) {
        assert.notEqual(r.status, 0, `${r.caso}: aceptó configuración inválida`);
        assert.match(r.stderr, r.mensaje, `${r.caso}: mensaje no explica el error`);
        assert.deepEqual(r.despues, r.antes, `${r.caso}: dejó archivos o directorios parciales`);
      }
      break;
    case 'I6':
      for (const r of dato) {
        assert.notEqual(r.status, 0, 'aceptó model en encabezado');
        assert.match(r.stderr, /no debe declarar 'model'.*modelos\.json/, 'rechazo sin explicación');
        assert.equal(r.stdout, '', 'produjo salida parcial');
      }
      break;
    default: throw new Error(`Comprobación desconocida: ${id}`);
  }
}
