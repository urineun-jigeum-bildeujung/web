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
# 세션을 시작하는 지금이 맞추기 좋은 시점이라 알린다.
#
# main은 릴리스 브랜치라 dev보다 뒤처진 것이 정상이므로 비교하지 않는다.
# 인자 없는 git pull은 자기 upstream(origin/main)을 받으므로 안내도 맞지 않는다.
case "$BRANCH" in
  main | "") ;;
  *)
    # 자격 증명 프롬프트나 무응답 원격에서 멈추면 세션 시작이 막힌다.
    #
    # timeout이 없으면 fetch를 건너뛴다. http.lowSpeedLimit·lowSpeedTime은
    # 전송이 시작된 뒤의 저속만 끊고 DNS 조회·TCP 연결·TLS 협상·첫 응답 대기는
    # 제한하지 못한다. git은 연결 단계 타임아웃(curl의 CONNECTTIMEOUT)을 설정으로
    # 노출하지 않으므로, 그 환경에서는 상한을 걸 방법이 없다.
    # 알림 하나를 잃는 것이 세션 시작이 매다는 것보다 싸다.
    # (coreutils를 설치해 timeout이 생기면 알림도 되살아난다.)
    export GIT_TERMINAL_PROMPT=0
    FETCH_FAILED=1
    if command -v timeout >/dev/null 2>&1; then
      timeout 10 git fetch origin --quiet 2>/dev/null && FETCH_FAILED=0
    else
      # 건너뛴다는 사실을 알린다. 조용히 넘기면 점검이 도는 줄 알고 낡은
      # 베이스로 작업하게 된다.
      printf 'timeout 명령이 없어 브랜치 뒤처짐 점검을 건너뜁니다. coreutils를 설치하면 켜집니다.\n'
    fi

    if [ "$FETCH_FAILED" -eq 0 ]; then
      BEHIND=$(git rev-list --count "HEAD..origin/dev" 2>/dev/null)
      if [ "${BEHIND:-0}" -gt 0 ] 2>/dev/null; then
        case "$BRANCH" in
          dev) printf 'origin/dev보다 %s커밋 뒤처졌습니다. git pull로 맞추십시오.\n' "$BEHIND" ;;
          *) printf 'origin/dev보다 %s커밋 뒤처졌습니다. 작업 전 git rebase origin/dev를 검토하십시오.\n' "$BEHIND" ;;
        esac
      fi
    fi
    ;;
esac

command -v jq >/dev/null 2>&1 || exit 0

# 열린 PR만 본다. gh pr view는 열린 PR이 없으면 가장 최근의 머지·닫힌 PR로 폴백하므로
# state를 걸러내지 않으면 이미 머지한 PR을 "열린 PR"이라고 알린다.
PR=$(gh pr view --json number,url,state --jq 'select(.state == "OPEN") | "\(.number) \(.url)"' 2>/dev/null) || exit 0
[ -z "$PR" ] && exit 0

NUM=${PR%% *}
URL=${PR#* }

# 아직 내 차례인 리뷰 스레드를 센다. 판정은 둘을 함께 본다.
#   - 아직 resolve되지 않았고
#   - 스레드의 마지막 코멘트를 쓴 사람이 내가 아니다
#
# "루트에 답글이 하나라도 있으면 처리됨"으로 세면 안 된다. 봇은 내 답에
# 재답변하면서 반박하거나 새 지적을 얹는데, 그 방식으로는 그것들이 전부
# 0건으로 보인다. 실제로 그렇게 지적 하나를 놓쳤다.
#
# resolve 여부는 REST 코멘트 목록에 없어 GraphQL로 받는다. 이걸 빼면 봇이
# 확인만 남기고 닫은 스레드까지 매번 세어 알림이 소음이 된다.
ME=$(gh api user --jq '.login' 2>/dev/null) || exit 0
REPO_JSON=$(gh repo view --json owner,name 2>/dev/null) || exit 0
OWNER=$(printf '%s' "$REPO_JSON" | jq -r '.owner.login' 2>/dev/null) || exit 0
NAME=$(printf '%s' "$REPO_JSON" | jq -r '.name' 2>/dev/null) || exit 0

# 스레드 100개까지 본다. 그보다 많은 PR은 이 알림보다 먼저 쪼개야 할 상태다.
RAW=$(gh api graphql -F owner="$OWNER" -F name="$NAME" -F num="$NUM" -f query='
query($owner: String!, $name: String!, $num: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $num) {
      reviewThreads(first: 100) {
        nodes { isResolved comments(last: 1) { nodes { author { login } } } }
      }
    }
  }
}' 2>/dev/null) || exit 0

# jq가 실패하면 리뷰가 없는 게 아니라 읽지 못한 것이다. 아래 else 가지가
# "확인할 스레드 없음"이라고 단언하므로, 0으로 떨어뜨리지 말고 조용히 끝낸다.
PENDING=$(printf '%s' "$RAW" | jq --arg me "$ME" '
  [.data.repository.pullRequest.reviewThreads.nodes[]
   | select(.isResolved | not)
   | select(.comments.nodes[0].author.login != $me)]
  | length
' 2>/dev/null) || exit 0

if [ "${PENDING:-0}" -gt 0 ] 2>/dev/null; then
  printf '열린 PR #%s에 확인할 리뷰 스레드 %s건이 있습니다(마지막 발화가 상대). /review-reply로 처리하십시오.\n%s\n' "$NUM" "$PENDING" "$URL"
else
  printf '열린 PR #%s — 확인할 리뷰 스레드 없음\n' "$NUM"
fi
