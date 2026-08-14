# 원격에 올린 변경이 기록에 반영됐는지 점검시킨다.
#
# gh pr create만 보면 PR 생성 이후 리뷰 대응으로 쌓은 커밋이 기록에서 빠지고,
# 세션 중에 올라온 리뷰도 다음 세션까지 발견되지 않는다. push까지 함께 본다.
#
# 명령 문자열은 grep으로 줄 단위 판정한다. jq test()의 ^는 문자열 전체의
# 시작만 잡아서, cd 다음 줄에서 실행하는 여러 줄 명령을 통째로 놓친다.
#
# 명령 전체를 문자열로 보므로 heredoc 본문에 든 예시도 걸린다. 이 훅은
# 무언가를 막지 않고 확인만 시키므로 오탐은 감수한다. 놓치는 쪽이 더 비싸다.
#
# gh 미설치·미인증·오프라인이면 조용히 넘어간다. 작업을 막지 않는다.

INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null) || exit 0

# 어느 쪽인지 가린다. PR 생성 시점에는 README까지 본다.
#
# PRE는 줄 시작이나 명령 구분자 뒤의 들여쓰기와 환경변수 접두(GIT_TRACE=1 git push)를
# 건너뛴다. 뒤이은 옵션 자리는 서브커맨드 앞에 오는 전역 옵션만 허용한다 — 여기를
# 아무 옵션이나 받게 넓히면 git commit -m "git push" 같은 문자열이 걸린다.
PRE='(^|[&;|])[[:space:]]*([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*'

if printf '%s' "$CMD" | grep -qE "${PRE}gh[[:space:]]+((-R|--repo)[[:space:]]+[^[:space:]]+[[:space:]]+)*pr[[:space:]]+create"; then
  KIND="pr"
elif printf '%s' "$CMD" | grep -qE "${PRE}git[[:space:]]+((-C|-c)[[:space:]]+[^[:space:]]+[[:space:]]+)*push"; then
  KIND="push"
else
  exit 0
fi

# 열린 PR이 없으면 통과. 기능 브랜치의 첫 push는 아직 PR이 없다.
NUM=$(gh pr view --json number,state --jq 'select(.state == "OPEN") | .number' 2>/dev/null) || exit 0
[ -z "$NUM" ] && exit 0

# 코멘트는 한 페이지에 30건씩만 온다. 리뷰가 몇 번 오가면 금방 넘으므로
# 전체 페이지를 받는다. --slurp는 --jq와 함께 쓸 수 없어 jq를 따로 부르고,
# 파이프로 잇지 않아야 gh의 실패가 jq의 성공에 가려지지 않는다.
RAW=$(gh api --paginate --slurp "repos/{owner}/{repo}/pulls/$NUM/comments" 2>/dev/null) || exit 0

# jq가 실패하면 리뷰 안내만 빠지고 기록 점검 안내는 그대로 나간다. 이 훅은
# session-start.sh와 달리 "리뷰 없음"을 말하지 않으므로 0으로 떨어뜨려도
# 없는 것을 없다고 단언하는 오보가 되지 않는다.
PENDING=$(printf '%s' "$RAW" | jq '
  (add // [])
  | . as $all
  | [$all[] | select(.in_reply_to_id == null) | .id] as $roots
  | [$all[] | select(.in_reply_to_id != null) | .in_reply_to_id] as $replied
  | [$roots[] | select([.] | inside($replied) | not)] | length
' 2>/dev/null) || PENDING=0

CHANGELOG="CHANGELOG.md의 오늘 날짜 절에 이번 변경이 기록됐는지 확인하라 — 안 됐으면 .claude/commands/changelog.md의 절차대로 브랜치 커밋을 읽어 직접 작성한다. 날짜 절이 없으면 만들고 최신이 위로 오게 한다. 사람에게 문장을 요청하지 않는다. 오타·포맷처럼 기록할 가치가 없으면 그 사유를 한 줄로 밝힌다."

if [ "$KIND" = pr ]; then
  MSG="PR #${NUM}을 생성했다. 세 가지를 하라. (1) ${CHANGELOG} (2) README.md가 여전히 사실인가 — 스크립트 표, 기술 스택 표, 폴더 구조, 기능 소개, 실행 방법이 실제와 어긋나지 않는지 본다. README는 소개 문서이므로 작업 목록을 적지 않는다. (3) gh pr checks ${NUM} --watch --interval 20 을 백그라운드로 돌려 CI와 CodeRabbit 리뷰 완료를 감시하라. 필수 체크가 전부 통과하고 CodeRabbit이 Review completed일 때만 .claude/commands/review-reply.md의 절차를 실행한다 — 그때는 사람이 다시 시킬 때까지 기다리지 않는다. 체크가 실패했으면 리뷰 처리보다 원인을 먼저 고치고, 고쳐서 push했으면 감시를 다시 건다. Review rate limited는 리뷰가 돌지 않은 것이니 통과로 읽지 말고 사람에게 알린 뒤 판단을 받는다."
else
  MSG="열린 PR #${NUM}에 push했다. ${CHANGELOG} 리뷰 대응이나 추가 구현으로 달라진 것이 있으면 기존 항목을 고치거나 새로 추가한다."
fi

if [ "${PENDING:-0}" -gt 0 ] 2>/dev/null; then
  MSG="${MSG} 그리고 이 PR에 답하지 않은 리뷰 ${PENDING}건이 있다. .claude/commands/review-reply.md의 절차대로 처리하라 — 접힌 <details> 블록까지 펼쳐 읽고, 고치기 전에 현재 코드와 대조한다."
fi

jq -n --arg msg "$MSG" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$msg}}'
