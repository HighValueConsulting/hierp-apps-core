import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { AppError } from "./errors.mjs";

export async function withMcp(config, signal, action) {
  if (!config.mcpUrl)
    throw new AppError(
      503,
      "not_configured",
      "사내 HiERP MCP 주소가 아직 설정되지 않았습니다.",
    );
  const deadline = AbortSignal.any([
    AbortSignal.timeout(config.timeoutMs),
    ...(signal ? [signal] : []),
  ]);
  const client = new Client({
    name: config.clientName || "hierp-intranet",
    version: "0.1.0",
  });
  const transport = new StreamableHTTPClientTransport(new URL(config.mcpUrl), {
    requestInit: {
      headers: config.mcpToken
        ? { Authorization: `Bearer ${config.mcpToken}` }
        : {},
    },
    reconnectionOptions: {
      maxRetries: 0,
      maxReconnectionDelay: 0,
      initialReconnectionDelay: 0,
      reconnectionDelayGrowFactor: 1,
    },
    fetch: (url, init) =>
      fetch(url, {
        ...init,
        redirect: "error",
        signal: AbortSignal.any([
          deadline,
          ...(init?.signal ? [init.signal] : []),
        ]),
      }),
  });
  try {
    await client.connect(transport, {
      signal: deadline,
      timeout: config.timeoutMs,
    });
    return await action(client, {
      signal: deadline,
      timeout: config.timeoutMs,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (deadline.aborted)
      throw new AppError(
        504,
        "upstream_timeout",
        "조회 시간이 초과되었습니다. 다시 조회해 주세요.",
      );
    throw new AppError(
      502,
      "upstream_error",
      "HiERP MCP 연결 또는 조회에 실패했습니다. 서버 연결과 인증을 확인해 주세요.",
    );
  } finally {
    // Cleanup failure must not replace an already obtained SAP result.
    await client.close().catch(() => {});
  }
}
