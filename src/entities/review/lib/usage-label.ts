// 후기의 사용 기간을 시안 문구로 옮긴다.
//
// 두 리뷰 화면이 같은 배지 문구를 공유한다. 뷰끼리는 서로 가져다 쓸 수 없어 여기에 둔다.

/** 시안의 "사용 3주째". 서버는 일 수를 주므로 일주일이 안 되면 날로, 되면 주로 말한다 */
export function toUsageLabel(days: number): string {
  return days < 7 ? `사용 ${days}일째` : `사용 ${Math.floor(days / 7)}주째`;
}
