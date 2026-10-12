# 고객사 template 운영 안내

## 역할과 준비 도구

```text
hierp-apps-core
  └─ GitHub fork → 고객사 표준 저장소 (Template repository)
                      └─ Use this template → 실무자 개인화 앱
```

고객사 표준은 core와 Git 이력을 공유합니다. 실무자 앱은 고객사 template의 파일에서 새 초기 commit으로 시작하므로 두 업데이트 경로를 구분합니다. 고객사가 하나의 fork 안에서 여러 앱 모듈을 운영한다면 그 앱에는 fork 경로를 사용할 수 있습니다.

`hierp-apps` v0.2.0 이상과 Node 26, helper가 요구하는 Git 기능을 준비합니다. 이 문서의 `PLUGIN_ROOT`는 설치된 plugin 패키지의 실제 경로입니다. 설치 host의 plugin 정보에서 확인하고, 아래 설명용 값을 실제 경로로 바꿉니다. Core repository에는 helper가 들어 있지 않습니다.

```sh
PLUGIN_ROOT="/path/to/installed/hierp-apps"
node "$PLUGIN_ROOT/scripts/core-update.mjs" --help
node "$PLUGIN_ROOT/scripts/template-update.mjs" --help
```

Helper는 fetch·원격 생성·commit·push·배포를 자동 수행하지 않습니다. Skill 또는 작업자가 확인된 저장소와 사용자 요청 범위에서 수행합니다.

## 고객사 표준 준비

1. Core와 고객사 저장소의 접근 권한·visibility·fork 정책을 확인합니다. Public repository의 GitHub fork는 public이며 fork만 private으로 바꿀 수 없습니다. 고객사 코드가 비공개여야 한다면 public fork에 코드를 올리기 전에 승인된 private upstream 등 적합한 저장소 구성을 결정합니다. 이 안내가 조직 정책 변경을 허가하는 것은 아닙니다.
2. 고객사가 승인한 위치로 core를 fork하고 clone합니다. `origin`은 고객 fork, `upstream`은 core인지 확인합니다. 기존 remote가 있으면 덮어쓰지 않습니다.
3. 고객사 SSO·proxy·network·배포·secret 참조와 기본 업무 모듈을 구현합니다. 실제 credential과 SAP 원본 데이터는 저장소에 넣지 않습니다.
4. 관련 테스트 및 고객사 인증·실제 SAP·브라우저 흐름을 검증합니다. 단위 테스트와 실제 환경 검증 결과를 구분합니다.
5. 고객사 저장소를 GitHub Settings의 **Template repository**로 지정합니다. 새 실무자 앱에 제공할 검증된 default branch를 유지합니다. `.hierp-apps/template.json`은 포함하지 않습니다.

