import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { appConfig, buildApp } from "../src/server.mjs";
test("starter runs without SAP and never fabricates lookup success", async (t) => {
  const config = appConfig({});
  const server = buildApp(config);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  });
  config.origin = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(config.origin);
  assert.equal(page.status, 200);
  const status = await (await fetch(config.origin + "/api/status")).json();
  assert.equal(status.configured, false);
  const r = await fetch(config.origin + "/api/read", {
    method: "POST",
    headers: { origin: config.origin, "content-type": "application/json" },
    body: JSON.stringify({ operation: "lookup", reference: "EXAMPLE" }),
  });
  assert.equal(r.status, 501);
  assert.equal((await fetch(config.origin + "/.env")).status, 404);
});
