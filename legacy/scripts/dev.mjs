/**
 * Dev server that works in Chrome and Firefox:
 * - Next.js on 0.0.0.0 (IPv4 / Cursor preview)
 * - extra listener on ::1 so Firefox "localhost" does not fail
 */
import { spawn } from "node:child_process";
import { listenIpv6Localhost } from "./ipv6-localhost.mjs";

const port = Number(process.env.PORT || 3000);
listenIpv6Localhost(port);

const next = spawn(
  "npx",
  ["next", "dev", "--turbopack", "--hostname", "0.0.0.0", "--port", String(port)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      // Prefer IPv4 when the server itself talks to localhost
      NODE_OPTIONS: [process.env.NODE_OPTIONS, "--dns-result-order=ipv4first"]
        .filter(Boolean)
        .join(" "),
    },
  }
);

function shutDown(code = 0) {
  next.kill("SIGTERM");
  process.exit(code);
}

process.on("SIGINT", () => shutDown(0));
process.on("SIGTERM", () => shutDown(0));
next.on("exit", (code) => process.exit(code ?? 0));
