// 사진이 없는 아이 원에 넣을 글자. 시안의 아이 원(avator `state=default`)이 이름 앞 두 글자를 넣는다.

/**
 * 눈에 보이는 글자 단위로 자른다. 코드 포인트로 자르면 피부색이 붙거나 ZWJ로 이은 이모지가
 * 반으로 잘려 깨진 글자가 원에 남는다(#470 리뷰). 지원하지 않는 환경에서는 코드 포인트로 자른다.
 */
const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("ko", { granularity: "grapheme" })
    : null;

/**
 * 이름 앞 두 글자를 돌려준다. 앞뒤 공백은 뗀다.
 *
 * 시안은 36px 이하 원에 한 글자만 넣지만 지금 그 크기의 아이 원이 없어 두 글자만 다룬다.
 */
export function petInitials(name: string): string {
  const trimmed = name.trim();
  const letters = segmenter
    ? Array.from(segmenter.segment(trimmed), ({ segment }) => segment)
    : Array.from(trimmed);
  return letters.slice(0, 2).join("");
}
