# 화면이 서버를 기다리는데 대기 표시가 없으면 상기시킨다.
#
# `useMutation`을 쓰는 훅이 isPending을 내줘도 화면이 그걸 disabled에만 꽂아 두는 것이
# 가장 흔한 누락이다. 눌리지 않는다는 것과 처리 중이라는 것은 다른 사실이라,
# 사용자는 왜 안 눌리는지 모른 채 기다리다 다시 누른다.
#
# 막지 않고 알리기만 한다. 낙관적 갱신처럼 일부러 넣지 않는 자리가 있어서다
# (장바구니 수량 스테퍼). 막으면 우회만 늘어난다.
#
# jq가 없으면 조용히 넘어간다. Git for Windows에 들어 있지 않아, 설치하지 않은
# 팀원 환경에서 매 저장마다 에러를 뱉는다. 다른 훅들과 같은 방침이다.

command -v jq >/dev/null 2>&1 || exit 0

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null) || exit 0

# 대기 표시는 화면의 일이다. 훅·API 파일(.ts)은 isPending을 내주기만 하므로 보지 않는다.
# 경로 구분자는 OS에 따라 / 또는 \ 로 온다.
printf '%s' "$FILE" | grep -qE 'src[/\\].*\.tsx$' || exit 0

case "$FILE" in
  *.test.tsx) exit 0 ;;
esac

[ -f "$FILE" ] || exit 0

# 기다리는 상태를 들고 있는가.
grep -qE '\b(isPending|isSubmitting|isLoading|isFetching|isSearching)\b' "$FILE" || exit 0

# 이미 쓰고 있으면 조용히 넘어간다.
#
# **Skeleton이 있다고 넘기지는 않는다.** 한 화면이 첫 그림은 Skeleton으로 덮으면서
# 버튼이나 셰브론은 빠뜨리는 것이 흔하다 — search-address가 실제로 그랬다.
grep -q 'LoadingSwap' "$FILE" && exit 0

# 일부러 넣지 않은 자리는 파일에 사유를 적어 끈다. 아래 문구가 있으면 조용해진다.
grep -q '대기 표시 없음' "$FILE" && exit 0

MSG="이 파일이 isPending·isSubmitting·isLoading 같은 대기 상태를 들고 있는데 LoadingSwap이 보이지 않는다. docs/conventions/component-convention.md의 \"대기 상태\" 절대로 확인하라 — 화면을 처음 그릴 때는 Skeleton, 이미 그려진 UI가 응답을 기다릴 때는 shared/ui/loading-swap의 LoadingSwap이다. 버튼은 안의 라벨만, 아이콘 자리는 아이콘째 바꾸고 자리는 지킨다. disabled만 주고 끝내지 마라 — 눌리지 않는다는 것과 처리 중이라는 것은 다른 사실이다. Skeleton이 이미 있어도 버튼·아이콘 자리는 따로 본다. 낙관적 갱신처럼 일부러 넣지 않는 자리면 그 줄 옆에 \"대기 표시 없음 — 사유\" 주석을 남겨라. 그러면 이 알림이 꺼진다."

jq -n --arg msg "$MSG" \
  '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$msg}}'
