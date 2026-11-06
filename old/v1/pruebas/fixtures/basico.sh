#!/usr/bin/env bash
set -euo pipefail
[[ $# == 1 ]] || { echo 'uso: basico.sh DIRECTORIO' >&2; exit 2; }
ROOT="$(cd "$(dirname "$0")" && pwd)"; source "$ROOT/_comun.sh"
out="$(mkdir -p "$1" && cd "$1" && pwd)"; canario="$(preparar_workspace "$out" B)"
remotos="$(directorio_remotos "$out")"
inicializar_repo "$out/app" 'Aplicación React Router' "$remotos/app.git"
cat > "$out/app/package.json" <<'EOF'
{"name":"fixture-app","private":true,"type":"module","scripts":{"dev":"react-router dev","build":"react-router build"},"dependencies":{"@react-router/node":"^7.0.0","@react-router/serve":"^7.0.0","react":"^19.0.0","react-dom":"^19.0.0","react-router":"^7.0.0"},"devDependencies":{"@react-router/dev":"^7.0.0","vite":"^6.0.0","typescript":"^5.0.0"}}
EOF
cat > "$out/app/react-router.config.ts" <<'EOF'
import type { Config } from "@react-router/dev/config";
export default { ssr: true } satisfies Config;
EOF
cat > "$out/app/vite.config.ts" <<'EOF'
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
export default defineConfig({ plugins: [reactRouter()] });
EOF
mkdir -p "$out/app/app/routes"
cat > "$out/app/app/root.tsx" <<'EOF'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
export function Layout({ children }: { children: React.ReactNode }) { return <html lang="es"><head><Meta/><Links/></head><body>{children}<ScrollRestoration/><Scripts/></body></html>; }
export default function Root() { return <Outlet/>; }
EOF
cat > "$out/app/app/routes.ts" <<'EOF'
import { type RouteConfig, index } from "@react-router/dev/routes";
export default [index("./routes/home.tsx")] satisfies RouteConfig;
EOF
printf 'export default function Home() { return <h1>Inicio</h1>; }\n' > "$out/app/app/routes/home.tsx"
git -C "$out/app" add package.json react-router.config.ts vite.config.ts app
GIT_AUTHOR_DATE='2026-01-01T00:00:00Z' GIT_COMMITTER_DATE='2026-01-01T00:00:00Z' git -C "$out/app" commit --amend -qm componente
git -C "$out/app" push -qf origin main
printf 'B generado; canario único: %s\n' "$canario"; printf '%s\n' "$out"
