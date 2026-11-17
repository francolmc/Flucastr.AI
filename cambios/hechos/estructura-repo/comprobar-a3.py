#!/usr/bin/env python3
"""Comprueba contratos A3 con paquetes y casos enteramente sintéticos en Bubblewrap."""

from pathlib import Path
from hashlib import sha256
import os
import shutil
import subprocess
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[2]


def put(root, relative, content, mode=0o644):
    target = root / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content)
    target.chmod(mode)


def synthetic_package(origin, marker, include_core=False):
    source = origin / "source"
    put(source, "instalar.sh", "#!/usr/bin/env bash\nexit 0\n", 0o755)
    put(source, "desinstalar.sh", "#!/usr/bin/env bash\nexit 0\n", 0o755)
    put(source, "modelos.json", '{"synthetic": true}\n')
    put(source, "scripts/resolver.mjs", "process.exit(0);\n")
    put(source, "agentes/synthetic.md", f"synthetic {marker}\n")
    put(source, "skills/synthetic/SKILL.md", "synthetic skill\n")
    if include_core:
        put(source, "core/synthetic-module.sh", f"synthetic core {marker}\n", 0o755)
    with tarfile.open(origin / "kit.tar.gz", "w:gz") as archive:
        archive.add(source, arcname="fixture-root")


def hostile_package(origin, name, entry_name, entry_type=tarfile.REGTYPE, linkname=""):
    """Builds one synthetic tar entry to exercise archive rejection."""
    with tarfile.open(origin / "kit.tar.gz", "w:gz") as archive:
        entry = tarfile.TarInfo(entry_name)
        entry.type = entry_type
        entry.linkname = linkname
        entry.size = len(name.encode()) if entry_type == tarfile.REGTYPE else 0
        archive.addfile(entry, __import__("io").BytesIO(name.encode()) if entry.size else None)


def snapshot(root):
    if not root.exists():
        return None
    records = []
    for current, directories, files in os.walk(root, followlinks=False):
        directories.sort()
        files.sort()
        current_path = Path(current)
        for name in directories + files:
            path = current_path / name
            relative = path.relative_to(root).as_posix()
            mode = path.lstat().st_mode
            if path.is_symlink():
                record = (relative, "link", mode, os.readlink(path))
            elif path.is_dir():
                record = (relative, "dir", mode)
            else:
                record = (relative, "file", mode, sha256(path.read_bytes()).hexdigest())
            records.append(record)
    return tuple(records)


def bubblewrap_args(work, node):
    args = [
        "bwrap", "--unshare-all", "--die-with-parent", "--ro-bind", "/usr", "/usr",
        "--proc", "/proc", "--dev", "/dev", "--tmpfs", "/tmp",
        "--dir", "/runtime", "--ro-bind", str(node), "/runtime/node",
    ]
    for system_dir in ("/bin", "/lib", "/lib64"):
        if Path(system_dir).exists():
            args.extend(("--ro-bind", system_dir, system_dir))
    args.extend(("--bind", str(work), "/work", "--chdir", "/work", "--clearenv"))
    return args


def run_isolated(work, node, command, extra_env=None):
    args = bubblewrap_args(work, node)
    env = {"HOME": "/work/home", "CODEX_HOME": "/work/codex-home", "PATH": "/runtime:/usr/bin:/bin",
           "LANG": "C.UTF-8", "TZ": "UTC"}
    env.update(extra_env or {})
    for key, value in env.items():
        args.extend(("--setenv", key, value))
    result = subprocess.run(args + command, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                            check=False)
    return result.returncode, result.stdout


