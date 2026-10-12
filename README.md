# hierp-apps-core

SAP를 SSoT로 사용하는 개인화 조회 앱의 공통 upstream입니다. 공통 HTTP·인증·MCP 연결과 UI 유틸리티, 최소 실행 가능한 빈 업무 모듈을 제공합니다.

변경 전달은 **core repository → 고객사 fork(Template 지정) → 실무자 앱(Use this template)**을 따릅니다. 고객사는 fork에 인프라와 업무 표준을 적용·검증하고, 실무자는 그 template에서 앱을 생성해 개인화합니다. 고객사가 한 fork 안에서 여러 앱 모듈을 관리하는 기존 방식도 사용할 수 있습니다.

| 계층 | 관리할 내용 | 업데이트 기준 |
| --- | --- | --- |
| Core | 공통 HTTP·인증·MCP 연결·UI 유틸리티 | 공통 코드의 변경 이력 |
| 고객사 fork / template | SSO·proxy·network·배포·기본 업무 모듈 | Core와의 공통 Git 조상 |
| 실무자 앱 | 업무 흐름·검색 기본값·표시 열·레이아웃 | 마지막 적용 고객사 template 버전 |

전체 절차와 명령은 [고객사 template 운영 안내](docs/customer-template.md)를 참고하세요.

## 로컬 실행

Node 26이 필요합니다.

```sh
npm ci --ignore-scripts
cp .env.example .env
npm start
```

기본 주소는 `http://127.0.0.1:8093/`입니다. 기존 앱과 충돌하면 PORT와 PUBLIC_ORIGIN을 함께 바꿉니다. MCP URL이 비어 있어도 기본 화면은 열립니다. 예시 `lookup`은 업무 계약을 구현하기 전 **501**로 거부하며 SAP 성공 데이터를 만들어내지 않습니다.

## 구조

- `src/core/`: 설정, Basic/local 인증, HTTP 보안·route 처리, Streamable HTTP MCP client.
- `public/core/`: DOM·HTTP·요청 상태·접기·식별자 표시·공통 style.
- `src/app-module.mjs`: 고객/업무별 route, 입력·권한·출력 계약의 시작점.
- `src/server.mjs`: 앱 module과 core를 연결하는 entrypoint.
- `public/app.js`, `public/index.html`, `public/style.css`: 업무별 화면의 시작점.
- `test/`: core 독립 동작·권한 거부·이전 응답 무효화·starter 검사.

고객사 인프라 설정과 개인화 UI는 업무 모듈/설정으로 확장합니다. 공통 수정은 가능한 core에 반영합니다. 고객사 fork는 업데이트 branch에서 core 변경을 merge하고, 실무자 앱은 기록된 template 기준으로 변경을 적용합니다. GitHub Template 생성은 새 초기 commit으로 시작하므로 fork와 같은 Git 이력을 공유한다고 가정하지 않습니다.

## 고객사 fork에서 시작하기

GitHub에서 이 저장소를 고객사가 승인한 위치로 fork합니다. private fork 허용 여부와 대상은 조직 정책을 따릅니다. clone한 저장소에서 origin은 고객 fork, upstream은 갱신을 받을 저장소인지 확인합니다.

```sh
git remote -v
git remote add upstream https://github.com/HighValueConsulting/hierp-apps-core.git
```

이미 upstream이 있다면 덮어쓰지 말고 관계를 확인합니다. 고객사 fork에 인프라·업무 표준을 적용하고 검증한 뒤 GitHub Settings에서 Template repository로 지정합니다. 실무자 앱은 이 고객사 template의 `Use this template`으로 생성합니다. Core에서 직접 생성하여 고객사 구성을 건너뛰지 않습니다.

