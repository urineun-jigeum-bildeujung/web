// 새 아이를 들이는 규칙. 몇 마리까지 들일 수 있는지와 들이러 가는 주소를 한 곳에 둔다.
//
// 추가 자리(메인·마이페이지·아이 관리의 점선 원)와 온보딩이 함께 본다. 각자 두면 한 곳만 고쳐진다.

/**
 * 한 보호자가 등록할 수 있는 아이 수.
 *
 * **근거는 QA 시트 기대 결과(No.130)다.** 백엔드 등록(`POST /members/me/pets`)에는 개수
 * 검사가 없어 화면이 막는 것이 전부다(#527).
 */
export const MAX_PETS = 5;

/**
 * 아이를 더 들일 수 있는지.
 *
 * **목록을 아직 모르면(받는 중·실패) 막지 않는다.** 받는 동안 지우면 추가 자리가 없다가 생기고,
 * 실패했을 때 지우면 할 일을 알리던 자리까지 사라진다.
 */
export function canAddPet(pets: readonly unknown[] | undefined): boolean {
  return (pets?.length ?? 0) < MAX_PETS;
}

/**
 * 아이 추가로 들어오는 화면. 온보딩 첫 입력 단계의 "이전"이 이리로 돌아간다(QA No.254).
 *
 * 주소창에 실려 오는 값이라 보기를 정해 둔다. 아무 경로나 받으면 `?from=https://…`로 바깥에
 * 내보낼 수 있다.
 */
export const ADD_PET_ORIGINS = ["/", "/mypage", "/mypage/pets"] as const;
export type AddPetOrigin = (typeof ADD_PET_ORIGINS)[number];

/** 새 아이를 들이러 가는 주소. 온보딩 기본 정보 단계(#189)로 가며 돌아올 곳을 싣는다 */
export function toAddPetHref(from: AddPetOrigin): string {
  return `/onboarding?step=basic&from=${from}`;
}