def check_remote(stage, node):
    work = stage / "remote"
    work.mkdir()
    (work / "home").mkdir()
    (work / "origin").mkdir()
    shutil.copyfile(ROOT / "instalar-remoto.sh", work / "instalar-remoto.sh")
    (work / "instalar-remoto.sh").chmod(0o644)
    sha1 = "1" * 40
    sha2 = "2" * 40
    origin = work / "origin"
    (origin / "sha").write_text(sha1 + "\n")
    synthetic_package(origin, "first")

    def invoke(*args):
        code, output = run_isolated(work, node, ["/usr/bin/bash", "./instalar-remoto.sh", *args],
                                    {"FLUCASTR_ORIGEN": "/work/origin"})
        if code != 0:
            raise RuntimeError(f"bootstrap sintético falló ({args[0] if args else 'instalación'}): {output[-600:]}")
        return output

    urls = invoke("--mostrar-urls")
    if "https://" not in urls:
        raise RuntimeError("--mostrar-urls no produjo destinos esperados")
    installed = invoke()
    if "Instalado:" not in installed or not (work / "home/.flucastr-ai/version").exists():
        raise RuntimeError("no se materializó el estado sintético de instalación")
    installed_kit = work / "home/.flucastr-ai/kit"
    if (installed_kit / "tools").exists() or (installed_kit / "adapters").exists():
        raise RuntimeError("la instalación sin directorios opcionales cambió su contenido")
    if (installed_kit / "core").exists():
        raise RuntimeError("la instalación sintética sin core creó el directorio")
    same = invoke()
    if "al día" not in same:
        raise RuntimeError("la repetición con el mismo SHA no quedó al día")
    (origin / "sha").write_text(sha2 + "\n")
    synthetic_package(origin, "second", include_core=True)
    updated = invoke()
    if "Actualizado:" not in updated or "second" not in (work / "home/.flucastr-ai/kit/agentes/synthetic.md").read_text():
        raise RuntimeError("la actualización sintética no reemplazó la versión instalada")
    core_module = work / "home/.flucastr-ai/kit/core/synthetic-module.sh"
    if not core_module.is_file() or core_module.read_text() != "synthetic core second\n" or core_module.stat().st_mode & 0o777 != 0o755:
        raise RuntimeError("la actualización sintética no conservó el archivo regular de core")

    state_before = snapshot(work / "home/.flucastr-ai")
    status = invoke("--estado")
    if "instalada:" not in status or "publicada:" not in status or snapshot(work / "home/.flucastr-ai") != state_before:
        raise RuntimeError("--estado no conservó exactamente el árbol instalado")

    def rejection(label, args, setup, expected, prior_install=True):
        case = work / "negative" / label
        case.mkdir(parents=True)
        home = case / "home"
        origin_case = case / "origin"
        home.mkdir()
        origin_case.mkdir()
        shutil.copyfile(work / "instalar-remoto.sh", case / "instalar-remoto.sh")
        if prior_install:
            installed = home / ".flucastr-ai"
            put(installed, "version", f"sha={sha1}\nfecha=synthetic\nref=synthetic\n")
            put(installed, "kit/agentes/synthetic.md", "prior-install\n")
        setup(origin_case)
        before = snapshot(home / ".flucastr-ai")
        code, output = run_isolated(
            case, node, ["/usr/bin/bash", "./instalar-remoto.sh", *args],
            {"FLUCASTR_ORIGEN": "/work/origin"},
        )
        if code == 0 or expected not in output:
            raise RuntimeError(f"caso negativo {label}: código/motivo inesperado ({code})")
        after = snapshot(home / ".flucastr-ai")
        if before != after:
            raise RuntimeError(f"caso negativo {label}: cambió el estado previo")
        return label

    def valid_sha(origin):
        (origin / "sha").write_text(sha2 + "\n")

    cases = []
    cases.append(rejection("actualizar-sin-instalacion", ("--actualizar",), valid_sha,
                           "No hay instalación", prior_install=False))
    cases.append(rejection("ref-invalida", ("--ref", "bad;ref"), valid_sha, "--ref no es válido"))
    cases.append(rejection("sha-ausente", (), lambda origin: None, "No encuentro"))
    cases.append(rejection("sha-invalido", (), lambda origin: (origin / "sha").write_text("not-a-sha\n"),
                           "El sha recibido no es válido"))
    cases.append(rejection("tar-ausente", (), valid_sha, "No encuentro"))
    cases.append(rejection("tar-ilegible", (), lambda origin: (valid_sha(origin),
                           (origin / "kit.tar.gz").write_bytes(b"not a tar.gz")), "RECHAZADO: el paquete no se puede leer"))
    cases.append(rejection("ruta-absoluta", (), lambda origin: (valid_sha(origin),
                           hostile_package(origin, "escape", "/synthetic-escape")), "RECHAZADO: ruta absoluta"))
    cases.append(rejection("ruta-parent", (), lambda origin: (valid_sha(origin),
                           hostile_package(origin, "escape", "../synthetic-escape")), "RECHAZADO: ruta con '..'"))
    cases.append(rejection("symlink", (), lambda origin: (valid_sha(origin),
                           hostile_package(origin, "", "fixture-root/link", tarfile.SYMTYPE, "target")),
                           "RECHAZADO: entrada que no es archivo ni carpeta"))
    cases.append(rejection("hardlink", (), lambda origin: (valid_sha(origin),
                           hostile_package(origin, "", "fixture-root/link", tarfile.LNKTYPE, "target")),
                           "RECHAZADO: entrada que no es archivo ni carpeta"))
    return ("bootstrap remoto sintético: URLs, --estado sin escrituras, instalación sin core y actualización con core; "
            f"rechazos={','.join(cases)}; árbol y versión previos idénticos; sin red")