Fork의 공개 범위는 원본과 GitHub 정책의 영향을 받습니다. 고객사 코드의 공개 범위가 요구와 맞는지 확인한 뒤 생성하세요. 자세한 조건은 [운영 안내](docs/customer-template.md#고객사-표준-준비)에 있습니다.

`hierp-apps` v0.2.0 이상의 `build-app`과 `resolve-core-update` skill이 두 경로를 지원합니다. Plugin은 별도 배포되며 core에 helper를 복제하거나 npm dependency로 추가하지 않습니다. Core와 plugin의 버전 번호를 일치시킬 필요는 없습니다.

## 실무자 앱의 생성·적용 기준

앱 생성 직후 plugin의 `template-update.mjs bind`가 초기 앱 tree와 생성 당시 고객사 template tree의 일치를 확인하고 `.hierp-apps/template.json`을 기록합니다. 이 파일을 앱에 commit한 뒤 개인화합니다.

- `templateRepository`: 확인한 고객사 template 저장소
- `generatedCommit`: 앱의 초기 생성 commit
- `initialTemplateCommit`: 생성 당시 고객사 template commit
- `appliedTemplateCommit`: 마지막으로 적용한 고객사 template commit

**이 파일은 실무자 앱 전용입니다. Core와 고객사 template에 미리 넣지 않습니다.** 실무자 앱에서는 Git에 추적하며, `.env`·secret·SAP 원본 증거와 구분합니다. 현재 `.gitignore`는 provenance를 제외하지 않습니다.

업데이트는 이전 template·현재 앱·새 template의 세 버전을 비교합니다. 충돌 해결과 관련 검증을 마친 후보에서만 `finalize`로 적용 기준을 stage하고, 코드와 provenance를 같은 commit에 담습니다. 초기 생성 정보는 유지하며, 다음 업데이트는 마지막 적용 버전에서 시작합니다. [명령과 실패 처리](docs/customer-template.md#실무자-앱-업데이트)를 참고하세요.

## 업무 계약 구현

1. 실제 등록된 HiERP tools/resources에서 필요한 조회를 선택하고 입력·출력 schema, scope, 단위, 기간, 완전성을 확인합니다.
2. `src/app-module.mjs`의 parse/authorize/run을 구현합니다. POST는 입력 검증이 필수이며 **authorize가 명시적으로 true를 반환한 경우만 실행**됩니다. GET도 권한 검사가 필요합니다.
3. MCP는 `src/core/mcp-client.mjs`의 `withMcp`로 호출합니다. URL/tool/action/resource/credential을 브라우저가 임의로 지정하지 못하게 합니다.
4. 반환된 각 행의 업무 scope를 검증합니다. MCP/업무 오류나 누락된 데이터는 정상 0건으로 바꾸지 않습니다.
5. 선행 선택이 없으면 결과를 숨기고, loading/error/정상 0건은 구분합니다. 상위 선택 변경에는 `request-state.js`의 invalidate를 사용합니다. 원본 SAP key와 표시 문자열은 분리합니다.

공통 Basic 인증은 사용자 형식과 비밀번호를 검사합니다. 회사·플랜트 등의 업무 권한은 고객 module이 소유합니다. 고객사 SSO 연동도 해당 인프라의 신뢰 경계를 확인해 구현해야 합니다.

## MCP와 배포 설정

외부 앱은 기존 dashboard용 process와 분리된 `TOOL_MODE=headless` HiERP MCP에 연결합니다. headless는 read-only 권한을 뜻하지 않으며 서버의 고정 operation과 사용자 범위 검사가 필요합니다.

`.env.example`에는 빈 연결 설정만 있습니다. `.env`, 사용자 계정, API key, SAP 원본 응답·증거는 Git에 넣지 않습니다. 운영에서는 HTTPS PUBLIC_ORIGIN, 적절한 인증, 회사/플랜트 scope 검사와 secret 제공 방식이 필요합니다. 기본 local auth는 비운영 loopback만 허용합니다.

Docker runtime의 기본 listener는 8092이고, local entrypoint는 8093입니다. Dockerfile만으로 고객사 DNS/TLS/SSO/네트워크를 구성하지 않으므로 고객 환경에 맞게 설정합니다.

## 검증

```sh
npm test
docker build --target test -t hierp-apps-core-test:local .
```

초기 등록 시 macOS와 Linux Node 26에서 4개 검사가 통과했습니다. 실제 SAP data/provider·고객사 인증·배포를 검증한 상태는 아니며 해당 기능을 연결할 때 대상별 acceptance가 필요합니다.