Fork visibility와 권한은 [GitHub fork 규칙](https://docs.github.com/en/pull-requests/reference/forks)을 따릅니다. Template 생성 시 전달되는 파일·이력은 [GitHub template 생성 설명](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)을 참고하세요.

## Core에서 고객사 표준 업데이트

확인된 core remote에서 원하는 ref를 fetch합니다. Git 변경·진행 중 작업을 확인한 후 새 branch/worktree를 지정합니다. 다음 경로와 ref는 설명용이며 실제 값으로 바꿉니다.

```sh
node "$PLUGIN_ROOT/scripts/core-update.mjs" inspect \
  --repo /path/to/customer-fork --upstream refs/remotes/upstream/main

node "$PLUGIN_ROOT/scripts/core-update.mjs" prepare \
  --repo /path/to/customer-fork --upstream refs/remotes/upstream/main \
  --branch review/core-update --worktree /path/to/new-core-review
```

Base·고객 코드·새 core의 의도를 비교합니다. 고객 경로나 개인화 코드를 일괄 `ours`로 선택하지 않고, 새 보안·데이터 계약도 함께 적용합니다. 검사한 후보를 고객사 절차에 따라 commit·PR·병합하고 실제 배포를 검증합니다. 고객 표준이 검증된 후 그 버전을 실무자 앱의 업데이트 대상으로 제공합니다.

## 실무자 앱 생성과 기준 기록

1. 고객사 template의 실제 `is_template`, owner/name, default branch 및 생성 직전 commit을 확인합니다. Core를 직접 template으로 사용하여 고객사 인프라 구성을 건너뛰지 않습니다.
2. 해당 고객사 저장소의 **Use this template → Create a new repository** 또는 아래 CLI로 생성합니다. 이름·소유자·visibility는 사용자 요구에 맞게 지정합니다.

   ```sh
   gh repo create CUSTOMER/PERSONAL-APP \
     --template CUSTOMER/CUSTOMER-TEMPLATE --private --clone
   ```

3. 기본 생성은 template의 default branch 기준입니다. 위 명령이 특정 tag/과거 release에서 생성한다고 가정하지 않습니다. clone한 앱의 초기 root commit을 확인하고, customer template의 생성 원본 commit을 확인된 remote에서 로컬 Git에 확보합니다. 실제 원격 출처와 `template_repository` 정보가 제공되면 서로 대조합니다.
4. 개인화 전에 아래 명령으로 기준을 등록합니다.

   ```sh
   node "$PLUGIN_ROOT/scripts/template-update.mjs" bind \
     --repo /path/to/personal-app \
     --template-repository CUSTOMER/CUSTOMER-TEMPLATE \
     --template-ref CUSTOMER_TEMPLATE_COMMIT \
     --generated-ref APP_INITIAL_COMMIT
   ```

   `CUSTOMER_TEMPLATE_COMMIT`과 `APP_INITIAL_COMMIT`은 앞에서 확인한 실제 로컬 commit 식별자로 바꿉니다. Helper는 초기 앱 tree와 고객 template tree의 일치를 검사합니다. 생성 중 template이 바뀌거나 자동 후처리로 원본이 달라졌다면 원인을 조사하고 일치하는 생성 기준을 확인합니다. 현재 template HEAD를 임의로 기준으로 기록하지 않습니다.
5. 성공한 `.hierp-apps/template.json`을 앱에 commit한 뒤 업무 흐름과 표시를 개인화합니다. 기존 개인화 앱도 실제 생성 root와 template의 일치를 증명하면 기준을 등록할 수 있습니다. 기준을 증명할 수 없으면 새 metadata로 사실을 꾸미지 않습니다.

### Provenance의 의미

| 필드 | 의미 |
| --- | --- |
| `schemaVersion` | Provenance 형식 버전 |
| `templateRepository` | Credential 없는 고객사 template URL |
| `generatedCommit` | 앱의 실제 생성 root commit |
| `initialTemplateCommit` | 생성 당시 고객사 template commit |
| `appliedTemplateCommit` | 마지막으로 적용한 고객사 template commit |

초기 생성 정보는 유지하고 마지막 적용 기준만 검증된 업데이트에 따라 갱신합니다. Commit은 비교 원본을 식별하기 위한 값이며 파일 byte/SHA 승인 pin이 아닙니다. Helper의 Git 비교는 원격 소유권·접근 권한을 증명하지 않으므로 실제 customer remote/ref는 작업자가 확인합니다.

Provenance는 **실무자 앱에서만** 생성·추적합니다. Core나 고객사 template에 미리 넣거나 예시 실데이터로 배포하지 않습니다. 앱에서는 이 파일을 `.gitignore`에 추가하지 않습니다. 반면 `.env`, secrets, SAP 원본 응답·증거는 계속 제외합니다.

## 실무자 앱 업데이트

앱의 provenance를 읽어 고객사 template을 확인하고, 마지막 적용 버전과 다음 버전을 해당 고객 remote에서 로컬에 확보합니다. 비교는 다음 세 가지입니다.

- Base: 마지막 적용 고객 template
- App: 현재 개인화 앱
- Incoming: 새 고객 template

```sh
node "$PLUGIN_ROOT/scripts/template-update.mjs" inspect \
  --repo /path/to/personal-app --template-ref CUSTOMER_TEMPLATE_NEXT_COMMIT

node "$PLUGIN_ROOT/scripts/template-update.mjs" prepare \
  --repo /path/to/personal-app --template-ref CUSTOMER_TEMPLATE_NEXT_COMMIT \
  --branch review/customer-template-update --worktree /path/to/new-app-review
```

`prepare`는 untracked를 포함해 clean한 원본에서 새 branch/worktree를 만들고, 이전→새 template patch를 3-way로 적용합니다. 앱과 template의 이력을 강제로 연결하지 않습니다. 후보를 검토하는 동안 원래 앱과 적용 기준은 유지됩니다.

1. 충돌과 전체 template 변경 목록을 검토합니다. 고객사 인프라·사용자 개인화·새 권한 및 출력 계약을 함께 보존합니다. Conflict marker가 없다는 것만으로 성공이라고 판단하지 않습니다.
2. 관련 테스트, 사용자 업무 흐름·표시 설정과 필요한 실제 환경 acceptance를 수행합니다. SAP 계약이나 수량·단위·scope가 바뀌었다면 실제 MCP 결과와 독립 SAP read를 대조합니다.
3. 검토한 변경을 stage한 다음 **후보를 commit하기 전에** 기준을 갱신합니다.

   ```sh
   node "$PLUGIN_ROOT/scripts/template-update.mjs" finalize \
     --repo /path/to/new-app-review
   ```

4. 코드와 provenance를 같은 commit으로 반영하고, 고객사 절차에 따라 원래 앱에 적용합니다. 다음 업데이트는 이 마지막 적용 버전에서 계산합니다.

`finalize`는 Git 준비 상태만 검사하며 테스트·SAP·브라우저 검증을 대신하지 않습니다. Commit·push·PR·배포는 해당 요청 범위에 따릅니다.

## 실패와 작업 보존

- Dirty/untracked 변경이나 진행 중인 Git 작업을 조건에 맞추려고 자동 stash·reset·commit하지 않습니다. 원본 작업과 후보를 보존합니다.
- 생성 원본 불일치, 누락된 base object, 고객 template 이력 재작성은 원인을 확인하기 전 기준을 추측하지 않습니다.
- Helper가 거부하는 active Git filter/merge driver·submodule은 별도 검토가 필요합니다. 사용하지 않는 global LFS 설정 때문에 전역 Git 설정을 끄지 않습니다.
- Patch 적용 실패나 미해결 충돌은 성공으로 바꾸지 않으며, metadata만 수동으로 올려 적용된 것처럼 만들지 않습니다.
- 실제 고객사 SAP·SSO·네트워크·배포를 확인하지 못했으면 각각 미검증으로 남깁니다.

Core source 검증과 실무자 앱 검증은 다릅니다. `.hierp-apps/template.json`의 부재는 core/고객 template에 필요한 조건이고, 기록의 존재·정확성은 생성된 실무자 앱에 필요한 조건입니다. 두 조건을 구분 없이 모든 저장소의 기본 테스트로 강제하지 않습니다.
