# hierp-apps-core

SAP를 SSoT로 삼는 공통 upstream. 전달 경로는 core → 공통 Git 이력을 보존한 고객사 private 독립 저장소(Template 지정) → 실무자 앱(Use this template). 세부 절차는 [고객사 template 운영 안내](docs/customer-template.md).

- 공통 HTTP/auth/MCP/요청 상태는 `src/core`, `public/core`에, 고객 인프라와 업무 계약·개인화는 app module과 설정에 둔다.
- 이미 있는 사용자 변경·stash·실행 중 앱을 보존한다. 갱신은 별도 branch/worktree에서 검토한다. 고객사 표준 저장소는 GitHub fork 표시와 무관하게 공통 Git 조상으로 core를 merge하고, 실무자 앱은 기록된 고객사 template 기준으로 3-way 업데이트한다. unrelated history를 강제로 연결하지 않는다.
- 신규 고객사 private 표준은 core의 Git 이력을 보존해 초기화한다. 고객 표준과 실무자 앱의 생성 방식을 구분한다. `origin`/`upstream` 출처·공통 조상과 실제 visibility·Template 설정을 확인하며, 단순 검증 중 fork 분리나 공개 범위를 변경하지 않는다.
- 실무자 앱은 확인된 고객사 template에서 생성한다. 생성 당시 앱 root tree와 template 버전의 일치를 검증한 뒤 `.hierp-apps/template.json`을 기록·commit한다. Core나 고객사 template에는 이 개인 앱 provenance를 미리 넣지 않는다.
- 실무자 앱의 provenance는 Git에 추적하고 초기 생성 정보는 보존한다. 고객 인프라·개인화·새 권한 계약을 함께 해결하고 관련 검증 후 후보 commit 전에 적용 기준을 stage한다. 코드와 기준을 같은 commit으로 반영하며, 기준을 수동으로 앞당기거나 오류를 성공으로 포장하지 않는다.
- `hierp-apps` v0.2.1+의 helper는 plugin에 유지한다. 이 core에 중복 구현하지 않는다. 기록된 repository/ref의 실제 출처·권한은 별도로 확인한다.
- 클라이언트는 임의 tool/action/resource URL이나 credential을 지정하지 않는다. 입력과 반환 데이터 scope를 서버에서 검사한다. headless나 readOnlyHint가 권한을 대신하지 않는다.
- SAP 오류·누락·불완전 결과를 정상 0건으로 바꾸지 않는다. 원본 key와 표시 문자열을 분리하고 수량·단위·0을 보존한다.
- 새 SAP 계약은 연결된 backend의 `scripts/spike-odata-contract.ts`와 `abap-adt` read 도구로 확인한다. 이 starter 작업은 SAP write를 암시하지 않는다.
- `.env`, secret, 사용자 계정, SAP 원본 데이터/증거를 commit하지 않는다. 검증 예시는 합성 데이터임을 분명히 한다.
- 변경에 맞게 `npm test` 및 Docker test stage를 실행한다. 실제 SAP/UI/고객 환경 검증과 단위 테스트를 구분한다.
- 문서는 한국어로 작성하되 conventional terminology는 유지한다.