def copy_real_kit(source):
    """Create a local package from the permitted real kit paths and synthetic exclusions."""
    for relative in ("instalar.sh", "desinstalar.sh", "instalar-remoto.sh", "modelos.json"):
        shutil.copy2(ROOT / relative, source / relative)
    for relative in ("scripts", "agentes", "skills", "tools", "adapters"):
        shutil.copytree(ROOT / relative, source / relative)
    # These markers prove that unrelated package paths remain excluded.
    for relative in ("pruebas/marker.txt", "definitions/marker.txt", "features/marker.txt", "README.md"):
        put(source, relative, "synthetic excluded path\n")


def check_remote_copy(stage, node):
    work = stage / "remote-copy"
    work.mkdir()
    (work / "home").mkdir()
    origin = work / "origin"
    source = origin / "source"
    source.mkdir(parents=True)
    copy_real_kit(source)
    (origin / "sha").write_text("3" * 40 + "\n")
    with tarfile.open(origin / "kit.tar.gz", "w:gz") as archive:
        archive.add(source, arcname="fixture-root")
    shutil.copyfile(ROOT / "instalar-remoto.sh", work / "instalar-remoto.sh")
    code, output = run_isolated(
        work, node, ["/usr/bin/bash", "./instalar-remoto.sh"],
        {"FLUCASTR_ORIGEN": "/work/origin"},
    )
    if code != 0:
        raise RuntimeError(f"instalación remota con módulos futuros falló: {output[-1000:]}")
    installed = work / "home/.flucastr-ai/kit"
    for relative in ("tools/model-resolution/models.mjs", "adapters/pi/file-lock.mjs"):
        source_file = source / relative
        installed_file = installed / relative
        if not source_file.is_file() or not installed_file.is_file() or \
                sha256(source_file.read_bytes()).digest() != sha256(installed_file.read_bytes()).digest():
            raise RuntimeError(f"el kit remoto no conservó el módulo real {relative}")
    for relative in ("pruebas", "definitions", "features", "README.md"):
        if (installed / relative).exists():
            raise RuntimeError(f"el kit remoto copió una ruta no permitida: {relative}")
    code, output = run_isolated(
        work, node,
        ["/usr/bin/bash", "./home/.flucastr-ai/kit/instalar.sh", "--copiar", "--simular"],
    )
    if code != 0:
        raise RuntimeError(f"instalar.sh --copiar --simular desde el kit falló: {output[-1000:]}")
    # A conflicting cwd config makes this prove that the installed resolver uses
    # the root of its installed kit, not the caller's working directory.
    put(work, "modelos.json", "{ invalid synthetic cwd config\n")
    code, model = run_isolated(
        work, node,
        ["/runtime/node", "./home/.flucastr-ai/kit/scripts/resolver.mjs", "modelo", "principal", "codex"],
    )
    if code != 0 or not model.strip():
        raise RuntimeError(f"el resolver instalado no leyó modelos.json desde la raíz del kit remoto: {model[-600:]}")
    code, combined = run_isolated(
        work, node,
        ["/runtime/node", "./home/.flucastr-ai/kit/scripts/resolver.mjs", "modelo-esfuerzo", "principal", "codex"],
    )
    if code != 0 or not combined.strip() or combined.split(":", 1)[0] != model.strip():
        raise RuntimeError("la resolución de modelo/esfuerzo no coincide en el kit remoto instalado")
    return ("copia remota del kit real: tools/ y adapters/ conservados; rutas excluidas ausentes; "
            "instalar.sh --copiar --simular pasó; resolver instalado obtuvo modelo y modelo-esfuerzo "
            "desde su raíz con cwd conflictivo; sin red")


