export const $ = (id) => document.getElementById(id);
export function node(tag, value, className) {
  const el = document.createElement(tag);
  if (value !== undefined) el.textContent = String(value);
  if (className) el.className = className;
  return el;
}
export const field = (value) =>
  value === undefined || value === null || value === ""
    ? "—"
    : typeof value === "boolean"
      ? value
        ? "사용"
        : "미사용"
      : String(value);
