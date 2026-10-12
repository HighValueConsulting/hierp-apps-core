# hierp-apps-core

SAP를 SSoT로 삼는 고객사 fork와 개인화 조회 앱의 공통 upstream.

- 공통 HTTP/auth/MCP/요청 상태는 `src/core`, `public/core`에, 고객 인프라와 업무 계약·개인화는 app module과 설정에 둔다.
- 이미 있는 사용자 변경을 보존한다. upstream 갱신은 별도 branch/worktree에서 base/app/upstream 의도를 비교하고 권한 수정과 개인화를 함께 유지한다.
- 클라이언트는 임의 tool/action/resource URL이나 credential을 지정하지 않는다. 입력과 반환 데이터 scope를 서버에서 검사한다. headless나 readOnlyHint가 권한을 대신하지 않는다.
- SAP 오류·누락·불완전 결과를 정상 0건으로 바꾸지 않는다. 원본 key와 표시 문자열을 분리하고 수량·단위·0을 보존한다.
- 새 SAP 계약은 연결된 backend의 `scripts/spike-odata-contract.ts`와 `abap-adt` read 도구로 확인한다. 이 starter 작업은 SAP write를 암시하지 않는다.
- `.env`, secret, 사용자 계정, SAP 원본 데이터/증거를 commit하지 않는다. 검증 예시는 합성 데이터임을 분명히 한다.
- 변경에 맞게 `npm test` 및 Docker test stage를 실행한다. 실제 SAP/UI/고객 환경 검증과 단위 테스트를 구분한다.
- 문서는 한국어로 작성하되 conventional terminology는 유지한다.
