import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const install = process.env.PI_MANAGED_INSTALL_ROOT;
if (!install) throw new Error("faux Pi test requires PI_MANAGED_INSTALL_ROOT");
const version = readFileSync(join(install, "current-version"), "utf8").trim();
const fauxPath = join(install, "releases", version, "node_modules/@earendil-works/pi-ai/dist/providers/faux.js");
const { fauxProvider, fauxAssistantMessage, fauxToolCall } = await import(pathToFileURL(fauxPath).href);

export default function (pi) {
  const faux = fauxProvider({ models: [{
    id: "test",
    name: "Local test model",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 10000,
    maxTokens: 1000,
  }] });
  const responder = async (context, _options, state) => {
    const transcript = JSON.stringify(context.messages ?? context);
    if (transcript.includes("FLUCASTR-LAUNCH:")) {
      if (transcript.includes("FLUCASTR-TEST-ABORT")) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return fauxAssistantMessage("No debe llegar al proveedor durante la interrupción.");
      }
      const marker = transcript.match(/FLUCASTR-LAUNCH: plan=([^;\"]+); segment=(\d+); desde=(\d+)/);
      if (!marker) return fauxAssistantMessage("INVALIDO: marcador ausente");
      return fauxAssistantMessage(`DONE: plan=${marker[1]}; segment=${marker[2]}; verify=pasa`);
    }
    if (state.callCount === 1) {
      const abort = process.env.FLUCASTR_PI_E2E_ABORT === "1" ? "FLUCASTR-TEST-ABORT\n" : "";
      const mark = `FLUCASTR-LAUNCH: plan=changes/prueba/plan.md; segment=4; desde=${Date.now()}`;
      return fauxAssistantMessage(fauxToolCall("subagent", {
        agent: "builder",
        async: false,
        task: `${mark}\n${abort}Return exactly: DONE: plan=changes/prueba/plan.md; segment=4; verify=pasa`,
      }));
    }
    return fauxAssistantMessage("El subagente terminó.");
  };
  faux.setResponses(Array.from({ length: 12 }, () => responder));
  pi.registerProvider(faux.provider);
  pi.on("message_end", (event, ctx) => {
    const content = event.message?.content;
    const text = Array.isArray(content) ? content.map((part) => part.type === "text" ? part.text : "").join(" ") : typeof content === "string" ? content : "";
    if (process.env.FLUCASTR_PI_E2E_ABORT === "1" && event.message?.role === "user" && text.includes("FLUCASTR-TEST-ABORT")) {
      setTimeout(() => ctx.abort(), 10);
    }
  });
}
