// 리뷰 상세의 짧은 문구들. 시안(943-15495)의 칩과 날짜 꼴을 서버 값에서 만든다.
//
// 사용 기간 문구와 아이 줄은 리뷰 탭과 공유해 `entities/review`에 있다.

/** 시안의 "2026. 08. 31". 서버가 주는 `YYYY-MM-DD`를 점과 공백으로 잇는다. 읽을 수 없으면 비운다 */
export function toReviewDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  return match ? `${match[1]}. ${match[2]}. ${match[3]}` : "";
}
