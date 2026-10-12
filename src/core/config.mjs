import { readFileSync } from "node:fs";

export function loadConfig(env = process.env) {
  const host = env.HOST || "127.0.0.1";
  const port = Number(env.PORT || 8092);
  const timeoutMs = Number(env.MCP_TIMEOUT_MS || 20000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be 1..65535");
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60000)
    throw new Error("MCP_TIMEOUT_MS must be 100..60000");
  const originUrl = new URL(env.PUBLIC_ORIGIN || `http://127.0.0.1:${port}`);
  if (
    !["https:", "http:"].includes(originUrl.protocol) ||
    originUrl.username ||
    originUrl.password ||
    originUrl.pathname !== "/" ||
    originUrl.search ||
    originUrl.hash
  )
    throw new Error("PUBLIC_ORIGIN must be a bare HTTP(S) origin");
  const auth = env.INTRANET_AUTH || "basic";
  if (!["basic", "local"].includes(auth))
    throw new Error("INTRANET_AUTH must be basic or local");
  if (
    auth === "local" &&
    (env.NODE_ENV === "production" ||
      !["127.0.0.1", "::1"].includes(host) ||
      !["127.0.0.1", "[::1]", "localhost"].includes(originUrl.hostname))
  )
    throw new Error(
      "Local mode requires a non-production loopback listener and origin",
    );
  if (env.NODE_ENV === "production" && originUrl.protocol !== "https:")
    throw new Error("Production requires an HTTPS PUBLIC_ORIGIN");
  if (auth === "basic" && originUrl.protocol !== "https:")
    throw new Error(
      "Basic authentication requires an HTTPS PUBLIC_ORIGIN and a TLS reverse proxy",
    );
  let users = [];
  if (auth === "basic") {
    if (!env.AUTH_USERS_FILE) throw new Error("AUTH_USERS_FILE is required");
    users = JSON.parse(readFileSync(env.AUTH_USERS_FILE, "utf8"));
    if (!Array.isArray(users) || users.length === 0 || users.length > 100)
      throw new Error("Configure 1..100 users");
    const seen = new Set();
    for (const user of users) {
      if (
        !/^[a-zA-Z0-9_.@-]{1,80}$/.test(user.username) ||
        seen.has(user.username) ||
        !/^[0-9a-f]{32}$/.test(user.salt) ||
        !/^[0-9a-f]{128}$/.test(user.hash)
      )
        throw new Error("Invalid auth user record");
      seen.add(user.username);
    }
  }
  let mcpUrl;
  if (env.HIERP_MCP_URL) {
    const url = new URL(env.HIERP_MCP_URL);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/mcp"
    )
      throw new Error(
        "HIERP_MCP_URL must be an HTTP(S) /mcp URL without credentials/query",
      );
    mcpUrl = url.href;
  }
  return {
    host,
    port,
    timeoutMs,
    origin: originUrl.origin,
    auth,
    users,
    localUser: { username: "local-developer" },
    mcpUrl,
    mcpToken: env.HIERP_MCP_TOKEN || "",
  };
}
