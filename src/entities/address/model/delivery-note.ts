// 배송 요청사항 보기 목록. 결제 화면과 배송지 등록·수정이 같은 목록을 쓴다 (QA No.174, #526).
//
// 시안(paym_001_드롭다운 1586:24254) 순서 그대로다. 마지막 하나만 성격이 달라 값으로 가른다.
// 첫 보기가 결제 화면의 기본값이라 목록에서만 "[기본]"을 붙인다 (#441).

/** 이것을 고르면 아래에 직접 적는 칸이 열린다 */
export const DELIVERY_NOTE_DIRECT = "직접 입력";

export const DELIVERY_NOTE_OPTIONS: readonly string[] = [
  "문 앞에 놓아주세요",
  "경비실에 맡겨주세요",
  "부재 시 전화 부탁드려요",
  "배송 전 미리 연락 주세요",
  "직접 받을게요",
  DELIVERY_NOTE_DIRECT,
];

/** 직접 적는 칸의 길이 제한. 서버 `@Size(max = 100)`이고 시안이 `0/100자`로 세어 보인다 */
export const DELIVERY_NOTE_MAX = 100;

/**
 * 직접 적은 글인지. 보기 문구와 똑같지 않으면 직접 적은 것이다.
 *
 * **"직접 입력"이라는 글자 자체도 직접 적은 것이다.** 보기로 읽으면 상자에 "직접 입력"이 뜨는데
 * 적는 칸은 닫혀, 적어 둔 글이 어디에도 보이지 않는다.
 */
export function isDirectDeliveryNote(note: string): boolean {
  return note !== "" && (note === DELIVERY_NOTE_DIRECT || !DELIVERY_NOTE_OPTIONS.includes(note));
}
