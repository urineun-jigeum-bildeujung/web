# 세션을 시작할 때 현재 브랜치와, 답 안 한 리뷰가 남아 있는지 알린다.
# 리뷰가 올라오는 시점을 기다릴 방법이 없으므로 작업을 시작할 때 확인한다.
# gh 미설치·미인증·오프라인이면 조용히 넘어간다. 세션 시작을 막지 않는다.

BRANCH=$(git branch --show-current 2>/dev/null)
printf '현재 브랜치: %s\n' "$BRANCH"

PR=$(gh pr view --json number,url --jq '"\(.number) \(.url)"' 2>/dev/null) || exit 0
[ -z "$PR" ] && exit 0

NUM=${PR%% *}
URL=${PR#* }

PENDING=$(gh api "repos/{owner}/{repo}/pulls/$NUM/comments" --jq '
  . as $all
  | [$all[] | select(.in_reply_to_id == null) | .id] as $roots
  | [$all[] | select(.in_reply_to_id != null) | .in_reply_to_id] as $replied
  | [$roots[] | select([.] | inside($replied) | not)] | length
' 2>/dev/null) || exit 0

if [ "${PENDING:-0}" -gt 0 ] 2>/dev/null; then
  printf '열린 PR #%s에 답 안 한 리뷰 %s건이 있습니다. /review-reply로 처리하십시오.\n%s\n' "$NUM" "$PENDING" "$URL"
else
  printf '열린 PR #%s — 미응답 리뷰 없음\n' "$NUM"
fi
