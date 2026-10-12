import { z } from "zod";
import { AppError } from "./core/errors.mjs";
import { assetRoutes } from "./core/assets.mjs";
const inputSchema = z
  .object({
    operation: z.literal("lookup"),
    reference: z.string().trim().min(1).max(40),
  })
  .strict();
const files = {
  "/": "index.html",
  "/app.js": "app.js",
  "/style.css": "style.css",
};
for (const name of [
  "style.css",
  "dom.js",
  "request-state.js",
  "disclosure.js",
  "http.js",
  "identifiers.js",
])
  files["/core/" + name] = "core/" + name;
export const appModule = {
  id: "starter",
  assets: assetRoutes(new URL("../public/", import.meta.url), files),
  frameOrigins: [],
  routes: {
    "/api/read": {
      method: "POST",
      parse(raw) {
        const result = inputSchema.safeParse(raw);
        if (!result.success)
          throw new AppError(
            400,
            "invalid_request",
            "조회 조건을 확인해 주세요.",
          );
        return result.data;
      },
      // Replace with the actual business scope check. Return true only after admission.
      authorize() {
        throw new AppError(
          501,
          "not_implemented",
          "업무 조회 기능이 아직 연결되지 않았습니다.",
        );
      },
      // Implement a fixed tools/call or resources/read adapter with output validation.
      // Use withMcp from core/mcp-client.mjs; do not accept a caller-supplied tool, URL or credentials.
      async run() {
        throw new AppError(
          501,
          "not_implemented",
          "업무 조회 기능이 아직 연결되지 않았습니다.",
        );
      },
    },
  },
};