def check_meter(stage, node):
    work = stage / "meter"
    meter = work / "pruebas/revisor-luna"
    meter.mkdir(parents=True)
    (work / "scripts").mkdir()
    (work / "home").mkdir()
    (work / "codex-home").mkdir()
    shutil.copyfile(ROOT / "pruebas/revisor-luna/medir.mjs", meter / "medir.mjs")
    shutil.copyfile(ROOT / "scripts/tarifas.json", work / "scripts/tarifas.json")
    for case_id in ("synthetic-a", "synthetic-b"):
        case = meter / "casos" / case_id
        put(case, "oracle.json", '{"defecto": false, "palabras": []}\n')
        put(case, "plan.md", "fixture sintético\n")
        put(case, "diff.patch", "diff --git a/a b/a\n")
    fake = """#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const args = process.argv.slice(2);
const model = args[args.indexOf('-m') + 1];
const dir = join(process.env.CODEX_HOME, 'sessions', 'synthetic');
mkdirSync(dir, { recursive: true });
const usage = { input_tokens: 10000, cached_input_tokens: 2000, output_tokens: 1000 };
const lines = [{ type: 'turn_context', payload: { model } },
  { type: 'event_msg', payload: { type: 'token_count', info: { total_token_usage: usage } } }];
writeFileSync(join(dir, `rollout-${process.pid}.jsonl`), lines.map(JSON.stringify).join('\\n') + '\\n');
process.stdout.write(JSON.stringify({ veredicto: 'APROBADO', defectos: [] }) + '\\n');
"""
    put(work, "bin/codex", fake, 0o755)
    code, output = run_isolated(
        work, node,
        ["/runtime/node", "pruebas/revisor-luna/medir.mjs", "--autoprueba"],
        {"PATH": "/work/bin:/runtime:/usr/bin:/bin"},
    )
    if code != 0 or "AUTOPRUEBA OK" not in output:
        raise RuntimeError(f"autoprueba sintética del medidor falló: {output[-600:]}")
    if (meter / "resultados.jsonl").exists():
        raise RuntimeError("la autoprueba escribió el archivo persistente de resultados")
    return "autoprueba offline del medidor: 2 casos sintéticos, Codex falso, sin resultados persistentes"


def main():
    bwrap = shutil.which("bwrap")
    node = shutil.which("node")
    if not bwrap or not node:
        raise SystemExit("se requiere Bubblewrap y Node en el host")
    node = Path(node).resolve()
    with tempfile.TemporaryDirectory(prefix="a3-synthetic-") as temporary:
        stage = Path(temporary)
        print(check_remote(stage, node))
        print(check_remote_copy(stage, node))
        print(check_meter(stage, node))
    print("OpenSpec: omisión explícita conservada en salida sanitizada de verify; no se abrió su árbol ausente")


if __name__ == "__main__":
    main()
