# push 후 열린 PR이 있으면 변경 이력 반영 여부와 미응답 리뷰를 알린다.
# PR 생성 시점(gh pr create)만 보면 리뷰 대응으로 쌓인 커밋이 기록에서 빠지고,
# 세션 중에 올라온 리뷰도 다음 세션까지 발견되지 않는다. push는 그 둘의 접점이다.
# gh 미설치·미인증·오프라인이면 조용히 넘어간다. 작업을 막지 않는다.

INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null) || exit 0

# git push가 아니면 통과. 커밋 메시지 안에 섞인 문자열은 잡지 않는다.
printf '%s' "$CMD" | grep -qE '(^|[&;|][[:space:]]*)git[[:space:]]+push' || exit 0

# 열린 PR이 없으면 통과. 기능 브랜치의 첫 push는 아직 PR이 없다.
NUM=$(gh pr view --json number,state --jq 'select(.state == "OPEN") | .number' 2>/dev/null) || exit 0
[ -z "$NUM" ] && exit 0

PENDING=$(gh api "repos/{owner}/{repo}/pulls/$NUM/comments" --jq '
  . as $all
  | [$all[] | select(.in_reply_to_id == null) | .id] as $roots
  | [$all[] | select(.in_reply_to_id != null) | .in_reply_to_id] as $replied
  | [$roots[] | select([.] | inside($replied) | not)] | length
' 2>/dev/null) || PENDING=0

MSG="열린 PR #${NUM}에 push했다. CHANGELOG.md의 오늘 날짜 절에 방금 올린 변경이 반영됐는지 확인하라 — 리뷰 대응이나 추가 구현으로 달라진 것이 있으면 항목을 고치거나 추가한다. 날짜 절이 없으면 만들고 최신이 위로 오게 한다. 오타·포맷처럼 기록할 가치가 없으면 그 사유를 한 줄로 밝힌다."

if [ "${PENDING:-0}" -gt 0 ] 2>/dev/null; then
  MSG="${MSG} 그리고 이 PR에 답하지 않은 리뷰 ${PENDING}건이 있다. .claude/commands/review-reply.md의 절차대로 처리하라 — 접힌 <details> 블록까지 펼쳐 읽고, 고치기 전에 현재 코드와 대조한다."
fi

jq -n --arg msg "$MSG" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$msg}}'
