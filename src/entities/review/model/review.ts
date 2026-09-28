// 화면이 다루는 리뷰의 모양. api가 응답을 이리로 옮기고, ui와 lib이 이것을 그린다.
//
// **세그먼트 사이를 한쪽으로만 흐르게 하려고 여기에 둔다.** 전에는 `ui`가 카드 타입을 갖고
// `api`가 그것을 가져다 쓰면서 둘이 서로를 참조했다. 타입이 model에 있으면
// `api` · `ui` · `lib`이 모두 model만 보면 된다.

/**
 * 리뷰를 쓸 당시의 아이. 목록·상세 응답이 같은 모양으로 준다.
 *
 * **품종명과 몸무게는 아직 응답에 없다.** 체구(`breedSize`)만 와서 카드가 `소형견 · 8세`까지
 * 그린다(`lib/pet-label`). 완성된 문자열이 아니라 구조로 들고 있어, 두 값이 들어오면
 * 매퍼와 그 함수만 넓히면 된다.
 */
export type ReviewPet = {
  id: string;
  name: string;
  /** 세 */
  age: number;
  species: "DOG" | "CAT";
  /** 고양이는 체구가 없다 */
  breedSize: "SMALL" | "MEDIUM" | "LARGE" | null;
};

/** 카드 한 장이 그리는 후기 */
export type Review = {
  id: string;
  /**
   * 목록 응답에는 오지만 **공개 리뷰 상세에는 아직 없다**(사진 뷰어가 그쪽을 쓴다).
   * 없으면 이름 줄을 그리지 않는다 — 임의의 이름을 넣으면 남의 글에 다른 이름표가 붙는다.
   */
  nickname?: string;
  /** 함께 먹인 아이들. 한 마리 이상 */
  pets: ReviewPet[];
  /** 0~5. 0.5 단위 */
  rating: number;
  /** "2026. 08. 31" */
  date: string;
  /** 첨부 사진 주소 */
  images: string[];
  /** "사용 3주차" */
  tags: string[];
  content: string;
  /** 닉네임과 같은 사정이다. 없으면 도움돼요 줄을 그리지 않는다 — `0`은 "아무도 안 눌렀다"는 다른 사실이다 */
  likeCount?: number;
};
