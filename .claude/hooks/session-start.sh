# 세션을 시작할 때 현재 브랜치와, 답 안 한 리뷰가 남아 있는지 알린다.
# 리뷰가 올라오는 시점을 기다릴 방법이 없으므로 작업을 시작할 때 확인한다.
#
# 미응답 집계는 record-check.sh와 같은 방식이어야 한다. 한쪽만 고치면 세션 시작과
# push 시점이 서로 다른 수를 알린다.
#
# gh·jq 미설치나 오프라인이면 조용히 넘어간다. 세션 시작을 막지 않는다.

BRANCH=$(git branch --show-current 2>/dev/null)
printf '현재 브랜치: %s\n' "$BRANCH"

# origin/dev보다 뒤처진 채로 작업을 이어가면 PR 단계에서 충돌로 되돌아온다.
# 세션을 시작하는 지금이 맞추기 좋은 시점이라 알린다. 오프라인이면 건너뛴다.
if git fetch origin --quiet 2>/dev/null; then
  BEHIND=$(git rev-list --count "HEAD..origin/dev" 2>/dev/null)
  if [ "${BEHIND:-0}" -gt 0 ] 2>/dev/null; then
    case "$BRANCH" in
      dev | main) printf 'origin/dev보다 %s커밋 뒤처졌습니다. git pull로 맞추십시오.\n' "$BEHIND" ;;
      *) printf 'origin/dev보다 %s커밋 뒤처졌습니다. 작업 전 git rebase origin/dev를 검토하십시오.\n' "$BEHIND" ;;
    esac
  fi
fi

command -v jq >/dev/null 2>&1 || exit 0

# 열린 PR만 본다. gh pr view는 열린 PR이 없으면 가장 최근의 머지·닫힌 PR로 폴백하므로
# state를 걸러내지 않으면 이미 머지한 PR을 "열린 PR"이라고 알린다.
PR=$(gh pr view --json number,url,state --jq 'select(.state == "OPEN") | "\(.number) \(.url)"' 2>/dev/null) || exit 0
[ -z "$PR" ] && exit 0

NUM=${PR%% *}
URL=${PR#* }

# 코멘트는 한 페이지에 30건씩만 온다. 리뷰가 몇 번 오가면 금방 넘으므로 전체 페이지를
# 받는다. --slurp는 --jq와 함께 쓸 수 없어 jq를 따로 부르고, 파이프로 잇지 않아야
# gh의 실패가 jq의 성공에 가려지지 않는다.
RAW=$(gh api --paginate --slurp "repos/{owner}/{repo}/pulls/$NUM/comments" 2>/dev/null) || exit 0

# jq가 실패하면 리뷰가 없는 게 아니라 읽지 못한 것이다. 아래 else 가지가
# "미응답 리뷰 없음"이라고 단언하므로, 0으로 떨어뜨리지 말고 조용히 끝낸다.
PENDING=$(printf '%s' "$RAW" | jq '
  (add // [])
  | . as $all
  | [$all[] | select(.in_reply_to_id == null) | .id] as $roots
  | [$all[] | select(.in_reply_to_id != null) | .in_reply_to_id] as $replied
  | [$roots[] | select([.] | inside($replied) | not)] | length
' 2>/dev/null) || exit 0

if [ "${PENDING:-0}" -gt 0 ] 2>/dev/null; then
  printf '열린 PR #%s에 답 안 한 리뷰 %s건이 있습니다. /review-reply로 처리하십시오.\n%s\n' "$NUM" "$PENDING" "$URL"
else
  printf '열린 PR #%s — 미응답 리뷰 없음\n' "$NUM"
fi
