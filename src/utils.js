"use strict";

// 랜덤한 좌표값의 범위를 -20 ~ 20으로 잡아준 이유는
// Plane(지도)의 사이즈가 40 * 40 이기 때문에
// 그 안에 들어오려면 -20 ~ 20 사이의 좌표값이 필요하다고 생각했습니다.
const MIN_POS = -20;
const MAX_POS = 20;

// 마커들의 x, z 좌표값을 랜덤하게 리턴해주는 함수
function randomPos() {
  let pos = [];

  for (let i = 0; i < 2; i++) {
    // Type 2 문제 요구사항의 이미지 예제들에서
    // 마커들이 바둑판식으로 배치되어 있는 것으로 미루어 보아,
    // 마커들의 좌표값도 Math.floor() 를 이용하여 가급적 정수값으로만 리턴해야겠다고 생각했습니다.
    const coord = Math.floor(Math.random() * (MAX_POS - MIN_POS + 1)) + MIN_POS;
    pos.push(coord);
  }

  return pos;
}

export default randomPos;
