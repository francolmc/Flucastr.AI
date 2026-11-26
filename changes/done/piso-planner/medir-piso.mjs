// Uso: node medir-piso.mjs <carpeta de sesiones de Claude Code> [desde AAAA-MM-DD]. Solo lee; imprime tamaños.
import { readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
const dir = process.argv[2];
const len = v => { if (v == null) return 0; if (typeof v === 'string') return v.length; if (Array.isArray(v)) return v.reduce((s, x) => s + len(x), 0); if (typeof v === 'object') return Object.entries(v).reduce((s, [k, x]) => s + (['signature','uuid'].includes(k) ? 0 : len(x)), 0); return 0; };
const rows = [];
for (const f of readdirSync(dir).filter(f => f.endsWith('.jsonl'))) {
  const L = readFileSync(join(dir, f), 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  if (L.find(e => e.type === 'agent-setting')?.agentSetting !== 'planner') continue;
  const byU = new Map(L.map((e, i) => [e.uuid, i]));
  L.forEach((e, i) => {
    if (!(e.type === 'system' && e.subtype === 'compact_boundary') || (e.timestamp ?? '') < (process.argv[3] ?? '')) return;
    const m = e.compactMetadata, c = {}; let u = null;
    const add = (k, n) => c[k] = (c[k] ?? 0) + n;
    const pm = m.preservedMessages?.uuids ?? m.preservedMessages?.allUuids;
    if (pm) for (const id of pm) { const j = byU.get(id); if (j != null) add('preserved', len(L[j].message?.content ?? L[j].attachment)); }
    for (let j = i + 1; j < L.length; j++) {
      const x = L[j];
      if (x.type === 'assistant' && x.message?.usage) { u = x.message.usage; break; }
      if (x.type === 'user' && x.isCompactSummary) add('summary', len(x.message.content));
      else if (x.type === 'attachment') {
        const a = x.attachment;
        if (a.type === 'instructions') for (const fl of a.files ?? []) add('instr:' + basename(fl.path ?? fl.filename ?? '?'), len(fl.content));
        else if (a.type === 'invoked_skills') for (const s of a.skills) add('skill:' + s.name, len(s.content));
        else if (a.type === 'file') add('restored files', len(a.content?.file?.content ?? a.content));
        else if (a.type === 'compact_file_reference') add('restored refs', len(a.filename));
        else if (['deferred_tools_delta'].includes(a.type)) add(a.type, len(a.addedLines));
        else if (a.type === 'agent_listing_delta') add(a.type, len(a.addedLines));
        else if (a.type === 'skill_listing' || a.type === 'sandbox_instructions') add(a.type, len(a.content));
        else if (a.type === 'mcp_instructions_delta') add(a.type, len(a.addedBlocks));
        else if (a.type !== 'prompt_snapshot' && a.type !== 'deferred_tools_record') add('other att', len(a) );
      }
    }
    if (u) rows.push({ ts: e.timestamp, first: u.input_tokens + u.cache_creation_input_tokens + u.cache_read_input_tokens, cr: u.cache_read_input_tokens, c, keys: Object.keys(m.preservedMessages ?? {}) });
  });
}
const med = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const keys = [...new Set(rows.flatMap(r => Object.keys(r.c)))];
console.log('n', rows.length, 'first med', med(rows.map(r => r.first)), 'pmKeys', rows.at(-1).keys.join(','));
for (const k of keys.map(k => [k, med(rows.map(r => r.c[k] ?? 0)), Math.max(...rows.map(r => r.c[k] ?? 0))]).sort((a, b) => b[1] - a[1])) console.log(k.join(' | '));
const ratio = rows.map(r => Object.values(r.c).reduce((a, b) => a + b, 0) / (r.first - 31478));
console.log('chars/tok (sin prefijo) med', med(ratio).toFixed(2));
const tot = rows.map(r => Object.values(r.c).reduce((a, b) => a + b, 0)); console.log('chars total med', med(tot));
const X = rows.map(r => Object.values(r.c).reduce((a, b) => a + b, 0)), Y = rows.map(r => r.first - r.cr);
const n = X.length, mx = X.reduce((a, b) => a + b) / n, my = Y.reduce((a, b) => a + b) / n;
const slope = X.reduce((s, x, i) => s + (x - mx) * (Y[i] - my), 0) / X.reduce((s, x) => s + (x - mx) ** 2, 0);
console.log('regresion tok = a + chars*b: b', slope.toFixed(3), 'chars/tok', (1 / slope).toFixed(2), 'a', Math.round(my - slope * mx), 'cr values', [...new Set(rows.map(r => r.cr))].join(','));
