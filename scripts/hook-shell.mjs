// Analizador de la línea de comandos del hook de permisos. Sin dependencias.
// Separa comandos, palabras, redirecciones y heredocs para que el texto citado
// o el cuerpo de un heredoc no se lea como comando. Nunca ejecuta nada.
// Lo no soportado o roto devuelve { ok: false, motivo } y nunca lanza.

const MAX_PROFUNDIDAD = 10;
const MAX_LONGITUD = 100000;
const CERRADORES = new Set(["then", "else", "elif", "fi", "do", "done", "esac", "}"]);
const NO_SOPORTADAS = new Set(["case", "select", "coproc", "function"]);
const DELIM = new Set([" ", "\t", "\n", ";", "&", "|", "(", ")", "<", ">"]);
const FIN = "<fin>";
const NOMBRE = /[A-Za-z_]\w*|\d|[@*#?$!-]/y;
const FD = /\d+(?=[<>])/y;
const CRUDO = /[^ \t\n;&|()<>]*/y;
const ASIGNACION = /^[A-Za-z_]\w*\+?=/;
const SUBINDICE = /^[A-Za-z_]\w*\[/;

class Fallo extends Error {
  constructor(motivo) {
    super(motivo);
    this.motivo = motivo;
  }
}

export function analizar(texto) {
  if (typeof texto !== "string") return { ok: false, motivo: "entrada no textual" };
  if (texto.length > MAX_LONGITUD) return { ok: false, motivo: "longitud" };
  try {
    const p = new Analizador(texto, null);
    p.lista(new Set([FIN]));
    if (p.r.pendientes.length) throw new Fallo("heredoc sin cerrar");
    return { ok: true, plano: p.r.plano, comandos: p.r.comandos };
  } catch (e) {
    if (e instanceof Fallo) return { ok: false, motivo: e.motivo };
    return { ok: false, motivo: "error interno" };
  }
}

function literal(texto) {
  return { texto, expansion: false, glob: false, baseDinamica: false, raw: texto };
}

function marcar(est) {
  est.expansion = true;
  est.dyn = true;
}

// Barra invertida seguida de salto de línea (en la posición `i`): solo une líneas
// si el carácter anterior es blanco; en otro caso la forma no es soportada.
function continuaLinea(s, i) {
  if (s[i - 1] === " " || s[i - 1] === "\t") return;
  throw new Fallo("barra y salto de línea no soportados");
}

class Analizador {
  constructor(s, padre) {
    this.s = s;
    this.i = 0;
    this.r = padre ? padre.r : { comandos: [], pendientes: [], plano: true, prof: 0 };
  }

  // Lista de comandos hasta un terminador (sin consumirlo). Devuelve su nombre.
  lista(term) {
    for (;;) {
      this.saltarEspacios();
      const t = this.terminador(term);
      if (t !== null) return t;
      const c = this.s[this.i];
      if (c === ";") {
        if (this.s[this.i + 1] === ";") throw new Fallo("';;' no soportado");
        this.i++;
        continue;
      }
      if (c === "&" && this.s[this.i + 1] !== "&" && this.s[this.i + 1] !== ">") {
        this.i++;
        continue;
      }
      if (c === "|" || this.s.startsWith("&&", this.i)) throw new Fallo("operador sin orden");
      this.elemento();
      this.saltarBlancos();
      const sig = this.s[this.i];
      if (sig !== undefined && !";&|\n)#".includes(sig)) throw new Fallo("texto tras estructura compuesta");
    }
  }

  terminador(term) {
    const s = this.s;
    if (this.i >= s.length) {
      if (term.has(FIN)) return FIN;
      throw new Fallo("estructura sin cerrar");
    }
    if (s[this.i] === ")") {
      if (term.has(")")) return ")";
      throw new Fallo("paréntesis sin abrir");
    }
    const raw = this.crudo();
    if (term.has(raw)) return raw;
    if (CERRADORES.has(raw)) throw new Fallo(`'${raw}' fuera de sitio`);
    return null;
  }

  elemento() {
    this.tuberia();
    for (;;) {
      this.saltarBlancos();
      if (this.s.startsWith("&&", this.i) || this.s.startsWith("||", this.i)) {
        this.i += 2;
        this.saltarEspacios();
        this.tuberia();
      } else {
        return;
      }
    }
  }

  tuberia() {
    this.comando();
    for (;;) {
      this.saltarBlancos();
      if (this.s[this.i] === "|" && this.s[this.i + 1] !== "|") {
        this.i += this.s[this.i + 1] === "&" ? 2 : 1;
        this.saltarEspacios();
        this.comando();
      } else {
        return;
      }
    }
  }

  comando() {
    const s = this.s;
    this.saltarBlancos();
    const c = s[this.i];
    if (c === undefined || c === ";" || c === "|" || c === ")" || (c === "&" && s[this.i + 1] !== ">")) {
      throw new Fallo("comando vacío");
    }
    if (c === "(") {
      if (s[this.i + 1] === "(") throw new Fallo("aritmética como comando no soportada");
      this.r.plano = false;
      this.i++;
      this.entrar();
      this.esperar(this.lista(new Set([")"])), ")");
      this.salir();
      this.redirigirTrailing();
      return;
    }
    const raw = this.crudo();
    if (raw === "!" || raw === "time") {
      this.i += raw.length;
      return this.comando();
    }
    if (NO_SOPORTADAS.has(raw)) throw new Fallo(`'${raw}' no soportado`);
    if (CERRADORES.has(raw)) throw new Fallo(`'${raw}' fuera de sitio`);
    if (raw === "if") return this.si();
    if (raw === "while" || raw === "until") return this.mientras(raw);
    if (raw === "for") return this.para();
    if (raw === "{") return this.grupo();
    if (raw === "[[") return this.condicional();
    return this.simple();
  }

  si() {
    this.r.plano = false;
    this.i += 2;
    this.esperar(this.lista(new Set(["then"])), "then");
    let t = this.lista(new Set(["elif", "else", "fi"]));
    while (t === "elif") {
      this.i += 4;
      this.esperar(this.lista(new Set(["then"])), "then");
      t = this.lista(new Set(["elif", "else", "fi"]));
    }
    if (t === "else") {
      this.i += 4;
      t = this.lista(new Set(["fi"]));
    }
    this.esperar(t, "fi");
    this.redirigirTrailing();
  }

  mientras(raw) {
    this.r.plano = false;
    this.i += raw.length;
    this.esperar(this.lista(new Set(["do"])), "do");
    this.esperar(this.lista(new Set(["done"])), "done");
    this.redirigirTrailing();
  }

  para() {
    this.r.plano = false;
    this.i += 3;
    this.saltarBlancos();
    const nombre = this.leer();
    if (!nombre || !/^[A-Za-z_]\w*$/.test(nombre.texto)) throw new Fallo("for no soportado");
    this.saltarBlancos();
    if (this.crudo() === "in") {
      this.i += 2;
      for (;;) {
        this.saltarBlancos();
        const c = this.s[this.i];
        if (c === undefined || ";\n&|()".includes(c)) break;
        if (!this.leer()) break;
      }
    }
    if (this.s[this.i] === ";") this.i++;
    this.esperar(this.lista(new Set(["do"])), "do");
    this.esperar(this.lista(new Set(["done"])), "done");
    this.redirigirTrailing();
  }

  grupo() {
    this.r.plano = false;
    this.i += 1;
    this.entrar();
    this.esperar(this.lista(new Set(["}"])), "}");
    this.salir();
    this.redirigirTrailing();
  }

  condicional() {
    this.r.plano = false;
    const nodo = this.nuevoNodo();
    this.i += 2;
    nodo.palabras.push(literal("[["));
    for (;;) {
      this.saltarBlancos();
      if (this.i >= this.s.length) throw new Fallo("[[ sin cerrar");
      if (this.crudo() === "]]") {
        this.i += 2;
        break;
      }
      const c = this.s[this.i];
      if (c === "\n") {
        this.saltarEspacios();
        continue;
      }
      if (this.s.startsWith("&&", this.i) || this.s.startsWith("||", this.i)) {
        nodo.palabras.push(literal(this.s.slice(this.i, this.i + 2)));
        this.i += 2;
        continue;
      }
      if (c === "(" || c === ")" || ((c === "<" || c === ">") && this.s[this.i + 1] !== "(")) {
        nodo.palabras.push(literal(c));
        this.i++;
        continue;
      }
      const w = this.leer();
      if (!w) throw new Fallo("[[ mal formado");
      nodo.palabras.push(w);
    }
    this.redirigirTrailing();
  }

  simple() {
    const s = this.s;
    const nodo = this.nuevoNodo();
    for (;;) {
      this.saltarBlancos();
      const c = s[this.i];
      if (c === undefined || c === ";" || c === "|" || c === "\n" || c === ")") break;
      if (c === "&" && s[this.i + 1] !== ">") break;
      if (c === "#") {
        this.r.plano = false;
        while (this.i < s.length && s[this.i] !== "\n") this.i++;
        break;
      }
      if (c === "(") throw new Fallo("paréntesis en argumentos");
      if (this.redirAhead()) {
        this.redir(nodo);
        continue;
      }
      const w = this.leer();
      if (!w) break;
      if (nodo.palabras.length === 0 && SUBINDICE.test(w.raw)) {
        throw new Fallo("subíndice en asignación o comando no soportado");
      }
      if (nodo.palabras.length === 0 && ASIGNACION.test(w.raw)) {
        if (s[this.i] === "(") throw new Fallo("arrays no soportados");
        nodo.asignaciones.push(w);
      } else {
        nodo.palabras.push(w);
      }
    }
  }

  nuevoNodo() {
    const nodo = { palabras: [], asignaciones: [], redirecciones: [], heredocs: [] };
    this.r.comandos.push(nodo);
    return nodo;
  }

  redirAhead() {
    const s = this.s;
    let j = this.i;
    FD.lastIndex = j;
    const m = FD.exec(s);
    if (m) j += m[0].length;
    const c = s[j];
    const n = s[j + 1];
    if (c === "&") return n === ">";
    if (c === "<" || c === ">") return n !== "(";
    return false;
  }

  redir(nodo) {
    const s = this.s;
    FD.lastIndex = this.i;
    const m = FD.exec(s);
    if (m) this.i += m[0].length;
    const c = s[this.i];
    const n = s[this.i + 1];
    let op;
    if (c === "&") {
      op = s[this.i + 2] === ">" ? "&>>" : "&>";
    } else if (c === "<") {
      if (n === "<" && s[this.i + 2] === "<") {
        op = "<<<";
      } else if (n === "<") {
        op = s[this.i + 2] === "-" ? "<<-" : "<<";
        this.i += op.length;
        const d = this.leerReq();
        const hd = { cuerpo: "", citado: /["'\\]/.test(d.raw), delim: d.texto, tabs: op === "<<-" };
        nodo.heredocs.push(hd);
        this.r.pendientes.push(hd);
        return;
      } else {
        op = n === ">" ? "<>" : n === "&" ? "<&" : "<";
      }
    } else {
      op = n === ">" ? ">>" : n === "|" ? ">|" : n === "&" ? ">&" : ">";
    }
    this.i += op.length;
    const destino = this.leerReq();
    nodo.redirecciones.push({ op, destino });
  }

  redirigirTrailing() {
    let nodo = null;
    for (;;) {
      this.saltarBlancos();
      if (!this.redirAhead()) break;
      if (!nodo) nodo = this.nuevoNodo();
      this.redir(nodo);
    }
  }

  leerReq() {
    this.saltarBlancos();
    const w = this.leer();
    if (!w) throw new Fallo("redirección sin destino");
    return w;
  }

  // Lee una palabra; devuelve null si en esta posición no hay palabra.
  leer() {
    const s = this.s;
    const ini = this.i;
    const est = { texto: "", expansion: false, glob: false, dyn: false };
    while (this.i < s.length) {
      const c = s[this.i];
      if (c === "<" || c === ">") {
        if (s[this.i + 1] !== "(") break;
        const st = this.i;
        this.i += 2;
        this.subst();
        this.r.plano = false;
        marcar(est);
        est.texto += s.slice(st, this.i);
        continue;
      }
      if (DELIM.has(c)) break;
      if (c === "'") {
        const j = s.indexOf("'", this.i + 1);
        if (j < 0) throw new Fallo("comilla sin cerrar");
        est.texto += s.slice(this.i + 1, j);
        this.i = j + 1;
        continue;
      }
      if (c === '"') {
        this.i++;
        this.leerDQ(est, "dq");
        continue;
      }
      if (c === "\\") {
        const n = s[this.i + 1];
        if (n === "\n") {
          continuaLinea(s, this.i);
          this.i += 2;
        } else if (n === undefined) {
          est.texto += "\\";
          this.i++;
        } else {
          est.texto += n;
          this.i += 2;
        }
        continue;
      }
      if (c === "$") {
        if (!this.expansionDolar(est, "palabra")) {
          est.texto += "$";
          this.i++;
        }
        continue;
      }
      if (c === "`") {
        this.comillaInversa(est);
        continue;
      }
      if (c === "*" || c === "?") {
        est.glob = true;
        est.dyn = true;
        est.texto += c;
        this.i++;
        continue;
      }
      if (c === "[") {
        let j = this.i + 1;
        while (j < s.length && !DELIM.has(s[j]) && s[j] !== "]") j++;
        if (j < s.length && s[j] === "]" && j > this.i + 1) {
          est.glob = true;
          est.dyn = true;
        }
        est.texto += c;
        this.i++;
        continue;
      }
      if (c === "{") {
        let j = this.i + 1;
        while (j < s.length && !DELIM.has(s[j]) && s[j] !== "}") j++;
        if (j < s.length && s[j] === "}" && j > this.i + 1) {
          const cont = s.slice(this.i + 1, j);
          if (cont.includes(",") || /^[^{}]*\.\.[^{}]*$/.test(cont)) {
            est.glob = true;
            est.dyn = true;
          }
        }
        est.texto += c;
        this.i++;
        continue;
      }
      if (c === "~" && this.i === ini) {
        est.glob = true;
        est.dyn = true;
      } else if (c === "/") {
        est.dyn = false;
      }
      est.texto += c;
      this.i++;
    }
    if (this.i === ini) return null;
    return {
      texto: est.texto,
      expansion: est.expansion,
      glob: est.glob,
      baseDinamica: est.dyn,
      raw: s.slice(ini, this.i),
    };
  }

  // Contenido de "..." (modo "dq") o de un heredoc sin comillas (modo "heredoc").
  leerDQ(est, modo) {
    const s = this.s;
    for (;;) {
      if (this.i >= s.length) {
        if (modo === "heredoc") return;
        throw new Fallo("comillas sin cerrar");
      }
      const c = s[this.i];
      if (c === '"' && modo === "dq") {
        this.i++;
        return;
      }
      if (c === "\\") {
        const n = s[this.i + 1];
        if (n === "\n") {
          // En heredoc sin comillas, una línea que acaba en barra no es soportada.
          if (modo === "heredoc") throw new Fallo("barra y salto en heredoc sin comillas");
          continuaLinea(s, this.i);
          this.i += 2;
          continue;
        }
        const esc = modo === "heredoc" ? "$`\\" : '$`"\\';
        if (n !== undefined && esc.includes(n)) {
          est.texto += n;
          this.i += 2;
        } else {
          est.texto += "\\";
          this.i++;
        }
        continue;
      }
      if (c === "$") {
        if (!this.expansionDolar(est, modo)) {
          est.texto += "$";
          this.i++;
        }
        continue;
      }
      if (c === "`") {
        this.comillaInversa(est);
        continue;
      }
      if (c === "/") est.dyn = false;
      est.texto += c;
      this.i++;
    }
  }

  // Expansión que empieza en `$`. Devuelve false si el `$` es literal.
  expansionDolar(est, modo) {
    const s = this.s;
    const ini = this.i;
    const n = s[ini + 1];
    if (n === "[") throw new Fallo("$[ no soportado");
    if (n === "(" && s[ini + 2] === "(") {
      this.i = ini + 3;
      this.aritmetica();
      this.r.plano = false;
    } else if (n === "(") {
      this.i = ini + 2;
      this.subst();
      this.r.plano = false;
    } else if (n === "{") {
      this.i = ini + 2;
      this.llaves();
    } else if (n === "'" && modo === "palabra") {
      this.i = ini + 2;
      this.ansi();
    } else if (n === '"' && modo === "palabra") {
      this.i = ini + 2;
      this.leerDQ({ texto: "", expansion: false, glob: false, dyn: false }, "dq");
    } else {
      NOMBRE.lastIndex = ini + 1;
      const m = NOMBRE.exec(s);
      if (!m) return false;
      this.i = ini + 1 + m[0].length;
    }
    est.texto += s.slice(ini, this.i);
    marcar(est);
    return true;
  }

  ansi() {
    const s = this.s;
    for (;;) {
      if (this.i >= s.length) throw new Fallo("comilla sin cerrar");
      const c = s[this.i];
      if (c === "\\") {
        this.i += 2;
        continue;
      }
      this.i++;
      if (c === "'") return;
    }
  }

  llaves() {
    const s = this.s;
    let d = 1;
    for (;;) {
      if (this.i >= s.length) throw new Fallo("llave sin cerrar");
      const c = s[this.i];
      if (c === "\\") {
        this.i += 2;
        continue;
      }
      if (c === "$" && s[this.i + 1] === "(") {
        this.i += 2;
        this.subst();
        continue;
      }
      if (c === "`") {
        this.comillaInversa({ texto: "", expansion: false, glob: false, dyn: false });
        continue;
      }
      if (c === "{") d++;
      else if (c === "}") {
        d--;
        if (d === 0) {
          this.i++;
          return;
        }
      }
      this.i++;
    }
  }

  aritmetica() {
    const s = this.s;
    let abiertos = 2;
    for (;;) {
      if (this.i >= s.length) throw new Fallo("aritmética sin cerrar");
      const c = s[this.i];
      if (c === "$" && s[this.i + 1] === "(") {
        this.i += 2;
        this.subst();
        continue;
      }
      if (c === "`") {
        this.comillaInversa({ texto: "", expansion: false, glob: false, dyn: false });
        continue;
      }
      if (c === "(") abiertos++;
      else if (c === ")") {
        abiertos--;
        if (abiertos === 0) {
          this.i++;
          return;
        }
      }
      this.i++;
    }
  }

  // `$(...)`: this.i queda tras el `)` de cierre.
  subst() {
    this.entrar();
    this.esperar(this.lista(new Set([")"])), ")");
    this.salir();
  }

  comillaInversa(est) {
    const s = this.s;
    const st = this.i;
    let j = this.i + 1;
    let cont = "";
    for (;;) {
      if (j >= s.length) throw new Fallo("comilla invertida sin cerrar");
      const c = s[j];
      if (c === "`") break;
      if (c === "\\" && j + 1 < s.length) {
        cont += s[j + 1];
        j += 2;
        continue;
      }
      cont += c;
      j++;
    }
    this.r.plano = false;
    this.entrar();
    const q = new Analizador(cont, this);
    q.lista(new Set([FIN]));
    this.salir();
    this.i = j + 1;
    est.texto += s.slice(st, this.i);
    marcar(est);
  }

  // Salto de blancos y barra-salto de línea (no salta saltos de línea).
  saltarBlancos() {
    const s = this.s;
    for (;;) {
      const c = s[this.i];
      if (c === " " || c === "\t") this.i++;
      else if (c === "\\" && s[this.i + 1] === "\n") {
        continuaLinea(s, this.i);
        this.i += 2;
      } else return;
    }
  }

  // Salto de blancos, saltos de línea (leyendo heredocs pendientes) y comentarios.
  saltarEspacios() {
    const s = this.s;
    for (;;) {
      const c = s[this.i];
      if (c === " " || c === "\t") this.i++;
      else if (c === "\\" && s[this.i + 1] === "\n") {
        continuaLinea(s, this.i);
        this.i += 2;
      } else if (c === "\n") {
        this.i++;
        if (this.r.pendientes.length) this.leerCuerpos();
      } else if (c === "#") {
        this.r.plano = false;
        while (this.i < s.length && s[this.i] !== "\n") this.i++;
      } else {
        return;
      }
    }
  }

  leerCuerpos() {
    const s = this.s;
    for (const hd of this.r.pendientes) {
      const inicio = this.i;
      let cierre = -1;
      for (;;) {
        if (this.i >= s.length) throw new Fallo("heredoc sin cerrar");
        const ini = this.i;
        const eol = s.indexOf("\n", this.i);
        const fin = eol < 0 ? s.length : eol;
        let linea = s.slice(ini, fin);
        this.i = eol < 0 ? s.length : eol + 1;
        if (hd.tabs) linea = linea.replace(/^\t+/, "");
        if (linea === hd.delim) {
          cierre = ini;
          break;
        }
      }
      hd.cuerpo = s.slice(inicio, cierre);
      if (!hd.citado) {
        const q = new Analizador(hd.cuerpo, this);
        q.leerDQ({ texto: "", expansion: false, glob: false, dyn: false }, "heredoc");
      }
    }
    this.r.pendientes = [];
  }

  crudo() {
    CRUDO.lastIndex = this.i;
    return CRUDO.exec(this.s)[0];
  }

  esperar(t, nombre) {
    if (t !== nombre) throw new Fallo(`se esperaba '${nombre}'`);
    this.i += nombre.length;
  }

  entrar() {
    if (++this.r.prof > MAX_PROFUNDIDAD) throw new Fallo("profundidad excesiva");
  }

  salir() {
    this.r.prof--;
  }
}
