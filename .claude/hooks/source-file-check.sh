# src에 소스 파일을 만들면 딸려야 할 것들을 상기시킨다 — 폴더 README와 테스트.
#
# jq가 없으면 조용히 넘어간다. Git for Windows에는 jq가 들어 있지 않아,
# 설치하지 않은 팀원 환경에서는 이 훅이 매 Write마다 에러를 뱉는다.
# 다른 훅들과 같은 방침이다 — 막지 않고 상기만 시킨다.

command -v jq >/dev/null 2>&1 || exit 0

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null) || exit 0

# 경로 구분자는 OS에 따라 / 또는 \ 로 온다.
printf '%s' "$FILE" | grep -qE 'src[/\\].*\.(ts|tsx)$' || exit 0

README="src 안에 파일을 만들었다. 이 파일이 속한 슬라이스 또는 shared 세그먼트의 README.md가 폴더 안 파일들을 설명하는지 확인하라 — README가 없으면 만들고, 새 파일이면 파일 표에 한 줄 추가한다. 레이어 README의 슬라이스 목록도 새 슬라이스면 갱신한다. 세그먼트 내부(ui/·model/·api/)에는 README를 만들지 않는다. views 슬라이스는 src/views/README.md의 페이지 README 템플릿을 따른다."

# 테스트 파일 자신에게는 테스트를 또 만들라고 하지 않는다.
case "$FILE" in
  *.test.ts | *.test.tsx)
    jq -n --arg msg "$README 이미 반영했으면 언급하지 않아도 된다." \
      '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$msg}}'
    exit 0
    ;;
esac

TEST="그리고 이 파일이 순수 함수나 훅 로직이면 docs/conventions/code-convention.md의 \"테스트\" 절대로 바로 옆에 <파일명>.test.ts(x)를 함께 둔다. 컴포넌트는 렌더링 스모크 수준이면 되고 기준 예시는 src/views/home/ui/home-view.test.tsx다. 타입 선언만 있는 파일처럼 지금 검증할 것이 없으면 만들지 말고 그 사유를 보고에 한 줄로 밝힌다 — 껍데기 테스트는 통과율만 올린다."

jq -n --arg msg "$README $TEST 이미 반영했으면 언급하지 않아도 된다." \
  '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$msg}}'
