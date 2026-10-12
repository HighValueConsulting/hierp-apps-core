// Presentation only. API payloads always retain canonical SAP keys.
export function displayIdentifier(value) {
  const text = String(value ?? '');
  return /^\d+$/.test(text) ? text.replace(/^0+/, '') || '0' : text;
}
export function displayDocumentKey(row) {
  return `${displayIdentifier(row.document)} / ${row.year} / ${displayIdentifier(row.item)}`;
}
