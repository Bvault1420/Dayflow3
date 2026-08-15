/**
 * Firefox often resolves "localhost" to IPv6 ::1 first and does not fall back
 * to 127.0.0.1 — that shows as "Verbindung fehlgeschlagen".
 * Next.js bound to 0.0.0.0 only listens on IPv4, so we also accept ::1.
 */
import net from "node:net";

export function listenIpv6Localhost(port = 3000, ipv4Host = "127.0.0.1") {
  const server = net.createServer((client) => {
    const dest = net.connect({ port, host: ipv4Host });
    const close = () => {
      client.destroy();
      dest.destroy();
    };
    client.pipe(dest);
    dest.pipe(client);
    dest.on("error", close);
    client.on("error", close);
    dest.on("close", () => client.destroy());
    client.on("close", () => dest.destroy());
  });

  server.on("error", (err) => {
    if (err && typeof err === "object" && "code" in err && err.code === "EADDRINUSE") {
      console.warn(`[ipv6-localhost] [::1]:${port} already in use — skipping`);
      return;
    }
    console.warn("[ipv6-localhost]", err instanceof Error ? err.message : err);
  });

  server.listen(port, "::1", () => {
    console.log(`Firefox localhost: http://[::1]:${port} → ${ipv4Host}:${port}`);
  });

  return server;
}

const isMain = process.argv[1] && process.argv[1].endsWith("ipv6-localhost.mjs");
if (isMain) {
  const port = Number(process.env.PORT || 3000);
  listenIpv6Localhost(port);
}
