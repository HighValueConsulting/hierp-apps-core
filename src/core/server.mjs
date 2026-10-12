import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { authenticate } from "./auth.mjs";
import { AppError } from "./errors.mjs";

/** Module hooks are trusted server code, never browser-supplied definitions. */
export function createApp(
  config,
  module,
  {
    audit = (record) => process.stdout.write(`${JSON.stringify(record)}\n`),
  } = {},
) {
  if (!module?.routes || !module.assets)
    throw new Error("An application module is required");
  const routes = new Map(Object.entries(module.routes));
  for (const [path, route] of routes) {
    if (
      !/^\/api\/[a-z0-9/-]+$/.test(path) ||
      ["/api/status"].includes(path) ||
      !["GET", "POST"].includes(route.method) ||
      typeof route.run !== "function" ||
      typeof route.authorize !== "function"
    )
      throw new Error("Invalid application route");
    if (route.method === "POST" && typeof route.parse !== "function")
      throw new Error("POST route requires input validation");
  }
  const frameOrigins = module.frameOrigins ?? [];
  for (const origin of frameOrigins) {
    const url = new URL(origin);
    if (url.protocol !== "https:" || url.origin !== origin)
      throw new Error("Invalid frame origin");
  }
  const securityHeaders = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": `default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-src ${frameOrigins.length ? frameOrigins.join(" ") : "'none'"}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`,
  };
  const json = (res, status, data) => {
    res.writeHead(status, {
      ...securityHeaders,
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify(data));
  };
  let active = 0;
  const server = createServer(async (req, res) => {
    const requestId = randomUUID();
    for (const [name, value] of Object.entries(securityHeaders))
      res.setHeader(name, value);
    res.setHeader("X-Request-Id", requestId);
    if (req.url === "/healthz" && req.method === "GET")
      return json(res, 200, { status: "alive" });
    if (req.headers.host !== new URL(config.origin).host)
      return json(res, 403, {
        status: "invalid_host",
        message: "허용되지 않은 요청 주소입니다.",
      });
    let user;
    try {
      user = await authenticate(req.headers.authorization, config);
    } catch {
      return json(res, 500, {
        status: "authentication_unavailable",
        message: "로그인을 확인하지 못했습니다.",
      });
    }
    if (!user) {
      res.setHeader(
        "WWW-Authenticate",
        'Basic realm="HiERP intranet", charset="UTF-8"',
      );
      return json(res, 401, {
        status: "authentication_required",
        message: "사내 조회 계정으로 로그인해 주세요.",
      });
    }
    const asset = Object.hasOwn(module.assets, req.url)
      ? module.assets[req.url]
      : undefined;
    if (req.method === "GET" && asset) {
      try {
        const body = await readFile(asset.url);
        res.writeHead(200, { "Content-Type": asset.type });
        res.end(body);
      } catch {
        json(res, 500, {
          status: "asset_error",
          message: "화면을 불러오지 못했습니다.",
        });
      }
      return;
    }
    if (req.url === "/api/status" && req.method === "GET")
      return json(res, 200, {
        ...(module.session?.(user) ?? {}),
        status: config.mcpUrl ? "configured" : "not_configured",
        configured: Boolean(config.mcpUrl),
        verified: false,
        username: user.username,
        localMode: config.auth === "local",
      });
    const route = routes.get(req.url);
    if (!route)
      return json(res, 404, {
        status: "not_found",
        message: "페이지를 찾을 수 없습니다.",
      });
    if (req.method !== route.method) {
      res.setHeader("Allow", route.method);
      return json(res, 405, { status: "method_not_allowed" });
    }
    if (req.method === "POST") {
      if (req.headers.origin !== config.origin)
        return json(res, 403, {
          status: "invalid_origin",
          message: "같은 사이트에서 조회해 주세요.",
        });
      if (
        req.headers["content-type"]?.split(";")[0].trim().toLowerCase() !==
        "application/json"
      )
        return json(res, 415, { status: "invalid_content_type" });
    }
    if (active >= 8) {
      res.setHeader("Retry-After", "3");
      return json(res, 429, {
        status: "busy",
        message: "잠시 후 다시 시도해 주세요.",
      });
    }
    active++;
    const started = Date.now();
    const controller = new AbortController();
    let auditFields = {};
    res.on("close", () => {
      if (!res.writableEnded) controller.abort();
    });
    try {
      let input;
      if (req.method === "POST") {
        let bytes = 0;
        const chunks = [];
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 2048)
            throw new AppError(413, "too_large", "조회 조건이 너무 깁니다.");
          chunks.push(chunk);
        }
        let raw;
        try {
          raw = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          throw new AppError(
            400,
            "invalid_request",
            "JSON 조회 조건이 필요합니다.",
          );
        }
        input = route.parse(raw);
      }
      const context = { config, user, input, signal: controller.signal };
      if ((await route.authorize(context)) !== true)
        throw new AppError(
          403,
          "scope_denied",
          "이 요청에 대한 조회 권한이 없습니다.",
        );
      auditFields = route.audit?.(input) ?? {};
      const body = await route.run(context);
      if (!res.destroyed)
        json(res, 200, req.method === "POST" ? { ...body, requestId } : body);
    } catch (error) {
      const safe =
        error instanceof AppError
          ? error
          : new AppError(500, "internal_error", "요청 처리에 실패했습니다.");
      if (!res.destroyed)
        json(res, safe.status, {
          status: safe.code,
          message: safe.message,
          requestId,
        });
    } finally {
      active--;
      try {
        audit({
          ...auditFields,
          requestId,
          user: user.username,
          route: req.url,
          httpStatus: res.statusCode,
          durationMs: Date.now() - started,
          aborted: controller.signal.aborted,
        });
      } catch {
        /* A log failure must not change the obtained result. */
      }
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  return server;
}
export function startApp(config, module) {
  const server = createApp(config, module);
  server.listen(config.port, config.host, () =>
    process.stdout.write(
      `HiERP intranet: ${config.origin} (${config.auth}; MCP ${config.mcpUrl ? "configured, unverified" : "not configured"})\n`,
    ),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => {
      server.close();
      setTimeout(() => process.exit(0), 5000).unref();
    });
  return server;
}
