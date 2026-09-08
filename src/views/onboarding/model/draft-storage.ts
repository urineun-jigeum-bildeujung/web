// 온보딩에서 쓰던 프로필 초안을 기기에 남긴다.
//
// 단계는 URL에 있는데 입력값이 컴포넌트 상태여서, 새로고침하면 단계만 남고
// 이름·품종·종이 통째로 초기값으로 돌아갔다. `?step=health`로 새로고침하면
// 고양이 보호자가 강아지 질환 갈래를 만나는 식이다.
//
// 유즈케이스 시트(회원가입|프로필 등록)가 "입력 중이던 정보를 저장하고 이어서
// 진행한다"를 우선순위 높음으로 적고 있다. 서버에 남기는 것은 프로필 등록 API가
// 정해져야 하므로, 그때까지 기기에 둔다.
//
// 저장소는 React 밖의 것이라 `useSyncExternalStore`로 잇는다. 효과 안에서
// setState로 되읽으면 React Compiler가 연쇄 렌더로 잡는다.

import { EMPTY_PROFILE_DRAFT, PET_SPECIES, type PetProfileDraft } from "@/entities/pet";

const KEY = "onboarding-draft";

/** 사진은 `File`이라 직렬화되지 않는다. 기기에는 나머지만 남긴다 */
type StoredDraft = Omit<PetProfileDraft, "photo">;

let cache: PetProfileDraft | null = null;
const listeners = new Set<() => void>();

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/**
 * 저장된 값을 한 칸씩 확인해 옮긴다.
 *
 * 통째로 펼치면 손으로 고친 값이나 옛 형식이 그대로 들어와, 나중에 화면이
 * 엉뚱한 곳에서 깨진다. 모양이 맞지 않는 칸은 버리고 기본값을 쓴다.
 */
function normalize(raw: unknown): PetProfileDraft {
  if (typeof raw !== "object" || raw === null) return EMPTY_PROFILE_DRAFT;
  const saved = raw as Partial<Record<keyof StoredDraft, unknown>>;

  const text = (key: keyof StoredDraft) =>
    typeof saved[key] === "string" ? (saved[key] as string) : "";

  return {
    photo: null,
    name: text("name"),
    gender: text("gender"),
    neutered: text("neutered"),
    species: PET_SPECIES.find((item) => item === saved.species) ?? EMPTY_PROFILE_DRAFT.species,
    breed: text("breed"),
    age: text("age"),
    birthday: text("birthday"),
    size: text("size"),
    weight: text("weight"),
    bodyTypeIndex:
      typeof saved.bodyTypeIndex === "number"
        ? saved.bodyTypeIndex
        : EMPTY_PROFILE_DRAFT.bodyTypeIndex,
    concern: isStringArray(saved.concern) ? saved.concern : [],
    noConcern: saved.noConcern === true,
    allergy: isStringArray(saved.allergy) ? saved.allergy : [],
    noAllergy: saved.noAllergy === true,
  };
}

function load(): PetProfileDraft {
  try {
    const saved = window.localStorage.getItem(KEY);
    return saved ? normalize(JSON.parse(saved)) : EMPTY_PROFILE_DRAFT;
  } catch {
    // 저장을 막아 둔 브라우저이거나 값이 깨졌다. 온보딩을 막을 이유는 없다
    return EMPTY_PROFILE_DRAFT;
  }
}

export function subscribeDraft(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 읽을 때마다 새 객체를 만들면 useSyncExternalStore가 무한히 다시 그린다 */
export function getDraft(): PetProfileDraft {
  cache ??= load();
  return cache;
}

/** 프리렌더에는 저장소가 없다. 빈 초안으로 그려 두고 붙은 뒤 저장된 것으로 바꾼다 */
export function getDraftOnServer(): PetProfileDraft {
  return EMPTY_PROFILE_DRAFT;
}

export function setDraft(next: PetProfileDraft) {
  cache = next;

  try {
    // 사진은 새로고침하면 사라진다. 다시 고르는 것이 한 번의 탭이라 그대로 둔다
    const json = JSON.stringify(next, (key, value) => (key === "photo" ? undefined : value));
    window.localStorage.setItem(KEY, json);
  } catch {
    // 저장을 막아 뒀으면 화면 안에서만 유지된다
  }

  listeners.forEach((listener) => listener());
}

/** 등록을 마쳤으면 지운다. 남겨 두면 다음에 들어올 때 남의 값이 채워져 보인다 */
export function clearDraft() {
  cache = EMPTY_PROFILE_DRAFT;

  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // 지우지 못해도 화면은 빈 초안으로 시작한다
  }

  listeners.forEach((listener) => listener());
}

/** 테스트가 서로 물들지 않게 비운다 */
export function resetDraftCache() {
  cache = null;
}
