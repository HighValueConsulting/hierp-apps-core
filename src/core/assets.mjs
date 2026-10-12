const types = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json; charset=utf-8",
};
// Only explicit, trusted source entries become HTTP routes. No directory serving.
export function assetRoutes(publicRoot, files) {
  return Object.fromEntries(
    Object.entries(files).map(([route, file]) => {
      if (
        !route.startsWith("/") ||
        route.includes("?") ||
        route.includes("#") ||
        !/^[a-zA-Z0-9_./-]+$/.test(file) ||
        file.startsWith("/") ||
        file.split("/").includes("..")
      )
        throw new Error("Invalid asset route");
      const type = types[file.split(".").pop()];
      if (!type) throw new Error("Unsupported asset type");
      return [route, { url: new URL(file, publicRoot), type }];
    }),
  );
}
