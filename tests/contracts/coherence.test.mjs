import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const correspondences = [
  {
    contract: 'core/contracts/scope.md',
    source: 'core/agents/builder.md',
    quote: 'Work only when `status: approved`; otherwise stop without changes and report it. Do not ask questions or call other agents; if you cannot proceed, return `PAUSED`.',
  },
  {
    contract: 'core/contracts/scope.md',
    source: 'core/agents/builder.md',
    quote: 'Work only in folders listed in `repos:`. Git there runs with that folder as the working directory; never use `git -C` or `git -c`, which are blocked. Reads are limited to `status`, `diff`, `branch --show-current`, `rev-parse --verify --quiet`, and `symbolic-ref`; the only write is `switch -c <branch>` (in `.`, without `-C`) to create the authorized branch.',
  },
  {
    contract: 'core/contracts/scope.md',
    source: 'core/agents/builder.md',
    quote: 'Change code only within *Scope*. In the plan, change only step checkboxes, their evidence, frontmatter `status`, and the *Evidence* and *Notes* sections; never edit *Scope* or *Acceptance*. Only with `continuity: continuous` may you also update `segment:` and add minor resolved questions to *Decisions*. You may also add rows to `decisions.md` and rewrite `notes.md` beside the plan; cite `D-NN` in returns.',
  },
  {
    contract: 'core/contracts/scope.md',
    source: 'core/agents/builder.md',
    quote: 'Do not close anything or move the plan to `done/`: closing belongs to the planner.',
  },
  {
    contract: 'core/contracts/scope.md',
    source: 'core/agents/builder.md',
    quote: 'No commit, push, PR, merge, or deployment. Do not commit between segments.',
  },
  {
    contract: 'core/contracts/scope.md',
    source: 'core/agents/builder.md',
    quote: 'Do not read or print `.env`, keys, or credentials (`.env.example` is allowed).',
  },
  {
    contract: 'core/contracts/scope.md',
    source: 'core/agents/builder.md',
    quote: 'Append to `changes/<name>/progress.jsonl` only through `kit-nota`; never edit or delete existing lines, and never touch `progress-resumen.md`.',
  },
  {
    contract: 'core/contracts/scope.md',
    source: 'core/skills/execute-plan/SKILL.md',
    quote: 'Set `status: in progress`. Set `done` only when `verify` passed (for a segmented plan, its segment check); `partial` only with `PAUSED`; no other state. Closing belongs to the planner.',
  },
  {
    contract: 'core/contracts/states.md',
    source: 'core/agents/builder.md',
    quote: 'Work only when `status: approved`; otherwise stop without changes and report it.',
  },
  {
    contract: 'core/contracts/states.md',
    source: 'core/skills/plan-change/references/rules.md',
    quote: '`draft`: the planner writes it.',
  },
  {
    contract: 'core/contracts/states.md',
    source: 'core/skills/plan-change/references/rules.md',
    quote: '`approved`: the planner sets it after the user says “yes”.',
  },
  {
    contract: 'core/contracts/states.md',
    source: 'core/skills/execute-plan/SKILL.md',
    quote: 'Set `status: in progress`. Set `done` only when `verify` passed (for a segmented plan, its segment check); `partial` only with `PAUSED`; no other state. Closing belongs to the planner.',
  },
  {
    contract: 'core/contracts/states.md',
    source: 'core/skills/plan-change/references/rules.md',
    quote: '`done`: the builder sets it when `verify` passes. In a plan with segments, `done` means “segment completed and its verification passed”; the planner sets it back to `approved` with `segment: N+1` and, after the final segment, completes the full `verify`.',
  },
  {
    contract: 'core/contracts/states.md',
    source: 'core/skills/plan-change/references/rules.md',
    quote: '`partial`: the builder sets it when returning `PAUSED`.',
  },
  {
    contract: 'core/contracts/states.md',
    source: 'core/skills/execute-plan/SKILL.md',
    quote: 'By default, an execution ends when the active segment is complete.',
  },
  {
    contract: 'core/contracts/states.md',
    source: 'core/skills/execute-plan/SKILL.md',
    quote: 'Only with `continuity: continuous` may you continue through approved segments of the same story in one run; do not move on to another story.',
  },
  {
    contract: 'core/contracts/states.md',
    source: 'core/skills/execute-plan/SKILL.md',
    quote: 'Advance only if verification passes, the work stays in Scope, and no user decision is needed. Keep `status: in progress` while advancing; when using `PAUSED`, set `status: partial`, with a resumable note describing progress, remaining work, and cause.',
  },
  {
    contract: 'core/contracts/states.md',
    source: 'core/skills/execute-plan/SKILL.md',
    quote: 'If the harness warns that execution may be cut off, persist progress and the next action in *Notes*; do not report `DONE`. The state stays `in progress` (it is not a product `PAUSED`); the planner reconstructs it and reapproves before resuming.',
  },
  {
    contract: 'core/contracts/return.md',
    source: 'core/agents/builder.md',
    quote: 'The first line of your final response is one of these. Omit `segment=<n>` when the plan has no `segment:`.',
  },
  {
    contract: 'core/contracts/return.md',
    source: 'core/agents/builder.md',
    quote: '`DONE: plan=<path>; segment=<n>; verify=pasa`, then `cambios:`, `evidencia:` (command, `exit N`, `Fingerprint`), `decisiones:`, and `revisar:`; at most five lines in total.',
  },
  {
    contract: 'core/contracts/return.md',
    source: 'core/agents/builder.md',
    quote: '`PAUSED: plan=<path>; segment=<n>; motivo=<ambiguous|design|scope|access|verify>; hecho=<n>/<total>; siguiente=<exact step>; no_intentado=<reason>`, then `problema:`, `opciones:` (2 or 3 fixed options, one marked “(recommended)”), `cambios:`, and `retomar:`.',
  },
  {
    contract: 'core/contracts/return.md',
    source: 'core/agents/builder.md',
    quote: 'End your turn only with `DONE` or `PAUSED`; never end with a progress report, except on a cut-off warning, when the state stays `in progress` (see the skill).',
  },
  {
    contract: 'core/contracts/return.md',
    source: 'core/skills/execute-plan/SKILL.md',
    quote: 'If the harness warns that execution may be cut off, persist progress and the next action in *Notes*; do not report `DONE`. The state stays `in progress` (it is not a product `PAUSED`); the planner reconstructs it and reapproves before resuming.',
  },
  {
    contract: 'core/contracts/return.md',
    source: 'core/contracts/termination.md',
    quote: '`DONE: plan=<path>; [segment=<n>; ]verify=pasa` means success.',
  },
  {
    contract: 'core/contracts/return.md',
    source: 'core/contracts/termination.md',
    quote: '`PAUSED: plan=<path>; [segment=<n>; ]motivo=<ambiguous|design|scope|access|verify>; hecho=<n>/<total>; siguiente=<step>; no_intentado=<reason>` requests a pause.',
  },
  {
    contract: 'core/contracts/return.md',
    source: 'core/agents/planner.md',
    quote: 'Returns: `DONE: plan=<path>; segment=<n>; verify=pasa` and 5 lines at most, or `PAUSED: …; motivo=<ambiguous|design|scope|access|verify>; hecho=<n>/<total>; siguiente=<step>; no_intentado=<reason>` and problem with options (plan `partial`). Interrupted: stays `in progress`.',
  },
];

const copyPattern = /^- `([^`]+)`, .*?: “(.*)”$/gm;

test('every cited literal copy matches its source and has a correspondence', () => {
  assert.ok(correspondences.length > 0, 'correspondence list must not be empty');

  const contracts = new Map();
  for (const { contract, source, quote } of correspondences) {
    const contractText = contracts.get(contract) ?? readFileSync(contract, 'utf8');
    contracts.set(contract, contractText);
    const sourceText = readFileSync(source, 'utf8');
    assert.ok(contractText.includes(quote), `${contract} is missing mapped quote: ${quote}`);
    assert.ok(sourceText.includes(quote), `${source} is missing mapped quote: ${quote}`);
  }

  for (const [contract, contractText] of contracts) {
    const citedCopies = [...contractText.matchAll(copyPattern)].map((match) => ({ source: match[1], quote: match[2] }));
    assert.ok(citedCopies.length > 0, `${contract} has no literal copies`);
    assert.deepEqual(citedCopies, correspondences.filter((item) => item.contract === contract).map(({ source, quote }) => ({ source, quote })), `${contract} has unmapped or changed literal copies`);
  }
});
