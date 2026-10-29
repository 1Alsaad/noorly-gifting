import { createServer } from "node:http";
import { Readable } from "node:stream";
import { handleHttp } from "../src/http.js";
import { closeDatabase } from "../src/database.js";
const port = Number(process.env.PORT ?? 8080);
const server = createServer(async (req, res) => {
  const origin = `http://127.0.0.1:${port}`;
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value !== undefined)
      headers.set(name, Array.isArray(value) ? value.join(",") : value);
  }
  try {
    const request = new Request(new URL(req.url ?? "/", origin), {
      method: req.method,
      headers,
      ...(req.method !== "GET" && req.method !== "HEAD"
        ? {
            body: Readable.toWeb(req) as ReadableStream<Uint8Array>,
            duplex: "half",
          }
        : {}),
    } as RequestInit);
    const response = await handleHttp(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(500);
    res.end("Request failed");
  }
});
// This helper is local-only; eve start supplies cloud schedules and the production HTTP surface.
server.listen(port, "127.0.0.1", () =>
  console.log(`Noorly dashboard: http://127.0.0.1:${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    server.close();
    void closeDatabase().then(() => process.exit());
  });
