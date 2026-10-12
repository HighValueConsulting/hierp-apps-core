import { pathToFileURL } from "node:url";
import { createApp, startApp } from "./core/server.mjs";
import { loadConfig } from "./core/config.mjs";
import { appModule } from "./app-module.mjs";
export function appConfig(env = process.env) {
  return loadConfig({
    ...env,
    PORT: env.PORT || "8093",
    PUBLIC_ORIGIN: env.PUBLIC_ORIGIN || "http://127.0.0.1:8093",
    INTRANET_AUTH: env.INTRANET_AUTH || "local",
  });
}
export function buildApp(config = appConfig()) {
  return createApp(config, appModule);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  startApp(appConfig(), appModule);
