import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "../src/core/server.mjs";
import { loadConfig } from "../src/core/config.mjs";
import { AppError } from "../src/core/errors.mjs";
import { assetRoutes } from "../src/core/assets.mjs";
import { createRequestState } from "../public/core/request-state.js";

test("shared server runs a non-inventory module and enforces its own scope", async (t) => {
  const config = {
    ...loadConfig({ INTRANET_AUTH: "local" }),
    localUser: { username: "test-user", teams: ["A"] },
  };
  let calls = 0;
  const module = {
    assets: {},
    session: (user) => ({ teams: user.teams }),
    routes: {
      "/api/records": {
        method: "POST",
        parse(raw) {
          if (
            !raw ||
            raw.operation !== "find" ||
            !["A", "B"].includes(raw.team) ||
            Object.keys(raw).length !== 2
          )
            throw new AppError(400, "invalid_request", "invalid");
          return raw;
        },
        authorize: ({ user, input }) => user.teams.includes(input.team),
        run: async ({ input }) => {
          calls++;
          return { status: "success", data: { team: input.team, records: [] } };
        },
      },
    },
  };
  const server = createApp(config, module, { audit: () => {} });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  });
  config.origin = `http://127.0.0.1:${server.address().port}`;
  const post = (body, origin = config.origin) =>
    fetch(config.origin + "/api/records", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const good = await post({ operation: "find", team: "A" });
  assert.equal(good.status, 200);
  assert.deepEqual((await good.json()).data, { team: "A", records: [] });
  assert.equal((await post({ operation: "find", team: "B" })).status, 403);
  assert.equal(
    (await post({ operation: "find", team: "A", tool: "write-anything" }))
      .status,
    400,
  );
  assert.equal(
    (await post({ operation: "find", team: "A" }, "https://elsewhere.invalid"))
      .status,
    403,
  );
  assert.equal(calls, 1);
  const status = await (await fetch(config.origin + "/api/status")).json();
  assert.deepEqual(status.teams, ["A"]);
  assert.equal(status.plants, undefined);
  const response = await fetch(config.origin + "/api/status");
  assert.match(
    response.headers.get("content-security-policy"),
    /frame-src 'none'/,
  );
});
test("module routes cannot omit admission or input validation", () => {
  const config = loadConfig({ INTRANET_AUTH: "local" });
  for (const route of [
    { method: "POST", run() {} },
    {
      method: "POST",
      authorize() {
        return true;
      },
      run() {},
    },
    { method: "GET", run() {} },
  ])
    assert.throws(() =>
      createApp(config, { assets: {}, routes: { "/api/example": route } }),
    );
  assert.throws(() =>
    assetRoutes(new URL("../public/", import.meta.url), { "/file": "../.env" }),
  );
});
test("changing selection aborts and revokes old responses, including a late error", async () => {
  const state = createRequestState();
  const first = state.begin();
  let resolveOld;
  const old = new Promise((resolve) => {
    resolveOld = resolve;
  }).then((value) => {
    if (first.isCurrent()) state.data = value;
  });
  const second = state.begin();
  assert.equal(first.signal.aborted, true);
  assert.equal(first.isCurrent(), false);
  state.data = { id: "new" };
  resolveOld({ id: "old" });
  await old;
  assert.deepEqual(state.data, { id: "new" });
  state.invalidate();
  assert.equal(second.signal.aborted, true);
  assert.equal(second.isCurrent(), false);
});
