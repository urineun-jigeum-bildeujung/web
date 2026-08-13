---
description: 작업 시작 — 이슈 생성(템플릿) + 기능 브랜치 생성
argument-hint: <작업 설명>
---

새 작업을 시작한다. `$ARGUMENTS`를 작업 내용으로 삼아 `docs/conventions/git-convention.md`의 작업 흐름을 따른다.

1. 유형을 판단한다 (feat/fix/design/chore/docs).
2. **GitHub 이슈 생성** — `gh issue create`로 제목 `유형: 설명`, 알맞은 라벨과 마일스톤을 달고, 본문은 `.github/ISSUE_TEMPLATE`의 형식(무엇/왜/완료조건)으로 쓴다.
3. 생성된 **이슈 번호로 브랜치를 판다** — `유형/도메인/#이슈번호-설명` (예: `feat/subscription/#12-detail-view`). `dev`에서 최신을 받아 분기한다:
   - `git switch dev && git pull && git switch -c <branch>`
4. 이슈 링크와 브랜치명을 보고한다.

이슈 생성 전, 같은 작업의 중복 이슈가 없는지 `gh issue list`로 확인한다.

**전제 확인** — 원격 저장소와 `dev` 브랜치가 있어야 동작한다. 둘 중 하나라도 없으면 멈추고 사용자에게 알린다. 브랜치를 임의로 만들지 않는다.
