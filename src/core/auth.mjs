import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const derive = promisify(scrypt);
let pending = 0;

export async function authenticate(header, config) {
  if (config.auth === "local") return config.localUser;
  if (
    typeof header !== "string" ||
    header.length > 2048 ||
    !/^Basic [A-Za-z0-9+/]+={0,2}$/.test(header)
  )
    return null;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const separator = decoded.indexOf(":");
  if (separator < 1 || pending >= 4) return null;
  const username = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);
  if (password.length > 256) return null;
  const user = config.users.find((item) => item.username === username);
  pending++;
  try {
    const hash = await derive(
      password,
      user?.salt || "00000000000000000000000000000000",
      64,
    );
    const expected = Buffer.from(user?.hash || "0".repeat(128), "hex");
    return timingSafeEqual(hash, expected) && user ? user : null;
  } finally {
    pending--;
  }
}
