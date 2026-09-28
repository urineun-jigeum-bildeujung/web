// 식별자로 아바타 배경색을 고른다. 같은 식별자는 어느 화면에서나 같은 색이 된다.
//
// 디자인이 준 공식은 HSB의 H만 0~360에서 뽑고 S는 30, B는 100으로 고정하는 것이다.
// HSL로 옮기면 명도가 100 × (1 − 0.30 ÷ 2) = 85%, 채도가 100%다.
//
// **색을 매번 새로 뽑지 않는다.** 그러면 같은 대상이 새로고침마다, 그리고 화면마다 다른
// 색이 된다. 공식이 정한 것은 H의 범위라, 그 안에서 대상마다 고정해도 공식을 지킨다.

/** 이 값 위의 글자색은 짙은 색이어야 한다. 배경이 테마와 무관하게 밝다 */
const SATURATION = "100%";
const LIGHTNESS = "85%";

const HUE_COUNT = 360;

/**
 * 식별자를 0~359의 H로 접는다.
 *
 * **황금각(137°)만큼 띄우는 것이 핵심이다.** 서버가 주는 id는 `"1"` · `"2"`처럼 이어지는
 * 숫자라, 그냥 접으면 인접한 두 대상의 H가 1°만 달라 같은 색으로 보인다. 137은 360과
 * 서로소여서 한 바퀴를 골고루 채우고, 이어지는 id끼리 137°씩 벌어진다.
 */
function toHue(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 1000003;
  }
  return (hash * 137) % HUE_COUNT;
}

/** `background`에 그대로 넣을 수 있는 CSS 색 */
export function avatarColor(id: string): string {
  return `hsl(${toHue(id)}, ${SATURATION}, ${LIGHTNESS})`;
}
