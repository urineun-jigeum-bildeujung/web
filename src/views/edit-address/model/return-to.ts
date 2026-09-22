// 저장을 마치고 돌아갈 곳을 주소창에서 읽는다.
//
// **`router.back()`으로는 못 돌아간다.** 주소는 검색 화면에서만 고르는데, 그 화면의 쪽 이동이
// `history: "push"`라 넘긴 만큼 항목이 쌓인다. 한 칸 되돌리면 검색 화면이고, 몇 칸인지 셀 수도
// 없다. 그래서 돌아갈 곳을 주소창이 들고 다닌다 (#369).
//
// **경로만 싣는다.** 이름·연락처 같은 값은 주소창에 올리지 않는다.

/**
 * 우리 화면을 가리키는 경로면 그대로, 아니면 `null`.
 *
 * **바깥으로 내보낼 수 있는 값이다.** 주소창에 실려 오므로 `?from=https://…`처럼 고쳐 두면
 * 저장을 마친 사용자를 남의 사이트로 보내게 된다. 우리 경로 하나만 통과시킨다.
 *
 * `//evil.com`은 프로토콜 상대 주소라 `/`로 시작해도 바깥으로 나가고, `/\evil.com`도
 * 브라우저가 같게 읽는다. 탭과 줄바꿈은 주소를 읽기 전에 지워지므로 `/\t/evil.com`이
 * `//evil.com`이 된다 — 먼저 지우고 본다.
 */
export function toInternalPath(from: string | null): string | null {
  if (from === null) {
    return null;
  }

  const path = from.replace(/[\t\n\r]/g, "");
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return null;
  }
  return path;
}
