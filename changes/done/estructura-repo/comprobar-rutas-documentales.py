#!/usr/bin/env python3
"""Inventario determinista de enlaces Markdown en documentos operativos permitidos."""

from hashlib import sha256
from pathlib import Path
import re
import os

ROOT = Path(__file__).resolve().parents[2]
DOCUMENTS = (
    "README.md",
    "AGENTS.md",
    "PENDIENTES.md",
    "docs/kit-run.md",
    "nucleo/contrato/verificacion.md",
    "skills/planificar-cambio/SKILL.md",
    "skills/ejecutar-plan/SKILL.md",
    "skills/preparar-proyecto/SKILL.md",
    "skills/diagnosticar/SKILL.md",
    "agentes/constructor.md",
    "agentes/principal.md",
)
PROTECTED = (
    "old/",
    "pruebas/.temporales/",
    "pruebas/revisor-luna/casos/",
    "pruebas/comparar-openspec/",
    "docs/evaluaciones/",
    "docs/investigaciones/",
    "cambios/hechos/",
)
LINK = re.compile(r"!?\[[^]]*\]\(([^)]+)\)")
CODE = re.compile(r"`([^`]+)`")
RECEIVER_PREFIXES = ("./verify", "AGENTS.md", "cambios/", "old/v1/")
PATH_TOKEN = re.compile(
    r"(?<![\w./-])(?:\./(?:verify|instalar\.sh|desinstalar\.sh)|"
    r"(?:scripts|agentes|skills|nucleo|docs|pruebas|cambios|old/v1)/"
    r"[A-Za-z0-9_./<>${}*?-]+|(?:README|AGENTS|PENDIENTES)\.md|verify)"
)


def classify(source, line, raw):
    target = raw.strip().split(maxsplit=1)[0].strip("<>")
    if not target or re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", target) or target.startswith("#"):
        return "external-or-anchor"
    path = target.split("#", 1)[0].split("?", 1)[0]
    if not path:
        return "external-or-anchor"
    if path.startswith("/"):
        return "absolute-or-receiver"
    if path.startswith("old/v1/"):
        return "protected-not-inspected"
    candidate = Path(os.path.normpath((ROOT / source).parent / path))
    try:
        relative = candidate.relative_to(ROOT).as_posix()
    except ValueError:
        return "outside-repository"
    if any(relative == prefix.rstrip("/") or relative.startswith(prefix) for prefix in PROTECTED):
        return "protected-not-inspected"
    return "present" if candidate.exists() else "missing"


def classify_code_reference(raw):
    target = raw.strip().split(maxsplit=1)[0].strip("<>")
    if target.startswith("/"):
        return "absolute-or-receiver"
    if "<" in target or "${" in target or "*" in target:
        return "template-reference"
    if target.startswith(("old/v1/", "cambios/hechos/", "docs/evaluaciones/",
                          "docs/investigaciones/", "pruebas/comparar-openspec/",
                          "pruebas/revisor-luna/casos/", "pruebas/.temporales/")):
        return "protected-not-inspected"
    if target == "AGENTS.md" or target.startswith("cambios/"):
        return "receiver-contract"
    if target.startswith("./"):
        target = target[2:]
    candidate = Path(os.path.normpath(ROOT / target))
    try:
        relative = candidate.relative_to(ROOT).as_posix()
    except ValueError:
        return "outside-repository"
    if any(relative == prefix.rstrip("/") or relative.startswith(prefix) for prefix in PROTECTED):
        return "protected-not-inspected"
    return "present" if candidate.exists() else "missing"


def reference_class(raw, status):
    """Return an anonymous contract category; never include the target token."""
    target = raw.strip().split(maxsplit=1)[0].strip("<>")
    if status == "protected-not-inspected":
        return "protected-contract-uninspected"
    if status == "template-reference":
        return "receiver-template"
    if target.startswith(("cambios/", "old/v1/")):
        return "change-lifecycle-reference"
    if target.startswith(("docs/", "nucleo/")):
        return "documentation-contract"
    if target.startswith(("scripts/", "agentes/", "skills/", "pruebas/")):
        return "kit-implementation-reference"
    if target.startswith(("./verify", "./instalar.sh", "./desinstalar.sh", "AGENTS.md")):
        return "entrypoint-or-receiver-contract"
    return "other-kit-reference"


def main():
    totals = {}
    records = []
    missing_count = 0
    missing_classes = {}
    for source in DOCUMENTS:
        text = (ROOT / source).read_text(encoding="utf-8")
        for line_number, line in enumerate(text.splitlines(), 1):
            for match in LINK.finditer(line):
                raw = match.group(1)
                status = classify(source, line_number, raw)
                totals[status] = totals.get(status, 0) + 1
                digest = sha256(raw.encode()).hexdigest()[:12]
                records.append(f"{source}:{line_number} {status} target-sha256={digest}")
                missing_count += status == "missing"
            for code in CODE.finditer(line):
                for match in PATH_TOKEN.finditer(code.group(1)):
                    raw = match.group(0).rstrip(".,;:)")
                    kind = "receiver-example" if raw.startswith(RECEIVER_PREFIXES) else "kit-reference"
                    status = classify_code_reference(raw)
                    totals[f"{kind}:{status}"] = totals.get(f"{kind}:{status}", 0) + 1
                    digest = sha256(raw.encode()).hexdigest()[:12]
                    category = reference_class(raw, status)
                    records.append(f"{source}:{line_number} {kind}:{status}:{category} target-sha256={digest}")
                    missing_count += status == "missing"
                    if status == "missing":
                        missing_classes[category] = missing_classes.get(category, 0) + 1
    output = "\n".join(records)
    (ROOT / "cambios/estructura-repo/rutas-documentales.txt").write_text(
        output + ("\n" if output else ""), encoding="utf-8"
    )
    print(f"documentos revisados: {len(DOCUMENTS)}")
    print("rutas por categoría/estado: " + ", ".join(f"{key}={totals[key]}" for key in sorted(totals)))
    print(f"referencias del kit ausentes no protegidas: {missing_count}")
    print("clases ausentes: " + (", ".join(f"{key}={missing_classes[key]}" for key in sorted(missing_classes))
                                  or "ninguna"))
    print("detalle: cambios/estructura-repo/rutas-documentales.txt (destinos anonimizados por hash)")
    return 1 if missing_count else 0


if __name__ == "__main__":
    raise SystemExit(main())
