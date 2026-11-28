import subprocess, json, sys
r = subprocess.run(["node", "-e", 'process.stdout.write("child-ok");process.stderr.write("err-ok")'], capture_output=True, timeout=5)
assert (r.returncode, r.stdout, r.stderr) == (0, b"child-ok", b"err-ok"), repr(r)
print(json.dumps({"status":r.returncode,"stdout":r.stdout.decode(),"stderr":r.stderr.decode()}))
