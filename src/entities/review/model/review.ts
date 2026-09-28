// 화면이 다루는 리뷰의 모양. api가 응답을 이리로 옮기고, ui와 lib이 이것을 그린다.
//
// **세그먼트 사이를 한쪽으로만 흐르게 하려고 여기에 둔다.** 전에는 `ui`가 카드 타입을 갖고
// `api`가 그것을 가져다 쓰면서 둘이 서로를 참조했다. 타입이 model에 있으면
// `api` · `ui` · `lib`이 모두 model만 보면 된다.

/**
 * 리뷰를 쓸 당시의 아이. 목록·상세 응답이 같은 모양으로 준다.
 *
 * 품종명 조회는 인증 정책이 정해지기 전까지 연결하지 않고 `breedId`만 보존한다.
 */
export type ReviewPet = {
  id: string;
  name: string;
  /** 세 */
  age: number;
  species: "DOG" | "CAT";
  /** 고양이는 체구가 없다 */
  breedSize: "SMALL" | "MEDIUM" | "LARGE" | null;
  /** 품종 id. 이름은 `GET /pets/breeds`가 들고 있다 */
  breedId: number;
  /** kg */
  weight: number;
};

/** 카드 한 장이 그리는 후기 */
export type Review = {
  id: string;
  /** 닉네임 조회가 비면 빈 문자열로 온다. 그때는 이름 줄을 그리지 않는다 */
  nickname: string;
  /** 함께 먹인 아이들. 한 마리 이상 */
  pets: ReviewPet[];
  /** 0~5. 0.5 단위 */
  rating: number;
  /** "2026. 08. 31" */
  date: string;
  /** 첨부 사진 주소 */
  images: string[];
  /** "사용 3주째" */
  tags: string[];
  content: string;
  /** 도움돼요 수 */
  likeCount: number;
  /** 지금 보는 사람이 이미 눌렀는가. 비로그인이면 `false` */
  liked: boolean;
};
