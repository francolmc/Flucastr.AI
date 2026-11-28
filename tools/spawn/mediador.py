#!/usr/bin/env python3
"""Captura incremental acotada para el transporte de child_process de Node."""
import json
import os
import selectors
import signal
import subprocess
import sys
import time

_ACTIVE = None
_EXTERNAL_SIGNAL = None
def _on_signal(signum, frame):
    global _EXTERNAL_SIGNAL
    _EXTERNAL_SIGNAL = signum
    if _ACTIVE is not None:
        group_signal(_ACTIVE, signum)
signal.signal(signal.SIGTERM, _on_signal)
signal.signal(signal.SIGINT, _on_signal)


def group_signal(proc, sig):
    try:
        signo = getattr(signal, sig) if isinstance(sig, str) else sig
        if os.name == "posix" and os.getpgid(proc.pid) == proc.pid:
            os.killpg(proc.pid, signo)
        else:
            proc.send_signal(signo)
    except ProcessLookupError:
        pass


def main(path):
    cfg = json.load(open(path, encoding="utf-8"))
    out_path, err_path, meta_path = cfg["stdout"], cfg["stderr"], cfg["meta"]
    out = open(out_path, "wb")
    err = open(err_path, "wb")
    proc = None
    result = {"status": None, "signal": None, "error": None, "pid": None}
    try:
        stdio = cfg.get("stdio", ["pipe", "pipe", "pipe"])
        stdin = open(cfg["input"], "rb") if cfg.get("input") else (None if isinstance(stdio[0], int) or stdio[0] == "inherit" else subprocess.DEVNULL)
        stdout_mode = subprocess.PIPE if stdio[1] == "pipe" else (None if isinstance(stdio[1], int) or stdio[1] == "inherit" else subprocess.DEVNULL)
        stderr_mode = subprocess.PIPE if stdio[2] == "pipe" else (None if isinstance(stdio[2], int) or stdio[2] == "inherit" else subprocess.DEVNULL)
        argv = cfg["argv"]
        shell_value = cfg.get("shell")
        if shell_value:
            argv = " ".join(argv)
        elif cfg.get("argv0") and argv:
            kwargs_argv0 = [cfg["argv0"], *argv[1:]]
        else:
            kwargs_argv0 = argv
        if not shell_value: argv = kwargs_argv0
        kwargs = {"cwd": cfg.get("cwd"), "env": cfg.get("env"), "stdin": stdin,
                  "stdout": stdout_mode, "stderr": stderr_mode, "shell": bool(shell_value)}
        if shell_value and isinstance(shell_value, str): kwargs["executable"] = shell_value
        elif cfg.get("argv0") and not shell_value: kwargs["executable"] = cfg["argv"][0]
        if cfg.get("uid") is not None: kwargs["user"] = cfg["uid"]
        if cfg.get("gid") is not None: kwargs["group"] = cfg["gid"]
        if cfg.get("umask") is not None: kwargs["umask"] = cfg["umask"]
        if os.name == "posix": kwargs["start_new_session"] = bool(cfg.get("newSession", False))
        proc = subprocess.Popen(argv, **kwargs)
        global _ACTIVE
        _ACTIVE = proc
        if _EXTERNAL_SIGNAL is not None: group_signal(proc, _EXTERNAL_SIGNAL)
        result["pid"] = proc.pid
        if cfg.get("pidfile"):
            with open(cfg["pidfile"], "w", encoding="ascii") as pf: pf.write(str(proc.pid))
        sel = selectors.DefaultSelector()
        if proc.stdout is not None: sel.register(proc.stdout, selectors.EVENT_READ, out)
        if proc.stderr is not None: sel.register(proc.stderr, selectors.EVENT_READ, err)
        seen = 0
        limit = cfg.get("maxBuffer")
        deadline = None if cfg.get("timeout") in (None, 0) else time.monotonic() + cfg["timeout"] / 1000
        timed_out = False
        overflow = False
        while sel.get_map() or proc.poll() is None:
            if deadline is not None and time.monotonic() >= deadline and proc.poll() is None:
                timed_out = True
                group_signal(proc, cfg.get("killSignal", "SIGTERM"))
                deadline = None
            events = sel.select(0.02)
            for key, _ in events:
                chunk = os.read(key.fileobj.fileno(), 65536)
                if not chunk:
                    sel.unregister(key.fileobj)
                    key.fileobj.close()
                    continue
                if limit is not None and seen + len(chunk) > limit:
                    keep = max(0, limit + 1 - seen)
                    if keep:
                        key.data.write(chunk[:keep])
                    if not overflow:
                        overflow = True
                        if not timed_out: group_signal(proc, cfg.get("killSignal", "SIGTERM"))
                elif not overflow:
                    key.data.write(chunk)
                seen += len(chunk)
        code = proc.wait()
        _ACTIVE = None
        if code < 0:
            result["signal"] = signal.Signals(-code).name
        else:
            result["status"] = code
        if timed_out:
            result["error"] = {"code": "ETIMEDOUT", "message": "spawnSync timed out"}
        elif overflow:
            result["error"] = {"code": "ENOBUFS", "message": "spawnSync maxBuffer length exceeded"}
    except OSError as exc:
        number = getattr(exc, "errno", None)
        result["error"] = {"code": __import__("errno").errorcode.get(number, "EIO") if number else "EIO", "errno": -abs(number) if number else None, "message": str(exc)}
    except Exception as exc:
        result["error"] = {"code": "EIO", "message": str(exc)}
    finally:
        if proc is not None and proc.poll() is None:
            group_signal(proc, cfg.get("killSignal", "SIGTERM"))
            proc.wait()
        out.close()
        err.close()
        with open(meta_path, "w", encoding="utf-8") as meta:
            json.dump(result, meta)


if __name__ == "__main__":
    main(sys.argv[1])
