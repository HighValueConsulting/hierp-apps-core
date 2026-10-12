import { $ } from "./core/dom.js";
import { requestJson, postJson } from "./core/http.js";
import { createRequestState } from "./core/request-state.js";
const state = createRequestState();
requestJson("/api/status")
  .then((status) => {
    $("identity").textContent = status.username;
    $("connection").textContent = status.configured
      ? "MCP 주소 설정됨 · 실제 업무 조회는 연결 준비 중"
      : "MCP 연결 설정 대기";
    $("submit").disabled = !status.configured;
  })
  .catch((error) => {
    $("connection").textContent = error.message;
  });
$("reference").addEventListener("input", () => {
  state.invalidate();
  $("result").hidden = true;
  $("query-status").textContent = "";
});
$("lookup-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const pending = state.begin();
  $("result").hidden = true;
  $("query-status").textContent = "조회 중…";
  try {
    const response = await postJson(
      "/api/read",
      { operation: "lookup", reference: $("reference").value.trim() },
      pending.signal,
    );
    if (!pending.isCurrent()) return;
    // Replace this starter view with schema-validated business fields.
    $("result").textContent = JSON.stringify(response.data, null, 2);
    $("result").hidden = false;
    $("query-status").textContent = "조회 완료";
  } catch (error) {
    if (pending.isCurrent()) $("query-status").textContent = error.message;
  }
});
