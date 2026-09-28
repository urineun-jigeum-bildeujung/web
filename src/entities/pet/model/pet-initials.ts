// 사진이 없는 아이 원에 넣을 글자. 시안의 아이 원(avator `state=default`)이 이름 앞 두 글자를 넣는다.

/**
 * 이름 앞 두 글자를 돌려준다. 앞뒤 공백은 떼고, 이모지처럼 두 칸을 차지하는 글자도 한 글자로 센다.
 *
 * 시안은 36px 이하 원에 한 글자만 넣지만 지금 그 크기의 아이 원이 없어 두 글자만 다룬다.
 */
export function petInitials(name: string): string {
  return Array.from(name.trim()).slice(0, 2).join("");
}
