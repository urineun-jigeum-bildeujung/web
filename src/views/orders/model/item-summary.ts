// 링크 이름에 붙일 상품 요약. 건마다 같은 "자세히 보기"·"주문 상세"만 있으면 화면 낭독기로 링크만
// 훑을 때 어느 건인지 가를 수 없다(#474).

/** 첫 상품 이름과 나머지 수. 상품이 없으면 빈 문자열이다 */
export function summarizeItems(items: { productName: string }[]): string {
  const [first, ...rest] = items;
  if (!first) {
    return "";
  }
  return rest.length > 0 ? `${first.productName} 외 ${rest.length}건` : first.productName;
}
