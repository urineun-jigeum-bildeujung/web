// 최근 검색어를 기기에 남긴다. 화면을 떠났다 돌아와도 방금 검색한 말이 남아야 한다.
//
// 서버에 둘지 기기에 둘지는 API 계약과 함께 정해진다. 그때 이 파일만 갈아끼우면 되도록
// 읽고 쓰는 자리를 여기 모아 둔다.
//
// 효과 안에서 setState로 되읽으면 React Compiler가 연쇄 렌더로 잡는다.
// 저장소는 React 밖의 것이므로 useSyncExternalStore로 잇는다 —
// 서버 스냅숏을 따로 주어 프리렌더된 HTML과 첫 그림이 어긋나지 않게 한다.

const KEY = "recent-keywords";

/** 시안(검색 화면_검색 전)에 그려진 다섯 개. 저장된 것이 없을 때 보여준다 */
export const INITIAL_RECENT = [
  "저자극 덴탈껌",
  "중소형견 사료",
  "사료",
  "고양이 화장실 모래",
  "양치 껌",
];

/** IA가 "최대 5개"로 못 박고 있다 */
export const MAX_RECENT = 5;

/** 읽을 때마다 새 배열을 만들면 useSyncExternalStore가 무한히 다시 그린다 */
let cache: string[] | null = null;
const listeners = new Set<() => void>();

function load(): string[] {
  try {
    const saved = window.localStorage.getItem(KEY);
    if (!saved) return INITIAL_RECENT;

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return INITIAL_RECENT;

    return parsed.filter((item): item is string => typeof item === "string").slice(0, MAX_RECENT);
  } catch {
    // 저장을 막아 둔 브라우저이거나 값이 깨졌다. 검색을 막을 이유는 없다
    return INITIAL_RECENT;
  }
}

export function subscribeRecent(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRecent(): string[] {
  cache ??= load();
  return cache;
}

/** 프리렌더에는 저장소가 없다. 시안 값으로 그려 두고 붙은 뒤 저장된 것으로 바꾼다 */
export function getRecentOnServer(): string[] {
  return INITIAL_RECENT;
}

export function setRecent(next: string[]) {
  cache = next.slice(0, MAX_RECENT);

  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // 저장을 막아 뒀으면 화면 안에서만 유지된다
  }

  listeners.forEach((listener) => listener());
}

/** 검색한 말을 맨 앞으로 올린다. 같은 말을 두 번 남기지 않고 다섯 개를 넘기지 않는다 */
export function pushRecent(keywords: string[], keyword: string) {
  return [keyword, ...keywords.filter((item) => item !== keyword)].slice(0, MAX_RECENT);
}

/** 테스트가 서로 물들지 않게 비운다 */
export function resetRecentCache() {
  cache = null;
}
