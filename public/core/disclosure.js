export function setDisclosure(button, panel, open, labels) {
  panel.toggleAttribute("hidden", !open);
  button.setAttribute("aria-expanded", String(open));
  if (labels) button.textContent = open ? labels.open : labels.closed;
}
