# 새로 판 브랜치가 낡은 베이스에서 갈라졌는지 알린다.
#
# origin/dev가 앞서 있는데 그대로 작업하면 PR 단계에서 충돌로 되돌아온다.
# 커밋이 아직 없는 분기 직후가 맞추기 가장 싼 시점이라 여기서 알린다.
#
# 막지 않고 알리기만 한다. 다른 훅들과 같은 방침이다.
# gh·jq·네트워크가 없으면 조용히 넘어간다.

command -v jq >/dev/null 2>&1 || exit 0

INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null) || exit 0

# 브랜치 "생성"만 본다. git switch <기존브랜치> 같은 이동은 대상이 아니다.
printf '%s' "$CMD" \
  | grep -qE '(^|[&;|])[[:space:]]*git[[:space:]]+(switch[[:space:]]+-[cC]|checkout[[:space:]]+-[bB])' \
  || exit 0

BRANCH=$(git branch --show-current 2>/dev/null) || exit 0
[ -z "$BRANCH" ] && exit 0

# 통합 브랜치 자체는 대상이 아니다.
case "$BRANCH" in
  dev | main) exit 0 ;;
esac

# 원격을 못 받으면(오프라인 등) 비교할 기준이 없다. 실패하면 조용히 통과한다.
#
# 자격 증명 프롬프트나 무응답 원격에서 멈추면 작업이 막히므로 프롬프트를 끄고
# 전송에 상한을 건다. timeout이 없는 환경(macOS 기본 등)에서는 fetch를 건너뛰는
# 대신 git 자체 옵션으로 상한을 건다 — 건너뛰면 그 환경에서는 낡은 베이스를
# 영영 못 알린다.
export GIT_TERMINAL_PROMPT=0
if command -v timeout >/dev/null 2>&1; then
  timeout 10 git fetch origin --quiet 2>/dev/null || exit 0
else
  git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=5 \
    -c core.sshCommand='ssh -o ConnectTimeout=5 -o BatchMode=yes' \
    fetch origin --quiet 2>/dev/null || exit 0
fi

BEHIND=$(git rev-list --count "HEAD..origin/dev" 2>/dev/null) || exit 0
[ "${BEHIND:-0}" -eq 0 ] 2>/dev/null && exit 0

jq -n --arg n "$BEHIND" --arg b "$BRANCH" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: ("방금 만든 브랜치 " + $b + "의 베이스가 origin/dev보다 " + $n + "커밋 뒤처졌다. 이대로 작업하면 PR 단계에서 충돌로 되돌아온다. 아직 커밋이 없는 지금이 가장 싸게 맞출 수 있는 시점이므로 git rebase origin/dev로 베이스를 옮기고 시작하라. 사용자에게는 무엇을 왜 맞췄는지 한 줄로 알린다.")
  }
}'
